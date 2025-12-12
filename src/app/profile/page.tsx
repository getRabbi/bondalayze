"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Plan = "free" | "pro";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let planChannel: ReturnType<typeof supabase.channel> | null = null;

    // ✅ if user signs out anywhere (header/profile), force redirect
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // hard redirect to avoid UI stuck/cached state
        window.location.replace("/login");
      }
    });

    const load = async () => {
      setLoading(true);
      setMsg(null);

      // ✅ use session (more reliable)
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);
      setCreatedAt(user.created_at ?? null);

      // ✅ initial plan fetch
      const { data: planRow, error } = await supabase
        .from("bondalayze_plans")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.error("plan fetch error:", error);
      setPlan(planRow?.plan === "pro" ? "pro" : "free");

      // ✅ realtime plan updates (optional but kept)
      planChannel = supabase
        .channel(`plans:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bondalayze_plans",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const nextPlan = (payload as any).new?.plan;
            if (nextPlan === "pro" || nextPlan === "free") setPlan(nextPlan);
          }
        )
        .subscribe();

      setLoading(false);
    };

    load();

    return () => {
      authSub.subscription.unsubscribe();
      if (planChannel) supabase.removeChannel(planChannel);
    };
  }, [supabase, router]);

  const logout = async () => {
    setMsg(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("signOut error:", error);
        setMsg("Logout failed. Try again.");
        return;
      }

      // ✅ hard redirect (most reliable)
      window.location.replace("/login");
    } catch (e) {
      console.error(e);
      setMsg("Logout failed. Try again.");
    }
  };

  const niceDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Your Profile</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your account and plan.
            </p>
          </div>

          <button
            onClick={logout}
            disabled={loading}
            className="rounded-md bg-violet-500 hover:bg-violet-400 text-slate-950 font-medium px-4 py-2 text-sm disabled:opacity-60"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-400">Email</p>
            <p className="mt-1 text-sm text-slate-100">
              {loading ? "Loading…" : email ?? "—"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-400">Plan</p>
            <p className="mt-1 text-sm">
              {loading ? (
                <span className="text-slate-300">Loading…</span>
              ) : plan === "pro" ? (
                <span className="text-emerald-400 font-semibold">Pro</span>
              ) : (
                <span className="text-slate-200 font-semibold">Free</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {plan === "pro"
                ? "Unlimited analyses + full insights unlocked."
                : "10 analyses/month. Upgrade anytime from Pricing."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:col-span-2">
            <p className="text-xs text-slate-400">Account created</p>
            <p className="mt-1 text-sm text-slate-100">
              {loading ? "Loading…" : niceDate(createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-violet-400"
          >
            View Pricing
          </a>
          <a
            href="/analyze"
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Go to Analyze
          </a>
        </div>

        {msg && <p className="mt-4 text-sm text-rose-400">{msg}</p>}
      </div>
    </div>
  );
}
