import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { confirmReconciliation } from "@/lib/reconciliation-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const {
    partnerId,
    partnerName,
    invoiceRef,
    invoiceMoveId,
    invoiceAmount,
    paymentRef,
    paymentId,
    paymentAmount,
    matchedAmount,
    status,
    notes,
  } = body;

  if (
    typeof partnerId !== "number" ||
    typeof invoiceMoveId !== "number" ||
    typeof paymentId !== "number" ||
    (status !== "confirmed" && status !== "rejected")
  ) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const record = confirmReconciliation({
    partnerId,
    partnerName,
    invoiceRef,
    invoiceMoveId,
    invoiceAmount,
    paymentRef,
    paymentId,
    paymentAmount,
    matchedAmount,
    status,
    confirmedBy: user.name,
    notes: notes || null,
  });

  return NextResponse.json({ record });
}
