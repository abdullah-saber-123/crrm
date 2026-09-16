import Link from "next/link";
import { ArrowLeft, Users2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listPartners } from "@/lib/customers-repo";
import { listShows, getNominationCounts, listAppointments } from "@/lib/collections-repo";
import { formatDate } from "@/lib/format";
import CreateShowForm from "@/components/CreateShowForm";
import ScheduleAppointmentForm from "@/components/ScheduleAppointmentForm";
import AppointmentStatusButtons from "@/components/AppointmentStatusButtons";
import ShowStatusToggle from "@/components/ShowStatusToggle";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "مجدول",
  done: "تم",
  missed: "لم يتم",
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  missed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner: partnerParam } = await searchParams;
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === "admin";
  const [shows, partners, appointments] = await Promise.all([
    listShows(),
    listPartners(),
    listAppointments(),
  ]);
  const showTotals = await Promise.all(
    shows.map(async (show) => {
      const counts = await getNominationCounts(show.id);
      return { showId: show.id, total: [...counts.values()].reduce((a, b) => a + b, 0) };
    })
  );
  const totalsByShow = new Map(showTotals.map((t) => [t.showId, t.total]));
  const defaultPartnerId = partnerParam ? Number(partnerParam) : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        موديول عروض الكولكشن: افتح عرضًا، رشّح العملاء المناسبين لحضوره، وأكّد الإدارة على المرشّحين.
      </p>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">العروض</h2>
          <CreateShowForm />
        </div>

        {shows.length === 0 ? (
          <p className="card p-6 text-sm text-muted">لا يوجد أي عرض كولكشن بعد — أنشئ واحدًا للبدء.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {shows.map((show) => {
              const totalNominations = totalsByShow.get(show.id) ?? 0;
              return (
                <div key={show.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{show.name}</span>
                      {show.status === "closed" && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                          مغلق
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {show.eventDate ? formatDate(show.eventDate) : "بدون تاريخ محدد"} ·{" "}
                      <Users2 className="inline" size={12} /> {totalNominations} ترشيح
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/collections/${show.id}/customers`}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      فتح العرض
                      <ArrowLeft className="mr-1 inline" size={14} />
                    </Link>
                    {isAdmin && (
                      <Link
                        href={`/collections/${show.id}/nominees`}
                        className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium"
                      >
                        المرشّحون
                      </Link>
                    )}
                    {isAdmin && <ShowStatusToggle showId={show.id} status={show.status} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div id="schedule" className="mb-6">
        <ScheduleAppointmentForm partners={partners} defaultPartnerId={defaultPartnerId} />
      </div>

      <section className="card overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold text-muted">مواعيد الحضور</h2>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
                <th className="px-3 py-2 font-medium">الموعد</th>
                <th className="px-3 py-2 font-medium">الغرض</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-card-border">
                  <td className="px-3 py-3">{a.partnerName}</td>
                  <td className="px-3 py-3">{new Date(a.scheduledAt).toLocaleString("ar-SA")}</td>
                  <td className="px-3 py-3">{a.purpose || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <AppointmentStatusButtons appointment={a} />
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    لا توجد مواعيد مجدولة بعد.
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
