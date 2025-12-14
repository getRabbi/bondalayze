// src/lib/blog/db.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BlogPost } from "@/lib/blog/posts";

function mapRowToPost(r: any): BlogPost {
  return {
    slug: r.slug,
    title: r.title,
    category: r.category,
    date: r.date || "",
    readTime: r.read_time || "3 min read",
    excerpt: r.excerpt || "",
    image: r.image || undefined,
    author: r.author || "Bondalayze Team",
    tags: r.tags || [],
    content: r.content || "",
  };
}

export async function getAllPublishedPostsFromDB() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapRowToPost);
}

export async function getFeaturedPostFromDB() {
  const all = await getAllPublishedPostsFromDB();
  return all[0] || null;
}

export async function getPostBySlugFromDB(slug: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToPost(data) : null;
}

export async function getRelatedPostsFromDB(post: BlogPost, limit = 8) {
  const all = await getAllPublishedPostsFromDB();
  const others = all.filter((p) => p.slug !== post.slug);

  const byCategory = others.filter((p) => p.category === post.category);
  const byTags =
    post.tags?.length
      ? others.filter((p) => p.tags?.some((t) => post.tags!.includes(t)))
      : [];

  const merged = [...byCategory, ...byTags]
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, limit);

  if (merged.length < limit) {
    const rest = others.filter((p) => !merged.some((m) => m.slug === p.slug));
    merged.push(...rest.slice(0, limit - merged.length));
  }
  return merged;
}
