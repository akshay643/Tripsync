export interface Profile {
  id: string;
  name: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_image: string | null;
  budget: number | null;
  created_by: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface TripWithMembers extends Trip {
  trip_members: TripMember[];
  total_spend?: number;
}

export type ExpenseCategory =
  | "food"
  | "hotel"
  | "taxi"
  | "activities"
  | "shopping"
  | "misc";

export type SplitType = "equal" | "unequal" | "custom";

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paid_by: string;
  date: string;
  notes: string | null;
  split_type: SplitType;
  created_at: string;
  payer?: Profile;
  expense_splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  profile?: Profile;
}

export interface Settlement {
  id: string;
  trip_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled: boolean;
  settled_at: string | null;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface CalculatedSettlement {
  from_user: string;
  to_user: string;
  amount: number;
}

export interface Location {
  id: string;
  user_id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  sharing_enabled: boolean;
  sharing_until: string | null;
  updated_at: string;
  profile?: Profile;
}

export interface MeetupPoint {
  id: string;
  trip_id: string;
  created_by: string;
  title: string;
  latitude: number;
  longitude: number;
  active: boolean;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  date: string;
  day_number: number;
  title: string | null;
  created_at: string;
  items?: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  trip_id: string;
  title: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export type PackingCategory =
  | "clothes"
  | "toiletries"
  | "electronics"
  | "documents"
  | "medicines"
  | "food"
  | "gear"
  | "general";

export interface PackingItem {
  id: string;
  trip_id: string;
  added_by: string;
  assigned_to: string | null;
  title: string;
  category: PackingCategory;
  packed: boolean;
  packed_by: string | null;
  packed_at: string | null;
  quantity: number;
  order_index: number;
  created_at: string;
  added_by_profile?: Profile;
  assigned_to_profile?: Profile;
}
