"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium print:hidden"
    >
      <Printer size={16} />
      طباعة التقرير
    </button>
  );
}
