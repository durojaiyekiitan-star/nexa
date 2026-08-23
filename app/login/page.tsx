"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError("");
    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError(signInError?.message || "Failed to log in");
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();

    if (profile?.role === "student") router.push("/student/dashboard");
    else if (profile?.role === "sponsor") router.push("/sponsor/dashboard");
    else if (profile?.role === "organization") router.push("/organization");
    else router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sm text-purple-200/60 mb-6">Log in to your Nexa account.</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              placeholder="Your password"
            />
            <a href="/forgot-password" className="text-xs text-cyan-300/70 hover:text-cyan-300 underline mt-1.5 inline-block">
              Forgot password?
            </a>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!email || !password || isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-purple-300/50 text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-cyan-300 underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
