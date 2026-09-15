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
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
      >
        + عرض كولكشن جديد
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">اسم العرض</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="كولكشن الخريف ٢٠٢٦" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">تاريخ العرض (اختياري)</label>
        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? "جارٍ الإنشاء…" : "إنشاء"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500">
        إلغاء
      </button>
    </form>
  );
}
