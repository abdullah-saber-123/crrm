import Link from "next/link";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { listAppointments, listCallLogs } from "@/lib/collections-repo";
import { formatCurrency, formatDate } from "@/lib/format";
import ScheduleAppointmentForm from "@/components/ScheduleAppointmentForm";
import AppointmentStatusButtons from "@/components/AppointmentStatusButtons";
import CallLogForm from "@/components/CallLogForm";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "مجدول",
  done: "تم",
  missed: "لم يتم",
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  missed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner: partnerParam } = await searchParams;
  const defaultPartnerId = partnerParam ? Number(partnerParam) : undefined;

  const partners = await listPartners();
  const queue = (
    await Promise.all(
      partners.map(async (partner) => {
        const [invoices, payments] = await Promise.all([
          getPartnerInvoices(partner.id),
          getPartnerPayments(partner.id),
        ]);
        return { partner, analysis: analyzeCustomer(invoices, payments) };
      })
    )
  )
    .filter(({ analysis }) => analysis.overdueDebt > 0)
    .sort((a, b) => b.analysis.overdueDebt - a.analysis.overdueDebt);

  const appointments = listAppointments();
  const callLogs = listCallLogs();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">التحصيل</h1>
      <p className="mb-8 text-sm text-zinc-500">
        قائمة العملاء المستهدفين بالتحصيل، جدولة مواعيد المتابعة، وتسجيل الاتصالات والاستدعاءات.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">قائمة التحصيل (مرتبة حسب المتأخر)</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">المتأخر</th>
                <th className="px-4 py-3 font-medium">مؤشر الالتزام</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ partner, analysis }) => (
                <tr key={partner.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                      {partner.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(analysis.overdueDebt)}</td>
                  <td className="px-4 py-3">{analysis.commitmentScore}/100</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/collections?partner=${partner.id}#schedule`}
                      className="text-xs font-medium text-zinc-500 hover:underline"
                    >
                      جدولة موعد ↑
                    </Link>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    لا يوجد عملاء لديهم مديونية متأخرة حاليًا.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div id="schedule" className="mb-10 grid gap-6 lg:grid-cols-2">
        <ScheduleAppointmentForm partners={partners} defaultPartnerId={defaultPartnerId} />
        <CallLogForm partners={partners} appointments={appointments} defaultPartnerId={defaultPartnerId} />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">مواعيد التحصيل</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الموعد</th>
                <th className="px-4 py-3 font-medium">الغرض</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">{a.partnerName}</td>
                  <td className="px-4 py-3">{new Date(a.scheduledAt).toLocaleString("ar-SA")}</td>
                  <td className="px-4 py-3">{a.purpose || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AppointmentStatusButtons appointment={a} />
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    لا توجد مواعيد مجدولة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">سجل الاتصالات</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">النتيجة</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                <th className="px-4 py-3 font-medium">بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map((c) => (
                <tr key={c.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">{c.partnerName}</td>
                  <td className="px-4 py-3">{formatDate(c.callDate)}</td>
                  <td className="px-4 py-3">{c.outcome}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.notes || "—"}</td>
                  <td className="px-4 py-3">{c.createdBy ?? "—"}</td>
                </tr>
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    لا يوجد سجل اتصالات بعد.
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
