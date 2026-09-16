import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteUser } from "@/lib/users-repo";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مدير" }, { status: 403 });

  const { id } = await params;
  await deleteUser(Number(id));
  return NextResponse.json({ ok: true });
}
