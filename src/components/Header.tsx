import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const NAV_LINKS = [
  { href: "/customers", label: "تحليل العملاء" },
  { href: "/reconciliation", label: "المطابقات" },
  { href: "/collections", label: "التحصيل" },
];

export default function Header({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          نظام المطابقات والتحصيل
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-500">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">{user.name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
