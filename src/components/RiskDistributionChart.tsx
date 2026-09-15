"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS: Record<string, string> = {
  "مخاطر منخفضة": "#37b24d",
  "مخاطر متوسطة": "#f5b800",
  "مخاطر مرتفعة": "#c92a2a",
};

export default function RiskDistributionChart({
  counts,
}: {
  counts: { low: number; medium: number; high: number };
}) {
  const data = [
    { name: "مخاطر منخفضة", value: counts.low },
    { name: "مخاطر متوسطة", value: counts.medium },
    { name: "مخاطر مرتفعة", value: counts.high },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">لا توجد بيانات كافية.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
