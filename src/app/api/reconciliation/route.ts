import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { confirmAccountReconciliation } from "@/lib/reconciliation-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { partnerId, partnerName, asOfDate, balance, totalInvoiced, totalPaid, status, notes } = body;

  if (
    typeof partnerId !== "number" ||
    !partnerName ||
    !asOfDate ||
    typeof balance !== "number" ||
    (status !== "confirmed" && status !== "rejected")
  ) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const record = confirmAccountReconciliation({
    partnerId,
    partnerName,
    asOfDate,
    balance,
    totalInvoiced: totalInvoiced ?? 0,
    totalPaid: totalPaid ?? 0,
    status,
    confirmedBy: user.name,
    notes: notes || null,
  });

  return NextResponse.json({ record });
}
