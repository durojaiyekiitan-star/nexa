"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error ? error.message : "If an account exists for that email, a reset link has been sent.");
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
        <p className="text-sm text-purple-200/60 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              placeholder="you@example.com"
            />
          </div>
          {message && <p className="text-sm text-purple-200/70">{message}</p>}
          <button
            onClick={handleSubmit}
            disabled={!email || isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:shadow-none"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
          <p className="text-sm text-purple-300/50 text-center">
            <a href="/login" className="text-cyan-300 underline">
              Back to log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
