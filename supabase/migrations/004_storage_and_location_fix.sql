-- =========================================================
-- 004: Storage buckets + idempotent location RLS fix
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Ensure is_trip_member exists (idempotent - safe to re-run even if 003 ran)
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- 2. Fix trips_select so invitees can't see trips they haven't joined yet
-- (but members and creator can)
drop policy if exists "trips_select" on trips;
create policy "trips_select" on trips for select using (
  created_by = auth.uid() or public.is_trip_member(id)
);

-- 3. Fix trip_members_select
drop policy if exists "trip_members_select" on trip_members;
create policy "trip_members_select" on trip_members for select using (
  public.is_trip_member(trip_id)
);

-- 4. Locations — allow members to see each other's active sharing
drop policy if exists "locations_select" on locations;
create policy "locations_select" on locations for select using (
  user_id = auth.uid()
  or (
    sharing_enabled = true
    and (sharing_until is null or sharing_until > now())
    and public.is_trip_member(trip_id)
  )
);

drop policy if exists "locations_insert" on locations;
create policy "locations_insert" on locations for insert with check (user_id = auth.uid());

drop policy if exists "locations_update" on locations;
create policy "locations_update" on locations for update using (user_id = auth.uid());

-- 5. Meetup points — members can read and create
drop policy if exists "meetup_points_select" on meetup_points;
create policy "meetup_points_select" on meetup_points for select using (
  public.is_trip_member(trip_id)
);

drop policy if exists "meetup_points_insert" on meetup_points;
create policy "meetup_points_insert" on meetup_points for insert with check (
  public.is_trip_member(trip_id) and created_by = auth.uid()
);

-- 6. Storage buckets (avatars + trip-covers)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',     'avatars',     true, 5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('trip-covers', 'trip-covers', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies: avatars
drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_update" on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Storage policies: trip-covers
drop policy if exists "trip_covers_select" on storage.objects;
drop policy if exists "trip_covers_insert" on storage.objects;
drop policy if exists "trip_covers_update" on storage.objects;

create policy "trip_covers_select" on storage.objects for select using (bucket_id = 'trip-covers');
create policy "trip_covers_insert" on storage.objects for insert with check (bucket_id = 'trip-covers' and auth.role() = 'authenticated');
create policy "trip_covers_update" on storage.objects for update using (bucket_id = 'trip-covers' and auth.role() = 'authenticated');
