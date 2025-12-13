import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Bondalayze – Analyze the heart of your conversation",
  description:
    "Bondalayze uses AI to analyze your chats and show relationship patterns in a gentle way.",
  openGraph: {
    title: "Bondalayze – Analyze the heart of your conversation",
    description:
      "Bondalayze uses AI to analyze your chats and show relationship patterns in a gentle way.",
    url: "/",
    siteName: "Bondalayze",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bondalayze – Analyze the heart of your conversation",
    description:
      "Bondalayze uses AI to analyze your chats and show relationship patterns in a gentle way.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#050510] text-slate-50">
        <Navbar />
        <main className="min-h-[calc(100vh-80px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

