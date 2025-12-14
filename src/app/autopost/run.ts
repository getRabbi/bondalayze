import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("ENV_CHECK_OPENAI:", !!process.env.OPENAI_API_KEY);
console.log("ENV_CHECK_MODEL:", process.env.OPENAI_MODEL || "(not set)");

async function main() {
  const { getTrendingIdea } = await import("./lib/trends");
  const { generatePost } = await import("./lib/openai");
  const { isAdsenseSafe } = await import("./lib/safety");
  const { publishPost } = await import("./lib/supabase");

  console.log("🚀 Autopost started");

  const idea = await getTrendingIdea();
  console.log("🧠 Idea:", idea);

  const post = await generatePost({
    idea: idea.title,
    category: idea.category,
  });

  if (!isAdsenseSafe(post.content_md)) {
    throw new Error("❌ Content failed AdSense safety check");
  }

  const slug = await publishPost(post, idea.category);
  console.log("✅ Published:", slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
