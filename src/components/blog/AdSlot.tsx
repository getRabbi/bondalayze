// src/components/blog/AdSlot.tsx
export default function AdSlot({
  label = "Ad slot",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-400">
      {label} (AdSense later)
    </div>
  );
}
