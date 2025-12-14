"use client";

import { useEffect, useMemo, useState } from "react";

export type TocItem = { title: string; id: string; depth?: number };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function TocClient({
  toc,
  topOffset = 112,
}: {
  toc: TocItem[];
  topOffset?: number;
}) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");

  const ids = useMemo(() => toc.map((t) => t.id), [toc]);

  useEffect(() => {
    if (!ids.length) return;

    const headings = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) =>
            a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1
          );
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: `-${topOffset}px 0px -70% 0px`,
        threshold: [0.01, 0.1, 0.25],
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [ids, topOffset]);

  if (!toc.length) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-300">Contents</div>
        <a
          href="#top"
          className="text-[11px] text-slate-400 hover:text-slate-200"
        >
          Top
        </a>
      </div>

      <ol className="mt-3 space-y-2 text-[12px] text-slate-300">
        {toc.slice(0, 16).map((item, idx) => {
          const active = item.id === activeId;
          const indent = item.depth === 3 ? "pl-4" : "";
          return (
            <li key={item.id} className={cn("flex gap-2", indent)}>
              <span className="text-slate-500">{idx + 1})</span>
              <a
                href={`#${item.id}`}
                className={cn(
                  "line-clamp-1 transition-colors",
                  active ? "text-sky-200" : "hover:text-slate-50"
                )}
                aria-current={active ? "true" : "false"}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
