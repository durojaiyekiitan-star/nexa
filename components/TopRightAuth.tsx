"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function TopRightAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setGreeting(null);
        setCheckingAuth(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, has_logged_in_before")
        .eq("id", user.id)
        .single();

      if (profile) {
        const prefix = profile.has_logged_in_before ? "Welcome back" : "Hello";
        setGreeting(`${prefix}, ${profile.first_name}`);
      } else {
        setGreeting(user.email ?? "Account");
      }
      setCheckingAuth(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setGreeting(null);
    router.push("/");
    router.refresh();
  };

  if (checkingAuth) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
      {greeting ? (
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full pl-4 pr-1.5 py-1.5 shadow-[0_4px_20px_rgba(139,92,246,0.15)]">
          <span className="text-sm text-purple-100 whitespace-nowrap">{greeting}</span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-purple-300/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-1.5 py-1.5 shadow-[0_4px_20px_rgba(139,92,246,0.15)]">
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-full text-sm text-purple-200/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-[0_0_14px_rgba(139,92,246,0.4)]"
          >
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
}
