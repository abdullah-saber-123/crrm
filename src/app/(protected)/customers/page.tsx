import Link from "next/link";
import { Users, Wallet, AlertTriangle, TrendingUp, Gauge } from "lucide-react";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { buildDashboard } from "@/lib/dashboard-analytics";
import { formatCurrency } from "@/lib/format";
import SalesCollectionChart from "@/components/SalesCollectionChart";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import AgingChart from "@/components/AgingChart";
import KpiCard from "@/components/KpiCard";

export const dynamic = "force-dynamic";

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const RISK_LABELS: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "مرتفعة",
};

export default async function CustomersPage() {
  const partners = await listPartners();

  const rows = await Promise.all(
    partners.map(async (partner) => {
      const [invoices, payments] = await Promise.all([
        getPartnerInvoices(partner.id),
        getPartnerPayments(partner.id),
      ]);
      const analysis = analyzeCustomer(invoices, payments);
      return { partner, analysis };
    })
  );

  const dashboard = buildDashboard(rows);
  const sortedRows = [...rows].sort((a, b) => b.analysis.overdueDebt - a.analysis.overdueDebt);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        نظرة شاملة على التزام كل العملاء بالسداد ومستوى المخاطر، مع تفاصيل كل عميل عند الدخول لصفحته.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="عدد العملاء" value={String(dashboard.customerCount)} icon={Users} tone="blue" />
        <KpiCard label="إجمالي المديونية" value={formatCurrency(dashboard.totalDebt)} icon={Wallet} tone="purple" />
        <KpiCard
          label="إجمالي المتأخر"
          value={formatCurrency(dashboard.totalOverdueDebt)}
          icon={AlertTriangle}
          tone="red"
        />
        <KpiCard
          label="إجمالي المبيعات (١٢ شهرًا)"
          value={formatCurrency(dashboard.totalInvoiced)}
          icon={TrendingUp}
          tone="teal"
        />
        <KpiCard
          label="متوسط مؤشر الالتزام"
          value={`${dashboard.averageCommitmentScore}/100`}
          icon={Gauge}
          tone="green"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-muted">إجمالي المبيعات والتحصيل الشهري (كل العملاء)</h2>
          <SalesCollectionChart data={dashboard.aggregateMonthlySeries} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted">توزيع مستوى المخاطر</h2>
          <RiskDistributionChart counts={dashboard.riskCounts} />
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-muted">أكثر العملاء مديونية متأخرة</h2>
          <div className="flex flex-col gap-2">
            {dashboard.topOverdue.map(({ partner, analysis }) => (
              <Link
                key={partner.id}
                href={`/customers/${partner.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              >
                <span className="font-medium">{partner.name}</span>
                <span className="text-amber-700 dark:text-amber-400">{formatCurrency(analysis.overdueDebt)}</span>
              </Link>
            ))}
            {dashboard.topOverdue.length === 0 && (
              <p className="text-sm text-muted">لا توجد مديونية متأخرة حاليًا.</p>
            )}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted">إجمالي أعمار الديون</h2>
          <AgingChart data={dashboard.agingTotals} />
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold text-muted">كل العملاء</h2>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
                <th className="px-3 py-2 font-medium">إجمالي المديونية</th>
                <th className="px-3 py-2 font-medium">المتأخر</th>
                <th className="px-3 py-2 font-medium">مؤشر الالتزام</th>
                <th className="px-3 py-2 font-medium">المخاطر</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ partner, analysis }) => (
                <tr key={partner.id} className="border-t border-card-border">
                  <td className="px-3 py-3">
                    <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                      {partner.name}
                    </Link>
                    <div className="text-xs text-muted">{partner.city}</div>
                  </td>
                  <td className="px-3 py-3">{formatCurrency(analysis.totalDebt)}</td>
                  <td className="px-3 py-3">{formatCurrency(analysis.overdueDebt)}</td>
                  <td className="px-3 py-3">{analysis.commitmentScore}/100</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[analysis.riskLevel]}`}>
                      {RISK_LABELS[analysis.riskLevel]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
