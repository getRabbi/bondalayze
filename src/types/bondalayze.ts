// src/types/bondalayze.ts

export type BondalayzeFlag = {
  label: string;
  severity?: "low" | "medium" | "high";
  strength?: "soft" | "solid" | "strong";
  explanation: string;
};

export type BondalayzeSuggestion = {
  title: string;
  message: string;
  tone: "gentle" | "direct" | "boundary";
};

export type BondalayzeResult = {
  overall_health_score: number; // 0-100

  summary: string;

  you_vs_them_effort: {
    you_score: number; // 0-100
    them_score: number; // 0-100
    analysis: string;
  };

  reply_behavior: {
    avg_reply_minutes_you: number | null;
    avg_reply_minutes_them: number | null;
    silence_risk_score: number; // 0-100
    notes: string;
    double_text_advice: string;
  };

  red_flags: BondalayzeFlag[];
  green_flags: BondalayzeFlag[];

  attachment_style: {
    you: string;
    them: string;
    note: string;
  };

  compatibility: {
    score: number; // 0-100
    summary: string;
    strengths: string[];
    risks: string[];
  };

  forecast: {
    ghosting_risk: number; // %
    improvement_chance: number; // %
    next_7_days_outlook: string;
  };

  suggestions: BondalayzeSuggestion[];
};
