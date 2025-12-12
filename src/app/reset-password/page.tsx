"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const spinner = (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-950 align-[-3px]" />
  );

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMessage(null);

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
      } else {
        // ✅ better than push (clean state)
        window.location.replace("/login");
      }
    } catch {
      setMessage("Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] text-slate-50">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-[#050510] to-[#050510]" />
        <div className="absolute -top-44 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-52 right-10 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-indigo-900/30">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Set a new password
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Choose a strong password (minimum 6 characters).
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1 text-sm">
                <label className="block text-slate-300">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 pr-12 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/60"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <label className="block text-slate-300">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 pr-12 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/60"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold py-2.5 text-slate-950 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    {spinner} Updating…
                  </span>
                ) : (
                  "Update password"
                )}
              </button>

              <div className="text-center text-xs text-slate-400">
                Remembered your password?{" "}
                <a
                  href="/login"
                  className="text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  Go to login
                </a>
              </div>
            </form>

            {message && (
              <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3">
                <p className="text-sm text-rose-200">{message}</p>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Bondalayze is a reflection tool — not therapy.
          </p>
        </div>
      </div>
    </main>
  );
}
