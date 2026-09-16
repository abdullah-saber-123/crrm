import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Wallet, AlertTriangle, Gauge, Clock } from "lucide-react";
import { getPartner, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import SalesCollectionChart from "@/components/SalesCollectionChart";
import AgingChart from "@/components/AgingChart";
import KpiCard from "@/components/KpiCard";

export const dynamic = "force-dynamic";

type StatementRow = {
  date: string;
  ref: string;
  type: "invoice" | "credit_note" | "payment";
  debit: number;
  credit: number;
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partnerId = Number(id);
  const partner = await getPartner(partnerId);
  if (!partner) notFound();

  const [invoices, payments] = await Promise.all([
    getPartnerInvoices(partnerId),
    getPartnerPayments(partnerId),
  ]);
  const analysis = analyzeCustomer(invoices, payments);

  const statement: StatementRow[] = [
    ...invoices.map((inv) => ({
      date: inv.invoiceDate,
      ref: inv.ref,
      type: inv.type,
      debit: inv.type === "invoice" ? inv.amountTotal : 0,
      credit: inv.type === "credit_note" ? inv.amountTotal : 0,
    })),
    ...payments.map((p) => ({
      date: p.paymentDate,
      ref: p.ref,
      type: "payment" as const,
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const statementWithBalance = statement.reduce<Array<StatementRow & { balance: number }>>((acc, row) => {
    const previousBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    acc.push({ ...row, balance: previousBalance + row.debit - row.credit });
    return acc;
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <Link href="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:underline">
        <ArrowRight size={14} /> العملاء
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{partner.name}</h1>
          <p className="text-sm text-muted">
            {partner.city} · {partner.phone} · {partner.email}
          </p>
        </div>
        <Link
          href={`/collections?partner=${partner.id}`}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          جدولة موعد حضور
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="إجمالي المديونية" value={formatCurrency(analysis.totalDebt)} icon={Wallet} tone="purple" />
        <KpiCard
          label="المتأخر عن الاستحقاق"
          value={formatCurrency(analysis.overdueDebt)}
          icon={AlertTriangle}
          tone="red"
        />
        <KpiCard label="مؤشر الالتزام" value={`${analysis.commitmentScore}/100`} icon={Gauge} tone="green" />
        <KpiCard
          label="متوسط أيام التأخير"
          value={`${Math.round(analysis.averageDelayDays)} يوم`}
          icon={Clock}
          tone="orange"
        />
      </div>

      <section className="card mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">المبيعات والتحصيل الشهري (آخر 12 شهرًا)</h2>
        <SalesCollectionChart data={analysis.monthlySeries} />
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted">أعمار الديون</h2>
          <AgingChart data={analysis.aging} />
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted">التوصيات</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.05]">
                <span aria-hidden>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold text-muted">كشف الحساب</h2>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">التاريخ</th>
                <th className="px-3 py-2 font-medium">المرجع</th>
                <th className="px-3 py-2 font-medium">النوع</th>
                <th className="px-3 py-2 font-medium">مدين</th>
                <th className="px-3 py-2 font-medium">دائن</th>
                <th className="px-3 py-2 font-medium">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {statementWithBalance.map((row, i) => (
                <tr key={i} className="border-t border-card-border">
                  <td className="px-3 py-3">{formatDate(row.date)}</td>
                  <td className="px-3 py-3">{row.ref}</td>
                  <td className="px-3 py-3">
                    {row.type === "invoice" ? "فاتورة" : row.type === "credit_note" ? "إشعار دائن" : "دفعة"}
                  </td>
                  <td className="px-3 py-3">{row.debit ? formatCurrency(row.debit) : "—"}</td>
                  <td className="px-3 py-3">{row.credit ? formatCurrency(row.credit) : "—"}</td>
                  <td className="px-3 py-3 font-medium">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
