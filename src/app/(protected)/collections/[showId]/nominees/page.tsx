import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listPartners } from "@/lib/customers-repo";
import {
  getShow,
  listNominations,
  getNominationCounts,
  listRegistrations,
  getNomineeBatches,
} from "@/lib/collections-repo";
import ShowTabs from "@/components/ShowTabs";
import ConfirmNomineeButton from "@/components/ConfirmNomineeButton";
import BatchSelect from "@/components/BatchSelect";
import PrintButton from "@/components/PrintButton";
import SortableHeader from "@/components/SortableHeader";

export const dynamic = "force-dynamic";

type SortField = "name" | "count";
type SortDir = "asc" | "desc";

const BATCH_LABELS: Record<number, string> = { 1: "الدفعة الأولى", 2: "الدفعة الثانية", 3: "الدفعة الثالثة" };

export default async function ShowNomineesPage({
  params,
  searchParams,
}: {
  params: Promise<{ showId: string }>;
  searchParams: Promise<{ q?: string; sort?: string; collector?: string; batch?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") redirect("/collections");

  const { showId: showIdParam } = await params;
  const { q, sort, collector, batch: batchParam } = await searchParams;
  const showId = Number(showIdParam);
  const show = await getShow(showId);
  if (!show) notFound();

  const [field, dir] = (sort?.split("-") ?? ["count", "desc"]) as [SortField, SortDir];
  const sortField: SortField = ["name", "count"].includes(field) ? field : "count";
  const sortDir: SortDir = dir === "asc" ? "asc" : "desc";
  const baseQuery = `${q ? `q=${encodeURIComponent(q)}&` : ""}${collector ? `collector=${encodeURIComponent(collector)}&` : ""}${batchParam ? `batch=${encodeURIComponent(batchParam)}&` : ""}`;

  const [nominations, counts, registrations, batches, partners] = await Promise.all([
    listNominations(showId),
    getNominationCounts(showId),
    listRegistrations(showId),
    getNomineeBatches(showId),
    listPartners(),
  ]);
  const registeredPartnerIds = new Set(registrations.map((r) => r.partnerId));
  const collectorByPartnerId = new Map(partners.map((p) => [p.id, p.collectorName]));
  const collectors = [...new Set(partners.map((p) => p.collectorName).filter((c): c is string => !!c))].sort(
    (a, b) => a.localeCompare(b, "ar")
  );

  const nomineeIds = [...counts.keys()];
  let nominees = nomineeIds.map((partnerId) => {
    const partnerNominations = nominations.filter((n) => n.partnerId === partnerId);
    return {
      partnerId,
      partnerName: partnerNominations[0]?.partnerName ?? "",
      count: counts.get(partnerId) ?? 0,
      nominatedBy: [...new Set(partnerNominations.map((n) => n.nominatedBy || "—"))].join("، "),
      lastNote: partnerNominations[0]?.notes ?? null,
      batch: batches.get(partnerId) ?? null,
      collectorName: collectorByPartnerId.get(partnerId) ?? null,
    };
  });

  if (q) {
    const needle = q.trim().toLowerCase();
    nominees = nominees.filter((n) => n.partnerName.toLowerCase().includes(needle));
  }

  if (collector) {
    nominees = nominees.filter((n) => n.collectorName === collector);
  }

  if (batchParam) {
    const batchNum = Number(batchParam);
    nominees = nominees.filter((n) => n.batch === batchNum);
  }

  const dirMul = sortDir === "asc" ? 1 : -1;
  nominees = [...nominees].sort((a, b) => {
    if (sortField === "name") return dirMul * a.partnerName.localeCompare(b.partnerName, "ar");
    return dirMul * (a.count - b.count);
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <ShowTabs showId={showId} active="nominees" isAdmin />
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-lg font-semibold">{show.name} — المرشّحون</h1>
        <PrintButton />
      </div>
      <p className="mb-6 text-sm text-muted print:hidden">
        العملاء اللي حصلوا على ترشيح واحد أو أكثر لهذا العرض. الإدارة تراجع وتؤكّد تسجيل العميل بالعرض، وتحدد دفعة الاستدعاء.
      </p>

      <div className="print-header hidden print:block">
        <h1 className="print-title">تقرير المرشّحين — {show.name}</h1>
        <div className="print-meta">
          <span>تاريخ العرض: {show.eventDate ?? "—"}</span>
          <span>تاريخ الطباعة: {new Date().toLocaleDateString("ar-SA")}</span>
          {collector && <span>المحصّل: {collector}</span>}
          {batchParam && <span>الدفعة: {BATCH_LABELS[Number(batchParam)] ?? batchParam}</span>}
          <span>عدد المرشّحين: {nominees.length}</span>
        </div>
      </div>

      <form method="GET" className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2 text-sm">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث باسم العميل…"
            className="w-full bg-transparent outline-none"
          />
        </div>
        <select
          name="collector"
          defaultValue={collector ?? ""}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
        >
          <option value="">كل المحصّلين</option>
          {collectors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="batch"
          defaultValue={batchParam ?? ""}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
        >
          <option value="">كل الدفعات</option>
          {[1, 2, 3].map((b) => (
            <option key={b} value={b}>
              {BATCH_LABELS[b]}
            </option>
          ))}
        </select>
        <input type="hidden" name="sort" value={`${sortField}-${sortDir}`} />
        <button type="submit" className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium">
          بحث
        </button>
      </form>

      <section className="card overflow-visible print:border-0 print:shadow-none">
        <div className="overflow-x-auto p-5 print:p-0">
          <table className="w-full min-w-[820px] text-sm print-table">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">
                  <SortableHeader field="name" label="العميل" activeField={sortField} activeDir={sortDir} baseQuery={baseQuery} />
                </th>
                <th className="px-3 py-2 font-medium">المحصّل</th>
                <th className="px-3 py-2 font-medium">
                  <SortableHeader field="count" label="إجمالي الترشيحات" activeField={sortField} activeDir={sortDir} baseQuery={baseQuery} />
                </th>
                <th className="px-3 py-2 font-medium">رشّحه</th>
                <th className="px-3 py-2 font-medium">ملاحظة</th>
                <th className="px-3 py-2 font-medium">الدفعة</th>
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
                  <td className="px-3 py-3 text-muted">{n.collectorName || "—"}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      {n.count}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{n.nominatedBy}</td>
                  <td className="px-3 py-3 text-muted">{n.lastNote || "—"}</td>
                  <td className="px-3 py-3">
                    <BatchSelect showId={showId} partnerId={n.partnerId} batch={n.batch} />
                  </td>
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
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
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
