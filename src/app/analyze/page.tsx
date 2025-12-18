"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ✅ IMPORTANT: Use SAME client everywhere (login/signup/profile এর মতো)
import { createClient } from "@/lib/supabaseClient";

type ExtraAnalysis = {
  emotional_tone:
    | "very_negative"
    | "negative"
    | "mixed"
    | "positive"
    | "very_positive";
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

type AnalyzeApiResponse = AnalysisResult & {
  extracted_text?: string;
  used_text?: string; // ✅ what we store + show as original
};

type SavedAnalysis = {
  id: string;
  created_at: string;
  input_text: string; // ✅ this will be used_text (typed + extracted)
  result: AnalysisResult;
};

type Plan = "free" | "pro";

type PlanInfo = {
  plan: Plan;
  monthlyLimit: number | null; // free = 10, pro = null (unlimited)
  usedThisMonth: number;
  loading: boolean;
};

type Space = {
  id: string;
  name: string;
  created_at: string;
};

type HistoryFilter = "all" | "7" | "30";

type Shot = {
  id: string;
  name: string;
  dataUrl: string; // compressed data url
};

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

// ---- AI API call ----
async function callAiAnalysis(
  input: string,
  plan: Plan,
  screenshots: Shot[]
): Promise<AnalyzeApiResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input,
      plan,
      images: screenshots.map((s) => ({ dataUrl: s.dataUrl })),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("AI API error:", t);
    throw new Error(t || "AI API error");
  }

  return (await res.json()) as AnalyzeApiResponse;
}

// ---- client-side image compression ----
async function compressToDataUrl(
  file: File,
  maxW = 1400,
  quality = 0.82
): Promise<string> {
  const imgUrl = URL.createObjectURL(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imgUrl;
  });

  const w = img.width;
  const h = img.height;

  const scale = Math.min(1, maxW / w);
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, tw, th);

  URL.revokeObjectURL(imgUrl);

  // Always JPEG for size (chat screenshots fine)
  return canvas.toDataURL("image/jpeg", quality);
}

