"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type ExtraAnalysis = {
  emotional_tone: "very_negative" | "negative" | "mixed" | "positive" | "very_positive";
  breakup_risk: "low" | "medium" | "high";
  attachment_you: string;
  attachment_them: string;
  conflict_pattern: string;
  recommendations: string[];
};

type AnalysisResult = {
  score: number;
  summary: string;
  you_effort: number;
  them_effort: number;
  greens: string[];
  reds: string[];
  extra?: ExtraAnalysis | null;
};

type SavedAnalysis = {
  id: string;
  created_at: string;
  input_text: string;
  result: AnalysisResult;
};

// ---- AI API call (real OpenAI via /api/analyze) ----
async function callAiAnalysis(input: string): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input }),
  });

  if (!res.ok) {
    console.error("AI API error:", await res.text());
    throw new Error("AI API error");
  }

  const data = (await res.json()) as AnalysisResult;
  return data;
}

// breakup risk badge styles
function getRiskBadgeClasses(risk?: string) {
  switch (risk) {
    case "low":
      return "bg-emerald-950 text-emerald-400 border-emerald-700/60";
    case "high":
      return "bg-rose-950 text-rose-400 border-rose-700/60";
    case "medium":
      return "bg-amber-950 text-amber-400 border-amber-700/60";
    default:
      return "bg-slate-900 text-slate-300 border-slate-700/60";
  }
}

