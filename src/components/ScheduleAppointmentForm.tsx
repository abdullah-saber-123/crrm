"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Partner } from "@/lib/customers-repo";

export default function ScheduleAppointmentForm({
  partners,
  defaultPartnerId,
}: {
  partners: Partner[];
  defaultPartnerId?: number;
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>(String(defaultPartnerId ?? partners[0]?.id ?? ""));
  const [scheduledAt, setScheduledAt] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const partner = partners.find((p) => p.id === Number(partnerId));
    if (!partner || !scheduledAt) return;

    setLoading(true);
    try {
      const res = await fetch("/api/collections/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          partnerName: partner.name,
          scheduledAt: new Date(scheduledAt).toISOString(),
          purpose,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "تعذر إنشاء الموعد");
        return;
      }
      setScheduledAt("");
      setPurpose("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold">جدولة موعد تحصيل جديد</h3>
      <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="input">
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        required
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="input"
      />
      <input
        placeholder="الغرض من الموعد (اختياري)"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        className="input"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? "جارٍ الحفظ…" : "إضافة الموعد"}
      </button>
    </form>
  );
}
