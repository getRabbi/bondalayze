import { createClient } from "@supabase/supabase-js";
import { mustEnv, slugify, nowIso } from "./utils";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL");
}

const supabase = createClient(
  SUPABASE_URL,
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

export async function slugExists(slug: string) {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  return !!data;
}

export async function getLastPublished() {
  const { data } = await supabase
    .from("blog_posts")
    .select("category,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function countPublishedSince(iso: string) {
  const { count } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", iso);
  return count ?? 0;
}

export async function publishPost(post: any, category: string) {
  const slug = slugify(post.title);

  if (await slugExists(slug)) {
    throw new Error(`Duplicate slug: ${slug}`);
  }

  const cover =
    post.cover_image_url ||
    process.env.BLOG_DEFAULT_COVER_URL ||
    null;

  const { error } = await supabase.from("blog_posts").insert({
    title: post.title,
    slug,
    excerpt: post.excerpt,
    content: post.content_md,
    category,
    tags: post.tags,
    status: "published",
    published_at: nowIso(),
    author: "Bondalayze AI",
    cover_image_url: cover, // 🔥 FIXED
  });

  if (error) throw error;
  return slug;
}
