"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NominateButton({
  showId,
  partnerId,
  partnerName,
}: {
  showId: number;
  partnerId: number;
  partnerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nominatedBy, setNominatedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/collections/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, partnerId, partnerName, nominatedBy, notes }),
      });
      if (res.ok) {
        setOpen(false);
        setNominatedBy("");
        setNotes("");
        setDone(true);
        router.refresh();
        setTimeout(() => setDone(false), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {done ? "تم الترشيح ✓" : "ترشيح"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card absolute z-10 flex w-64 flex-col gap-2 p-3">
      <input
        value={nominatedBy}
        onChange={(e) => setNominatedBy(e.target.value)}
        placeholder="اسمك (المرشِّح)"
        className="input text-xs"
        autoFocus
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ملاحظات (اختياري)"
        className="input min-h-12 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {loading ? "جارٍ الترشيح…" : "تأكيد الترشيح"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-card-border px-3 py-1.5 text-xs"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
