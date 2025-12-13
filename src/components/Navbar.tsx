"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function Navbar() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setChecking(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
      setChecking(false);
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthed(!!session);
      setChecking(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login"); // ✅ cleaner than href (less stuck/back issues)
  };

  const isActive = (href: string) => {
    if (href === "/blog") return pathname.startsWith("/blog");
    return pathname === href;
  };

  const linkClass = (href: string) => {
    const base =
      "text-sm rounded-full px-3 py-1.5 transition border";
    const active =
      "text-slate-50 border-sky-400/50 bg-sky-500/10";
    const idle =
      "text-slate-200/80 border-transparent hover:text-slate-50 hover:border-slate-700";

    return `${base} ${isActive(href) ? active : idle}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/70 bg-slate-950/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight text-slate-50">
          Bondalayze
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/blog" className={linkClass("/blog")}>
            Blog
          </Link>
          <Link href="/analyze" className={linkClass("/analyze")}>
            Analyze
          </Link>
          <Link href="/pricing" className={linkClass("/pricing")}>
            Pricing
          </Link>

          {/* During initial session check, don’t flicker wrong buttons */}
          {checking ? (
            <div className="ml-2 h-9 w-20 animate-pulse rounded-full bg-slate-800/60" />
          ) : isAuthed ? (
            <>
              <Link href="/profile" className={linkClass("/profile")}>
                Profile
              </Link>

              <button
                onClick={logout}
                className="ml-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-400"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-slate-50"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
