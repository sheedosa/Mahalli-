-- Mahalli — Seller OS
-- Migration 0016: order notifications (Phase 2 · P1a)
--
-- An order lifecycle event (placed / confirmed / out / delivered) enqueues a
-- 'notify' job on the F1 outbox, gated by a per-seller preference. The worker's
-- notify handler renders a localized message and records it in message_log; the
-- actual provider send (WhatsApp Cloud / SMS) activates in P1b when credentials
-- and a seller_connection exist — until then the channel defaults to a wa.me
-- link recorded as 'skipped'.

-- Per-seller notification toggles (sent to buyers in the shop's language).
alter table sellers add column notify_prefs jsonb not null default
  '{"order_placed":true,"order_confirmed":true,"order_out":true,"order_delivered":true}'::jsonb;

-- Deliverability ledger. Written by the service-role worker; sellers may read
-- their own (for a future delivery view). No client writes.
create table message_log (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references sellers (id) on delete cascade,
  channel         text not null,                       -- wa_link | wa_cloud | sms
  to_phone        text,
  template        text not null,
  body            text not null,
  outbox_id       uuid references message_outbox (id) on delete set null,
  provider_msg_id text,
  status          text not null default 'queued'
                    check (status in ('queued','sent','delivered','read','failed','skipped')),
  error           text,
  created_at      timestamptz not null default now()
);

create index message_log_seller_idx on message_log (seller_id, created_at desc);
create index message_log_provider_idx on message_log (provider_msg_id);

alter table message_log enable row level security;

create policy message_log_select on message_log for select to authenticated
  using (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- orders_notify — enqueue a 'notify' job on order placed / status change.
-- SECURITY DEFINER so it can call the internal enqueue_message regardless of who
-- triggered the order write; dedupe_key makes (order, event) exactly-once.
-- ---------------------------------------------------------------------------
create or replace function public.orders_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_prefs jsonb;
begin
  if tg_op = 'INSERT' then
    v_type := 'order_placed';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    v_type := case new.status
      when 'confirmed' then 'order_confirmed'
      when 'out'       then 'order_out'
      when 'delivered' then 'order_delivered'
      else null
    end;
  else
    return new;
  end if;

  if v_type is null then
    return new;
  end if;

  select notify_prefs into v_prefs from public.sellers where id = new.seller_id;
  if not coalesce((v_prefs ->> v_type)::boolean, true) then
    return new;
  end if;

  perform public.enqueue_message(
    new.seller_id,
    'notify',
    jsonb_build_object('type', v_type, 'order_id', new.id),
    'notify:' || new.id::text || ':' || v_type
  );
  return new;
end;
$$;

revoke all on function public.orders_notify() from public, anon, authenticated;

create trigger orders_notify_trg
  after insert or update of status on public.orders
  for each row execute function public.orders_notify();
