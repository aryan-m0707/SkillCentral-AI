import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillCentral — AI-Powered Learning Command Center",
  description: "Capture, organize, understand, act, and improve. A unified AI learning companion with Notebook-style vault, YouTube study studio, Google Tasks synchronization, and measured mastery.",
  keywords: ["EdTech", "Gemini", "NotebookLM", "Study Planner", "Google Tasks", "Second Brain", "Skill Tracking"],
  authors: [{ name: "SkillCentral Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6658F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased font-sans selection:bg-[#6658F5]/20 selection:text-[#6658F5]">
        {children}
      </body>
    </html>
  );
}
