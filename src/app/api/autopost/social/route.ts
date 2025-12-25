import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mustEnv } from "../../../autopost/lib/utils";
import { postToFacebook, postToInstagram } from "../../../autopost/publishMeta";
import { postToPinterest } from "../../../autopost/lib/publishPinterest";

// ---------- Supabase ----------
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("Missing env: SUPABASE_URL");
}

const supabase = createClient(
  SUPABASE_URL,
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

// ---------- helper: prevent double post ----------
async function shareIfNotDone(
  postId: string,
  slug: string,
  platform: "facebook" | "instagram" | "pinterest",
  postUrl: string,
  fn: () => Promise<string | void>
) {
  // ✅ check if already shared
  const { data } = await supabase
    .from("social_posts")
    .select("id")
    .eq("post_id", postId)
    .eq("platform", platform)
    .maybeSingle();

  if (data) {
    console.log(`⏭️ Already shared on ${platform}:`, slug);
    return;
  }

  const externalId = await fn();

  // ✅ FIX: url column is NOT NULL in your DB
  const { error } = await supabase.from("social_posts").insert({
    post_id: postId,
    slug,
    platform,
    url: postUrl, // 🔥 important
    status: "posted",
    external_id: externalId ?? null,
  });

  if (error) throw error;
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔐 cron security
    if (searchParams.get("key") !== mustEnv("CRON_SECRET")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ---------- latest published post ----------
    const { data: post } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    if (!post) throw new Error("No published post found");

    if (!post.cover_image_url) {
      throw new Error("Post image missing (required for FB/IG/Pinterest)");
    }

    const siteUrl = mustEnv("SITE_URL").replace(/\/$/, "");
    const postUrl = `${siteUrl}/blog/${post.slug}`;

    const caption = `${post.title}\n\n${post.excerpt ?? ""}\n\n${postUrl}`;

    const fbToken = mustEnv("FB_PAGE_ACCESS_TOKEN");

    // ---------- Facebook ----------
    await shareIfNotDone(post.id, post.slug, "facebook", postUrl, () =>
      postToFacebook(
        mustEnv("FB_PAGE_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Instagram ----------
    await shareIfNotDone(post.id, post.slug, "instagram", postUrl, () =>
      postToInstagram(
        mustEnv("IG_BUSINESS_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Pinterest (optional) ----------
    // ✅ token / board না থাকলে Pinterest skip করবে (error না)
    const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
    const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;

    if (PINTEREST_ACCESS_TOKEN && PINTEREST_BOARD_ID) {
      await shareIfNotDone(post.id, post.slug, "pinterest", postUrl, () =>
        postToPinterest(
          mustEnv("PINTEREST_ACCESS_TOKEN"),
          mustEnv("PINTEREST_BOARD_ID"),
          post.title,
          caption,
          postUrl,
          post.cover_image_url
        )
      );
    } else {
      console.log("⏭️ Pinterest skipped (missing token/board id)");
    }

    return NextResponse.json({ ok: true, slug: post.slug });
  } catch (e: any) {
    console.error("❌ social autopost failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
