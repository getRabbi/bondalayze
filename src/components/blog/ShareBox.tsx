"use client";

import { useMemo, useState } from "react";

type Props = {
  title: string;
};

export default function ShareBox({ title }: Props) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback: do nothing
    }
  };

  const X = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const FB = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const LI = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const WA = `https://wa.me/?text=${encodedTitle}%0A${encodedUrl}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
      <div className="text-sm font-semibold text-slate-50">Share this post</div>
      <p className="mt-1 text-xs text-slate-300">
        If it helps, send it to someone you care about.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className="rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-[12px] font-medium text-slate-100 hover:border-sky-400/60"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>

        <a
          href={X}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-slate-950/30 px-3 py-2 text-center text-[12px] font-medium text-slate-100 hover:bg-slate-800/60"
        >
          X / Twitter
        </a>

        <a
          href={FB}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-slate-950/30 px-3 py-2 text-center text-[12px] font-medium text-slate-100 hover:bg-slate-800/60"
        >
          Facebook
        </a>

        <a
          href={LI}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-slate-950/30 px-3 py-2 text-center text-[12px] font-medium text-slate-100 hover:bg-slate-800/60"
        >
          LinkedIn
        </a>

        <a
          href={WA}
          target="_blank"
          rel="noreferrer"
          className="col-span-2 rounded-xl bg-emerald-500 px-3 py-2 text-center text-[12px] font-semibold text-slate-950 hover:bg-emerald-400"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
