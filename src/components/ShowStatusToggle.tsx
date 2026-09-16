"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShowStatusToggle({
  showId,
  status,
}: {
  showId: number;
  status: "open" | "closed";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = status === "open" ? "closed" : "open";
    if (next === "closed" && !confirm("إغلاق العرض يوقف استقبال ترشيحات جديدة. متأكد؟")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/shows/${showId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${
        status === "open"
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950"
      }`}
    >
      {status === "open" ? "إغلاق العرض" : "إعادة فتح العرض"}
    </button>
  );
}
