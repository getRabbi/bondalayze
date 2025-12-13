// src/lib/blog/posts.ts

export type BlogCategory =
  | "Dating"
  | "Marriage"
  | "Breakup"
  | "Communication"
  | "Self-growth";

export type BlogPost = {
  slug: string;
  title: string;
  category: BlogCategory;
  date: string; // YYYY-MM-DD
  readTime: string; // "4 min read"
  excerpt: string;
  image?: string; // "/blog/xxx.jpg"
  author?: string;
  tags?: string[];
  content: string; // simple markdown-like: "## " headings + paragraphs + "- " bullets
};

export const DEFAULT_COVER = "/blog/cover-default.jpg";

export const CATEGORIES: (BlogCategory | "All")[] = [
  "All",
  "Dating",
  "Marriage",
  "Breakup",
  "Communication",
  "Self-growth",
];

// ✅ এখানে পোস্ট add করলেই /blog এ অটো দেখাবে
export const POSTS: BlogPost[] = [
  {
    slug: "what-one-sided-texting-feels-like-over-time",
    title: "What One-Sided Texting Feels Like Over Time",
    category: "Communication",
    date: "2025-12-14",
    readTime: "4 min read",
    excerpt:
      "Sometimes it’s not one bad day — it’s a pattern that quietly builds until you feel tired without knowing why.",
    image: "/blog/one-sided-texting.jpg",
    author: "Bondalayze Team",
    tags: ["effort", "patterns", "boundaries"],
    content:
      `Over-explaining is often a way to prevent misunderstanding.

## What “one-sided” really means
It’s not about who texts more — it’s about who carries emotional repair, clarity, and follow-up.

- You initiate most check-ins
- You repair after conflict more often
- You feel anxious waiting for replies

## Why it happens
Sometimes the other person is avoidant, distracted, or simply not as invested.

## What to try
Start small: one honest sentence + one boundary.

- “I feel unsure when replies take days.”
- “Can we agree on a simple check-in routine?”`,
  },
  {
    slug: "dry-replies-vs-low-interest-how-it-shows-up",
    title: "Dry Replies vs Low Interest: How It Shows Up",
    category: "Dating",
    date: "2025-12-13",
    readTime: "3 min read",
    excerpt:
      "A calm way to notice signals without jumping to conclusions — especially in the early talking stage.",
    image: "/blog/dry-replies.jpg",
    author: "Bondalayze Team",
    tags: ["dating", "signals", "communication"],
    content:
      `## Dry replies can be temporary
People get busy, stressed, or overwhelmed.

## Low interest is usually consistent
If the pattern stays the same for weeks, it’s data — not a mood.

- No curiosity about you
- No follow-up questions
- No effort to plan

## What to do next
Ask one simple question, then observe actions — not promises.`,
  },
  {
    slug: "why-we-over-explain-when-we-feel-unsafe",
    title: "Why We Over-Explain When We Feel Unsafe",
    category: "Self-growth",
    date: "2025-12-12",
    readTime: "5 min read",
    excerpt:
      "When anxiety spikes, clarity can turn into looping reassurance — and both people end up exhausted.",
    image: "/blog/over-explain.jpg",
    author: "Bondalayze Team",
    tags: ["anxiety", "attachment", "self-growth"],
    content:
      `## A softer way to look at it
Sometimes it’s a request for safety.

## A gentle reflection
When you stop explaining, what fear shows up first?

- “They’ll misunderstand me.”
- “They’ll leave.”
- “I’ll be seen as too much.”

## One small shift
Try: one clear sentence, then pause. Let the other person respond.`,
  },
];

// ---------- helpers ----------
export function getAllPosts() {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string) {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

export function getFeaturedPost() {
  return getAllPosts()[0] || null;
}

export function getAdjacentPosts(slug: string) {
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function getRelatedPosts(post: BlogPost, limit = 3) {
  const all = getAllPosts().filter((p) => p.slug !== post.slug);
  const byCategory = all.filter((p) => p.category === post.category);
  const byTags =
    post.tags?.length
      ? all.filter((p) => p.tags?.some((t) => post.tags!.includes(t)))
      : [];
  const merged = [...byCategory, ...byTags]
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, limit);

  // fallback
  if (merged.length < limit) {
    const rest = all.filter((p) => !merged.some((m) => m.slug === p.slug));
    merged.push(...rest.slice(0, limit - merged.length));
  }
  return merged;
}
