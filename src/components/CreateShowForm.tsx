"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateShowForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/collections/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, eventDate: eventDate || null }),
      });
      if (res.ok) {
        const { show } = await res.json();
        setOpen(false);
        setName("");
        setEventDate("");
        router.push(`/collections?show=${show.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium"
      >
        + عرض كولكشن جديد
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-end gap-3 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">اسم العرض</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="كولكشن الخريف ٢٠٢٦" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">تاريخ العرض (اختياري)</label>
        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {loading ? "جارٍ الإنشاء…" : "إنشاء"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
        إلغاء
      </button>
    </form>
  );
}
