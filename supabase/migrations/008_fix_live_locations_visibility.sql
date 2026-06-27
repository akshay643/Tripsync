-- Ensure group members can see each other's active shared locations.
-- Run this in Supabase SQL Editor if another member only sees their own marker.

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists "locations_select" on public.locations;
drop policy if exists "locations_insert" on public.locations;
drop policy if exists "locations_update" on public.locations;
drop policy if exists "locations_delete" on public.locations;

create policy "locations_select" on public.locations
for select using (
  user_id = auth.uid()
  or (
    sharing_enabled = true
    and (sharing_until is null or sharing_until > now())
    and public.is_trip_member(trip_id)
  )
);

create policy "locations_insert" on public.locations
for insert with check (
  user_id = auth.uid()
  and public.is_trip_member(trip_id)
);

create policy "locations_update" on public.locations
for update using (
  user_id = auth.uid()
  and public.is_trip_member(trip_id)
)
with check (
  user_id = auth.uid()
  and public.is_trip_member(trip_id)
);

create policy "locations_delete" on public.locations
for delete using (
  user_id = auth.uid()
  and public.is_trip_member(trip_id)
);

drop policy if exists "trip_members_select" on public.trip_members;
create policy "trip_members_select" on public.trip_members
for select using (public.is_trip_member(trip_id));

do $$
begin
  alter publication supabase_realtime add table public.locations;
exception
  when duplicate_object then null;
end $$;
