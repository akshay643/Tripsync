-- Create the is_trip_member() helper that all policies in 002_fix_rls.sql depend on.
-- SECURITY DEFINER bypasses RLS when checking membership, preventing infinite recursion.
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

-- Also fix the trips SELECT policy to allow reading after joining
-- (the original only checked trip_members which didn't include creator in all cases)
drop policy if exists "trips_select" on trips;
create policy "trips_select" on trips for select using (
  public.is_trip_member(id)
  or created_by = auth.uid()
);

-- Ensure trip_members SELECT policy uses the function (not recursive subquery)
drop policy if exists "trip_members_select" on trip_members;
create policy "trip_members_select" on trip_members for select using (
  public.is_trip_member(trip_id)
);
