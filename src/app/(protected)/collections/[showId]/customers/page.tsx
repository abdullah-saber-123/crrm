import { notFound } from "next/navigation";
import Link from "next/link";
import { listPartners, getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";
import { analyzeCustomer } from "@/lib/customer-analytics";
import { getShow, getNominationCounts } from "@/lib/collections-repo";
import { formatCurrency } from "@/lib/format";
import ShowTabs from "@/components/ShowTabs";
import NominateButton from "@/components/NominateButton";

export const dynamic = "force-dynamic";

export default async function ShowCustomersPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId: showIdParam } = await params;
  const showId = Number(showIdParam);
  const show = await getShow(showId);
  if (!show) notFound();

  const partners = await listPartners();
  const nominationCounts = await getNominationCounts(showId);

  const rows = await Promise.all(
    partners.map(async (partner) => {
      const [invoices, payments] = await Promise.all([
        getPartnerInvoices(partner.id),
        getPartnerPayments(partner.id),
      ]);
      const analysis = analyzeCustomer(invoices, payments);
      return { partner, balance: analysis.totalDebt };
    })
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <ShowTabs showId={showId} active="customers" />
      <h1 className="mb-1 text-lg font-semibold">{show.name}</h1>
      <p className="mb-6 text-sm text-muted">
        القائمة الكاملة للعملاء متاحة للجميع — رشّح أي عميل تراه مناسبًا لحضور هذا العرض.
      </p>

      <section className="card overflow-visible">
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">العميل</th>
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
