import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAppointment } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { partnerId, partnerName, scheduledAt, purpose, assignedTo } = body;

  if (typeof partnerId !== "number" || !partnerName || !scheduledAt) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const appointment = createAppointment({
    partnerId,
    partnerName,
    scheduledAt,
    purpose: purpose || null,
    assignedTo: assignedTo || user.name,
  });

  return NextResponse.json({ appointment });
}
