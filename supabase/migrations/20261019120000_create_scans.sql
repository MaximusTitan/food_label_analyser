-- Scan history. Each row belongs to one user; Row Level Security keeps users
-- to their own rows even though the app talks to the database with the
-- public (publishable) key.

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  source text not null check (source in ('photo', 'text', 'example')),
  extraction jsonb not null check (jsonb_typeof(extraction) = 'object' and pg_column_size(extraction) < 200000)
);

create index scans_user_id_created_at_idx on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

create policy "Users can read their own scans"
  on public.scans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own scans"
  on public.scans for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own scans"
  on public.scans for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Scans are immutable: no update policy, and no access for anonymous users.
revoke all on public.scans from anon;
