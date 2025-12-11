export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        {/* Hero */}
        <section className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400" />
              Gentle relationship analytics, not therapy.
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Read between the texts.
              <br />
              <span className="text-sky-400">
                Bondalayze your conversations.
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl">
              Paste your real chats, and let AI highlight effort, patterns, and
              gentle next steps — without judgment, drama, or screenshots.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/analyze"
                className="rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-white hover:bg-sky-400"
              >
                Start analyzing
              </a>
              <a
                href="/pricing"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
              >
                See plans
              </a>
              <span className="text-[11px] text-slate-500">
                No screenshots stored · per-space history
              </span>
            </div>
          </div>

          {/* Fake preview */}
          <div className="flex-1 w-full">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>Bondalayze · Demo</span>
                <span className="rounded-full bg-slate-800 px-2 py-[2px] text-[10px]">
                  Free vs Pro view
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 text-xs">
                  <div className="border border-slate-800 rounded-2xl p-3">
                    <div className="text-[11px] text-slate-400">Score</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-semibold text-emerald-400">
                        78/100
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Healthy but avoidant
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-2xl p-3">
                    <div className="text-[11px] text-slate-400 mb-1">
                      Summary
                    </div>
                    <p className="text-[12px] text-slate-100">
                      You both care, but conflict is avoided. More direct
                      check-ins would make things feel safer.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-emerald-700/60 bg-emerald-950/60 rounded-2xl p-2">
                      <div className="text-[11px] text-emerald-300 font-semibold mb-1">
                        Greens
                      </div>
                      <ul className="space-y-1 text-[11px]">
                        <li>Frequent emotional check-ins</li>
                        <li>Shared humor under stress</li>
                      </ul>
                    </div>
                    <div className="border border-rose-700/60 bg-rose-950/60 rounded-2xl p-2">
                      <div className="text-[11px] text-rose-300 font-semibold mb-1">
                        Reds
                      </div>
                      <ul className="space-y-1 text-[11px]">
                        <li>Important topics delayed</li>
                        <li>One-sided apology pattern</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                    <div className="text-[11px] text-slate-400 mb-1">
                      Deep insight (Pro)
                    </div>
                    <div className="blur-[2px] pointer-events-none select-none">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Emotional tone: mixed</span>
                        <span>Breakup risk: low</span>
                      </div>
                      <p className="text-[11px] text-slate-200">
                        You show anxious-leaning attachment, they avoid direct
                        conflict. Weekly check-ins could rebalance effort.
                      </p>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85">
                      <span className="text-[11px] text-slate-100 font-semibold mb-1">
                        Unlock deep insight
                      </span>
                      <p className="text-[11px] text-slate-400 mb-2 text-center px-4">
                        Get tone, attachment styles & gentle recommendations
                        with Bondalayze Pro.
                      </p>
                      <a
                        href="/pricing"
                        className="text-[11px] rounded-full border border-indigo-500 px-3 py-[4px] text-indigo-200 hover:bg-indigo-500 hover:text-white"
                      >
                        View Pro plan
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-slate-500">
                Names are never stored. You control what you paste, and you can
                clear a space any time.
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mt-14 grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold mb-1">Couples</h3>
            <p className="text-xs text-slate-300">
              Check if effort feels balanced, track tension phases, and get
              gentle prompts for harder talks.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold mb-1">Friends & family</h3>
            <p className="text-xs text-slate-300">
              Notice when someone keeps apologising, or when you&apos;re always
              the planner.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold mb-1">Coaches & helpers</h3>
            <p className="text-xs text-slate-300">
              Quickly summarise client chats into patterns and talking points —
              without manual note-taking.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-10 border-t border-slate-800 pt-8 text-sm">
          <h2 className="text-base font-semibold mb-3">How Bondalayze works</h2>
          <div className="grid gap-4 md:grid-cols-3 text-xs text-slate-300">
            <div>
              <div className="text-slate-100 font-semibold mb-1">
                1. Paste chats
              </div>
              <p>From WhatsApp, Messenger, anywhere. You can delete them any time.</p>
            </div>
            <div>
              <div className="text-slate-100 font-semibold mb-1">
                2. Get a score & patterns
              </div>
              <p>See effort split, greens & reds, plus risk level and tone.</p>
            </div>
            <div>
              <div className="text-slate-100 font-semibold mb-1">
                3. Reflect, not panic
              </div>
              <p>
                Use the insights as gentle prompts for conversations — not as
                final truth.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
