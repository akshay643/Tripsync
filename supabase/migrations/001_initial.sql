-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar text,
  email text,
  phone text,
  created_at timestamp with time zone default now()
);

-- Trips
create table trips (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  destination text,
  start_date date,
  end_date date,
  trip_image text,
  budget numeric(10,2),
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default now()
);

-- Trip members
create table trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamp with time zone default now(),
  unique(trip_id, user_id)
);

-- Expenses
create table expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  amount numeric(10,2) not null,
  category text default 'misc',
  paid_by uuid references profiles(id) not null,
  date date default current_date,
  notes text,
  split_type text default 'equal' check (split_type in ('equal', 'unequal', 'custom')),
  created_at timestamp with time zone default now()
);

-- Expense splits
create table expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  amount numeric(10,2) not null,
  percentage numeric(5,2)
);

-- Settlements
create table settlements (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  from_user uuid references profiles(id) not null,
  to_user uuid references profiles(id) not null,
  amount numeric(10,2) not null,
  settled boolean default false,
  settled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Live locations
create table locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  sharing_enabled boolean default false,
  sharing_until timestamp with time zone,
  updated_at timestamp with time zone default now(),
  unique(user_id, trip_id)
);

-- Meetup points
create table meetup_points (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  title text default 'Meet Here',
  latitude double precision not null,
  longitude double precision not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Itinerary days
create table itinerary_days (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  date date not null,
  day_number integer not null,
  title text,
  created_at timestamp with time zone default now()
);

-- Itinerary items
create table itinerary_items (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references itinerary_days(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  time text,
  location text,
  notes text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table settlements enable row level security;
alter table locations enable row level security;
alter table meetup_points enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_items enable row level security;

-- Profiles policies
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Trips policies
create policy "trips_select" on trips for select using (
  exists (select 1 from trip_members where trip_id = trips.id and user_id = auth.uid())
);
create policy "trips_insert" on trips for insert with check (auth.uid() = created_by);
create policy "trips_update" on trips for update using (
  exists (select 1 from trip_members where trip_id = trips.id and user_id = auth.uid() and role = 'admin')
);

-- Trip members policies
create policy "trip_members_select" on trip_members for select using (
  exists (select 1 from trip_members tm where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid())
);
create policy "trip_members_insert" on trip_members for insert with check (auth.uid() = user_id);
create policy "trip_members_delete" on trip_members for delete using (
  exists (select 1 from trip_members tm where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid() and tm.role = 'admin')
);

-- Expenses policies
create policy "expenses_select" on expenses for select using (
  exists (select 1 from trip_members where trip_id = expenses.trip_id and user_id = auth.uid())
);
create policy "expenses_insert" on expenses for insert with check (
  exists (select 1 from trip_members where trip_id = expenses.trip_id and user_id = auth.uid())
);
create policy "expenses_update" on expenses for update using (paid_by = auth.uid());
create policy "expenses_delete" on expenses for delete using (
  exists (select 1 from trip_members where trip_id = expenses.trip_id and user_id = auth.uid() and role = 'admin')
  or paid_by = auth.uid()
);

-- Expense splits policies
create policy "expense_splits_select" on expense_splits for select using (
  exists (
    select 1 from expenses e
    join trip_members tm on tm.trip_id = e.trip_id
    where e.id = expense_splits.expense_id and tm.user_id = auth.uid()
  )
);
create policy "expense_splits_insert" on expense_splits for insert with check (
  exists (
    select 1 from expenses e
    join trip_members tm on tm.trip_id = e.trip_id
    where e.id = expense_splits.expense_id and tm.user_id = auth.uid()
  )
);
create policy "expense_splits_delete" on expense_splits for delete using (
  exists (
    select 1 from expenses e
    join trip_members tm on tm.trip_id = e.trip_id
    where e.id = expense_splits.expense_id and tm.user_id = auth.uid()
  )
);

-- Settlements policies
create policy "settlements_select" on settlements for select using (
  exists (select 1 from trip_members where trip_id = settlements.trip_id and user_id = auth.uid())
);
create policy "settlements_insert" on settlements for insert with check (
  exists (select 1 from trip_members where trip_id = settlements.trip_id and user_id = auth.uid())
);
create policy "settlements_update" on settlements for update using (
  from_user = auth.uid() or to_user = auth.uid()
);

-- Locations policies (only sharing_enabled ones visible to others)
create policy "locations_select" on locations for select using (
  user_id = auth.uid()
  or (
    sharing_enabled = true
    and (sharing_until is null or sharing_until > now())
    and exists (select 1 from trip_members where trip_id = locations.trip_id and user_id = auth.uid())
  )
);
create policy "locations_insert" on locations for insert with check (user_id = auth.uid());
create policy "locations_update" on locations for update using (user_id = auth.uid());

-- Meetup points policies
create policy "meetup_points_select" on meetup_points for select using (
  exists (select 1 from trip_members where trip_id = meetup_points.trip_id and user_id = auth.uid())
);
create policy "meetup_points_insert" on meetup_points for insert with check (
  exists (select 1 from trip_members where trip_id = meetup_points.trip_id and user_id = auth.uid())
);
create policy "meetup_points_update" on meetup_points for update using (created_by = auth.uid());

-- Itinerary days policies
create policy "itinerary_days_select" on itinerary_days for select using (
  exists (select 1 from trip_members where trip_id = itinerary_days.trip_id and user_id = auth.uid())
);
create policy "itinerary_days_all" on itinerary_days for all using (
  exists (select 1 from trip_members where trip_id = itinerary_days.trip_id and user_id = auth.uid())
);

-- Itinerary items policies
create policy "itinerary_items_select" on itinerary_items for select using (
  exists (select 1 from trip_members where trip_id = itinerary_items.trip_id and user_id = auth.uid())
);
create policy "itinerary_items_all" on itinerary_items for all using (
  exists (select 1 from trip_members where trip_id = itinerary_items.trip_id and user_id = auth.uid())
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for live features
alter publication supabase_realtime add table locations;
alter publication supabase_realtime add table meetup_points;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table trip_members;
