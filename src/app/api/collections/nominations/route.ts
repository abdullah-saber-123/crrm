import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createNomination } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { showId, partnerId, partnerName, nominatedBy, notes } = body;

  if (typeof showId !== "number" || typeof partnerId !== "number" || !partnerName) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const nomination = await createNomination({
    showId,
    partnerId,
    partnerName,
    nominatedBy: nominatedBy || user.name,
    notes: notes || null,
  });

  return NextResponse.json({ nomination });
}
