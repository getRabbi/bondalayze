// src/app/blog/BlogClient.tsx
"use client";

import { useMemo, useState } from "react";
import FeaturedPost from "@/components/blog/FeaturedPost";
import PostCard from "@/components/blog/PostCard";
// import AdSlot from "@/components/blog/AdSlot";

const CATEGORIES = [
  "All",
  "Dating",
  "Marriage",
  "Breakup",
  "Communication",
  "Self-growth",
] as const;

export type UiPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  excerpt: string;
  image?: string;
  readTime: string;
  date?: string;
  content: string;
};

export default function BlogClient({
  featured,
  posts,
}: {
  featured: UiPost | null;
  posts: UiPost[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [limit, setLimit] = useState(6);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return posts.filter((p) => {
      const okCat = cat === "All" ? true : p.category === cat;
      const okQ =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.excerpt ?? "").toLowerCase().includes(query) ||
        (p.tags?.join(" ").toLowerCase().includes(query) ?? false);

      return okCat && okQ;
    });
  }, [posts, q, cat]);

  const shown = filtered.slice(0, limit);
  const canLoadMore = filtered.length > shown.length;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-slate-950 to-slate-950" />
        <div className="absolute -top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold md:text-4xl">Blog</h1>
          <p className="text-sm text-slate-300 md:text-base">
            Relationship communication, explained gently.
          </p>
        </div>

        {/* Search */}
        <div className="mt-6">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(6);
            }}
            placeholder='Search posts (e.g., "one-sided texting")'
            className="w-full appearance-none rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-400/60"
          />
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => {
                  setCat(c);
                  setLimit(6);
                }}
                className={
                  "rounded-full border px-3 py-1 text-[12px] transition " +
                  (active
                    ? "border-sky-400/70 bg-sky-500/10 text-sky-100"
                    : "border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-500")
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Top Ad slot */}
        {/* <div className="mt-8">
          <AdSlot label="Blog header ad" />
        </div> */}

        {/* Featured */}
        {featured ? (
          <div className="mt-8">
            {/* NOTE: FeaturedPost যদি BlogPost টাইপ expect করে, তাহলে এখানে cast রাখা হলো */}
            <FeaturedPost post={featured as any} />
          </div>
        ) : null}

        {/* Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((post) => (
            <PostCard key={post.slug} post={post as any} />
          ))}
        </div>

        {/* Mid Ad slot */}
        {/* <div className="mt-10">
          <AdSlot label="Blog mid ad" />
        </div> */}

        {/* Load more */}
        <div className="mt-8 flex justify-center">
          {canLoadMore ? (
            <button
              onClick={() => setLimit((x) => x + 6)}
              className="rounded-full border border-slate-700 bg-slate-900/50 px-5 py-2 text-sm text-slate-100 hover:border-sky-400/60 hover:text-sky-200"
            >
              Load more
            </button>
          ) : (
            <div className="text-xs text-slate-500">No more posts.</div>
          )}
        </div>

        {/* Bottom CTA (premium) */}
        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-lg font-semibold">Try Bondalayze</div>
          <p className="mt-1 text-sm text-slate-300">
            Paste a conversation and get a gentle summary — in private.
          </p>
          <a
            href="/analyze"
            className="mt-4 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Try an analysis →
          </a>
        </div>
      </section>
    </main>
  );
}
