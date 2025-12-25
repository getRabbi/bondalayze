import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mustEnv } from "../../../autopost/lib/utils";
import { postToFacebook, postToInstagram } from "../../../autopost/publishMeta";
// ❌ REMOVE Pinterest API import
// import { postToPinterest } from "../../../autopost/lib/publishPinterest";

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
  slug: string,
  platform: "facebook" | "instagram" | "pinterest",
  fn: () => Promise<string | void>
) {
  const { data } = await supabase
    .from("social_posts")
    .select("id")
    .eq("slug", slug)
    .eq("platform", platform)
    .maybeSingle();

  if (data) {
    console.log(`⏭️ Already shared on ${platform}:`, slug);
    return;
  }

  const externalId = await fn();

  await supabase.from("social_posts").insert({
    slug,
    platform,
    status: "posted",
    external_id: externalId ?? null,
  });
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔐 cron security
    if (searchParams.get("key") !== mustEnv("CRON_SECRET")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
    await shareIfNotDone(post.slug, "facebook", () =>
      postToFacebook(
        mustEnv("FB_PAGE_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Instagram ----------
    await shareIfNotDone(post.slug, "instagram", () =>
      postToInstagram(
        mustEnv("IG_BUSINESS_ID"),
        fbToken,
        post.cover_image_url,
        caption
      )
    );

    // ---------- Pinterest (NO API / NO TOKEN) ----------
    // ✅ Create a Pinterest share URL instead of calling Pinterest API
    const pinterestShareUrl =
      "https://www.pinterest.com/pin/create/button/?" +
      new URLSearchParams({
        url: postUrl,
        media: post.cover_image_url,
        description: caption,
      }).toString();

    // ✅ Still record as "posted" so it won't repeat (external_id = share url)
    await shareIfNotDone(post.slug, "pinterest", async () => pinterestShareUrl);

    return NextResponse.json({
      ok: true,
      slug: post.slug,
      pinterest_share: pinterestShareUrl, // ✅ return this link
    });
  } catch (e: any) {
    console.error("❌ social autopost failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
