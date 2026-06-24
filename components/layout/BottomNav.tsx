"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Receipt, Luggage, User } from "lucide-react";
import { motion } from "framer-motion";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/80 bg-white/90 backdrop-blur-xl">
      <div className="flex items-center justify-around px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (pathname.startsWith(href + "/") && href !== "/");
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-5 py-1 min-w-15"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-indigo-50"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon
                  className={cn("h-5.5 w-5.5 transition-colors", active ? "text-indigo-600" : "text-gray-400")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </motion.div>
              <span className={cn("relative z-10 text-[10px] font-semibold transition-colors", active ? "text-indigo-600" : "text-gray-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
