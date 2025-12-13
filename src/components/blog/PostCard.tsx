// src/components/blog/PostCard.tsx
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog/posts";
import { DEFAULT_COVER } from "@/lib/blog/posts";

export default function PostCard({ post }: { post: BlogPost }) {
  const cover = post.image?.startsWith("/") ? post.image : DEFAULT_COVER;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition"
    >
      <div className="relative h-40 w-full">
        <Image
          src={cover}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 420px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
      </div>

      <div className="p-4">
        <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/20 px-2 py-0.5 text-[11px] text-slate-200">
          {post.category}
        </div>

        <h3 className="mt-2 text-sm font-semibold text-slate-50 group-hover:text-sky-200">
          {post.title}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
