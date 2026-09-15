import { notFound } from "next/navigation";
import Link from "next/link";
import { getPartner, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { formatCurrency, formatDate } from "@/lib/format";
import SalesCollectionChart from "@/components/SalesCollectionChart";
import AgingChart from "@/components/AgingChart";

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
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link href="/customers" className="mb-4 inline-block text-sm text-zinc-500 hover:underline">
        ← العملاء
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{partner.name}</h1>
          <p className="text-sm text-zinc-500">
            {partner.city} · {partner.phone} · {partner.email}
          </p>
        </div>
        <Link
          href={`/collections?partner=${partner.id}`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          جدولة موعد تحصيل
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="إجمالي المديونية" value={formatCurrency(analysis.totalDebt)} />
        <KpiCard label="المتأخر عن الاستحقاق" value={formatCurrency(analysis.overdueDebt)} tone="warn" />
        <KpiCard label="مؤشر الالتزام" value={`${analysis.commitmentScore}/100`} />
        <KpiCard label="متوسط أيام التأخير" value={`${Math.round(analysis.averageDelayDays)} يوم`} />
      </div>

      <section className="mb-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-semibold">المبيعات والتحصيل الشهري (آخر 12 شهرًا)</h2>
        <SalesCollectionChart data={analysis.monthlySeries} />
      </section>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">أعمار الديون</h2>
          <AgingChart data={analysis.aging} />
        </section>

        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">التوصيات</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
                <span aria-hidden>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">كشف الحساب</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">المرجع</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">مدين</th>
                <th className="px-4 py-3 font-medium">دائن</th>
                <th className="px-4 py-3 font-medium">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {statementWithBalance.map((row, i) => (
                <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.ref}</td>
                  <td className="px-4 py-3">
                    {row.type === "invoice" ? "فاتورة" : row.type === "credit_note" ? "إشعار دائن" : "دفعة"}
                  </td>
                  <td className="px-4 py-3">{row.debit ? formatCurrency(row.debit) : "—"}</td>
                  <td className="px-4 py-3">{row.credit ? formatCurrency(row.credit) : "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(row.balance)}</td>
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
      <div className={`mt-1 text-xl font-semibold ${tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}
      </div>
    </div>
  );
}
