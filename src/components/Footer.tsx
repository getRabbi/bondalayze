export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-slate-500">
        © {new Date().getFullYear()} Bondalayze.
      </div>
    </footer>
  );
}
