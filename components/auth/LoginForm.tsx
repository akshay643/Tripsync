"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";

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
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError(error.message); setStep("idle"); }
  }

  async function handleEmailOTP() {
    if (!email) return;
    setStep("loading");
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError(error.message); setStep("email"); }
    else setStep("otp_sent");
  }

  async function handleVerifyOTP() {
    if (!otp) return;
    setStep("loading");
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) { setError(error.message); setStep("otp_sent"); }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full gap-3" onClick={handleGoogleLogin} disabled={step === "loading"}>
        {step === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {step !== "otp_sent" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailOTP()}
              disabled={step === "loading"}
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleEmailOTP}
            disabled={step === "loading" || !email}
          >
            {step === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send Magic Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              disabled={loading}
              className="text-center text-xl tracking-widest"
            />
          </div>
          <Button className="w-full" onClick={handleVerifyOTP} disabled={loading || otp.length < 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign In"}
          </Button>
          <button
            onClick={() => setStep("email")}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
