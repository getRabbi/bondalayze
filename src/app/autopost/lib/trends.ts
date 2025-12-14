export async function getTrendingIdea() {
  const ideas = [
    {
      title: "Why conversations fade after a good start",
      category: "Dating",
    },
    {
      title: "The silent mistakes couples make after marriage",
      category: "Marriage",
    },
    {
      title: "Why breakups feel harder when you did nothing wrong",
      category: "Breakup",
    },
    {
      title: "How poor communication slowly breaks relationships",
      category: "Communication",
    },
    {
      title: "Self-growth habits that improve every relationship",
      category: "Self-growth",
    },
  ];

  return ideas[Math.floor(Math.random() * ideas.length)];
}
