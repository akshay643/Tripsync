-- Allow admins to remove members and members to leave trips.
-- Historical expenses/splits remain intact; only future access and future splits change.

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

create or replace function public.is_trip_admin(p_trip_id uuid)
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
      and role = 'admin'
  );
$$;

create or replace function public.trip_admin_count(p_trip_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.trip_members
  where trip_id = p_trip_id
    and role = 'admin';
$$;

drop policy if exists "trip_members_delete" on public.trip_members;
create policy "trip_members_delete" on public.trip_members
for delete using (
  (
    user_id = auth.uid()
    and (
      role <> 'admin'
      or public.trip_admin_count(trip_id) > 1
    )
  )
  or (
    public.is_trip_admin(trip_id)
    and (
      role <> 'admin'
      or public.trip_admin_count(trip_id) > 1
    )
  )
);
