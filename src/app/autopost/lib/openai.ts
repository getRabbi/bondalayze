import { mustEnv } from "./utils";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function generatePost(input: { title: string; category: string }) {
  const OPENAI_KEY = mustEnv("OPENAI_API_KEY");

  const prompt = `
You are a relationship psychology writer.

Write an AdSense-safe, SEO-optimized blog post.

Topic: ${input.title}
Category: ${input.category}

Rules:
- 1500–2000 words
- Calm, educational tone
- No explicit/sexual content
- Use H2 and H3 headings
- End with a gentle self-growth reflection

Return ONLY valid JSON with:
{
  "title": string,
  "excerpt": string,
  "content_md": string,
  "tags": string[]
}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response missing content");

  return JSON.parse(content) as {
    title: string;
    excerpt: string;
    content_md: string;
    tags: string[];
    cover_image_url?: string;
  };
}
