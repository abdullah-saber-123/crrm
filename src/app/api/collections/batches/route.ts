import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setNomineeBatch, type NomineeBatch } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مدير" }, { status: 403 });

  const body = await request.json();
  const { showId, partnerId, batch } = body;

  if (typeof showId !== "number" || typeof partnerId !== "number" || ![1, 2, 3].includes(batch)) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  await setNomineeBatch({ showId, partnerId, batch: batch as NomineeBatch, updatedBy: user.name });
  return NextResponse.json({ ok: true });
}
