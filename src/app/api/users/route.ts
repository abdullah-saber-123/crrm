import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createUser, findUserByUsername } from "@/lib/users-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مدير" }, { status: 403 });

  const body = await request.json();
  const { username, name, password, role } = body;

  if (!username || !name || !password || (role !== "admin" && role !== "agent")) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "كلمة المرور قصيرة جدًا" }, { status: 400 });
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 409 });
  }

  const newUser = await createUser({ username, name, password, role });
  return NextResponse.json({ user: newUser });
}
