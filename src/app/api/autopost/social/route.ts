import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function mustEnv(n: string) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

async function postToFacebook(pageId: string, token: string, imageUrl: string, caption: string) {
  const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
  const body = new URLSearchParams({ url: imageUrl, caption, access_token: token });
  const res = await fetch(url, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Facebook post failed");
  return json;
}

async function postToInstagram(igId: string, token: string, imageUrl: string, caption: string) {
  const createUrl = `https://graph.facebook.com/v19.0/${igId}/media`;
  const createBody = new URLSearchParams({ image_url: imageUrl, caption, access_token: token });
  const cRes = await fetch(createUrl, { method: "POST", body: createBody });
  const cJson = await cRes.json();
  if (!cRes.ok) throw new Error(cJson?.error?.message || "IG container create failed");

  const pubUrl = `https://graph.facebook.com/v19.0/${igId}/media_publish`;
  const pubBody = new URLSearchParams({ creation_id: cJson.id, access_token: token });
  const pRes = await fetch(pubUrl, { method: "POST", body: pubBody });
  const pJson = await pRes.json();
  if (!pRes.ok) throw new Error(pJson?.error?.message || "IG publish failed");
  return pJson;
}

async function postToPinterest(accessToken: string, boardId: string, title: string, description: string, link: string, imageUrl: string) {
  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      board_id: boardId,
      title,
      description,
      link,
      media_source: { source_type: "image_url", url: imageUrl },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Pinterest pin failed");
  return json;
}

async function shareIfNotDone(supabase: any, slug: string, channel: string, fn: () => Promise<any>) {
  const { data: exists } = await supabase
    .from("social_posts")
    .select("post_slug")
    .eq("post_slug", slug)
    .eq("channel", channel)
    .eq("status", "success")
    .maybeSingle();

  if (exists) return { skipped: true };

  const out = await fn();
  await supabase.from("social_posts").insert({
    post_slug: slug,
    channel,
    status: "success",
    remote_id: out?.id ? String(out.id) : null,
  });

  return { skipped: false, out };
}

async function getNextPostForSharing(supabase: any) {
  // এখানে তোমাদের existing autopost DB structure অনুযায়ী select হবে।
  // আমি একটা generic example দিলাম: posts টেবিল থেকে last published কিন্তু social_posts এ নেই এমনটা।
  const { data: posts } = await supabase
    .from("posts")
    .select("slug,title,excerpt,cover_image_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(10);

  if (!posts?.length) return null;

  for (const p of posts) {
    const { data: anyDone } = await supabase
      .from("social_posts")
      .select("post_slug")
      .eq("post_slug", p.slug)
      .eq("status", "success")
      .limit(1);

    if (!anyDone?.length) {
      return {
        slug: p.slug,
        title: p.title,
        caption: p.excerpt || p.title,
        imageUrl: p.cover_image_url,
      };
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key || key !== mustEnv("CRON_SECRET")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const post = await getNextPostForSharing(supabase);
    if (!post) return NextResponse.json({ ok: true, message: "No post to share" });

    if (!post.imageUrl) throw new Error("Post imageUrl missing (need image for FB/IG/Pinterest)");

    const postUrl = `${mustEnv("SITE_URL")}/blog/${post.slug}`;
    const fbToken = mustEnv("FB_PAGE_ACCESS_TOKEN");

    await shareIfNotDone(supabase, post.slug, "facebook", () =>
      postToFacebook(mustEnv("FB_PAGE_ID"), fbToken, post.imageUrl, `${post.caption}\n\n${postUrl}`)
    );

    await shareIfNotDone(supabase, post.slug, "instagram", () =>
      postToInstagram(mustEnv("IG_BUSINESS_ID"), fbToken, post.imageUrl, `${post.caption}\n\n${postUrl}`)
    );

    await shareIfNotDone(supabase, post.slug, "pinterest", () =>
      postToPinterest(
        mustEnv("PINTEREST_ACCESS_TOKEN"),
        mustEnv("PINTEREST_BOARD_ID"),
        post.title,
        post.caption,
        postUrl,
        post.imageUrl
      )
    );

    return NextResponse.json({ ok: true, slug: post.slug });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
