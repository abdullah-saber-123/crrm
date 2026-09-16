"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NominationActions({
  showId,
  partnerId,
  partnerName,
  isRegistered,
}: {
  showId: number;
  partnerId: number;
  partnerName: string;
  isRegistered: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nominatedBy, setNominatedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"nominate" | "register" | null>(null);

  const nominate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("nominate");
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
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const register = async () => {
    setLoading("register");
    try {
      const res = await fetch("/api/collections/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, partnerId, partnerName }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          ترشيح
        </button>
        {isRegistered ? (
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            مسجّل بالعرض
          </span>
        ) : (
          <button
            onClick={register}
            disabled={loading !== null}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {loading === "register" ? "جارٍ التسجيل…" : "تسجيل بالعرض"}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={nominate} className="card flex w-64 flex-col gap-2 p-3">
          <input
            value={nominatedBy}
            onChange={(e) => setNominatedBy(e.target.value)}
            placeholder="اسمك (المرشِّح)"
            className="input text-xs"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات (اختياري)"
            className="input min-h-12 text-xs"
          />
          <button
            type="submit"
            disabled={loading !== null}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {loading === "nominate" ? "جارٍ الترشيح…" : "تأكيد الترشيح"}
          </button>
        </form>
      )}
    </div>
  );
}
