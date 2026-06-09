-- Mahalli — database security & business-logic tests.
--
-- Run against a LOCAL Supabase (never production):
--   supabase start
--   psql "postgresql://postgres:postgres@localhost:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/platform.test.sql
--
-- Each section runs in its own transaction and ROLLBACKs, so no data persists.
-- A failed assertion RAISEs, which (with ON_ERROR_STOP) makes psql exit non-zero.
\set ON_ERROR_STOP on

-- ===========================================================================
-- 1) RLS cross-tenant isolation
-- ===========================================================================
begin;
do $$
declare
  v_u1 uuid := '11111111-1111-1111-1111-111111111111';
  v_u2 uuid := '22222222-2222-2222-2222-222222222222';
  v_s1 uuid; v_s2 uuid; v_p2 uuid; v_cnt int; v_upd int;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u1,'authenticated','authenticated','u1@t.local',now(),now()),
         ('00000000-0000-0000-0000-000000000000', v_u2,'authenticated','authenticated','u2@t.local',now(),now());

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  v_s1 := (public.create_shop('Shop One','shopone')).id;
  insert into public.products (seller_id,name,price,stock) values (v_s1,'A',100,5);
  reset role;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u2::text,'role','authenticated')::text, true);
  v_s2 := (public.create_shop('Shop Two','shoptwo')).id;
  insert into public.products (seller_id,name,price,stock) values (v_s2,'B',50,3) returning id into v_p2;
  reset role;

  -- act as u1
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  select count(*) into v_cnt from public.products;
  if v_cnt <> 1 then raise exception 'FAIL rls: u1 sees % products (want 1)', v_cnt; end if;
  select count(*) into v_cnt from public.products where id = v_p2;
  if v_cnt <> 0 then raise exception 'FAIL rls: u1 can READ u2 product'; end if;
  with upd as (update public.products set name='hacked' where id=v_p2 returning 1) select count(*) into v_upd from upd;
  if v_upd <> 0 then raise exception 'FAIL rls: u1 can WRITE u2 product'; end if;
  reset role;
end $$;
rollback;

-- ===========================================================================
-- 2) create_shop: atomic seller+owner profile, reserved/taken slug
-- ===========================================================================
begin;
do $$
declare
  v_u uuid := '11111111-1111-1111-1111-111111111111';
  v_s uuid; v_cnt int; v_blocked boolean;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u,'authenticated','authenticated','u@t.local',now(),now());
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u::text,'role','authenticated')::text, true);

  v_s := (public.create_shop('Shop','my-shop')).id;
  select count(*) into v_cnt from public.profiles where seller_id=v_s and user_id=v_u and role='owner';
  if v_cnt <> 1 then raise exception 'FAIL create_shop: owner profile not created'; end if;

  -- second shop for same user -> rejected
  v_blocked := false;
  begin perform public.create_shop('Two','two'); exception when others then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL create_shop: allowed a second shop per user'; end if;
  reset role;
end $$;
rollback;

begin;
do $$
declare v_u uuid := '11111111-1111-1111-1111-111111111111'; v_blocked boolean;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u,'authenticated','authenticated','u@t.local',now(),now());
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u::text,'role','authenticated')::text, true);
  -- reserved slug rejected
  v_blocked := false;
  begin perform public.create_shop('X','dashboard'); exception when others then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL create_shop: reserved slug accepted'; end if;
  reset role;
end $$;
rollback;

-- ===========================================================================
-- 3) save_product ownership + variant replacement
-- ===========================================================================
begin;
do $$
declare
  v_u1 uuid := '11111111-1111-1111-1111-111111111111';
  v_u2 uuid := '22222222-2222-2222-2222-222222222222';
  v_s1 uuid; v_s2 uuid; v_prod uuid; v_cnt int; v_blocked boolean;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u1,'authenticated','authenticated','u1@t.local',now(),now()),
         ('00000000-0000-0000-0000-000000000000', v_u2,'authenticated','authenticated','u2@t.local',now(),now());

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  v_s1 := (public.create_shop('S1','shop-1')).id;
  v_prod := public.save_product(null, v_s1, 'P','d', 100, 'c', null, 10, true,
    '[{"label":"A","price_override":null,"stock":2},{"label":"B","price_override":120,"stock":3}]'::jsonb);
  select count(*) into v_cnt from public.product_variants where product_id=v_prod;
  if v_cnt <> 2 then raise exception 'FAIL save_product: variants on create=%', v_cnt; end if;
  perform public.save_product(v_prod, v_s1, 'P2', null, 110, null, null, 8, true, '[{"label":"C","price_override":null,"stock":1}]'::jsonb);
  select count(*) into v_cnt from public.product_variants where product_id=v_prod;
  if v_cnt <> 1 then raise exception 'FAIL save_product: variant replace=%', v_cnt; end if;
  reset role;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u2::text,'role','authenticated')::text, true);
  v_s2 := (public.create_shop('S2','shop-2')).id;
  v_blocked := false;
  begin perform public.save_product(v_prod, v_s2, 'H', null, 1, null, null, 0, true, '[]'::jsonb);
  exception when others then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL save_product: u2 hijacked u1 product'; end if;
  v_blocked := false;
  begin perform public.save_product(null, v_s1, 'H', null, 1, null, null, 0, true, '[]'::jsonb);
  exception when sqlstate '42501' then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL save_product: u2 wrote into u1 shop'; end if;
  reset role;
