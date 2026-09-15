import { getDb } from "@/lib/db";
import { getPartnerInvoices, getPartnerPayments } from "@/lib/customers-repo";

export type AccountReconciliation = {
  id: number;
  partnerId: number;
  partnerName: string;
  asOfDate: string;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
  status: "pending" | "confirmed" | "rejected";
  confirmedBy: string | null;
  confirmedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type AccountBalanceAsOf = {
  partnerId: number;
  asOfDate: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  invoiceCount: number;
  paymentCount: number;
};

function rowToRecord(row: Record<string, unknown>): AccountReconciliation {
  return {
    id: row.id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    asOfDate: row.as_of_date as string,
    balance: row.balance as number,
    totalInvoiced: row.total_invoiced as number,
    totalPaid: row.total_paid as number,
    status: row.status as AccountReconciliation["status"],
    confirmedBy: row.confirmed_by as string | null,
    confirmedAt: row.confirmed_at as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Computes the customer's account balance as of a given date: total
 * invoiced up to that date minus total collected up to that date. This is
 * what account-level reconciliation confirms — not individual invoice ↔
 * payment pairs.
 */
export async function computeAccountBalanceAsOf(
  partnerId: number,
  asOfDate: string
): Promise<AccountBalanceAsOf> {
  const cutoff = new Date(asOfDate);
  const [invoices, payments] = await Promise.all([
    getPartnerInvoices(partnerId),
    getPartnerPayments(partnerId),
  ]);

  const invoicesToDate = invoices.filter((inv) => new Date(inv.invoiceDate) <= cutoff);
  const paymentsToDate = payments.filter((p) => new Date(p.paymentDate) <= cutoff);

  const totalInvoiced = invoicesToDate.reduce((sum, inv) => sum + inv.amountTotal, 0);
  const totalPaid = paymentsToDate.reduce((sum, p) => sum + p.amount, 0);

  return {
    partnerId,
    asOfDate,
    totalInvoiced,
    totalPaid,
    balance: totalInvoiced - totalPaid,
    invoiceCount: invoicesToDate.length,
    paymentCount: paymentsToDate.length,
  };
}

export function listAccountReconciliations(partnerId?: number): AccountReconciliation[] {
  const rows = partnerId
    ? (getDb()
        .prepare("SELECT * FROM account_reconciliations WHERE partner_id = ? ORDER BY created_at DESC")
        .all(partnerId) as Record<string, unknown>[])
    : (getDb()
        .prepare("SELECT * FROM account_reconciliations ORDER BY created_at DESC")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToRecord);
}

export function confirmAccountReconciliation(input: {
  partnerId: number;
  partnerName: string;
  asOfDate: string;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
  status: "confirmed" | "rejected";
  confirmedBy: string;
  notes: string | null;
}): AccountReconciliation {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO account_reconciliations
        (partner_id, partner_name, as_of_date, balance, total_invoiced, total_paid,
         status, confirmed_by, confirmed_at, notes)
       VALUES (@partnerId, @partnerName, @asOfDate, @balance, @totalInvoiced, @totalPaid,
               @status, @confirmedBy, @confirmedAt, @notes)`
    )
    .run({ ...input, confirmedAt: now });

  const row = getDb()
    .prepare("SELECT * FROM account_reconciliations WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToRecord(row);
}
