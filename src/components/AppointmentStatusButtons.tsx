"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/lib/collections-repo";

export default function AppointmentStatusButtons({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const setStatus = async (status: Appointment["status"]) => {
    setLoading(true);
    try {
      await fetch(`/api/collections/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (appointment.status !== "scheduled") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setStatus("done")}
        disabled={loading}
        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
      >
        تم
      </button>
      <button
        onClick={() => setStatus("missed")}
        disabled={loading}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
      >
        لم يتم
      </button>
    </div>
  );
}
