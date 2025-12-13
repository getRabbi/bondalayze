"use client";

import { useEffect, useState } from "react";

export default function ShareBar({ title }: { title: string }) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  const share = async () => {
    // @ts-ignore
    if (navigator.share) {
      // @ts-ignore
      await navigator.share({ title, url: window.location.href });
      return;
    }
    copy();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span>Reading</span>
        <span>{progress}%</span>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
        <div
          className="h-1.5 rounded-full bg-sky-400 transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className="rounded-xl border border-slate-700 bg-slate-950/20 px-3 py-2 text-[12px] text-slate-100 hover:border-sky-400/60"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <button
          onClick={share}
          className="rounded-xl bg-sky-500 px-3 py-2 text-[12px] font-semibold text-slate-950 hover:bg-sky-400"
        >
          Share
        </button>
      </div>
    </div>
  );
}
