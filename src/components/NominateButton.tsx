"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

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
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const nominate = async (withNotes: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          partnerId,
          partnerName,
          notes: withNotes ? notes : null,
        }),
      });
      if (res.ok) {
        setNoteOpen(false);
        setNotes("");
        setDone(true);
        router.refresh();
        setTimeout(() => setDone(false), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => nominate(false)}
        disabled={loading}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {done ? "تم الترشيح ✓" : loading ? "…" : "ترشيح"}
      </button>
      <button
        onClick={() => setNoteOpen((v) => !v)}
        title="إضافة ملاحظة (اختياري)"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-card-border text-muted hover:bg-black/5 dark:hover:bg-white/10"
      >
        <MessageSquarePlus size={14} />
      </button>

      {noteOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            nominate(true);
          }}
          className="card absolute z-10 flex w-64 flex-col gap-2 p-3"
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            className="input min-h-12 text-xs"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
            >
              ترشيح بالملاحظة
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
