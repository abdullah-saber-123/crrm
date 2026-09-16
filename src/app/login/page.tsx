"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "تعذر تسجيل الدخول");
        return;
      }
      router.push("/customers");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-1 items-center justify-center px-6 py-16"
      style={{ background: "linear-gradient(160deg, var(--sidebar-bg), var(--sidebar-bg-2))" }}
    >
      <div className="absolute left-4 top-4">
        <ThemeToggle className="!text-white hover:!bg-white/10" />
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl"
      >
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <LockKeyhole size={20} />
        </div>
        <h1 className="mb-1 text-xl font-semibold">تسجيل الدخول</h1>
        <p className="mb-6 text-sm text-muted">نظام المطابقات والتحصيل وتحليل بيانات العملاء</p>

        <label className="mb-1 block text-sm font-medium">اسم المستخدم</label>
        <input
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mb-4"
          autoComplete="username"
        />

        <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-2"
          autoComplete="current-password"
        />

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg px-6 py-3 font-medium text-white transition disabled:opacity-60"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {loading ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
