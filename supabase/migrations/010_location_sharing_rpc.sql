-- Robust location-sharing functions.
-- Run this in Supabase SQL Editor if location sharing fails or silently does nothing.

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

create or replace function public.share_my_location(
  p_trip_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_sharing_until timestamptz default null
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.locations;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_trip_member(p_trip_id) then
    raise exception 'You are not a member of this trip';
  end if;

  insert into public.locations (
    user_id,
    trip_id,
    latitude,
    longitude,
    sharing_enabled,
    sharing_until,
    updated_at
  )
  values (
    v_user_id,
    p_trip_id,
    p_latitude,
    p_longitude,
    true,
    p_sharing_until,
    now()
  )
  on conflict (user_id, trip_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    sharing_enabled = true,
    sharing_until = excluded.sharing_until,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.stop_my_location(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.locations
  set sharing_enabled = false,
      updated_at = now()
  where user_id = v_user_id
    and trip_id = p_trip_id;
end;
$$;

create or replace function public.get_active_trip_locations(p_trip_id uuid)
returns table (
  id uuid,
  user_id uuid,
  trip_id uuid,
  latitude double precision,
  longitude double precision,
  sharing_enabled boolean,
  sharing_until timestamptz,
  updated_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    l.id,
    l.user_id,
    l.trip_id,
    l.latitude,
    l.longitude,
    l.sharing_enabled,
    l.sharing_until,
    l.updated_at
  from public.locations l
  where l.trip_id = p_trip_id
    and l.sharing_enabled = true
    and (l.sharing_until is null or l.sharing_until > now())
    and public.is_trip_member(p_trip_id)
  order by l.updated_at desc;
$$;

grant execute on function public.share_my_location(uuid, double precision, double precision, timestamptz) to authenticated;
grant execute on function public.stop_my_location(uuid) to authenticated;
grant execute on function public.get_active_trip_locations(uuid) to authenticated;
