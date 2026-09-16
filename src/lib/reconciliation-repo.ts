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
    asOfDate: (row.as_of_date as Date).toISOString().slice(0, 10),
    balance: Number(row.balance),
    totalInvoiced: Number(row.total_invoiced),
    totalPaid: Number(row.total_paid),
    status: row.status as AccountReconciliation["status"],
    confirmedBy: row.confirmed_by as string | null,
    confirmedAt: row.confirmed_at ? (row.confirmed_at as Date).toISOString() : null,
    notes: row.notes as string | null,
    createdAt: (row.created_at as Date).toISOString(),
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

export async function listAccountReconciliations(partnerId?: number): Promise<AccountReconciliation[]> {
  const db = await getDb();
  const { rows } = partnerId
    ? await db.query(
        "SELECT * FROM account_reconciliations WHERE partner_id = $1 ORDER BY created_at DESC",
        [partnerId]
      )
    : await db.query("SELECT * FROM account_reconciliations ORDER BY created_at DESC");
  return rows.map(rowToRecord);
}

export async function confirmAccountReconciliation(input: {
  partnerId: number;
  partnerName: string;
  asOfDate: string;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
  status: "confirmed" | "rejected";
  confirmedBy: string;
  notes: string | null;
}): Promise<AccountReconciliation> {
  const db = await getDb();
  const { rows } = await db.query(
    `INSERT INTO account_reconciliations
      (partner_id, partner_name, as_of_date, balance, total_invoiced, total_paid,
       status, confirmed_by, confirmed_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9)
     RETURNING *`,
    [
      input.partnerId,
      input.partnerName,
      input.asOfDate,
      input.balance,
      input.totalInvoiced,
      input.totalPaid,
      input.status,
      input.confirmedBy,
      input.notes,
    ]
  );
  return rowToRecord(rows[0]);
}
