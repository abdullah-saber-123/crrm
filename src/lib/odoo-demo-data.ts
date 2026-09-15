/**
 * Fixture data shaped like Odoo's res.partner / account.move / account.payment
 * models, used when ODOO_URL / ODOO_DB / ODOO_USERNAME / ODOO_API_KEY are not
 * configured — so the app is fully demoable without a live Odoo instance.
 */

export type DemoPartner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
};

export type DemoInvoice = {
  id: number;
  partner_id: number;
  name: string;
  move_type: "out_invoice" | "out_refund";
  invoice_date: string;
  invoice_date_due: string;
  amount_total: number;
  amount_residual: number;
  payment_state: "not_paid" | "partial" | "paid";
  state: "posted";
};

export type DemoPayment = {
  id: number;
  partner_id: number;
  name: string;
  payment_date: string;
  amount: number;
  payment_type: "inbound";
  state: "posted";
};

export const demoPartners: DemoPartner[] = [
  { id: 101, name: "شركة الفا للتجارة", email: "billing@alfa-trade.example", phone: "+966 11 123 4567", city: "الرياض" },
  { id: 102, name: "مؤسسة النور الصناعية", email: "ap@alnoor-ind.example", phone: "+966 12 234 5678", city: "جدة" },
  { id: 103, name: "مجموعة الشرق للمقاولات", email: "finance@alsharq-cont.example", phone: "+966 13 345 6789", city: "الدمام" },
  { id: 104, name: "متجر الواحة الغذائي", email: "accounts@waha-food.example", phone: "+966 14 456 7890", city: "المدينة المنورة" },
  { id: 105, name: "شركة الرواد للتقنية", email: "finance@rowad-tech.example", phone: "+966 11 567 8901", city: "الرياض" },
  { id: 106, name: "مصنع البركة للبلاستيك", email: "ap@baraka-plastic.example", phone: "+966 12 678 9012", city: "جدة" },
];

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthsAgo(n: number, day = 5): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Simple deterministic pseudo-random generator so demo data is stable across runs.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildLedger(partnerId: number, seed: number, profile: "reliable" | "average" | "risky") {
  const rand = seeded(seed);
  const invoices: DemoInvoice[] = [];
  const payments: DemoPayment[] = [];

  let invoiceCounter = 1;
  let paymentCounter = 1;

  for (let m = 11; m >= 0; m--) {
    const invoiceDate = monthsAgo(m, 3 + Math.floor(rand() * 10));
    const dueDate = addDays(invoiceDate, 30);
    const baseAmount = 8000 + rand() * 22000;
    const amount = Math.round(baseAmount / 50) * 50;

    const invoiceId = partnerId * 1000 + invoiceCounter++;
    // How much of this invoice eventually gets paid, and how late.
    let payRatio = 1;
    let delayDays = 0;
    if (profile === "reliable") {
      payRatio = rand() > 0.05 ? 1 : 0.7;
      delayDays = Math.floor(rand() * 5);
    } else if (profile === "average") {
      payRatio = rand() > 0.15 ? 1 : 0.5;
      delayDays = Math.floor(rand() * 20);
    } else {
      payRatio = rand() > 0.35 ? 1 : rand() > 0.5 ? 0.4 : 0;
      delayDays = Math.floor(10 + rand() * 45);
    }

    // Don't fully resolve the most recent 1-2 months, so there's an open balance.
    const isRecent = m <= 1;
    const effectivePayRatio = isRecent ? Math.min(payRatio, rand() > 0.5 ? 0.5 : 0) : payRatio;

    const paidAmount = Math.round(amount * effectivePayRatio);
    const residual = amount - paidAmount;

    invoices.push({
      id: invoiceId,
      partner_id: partnerId,
      name: `INV/${invoiceDate.getFullYear()}/${String(invoiceId).slice(-5)}`,
      move_type: "out_invoice",
      invoice_date: iso(invoiceDate),
      invoice_date_due: iso(dueDate),
      amount_total: amount,
      amount_residual: residual,
      payment_state: residual <= 0 ? "paid" : paidAmount > 0 ? "partial" : "not_paid",
      state: "posted",
    });

    if (paidAmount > 0) {
      const paymentDate = addDays(dueDate, delayDays - 30 + 30); // roughly around/after due date
      payments.push({
        id: partnerId * 1000 + 500 + paymentCounter++,
        partner_id: partnerId,
        name: `PAY/${paymentDate.getFullYear()}/${String(paymentCounter).padStart(4, "0")}`,
        payment_date: iso(paymentDate),
        amount: paidAmount,
        payment_type: "inbound",
        state: "posted",
      });
    }
  }

  return { invoices, payments };
}

const profiles: Record<number, "reliable" | "average" | "risky"> = {
  101: "reliable",
  102: "average",
  103: "risky",
  104: "reliable",
  105: "average",
  106: "risky",
};

const ledgers = new Map<number, { invoices: DemoInvoice[]; payments: DemoPayment[] }>();
for (const partner of demoPartners) {
  ledgers.set(partner.id, buildLedger(partner.id, partner.id * 17, profiles[partner.id]));
}

export function getDemoPartners(): DemoPartner[] {
  return demoPartners;
}

export function getDemoPartner(id: number): DemoPartner | undefined {
  return demoPartners.find((p) => p.id === id);
}

export function getDemoInvoices(partnerId: number): DemoInvoice[] {
  return ledgers.get(partnerId)?.invoices ?? [];
}

export function getDemoPayments(partnerId: number): DemoPayment[] {
  return ledgers.get(partnerId)?.payments ?? [];
}

export function getAllDemoInvoices(): DemoInvoice[] {
  return [...ledgers.values()].flatMap((l) => l.invoices);
}

export function getAllDemoPayments(): DemoPayment[] {
  return [...ledgers.values()].flatMap((l) => l.payments);
}
