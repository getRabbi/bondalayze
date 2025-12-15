import { mustEnv } from "./utils";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** ✅ exported so run.ts + supabase.ts can import */
export type GeneratedPost = {
  title: string;
  excerpt: string;
  content_md: string;
  tags: string[];
  cover_image_url?: string; // ✅ image pipeline
};

// ---------- helpers ----------
function safeJsonExtract(s: string): any {
  try {
    return JSON.parse(s);
  } catch {}

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const maybe = s.slice(start, end + 1);
    return JSON.parse(maybe);
  }

  throw new Error("Model did not return valid JSON.");
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t ?? "").trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ""))
    .slice(0, 12);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2
): Promise<Response> {
  let lastErr: any = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        lastErr = new Error(`OpenAI HTTP ${res.status}`);
        await sleep(800 * (i + 1));
        continue;
      }

      const txt = await res.text().catch(() => "");
      throw new Error(`OpenAI HTTP ${res.status}: ${txt.slice(0, 400)}`);
    } catch (e) {
      lastErr = e;
      if (i < retries) {
        await sleep(800 * (i + 1));
        continue;
      }
      throw lastErr;
    }
  }

  throw lastErr;
}

function buildPrompt(input: { title: string; category: string }) {
  return `
You are a relationship psychology writer.

Write an AdSense-safe, SEO-optimized blog post.

Topic: ${input.title}
Category: ${input.category}

Hard Rules (must follow):
- 1500–2000 words (aim ~1700)
- Calm, educational tone (no drama, no hate)
- No explicit/sexual content, no medical/legal claims
- Use clean Markdown
- Use ONLY:
  - H2 headings with "## "
  - H3 headings with "### "
- Use short paragraphs (2–4 lines max)
- Lists must be proper markdown:
  - leave ONE blank line before a list
  - each bullet starts with "- "
  - leave ONE blank line after a list
- Include at least:
  - 1 short intro
  - 5–8 H2 sections
  - 1 H2 section: "Practical steps you can try today" with bullet points
  - 1 H2 section: "Common mistakes to avoid" with bullet points
  - 1 H2 section: "When to seek support" (safe, general)
- End with a gentle self-growth reflection (H2 section)

SEO rules:
- Put the primary keyword naturally in the first paragraph.
- Use related keywords across headings (no keyword stuffing).
- Excerpt should be 140–170 characters, friendly and clear.

Return ONLY valid JSON (no backticks, no extra text) with:
{
  "title": string,
  "excerpt": string,
  "content_md": string,
  "tags": string[]
}
`.trim();
}

async function callOpenAI(params: {
  key: string;
  prompt: string;
  withResponseFormat: boolean;
}) {
  const body: any = {
    model: MODEL,
    messages: [{ role: "user", content: params.prompt }],
    temperature: 0.7,
  };

  if (params.withResponseFormat) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error(
      `OpenAI response missing content. Raw: ${JSON.stringify(data).slice(0, 500)}`
    );
  }

  return raw;
}

// ---------- main ----------
export async function generatePost(
  input: { title: string; category: string }
): Promise<GeneratedPost> {
  const OPENAI_KEY = mustEnv("OPENAI_API_KEY");
  const prompt = buildPrompt(input);

  let raw: string;

  try {
    raw = await callOpenAI({ key: OPENAI_KEY, prompt, withResponseFormat: true });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("Unknown parameter") && msg.includes("response_format")) {
      raw = await callOpenAI({
        key: OPENAI_KEY,
        prompt,
        withResponseFormat: false,
      });
    } else {
      throw e;
    }
  }

  const parsed = safeJsonExtract(raw) as Partial<GeneratedPost>;

  const title = String(parsed.title ?? input.title).trim();
  const excerpt = String(parsed.excerpt ?? "").trim();
  const content_md = String(parsed.content_md ?? "").trim();
  const tags = normalizeTags(parsed.tags);

  if (!title || !excerpt || !content_md) {
    throw new Error(
      `Generated JSON missing fields. Got: ${JSON.stringify(
        {
          titleOk: !!title,
          excerptOk: !!excerpt,
          contentOk: !!content_md,
          tagsLen: tags.length,
        },
        null,
        2
      )}`
    );
  }

  return { title, excerpt, content_md, tags };
}
