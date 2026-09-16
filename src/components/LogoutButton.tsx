"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      disabled={loading}
      aria-label="تسجيل الخروج"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
    >
      <LogOut size={18} />
    </button>
  );
}
