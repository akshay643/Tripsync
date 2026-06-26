-- Definitively fix location sharing visibility.
-- Safe to run even if previous migrations ran — all operations are idempotent.

-- Ensure the helper function exists with SECURITY DEFINER (bypasses RLS on trip_members subquery)
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
  );
$$;

-- Recreate locations policies
drop policy if exists "locations_select" on locations;
drop policy if exists "locations_insert" on locations;
drop policy if exists "locations_update" on locations;
drop policy if exists "locations_delete" on locations;

create policy "locations_select" on locations for select using (
  user_id = auth.uid()
  or (
    sharing_enabled = true
    and (sharing_until is null or sharing_until > now())
    and public.is_trip_member(trip_id)
  )
);

create policy "locations_insert" on locations for insert with check (user_id = auth.uid());
create policy "locations_update" on locations for update using (user_id = auth.uid());
create policy "locations_delete" on locations for delete using (user_id = auth.uid());

-- Also ensure trip_members SELECT uses the function (no recursion)
drop policy if exists "trip_members_select" on trip_members;
create policy "trip_members_select" on trip_members for select using (
  public.is_trip_member(trip_id)
);
