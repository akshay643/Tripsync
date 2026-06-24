import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateInviteLink(tripId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/join/${tripId}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Drinks",
  hotel: "Hotel",
  taxi: "Transport",
  activities: "Activities",
  shopping: "Shopping",
  misc: "Misc",
};

export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  hotel: "🏨",
  taxi: "🚕",
  activities: "🎯",
  shopping: "🛍️",
  misc: "📦",
};
