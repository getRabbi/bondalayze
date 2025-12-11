// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = (body?.text ?? "") as string;

    if (!rawText.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // --- token save: compress + last chunk only ---
    const cleaned = rawText.replace(/\s+/g, " ").trim();
    const truncated = cleaned.slice(-8000); // last ~8k chars

    const completion = await openai.chat.completions.create({
      model: MODEL,
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
  "score": number,                      // 0–100 overall relationship health
  "summary": string,                    // 2–3 short sentences, max ~35 words
  "you_effort": number,                 // 0–100 approximate effort from "you"
  "them_effort": number,                // 0–100 approximate effort from "them"
  "greens": string[],                   // 2–5 positive behaviors, each < 15 words
  "reds": string[],                     // 2–5 problems, each < 15 words
  "extra": {
    "emotional_tone": "very_negative" | "negative" | "mixed" | "positive" | "very_positive",
    "breakup_risk": "low" | "medium" | "high",
    "attachment_you": string,          // like "secure", "anxious", "avoidant", or "mixed"
    "attachment_them": string,         // same style as above
    "conflict_pattern": string,        // 1–2 small sentences about how conflicts play out
    "recommendations": string[]        // 3–5 practical, gentle tips, each < 18 words
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
      console.error("JSON parse error:", e, raw);
      return NextResponse.json(
        { error: "AI response was not valid JSON" },
        { status: 500 }
      );
    }

    // basic sanitising + defaults
    const clamp = (n: any, min: number, max: number) =>
      Math.min(max, Math.max(min, Number.isFinite(Number(n)) ? Number(n) : 0));

    parsed.score = clamp(parsed.score, 0, 100);
    parsed.you_effort = clamp(parsed.you_effort, 0, 100);
    parsed.them_effort = clamp(parsed.them_effort, 0, 100);

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

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
