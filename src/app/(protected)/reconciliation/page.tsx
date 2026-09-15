import Link from "next/link";
import { proposeReconciliationCandidates, listReconciliationRecords } from "@/lib/reconciliation-repo";
import { formatCurrency, formatDate } from "@/lib/format";
import ReconciliationActions from "@/components/ReconciliationActions";

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

export default async function ReconciliationPage() {
  const [candidates, history] = await Promise.all([
    proposeReconciliationCandidates(),
    listReconciliationRecords(),
  ]);

  const pendingCandidates = candidates.filter((c) => !c.existing || c.existing.status === "pending");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">المطابقات</h1>
      <p className="mb-8 text-sm text-zinc-500">
        مطابقة الفواتير الصادرة مع الدفعات المستلمة من كل عميل، مع نموذج مصادقة لتأكيد أو رفض كل مطابقة.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">مطابقات مقترحة بحاجة لمراجعة</h2>
        {pendingCandidates.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
            لا توجد مطابقات معلّقة حاليًا.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingCandidates.map((c) => (
              <div
                key={c.key}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div className="flex-1 text-sm">
                  <Link href={`/customers/${c.partnerId}`} className="font-medium hover:underline">
                    {c.partnerName}
                  </Link>
                  <div className="mt-1 text-zinc-500">
                    فاتورة {c.invoice.ref} ({formatCurrency(c.invoice.amountTotal)}) ↔ دفعة {c.payment.ref} (
                    {formatCurrency(c.payment.amount)})
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    مبلغ مطابق: {formatCurrency(c.matchedAmount)} · تاريخ الدفعة: {formatDate(c.payment.paymentDate)}
                  </div>
                </div>
                <ReconciliationActions
                  partnerId={c.partnerId}
                  partnerName={c.partnerName}
                  invoiceRef={c.invoice.ref}
                  invoiceMoveId={c.invoice.id}
                  invoiceAmount={c.invoice.amountTotal}
                  paymentRef={c.payment.ref}
                  paymentId={c.payment.id}
                  paymentAmount={c.payment.amount}
                  matchedAmount={c.matchedAmount}
                />
              </div>
            ))}
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
                <th className="px-4 py-3 font-medium">فاتورة / دفعة</th>
                <th className="px-4 py-3 font-medium">المبلغ المطابق</th>
                <th className="px-4 py-3 font-medium">تاريخ المطابقة</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">صادق عليها</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">{r.partnerName}</td>
                  <td className="px-4 py-3">
                    {r.invoiceRef} / {r.paymentRef}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(r.matchedAmount)}</td>
                  <td className="px-4 py-3">{formatDate(r.reconciliationDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.confirmedBy ?? "—"}</td>
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
