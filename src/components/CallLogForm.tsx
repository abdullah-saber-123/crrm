"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Partner } from "@/lib/customers-repo";
import type { Appointment } from "@/lib/collections-repo";

const OUTCOMES = [
  { value: "promised_payment", label: "وعد بالسداد" },
  { value: "no_answer", label: "لم يتم الرد" },
  { value: "disputed", label: "اعتراض على المبلغ" },
  { value: "paid", label: "تم السداد" },
  { value: "other", label: "أخرى" },
];

export default function CallLogForm({
  partners,
  appointments,
  defaultPartnerId,
}: {
  partners: Partner[];
  appointments: Appointment[];
  defaultPartnerId?: number;
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>(String(defaultPartnerId ?? partners[0]?.id ?? ""));
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [outcome, setOutcome] = useState(OUTCOMES[0].value);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const relevantAppointments = appointments.filter((a) => a.partnerId === Number(partnerId));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find((p) => p.id === Number(partnerId));
    if (!partner) return;

    setLoading(true);
    try {
      await fetch("/api/collections/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          partnerName: partner.name,
          appointmentId: appointmentId ? Number(appointmentId) : null,
          outcome: OUTCOMES.find((o) => o.value === outcome)?.label ?? outcome,
          notes,
        }),
      });
      setNotes("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold">تسجيل استدعاء / اتصال تحصيل</h3>
      <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="input">
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} className="input">
        <option value="">بدون موعد مرتبط</option>
        {relevantAppointments.map((a) => (
          <option key={a.id} value={a.id}>
            {new Date(a.scheduledAt).toLocaleString("ar-SA")} — {a.purpose || "بدون غرض محدد"}
          </option>
        ))}
      </select>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="input">
        {OUTCOMES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="ملاحظات المكالمة"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input min-h-16"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? "جارٍ الحفظ…" : "حفظ الاتصال"}
      </button>
    </form>
  );
}
