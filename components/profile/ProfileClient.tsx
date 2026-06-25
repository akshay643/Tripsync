"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Settings, HelpCircle, ChevronRight, Shield, Bell, Pencil, Check, X } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: any;
  userEmail: string;
}

export function ProfileClient({ profile: initialProfile, userEmail }: Props) {
  const supabase = createClient();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [avatar, setAvatar] = useState(initialProfile?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), avatar: avatar.trim() || null })
      .eq("id", initialProfile?.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-6 pb-16 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative flex flex-col items-center text-center"
        >
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-white/30">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="text-3xl bg-indigo-400 text-white font-bold">
                {getInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setEditing(true)}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center"
            >
              <Pencil className="h-3.5 w-3.5 text-indigo-600" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-white">{profile?.name || "Your Name"}</h2>
          <p className="text-indigo-300 text-sm mt-1">{profile?.email || userEmail}</p>
        </motion.div>
      </div>

      <div className="px-4 -mt-8 space-y-3 pb-10">
        {/* Edit panel */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              className="bg-white rounded-2xl border border-indigo-100 shadow-md p-4 space-y-3"
            >
              <p className="text-sm font-bold text-gray-900">Edit Profile</p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Display Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Avatar URL</label>
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {avatar && (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-gray-400">Preview</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveProfile}
                  disabled={saving || !name.trim()}
                  className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saved ? <Check className="h-4 w-4" /> : saving ? "Saving…" : "Save Changes"}
                </motion.button>
                <button
                  onClick={() => { setEditing(false); setName(profile?.name ?? ""); setAvatar(profile?.avatar ?? ""); }}
                  className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm divide-y divide-gray-50"
          >
            {[
              { icon: Settings, label: "Account Settings", sub: "Manage your details" },
              { icon: Bell, label: "Notifications", sub: "Trips & expense alerts" },
              { icon: Shield, label: "Privacy & Security", sub: "Data and permissions" },
              { icon: HelpCircle, label: "Help & Support", sub: "FAQ and contact" },
            ].map(({ icon: Icon, label, sub }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.99 }}
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

          <motion.p variants={staggerItem} className="text-center text-xs text-gray-400 py-2">
            TripSync v1.0 · Made with ♥
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
