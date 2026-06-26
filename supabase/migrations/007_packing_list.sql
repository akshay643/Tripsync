-- Packing list items table
create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  category text not null default 'general',
  packed boolean not null default false,
  packed_by uuid references public.profiles(id) on delete set null,
  packed_at timestamptz,
  quantity int not null default 1,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.packing_items enable row level security;

create policy "packing_items_select" on public.packing_items for select
  using (public.is_trip_member(trip_id));

create policy "packing_items_insert" on public.packing_items for insert
  with check (public.is_trip_member(trip_id) and added_by = auth.uid());

create policy "packing_items_update" on public.packing_items for update
  using (public.is_trip_member(trip_id));

create policy "packing_items_delete" on public.packing_items for delete
  using (public.is_trip_member(trip_id));

-- Realtime
alter publication supabase_realtime add table public.packing_items;
