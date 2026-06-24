"use client";

import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { Plane } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0f0c29] px-4">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/30 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-delay:0.5s]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 28 }}
        >
          <motion.div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/40"
            whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }}
          >
            <Plane className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TripSync</h1>
          <p className="text-indigo-300 text-sm mt-1.5">Plan · Split · Travel Together</p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 28 }}
        >
          <LoginForm />
        </motion.div>
      </motion.div>
    </div>
  );
}
