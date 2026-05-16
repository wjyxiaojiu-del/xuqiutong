import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "需求通 - 客户声音到产品文档",
  description: "把分散的客户声音转成可追溯、可审核、可沉淀的产品需求资产",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl w-full px-4 py-8 flex-1">
          {children}
        </main>
        <footer className="py-10 text-center" style={{ background: "var(--surface-dark)" }}>
          <p className="text-[13px]" style={{ color: "#a09d96" }}>
            需求通 &middot; 客户声音到产品文档 &middot; 2026
          </p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
