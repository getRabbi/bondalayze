import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getPostBySlug,
  getRelatedPosts,
  DEFAULT_COVER,
} from "@/lib/blog/posts";

/* ---------- utils ---------- */
function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[“”"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ---------- related ui ---------- */
function SmallRelatedCard({ p }: { p: any }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className={cn(
        "block rounded-xl border border-slate-800 bg-slate-900/55 p-3",
        "hover:bg-slate-800/60 transition-colors"
      )}
    >
      <div className="text-[11px] text-slate-300">
        {p.category} · {p.readTime}
      </div>
      <div className="mt-1 line-clamp-2 text-[13px] font-semibold text-slate-50">
        {p.title}
      </div>
      {p.excerpt ? (
        <div className="mt-1 line-clamp-2 text-[12px] text-slate-300">
          {p.excerpt}
        </div>
      ) : null}
    </Link>
  );
}

function NextUpCard({ p }: { p: any }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className={cn(
        "group mt-3 block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20",
        "hover:border-sky-400/50 transition-colors"
      )}
    >
      <div className="relative h-36 w-full">
        <Image
          src={p.image || DEFAULT_COVER}
          alt={p.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 1024px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
      </div>

      <div className="p-3">
        <div className="text-[11px] text-slate-300">
          {p.category} · {p.readTime}
        </div>
        <div className="mt-1 line-clamp-2 text-[13px] font-semibold text-slate-50">
          {p.title}
        </div>
        <div className="mt-2 text-[12px] font-semibold text-sky-300">Read →</div>
      </div>
    </Link>
  );
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = getPostBySlug(slug);
  if (!post) notFound();

  const cover = post.image || DEFAULT_COVER;

  // content blocks (simple markdown-ish)
  const blocks = post.content.split("\n\n");

  // TOC: only from "## " headings
  const toc = blocks
    .filter((b) => b.startsWith("## "))
    .map((b) => b.replace("## ", "").trim())
    .map((title) => ({ title, id: slugifyHeading(title) }));

  // related posts
  const related = getRelatedPosts(post, 8);
  const nextUp = related?.[0];
  const moreLikeThis = (related || []).slice(1, 7);

  return (
    <main className="bg-slate-950 text-slate-50">
      <article className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-12">
        {/* No extra navbar */}
        <Link
          href="/blog"
          className="inline-flex text-sm text-sky-200 hover:text-sky-100"
        >
          ← Back to Blog
        </Link>

        {/* ✅ Layout: CENTER (ARTICLE) | RIGHT (Contents + Related) */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
          {/* CENTER: ARTICLE */}
          <div className="min-w-0 mx-auto w-full max-w-[760px]">
            {/* meta row */}
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-300/90">
              <span>{post.category}</span>
              <span>•</span>
              <span>{post.readTime}</span>
              {post.date ? (
                <>
                  <span>•</span>
                  <span>{post.date}</span>
                </>
              ) : null}
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {post.title}
            </h1>

            {/* cover */}
            <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
              <div className="relative h-56 w-full md:h-72">
                <Image
                  src={cover}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 760px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              </div>
            </div>

            {/* content */}
            <div className="prose prose-invert mt-8 max-w-none prose-p:leading-relaxed prose-p:text-slate-200 prose-headings:text-slate-50 prose-strong:text-slate-50">
              {blocks.map((block, i) => {
                // H2
                if (block.startsWith("## ")) {
                  const title = block.replace("## ", "").trim();
                  const id = slugifyHeading(title);
                  return (
                    <h2
                      key={i}
                      id={id}
                      className="mt-10 scroll-mt-28 text-xl font-semibold"
                    >
                      {title}
                    </h2>
                  );
                }

                // bullets
                if (block.startsWith("- ")) {
                  const items = block
                    .split("\n")
                    .filter((x) => x.trim().startsWith("- "))
                    .map((x) => x.replace(/^- /, "").trim());

                  return (
                    <ul key={i} className="mt-4 list-disc pl-6">
                      {items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p key={i} className="mt-4">
                    {block}
                  </p>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Contents/Read (compact) + Related (column) — sticky */}
          <aside className="hidden lg:block sticky top-28 h-fit self-start space-y-4">
            {/* ✅ RIGHT: Contents / Read (compact) */}
            {toc.length > 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="text-xs font-semibold text-slate-300">
                  Contents
                </div>

                <ol className="mt-3 space-y-2 text-[12px] text-slate-300">
                  {toc.slice(0, 12).map((item, idx) => (
                    <li key={item.id} className="flex gap-2">
                      <span className="text-slate-500">{idx + 1})</span>
                      <a
                        href={`#${item.id}`}
                        className="line-clamp-1 hover:text-slate-50"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* ✅ RIGHT: Related posts */}
            {nextUp ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="text-xs font-semibold text-slate-400">
                  Next up
                </div>
                <NextUpCard p={nextUp} />
              </div>
            ) : null}

            {moreLikeThis.length ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="text-xs font-semibold text-slate-300">
                  More like this
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {moreLikeThis.map((p: any) => (
                    <SmallRelatedCard key={p.slug} p={p} />
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {/* Mobile: related at bottom */}
        {related?.length ? (
          <div className="mt-12 lg:hidden">
            <div className="text-sm font-semibold text-slate-50">
              More like this
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.slice(0, 6).map((p: any) => (
                <SmallRelatedCard key={p.slug} p={p} />
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
