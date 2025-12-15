export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import type { BlogCategory } from "@/lib/blog/posts";
import { DEFAULT_COVER } from "@/lib/blog/posts";

import ShareBarClient from "./ShareBarClient";

// remark / rehype
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";

// SEO + fast load (ISR)
// export const revalidate = 60;

/* ---------- types ---------- */
type DbPost = {
  id: string;
  title: string;
  slug: string;
  category: BlogCategory;
  tags: string[] | null;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  status: string;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ---------- utils ---------- */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function minutesRead(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  return `${mins} min read`;
}

type TocRow = { title: string; id: string; depth: number };

async function renderMarkdownWithToc(md: string): Promise<{
  html: string;
  toc: TocRow[];
}> {
  const toc: TocRow[] = [];
  const parseTree = unified().use(remarkParse).use(remarkGfm).parse(md);

  const sluggerForToc = new GithubSlugger();
  visit(parseTree, "heading", (node: any) => {
    const depth = node.depth as number;
    if (depth < 2 || depth > 3) return;

    const text = (node.children ?? [])
      .filter((c: any) => c.type === "text" || c.type === "inlineCode")
      .map((c: any) => c.value ?? "")
      .join("")
      .trim();

    if (!text) return;
    const id = sluggerForToc.slug(text);
    toc.push({ title: text, id, depth });
  });

  const addIds = () => (tree: any) => {
    const s = new GithubSlugger();
    visit(tree, "heading", (node: any) => {
      const depth = node.depth as number;
      if (depth < 2 || depth > 3) return;

      const text = (node.children ?? [])
        .filter((c: any) => c.type === "text" || c.type === "inlineCode")
        .map((c: any) => c.value ?? "")
        .join("")
        .trim();

      if (!text) return;
      const id = s.slug(text);

      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = id;
    });
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(addIds)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);

  return { html: String(file), toc };
}

/* ---------- related ui ---------- */
function SmallRelatedCard({ p }: { p: DbPost }) {
  const date = (p.published_at ?? "").slice(0, 10);
  return (
    <Link
      href={`/blog/${p.slug}`}
      className={cn(
        "block rounded-2xl border border-slate-800 bg-slate-900/55 p-3",
        "hover:bg-slate-800/60 transition-colors"
      )}
    >
      <div className="text-[11px] text-slate-300">
        {p.category} · {minutesRead(p.content)} {date ? `· ${date}` : ""}
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

function NextUpCard({ p }: { p: DbPost }) {
  const cover = p.cover_image_url || DEFAULT_COVER;

  return (
    <Link
      href={`/blog/${p.slug}`}
      className={cn(
        "group mt-3 block overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/20",
        "hover:border-sky-400/50 transition-colors"
      )}
    >
      <div className="relative h-36 w-full">
        {/* ✅ FIX: Next/Image -> img */}
        <img
          src={cover}
          alt={p.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
      </div>

      <div className="p-3">
        <div className="text-[11px] text-slate-300">
          {p.category} · {minutesRead(p.content)}
        </div>
        <div className="mt-1 line-clamp-2 text-[13px] font-semibold text-slate-50">
          {p.title}
        </div>
        <div className="mt-2 text-[12px] font-semibold text-sky-300">Read →</div>
      </div>
    </Link>
  );
}

/* ---------- Static Params ---------- */
export async function generateStaticParams() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  if (error) return [];
  return (data ?? [])
    .map((r: any) => r?.slug)
    .filter(Boolean)
    .map((slug: string) => ({ slug }));
}

/* ---------- page ---------- */
export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") return notFound();

  const supabase = getSupabaseAdmin();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(
      "id,title,slug,category,tags,excerpt,content,cover_image_url,published_at,status"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<DbPost>();

  if (error) throw new Error(error.message);
  if (!post) return notFound();

  const cover = post.cover_image_url || DEFAULT_COVER;
  const readTime = minutesRead(post.content);
  const date = (post.published_at ?? "").slice(0, 10);

  const { html } = await renderMarkdownWithToc(post.content);

  const { data: relRows } = await supabase
    .from("blog_posts")
    .select(
      "id,title,slug,category,tags,excerpt,content,cover_image_url,published_at,status"
    )
    .eq("status", "published")
    .eq("category", post.category)
    .neq("slug", post.slug)
    .order("published_at", { ascending: false })
    .limit(8);

  const related = (relRows ?? []) as DbPost[];
  const nextUp = related?.[0];
  const moreLikeThis = related.slice(1, 7);

  return (
    <main className="bg-slate-950 text-slate-50">
      <div id="top" />

      <article className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/blog"
              className="inline-flex text-sm text-sky-200 hover:text-sky-100"
            >
              ← Back to Blog
            </Link>

            <div className="hidden md:flex items-center gap-2 text-[12px] text-slate-400">
              <span>{post.category}</span>
              <span>•</span>
              <span>{readTime}</span>
              {date ? (
                <>
                  <span>•</span>
                  <span>{date}</span>
                </>
              ) : null}
            </div>
          </div>

          <ShareBarClient title={post.title} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
          <section className="min-w-0">
            <div className="mx-auto w-full max-w-[780px]">
              <div className="md:hidden flex flex-wrap items-center gap-2 text-[12px] text-slate-300/90">
                <span>{post.category}</span>
                <span>•</span>
                <span>{readTime}</span>
                {date ? (
                  <>
                    <span>•</span>
                    <span>{date}</span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-3 text-sm text-slate-300 md:text-base">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
                <div className="relative h-56 w-full md:h-80">
                  {/* ✅ FIX: Next/Image -> img */}
                  <img
                    src={cover}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                </div>
              </div>

              <div
                className={cn(
                  "prose prose-invert mt-8 max-w-none",
                  "prose-p:leading-relaxed prose-p:text-slate-200",
                  "prose-headings:text-slate-50 prose-strong:text-slate-50",
                  "prose-a:text-sky-200 hover:prose-a:text-sky-100",
                  "prose-code:text-slate-100",
                  // ✅ better list spacing
                  "prose-ul:my-4 prose-ol:my-4 prose-li:my-1",
                  "prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2",
                  "prose-h2:scroll-mt-28 prose-h3:scroll-mt-28"
                )}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </section>

          <aside className="hidden lg:block sticky top-28 h-fit self-start space-y-4">
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
                  {moreLikeThis.map((p) => (
                    <SmallRelatedCard key={p.slug} p={p} />
                  ))}
                </div>
              </div>
            ) : null}

            {!nextUp && !moreLikeThis.length ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="text-xs font-semibold text-slate-300">
                  Related posts
                </div>
                <div className="mt-3 text-[12px] text-slate-400">
                  Nothing related yet.
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {related.length ? (
          <div className="mt-12 lg:hidden">
            <div className="text-sm font-semibold text-slate-50">
              More like this
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.slice(0, 6).map((p) => (
                <SmallRelatedCard key={p.slug} p={p} />
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
