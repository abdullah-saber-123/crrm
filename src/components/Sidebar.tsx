"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, GitCompareArrows, Gift, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/customers", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/reconciliation", label: "المطابقات", icon: GitCompareArrows },
  { href: "/collections", label: "عرض الكولكشن", icon: Gift },
];

const ADMIN_NAV_ITEMS = [{ href: "/users", label: "المستخدمون", icon: Users }];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside
      className="flex w-64 shrink-0 flex-col text-[var(--sidebar-fg)]"
      style={{
        background: "linear-gradient(180deg, var(--sidebar-bg), var(--sidebar-bg-2))",
      }}
    >
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">
          م
        </div>
        <span className="text-lg font-semibold">نظام المطابقات</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-[var(--sidebar-fg-muted)] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4 text-xs text-[var(--sidebar-fg-muted)]">
        نظام المطابقات والتحصيل وتحليل العملاء
      </div>
    </aside>
  );
}
