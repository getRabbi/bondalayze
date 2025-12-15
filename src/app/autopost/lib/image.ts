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

// ---------- mood mapper ----------
function coupleMood(category: string) {
  switch (category.toLowerCase()) {
    case "dating":
      return "a happy attractive young couple, smiling, romantic but respectful";
    case "breakup":
      return "a sad emotional couple sitting apart, feeling distant and thoughtful";
    case "marriage":
      return "a calm married couple, sense of trust, mature relationship";
    case "communication":
      return "a couple talking seriously, healthy communication, neutral emotion";
    case "self-growth":
      return "a reflective couple, soft expressions, personal growth mood";
    default:
      return "a realistic couple in a calm emotional moment";
  }
}

type ImagesApiOk = {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string };
};

export async function generateAndUploadImage(title: string, category: string) {
  const OPENAI_KEY = mustEnv("OPENAI_API_KEY");

  const prompt = `
A realistic high-quality lifestyle photograph of a heterosexual couple.

Scene:
${coupleMood(category)}

Context:
Inspired by the article topic: "${title}"

Photography style:
- ultra realistic DSLR photo
- natural human faces and skin texture
- cinematic soft lighting
- shallow depth of field
- modern lifestyle setting
- emotionally engaging but subtle

Rules:
- NOT cartoon
- NOT illustration
- NOT anime
- NO text
- NO watermark
- NO nudity
- NO sexual activity
- AdSense safe
- Mental-health friendly
`.trim();

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024",
    }),
  });

  const raw = await resp.text();

  let json: ImagesApiOk;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Image API returned invalid JSON");
  }

  if (!resp.ok || json.error) {
    throw new Error(json?.error?.message || "Image generation failed");
  }

  const first = json.data?.[0];
  if (!first) {
    throw new Error("No image returned from API");
  }

  let buffer: Buffer;

  if (first.b64_json) {
    buffer = Buffer.from(first.b64_json, "base64");
  } else if (first.url) {
    const img = await fetch(first.url);
    if (!img.ok) throw new Error("Failed to download image URL");
    buffer = Buffer.from(await img.arrayBuffer());
  } else {
    throw new Error("Image data missing");
  }

  const fileName = `ai/${slugify(title)}-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("blog-images")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("blog-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
