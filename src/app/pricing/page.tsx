"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type Plan = "free" | "pro";

export default function PricingPage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [loadingPlan, setLoadingPlan] = useState(true);

  // 🔴 EI LINE E TOMAR REAL GUMROAD LINK BOSHAO
  const GUMROAD_PRO_URL = "https://bondalayze.gumroad.com/l/owstos";

  useEffect(() => {
    const init = async () => {
      setLoadingUser(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoadingUser(false);

      if (!user) return;

      setUserEmail(user.email ?? null);

      setLoadingPlan(true);
      const { data, error } = await supabase
        .from("bondalayze_plans")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.error(error);
      setPlan(data?.plan === "pro" ? "pro" : "free");
      setLoadingPlan(false);
    };

    init();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-center">
          Bondalayze plans
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Start on Free. During beta, Pro is available via Gumroad.
        </p>

        {userEmail && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Logged in as <span className="text-slate-200">{userEmail}</span> ·{" "}
            {loadingPlan ? (
              <span>checking plan…</span>
            ) : plan === "pro" ? (
              <span className="text-emerald-400">You currently have Pro 🎉</span>
            ) : (
              <span className="text-slate-300">You are on the Free plan</span>
            )}
          </p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Free card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-slate-400">
              For quick personal check-ins.
            </p>
            <p className="mt-4 text-3xl font-bold">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>• Up to 10 analyses per month</li>
              <li>• Relationship scores & summaries</li>
              <li>• Greens & Reds, basic breakup risk</li>
            </ul>

            {plan === "free" && !loadingPlan && (
              <p className="mt-4 text-xs text-emerald-400">
                You&apos;re currently on this plan.
              </p>
            )}
          </div>

          {/* Pro card */}
          <div className="rounded-2xl border border-indigo-500 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Pro (beta)</h2>
            <p className="mt-1 text-sm text-slate-300">
              For couples, friends and coaches who want deeper insight.
            </p>
            <p className="mt-4 text-3xl font-bold">
              $9<span className="text-sm text-slate-400">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-100">
              <li>• Unlimited analyses</li>
              <li>• Higher-quality AI prompts</li>
              <li>• Emotional tone & breakup risk details</li>
              <li>• Attachment styles & conflict patterns</li>
              <li>• Per-space history and exports</li>
            </ul>

            <div className="mt-5 space-y-2 text-[11px] text-slate-300">
              <p>
                🔐 <span className="font-semibold">Beta note:</span> Pro is sold
                through Gumroad while we&apos;re in early access.
              </p>
              <p>
                1) Purchase Pro on Gumroad with your email. <br />
                2) Sign up / log in to Bondalayze using the{" "}
                <span className="font-semibold">same email</span>. <br />
                3) We upgrade your account to Pro manually within 24 hours.
              </p>
            </div>

            {plan === "pro" ? (
              <button
                disabled
                className="mt-4 w-full rounded-full bg-emerald-600 py-2 text-sm font-medium text-white cursor-default"
              >
                You already have Pro 🎉
              </button>
            ) : (
              <a
                href={GUMROAD_PRO_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Upgrade via Gumroad
              </a>
            )}

            {loadingUser && (
              <p className="mt-2 text-xs text-slate-400">
                Log in first to see your current plan.
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          You can stay on Free forever. Pro is optional and helps support
          ongoing development of Bondalayze.
        </p>
      </div>
    </div>
  );
}
