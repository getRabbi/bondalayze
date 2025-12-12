"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function Header() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();

  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthed(!!data.session);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const linkClass = (href: string) =>
    "text-sm " +
    (pathname === href
      ? "text-slate-50"
      : "text-slate-200/80 hover:text-slate-50");

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-50">
          Bondalayze
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/analyze" className={linkClass("/analyze")}>
            Analyze
          </Link>

          <Link href="/pricing" className={linkClass("/pricing")}>
            Pricing
          </Link>

          {/* Logged in হলে profile + logout */}
          {isAuthed ? (
            <>
              <Link href="/profile" className={linkClass("/profile")}>
                Profile
              </Link>

              <button
                onClick={logout}
                className="rounded-md bg-violet-500 hover:bg-violet-400 text-slate-950 font-medium px-3 py-1.5 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            // ✅ Logged out হলে শুধু Log in
            <Link
              href="/login"
              className="rounded-md border border-slate-700 hover:border-slate-500 text-slate-100 px-3 py-1.5 text-sm"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
