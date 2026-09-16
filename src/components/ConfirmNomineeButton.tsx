"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmNomineeButton({
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
  const [loading, setLoading] = useState(false);

  if (isRegistered) {
    return (
      <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        مؤكَّد
      </span>
    );
  }

  const confirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, partnerId, partnerName }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={confirm}
        disabled={loading}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 print:hidden"
      >
        {loading ? "جارٍ التأكيد…" : "تأكيد"}
      </button>
      <span className="hidden text-muted print:inline">بانتظار التأكيد</span>
    </>
  );
}
