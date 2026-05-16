"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "工作台" },
  { href: "/new", label: "录入需求" },
  { href: "/import", label: "批量导入" },
  { href: "/requirements", label: "需求列表" },
  { href: "/customers", label: "客户" },
  { href: "/dashboard", label: "看板" },
];

function AIStatusBadge() {
  const [status, setStatus] = useState<{
    provider: string;
    isMock: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        status.isMock
          ? "text-[#d4a017]"
          : "text-[#5db872]"
      }`}
      style={{ background: "var(--surface-card)" }}
      title={`AI: ${status.provider}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status.isMock ? "bg-[#d4a017]" : "bg-[#5db872]"
        }`}
      />
      {status.isMock ? "Mock" : status.provider}
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b sticky top-0 z-50" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[16px] font-medium tracking-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
            需求通
          </Link>
          <AIStatusBadge />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${
                pathname === link.href
                  ? "text-[#141413]"
                  : "text-[#6c6a64] hover:text-[#141413]"
              }`}
              style={pathname === link.href ? { background: "var(--surface-card)" } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-secondary"
          onClick={() => setOpen(!open)}
          aria-label="菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-2 space-y-0.5" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-1.5 rounded-md text-[15px] font-medium ${
                pathname === link.href
                  ? "text-[#141413]"
                  : "text-[#6c6a64] hover:text-[#141413]"
              }`}
              style={pathname === link.href ? { background: "var(--surface-card)" } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
