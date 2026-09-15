import { getDb } from "@/lib/db";
import { listAllOpenInvoices, listAllPayments, listPartners, type Invoice, type Payment } from "@/lib/customers-repo";

export type ReconciliationRecord = {
  id: number;
  partnerId: number;
  partnerName: string;
  invoiceRef: string | null;
  invoiceMoveId: number | null;
  invoiceAmount: number | null;
  paymentRef: string | null;
  paymentId: number | null;
  paymentAmount: number | null;
  matchedAmount: number;
  reconciliationDate: string;
  status: "pending" | "confirmed" | "rejected";
  confirmedBy: string | null;
  confirmedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type ReconciliationCandidate = {
  key: string;
  partnerId: number;
  partnerName: string;
  invoice: Invoice;
  payment: Payment;
  matchedAmount: number;
  existing: ReconciliationRecord | null;
};

function rowToRecord(row: Record<string, unknown>): ReconciliationRecord {
  return {
    id: row.id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    invoiceRef: row.invoice_ref as string | null,
    invoiceMoveId: row.invoice_move_id as number | null,
    invoiceAmount: row.invoice_amount as number | null,
    paymentRef: row.payment_ref as string | null,
    paymentId: row.payment_id as number | null,
    paymentAmount: row.payment_amount as number | null,
    matchedAmount: row.matched_amount as number,
    reconciliationDate: row.reconciliation_date as string,
    status: row.status as ReconciliationRecord["status"],
    confirmedBy: row.confirmed_by as string | null,
    confirmedAt: row.confirmed_at as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

export function listReconciliationRecords(): ReconciliationRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM reconciliations ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToRecord);
}

export function getReconciliationRecord(id: number): ReconciliationRecord | undefined {
  const row = getDb().prepare("SELECT * FROM reconciliations WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToRecord(row) : undefined;
}

function findExistingRecord(invoiceMoveId: number, paymentId: number): ReconciliationRecord | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM reconciliations WHERE invoice_move_id = ? AND payment_id = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(invoiceMoveId, paymentId) as Record<string, unknown> | undefined;
  return row ? rowToRecord(row) : null;
}

/**
 * Proposes invoice <-> payment matches per customer using a simple
 * chronological, amount-proximity heuristic. This is a suggestion for a
 * human to review and confirm (المصادقة) — it does not touch Odoo.
 */
export async function proposeReconciliationCandidates(): Promise<ReconciliationCandidate[]> {
  const [partners, invoices, payments] = await Promise.all([
    listPartners(),
    listAllOpenInvoices(),
    listAllPayments(),
  ]);
  const partnerNames = new Map(partners.map((p) => [p.id, p.name]));

  const byPartner = new Map<number, { invoices: Invoice[]; payments: Payment[] }>();
  for (const inv of invoices) {
    if (!byPartner.has(inv.partnerId)) byPartner.set(inv.partnerId, { invoices: [], payments: [] });
    byPartner.get(inv.partnerId)!.invoices.push(inv);
  }
  for (const p of payments) {
    if (!byPartner.has(p.partnerId)) byPartner.set(p.partnerId, { invoices: [], payments: [] });
    byPartner.get(p.partnerId)!.payments.push(p);
  }

  const candidates: ReconciliationCandidate[] = [];

  for (const [partnerId, group] of byPartner) {
    const sortedInvoices = [...group.invoices].sort(
      (a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    );
    const usedPayments = new Set<number>();

    for (const invoice of sortedInvoices) {
      const candidatePayments = group.payments
        .filter((p) => !usedPayments.has(p.id))
        .filter((p) => new Date(p.paymentDate) >= new Date(invoice.invoiceDate))
        .sort(
          (a, b) =>
            Math.abs(a.amount - invoice.amountResidual) - Math.abs(b.amount - invoice.amountResidual)
        );

      const bestMatch = candidatePayments[0];
      if (!bestMatch) continue;

      usedPayments.add(bestMatch.id);
      const matchedAmount = Math.min(bestMatch.amount, invoice.amountTotal);

      candidates.push({
        key: `${invoice.id}-${bestMatch.id}`,
        partnerId,
        partnerName: partnerNames.get(partnerId) ?? `#${partnerId}`,
        invoice,
        payment: bestMatch,
        matchedAmount,
        existing: findExistingRecord(invoice.id, bestMatch.id),
      });
    }
  }

  return candidates.sort(
    (a, b) => new Date(b.payment.paymentDate).getTime() - new Date(a.payment.paymentDate).getTime()
  );
}

export function confirmReconciliation(input: {
  partnerId: number;
  partnerName: string;
  invoiceRef: string;
  invoiceMoveId: number;
  invoiceAmount: number;
  paymentRef: string;
  paymentId: number;
  paymentAmount: number;
  matchedAmount: number;
  status: "confirmed" | "rejected";
  confirmedBy: string;
  notes: string | null;
}): ReconciliationRecord {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO reconciliations
        (partner_id, partner_name, invoice_ref, invoice_move_id, invoice_amount,
         payment_ref, payment_id, payment_amount, matched_amount,
         reconciliation_date, status, confirmed_by, confirmed_at, notes)
       VALUES (@partnerId, @partnerName, @invoiceRef, @invoiceMoveId, @invoiceAmount,
               @paymentRef, @paymentId, @paymentAmount, @matchedAmount,
               @reconciliationDate, @status, @confirmedBy, @confirmedAt, @notes)`
    )
    .run({
      ...input,
      reconciliationDate: now.slice(0, 10),
      confirmedAt: now,
    });

  return getReconciliationRecord(Number(result.lastInsertRowid))!;
}
