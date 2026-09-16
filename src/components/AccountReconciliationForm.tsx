"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountReconciliationForm({
  partnerId,
  partnerName,
  asOfDate,
  balance,
  totalInvoiced,
  totalPaid,
}: {
  partnerId: number;
  partnerName: string;
  asOfDate: string;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"confirmed" | "rejected" | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (status: "confirmed" | "rejected") => {
    setLoading(status);
    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          partnerName,
          asOfDate,
          balance,
          totalInvoiced,
          totalPaid,
          status,
          notes,
        }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        تم تسجيل المصادقة على حساب {partnerName} حتى {asOfDate}.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ملاحظات المصادقة (اختياري)"
        className="input min-h-16 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit("confirmed")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading === "confirmed" ? "جارٍ التأكيد…" : "تأكيد مطابقة الحساب"}
        </button>
        <button
          onClick={() => submit("rejected")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading === "rejected" ? "جارٍ الرفض…" : "رفض"}
        </button>
      </div>
    </div>
  );
}
