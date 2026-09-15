import type { Partner } from "@/lib/customers-repo";
import type { CustomerAnalysis, MonthlyPoint } from "@/lib/customer-analytics";

export type CustomerAnalysisRow = { partner: Partner; analysis: CustomerAnalysis };

export type DashboardData = {
  customerCount: number;
  totalDebt: number;
  totalOverdueDebt: number;
  totalInvoiced: number;
  totalCollected: number;
  averageCommitmentScore: number;
  riskCounts: { low: number; medium: number; high: number };
  aggregateMonthlySeries: MonthlyPoint[];
  topOverdue: CustomerAnalysisRow[];
  agingTotals: { label: string; amount: number }[];
};

export function buildDashboard(rows: CustomerAnalysisRow[]): DashboardData {
  const customerCount = rows.length;
  const totalDebt = rows.reduce((s, r) => s + r.analysis.totalDebt, 0);
  const totalOverdueDebt = rows.reduce((s, r) => s + r.analysis.overdueDebt, 0);
  const totalInvoiced = rows.reduce((s, r) => s + r.analysis.totalInvoiced, 0);
  const totalCollected = rows.reduce((s, r) => s + r.analysis.totalCollected, 0);
  const averageCommitmentScore =
    customerCount > 0
      ? Math.round(rows.reduce((s, r) => s + r.analysis.commitmentScore, 0) / customerCount)
      : 0;

  const riskCounts = { low: 0, medium: 0, high: 0 };
  for (const r of rows) riskCounts[r.analysis.riskLevel] += 1;

  const monthlyMap = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    for (const point of r.analysis.monthlySeries) {
      const existing = monthlyMap.get(point.month);
      if (existing) {
        existing.sales += point.sales;
        existing.collected += point.collected;
      } else {
        monthlyMap.set(point.month, { ...point });
      }
    }
  }
  const aggregateMonthlySeries = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  const topOverdue = [...rows]
    .filter((r) => r.analysis.overdueDebt > 0)
    .sort((a, b) => b.analysis.overdueDebt - a.analysis.overdueDebt)
    .slice(0, 8);

  const agingLabels = rows[0]?.analysis.aging.map((b) => b.label) ?? [];
  const agingTotals = agingLabels.map((label, i) => ({
    label,
    amount: rows.reduce((s, r) => s + (r.analysis.aging[i]?.amount ?? 0), 0),
  }));

  return {
    customerCount,
    totalDebt,
    totalOverdueDebt,
    totalInvoiced,
    totalCollected,
    averageCommitmentScore,
    riskCounts,
    aggregateMonthlySeries,
    topOverdue,
    agingTotals,
  };
}
