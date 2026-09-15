import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCallLog } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { partnerId, partnerName, appointmentId, outcome, notes } = body;

  if (typeof partnerId !== "number" || !partnerName || !outcome) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const call = createCallLog({
    partnerId,
    partnerName,
    appointmentId: typeof appointmentId === "number" ? appointmentId : null,
    outcome,
    notes: notes || null,
    createdBy: user.name,
  });

  return NextResponse.json({ call });
}
