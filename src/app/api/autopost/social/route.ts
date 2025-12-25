// src/app/api/autopost/social/route.ts
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

// ---------- helper: prevent double post (DB-backed) ----------
async function shareIfNotDone(
  postId: string,
  platform: "facebook" | "instagram" | "pinterest",
  fn: () => Promise<string | void>
) {
  // ✅ check if already posted
  const { data, error } = await supabase
    .from("social_posts")
    .select("id")
    .eq("post_id", postId)
    .eq("platform", platform)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    console.log(`⏭️ Already shared on ${platform}: post_id=${postId}`);
    return;
  }

  // ✅ post now
  const externalId = await fn();

  // ✅ insert log (and fail loudly if insert fails)
  const { error: insErr } = await supabase.from("social_posts").insert({
    post_id: postId,
    platform,
    status: "posted",
    external_id: externalId ?? null,
  });

  if (insErr) throw insErr;
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
    const { data: post, error: postErr } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    if (postErr) throw postErr;

    if (!post) throw new Error("No published post found");

    if (!post.cover_image_url) {
      throw new Error("Post image missing (required for FB/IG/Pinterest)");
    }

    const siteUrl = mustEnv("SITE_URL").replace(/\/$/, "");
    const postUrl = `${siteUrl}/blog/${post.slug}`;

    const caption = `${post.title}\n\n${post.excerpt ?? ""}\n\n${postUrl}`;

    const fbToken = mustEnv("FB_PAGE_ACCESS_TOKEN");

    // ---------- Facebook ----------
    await shareIfNotDone(post.id, "facebook", () =>
      postToFacebook(
        mustEnv("FB_PAGE_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Instagram ----------
    await shareIfNotDone(post.id, "instagram", () =>
      postToInstagram(
        mustEnv("IG_BUSINESS_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Pinterest ----------
    // ⚠️ Pinterest API approval না থাকলে এটা fail করবে।
    // তবুও duplicate আটকাতে post_id+platform logging থাকবে।
    await shareIfNotDone(post.id, "pinterest", () =>
      postToPinterest(
        mustEnv("PINTEREST_ACCESS_TOKEN"),
        mustEnv("PINTEREST_BOARD_ID"),
        post.title,
        caption,
        postUrl,
        post.cover_image_url
      )
    );

    return NextResponse.json({
      ok: true,
      post_id: post.id,
      slug: post.slug,
    });
  } catch (e: any) {
    console.error("❌ social autopost failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
