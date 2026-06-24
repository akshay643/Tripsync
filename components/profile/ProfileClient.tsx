"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Settings, HelpCircle, ChevronRight, Shield, Bell } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

interface Props {
  profile: any;
  userEmail: string;
}

const menuItems = [
  { icon: Settings, label: "Account Settings", sub: "Manage your details" },
  { icon: Bell, label: "Notifications", sub: "Trips & expense alerts" },
  { icon: Shield, label: "Privacy & Security", sub: "Data and permissions" },
  { icon: HelpCircle, label: "Help & Support", sub: "FAQ and contact" },
];

export function ProfileClient({ profile, userEmail }: Props) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-6 pb-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-white/30">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="text-3xl bg-indigo-400 text-white">
                {getInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/20 to-transparent pointer-events-none" />
          </div>
          <h2 className="text-2xl font-bold text-white">{profile?.name || "Your Name"}</h2>
          <p className="text-indigo-300 text-sm mt-1">{profile?.email || userEmail}</p>
        </motion.div>
      </div>

      {/* Menu */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="px-4 -mt-8 space-y-3 pb-8"
      >
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm divide-y divide-gray-50"
        >
          {menuItems.map(({ icon: Icon, label, sub }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={staggerItem}>
          <LogoutButton />
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="text-center text-xs text-gray-400 py-2"
        >
          TripSync v1.0 · Made with ♥
        </motion.p>
      </motion.div>
    </div>
  );
}
