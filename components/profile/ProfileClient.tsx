"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  Settings, HelpCircle, ChevronRight, Shield, Bell,
  Camera, Check, X, Loader2, Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: any;
  userEmail: string;
}

const menuRows = [
  { icon: Bell,      label: "Notifications",     sub: "Trips & expense alerts",  color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: Shield,    label: "Privacy & Security", sub: "Data and permissions",    color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: HelpCircle,label: "Help & Support",     sub: "FAQ and contact",         color: "text-sky-400",    bg: "bg-sky-500/10"    },
];

export function ProfileClient({ profile: initialProfile, userEmail }: Props) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !initialProfile?.id) return;
    setUploading(true);
    setUploadError("");
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${initialProfile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      const { data } = await supabase
        .from("profiles")
        .update({ avatar: url })
        .eq("id", initialProfile.id)
        .select()
        .single();
      if (data) setProfile(data);
    } catch (err: any) {
      setUploadError(err?.message ?? "Photo upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", initialProfile?.id)
      .select()
      .single();
    if (data) {
      setProfile(data);
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1200);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-16 pb-12">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute top-8 left-1/4 h-32 w-32 rounded-full bg-violet-600/20 blur-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl scale-110 pointer-events-none" />
            <Avatar className="relative h-28 w-28 ring-2 ring-indigo-500/40 ring-offset-4 ring-offset-[#08080f]">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="text-3xl bg-indigo-600 text-white font-black">
                {getInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[#1c1c35] border border-white/10 shadow-xl flex items-center justify-center"
            >
              {uploading
                ? <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                : <Camera className="h-4 w-4 text-slate-300" />
              }
            </motion.button>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">{profile?.name || "Your Name"}</h2>
          <p className="text-slate-500 text-sm mt-1">{profile?.email || userEmail}</p>

          {uploadError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
            >
              {uploadError}
            </motion.p>
          )}
        </motion.div>
      </div>

      <div className="px-4 space-y-3 pb-12">
        {/* Edit name panel */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[#0f0f1e] rounded-2xl border border-white/7 p-4 space-y-3"
            >
              <p className="text-sm font-bold text-white">Edit Display Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-3 rounded-xl bg-[#14142a] border border-white/7 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveName}
                  disabled={saving || !name.trim()}
                  className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {saved ? <Check className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </motion.button>
                <button
                  onClick={() => { setEditing(false); setName(profile?.name ?? ""); }}
                  className="h-10 w-10 rounded-xl bg-white/6 flex items-center justify-center text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
          className="bg-[#0f0f1e] rounded-2xl border border-white/7 overflow-hidden divide-y divide-white/4"
        >
          {/* Edit name row */}
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/3 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Pencil className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Display Name</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile?.name || "Not set"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
          </motion.button>

          {menuRows.map(({ icon: Icon, label, sub, color, bg }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/3 transition-colors text-left"
            >
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
            </motion.button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 30 }}
        >
          <LogoutButton />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-xs text-slate-700 py-2"
        >
          TripSync v1.0
        </motion.p>
      </div>
    </div>
  );
}
