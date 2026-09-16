import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateShowStatus } from "@/lib/collections-repo";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مدير" }, { status: 403 });

  const { id } = await params;
  const { status } = await request.json();

  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }

  await updateShowStatus(Number(id), status);
  return NextResponse.json({ ok: true });
}
