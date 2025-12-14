"use client";

import { useMemo, useState } from "react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ShareBarClient({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  const encodedUrl = encodeURIComponent(url || "");
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-3">
      <div className="text-[12px] text-slate-300">
        Share this post with someone who needs it.
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className={cn(
            "rounded-full border px-3 py-1 text-[12px] transition",
            copied
              ? "border-sky-400/70 bg-sky-500/10 text-sky-200"
              : "border-slate-700 bg-slate-950/20 text-slate-200 hover:border-slate-500"
          )}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>

        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-700 bg-slate-950/20 px-3 py-1 text-[12px] text-slate-200 hover:border-slate-500"
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
