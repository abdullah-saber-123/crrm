import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createNomination, DuplicateNominationError } from "@/lib/collections-repo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json();
  const { showId, partnerId, partnerName, notes } = body;

  if (typeof showId !== "number" || typeof partnerId !== "number" || !partnerName) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  try {
    // nominatedBy is always the authenticated user's identity — never
    // client-supplied — so the one-nomination-per-user constraint means
    // something (a spoofed name would defeat it).
    const nomination = await createNomination({
      showId,
      partnerId,
      partnerName,
      nominatedBy: user.name,
      notes: notes || null,
    });
    return NextResponse.json({ nomination });
  } catch (err) {
    if (err instanceof DuplicateNominationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
