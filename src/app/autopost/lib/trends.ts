export const CATS = [
  "Dating",
  "Marriage",
  "Breakup",
  "Communication",
  "Self-growth",
] as const;

export type Cat = (typeof CATS)[number];

const IDEAS: Record<Cat, string[]> = {
  Dating: [
    "Why conversations fade after a good start",
    "Short replies vs low interest: what it really means",
    "When texting feels one-sided: how to respond calmly",
  ],
  Marriage: [
    "The silent mistakes couples make after marriage",
    "How to handle money talks without fighting",
    "Small daily habits that protect marriage long-term",
  ],
  Breakup: [
    "Why breakups feel harder when you did nothing wrong",
    "How to stop checking their messages after a breakup",
    "Closure without contact: moving on peacefully",
  ],
  Communication: [
    "How poor communication slowly breaks relationships",
    "How to argue without disrespect",
    "What to do when they avoid serious talks",
  ],
  "Self-growth": [
    "Self-growth habits that improve every relationship",
    "How to build emotional boundaries without guilt",
    "Confidence after rejection: a gentle rebuild plan",
  ],
};

export function nextCategory(last?: string | null): Cat {
  const idx = last ? CATS.indexOf(last as Cat) : -1;
  return CATS[(idx + 1 + CATS.length) % CATS.length];
}

export async function getTrendingIdea(category: Cat) {
  const pool = IDEAS[category];
  const title = pool[Math.floor(Math.random() * pool.length)];
  return { title, category } as const;
}
