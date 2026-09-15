"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import type { MonthlyPoint } from "@/lib/customer-analytics";

export default function SalesCollectionChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value) => new Intl.NumberFormat("ar-SA").format(Number(value))}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend />
        <Bar dataKey="sales" name="المبيعات" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
        <Line dataKey="collected" name="التحصيل" stroke="#37b24d" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
