"use client";

import { useEffect, useMemo, useState } from "react";

type TocItem = { id: string; title: string };

export default function TocSpy({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  useEffect(() => {
    if (!ids.length) return;

    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // visible entries থেকে সবচেয়ে উপরে যেটা আছে সেটাকে active ধরি
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop
          );

        if (visible.length) {
          setActiveId((visible[0].target as HTMLElement).id);
        }
      },
      {
        root: null,
        // header height consider করে highlight smooth হবে
        rootMargin: "-120px 0px -70% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="text-xs font-semibold text-slate-400">Contents</div>

      <ul className="mt-3 max-h-[560px] overflow-auto pr-1 space-y-1 text-[13px] text-slate-300">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={[
                  "block rounded-lg px-2 py-1 transition",
                  isActive
                    ? "bg-sky-500/10 text-sky-200 border border-sky-500/20"
                    : "hover:bg-slate-800/60 hover:text-slate-50",
                ].join(" ")}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
