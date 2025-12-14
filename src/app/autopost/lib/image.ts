import { mustEnv, slugify } from "./utils";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
}

const supabase = createClient(
  SUPABASE_URL,
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

type ImagesApiOk = {
  data?: Array<{ url?: string }>;
  error?: { message?: string; type?: string; code?: string };
};

export async function generateAndUploadImage(title: string, category: string) {
  const OPENAI_KEY = mustEnv("OPENAI_API_KEY");

  const prompt = `Create a calm, minimal editorial illustration for a relationship psychology blog.

Theme: ${category}
Concept: ${title}

Style:
- soft lighting
- pastel/neutrals
- abstract human figures or symbolic objects
- no text
- no nudity
- no explicit romance
- ad-friendly, mental-health safe
`;

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // ✅ keep it simple & compatible
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
    }),
  });

  const rawText = await resp.text();
  let json: ImagesApiOk | null = null;

  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Image API returned non-JSON (status ${resp.status}): ${rawText.slice(
        0,
        200
      )}`
    );
  }

  if (!resp.ok || json?.error) {
    const msg =
      json?.error?.message ||
      `Image API failed (status ${resp.status}): ${rawText.slice(0, 200)}`;
    throw new Error(msg);
  }

  const url = json?.data?.[0]?.url;
  if (!url) {
    throw new Error(
      `Image generation failed: missing URL. Raw: ${rawText.slice(0, 200)}`
    );
  }

  // download image bytes
  const img = await fetch(url);
  if (!img.ok) {
    throw new Error(`Image URL download failed (status ${img.status})`);
  }
  const arr = await img.arrayBuffer();
  const buffer = Buffer.from(arr);

  const fileName = `ai/${slugify(title)}-${Date.now()}.png`;

  const { error: upErr } = await supabase.storage
    .from("blog-images")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}
