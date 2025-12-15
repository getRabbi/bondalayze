import Link from "next/link";
import type { BlogPost } from "@/lib/blog/posts";
import { DEFAULT_COVER } from "@/lib/blog/posts";

export default function FeaturedPost({ post }: { post: BlogPost }) {
  const img = (post as any).image || (post as any).cover_image_url;
  const cover =
    typeof img === "string" && img.trim().length > 0 ? img : DEFAULT_COVER;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
      <div className="relative h-52 w-full md:h-56">
        {/* ✅ FIX: Next/Image -> img */}
        <img
          src={cover}
          alt={post.title}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/20 px-2 py-0.5 text-[11px] text-slate-200">
            Featured · {post.category}
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          >
            Read →
          </Link>
        </div>

        <h2 className="mt-3 text-xl font-semibold text-slate-50 md:text-2xl">
          {post.title}
        </h2>

        <p className="mt-2 text-sm text-slate-300">{post.excerpt}</p>

        <div className="mt-4 text-[11px] text-slate-400">
          {post.date} · {post.readTime}
        </div>
      </div>
    </div>
  );
}
