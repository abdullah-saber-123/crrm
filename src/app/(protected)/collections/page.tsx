import Link from "next/link";
import { listPartners } from "@/lib/customers-repo";
import {
  listShows,
  getShow,
  listNominations,
  getNominationCounts,
  listRegistrations,
  listAppointments,
} from "@/lib/collections-repo";
import { formatDate } from "@/lib/format";
import CreateShowForm from "@/components/CreateShowForm";
import NominationActions from "@/components/NominationActions";
import ScheduleAppointmentForm from "@/components/ScheduleAppointmentForm";
import AppointmentStatusButtons from "@/components/AppointmentStatusButtons";

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
  searchParams: Promise<{ show?: string; partner?: string }>;
}) {
  const { show: showParam, partner: partnerParam } = await searchParams;

  const [shows, partners] = await Promise.all([listShows(), listPartners()]);
  const selectedShowId = showParam ? Number(showParam) : shows[0]?.id;
  const selectedShow = selectedShowId ? getShow(selectedShowId) : undefined;

  const nominationCounts = selectedShowId ? getNominationCounts(selectedShowId) : new Map<number, number>();
  const registrations = selectedShowId ? listRegistrations(selectedShowId) : [];
  const registeredPartnerIds = new Set(registrations.map((r) => r.partnerId));
  const nominations = selectedShowId ? listNominations(selectedShowId) : [];

  const appointments = listAppointments();
  const defaultPartnerId = partnerParam ? Number(partnerParam) : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        القائمة الكاملة للعملاء متاحة للجميع لترشيح من يرونه مناسبًا لحضور عرض الكولكشن، مع عدد مرات الترشيح وتسجيل الحضور.
      </p>

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">العرض الحالي</label>
            <select name="show" defaultValue={selectedShowId} className="input">
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.eventDate ? `— ${formatDate(s.eventDate)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm">
            عرض
          </button>
        </form>
        <CreateShowForm />
      </section>

      {!selectedShow ? (
        <p className="card p-6 text-sm text-muted">لا يوجد أي عرض كولكشن بعد — أنشئ واحدًا للبدء بالترشيح.</p>
      ) : (
        <section className="mb-6">
          <div className="card overflow-hidden">
            <h2 className="px-5 pt-5 text-sm font-semibold text-muted">قائمة العملاء — {selectedShow.name}</h2>
            <div className="overflow-x-auto p-5 pt-3">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-right text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">العميل</th>
                    <th className="px-3 py-2 font-medium">عدد مرات الترشيح</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-t border-card-border">
                      <td className="px-3 py-3">
                        <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                          {partner.name}
                        </Link>
                        <div className="text-xs text-muted">{partner.city}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                          {nominationCounts.get(partner.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <NominationActions
                          showId={selectedShow.id}
                          partnerId={partner.id}
                          partnerName={partner.name}
                          isRegistered={registeredPartnerIds.has(partner.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card mt-4 p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted">آخر الترشيحات</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {nominations.slice(0, 10).map((n) => (
                <li key={n.id} className="rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/[0.05]">
                  <span className="font-medium">{n.partnerName}</span> — رشّحه {n.nominatedBy || "—"}
                  {n.notes ? ` · ${n.notes}` : ""}
                </li>
              ))}
              {nominations.length === 0 && <li className="text-muted">لا توجد ترشيحات بعد.</li>}
            </ul>
          </div>
        </section>
      )}

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
