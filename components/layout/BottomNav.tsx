"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Receipt, Luggage, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/map", label: "Map", icon: Map },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors min-w-[60px]",
                active ? "text-indigo-600" : "text-gray-400"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-indigo-100")} strokeWidth={active ? 2.5 : 1.5} />
              <span className={cn("text-[10px] font-medium", active ? "text-indigo-600" : "text-gray-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
