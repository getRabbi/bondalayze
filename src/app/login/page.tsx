"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  // ✅ default client (persist login like normal)
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  // ✅ split loading states (better UX)
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // ✅ already logged in হলে redirect
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/analyze");
    };
    check();
  }, [supabase, router]);

  // ✅ session-only client (Remember me OFF হলে)
  const getSessionOnlyClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createSupabaseJsClient(url, key, {
      auth: {
        storage: sessionStorage, // ✅ session-only
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  };

  const spinner = (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-950 align-[-3px]" />
  );

  // 🔐 login handler
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || loadingEmail || loadingGoogle || loadingReset)
      return;

    setMessage(null);
    setLoadingEmail(true);

    try {
      const client = rememberMe ? supabase : getSessionOnlyClient();

      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        // ✅ hard nav for clean state
        window.location.replace("/analyze");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoadingEmail(false);
    }
  };

  // 🔐 Google OAuth
  const handleGoogleLogin = async () => {
    if (loadingEmail || loadingGoogle || loadingReset) return;

    setMessage(null);
    setLoadingGoogle(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setMessage(error.message);
        setLoadingGoogle(false);
      }
      // ✅ success হলে browser redirect করবে, তাই loading reset করা লাগবে না
    } catch {
      setMessage("Google login failed. Please try again.");
      setLoadingGoogle(false);
    }
  };

  // 🔁 forgot password handler
  const handleResetPassword = async () => {
    if (!email || loadingEmail || loadingGoogle || loadingReset) return;

    setMessage(null);
    setLoadingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) setMessage(error.message);
      else setResetSent(true);
    } catch {
      setMessage("Could not send reset email.");
    } finally {
      setLoadingReset(false);
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
                {showReset ? "Reset password" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {showReset
                  ? "We’ll email you a reset link."
                  : "Log in to continue your private conversation analysis."}
              </p>
            </div>

            {!showReset ? (
              <>
                {/* Google login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loadingGoogle || loadingEmail || loadingReset}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/30 hover:bg-slate-950/50 px-4 py-2.5 text-sm font-semibold text-slate-100 disabled:opacity-60"
                >
                  {loadingGoogle ? (
                    <span className="inline-flex items-center gap-2">
                      {spinner} Continuing…
                    </span>
                  ) : (
                    <>
                      {/* Google icon */}
                      <svg className="h-4 w-4" viewBox="0 0 48 48">
                        <path
                          fill="#FFC107"
                          d="M43.6 20.5H42V20H24v8h11.3C33.6 32.1 29.2 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.2-.4-3.5z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.3 14.7l6.6 4.8C14.4 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3c-7.7 0-14.4 4.4-17.7 10.7z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M24 43c5.1 0 9.9-2 13.5-5.3l-6.2-5.2C29.2 35 24 35c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.5 39.3 16.2 43 24 43z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.3-6.3 6.5l.1.1 6.2 5.2C33.1 41.1 44 36 44 23c0-1.3-.1-2.2-.4-3.5z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[11px] text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Your password"
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

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowReset(true);
                        setResetSent(false);
                        setMessage(null);
                      }}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingEmail || loadingGoogle || loadingReset}
                    className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold py-2.5 text-slate-950 disabled:opacity-60"
                  >
                    {loadingEmail ? (
                      <span className="inline-flex items-center gap-2">
                        {spinner} Logging in…
                      </span>
                    ) : (
                      "Log in"
                    )}
                  </button>

                  <div className="text-center text-xs text-slate-400">
                    New here?{" "}
                    <a
                      href="/signup"
                      className="text-indigo-300 hover:text-indigo-200 hover:underline"
                    >
                      Create account
                    </a>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                {!resetSent ? (
                  <>
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

                    <button
                      onClick={handleResetPassword}
                      disabled={loadingReset || !email || loadingEmail || loadingGoogle}
                      className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold py-2.5 text-slate-950 disabled:opacity-60"
                    >
                      {loadingReset ? (
                        <span className="inline-flex items-center gap-2">
                          {spinner} Sending…
                        </span>
                      ) : (
                        "Send reset link"
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowReset(false);
                        setResetSent(false);
                        setMessage(null);
                      }}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      ← Back to login
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3">
                      <p className="text-sm text-emerald-300">
                        Reset link sent! Check your email inbox.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowReset(false);
                        setResetSent(false);
                        setMessage(null);
                      }}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      ← Back to login
                    </button>
                  </>
                )}
              </div>
            )}

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
