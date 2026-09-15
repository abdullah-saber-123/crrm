import Link from "next/link";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { buildDashboard } from "@/lib/dashboard-analytics";
import { formatCurrency } from "@/lib/format";
import SalesCollectionChart from "@/components/SalesCollectionChart";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import AgingChart from "@/components/AgingChart";

export const dynamic = "force-dynamic";

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
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
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">لوحة تحليل العملاء</h1>
      <p className="mb-8 text-sm text-zinc-500">
        نظرة شاملة على التزام كل العملاء بالسداد ومستوى المخاطر، مع تفاصيل كل عميل عند الدخول لصفحته.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="عدد العملاء" value={String(dashboard.customerCount)} />
        <KpiCard label="إجمالي المديونية" value={formatCurrency(dashboard.totalDebt)} />
        <KpiCard label="إجمالي المتأخر" value={formatCurrency(dashboard.totalOverdueDebt)} tone="warn" />
        <KpiCard label="إجمالي المبيعات (١٢ شهرًا)" value={formatCurrency(dashboard.totalInvoiced)} />
        <KpiCard label="متوسط مؤشر الالتزام" value={`${dashboard.averageCommitmentScore}/100`} />
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 p-6 lg:col-span-2 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">إجمالي المبيعات والتحصيل الشهري (كل العملاء)</h2>
          <SalesCollectionChart data={dashboard.aggregateMonthlySeries} />
        </section>
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">توزيع مستوى المخاطر</h2>
          <RiskDistributionChart counts={dashboard.riskCounts} />
        </section>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 p-6 lg:col-span-2 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">أكثر العملاء مديونية متأخرة</h2>
          <div className="flex flex-col gap-2">
            {dashboard.topOverdue.map(({ partner, analysis }) => (
              <Link
                key={partner.id}
                href={`/customers/${partner.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-sm hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span className="font-medium">{partner.name}</span>
                <span className="text-amber-700 dark:text-amber-400">{formatCurrency(analysis.overdueDebt)}</span>
              </Link>
            ))}
            {dashboard.topOverdue.length === 0 && (
              <p className="text-sm text-zinc-500">لا توجد مديونية متأخرة حاليًا.</p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">إجمالي أعمار الديون</h2>
          <AgingChart data={dashboard.agingTotals} />
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">كل العملاء</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">إجمالي المديونية</th>
                <th className="px-4 py-3 font-medium">المتأخر</th>
                <th className="px-4 py-3 font-medium">مؤشر الالتزام</th>
                <th className="px-4 py-3 font-medium">المخاطر</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ partner, analysis }) => (
                <tr key={partner.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                      {partner.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{partner.city}</div>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(analysis.totalDebt)}</td>
                  <td className="px-4 py-3">{formatCurrency(analysis.overdueDebt)}</td>
                  <td className="px-4 py-3">{analysis.commitmentScore}/100</td>
                  <td className="px-4 py-3">
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

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}
      </div>
    </div>
  );
}
