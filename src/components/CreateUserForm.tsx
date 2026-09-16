"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "تعذر إنشاء المستخدم");
        return;
      }
      setUsername("");
      setName("");
      setPassword("");
      setRole("agent");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-end gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">اسم المستخدم (للدخول)</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">الاسم الظاهر</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
          minLength={4}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">الصلاحية</label>
        <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "agent")} className="input">
          <option value="agent">موظف</option>
          <option value="admin">مدير</option>
        </select>
      </div>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {loading ? "جارٍ الإنشاء…" : "إضافة مستخدم"}
      </button>
    </form>
  );
}
