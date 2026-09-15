"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReconciliationActions({
  partnerId,
  partnerName,
  invoiceRef,
  invoiceMoveId,
  invoiceAmount,
  paymentRef,
  paymentId,
  paymentAmount,
  matchedAmount,
}: {
  partnerId: number;
  partnerName: string;
  invoiceRef: string;
  invoiceMoveId: number;
  invoiceAmount: number;
  paymentRef: string;
  paymentId: number;
  paymentAmount: number;
  matchedAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"confirmed" | "rejected" | null>(null);

  const submit = async (status: "confirmed" | "rejected") => {
    setLoading(status);
    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          partnerName,
          invoiceRef,
          invoiceMoveId,
          invoiceAmount,
          paymentRef,
          paymentId,
          paymentAmount,
          matchedAmount,
          status,
          notes,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setNotes("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
      >
        مراجعة ومصادقة
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ملاحظات المصادقة (اختياري)"
        className="input min-h-16 text-xs"
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit("confirmed")}
          disabled={loading !== null}
          className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {loading === "confirmed" ? "جارٍ التأكيد…" : "تأكيد المطابقة"}
        </button>
        <button
          onClick={() => submit("rejected")}
          disabled={loading !== null}
          className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {loading === "rejected" ? "جارٍ الرفض…" : "رفض"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
