-- Enums
create type device_status as enum ('online','offline','maintenance','error');
create type stack_status  as enum ('pending','in_progress','completed','failed');

-- Devices
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  name text not null,
  status device_status not null default 'offline',
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists devices_owner_idx on public.devices (owner_user_id);
create index if not exists devices_deviceid_idx on public.devices (device_id);

-- Task stacks
create table if not exists public.task_stacks (
  id uuid primary key default gen_random_uuid(),
  stack_id text unique not null,
  device_id uuid not null references public.devices(id) on delete cascade,
  status stack_status not null default 'pending',
  tasks jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists task_stacks_device_idx on public.task_stacks (device_id);
create index if not exists task_stacks_status_idx on public.task_stacks (status);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;
drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at before update on public.devices
for each row execute procedure set_updated_at();

-- RLS
alter table public.devices enable row level security;
alter table public.task_stacks enable row level security;

drop policy if exists device_owner_read on public.devices;
drop policy if exists device_owner_write on public.devices;
create policy device_owner_read on public.devices
  for select using (owner_user_id = auth.uid());
create policy device_owner_write on public.devices
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists stack_read_if_device_owned on public.task_stacks;
drop policy if exists stack_write_if_device_owned on public.task_stacks;
create policy stack_read_if_device_owned on public.task_stacks
  for select using (
    exists (select 1 from public.devices d where d.id = task_stacks.device_id and d.owner_user_id = auth.uid())
  );
create policy stack_write_if_device_owned on public.task_stacks
  for all using (
    exists (select 1 from public.devices d where d.id = task_stacks.device_id and d.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.devices d where d.id = task_stacks.device_id and d.owner_user_id = auth.uid())
  );
