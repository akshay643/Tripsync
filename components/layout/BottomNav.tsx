"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Luggage, User, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/trips",         label: "Trips",   icon: Luggage },
  { href: "/map",           label: "Map",     icon: Map     },
  { href: "/notifications", label: "Alerts",  icon: Bell    },
  { href: "/profile",       label: "Profile", icon: User    },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
      <div
        className="border-t border-white/[0.07] bg-[#0a0a16]/90 backdrop-blur-2xl
                   flex items-center justify-around px-2 pt-2
                   pb-[max(10px,env(safe-area-inset-bottom))]"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1 min-w-0 flex-1"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-2xl bg-indigo-500/15"
                  transition={{ type: "spring", stiffness: 600, damping: 40 }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    active ? "text-indigo-400" : "text-slate-500"
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {active && (
                  <motion.span
                    layoutId={`glow-${href}`}
                    className="absolute inset-0 blur-md bg-indigo-500/40 rounded-full pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  "relative z-10 text-[10px] font-semibold transition-colors duration-200",
                  active ? "text-indigo-400" : "text-slate-600"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
