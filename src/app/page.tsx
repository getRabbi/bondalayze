import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Gradient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-slate-950 to-slate-950" />
        <div className="absolute -top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/40">
              <span className="text-lg font-semibold text-sky-300">Bz</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide">
                Bondalayze
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Conversation Insight
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="hover:text-sky-300">
              How it works
            </a>
            <a href="#features" className="hover:text-sky-300">
              Features
            </a>
            <a href="#pricing" className="hover:text-sky-300">
              Pricing
            </a>
            <a href="#faq" className="hover:text-sky-300">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/70 hover:text-sky-300 md:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/analyze"
              className="inline-flex items-center rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-sky-400 md:text-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center md:px-6 md:py-20">
          {/* Left */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] text-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Private AI for emotional clarity — beta access open</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Understand your conversations.{" "}
                <span className="text-sky-300">Protect your heart.</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                Bondalayze reads your chats and highlights emotional tone, effort
                balance, greens & reds, attachment patterns, and gentle next
                steps — in seconds, in private.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
                >
                  Start with 10 free analyses
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-sky-400/80 hover:text-sky-200"
                >
                  View pricing
                </Link>
              </div>
              <p className="text-[11px] text-slate-400">
                No card needed · Not therapy · Just insight
              </p>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full bg-sky-500/70" />
                  <div className="h-6 w-6 rounded-full bg-emerald-500/70" />
                  <div className="h-6 w-6 rounded-full bg-rose-500/70" />
                </div>
                <span>
                  Used by people navigating partners, friends and family dynamics.
                </span>
              </div>
            </div>
          </div>

          {/* Right – mock UI card */}
          <div className="flex-1">
            <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-sky-900/40">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sample analysis</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300">
                  Demo preview
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Relationship score</div>
                  <div className="text-3xl font-semibold text-slate-50">74/100</div>
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div className="text-right">
                    <div className="text-emerald-400">You</div>
                    <div className="text-slate-100">62% effort</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-300">Them</div>
                    <div className="text-slate-100">48% effort</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-900 p-3 text-xs text-slate-200">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                  Summary
                </div>
                <p>
                  Communication is mostly caring but avoidant when stressed. You
                  over-explain; they pull away. Small misunderstandings stack up
                  before being discussed.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-3">
                  <div className="mb-1 font-medium text-emerald-300">Greens</div>
                  <ul className="space-y-1 text-emerald-100">
                    <li>• Honest check-ins after conflict</li>
                    <li>• Both apologize sometimes</li>
                    <li>• Shared future planning</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-700/60 bg-rose-950/40 p-3">
                  <div className="mb-1 font-medium text-rose-300">Reds</div>
                  <ul className="space-y-1 text-rose-100">
                    <li>• Silent treatment after hurt</li>
                    <li>• Repeating old arguments</li>
                    <li>• Fear of being “too much”</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-2">
                  <div className="text-[10px] text-slate-400">Emotional tone</div>
                  <div className="text-sm font-medium text-slate-100">
                    Mixed, slightly anxious
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-2">
                  <div className="text-[10px] text-slate-400">Breakup risk</div>
                  <div className="text-sm font-medium text-amber-300">
                    Medium, pattern-based
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-[11px]">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">
                  Suggested next steps
                </div>
                <ul className="space-y-1 text-slate-100">
                  <li>• Agree on “pause” rules instead of full withdrawal.</li>
                  <li>• Share feelings before they explode into big fights.</li>
                  <li>• Celebrate small improvements out loud.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-slate-800/60">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            How Bondalayze works
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400 md:text-base">
            Three simple steps to move from confusion to clarity.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-300">
                1
              </div>
              <h3 className="text-sm font-semibold">Paste your conversation</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Copy chat messages or write out a summary of what was said. Works
                for partners, friends, family or situationships.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-300">
                2
              </div>
              <h3 className="text-sm font-semibold">
                AI reads emotional patterns
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Bondalayze focuses on tone, effort, triggers and attachment
                patterns — not grammar or “who is right.”
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-300">
                3
              </div>
              <h3 className="text-sm font-semibold">Get gentle next steps</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                You see greens, reds, risks and a few simple suggestions you can
                actually try in real life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-slate-800/60">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            See what you&apos;re really saying to each other
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400 md:text-base">
            Bondalayze turns confusing chats into structured, emotional
            summaries.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-4 text-sm text-slate-200">
              <FeatureItem title="Emotional tone mapping">
                Quickly see if the overall tone is caring, anxious, distant or
                mixed, with a short explanation.
              </FeatureItem>
              <FeatureItem title="Effort breakdown (you vs them)">
                Understand who is texting more, calming more, or fixing more —
                based on your conversation.
              </FeatureItem>
              <FeatureItem title="Greens & Reds">
                Healthy patterns (greens) and warning signs (reds), written in
                plain language instead of therapy jargon.
              </FeatureItem>
              <FeatureItem title="Attachment & conflict patterns">
                Gentle hints if someone seems avoidant, anxious or mixed, plus
                how your fights usually form.
              </FeatureItem>
            </div>
            <div className="space-y-4 text-sm text-slate-200">
              <FeatureItem title="Multiple spaces (relationships)">
                Keep separate spaces for partner, ex, friend, family or
                situationship — each with its own history.
              </FeatureItem>
              <FeatureItem title="Trend tracking (Pro)">
                Watch how your relationship score and tone shift over time
                instead of judging just one bad day.
              </FeatureItem>
              <FeatureItem title="Private by default">
                Your data is tied to your account only. You can delete analyses
                at any time.
              </FeatureItem>
              <FeatureItem title="Built for real humans">
                No blame, no moral lectures — just context and gentle ideas you
                can try.
              </FeatureItem>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="border-b border-slate-800/60">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-semibold md:text-3xl">
              Start free. Upgrade when it feels right.
            </h2>
            <p className="max-w-xl text-sm text-slate-400 md:text-base">
              Free is enough for quick check-ins. Pro is for deeper work on a
              relationship over time.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Free card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-sm text-slate-400">
                For personal clarity and occasional check-ins.
              </p>
              <div className="mt-4 text-3xl font-semibold">$0</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>• Up to 10 analyses per month</li>
                <li>• Score, summary, greens & reds</li>
                <li>• Basic emotional tone & breakup risk</li>
              </ul>
            </div>

            {/* Pro card */}
            <div className="rounded-2xl border border-sky-500 bg-slate-900 p-6 shadow-lg shadow-sky-900/40">
              <div className="mb-1 inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300">
                Early access via Gumroad
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-sm text-slate-300">
                For couples, friends and coaches who want deeper emotional
                insight.
              </p>
              <div className="mt-4 text-3xl font-semibold">
                $9<span className="text-sm text-slate-400"> /month*</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-100">
                <li>• Unlimited analyses</li>
                <li>• Detailed emotional tone & breakup risk</li>
                <li>• Attachment & conflict pattern breakdown</li>
                <li>• Per-space history & trend tracking</li>
                <li>• Priority AI prompts during beta</li>
              </ul>
              <p className="mt-3 text-[11px] text-slate-400">
                *Handled securely via Gumroad. Use the same email on Bondalayze
                and Gumroad. We manually activate Pro during beta.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/pricing"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                  View full pricing
                </Link>
                <Link
                  href="/analyze"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-sky-400/80 hover:text-sky-200"
                >
                  Try free first
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ + PRIVACY */}
      <section id="faq">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr]">
            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">Questions</h2>
              <p className="mt-1 text-sm text-slate-400">
                A few quick answers before you paste your first chat.
              </p>

              <div className="mt-6 space-y-4 text-sm text-slate-200">
                <FaqItem question="Is Bondalayze therapy?">
                  No. Bondalayze is an AI reflection tool, not therapy or a
                  substitute for professional mental health support. It helps you
                  understand patterns, not diagnose or prescribe.
                </FaqItem>
                <FaqItem question="Will Bondalayze tell me to break up?">
                  No. It never makes absolute decisions. It only highlights
                  risks, patterns and possible directions so you can choose what
                  feels right for you.
                </FaqItem>
                <FaqItem question="Is my data private?">
                  Yes. Your analyses are tied to your account only. We don&apos;t
                  share or sell your conversations. You can delete entries at any
                  time.
                </FaqItem>
                <FaqItem question="Who is Bondalayze for?">
                  Anyone trying to understand relationship dynamics — partners,
                  exes, close friends, long-distance, situationships or even
                  family.
                </FaqItem>
                <FaqItem question="How does Pro activation work?">
                  During beta, Pro is sold via Gumroad. You purchase using your
                  email, then log in to Bondalayze with the same email. We
                  activate your Pro plan manually within 24 hours.
                </FaqItem>
              </div>
            </div>

            {/* Privacy card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-lg font-semibold">Privacy & safety</h3>
              <p className="mt-2 text-sm text-slate-300">
                Bondalayze is built around emotional safety — not virality,
                likes or public sharing.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>• Your chats are private to your account</li>
                <li>• No public profiles or feeds</li>
                <li>• You control what to keep and what to delete</li>
                <li>• We focus on clarity, not judgment</li>
              </ul>
              <p className="mt-4 text-xs text-slate-400">
                If a conversation feels overwhelming or unsafe, please also
                consider talking to a trusted friend, family member or licensed
                professional. Bondalayze is meant to support, not replace, real
                human care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] text-slate-500 md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} Bondalayze. Built for emotional clarity.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-sky-300">
              Privacy
            </a>
            <Link href="/pricing" className="hover:text-sky-300">
              Pricing
            </Link>
            <Link href="/analyze" className="hover:text-sky-300">
              Start free
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

type FeatureItemProps = {
  title: string;
  children: React.ReactNode;
};

function FeatureItem({ title, children }: FeatureItemProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-300">{children}</p>
    </div>
  );
}

type FaqItemProps = {
  question: string;
  children: React.ReactNode;
};

function FaqItem({ question, children }: FaqItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <div className="text-[13px] font-semibold text-slate-50">{question}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
        {children}
      </p>
    </div>
  );
}
