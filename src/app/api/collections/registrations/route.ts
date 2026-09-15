import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { registerCustomer } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { showId, partnerId, partnerName } = body;

  if (typeof showId !== "number" || typeof partnerId !== "number" || !partnerName) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const registration = registerCustomer({
    showId,
    partnerId,
    partnerName,
    registeredBy: user.name,
  });

  return NextResponse.json({ registration });
}
