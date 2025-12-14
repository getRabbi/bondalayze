import { createClient } from "@supabase/supabase-js";
import { mustEnv, slugify, nowIso } from "./utils";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

export async function publishPost(post: any, category: string) {
  const slug = slugify(post.title);

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
  });

  if (error) throw error;
  return slug;
}
