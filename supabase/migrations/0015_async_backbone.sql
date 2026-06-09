-- Mahalli — Seller OS
-- Migration 0015: async work backbone (Phase 2 · F1)
--
-- A plain-Postgres durable job queue + an idempotent webhook-ingestion table.
-- A Vercel Cron job hits /api/jobs/worker every minute; the worker (service_role)
-- claims due rows with FOR UPDATE SKIP LOCKED, dispatches by `kind`, and marks
-- them sent/failed with exponential backoff. No new extensions — `gen_random_uuid`
-- comes from pgcrypto (already enabled in 0001).
--
-- Security: enqueue/dequeue/complete are SECURITY DEFINER, search_path-pinned, and
-- revoked from public/anon/authenticated — they are internal (triggers + the
-- service-role worker). Sellers may only SELECT their own outbox rows (RLS).

-- ---------------------------------------------------------------------------
-- message_outbox — durable job queue
-- ---------------------------------------------------------------------------
create table message_outbox (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references sellers (id) on delete cascade,
  kind            text not null,
  dedupe_key      text unique,                 -- nulls allowed → undeduped jobs
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts        integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index message_outbox_due_idx on message_outbox (status, next_attempt_at);
create index message_outbox_seller_idx on message_outbox (seller_id, created_at desc);

alter table message_outbox enable row level security;

-- Sellers may read their own jobs (for a future delivery/log UI). No insert/
-- update/delete policies: writes happen only via the RPCs below or service_role.
create policy message_outbox_select on message_outbox for select to authenticated
  using (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- webhook_events — idempotent inbound webhook ledger (used by P1/P4 routes)
-- ---------------------------------------------------------------------------
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,
  external_id  text not null,
  signature_ok boolean not null default false,
  payload      jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (source, external_id)
);

create index webhook_events_source_idx on webhook_events (source, created_at desc);

-- RLS on, no policies: service_role-only (it bypasses RLS); never tenant-exposed.
alter table webhook_events enable row level security;

-- ---------------------------------------------------------------------------
-- enqueue_message — idempotent on dedupe_key. Internal (triggers + service_role).
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_message(
  p_seller uuid,
  p_kind text,
  p_payload jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.message_outbox (seller_id, kind, payload, dedupe_key)
  values (p_seller, p_kind, coalesce(p_payload, '{}'::jsonb), p_dedupe_key)
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return v_id;  -- null when a dedupe_key collision skipped the insert
end;
$$;

-- ---------------------------------------------------------------------------
-- dequeue_messages — atomically claim a batch of due jobs.
-- ---------------------------------------------------------------------------
create or replace function public.dequeue_messages(p_limit integer default 10)
returns setof public.message_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.message_outbox m
     set status = 'processing',
         attempts = m.attempts + 1,
         updated_at = now()
   where m.id in (
     select id from public.message_outbox
      where status = 'pending'
        and next_attempt_at <= now()
      order by next_attempt_at
      for update skip locked
      limit greatest(p_limit, 1)
   )
  returning m.*;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_message — finalize a claimed job (sent / retry / failed).
--   p_ok=true            → sent
--   p_ok=false, p_next   → pending, retried at p_next (worker's backoff)
--   p_ok=false, no p_next→ failed (gave up)
-- ---------------------------------------------------------------------------
create or replace function public.complete_message(
  p_id uuid,
  p_ok boolean,
  p_error text default null,
  p_next timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ok then
    update public.message_outbox
       set status = 'sent', last_error = null, updated_at = now()
     where id = p_id;
  elsif p_next is not null then
    update public.message_outbox
       set status = 'pending', next_attempt_at = p_next,
           last_error = p_error, updated_at = now()
     where id = p_id;
  else
    update public.message_outbox
       set status = 'failed', last_error = p_error, updated_at = now()
     where id = p_id;
  end if;
end;
$$;

-- Internal only: triggers + the service-role worker. Keep them off the public
-- (anon/authenticated) REST RPC surface.
revoke all on function public.enqueue_message(uuid, text, jsonb, text)        from public, anon, authenticated;
revoke all on function public.dequeue_messages(integer)                       from public, anon, authenticated;
revoke all on function public.complete_message(uuid, boolean, text, timestamptz) from public, anon, authenticated;

grant execute on function public.enqueue_message(uuid, text, jsonb, text)        to service_role;
grant execute on function public.dequeue_messages(integer)                       to service_role;
grant execute on function public.complete_message(uuid, boolean, text, timestamptz) to service_role;