export default function AnalyzePage() {
  // ✅ Single consistent client
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [planInfo, setPlanInfo] = useState<PlanInfo>({
    plan: "free",
    monthlyLimit: 10,
    usedThisMonth: 0,
    loading: true,
  });

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [shots, setShots] = useState<Shot[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  // ✅ auth loader + watcher
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoadingUser(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) console.error("auth.getUser error:", error);
        if (cancelled) return;

        const u = data.user ?? null;
        setUser(u);
        setUserEmail(u?.email ?? null);
        setLoadingUser(false);

        if (!u) router.replace("/login");
      } catch (e) {
        console.error("auth init error:", e);
        if (!cancelled) {
          setUser(null);
          setUserEmail(null);
          setLoadingUser(false);
          router.replace("/login");
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      setUserEmail(u?.email ?? null);
      setLoadingUser(false);
      if (!u) router.replace("/login");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // ✅ plan + monthly usage
  useEffect(() => {
    let cancelled = false;

    const fetchPlanAndUsage = async () => {
      if (!user) {
        setPlanInfo((prev) => ({ ...prev, loading: false }));
        return;
      }

      setPlanInfo((prev) => ({ ...prev, loading: true }));

      try {
        const { data: planRow, error: planError } = await supabase
          .from("bondalayze_plans")
          .select("plan")
          .eq("user_id", user.id)
          .maybeSingle();

        if (planError) console.error("plan fetch error:", planError);

        const plan: Plan = planRow?.plan === "pro" ? "pro" : "free";
        const monthlyLimit: number | null = plan === "pro" ? null : 10;

        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from("conversation_analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", start.toISOString());

        if (countError) console.error("usage count error:", countError);

        const used = typeof count === "number" ? count : 0;

        if (cancelled) return;

        setPlanInfo({
          plan,
          monthlyLimit,
          usedThisMonth: used,
          loading: false,
        });
      } catch (e) {
        console.error("fetchPlanAndUsage error:", e);
        if (!cancelled) setPlanInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchPlanAndUsage();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  // ✅ load spaces (mandatory → auto-select OFF)
  useEffect(() => {
    let cancelled = false;

    const fetchSpaces = async () => {
      setLoadingSpaces(true);
      try {
        if (!user) {
          if (!cancelled) {
            setSpaces([]);
            setSelectedSpaceId(null);
          }
          return;
        }

        const { data, error } = await supabase
          .from("conversation_spaces")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("load spaces error:", error);
          setSpaces([]);
          setSelectedSpaceId(null);
        } else {
          const list = (data ?? []) as Space[];
          setSpaces(list);

          setSelectedSpaceId((prev) => {
            if (prev && list.some((s) => s.id === prev)) return prev;
            return null; // ✅ no auto pick
          });
        }
      } catch (e) {
        console.error("fetchSpaces error:", e);
        if (!cancelled) {
          setSpaces([]);
          setSelectedSpaceId(null);
        }
      } finally {
        if (!cancelled) setLoadingSpaces(false);
      }
    };

    fetchSpaces();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  // ✅ load history for selected space
  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoadingHistory(true);

      try {
        if (!user || !selectedSpaceId) {
          if (!cancelled) {
            setHistory([]);
            setSelectedId(null);
          }
          return;
        }

        const { data, error } = await supabase
          .from("conversation_analyses")
          .select("*")
          .eq("user_id", user.id)
          .eq("space_id", selectedSpaceId)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (error) {
          console.error("load history error:", error);
          setHistory([]);
          setSelectedId(null);
          return;
        }

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
        setSelectedId((prev) => {
          if (prev && mapped.some((m) => m.id === prev)) return prev;
          return mapped.length ? mapped[0].id : null;
        });
      } catch (e) {
        console.error("fetchHistory error:", e);
        if (!cancelled) {
          setHistory([]);
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [supabase, user, selectedSpaceId]);

  // history filter
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    if (historyFilter === "all") return history;

    const days = historyFilter === "7" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return history.filter((item) => new Date(item.created_at) >= cutoff);
  }, [history, historyFilter]);

  const selectedItem =
    filteredHistory.find((h) => h.id === selectedId) ??
    filteredHistory[0] ??
    null;

  const maxShots = planInfo.plan === "pro" ? 3 : 2;

  const canSubmit =
    !!selectedSpaceId &&
    (input.trim().length > 0 || shots.length > 0) &&
    !submitting;

  const onPickShots = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const incoming = Array.from(files);

    const remaining = Math.max(0, maxShots - shots.length);
    if (remaining <= 0) {
      alert(`Max ${maxShots} screenshots allowed for this plan.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const toAdd = incoming.slice(0, remaining);

    try {
      const compressed = await Promise.all(
        toAdd.map(async (f) => {
          const dataUrl = await compressToDataUrl(f, 1400, 0.82);
          return {
            id: crypto.randomUUID(),
            name: f.name,
            dataUrl,
          } as Shot;
        })
      );

      setShots((prev) => [...prev, ...compressed]);
    } catch (e) {
      console.error(e);
      alert("Could not process screenshots. Try smaller images.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeShot = (id: string) => {
    setShots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!selectedSpaceId) {
      alert("Select a space first.");
      return;
    }

    // ✅ monthly quota check (free=10)
    if (
      !planInfo.loading &&
      planInfo.monthlyLimit !== null &&
      planInfo.usedThisMonth >= planInfo.monthlyLimit
    ) {
      alert("Free plan limit reached (10 analyses this month).");
      return;
    }

    setSubmitting(true);

    try {
      if (!user) {
        alert("Please log in first.");
        router.replace("/login");
        return;
      }

      const apiRes = await callAiAnalysis(input.trim(), planInfo.plan, shots);

      const usedText =
        (apiRes.used_text && apiRes.used_text.trim()) ||
        [input.trim(), apiRes.extracted_text?.trim()].filter(Boolean).join("\n\n") ||
        input.trim() ||
        "(extracted from screenshots)";

      const result: AnalysisResult = {
        score: apiRes.score,
        summary: apiRes.summary,
        you_effort: apiRes.you_effort,
        them_effort: apiRes.them_effort,
        greens: apiRes.greens ?? [],
        reds: apiRes.reds ?? [],
        extra: apiRes.extra ?? null,
      };

      const { data, error } = await supabase
        .from("conversation_analyses")
        .insert({
          user_id: user.id,
          space_id: selectedSpaceId,
          input_text: usedText,
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

      // ✅ clear after submit
      setInput("");
      setShots([]);

      // ✅ local usage increment (free quota)
      setPlanInfo((prev) => ({
        ...prev,
        usedThisMonth: prev.usedThisMonth + 1,
      }));
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
    setSelectedId((prev) => {
      if (prev !== id) return prev;
      const next = filteredHistory.find((h) => h.id !== id)?.id ?? null;
      return next;
    });

    // (Optional) usage decrement না করাই ভাল (quota counted on create)
  };

  const handleClearAll = async () => {
    if (!selectedSpaceId) return;

    const ok = confirm("Delete ALL analyses in this space?");
    if (!ok) return;
    if (!user) return;

    const { error } = await supabase
      .from("conversation_analyses")
      .delete()
      .eq("user_id", user.id)
      .eq("space_id", selectedSpaceId);

    if (error) {
      console.error("clear error:", error);
      alert("Failed to clear all.");
      return;
    }

    setHistory([]);
    setSelectedId(null);
  };

  const handleCreateSpace = async () => {
    if (!user) {
      alert("Please log in first.");
      router.replace("/login");
      return;
    }

    const name = window
      .prompt("Name this space (e.g., Partner, Best friend, Client A)")
      ?.trim();

    if (!name) return;

    const { data, error } = await supabase
      .from("conversation_spaces")
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) {
      console.error("create space error:", error);
      alert("Failed to create space.");
      return;
    }

    const newSpace: Space = {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
    };

    setSpaces((prev) => [...prev, newSpace]);
    setSelectedSpaceId(newSpace.id); // ✅ created → select it
  };

  const handleExportJSON = () => {
    if (!filteredHistory.length) return;

    const blob = new Blob([JSON.stringify(filteredHistory, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bondalayze-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!filteredHistory.length) return;

    const header = ["created_at", "score", "you_effort", "them_effort", "summary"].join(",");

    const rows = filteredHistory.map((item) => {
      const summary = (item.result.summary || "").replace(/"/g, '""');
      return `"${item.created_at}","${item.result.score}","${item.result.you_effort}","${item.result.them_effort}","${summary}"`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bondalayze-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const trendData = useMemo(
    () =>
      filteredHistory
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
    [filteredHistory]
  );

  const placeholderExample = `Example:
You: Can we talk about yesterday?
Them: I’m tired, not now.
You: I felt ignored. I want to understand.
Them: You always overthink…`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      {/* LEFT */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">
              Conversation Analyzer
              <span className="ml-2 text-xs text-sky-400">Bondalayze</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Paste your chat or upload screenshots — get a gentle health check.
            </p>
          </div>

          <div className="text-xs text-right">
            {loadingUser ? (
              <span className="text-slate-400">Checking session…</span>
            ) : userEmail ? (
              <>
                <div className="flex justify-end mb-1">
                  <span
                    className={
                      "rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide " +
                      (planInfo.plan === "pro"
                        ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white"
                        : "bg-slate-700 text-slate-100")
                    }
                  >
                    {planInfo.plan === "pro" ? "Pro plan" : "Free plan"}
                  </span>
                </div>
                <div className="text-slate-300">{userEmail}</div>
                {!planInfo.loading && (
                  <div className="mt-1 text-[11px] text-slate-400">
                    {planInfo.monthlyLimit === null ? (
                      <>
                        {planInfo.usedThisMonth} analyses this month · unlimited
                      </>
                    ) : (
                      <>
                        {planInfo.usedThisMonth}/{planInfo.monthlyLimit} analyses this month
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="text-rose-400">Not signed in.</span>
            )}
          </div>
        </div>

        {/* Spaces selector (mandatory) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Current space</span>
            <button
              type="button"
              onClick={handleCreateSpace}
              className="text-[11px] text-sky-300 hover:text-sky-200"
            >
              + New space
            </button>
          </div>

          {loadingSpaces ? (
            <div className="text-xs text-slate-500">Loading spaces…</div>
          ) : spaces.length ? (
            <select
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs"
              value={selectedSpaceId ?? ""}
              onChange={(e) => setSelectedSpaceId(e.target.value || null)}
            >
              <option value="" disabled>
                Select a space…
              </option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={handleCreateSpace}
              className="w-full rounded-lg border border-dashed border-slate-700 px-2 py-2 text-xs text-slate-300 hover:bg-slate-900"
            >
              Create your first space (e.g., “Partner”)
            </button>
          )}

          {!selectedSpaceId && !loadingSpaces && spaces.length > 0 && (
            <p className="text-[11px] text-amber-300">
              Please create space before Analyze
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-slate-300">
            Paste conversation text (optional if you upload screenshots):
          </label>

          <textarea
            className="w-full h-48 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder={placeholderExample}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {/* Screenshot uploader */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-300">
                Screenshots (optional) — max <b>{maxShots}</b> per analyze
              </div>

              <label className="cursor-pointer text-[11px] rounded-full border border-slate-700 px-3 py-[4px] hover:bg-slate-900">
                + Add screenshots
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickShots(e.target.files)}
                />
              </label>
            </div>

            {shots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shots.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1"
                  >
                    <span className="text-[11px] text-slate-300 line-clamp-1 max-w-[180px]">
                      {s.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeShot(s.id)}
                      className="text-[11px] text-rose-300 hover:underline"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Tip: You can use WhatsApp/Instagram screenshot here. 
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-xl bg-sky-500 disabled:bg-slate-700 text-sm font-medium hover:bg-sky-400 transition"
            >
              {submitting ? "Analyzing…" : "Analyze & Save"}
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={!history.length || !selectedSpaceId}
              className="px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-40"
            >
              Clear all in this space
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-400">
          🔐 Saving Data per-user <code>conversation_analyses</code> On table
          Plan info <code>bondalayze_plans</code> & spaces <code>conversation_spaces</code>
        </p>
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6 gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">History</h2>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 mr-1">Range:</span>
              {["all", "7", "30"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f as HistoryFilter)}
                  className={
                    "px-2 py-[2px] rounded-full border text-[11px] " +
                    (historyFilter === f
                      ? "border-sky-500 text-sky-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-500")
                  }
                >
                  {f === "all" ? "All" : f === "7" ? "7d" : "30d"}
                </button>
              ))}
            </div>

            {filteredHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-2 py-[2px] rounded-full border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-900"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2 py-[2px] rounded-full border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-900"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredHistory.length >= 2 && (
          <div className="relative w-full border border-slate-800 rounded-2xl p-3 bg-slate-950 overflow-hidden">
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
{/* kichu jinish change kora hoice git hub tmi bujch? */}
        {loadingHistory ? (
          <div className="text-sm text-slate-400">Loading history…</div>
        ) : !selectedSpaceId ? (
          <div className="text-sm text-slate-500">Select a space to see history.</div>
        ) : !history.length ? (
          <div className="text-sm text-slate-500">
            No saved analyses yet. Paste/upload and click{" "}
            <span className="text-sky-400">Analyze &amp; Save</span>.
          </div>
        ) : !filteredHistory.length ? (
          <div className="text-sm text-slate-500">
            No analyses in this date range. Try a wider filter.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="w-full md:w-1/3 max-h-[420px] overflow-auto space-y-2 pr-1">
              {filteredHistory.map((item) => (
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

            <div className="w-full md:w-2/3 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-sm bg-slate-950">
              {selectedItem ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">Analysis score</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-semibold">
                          {selectedItem.result.score}/100
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Higher = healthier patterns
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {new Date(selectedItem.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex-1">
                      <div className="text-emerald-400 font-semibold">You</div>
                      <div>{selectedItem.result.you_effort}% effort</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-amber-400 font-semibold">Them</div>
                      <div>{selectedItem.result.them_effort}% effort</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Summary</div>
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

                  {selectedItem.result.extra && (
                    <div className="mt-2 flex flex-col gap-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Emotional tone
                          </div>
                          <div className="text-sm font-semibold">
                            {(selectedItem.result.extra.emotional_tone ?? "mixed").replace("_", " ")}
                          </div>
                        </div>
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Breakup risk
                          </div>
                          <div className="text-sm font-semibold">
                            {selectedItem.result.extra.breakup_risk ?? "medium"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Your attachment style
                          </div>
                          <div className="text-sm">
                            {selectedItem.result.extra.attachment_you ?? "mixed / unclear"}
                          </div>
                        </div>
                        <div className="border border-slate-800 rounded-xl p-2">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Their attachment style
                          </div>
                          <div className="text-sm">
                            {selectedItem.result.extra.attachment_them ?? "mixed / unclear"}
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-800 rounded-xl p-3">
                        <div className="text-[11px] text-slate-400 mb-1">
                          Conflict pattern
                        </div>
                        <p className="text-sm text-slate-100">
                          {selectedItem.result.extra.conflict_pattern ??
                            "The conflict pattern was not clearly described."}
                        </p>
                      </div>

                      {selectedItem.result.extra.recommendations?.length ? (
                        <div className="border border-slate-800 rounded-xl p-3">
                          <div className="text-[11px] text-slate-400 mb-1">
                            Suggested next steps
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-[13px] text-slate-100">
                            {selectedItem.result.extra.recommendations.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Original text</div>
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