end $$;
rollback;

-- ===========================================================================
-- 4) Storefront read + place_order + order pipeline + customer book
-- ===========================================================================
begin;
do $$
declare
  v_u uuid := '11111111-1111-1111-1111-111111111111';
  v_s uuid; v_p1 uuid; v_p2 uuid; v_pv uuid; v_o uuid; v_o2 uuid;
  v_json jsonb; v_cnt int; v_num numeric; v_cid uuid; v_blocked boolean;
  v_phone text := '0911234567';
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u,'authenticated','authenticated','u@t.local',now(),now());

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u::text,'role','authenticated')::text, true);
  v_s := (public.create_shop('Bakery','bakery','Tripoli')).id;
  update public.sellers set theme='noir', delivery_areas='[{"area":"Tripoli","fee":10}]'::jsonb where id=v_s;
  v_p1 := public.save_product(null, v_s, 'Cake','', 95, 'Cakes', null, 10, true,
    '[{"label":"6","price_override":null,"stock":4},{"label":"10","price_override":140,"stock":6}]'::jsonb);
  v_p2 := public.save_product(null, v_s, 'Cupcake','', 40, 'Cupcakes', null, 2, true, '[]'::jsonb);
  perform public.save_product(null, v_s, 'Hidden','', 10, 'x', null, 5, false, '[]'::jsonb);
  select id into v_pv from public.product_variants where product_id=v_p1 and label='10';
  reset role;

  -- storefront (anon)
  set local role anon;
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  v_json := public.get_storefront('bakery');
  if v_json->'shop'->>'theme' <> 'noir' then raise exception 'FAIL storefront theme'; end if;
  if jsonb_array_length(v_json->'products') <> 2 then raise exception 'FAIL storefront active-only=%', jsonb_array_length(v_json->'products'); end if;

  -- honeypot blocks
  v_blocked := false;
  begin perform public.place_order('bakery','Bot',v_phone,'Tripoli', jsonb_build_array(jsonb_build_object('product_id',v_p2,'qty',1)), 'spam');
  exception when sqlstate 'P0009' then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL honeypot'; end if;

  -- valid order: 2×140 + 40 + 10 = 330
  v_o := public.place_order('bakery','Sara',v_phone,'Tripoli',
    jsonb_build_array(jsonb_build_object('product_id',v_p1,'variant_id',v_pv,'qty',2),
                      jsonb_build_object('product_id',v_p2,'qty',1)), '');

  -- rate limit: same phone again within 30s
  v_blocked := false;
  begin perform public.place_order('bakery','Sara',v_phone,'Tripoli', jsonb_build_array(jsonb_build_object('product_id',v_p2,'qty',1)), '');
  exception when sqlstate 'P0013' then v_blocked := true; end;
  if not v_blocked then raise exception 'FAIL rate limit'; end if;
  reset role;

  -- inspect as seller
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u::text,'role','authenticated')::text, true);
  select total, customer_id into v_num, v_cid from public.orders where id=v_o;
  if v_num <> 330 then raise exception 'FAIL order total=%', v_num; end if;
  if v_cid is null then raise exception 'FAIL customer not linked'; end if;
  select order_count, total_spent into v_cnt, v_num from public.customers where id=v_cid;
  if v_cnt <> 1 or v_num <> 0 then raise exception 'FAIL customer new cnt=% spent=%', v_cnt, v_num; end if;

  -- pipeline: confirm decrements stock
  perform public.set_order_status(v_o,'confirmed');
  select stock into v_cnt from public.product_variants where id=v_pv;
  if v_cnt <> 4 then raise exception 'FAIL confirm variant stock=%', v_cnt; end if;
  select stock into v_cnt from public.products where id=v_p2;
  if v_cnt <> 1 then raise exception 'FAIL confirm product stock=%', v_cnt; end if;

  -- deliver: revenue + customer spend
  perform public.set_order_status(v_o,'delivered');
  select total_spent into v_num from public.customers where id=v_cid;
  if v_num <> 330 then raise exception 'FAIL customer spent after deliver=%', v_num; end if;

  -- cancel restores stock (re-confirm first so it's committed, then cancel)
  perform public.set_order_status(v_o,'cancelled');
  select stock into v_cnt from public.product_variants where id=v_pv;
  if v_cnt <> 6 then raise exception 'FAIL cancel restore variant=%', v_cnt; end if;

  -- manual order merges into same customer by phone
  v_o2 := public.create_manual_order(v_s,'Sara',v_phone,'Tripoli','note',0, jsonb_build_array(jsonb_build_object('product_id',v_p2,'qty',1)));
  select customer_id into v_cid from public.orders where id=v_o2;
  select order_count into v_cnt from public.customers where id=v_cid;  -- cancelled excluded; manual 'new' counts = 1
  if v_cnt <> 1 then raise exception 'FAIL manual merge order_count=%', v_cnt; end if;
  reset role;
end $$;
rollback;

-- ===========================================================================
-- Async backbone (Phase 2 · F1): outbox enqueue/dedupe/dequeue/complete + RLS,
-- webhook_events idempotency + RLS.
-- ===========================================================================
begin;
do $$
declare
  v_u1 uuid := '11111111-1111-1111-1111-111111111111';
  v_u2 uuid := '22222222-2222-2222-2222-222222222222';
  v_s1 uuid; v_s2 uuid;
  v_id1 uuid; v_id2 uuid; v_cnt int; v_status text; v_next timestamptz;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u1,'authenticated','authenticated','o1@t.local',now(),now()),
         ('00000000-0000-0000-0000-000000000000', v_u2,'authenticated','authenticated','o2@t.local',now(),now());

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  v_s1 := (public.create_shop('Outbox One','outbox-one')).id;
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u2::text,'role','authenticated')::text, true);
  v_s2 := (public.create_shop('Outbox Two','outbox-two')).id;
  reset role;

  -- enqueue + dedupe (service-role / superuser context)
  v_id1 := public.enqueue_message(v_s1,'noop','{"x":1}'::jsonb,'dk-1');
  if v_id1 is null then raise exception 'FAIL enqueue returned null'; end if;
  v_id2 := public.enqueue_message(v_s1,'noop','{"x":2}'::jsonb,'dk-1');  -- same dedupe key
  if v_id2 is not null then raise exception 'FAIL dedupe: second enqueue inserted'; end if;
  -- null dedupe never collides
  perform public.enqueue_message(v_s1,'noop','{}'::jsonb,null);
  perform public.enqueue_message(v_s1,'noop','{}'::jsonb,null);
  select count(*) into v_cnt from public.message_outbox where seller_id=v_s1;
  if v_cnt <> 3 then raise exception 'FAIL outbox count=%', v_cnt; end if;

  -- dequeue claims due rows and flips them to processing (batched)
  perform public.dequeue_messages(2);
  select count(*) into v_cnt from public.message_outbox where seller_id=v_s1 and status='processing';
  if v_cnt <> 2 then raise exception 'FAIL dequeue processing=%', v_cnt; end if;
  perform public.dequeue_messages(10);  -- claims the remaining pending one, not the claimed ones
  select count(*) into v_cnt from public.message_outbox where seller_id=v_s1 and status='pending';
  if v_cnt <> 0 then raise exception 'FAIL pending after dequeue=%', v_cnt; end if;

  -- complete: success -> sent
  perform public.complete_message(v_id1,true,null,null);
  select status into v_status from public.message_outbox where id=v_id1;
  if v_status <> 'sent' then raise exception 'FAIL complete sent=%', v_status; end if;
  -- complete: failure with retry -> pending + advanced next_attempt_at
  perform public.complete_message(v_id1,false,'boom', now() + interval '5 minutes');
  select status, next_attempt_at into v_status, v_next from public.message_outbox where id=v_id1;
  if v_status <> 'pending' then raise exception 'FAIL retry status=%', v_status; end if;
  if v_next <= now() then raise exception 'FAIL retry next_attempt_at not advanced'; end if;
  -- complete: failure with no next -> failed
  perform public.complete_message(v_id1,false,'giving up',null);
  select status into v_status from public.message_outbox where id=v_id1;
  if v_status <> 'failed' then raise exception 'FAIL final status=%', v_status; end if;

  -- RLS: seller sees only their own outbox rows; cannot INSERT directly
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  select count(*) into v_cnt from public.message_outbox;  -- only v_s1's rows
  if v_cnt <> 3 then raise exception 'FAIL outbox RLS select=%', v_cnt; end if;
  begin
    insert into public.message_outbox (seller_id, kind) values (v_s1,'noop');
    raise exception 'FAIL outbox RLS allowed direct insert';
  exception when insufficient_privilege then null;  -- RLS denies (no insert policy)
  end;
  reset role;

  -- webhook_events: idempotent (source, external_id) + RLS denies authenticated
  insert into public.webhook_events (source, external_id) values ('whatsapp','evt-1');
  begin
    insert into public.webhook_events (source, external_id) values ('whatsapp','evt-1');
    raise exception 'FAIL webhook_events duplicate inserted';
  exception when unique_violation then null;
  end;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  select count(*) into v_cnt from public.webhook_events;
  if v_cnt <> 0 then raise exception 'FAIL webhook_events RLS leak=%', v_cnt; end if;
  reset role;
