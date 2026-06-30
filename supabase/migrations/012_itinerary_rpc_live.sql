-- Rossbust itinerary helpers.
-- Run this in Supabase SQL Editor if itinerary buttons do nothing or saves fail.

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

create or replace function public.add_itinerary_item(
  p_trip_id uuid,
  p_day_id uuid,
  p_title text,
  p_time text default null,
  p_location text default null
)
returns public.itinerary_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.itinerary_items;
  v_order integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_member(p_trip_id) then
    raise exception 'You are not a member of this trip';
  end if;

  if not exists (
    select 1
    from public.itinerary_days
    where id = p_day_id
      and trip_id = p_trip_id
  ) then
    raise exception 'Itinerary day does not belong to this trip';
  end if;

  select coalesce(max(order_index), -1) + 1
  into v_order
  from public.itinerary_items
  where trip_id = p_trip_id
    and day_id = p_day_id;

  insert into public.itinerary_items (
    trip_id,
    day_id,
    title,
    time,
    location,
    order_index
  )
  values (
    p_trip_id,
    p_day_id,
    nullif(trim(p_title), ''),
    nullif(trim(coalesce(p_time, '')), ''),
    nullif(trim(coalesce(p_location, '')), ''),
    v_order
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.create_itinerary_day(
  p_trip_id uuid,
  p_date date default current_date,
  p_title text default null
)
returns public.itinerary_days
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.itinerary_days;
  v_day_number integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_member(p_trip_id) then
    raise exception 'You are not a member of this trip';
  end if;

  select coalesce(max(day_number), 0) + 1
  into v_day_number
  from public.itinerary_days
  where trip_id = p_trip_id;

  insert into public.itinerary_days (
    trip_id,
    date,
    day_number,
    title
  )
  values (
    p_trip_id,
    p_date,
    v_day_number,
    nullif(trim(coalesce(p_title, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.add_itinerary_item(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.create_itinerary_day(uuid, date, text) to authenticated;

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
