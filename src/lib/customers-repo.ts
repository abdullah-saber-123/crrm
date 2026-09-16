import { isOdooConfigured, searchRead } from "@/lib/odoo";
import {
  getAllDemoInvoices,
  getAllDemoPayments,
  getDemoInvoices,
  getDemoPartner,
  getDemoPartners,
  getDemoPayments,
} from "@/lib/odoo-demo-data";

export type Partner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  creditLimit: number;
  /** Derived from creditLimit: 0 → نقدي (cash), otherwise أجل (credit/term). */
  paymentType: "cash" | "credit";
  collectorName: string | null;
};

export type Invoice = {
  id: number;
  partnerId: number;
  ref: string;
  type: "invoice" | "credit_note";
  invoiceDate: string;
  dueDate: string;
  amountTotal: number;
  amountResidual: number;
  paymentState: "not_paid" | "partial" | "paid";
};

export type Payment = {
  id: number;
  partnerId: number;
  ref: string;
  paymentDate: string;
  amount: number;
};

export const usingLiveOdoo = isOdooConfigured();

const PARTNER_FIELDS = ["id", "name", "email", "phone", "city", "credit_limit", "user_id"];

type OdooPartner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  credit_limit: number;
  /** Salesperson/account manager — many2one, [id, name] or false when unset. */
  user_id: [number, string] | false;
};

function mapOdooPartner(r: OdooPartner): Partner {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    creditLimit: r.credit_limit,
    paymentType: r.credit_limit > 0 ? "credit" : "cash",
    collectorName: r.user_id ? r.user_id[1] : null,
  };
}

export async function listPartners(): Promise<Partner[]> {
  if (usingLiveOdoo) {
    const rows = await searchRead<OdooPartner>(
      "res.partner",
      [["customer_rank", ">", 0]],
      PARTNER_FIELDS,
      { limit: 200, order: "name asc" }
    );
    return rows.map(mapOdooPartner);
  }
  return getDemoPartners().map(mapOdooPartner);
}

export async function getPartner(id: number): Promise<Partner | undefined> {
  if (usingLiveOdoo) {
    const rows = await searchRead<OdooPartner>("res.partner", [["id", "=", id]], PARTNER_FIELDS);
    return rows[0] ? mapOdooPartner(rows[0]) : undefined;
  }
  const demo = getDemoPartner(id);
  return demo ? mapOdooPartner(demo) : undefined;
}

export async function getPartnerInvoices(partnerId: number): Promise<Invoice[]> {
  if (usingLiveOdoo) {
    type OdooMove = {
      id: number;
      partner_id: [number, string];
      name: string;
      move_type: "out_invoice" | "out_refund";
      invoice_date: string;
      invoice_date_due: string;
      amount_total: number;
      amount_residual: number;
      payment_state: "not_paid" | "partial" | "paid";
    };
    const rows = await searchRead<OdooMove>(
      "account.move",
      [
        ["partner_id", "=", partnerId],
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["state", "=", "posted"],
      ],
      [
        "id",
        "partner_id",
        "name",
        "move_type",
        "invoice_date",
        "invoice_date_due",
        "amount_total",
        "amount_residual",
        "payment_state",
      ],
      { order: "invoice_date asc" }
    );
    return rows.map((r) => ({
      id: r.id,
      partnerId,
      ref: r.name,
      type: r.move_type === "out_refund" ? "credit_note" : "invoice",
      invoiceDate: r.invoice_date,
      dueDate: r.invoice_date_due,
      amountTotal: r.amount_total,
      amountResidual: r.amount_residual,
      paymentState: r.payment_state,
    }));
  }

  return getDemoInvoices(partnerId).map((inv) => ({
    id: inv.id,
    partnerId: inv.partner_id,
    ref: inv.name,
    type: inv.move_type === "out_refund" ? "credit_note" : "invoice",
    invoiceDate: inv.invoice_date,
    dueDate: inv.invoice_date_due,
    amountTotal: inv.amount_total,
    amountResidual: inv.amount_residual,
    paymentState: inv.payment_state,
  }));
}

export async function getPartnerPayments(partnerId: number): Promise<Payment[]> {
  if (usingLiveOdoo) {
    type OdooPayment = {
      id: number;
      name: string;
      payment_date: string;
      amount: number;
    };
    const rows = await searchRead<OdooPayment>(
      "account.payment",
      [
        ["partner_id", "=", partnerId],
        ["payment_type", "=", "inbound"],
        ["state", "=", "posted"],
      ],
      ["id", "name", "payment_date", "amount"],
      { order: "payment_date asc" }
    );
    return rows.map((r) => ({
      id: r.id,
      partnerId,
      ref: r.name,
      paymentDate: r.payment_date,
      amount: r.amount,
    }));
  }

  return getDemoPayments(partnerId).map((p) => ({
    id: p.id,
    partnerId: p.partner_id,
    ref: p.name,
    paymentDate: p.payment_date,
    amount: p.amount,
  }));
}

export async function listAllOpenInvoices(): Promise<Invoice[]> {
  if (usingLiveOdoo) {
    type OdooMove = {
      id: number;
      partner_id: [number, string];
      name: string;
      move_type: "out_invoice" | "out_refund";
      invoice_date: string;
      invoice_date_due: string;
      amount_total: number;
      amount_residual: number;
      payment_state: "not_paid" | "partial" | "paid";
    };
    const rows = await searchRead<OdooMove>(
      "account.move",
      [
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["state", "=", "posted"],
        ["payment_state", "in", ["not_paid", "partial"]],
      ],
      [
        "id",
        "partner_id",
        "name",
        "move_type",
        "invoice_date",
        "invoice_date_due",
        "amount_total",
        "amount_residual",
        "payment_state",
      ]
    );
    return rows.map((r) => ({
      id: r.id,
      partnerId: r.partner_id[0],
      ref: r.name,
      type: r.move_type === "out_refund" ? "credit_note" : "invoice",
      invoiceDate: r.invoice_date,
      dueDate: r.invoice_date_due,
      amountTotal: r.amount_total,
      amountResidual: r.amount_residual,
      paymentState: r.payment_state,
    }));
  }

  return getAllDemoInvoices()
    .filter((inv) => inv.payment_state !== "paid")
    .map((inv) => ({
      id: inv.id,
      partnerId: inv.partner_id,
      ref: inv.name,
      type: inv.move_type === "out_refund" ? "credit_note" : "invoice",
      invoiceDate: inv.invoice_date,
      dueDate: inv.invoice_date_due,
      amountTotal: inv.amount_total,
      amountResidual: inv.amount_residual,
      paymentState: inv.payment_state,
    }));
}

export async function listAllPayments(): Promise<Payment[]> {
  if (usingLiveOdoo) {
    const invoices = await listAllOpenInvoices();
    const partnerIds = [...new Set(invoices.map((i) => i.partnerId))];
    const results = await Promise.all(partnerIds.map((id) => getPartnerPayments(id)));
    return results.flat();
  }
  return getAllDemoPayments().map((p) => ({
    id: p.id,
    partnerId: p.partner_id,
    ref: p.name,
    paymentDate: p.payment_date,
    amount: p.amount,
  }));
}
