"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    router.push("/login");
  };

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Set a new password</h1>
        {!ready ? (
          <p className="text-sm text-purple-200/60 mt-4">Verifying your reset link...</p>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
            {message && <p className="text-sm text-red-300">{message}</p>}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newPassword}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
