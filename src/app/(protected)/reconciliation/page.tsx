import Link from "next/link";
import { listPartners, getPartner } from "@/lib/customers-repo";
import { computeAccountBalanceAsOf, listAccountReconciliations } from "@/lib/reconciliation-repo";
import { formatCurrency, formatDate } from "@/lib/format";
import AccountReconciliationForm from "@/components/AccountReconciliationForm";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار المصادقة",
  confirmed: "تمت المصادقة",
  rejected: "مرفوضة",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string; asOf?: string }>;
}) {
  const { partner: partnerParam, asOf } = await searchParams;
  const partners = await listPartners();

  const selectedPartnerId = partnerParam ? Number(partnerParam) : partners[0]?.id;
  const asOfDate = asOf || today();

  const [selectedPartner, balance, history] = await Promise.all([
    selectedPartnerId ? getPartner(selectedPartnerId) : undefined,
    selectedPartnerId ? computeAccountBalanceAsOf(selectedPartnerId, asOfDate) : undefined,
    Promise.resolve(listAccountReconciliations()),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">المطابقات</h1>
      <p className="mb-8 text-sm text-zinc-500">
        مطابقة رصيد حساب العميل بالكامل حتى تاريخ معيّن (وليس فاتورة بفاتورة)، مع نموذج مصادقة وتاريخ مطابقة.
      </p>

      <section className="mb-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">العميل</label>
            <select name="partner" defaultValue={selectedPartnerId} className="input">
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">المطابقة حتى تاريخ</label>
            <input type="date" name="asOf" defaultValue={asOfDate} className="input" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            حساب الرصيد
          </button>
        </form>

        {selectedPartner && balance && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-lg font-semibold">
                <Link href={`/customers/${selectedPartner.id}`} className="hover:underline">
                  {selectedPartner.name}
                </Link>
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
                  <div className="text-xs text-zinc-500">إجمالي الفواتير حتى {formatDate(asOfDate)}</div>
                  <div className="font-semibold">{formatCurrency(balance.totalInvoiced)}</div>
                </div>
                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900">
                  <div className="text-xs text-zinc-500">إجمالي التحصيل حتى {formatDate(asOfDate)}</div>
                  <div className="font-semibold">{formatCurrency(balance.totalPaid)}</div>
                </div>
                <div className="col-span-2 rounded-lg bg-amber-100 p-3 dark:bg-amber-950">
                  <div className="text-xs text-amber-700 dark:text-amber-400">رصيد الحساب حتى {formatDate(asOfDate)}</div>
                  <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                    {formatCurrency(balance.balance)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">نموذج المصادقة</h3>
              <AccountReconciliationForm
                partnerId={selectedPartner.id}
                partnerName={selectedPartner.name}
                asOfDate={asOfDate}
                balance={balance.balance}
                totalInvoiced={balance.totalInvoiced}
                totalPaid={balance.totalPaid}
              />
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">سجل المطابقات</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">المطابقة حتى تاريخ</th>
                <th className="px-4 py-3 font-medium">الرصيد</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">صادق عليها</th>
                <th className="px-4 py-3 font-medium">تاريخ المصادقة</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">{r.partnerName}</td>
                  <td className="px-4 py-3">{formatDate(r.asOfDate)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.confirmedBy ?? "—"}</td>
                  <td className="px-4 py-3">{r.confirmedAt ? formatDate(r.confirmedAt) : "—"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    لا يوجد سجل مطابقات بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
