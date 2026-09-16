import { notFound } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { getShow, getNominationCounts } from "@/lib/collections-repo";
import { formatCurrency } from "@/lib/format";
import ShowTabs from "@/components/ShowTabs";
import NominateButton from "@/components/NominateButton";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = {
  "name-asc": { label: "الاسم (أ-ي)" },
  "name-desc": { label: "الاسم (ي-أ)" },
  "credit-desc": { label: "الحد الائتماني (الأعلى)" },
  "credit-asc": { label: "الحد الائتماني (الأقل)" },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

export default async function ShowCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ showId: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { showId: showIdParam } = await params;
  const { q, sort } = await searchParams;
  const showId = Number(showIdParam);
  const show = await getShow(showId);
  if (!show) notFound();

  const sortKey: SortKey = sort && sort in SORT_OPTIONS ? (sort as SortKey) : "name-asc";

  const partners = await listPartners();
  const nominationCounts = await getNominationCounts(showId);

  let rows = await Promise.all(
    partners.map(async (partner) => {
      const [invoices, payments] = await Promise.all([
        getPartnerInvoices(partner.id),
        getPartnerPayments(partner.id),
      ]);
      const analysis = analyzeCustomer(invoices, payments);
      return { partner, balance: analysis.totalDebt };
    })
  );

  if (q) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter(({ partner }) => partner.name.toLowerCase().includes(needle));
  }

  rows = [...rows].sort((a, b) => {
    switch (sortKey) {
      case "name-asc":
        return a.partner.name.localeCompare(b.partner.name, "ar");
      case "name-desc":
        return b.partner.name.localeCompare(a.partner.name, "ar");
      case "credit-desc":
        return b.partner.creditLimit - a.partner.creditLimit;
      case "credit-asc":
        return a.partner.creditLimit - b.partner.creditLimit;
    }
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <ShowTabs showId={showId} active="customers" />
      <h1 className="mb-1 text-lg font-semibold">{show.name}</h1>
      <p className="mb-6 text-sm text-muted">
        القائمة الكاملة للعملاء متاحة للجميع — رشّح أي عميل تراه مناسبًا لحضور هذا العرض.
      </p>

      <form method="GET" className="mb-4 flex flex-wrap items-center gap-2">
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
        <select name="sort" defaultValue={sortKey} className="input w-auto">
          {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium">
          تطبيق
        </button>
      </form>

      <section className="card overflow-visible">
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
                <th className="px-3 py-2 font-medium">التصنيف</th>
                <th className="px-3 py-2 font-medium">المحصّل</th>
                <th className="px-3 py-2 font-medium">الرصيد</th>
                <th className="px-3 py-2 font-medium">الحد الائتماني</th>
                <th className="px-3 py-2 font-medium">عدد الترشيحات</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ partner, balance }) => (
                <tr key={partner.id} className="border-t border-card-border">
                  <td className="px-3 py-3">
                    <Link href={`/customers/${partner.id}`} className="font-medium hover:underline">
                      {partner.name}
                    </Link>
                    <div className="text-xs text-muted">{partner.city}</div>
                  </td>
                  <td className="px-3 py-3">
                    {partner.paymentType === "cash" ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        نقدي
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        أجل
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">{partner.collectorName || "—"}</td>
                  <td className="px-3 py-3">{formatCurrency(balance)}</td>
                  <td className="px-3 py-3">{formatCurrency(partner.creditLimit)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      {nominationCounts.get(partner.id) ?? 0}
                    </span>
                  </td>
                  <td className="relative px-3 py-3">
                    <NominateButton showId={showId} partnerId={partner.id} partnerName={partner.name} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    لا يوجد عملاء مطابقون للبحث.
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
