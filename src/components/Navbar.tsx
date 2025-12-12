"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function Navbar() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();

  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    // ✅ hard redirect (সব state reset)
    window.location.href = "/login";
  };

  const linkClass = (href: string) =>
    "text-sm " +
    (pathname === href ? "text-slate-50" : "text-slate-200/80 hover:text-slate-50");

  return (
    <nav className="w-full bg-slate-800/60 border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-50">
          Bondalayze
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/analyze" className={linkClass("/analyze")}>
            Analyze
          </Link>
          <Link href="/pricing" className={linkClass("/pricing")}>
            Pricing
          </Link>

          {/* ✅ Profile auto-hide when logged out */}
          {isAuthed && (
            <Link href="/profile" className={linkClass("/profile")}>
              Profile
            </Link>
          )}

          {/* ✅ Global logout button when logged in */}
          {isAuthed ? (
            <button
              onClick={logout}
              className="text-sm rounded-md bg-violet-500 hover:bg-violet-400 text-slate-950 font-medium px-3 py-1.5"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm rounded-md border border-slate-600 hover:border-slate-400 text-slate-100 px-3 py-1.5"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
