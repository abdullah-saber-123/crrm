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
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  missed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
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
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">عرض الكولكشن والترشيح</h1>
      <p className="mb-8 text-sm text-zinc-500">
        القائمة الكاملة للعملاء متاحة للجميع لترشيح من يرونه مناسبًا لحضور عرض الكولكشن، مع عدد مرات الترشيح وتسجيل الحضور.
      </p>

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">العرض الحالي</label>
            <select name="show" defaultValue={selectedShowId} className="input">
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.eventDate ? `— ${formatDate(s.eventDate)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
            عرض
          </button>
        </form>
        <CreateShowForm />
      </section>

      {!selectedShow ? (
        <p className="rounded-xl border border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
          لا يوجد أي عرض كولكشن بعد — أنشئ واحدًا للبدء بالترشيح.
        </p>
      ) : (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">
            قائمة العملاء — {selectedShow.name}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-zinc-100 text-right dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">عدد مرات الترشيح</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                        {partner.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{partner.city}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium dark:bg-zinc-900">
                        {nominationCounts.get(partner.id) ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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

          <h3 className="mb-3 mt-6 text-sm font-semibold text-zinc-500">آخر الترشيحات</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {nominations.slice(0, 10).map((n) => (
              <li key={n.id} className="rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
                <span className="font-medium">{n.partnerName}</span> — رشّحه {n.nominatedBy || "—"}
                {n.notes ? ` · ${n.notes}` : ""}
              </li>
            ))}
            {nominations.length === 0 && <li className="text-zinc-500">لا توجد ترشيحات بعد.</li>}
          </ul>
        </section>
      )}

      <div id="schedule" className="mb-10">
        <ScheduleAppointmentForm partners={partners} defaultPartnerId={defaultPartnerId} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">مواعيد الحضور</h2>
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
    </div>
  );
}
