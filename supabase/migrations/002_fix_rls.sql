-- Fix all RLS policies to use is_trip_member() — prevents recursion and ensures consistency

-- Expenses
drop policy if exists "expenses_select" on expenses;
drop policy if exists "expenses_insert" on expenses;
drop policy if exists "expenses_update" on expenses;
drop policy if exists "expenses_delete" on expenses;

create policy "expenses_select" on expenses for select using (public.is_trip_member(trip_id));
create policy "expenses_insert" on expenses for insert with check (public.is_trip_member(trip_id));
create policy "expenses_update" on expenses for update using (paid_by = auth.uid() or public.is_trip_member(trip_id));
create policy "expenses_delete" on expenses for delete using (paid_by = auth.uid() or public.is_trip_member(trip_id));

-- Expense splits
drop policy if exists "expense_splits_select" on expense_splits;
drop policy if exists "expense_splits_insert" on expense_splits;
drop policy if exists "expense_splits_delete" on expense_splits;

create policy "expense_splits_select" on expense_splits for select using (
  user_id = auth.uid()
  or exists (select 1 from expenses e where e.id = expense_splits.expense_id and public.is_trip_member(e.trip_id))
);
create policy "expense_splits_insert" on expense_splits for insert with check (
  exists (select 1 from expenses e where e.id = expense_splits.expense_id and public.is_trip_member(e.trip_id))
);
create policy "expense_splits_delete" on expense_splits for delete using (
  exists (select 1 from expenses e where e.id = expense_splits.expense_id and public.is_trip_member(e.trip_id))
);

-- Itinerary days
drop policy if exists "itinerary_days_select" on itinerary_days;
drop policy if exists "itinerary_days_all" on itinerary_days;

create policy "itinerary_days_select" on itinerary_days for select using (public.is_trip_member(trip_id));
create policy "itinerary_days_insert" on itinerary_days for insert with check (public.is_trip_member(trip_id));
create policy "itinerary_days_update" on itinerary_days for update using (public.is_trip_member(trip_id));
create policy "itinerary_days_delete" on itinerary_days for delete using (public.is_trip_member(trip_id));

-- Itinerary items
drop policy if exists "itinerary_items_select" on itinerary_items;
drop policy if exists "itinerary_items_all" on itinerary_items;

create policy "itinerary_items_select" on itinerary_items for select using (public.is_trip_member(trip_id));
create policy "itinerary_items_insert" on itinerary_items for insert with check (public.is_trip_member(trip_id));
create policy "itinerary_items_update" on itinerary_items for update using (public.is_trip_member(trip_id));
create policy "itinerary_items_delete" on itinerary_items for delete using (public.is_trip_member(trip_id));

-- Settlements
drop policy if exists "settlements_select" on settlements;
drop policy if exists "settlements_insert" on settlements;
drop policy if exists "settlements_update" on settlements;

create policy "settlements_select" on settlements for select using (public.is_trip_member(trip_id));
create policy "settlements_insert" on settlements for insert with check (public.is_trip_member(trip_id));
create policy "settlements_update" on settlements for update using (from_user = auth.uid() or to_user = auth.uid());

-- Meetup points
drop policy if exists "meetup_points_select" on meetup_points;
drop policy if exists "meetup_points_insert" on meetup_points;
drop policy if exists "meetup_points_update" on meetup_points;
drop policy if exists "meetup_points_all" on meetup_points;

create policy "meetup_points_select" on meetup_points for select using (public.is_trip_member(trip_id));
create policy "meetup_points_insert" on meetup_points for insert with check (public.is_trip_member(trip_id));
create policy "meetup_points_update" on meetup_points for update using (public.is_trip_member(trip_id));

-- Locations
drop policy if exists "locations_select" on locations;
drop policy if exists "locations_insert" on locations;
drop policy if exists "locations_update" on locations;

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
