import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-slate-800 bg-[#050510]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-sm text-slate-200">
        <Link href="/" className="font-semibold">
          Bondalayze
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/analyze" className="hover:text-white">
            Analyze
          </Link>
          <Link href="/history" className="hover:text-white">
            History
          </Link>
          <Link href="/login" className="hover:text-white">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
