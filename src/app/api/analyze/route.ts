// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const TEXT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || TEXT_MODEL;

type Plan = "free" | "pro";

type IncomingImage = {
  dataUrl: string; // "data:image/jpeg;base64,..."
};

function clampNumber(n: any, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function toStr(x: any) {
  return typeof x === "string" ? x : "";
}

function truncateForModel(s: string, maxChars = 9000) {
  const cleaned = s.replace(/[ \t]+/g, " ").trim();
  return cleaned.slice(-maxChars);
}

/**
 * STEP 1: Vision extraction (raw, internal only)
 */
async function extractRawTextFromScreenshots(images: IncomingImage[]) {
  const messages: any[] = [
    {
      role: "system",
      content:
        "You transcribe chat screenshots into text. Return VALID JSON only.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: [
            "Task: Transcribe the chat content from screenshots.",
            "Rules:",
            "- Keep the message order exactly.",
            "- Keep each message on its own line.",
            "- Do NOT paraphrase.",
            "- If you see system events like 'Voice call' / 'Missed call', keep them in raw output (we'll clean later).",
            'Return ONLY JSON: { "extracted_text": "..." }',
          ].join("\n"),
        },
        ...images.map((img) => ({
          type: "image_url",
          image_url: { url: img.dataUrl },
        })),
      ],
    },
  ];

  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0.1,
    max_tokens: 1400,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(raw);
    return toStr(parsed.extracted_text);
  } catch (e) {
    console.error("Vision JSON parse error:", e, raw);
    return "";
  }
}

/**
 * STEP 2: Clean-up (remove timestamps + system lines, preserve line breaks)
 */
async function cleanExtractedChatText(rawExtracted: string) {
  const input = rawExtracted.trim();
  if (!input) return "";

  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.0,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You clean chat transcripts. Return VALID JSON only. Never add commentary.",
      },
      {
        role: "user",
        content: `
Clean the chat transcript below.

GOALS:
- Remove timestamps like "3:39 PM", "12:05 AM", "3:06 PM > 3:10 PM", or similar.
- Remove date separators like "Today", "Yesterday", "Mon", "Sun", etc.
- Remove system/event lines like "Voice call", "Video call", "Missed call", call durations, "call", "incoming call", etc.
- Keep message order EXACTLY.
- Keep line breaks: each message should remain on its own line.
- Do NOT rewrite, translate, or paraphrase the message text.
- Preserve mixed languages (Bangla/English/Hindi etc).
- If a line becomes empty after cleaning, drop that line.

Return ONLY JSON:
{ "clean_text": "..." }

TRANSCRIPT:
"""${input}"""
        `.trim(),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(raw);
    return toStr(parsed.clean_text).trim();
  } catch (e) {
    console.error("Clean JSON parse error:", e, raw);
    return input; // fallback
  }
}

async function analyzeConversation(conversation: string) {
  const truncated = truncateForModel(conversation, 9000);

  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.35,
    max_tokens: 450,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a concise relationship conversation analyst. Always respond with VALID JSON ONLY, no extra text.",
      },
      {
        role: "user",
        content: `
Analyze the following conversation between two people.

Rules:
- Treat the first speaker in the log as "you" and the other as "them".
- Be SHORT and COMPACT. Keep every text field under ~25 words.
- Focus on emotional and relational patterns, not grammar.

Return ONLY JSON in this exact shape:

{
  "score": number,
  "summary": string,
  "you_effort": number,
  "them_effort": number,
  "greens": string[],
  "reds": string[],
  "extra": {
    "emotional_tone": "very_negative" | "negative" | "mixed" | "positive" | "very_positive",
    "breakup_risk": "low" | "medium" | "high",
    "attachment_you": string,
    "attachment_them": string,
    "conflict_pattern": string,
    "recommendations": string[]
  }
}

CONVERSATION:
"""${truncated}"""
        `.trim(),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Analyze JSON parse error:", e, raw);
    throw new Error("AI response was not valid JSON");
  }

  parsed.score = clampNumber(parsed.score, 0, 100);
  parsed.you_effort = clampNumber(parsed.you_effort, 0, 100);
  parsed.them_effort = clampNumber(parsed.them_effort, 0, 100);

  if (!Array.isArray(parsed.greens)) parsed.greens = [];
  if (!Array.isArray(parsed.reds)) parsed.reds = [];

  parsed.extra = parsed.extra ?? {};
  parsed.extra.emotional_tone = parsed.extra.emotional_tone ?? "mixed";
  parsed.extra.breakup_risk = parsed.extra.breakup_risk ?? "medium";
  parsed.extra.attachment_you = parsed.extra.attachment_you ?? "mixed";
  parsed.extra.attachment_them = parsed.extra.attachment_them ?? "mixed";
  parsed.extra.conflict_pattern =
    parsed.extra.conflict_pattern ??
    "The conflict pattern was not clearly described.";
  if (!Array.isArray(parsed.extra.recommendations)) {
    parsed.extra.recommendations = [];
  }

  return { parsed, used_text: truncated };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawText = toStr(body?.text ?? "");
    const plan = (body?.plan === "pro" ? "pro" : "free") as Plan;
    const images = (Array.isArray(body?.images) ? body.images : []) as IncomingImage[];

    const maxImages = plan === "pro" ? 3 : 2;
    if (images.length > maxImages) {
      return NextResponse.json(
        { error: `Too many screenshots. Max ${maxImages} for ${plan} plan.` },
        { status: 400 }
      );
    }

    if (!rawText.trim() && images.length === 0) {
      return NextResponse.json(
        { error: "No text or screenshots provided" },
        { status: 400 }
      );
    }

    // 1) raw extraction (internal only)
    let extracted_text_raw = "";
    if (images.length) {
      extracted_text_raw = await extractRawTextFromScreenshots(images);
    }

    // 2) clean extraction (timestamps/system lines removed, line breaks kept)
    let extracted_text = "";
    if (extracted_text_raw.trim()) {
      extracted_text = await cleanExtractedChatText(extracted_text_raw);
    }

    // 3) combine typed text + cleaned extracted
    const combined = [rawText.trim(), extracted_text.trim()]
      .filter(Boolean)
      .join("\n\n");

    // 4) analyze
    const { parsed, used_text } = await analyzeConversation(combined);

    // ✅ PRODUCTION SAFE RESPONSE (no extracted_text_raw)
    return NextResponse.json({
      ...parsed,
      extracted_text, // clean transcript (store + show as Original text)
      used_text,      // what frontend should store & show as original too
    });
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
