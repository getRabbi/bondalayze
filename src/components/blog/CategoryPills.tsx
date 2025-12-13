"use client";

import { CATEGORIES, type BlogCategory } from "@/lib/blog/posts";

export default function CategoryPills({
  active,
  onChange,
}: {
  active: BlogCategory | "All";
  onChange: (c: BlogCategory | "All") => void;
}) {
  const pillBase =
    "rounded-full border px-3 py-1 text-[12px] transition whitespace-nowrap";
  const activeCls =
    "border-sky-400/60 bg-sky-500/10 text-sky-200";
  const idleCls =
    "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:text-slate-100";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange("All")}
        className={`${pillBase} ${active === "All" ? activeCls : idleCls}`}
      >
        All
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`${pillBase} ${active === c ? activeCls : idleCls}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
