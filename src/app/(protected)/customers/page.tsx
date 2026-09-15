import Link from "next/link";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { formatCurrency } from "@/lib/format";

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

  rows.sort((a, b) => b.analysis.overdueDebt - a.analysis.overdueDebt);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">تحليل العملاء</h1>
      <p className="mb-8 text-sm text-zinc-500">
        نظرة عامة على التزام العملاء بالسداد ومستوى المخاطر، مرتبة حسب المديونية المتأخرة.
      </p>

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
            {rows.map(({ partner, analysis }) => (
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
    </div>
  );
}
