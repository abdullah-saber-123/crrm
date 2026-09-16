import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام المطابقات والتحصيل",
  description: "نظام تحليل حسابات العملاء والمطابقات وإدارة التحصيل، متصل بـ Odoo.",
};

// Fallback for a first-ever visit with no theme cookie yet: honor the OS
// preference before paint. Once the user toggles, the cookie (set by
// ThemeToggle) makes the server render the right class directly, so no
// client/server mismatch — and nothing to revert on hydration.
const THEME_INIT_SCRIPT = `
  try {
    if (!document.cookie.includes('theme=') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const isDark = jar.get("theme")?.value === "dark";

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${isDark ? "dark" : ""}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
