"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Role } from "@/lib/auth/roles";
import { Sparkles, LayoutDashboard, Building2, Settings, LogOut, ChevronRight, ChevronLeft } from "lucide-react";

const NAV_ITEMS_BY_ROLE: Record<Role, { href: string; label: string; icon: typeof Sparkles }[]> = {
  student: [
    { href: "/assessment", label: "Assessment", icon: Sparkles },
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
  sponsor: [{ href: "/sponsor/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  organization: [{ href: "/organization", label: "Dashboard", icon: Building2 }],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);

  const isExpanded = pinned || hovering;

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        setUserRole(null);
        return;
      }
      setIsLoggedIn(true);

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setUserRole((profile?.role as Role) ?? null);
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
    setIsLoggedIn(false);
    setUserRole(null);
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const navItems = userRole ? NAV_ITEMS_BY_ROLE[userRole] : [];

  return (
    <aside
      onMouseEnter={() => !pinned && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`fixed left-0 top-0 h-screen z-50 bg-[#0B071E]/85 backdrop-blur-xl border-r border-white/10 flex flex-col transition-[width] duration-300 ease-out ${
        isExpanded ? "w-60" : "w-16"
      }`}
    >
      {/* Logo + pin toggle */}
      <div className="flex items-center justify-between h-16 px-4 flex-shrink-0">
        <Link href="/" className="flex items-center overflow-hidden">
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent flex-shrink-0">
            N
          </span>
          <span
            className={`text-lg font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent whitespace-nowrap inline-block overflow-hidden transition-all duration-300 ease-out ${
              isExpanded ? "max-w-[48px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            exa
          </span>
        </Link>
        {isExpanded && (
          <button
            onClick={() => setPinned((p) => !p)}
            className="text-purple-300/50 hover:text-white transition-colors flex-shrink-0"
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          >
            {pinned ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm transition-colors ${
                active ? "bg-white/10 text-white border border-white/15" : "text-purple-200/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {isLoggedIn && (
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm transition-colors ${
              isActive("/settings") ? "bg-white/10 text-white border border-white/15" : "text-purple-200/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings size={18} className="flex-shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        )}
      </nav>

      {/* Bottom: logout only — greeting and login/signup now live top-right */}
      {isLoggedIn && (
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm text-purple-200/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Log out</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
