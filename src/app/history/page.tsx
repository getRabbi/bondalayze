// src/app/history/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

type HistoryItem = {
  id: string;
  created_at: string;
  message_count: number;
  overall_score: number;
  effort_you: number;
  effort_them: number;
  short_summary: string | null;
};

export default function HistoryPage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("auth error:", userError);
      }

      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      // DB theke history
      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("history load error:", error);
        setItems([]);
        setLoading(false);
        return;
      }

      const mapped: HistoryItem[] =
        (data ?? []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          // approx: koto line message ache
          message_count: String(row.input_text ?? "")
            .split("\n")
            .filter((x) => x.trim().length > 0).length,
          overall_score: row.score,
          effort_you: row.you_effort,
          effort_them: row.them_effort,
          short_summary: row.summary ?? null,
        })) ?? [];

      setItems(mapped);
      setLoading(false);
    };

    load();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Conversation History</h1>
          <Link
            href="/analyze"
            className="text-sm text-sky-400 hover:underline"
          >
            ⬅ Back to analyzer
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400">Loading history…</div>
        ) : !items.length ? (
          <div className="text-sm text-slate-400">
            No analyses found yet. Go to{" "}
            <Link href="/analyze" className="text-sky-400 underline">
              /analyze
            </Link>{" "}
            and create one.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-slate-800 bg-slate-900/60 rounded-2xl p-3 md:p-4 text-sm flex flex-col gap-2"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-lg font-semibold">
                      Score {item.overall_score}/100
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>Messages: {item.message_count}</div>
                    <div className="mt-1">
                      <span className="text-emerald-400">
                        You {item.effort_you}%
                      </span>{" "}
                      ·{" "}
                      <span className="text-amber-400">
                        Them {item.effort_them}%
                      </span>
                    </div>
                  </div>
                </div>

                {item.short_summary && (
                  <p className="text-slate-100 text-sm">
                    {item.short_summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
