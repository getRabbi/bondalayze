import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { slugify } from "./lib/utils";
import type { GeneratedPost } from "./lib/openai"; // type-only import

async function main() {
  console.log("🚀 Autopost started");

  const { nextCategory, getTrendingIdea } = await import("./lib/trends");
  const { generatePost } = await import("./lib/openai");
  const { isAdsenseSafe } = await import("./lib/safety");
  const {
    publishPost,
    getLastPublished,
    countPublishedSince,
    slugExists,
  } = await import("./lib/supabase");
  const { generateAndUploadImage } = await import("./lib/image");

  const MAX_POSTS_PER_24H = Number(process.env.MAX_POSTS_PER_24H ?? "3");
  const MIN_HOURS_BETWEEN_POSTS = Number(
    process.env.MIN_HOURS_BETWEEN_POSTS ?? "6"
  );

  // Daily limit
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count24h = await countPublishedSince(since24h);

  console.log("📊 Posts last 24h:", count24h, "limit:", MAX_POSTS_PER_24H);

  if (count24h >= MAX_POSTS_PER_24H) {
    console.log("⏭️ Skip: daily limit reached");
    return;
  }

  // Time gap
  const last = await getLastPublished();

  if (last?.published_at) {
    const diffHours =
      (Date.now() - new Date(last.published_at).getTime()) / (1000 * 60 * 60);

    console.log("⏱️ Hours since last post:", diffHours.toFixed(2));

    if (diffHours < MIN_HOURS_BETWEEN_POSTS) {
      console.log("⏭️ Skip: min hours gap not reached");
      return;
    }
  }

  // Category + idea
  const category = nextCategory(last?.category ?? null);
  const idea = await getTrendingIdea(category);

  console.log("🏷️ Category:", category);
  console.log("🧠 Idea:", idea);

  // Pre-AI duplicate guard
  const predictedSlug = slugify(idea.title);
  if (await slugExists(predictedSlug)) {
    console.log("⏭️ Skip: predicted duplicate slug:", predictedSlug);
    return;
  }

  // Generate blog content
  const post: GeneratedPost = await generatePost(idea);

  if (!isAdsenseSafe(post.content_md)) {
    throw new Error("❌ Content failed AdSense safety check");
  }

  // AI Image (FAIL-SAFE)
  try {
    const imageUrl = await generateAndUploadImage(post.title, category);
    post.cover_image_url = imageUrl;
    console.log("🖼 Image uploaded:", imageUrl);
  } catch (e: any) {
    post.cover_image_url = process.env.BLOG_DEFAULT_COVER_URL || undefined;
    console.log(
      "⚠️ Image generation skipped. Using fallback cover (if configured)."
    );
    console.log("Reason:", e?.message ?? e);
  }

  // Post-AI duplicate guard
  const finalSlug = slugify(post.title);
  if (await slugExists(finalSlug)) {
    console.log("⏭️ Skip: generated duplicate slug:", finalSlug);
    return;
  }

  // Publish
  const slug = await publishPost(post, category);
  console.log("✅ Published:", slug);
}

main().catch((err) => {
  console.error("❌ Autopost failed:", err);
  process.exit(1);
});
