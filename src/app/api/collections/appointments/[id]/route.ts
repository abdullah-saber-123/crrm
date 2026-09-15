import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateAppointmentStatus } from "@/lib/collections-repo";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  if (!["scheduled", "done", "missed"].includes(status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }

  updateAppointmentStatus(Number(id), status);
  return NextResponse.json({ ok: true });
}
