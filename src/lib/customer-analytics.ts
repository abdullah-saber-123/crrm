import type { Invoice, Payment } from "@/lib/customers-repo";

export type AgingBucket = {
  label: string;
  amount: number;
};

export type MonthlyPoint = {
  month: string; // YYYY-MM
  label: string; // localized short label
  sales: number;
  collected: number;
};

export type CustomerAnalysis = {
  totalInvoiced: number;
  totalCollected: number;
  totalDebt: number;
  overdueDebt: number;
  overdueRatio: number; // 0..1 of total debt that is overdue
  onTimePaymentRatio: number; // 0..1 of paid invoices settled by due date
  averageDelayDays: number;
  commitmentScore: number; // 0..100, higher = more reliable
  riskLevel: "low" | "medium" | "high";
  aging: AgingBucket[];
  monthlySeries: MonthlyPoint[];
  recommendations: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${ARABIC_MONTHS[m - 1]} ${y}`;
}

export function analyzeCustomer(invoices: Invoice[], payments: Payment[], now = new Date()): CustomerAnalysis {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amountTotal, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = invoices.reduce((sum, inv) => sum + Math.max(inv.amountResidual, 0), 0);

  const overdueInvoices = invoices.filter(
    (inv) => inv.amountResidual > 0 && new Date(inv.dueDate) < now
  );
  const overdueDebt = overdueInvoices.reduce((sum, inv) => sum + inv.amountResidual, 0);
  const overdueRatio = totalDebt > 0 ? overdueDebt / totalDebt : 0;

  // Aging buckets, based on days past due for the residual amount.
  const buckets: AgingBucket[] = [
    { label: "غير مستحق بعد", amount: 0 },
    { label: "1-30 يوم", amount: 0 },
    { label: "31-60 يوم", amount: 0 },
    { label: "61-90 يوم", amount: 0 },
    { label: "أكثر من 90 يوم", amount: 0 },
  ];
  for (const inv of invoices) {
    if (inv.amountResidual <= 0) continue;
    const daysPastDue = daysBetween(now, new Date(inv.dueDate));
    if (daysPastDue <= 0) buckets[0].amount += inv.amountResidual;
    else if (daysPastDue <= 30) buckets[1].amount += inv.amountResidual;
    else if (daysPastDue <= 60) buckets[2].amount += inv.amountResidual;
    else if (daysPastDue <= 90) buckets[3].amount += inv.amountResidual;
    else buckets[4].amount += inv.amountResidual;
  }

  // On-time payment ratio: approximate by matching settled invoices (residual
  // effectively 0) against whether payments covering them landed by the due
  // date, using the latest payment date at/after the invoice as a proxy.
  const settledInvoices = invoices.filter((inv) => inv.paymentState === "paid");
  let onTimeCount = 0;
  const delays: number[] = [];
  for (const inv of settledInvoices) {
    const coveringPayment = payments
      .filter((p) => new Date(p.paymentDate) >= new Date(inv.invoiceDate))
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())[0];
    const paymentDate = coveringPayment ? new Date(coveringPayment.paymentDate) : new Date(inv.dueDate);
    const delay = daysBetween(paymentDate, new Date(inv.dueDate));
    delays.push(Math.max(delay, 0));
    if (delay <= 0) onTimeCount += 1;
  }
  const onTimePaymentRatio = settledInvoices.length > 0 ? onTimeCount / settledInvoices.length : 1;
  const averageDelayDays = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

  // Commitment score: weighted blend of on-time ratio and how much of the
  // outstanding debt is overdue, penalized by average delay.
  const delayPenalty = Math.min(averageDelayDays / 60, 1) * 20;
  const commitmentScore = Math.round(
    Math.max(
      0,
      Math.min(100, onTimePaymentRatio * 60 + (1 - overdueRatio) * 40 - delayPenalty)
    )
  );

  const riskLevel: CustomerAnalysis["riskLevel"] =
    commitmentScore >= 75 ? "low" : commitmentScore >= 50 ? "medium" : "high";

  // Monthly sales vs collection series, last 12 months.
  const months: string[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const salesByMonth = new Map<string, number>();
  const collectedByMonth = new Map<string, number>();
  for (const inv of invoices) {
    const key = monthKey(inv.invoiceDate);
    salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + inv.amountTotal);
  }
  for (const p of payments) {
    const key = monthKey(p.paymentDate);
    collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + p.amount);
  }
  const monthlySeries: MonthlyPoint[] = months.map((key) => ({
    month: key,
    label: monthLabel(key),
    sales: Math.round(salesByMonth.get(key) ?? 0),
    collected: Math.round(collectedByMonth.get(key) ?? 0),
  }));

  const recommendations = buildRecommendations({
    commitmentScore,
    riskLevel,
    overdueRatio,
    overdueDebt,
    averageDelayDays,
    aging: buckets,
  });

  return {
    totalInvoiced,
    totalCollected,
    totalDebt,
    overdueDebt,
    overdueRatio,
    onTimePaymentRatio,
    averageDelayDays,
    commitmentScore,
    riskLevel,
    aging: buckets,
    monthlySeries,
    recommendations,
  };
}

function buildRecommendations(input: {
  commitmentScore: number;
  riskLevel: CustomerAnalysis["riskLevel"];
  overdueRatio: number;
  overdueDebt: number;
  averageDelayDays: number;
  aging: AgingBucket[];
}): string[] {
  const recs: string[] = [];
  const oldBucket = input.aging[4].amount + input.aging[3].amount;

  if (input.riskLevel === "high") {
    recs.push("توقف عن منح آجال ائتمان إضافية لهذا العميل حتى تسوية المديونية المتأخرة.");
    recs.push("جدولة اتصال تحصيل عاجل خلال 48 ساعة وتوثيقه في موديول التحصيل.");
  } else if (input.riskLevel === "medium") {
    recs.push("راجع حد الائتمان الممنوح للعميل وقلّصه إذا استمر التأخر في السداد.");
    recs.push("أرسل تذكيرًا رسميًا بالفواتير المستحقة قبل نهاية الأسبوع.");
  } else {
    recs.push("العميل يفي بالتزاماته بانتظام — يمكن النظر في زيادة حد الائتمان أو تمديد شروط الدفع كحافز.");
  }

  if (oldBucket > 0) {
    recs.push(
      `يوجد ${Math.round(oldBucket).toLocaleString("ar-EG")} ر.س متأخر لأكثر من 60 يومًا — يُنصح بتصعيدها لفريق التحصيل القانوني إن لم تُسدد خلال أسبوعين.`
    );
  }

  if (input.averageDelayDays > 15) {
    recs.push(
      `متوسط تأخر السداد ${Math.round(input.averageDelayDays)} يومًا عن تاريخ الاستحقاق — فكر في تقصير مهلة السداد الافتراضية لهذا العميل.`
    );
  }

  if (input.overdueRatio > 0.5) {
    recs.push("أكثر من نصف مديونية العميل متأخرة عن الاستحقاق — أعد تقييم مستوى المخاطر قبل أي عملية بيع جديدة.");
  }

  return recs;
}
