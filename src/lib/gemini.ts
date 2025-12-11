// src/lib/gemini.ts

import type { BondalayzeResult } from "@/types/bondalayze";

// Fallback mock result: jodi API key / quota / JSON error hoy
const fallbackMock: BondalayzeResult = {
  overall_health_score: 65,
  summary:
    "This is a demo analysis using a local fallback because the Gemini API quota or request format is not available right now.",

  you_vs_them_effort: {
    you_score: 70,
    them_score: 55,
    analysis:
      "You seem to take more initiative and send more frequent, longer messages. They respond, but with less consistency and intensity than you.",
  },
  reply_behavior: {
    avg_reply_minutes_you: 10,
    avg_reply_minutes_them: 45,
    silence_risk_score: 60,
    notes:
      "Your replies are quick and steady, while theirs are slower and more irregular. This can create anxiety for you during long gaps.",
    double_text_advice:
      "Instead of double-texting quickly, wait a bit longer and give them space to initiate sometimes. This will show you how much effort they want to invest.",
  },
  red_flags: [
    {
      label: "Uneven initiative",
      severity: "medium",
      explanation:
        "Over time, you might feel drained if you keep carrying most of the emotional and conversational load without naming how you feel.",
    },
  ],
  green_flags: [
    {
      label: "Warm tone when engaged",
      strength: "solid",
      explanation:
        "When they are present, their tone doesn’t feel cold or hostile, which means there is genuine care, even if it is not perfectly expressed.",
    },
  ],
  attachment_style: {
    you: "anxious-leaning (very responsive, worries during silence)",
    them: "slightly avoidant-leaning (needs more space, slower replies)",
    note: "This is just a gentle guess from texting patterns, not any clinical label or diagnosis.",
  },
  compatibility: {
    score: 70,
    summary:
      "You can work well together if expectations around texting and effort are talked through honestly, with kindness on both sides.",
    strengths: [
      "Capacity for warm, playful connection.",
      "You care deeply and try to understand the other person.",
    ],
    risks: [
      "You may over-give while they stay more passive.",
      "Unspoken expectations around reply speed can create tension.",
    ],
  },
  forecast: {
    ghosting_risk: 40,
    improvement_chance: 65,
    next_7_days_outlook:
      "If you slow your pace slightly and share your feelings gently instead of over-apologising or chasing, the dynamic can feel more balanced and less stressful.",
  },
  suggestions: [
    {
      title: "Soft expectations message",
      tone: "gentle",
      message:
        "I like talking with you, and sometimes I overthink when replies are slow. No pressure at all, but it helps me when I have a rough idea of how often you like to chat 🙂",
    },
    {
      title: "Balance your effort",
      tone: "boundary",
      message:
        "I realised I’m usually the one starting our chats and keeping things going. I’m going to slow down a little so there’s more space for you to reach out too.",
    },
    {
      title: "Clarity check",
      tone: "direct",
      message:
        "Can I ask honestly how you see this connection? I don’t need a perfect answer, just enough to know we’re on the same page.",
    },
  ],
};

const MODEL_NAME = "gemini-2.0-flash-001";

export async function analyzeConversationWithGemini(
  chatText: string
): Promise<BondalayzeResult> {
  const apiKey = process.env.BONDALAYZE_GEMINI_API_KEY;

  // Jodi kono key na thake -> direct fallback
  if (!apiKey) {
    console.warn("No Gemini API key set. Using fallback mock result.");
    return fallbackMock;
  }

  const systemPrompt = `
You are Bondalayze, a gentle relationship pattern analyzer.
You read chat logs between "ME" and "THEM" and return a single JSON object.

Rules:
- Be kind and non-judgmental.
- Do NOT sound like a therapist or give medical/clinical advice.
- Don't tell the user what to do with their entire relationship; only comment on chat patterns.
- Never mention that you are an AI model. Speak neutrally in the analysis fields.

You MUST return ONLY valid JSON that matches this TypeScript type exactly:

type BondalayzeResult = {
  overall_health_score: number;
  summary: string;

  you_vs_them_effort: {
    you_score: number;
    them_score: number;
    analysis: string;
  };

  reply_behavior: {
    avg_reply_minutes_you: number | null;
    avg_reply_minutes_them: number | null;
    silence_risk_score: number;
    notes: string;
    double_text_advice: string;
  };

  red_flags: {
    label: string;
    severity: "low" | "medium" | "high";
    explanation: string;
  }[];

  green_flags: {
    label: string;
    strength: "soft" | "solid" | "strong";
    explanation: string;
  }[];

  attachment_style: {
    you: string;
    them: string;
    note: string;
  };

  compatibility: {
    score: number;
    summary: string;
    strengths: string[];
    risks: string[];
  };

  forecast: {
    ghosting_risk: number;
    improvement_chance: number;
    next_7_days_outlook: string;
  };

  suggestions: {
    title: string;
    message: string;
    tone: "gentle" | "direct" | "boundary";
  }[];
};

If something is impossible to infer, still pick a soft, reasonable guess and clearly phrase it as a gentle impression, not a fact.
Remember: the response MUST be pure JSON, no markdown, no backticks.
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              systemPrompt +
              "\n\nNow here is the chat transcript to analyze:\n\n" +
              chatText,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
    },
  };

  let res: Response;

  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
  } catch (networkError) {
    console.error("Network error calling Gemini, using fallback:", networkError);
    return fallbackMock;
  }

  // Quota / rate-limit / config error -> fallback
  if (!res.ok) {
    const text = await res.text();
    console.error("Gemini error (non-OK status), using fallback:", text);
    return fallbackMock;
  }

  const data = await res.json();

  const candidateText: string | undefined =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    console.error("Gemini returned no text, using fallback.");
    return fallbackMock;
  }

  try {
    const parsed = JSON.parse(candidateText) as BondalayzeResult;
    return parsed;
  } catch (e) {
    console.error("JSON parse error from Gemini, using fallback:", e);
    return fallbackMock;
  }
}
