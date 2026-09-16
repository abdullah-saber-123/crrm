import Link from "next/link";
import { listPartners, getPartner } from "@/lib/customers-repo";
import { computeAccountBalanceAsOf, listAccountReconciliations } from "@/lib/reconciliation-repo";
import { formatCurrency, formatDate } from "@/lib/format";
import AccountReconciliationForm from "@/components/AccountReconciliationForm";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-black/5 text-muted dark:bg-white/10",
  confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
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
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        مطابقة رصيد حساب العميل بالكامل حتى تاريخ معيّن (وليس فاتورة بفاتورة)، مع نموذج مصادقة وتاريخ مطابقة.
      </p>

      <section className="card mb-6 p-5">
        <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">العميل</label>
            <select name="partner" defaultValue={selectedPartnerId} className="input">
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">المطابقة حتى تاريخ</label>
            <input type="date" name="asOf" defaultValue={asOfDate} className="input" />
          </div>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
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
                <div className="rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.05]">
                  <div className="text-xs text-muted">إجمالي الفواتير حتى {formatDate(asOfDate)}</div>
                  <div className="font-semibold">{formatCurrency(balance.totalInvoiced)}</div>
                </div>
                <div className="rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.05]">
                  <div className="text-xs text-muted">إجمالي التحصيل حتى {formatDate(asOfDate)}</div>
                  <div className="font-semibold">{formatCurrency(balance.totalPaid)}</div>
                </div>
                <div className="col-span-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
                  <div className="text-xs text-amber-700 dark:text-amber-400">رصيد الحساب حتى {formatDate(asOfDate)}</div>
                  <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                    {formatCurrency(balance.balance)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted">نموذج المصادقة</h3>
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

      <section className="card overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold text-muted">سجل المطابقات</h2>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
                <th className="px-3 py-2 font-medium">المطابقة حتى تاريخ</th>
                <th className="px-3 py-2 font-medium">الرصيد</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                <th className="px-3 py-2 font-medium">صادق عليها</th>
                <th className="px-3 py-2 font-medium">تاريخ المصادقة</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} className="border-t border-card-border">
                  <td className="px-3 py-3">{r.partnerName}</td>
                  <td className="px-3 py-3">{formatDate(r.asOfDate)}</td>
                  <td className="px-3 py-3">{formatCurrency(r.balance)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">{r.confirmedBy ?? "—"}</td>
                  <td className="px-3 py-3">{r.confirmedAt ? formatDate(r.confirmedAt) : "—"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
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
