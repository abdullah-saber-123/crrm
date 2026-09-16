"use client";

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import type { AgingBucket } from "@/lib/customer-analytics";

const COLORS = ["#37b24d", "#f5b800", "#f76707", "#e64980", "#c92a2a"];

export default function AgingChart({ data }: { data: AgingBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value) => new Intl.NumberFormat("ar-SA").format(Number(value))}
          contentStyle={{
            borderRadius: 10,
            fontSize: 12,
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            color: "var(--foreground)",
          }}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
