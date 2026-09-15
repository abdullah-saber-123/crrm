"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-1 text-xl font-semibold">تسجيل الدخول</h1>
        <p className="mb-6 text-sm text-zinc-500">نظام المطابقات والتحصيل وتحليل بيانات العملاء</p>

        <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
        <input
          type="email"
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
          className="mt-4 w-full rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
