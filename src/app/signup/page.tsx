"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/browser";




export default function SignupPage() {
  const router = useRouter();
 const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // ✅ ADD THIS redirectTo
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      // ✅ REPLACE your old signUp with this one
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email to confirm your account.");
        // router.push("/login");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="absolute -top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-48 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-indigo-900/30">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Start with 10 free analyses every month.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1 text-sm">
                <label className="block text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-300">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-type password"
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold py-2.5 text-slate-950 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </form>

            {message && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-sm text-slate-200">{message}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>Already have an account?</span>
              <Link
                href="/login"
                className="text-indigo-300 hover:text-indigo-200 hover:underline"
              >
                Log in
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            By signing up, you agree this is not therapy — it’s an AI reflection tool.
          </p>
        </div>
      </div>
    </main>
  );
}