export default function AnalyzePage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // current user load
  useEffect(() => {
    const loadUser = async () => {
      setLoadingUser(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("auth.getUser error:", error);
      }

      setUserEmail(user?.email ?? null);
      setLoadingUser(false);
    };

    loadUser();
  }, [supabase]);

  // load analysis history
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHistory([]);
        setLoadingHistory(false);
        return;
      }

      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("load history error:", error);
        setHistory([]);
      } else {
        const mapped: SavedAnalysis[] =
          data?.map((row: any) => ({
            id: row.id,
            created_at: row.created_at,
            input_text: row.input_text,
            result: {
              score: row.score,
              summary: row.summary,
              you_effort: row.you_effort,
              them_effort: row.them_effort,
              greens: row.greens ?? [],
              reds: row.reds ?? [],
              extra: row.extra ?? null,
            },
          })) ?? [];

        setHistory(mapped);
        if (mapped.length && !selectedId) {
          setSelectedId(mapped[0].id);
        }
      }

      setLoadingHistory(false);
    };

    fetchHistory();
  }, [supabase, selectedId]);

  const selectedItem =
    history.find((h) => h.id === selectedId) ?? history[0] ?? null;

  // trend chart data (score over time)
  const trendData = useMemo(
    () =>
      history
        .slice()
        .reverse()
        .map((item) => ({
          id: item.id,
          label: new Date(item.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          score: item.result.score,
        })),
    [history]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in with Supabase auth first.");
        return;
      }

      // ---- REAL AI ANALYSIS CALL ----
      const result = await callAiAnalysis(input.trim());

      // save to Supabase table
      const { data, error } = await supabase
        .from("conversation_analyses")
        .insert({
          user_id: user.id,
          input_text: input.trim(),
          score: result.score,
          summary: result.summary,
          you_effort: result.you_effort,
          them_effort: result.them_effort,
          greens: result.greens,
          reds: result.reds,
          extra: result.extra ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error("insert error:", error);
        alert("Could not save analysis (DB error). Check console.");
        return;
      }

      const newItem: SavedAnalysis = {
        id: data.id,
        created_at: data.created_at,
        input_text: data.input_text,
        result: {
          score: data.score,
          summary: data.summary,
          you_effort: data.you_effort,
          them_effort: data.them_effort,
          greens: data.greens ?? [],
          reds: data.reds ?? [],
          extra: data.extra ?? null,
        },
      };

      setHistory((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      setInput("");
    } catch (err) {
      console.error(err);
      alert("AI analysis failed. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    const ok = confirm("Delete this analysis?");
    if (!ok) return;

    const { error } = await supabase
      .from("conversation_analyses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("delete error:", error);
      alert("Failed to delete.");
      return;
    }

    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (selectedId === id) {
      setSelectedId(
        history.find((h) => h.id !== id)?.id ?? null
      );
    }
  };

  const handleClearAll = async () => {
    const ok = confirm("Delete ALL analyses for this user?");
    if (!ok) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("conversation_analyses")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("clear error:", error);
      alert("Failed to clear all.");
      return;
    }

    setHistory([]);
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      {/* LEFT: input & header */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            Conversation Analyzer
            <span className="ml-2 text-xs text-sky-400">Supabase auth</span>
          </h1>

          <div className="text-xs text-right">
            {loadingUser ? (
              <span className="text-slate-400">Checking session…</span>
            ) : userEmail ? (
              <>
                <div className="text-slate-300">Signed in</div>
                <div className="text-slate-400">{userEmail}</div>
              </>
            ) : (
              <span className="text-rose-400">
                Not signed in – go to login page first.
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-slate-300">
            Paste conversation text:
          </label>
          <textarea
            className="w-full h-48 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Paste chat / messages here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

        <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="px-4 py-2 rounded-xl bg-sky-500 disabled:bg-slate-700 text-sm font-medium hover:bg-sky-400 transition"
            >
              {submitting ? "Analyzing…" : "Analyze & Save"}
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={!history.length}
              className="px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-40"
            >
              Clear all history
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-400">
          🔐 Data saving per-user {" "}
          <code>conversation_analyses</code> table-e.
        </p>
      </div>

      {/* RIGHT: history + details */}
      <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6 gap-4">
        <h2 className="text-lg font-semibold">History</h2>

        {/* Trend chart */}
        {history.length >= 2 && (
          <div className="w-full border border-slate-800 rounded-2xl p-3 bg-slate-950">
            <div className="text-xs text-slate-400 mb-1">
              Relationship health trend
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {loadingHistory ? (
          <div className="text-sm text-slate-400">Loading history…</div>
        ) : !history.length ? (
          <div className="text-sm text-slate-500">
            No saved analyses yet. Paste a conversation and click{" "}
            <span className="text-sky-400">Analyze &amp; Save</span>.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* history list */}
            <div className="w-full md:w-1/3 max-h-[420px] overflow-auto space-y-2 pr-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left text-xs border rounded-xl p-2 ${
                    selectedItem?.id === item.id
                      ? "border-sky-500 bg-slate-900"
                      : "border-slate-800 bg-slate-950 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">
                      Score {item.result.score}
                    </span>

                    {item.result.extra?.breakup_risk && (
                      <span
                        className={
                          "ml-1 px-2 py-[1px] rounded-full border text-[10px] " +
                          getRiskBadgeClasses(item.result.extra.breakup_risk)
                        }
                      >
                        {item.result.extra.breakup_risk} risk
                      </span>
                    )}

                    <span className="ml-auto text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {item.input_text}
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400">
                      You {item.result.you_effort}%
                    </span>
                    <span className="text-[10px] text-amber-400">
                      Them {item.result.them_effort}%
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteOne(item.id);
                      }}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Delete
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* detail panel */}
            <div className="w-full md:w-2/3 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-sm bg-slate-950">
              {selectedItem ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">
                        Analysis score
                      </div>
                      <div className="text-2xl font-semibold">
                        {selectedItem.result.score}/100
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {new Date(
                        selectedItem.created_at
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex-1">
                      <div className="text-emerald-400 font-semibold">
                        You
                      </div>
                      <div>{selectedItem.result.you_effort}% effort</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-amber-400 font-semibold">
                        Them
                      </div>
                      <div>{selectedItem.result.them_effort}% effort</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Summary
                    </div>
                    <p className="text-sm text-slate-100">
                      {selectedItem.result.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-emerald-400 font-semibold mb-1">
                        Greens ✅
                      </div>
                      <ul className="space-y-1">
                        {selectedItem.result.greens.map((g, idx) => (
                          <li
                            key={idx}
                            className="bg-emerald-950/60 border border-emerald-700/50 rounded-lg px-2 py-1"
                          >
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-rose-400 font-semibold mb-1">
                        Reds ⚠️
                      </div>
                      <ul className="space-y-1">
                        {selectedItem.result.reds.map((r, idx) => (
                          <li
                            key={idx}
                            className="bg-rose-950/60 border border-rose-700/50 rounded-lg px-2 py-1"
                          >
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* EXTRA ANALYSIS PANEL */}
                  {selectedItem.result.extra && (
                    <div className="flex flex-col gap-3 text-xs mt-2">
                      {/* Emotional tone + breakup risk */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Emotional tone
                          </div>
                          <div className="text-sm font-semibold">
                            {(
                              selectedItem.result.extra?.emotional_tone ??
                              "mixed"
                            ).replace("_", " ")}
                          </div>
                        </div>
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Breakup risk
                          </div>
                          <div className="text-sm font-semibold">
                            {selectedItem.result.extra?.breakup_risk ?? "medium"}
                          </div>
                        </div>
                      </div>

                      {/* attachment styles */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Your attachment style
                          </div>
                          <div className="text-sm">
                            {selectedItem.result.extra?.attachment_you ??
                              "mixed / unclear"}
                          </div>
                        </div>
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Their attachment style
                          </div>
                          <div className="text-sm">
                            {selectedItem.result.extra?.attachment_them ??
                              "mixed / unclear"}
                          </div>
                        </div>
                      </div>

                      {/* conflict pattern */}
                      <div className="border border-slate-800 rounded-xl p-3">
                        <div className="text-[11px] text-slate-400 mb-1">
                          Conflict pattern
                        </div>
                        <p className="text-sm text-slate-100">
                          {selectedItem.result.extra?.conflict_pattern ??
                            "The conflict pattern was not clearly described."}
                        </p>
                      </div>

                      {/* recommendations */}
                      {selectedItem.result.extra.recommendations?.length ? (
                        <div className="border border-slate-800 rounded-xl p-3">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Suggested next steps
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-[13px] text-slate-100">
                            {selectedItem.result.extra.recommendations.map(
                              (r, idx) => (
                                <li key={idx}>{r}</li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Original text
                    </div>
                    <pre className="text-xs bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-40 overflow-auto whitespace-pre-wrap">
                      {selectedItem.input_text}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm">
                  Select an analysis from the left side to see details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
