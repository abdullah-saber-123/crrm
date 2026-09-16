"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/customers/", title: "تفاصيل العميل" },
  { prefix: "/customers", title: "لوحة التحكم" },
  { prefix: "/reconciliation", title: "المطابقات" },
  { prefix: "/collections", title: "عرض الكولكشن" },
];

function resolveTitle(pathname: string): string {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "نظام المطابقات";
}

export default function TopBar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-card-border bg-background/80 px-6 py-4 backdrop-blur">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-muted sm:flex">
          <Search size={16} />
          <span>بحث…</span>
        </div>
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
