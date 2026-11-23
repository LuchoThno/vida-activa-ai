-- Run in the Supabase SQL editor before enabling the application.
create table if not exists public.wellness_data (
 user_id uuid primary key references auth.users(id) on delete cascade,
 weights jsonb not null default '[]'::jsonb,
 checks jsonb not null default '[]'::jsonb,
 favorites jsonb not null default '[]'::jsonb,
 exercises_done jsonb not null default '[]'::jsonb,
 extras jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.wellness_data enable row level security;
revoke all on public.wellness_data from anon;
grant select,insert,update,delete on public.wellness_data to authenticated;
drop policy if exists "Users can read own data" on public.wellness_data;
drop policy if exists "Users can insert own data" on public.wellness_data;
drop policy if exists "Users can update own data" on public.wellness_data;
drop policy if exists "Users can delete own data" on public.wellness_data;
create policy "Users can read own data" on public.wellness_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own data" on public.wellness_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own data" on public.wellness_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own data" on public.wellness_data for delete to authenticated using ((select auth.uid()) = user_id);

-- v3 (programa de metas y contador de calorías). Ejecutar si la tabla ya existía:
alter table public.wellness_data add column if not exists extras jsonb not null default '{}'::jsonb;
