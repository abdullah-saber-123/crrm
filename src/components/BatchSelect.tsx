"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BATCH_LABELS: Record<number, string> = {
  1: "الدفعة الأولى",
  2: "الدفعة الثانية",
  3: "الدفعة الثالثة",
};

export default function BatchSelect({
  showId,
  partnerId,
  batch,
}: {
  showId: number;
  partnerId: number;
  batch: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (value: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, partnerId, batch: Number(value) }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <select
        value={batch ?? ""}
        onChange={(e) => update(e.target.value)}
        disabled={loading}
        className="input py-1 text-xs disabled:opacity-60 print:hidden"
      >
        <option value="" disabled>
          بدون دفعة
        </option>
        {[1, 2, 3].map((b) => (
          <option key={b} value={b}>
            {BATCH_LABELS[b]}
          </option>
        ))}
      </select>
      <span className="hidden print:inline">{batch ? BATCH_LABELS[batch] : "—"}</span>
    </>
  );
}
