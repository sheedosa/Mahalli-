-- Mahalli — Seller OS
-- Migration 0017: index the message_log -> message_outbox foreign key.
--
-- The performance advisor flagged message_log.outbox_id (added in 0016) as an
-- unindexed foreign key; add the covering index.

create index if not exists message_log_outbox_idx on public.message_log (outbox_id);
