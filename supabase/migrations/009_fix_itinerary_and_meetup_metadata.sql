-- Refresh itinerary write policies and meetup point metadata visibility.
-- Run this in Supabase SQL Editor if itinerary activity saves are failing.

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

drop policy if exists "itinerary_days_select" on public.itinerary_days;
drop policy if exists "itinerary_days_insert" on public.itinerary_days;
drop policy if exists "itinerary_days_update" on public.itinerary_days;
drop policy if exists "itinerary_days_delete" on public.itinerary_days;
drop policy if exists "itinerary_days_all" on public.itinerary_days;

create policy "itinerary_days_select" on public.itinerary_days
for select using (public.is_trip_member(trip_id));

create policy "itinerary_days_insert" on public.itinerary_days
for insert with check (public.is_trip_member(trip_id));

create policy "itinerary_days_update" on public.itinerary_days
for update using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id));

create policy "itinerary_days_delete" on public.itinerary_days
for delete using (public.is_trip_member(trip_id));

drop policy if exists "itinerary_items_select" on public.itinerary_items;
drop policy if exists "itinerary_items_insert" on public.itinerary_items;
drop policy if exists "itinerary_items_update" on public.itinerary_items;
drop policy if exists "itinerary_items_delete" on public.itinerary_items;
drop policy if exists "itinerary_items_all" on public.itinerary_items;

create policy "itinerary_items_select" on public.itinerary_items
for select using (public.is_trip_member(trip_id));

create policy "itinerary_items_insert" on public.itinerary_items
for insert with check (public.is_trip_member(trip_id));

create policy "itinerary_items_update" on public.itinerary_items
for update using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id));

create policy "itinerary_items_delete" on public.itinerary_items
for delete using (public.is_trip_member(trip_id));

drop policy if exists "meetup_points_select" on public.meetup_points;
drop policy if exists "meetup_points_insert" on public.meetup_points;
drop policy if exists "meetup_points_update" on public.meetup_points;
drop policy if exists "meetup_points_all" on public.meetup_points;

create policy "meetup_points_select" on public.meetup_points
for select using (public.is_trip_member(trip_id));

create policy "meetup_points_insert" on public.meetup_points
for insert with check (
  public.is_trip_member(trip_id)
  and created_by = auth.uid()
);

create policy "meetup_points_update" on public.meetup_points
for update using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id));

do $$
begin
  alter publication supabase_realtime add table public.itinerary_items;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.itinerary_days;
exception
  when duplicate_object then null;
end $$;
