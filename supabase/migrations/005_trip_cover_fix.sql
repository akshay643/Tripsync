-- Allow ALL trip members (not just admins) to update trip details
-- Needed for cover photo upload from non-admin members
drop policy if exists "trips_update" on trips;
create policy "trips_update" on trips for update using (
  exists (select 1 from trip_members where trip_id = trips.id and user_id = auth.uid())
);
