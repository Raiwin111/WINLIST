-- WinList × Supabase schema
-- Run this once in Supabase → SQL Editor.
--
-- Security note: the policies below allow the public anon key to read/write.
-- That is intended for a personal, single-owner app. If you add Supabase Auth
-- later, replace them with auth.uid() based policies.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------
create table if not exists public.winlist_tasks (
  id text primary key,
  title text not null,
  notes text,
  due_date text,
  due_time text,
  money_type text not null default 'none'
    check (money_type in ('expense', 'income', 'none')),
  money_amount numeric(12,2) not null default 0,
  money_category text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  money_state text not null default 'none'
    check (money_state in ('none', 'queued', 'sent', 'removing', 'posted', 'missing', 'error')),
  ledger_id bigint,
  posted_at timestamptz,
  sync_error text
);

create index if not exists winlist_tasks_created_idx
  on public.winlist_tasks (created_at desc);
create index if not exists winlist_tasks_completed_idx
  on public.winlist_tasks (completed_at desc);

-- ---------------------------------------------------------------
-- Ledger entries posted by WinList
-- Field names intentionally mirror Money Ledger's transaction shape.
-- ---------------------------------------------------------------
create table if not exists public.winlist_ledger (
  id bigint primary key,
  task_id text,
  type text not null check (type in ('expense', 'income')),
  description text not null,
  category text,
  amount numeric(12,2) not null,
  date timestamptz not null,
  month text not null,
  created_at timestamptz not null default now()
);

create index if not exists winlist_ledger_task_idx
  on public.winlist_ledger (task_id);
create index if not exists winlist_ledger_month_idx
  on public.winlist_ledger (month);

-- ---------------------------------------------------------------
-- Row level security (personal app: anon key has full access)
-- ---------------------------------------------------------------
alter table public.winlist_tasks enable row level security;
alter table public.winlist_ledger enable row level security;

drop policy if exists "winlist_tasks_anon_all" on public.winlist_tasks;
create policy "winlist_tasks_anon_all"
  on public.winlist_tasks
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "winlist_ledger_anon_all" on public.winlist_ledger;
create policy "winlist_ledger_anon_all"
  on public.winlist_ledger
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.winlist_tasks to anon, authenticated;
grant select, insert, update, delete on public.winlist_ledger to anon, authenticated;

-- ---------------------------------------------------------------
-- Realtime for cross-device updates
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'winlist_tasks'
  ) then
    alter publication supabase_realtime add table public.winlist_tasks;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Optional: a view shaped like Money Ledger's localStorage array
-- so another app can read it with a single query.
-- ---------------------------------------------------------------
create or replace view public.winlist_ledger_as_transactions as
select
  id,
  type,
  description,
  category,
  amount,
  date,
  month
from public.winlist_ledger
order by date desc;
