import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getShow,
  listNominations,
  getNominationCounts,
  listRegistrations,
} from "@/lib/collections-repo";
import ShowTabs from "@/components/ShowTabs";
import ConfirmNomineeButton from "@/components/ConfirmNomineeButton";

export const dynamic = "force-dynamic";

export default async function ShowNomineesPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId: showIdParam } = await params;
  const showId = Number(showIdParam);
  const show = getShow(showId);
  if (!show) notFound();

  const nominations = listNominations(showId);
  const counts = getNominationCounts(showId);
  const registrations = listRegistrations(showId);
  const registeredPartnerIds = new Set(registrations.map((r) => r.partnerId));

  const nomineeIds = [...counts.keys()];
  const nominees = nomineeIds
    .map((partnerId) => {
      const partnerNominations = nominations.filter((n) => n.partnerId === partnerId);
      return {
        partnerId,
        partnerName: partnerNominations[0]?.partnerName ?? "",
        count: counts.get(partnerId) ?? 0,
        nominatedBy: [...new Set(partnerNominations.map((n) => n.nominatedBy || "—"))].join("، "),
        lastNote: partnerNominations[0]?.notes ?? null,
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <ShowTabs showId={showId} active="nominees" />
      <h1 className="mb-1 text-lg font-semibold">{show.name} — المرشّحون</h1>
      <p className="mb-6 text-sm text-muted">
        العملاء اللي حصلوا على ترشيح واحد أو أكثر لهذا العرض. الإدارة تراجع وتؤكّد تسجيل العميل بالعرض.
      </p>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
                <th className="px-3 py-2 font-medium">إجمالي الترشيحات</th>
                <th className="px-3 py-2 font-medium">رشّحه</th>
                <th className="px-3 py-2 font-medium">ملاحظة</th>
                <th className="px-3 py-2 font-medium">تأكيد الإدارة</th>
              </tr>
            </thead>
            <tbody>
              {nominees.map((n) => (
                <tr key={n.partnerId} className="border-t border-card-border">
                  <td className="px-3 py-3">
                    <Link href={`/customers/${n.partnerId}`} className="font-medium hover:underline">
                      {n.partnerName}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      {n.count}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{n.nominatedBy}</td>
                  <td className="px-3 py-3 text-muted">{n.lastNote || "—"}</td>
                  <td className="px-3 py-3">
                    <ConfirmNomineeButton
                      showId={showId}
                      partnerId={n.partnerId}
                      partnerName={n.partnerName}
                      isRegistered={registeredPartnerIds.has(n.partnerId)}
                    />
                  </td>
                </tr>
              ))}
              {nominees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    لا يوجد مرشّحون بعد — رشّح عملاء من صفحة كل العملاء.
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