end $$;
rollback;

-- ===========================================================================
-- Notifications (Phase 2 · P1a): orders_notify enqueues notify jobs (gated by
-- notify_prefs, deduped per event) + message_log RLS.
-- ===========================================================================
begin;
do $$
declare
  v_u1 uuid := '11111111-1111-1111-1111-111111111111';
  v_u2 uuid := '22222222-2222-2222-2222-222222222222';
  v_s1 uuid; v_s2 uuid; v_p uuid; v_o uuid; v_o2 uuid; v_cnt int;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_u1,'authenticated','authenticated','n1@t.local',now(),now()),
         ('00000000-0000-0000-0000-000000000000', v_u2,'authenticated','authenticated','n2@t.local',now(),now());

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  v_s1 := (public.create_shop('Notify One','notify-one')).id;
  insert into public.products (seller_id,name,price,stock) values (v_s1,'Cake',100,5) returning id into v_p;
  -- manual order fires orders_notify (INSERT -> order_placed)
  v_o := public.create_manual_order(v_s1,'Sara','0911','Tripoli','',0, jsonb_build_array(jsonb_build_object('product_id',v_p,'qty',1)));
  reset role;

  select count(*) into v_cnt from public.message_outbox
   where seller_id=v_s1 and kind='notify' and dedupe_key = 'notify:'||v_o::text||':order_placed';
  if v_cnt <> 1 then raise exception 'FAIL notify order_placed enqueued=%', v_cnt; end if;

  -- status change to confirmed enqueues order_confirmed
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u1::text,'role','authenticated')::text, true);
  perform public.set_order_status(v_o,'confirmed');
  -- pref gating: turn order_placed off; a new order must not enqueue order_placed
  update public.sellers set notify_prefs = jsonb_set(notify_prefs,'{order_placed}','false'::jsonb) where id=v_s1;
  v_o2 := public.create_manual_order(v_s1,'Ali','0922','Tripoli','',0, jsonb_build_array(jsonb_build_object('product_id',v_p,'qty',1)));
  reset role;

  select count(*) into v_cnt from public.message_outbox
   where seller_id=v_s1 and kind='notify' and dedupe_key = 'notify:'||v_o::text||':order_confirmed';
  if v_cnt <> 1 then raise exception 'FAIL notify order_confirmed enqueued=%', v_cnt; end if;
  select count(*) into v_cnt from public.message_outbox
   where seller_id=v_s1 and kind='notify' and dedupe_key = 'notify:'||v_o2::text||':order_placed';
  if v_cnt <> 0 then raise exception 'FAIL pref off still enqueued=%', v_cnt; end if;

  -- message_log: seed one for s1 (service-role), then RLS blocks cross-tenant read + client insert
  insert into public.message_log (seller_id, channel, template, body, status)
    values (v_s1,'wa_link','order_placed','hi','skipped');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',v_u2::text,'role','authenticated')::text, true);
  v_s2 := (public.create_shop('Notify Two','notify-two')).id;
  select count(*) into v_cnt from public.message_log;  -- s2 sees none of s1's rows
  if v_cnt <> 0 then raise exception 'FAIL message_log RLS leak=%', v_cnt; end if;
  begin
    insert into public.message_log (seller_id, channel, template, body) values (v_s2,'wa_link','x','y');
    raise exception 'FAIL message_log allowed client insert';
  exception when insufficient_privilege then null;
  end;
  reset role;
end $$;
rollback;

\echo 'platform.test.sql: all sections passed'
