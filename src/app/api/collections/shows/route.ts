import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createShow } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { name, eventDate } = await request.json();
  if (!name) return NextResponse.json({ error: "اسم العرض مطلوب" }, { status: 400 });

  const show = await createShow({ name, eventDate: eventDate || null });
  return NextResponse.json({ show });
}
