"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

type Step = "idle" | "email" | "otp_sent" | "loading";

export function LoginForm() {
  const [step, setStep] = useState<Step>("idle");
  const loading = step === "loading";
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleGoogleLogin() {
    setStep("loading");
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/auth/callback`,
      },
    });
    if (error) { setError(error.message); setStep("idle"); }
  }

  async function handleEmailOTP() {
    if (!email) return;
    setStep("loading");
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/auth/callback`,
      },
    });
    if (error) { setError(error.message); setStep("email"); }
    else setStep("otp_sent");
  }

  async function handleVerifyOTP() {
    if (!otp) return;
    setStep("loading");
    setError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) { setError(error.message); setStep("otp_sent"); }
  }

  return (
    <div className="space-y-4">
      {/* Google */}
      <motion.button
        onClick={handleGoogleLogin}
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-gray-800 font-semibold text-sm shadow-sm border border-white/30 hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </motion.button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs text-indigo-300 font-medium">or email</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <AnimatePresence mode="wait">
        {step !== "otp_sent" ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-indigo-200 text-xs">Email address</Label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailOTP()}
                disabled={loading}
                className="flex h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 backdrop-blur"
              />
            </div>
            <motion.button
              onClick={handleEmailOTP}
              disabled={loading || !email}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Magic Code
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="space-y-3"
          >
            <p className="text-xs text-indigo-200 text-center">
              Code sent to <span className="font-semibold text-white">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              disabled={loading}
              autoFocus
              className="flex h-14 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-center text-2xl font-bold tracking-[0.4em] text-white placeholder:text-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 backdrop-blur"
            />
            <motion.button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-11 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign In"}
            </motion.button>
            <button onClick={() => setStep("idle")} className="w-full text-xs text-indigo-300 flex items-center justify-center gap-1 py-1">
              <ArrowLeft className="h-3 w-3" /> Use different email
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
