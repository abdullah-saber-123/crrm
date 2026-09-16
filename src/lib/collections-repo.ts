import { getDb } from "@/lib/db";

export type Appointment = {
  id: number;
  partnerId: number;
  partnerName: string;
  scheduledAt: string;
  purpose: string | null;
  status: "scheduled" | "done" | "missed";
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
};

export type CollectionShow = {
  id: number;
  name: string;
  eventDate: string | null;
  createdAt: string;
};

export type Nomination = {
  id: number;
  showId: number;
  partnerId: number;
  partnerName: string;
  nominatedBy: string | null;
  notes: string | null;
  createdAt: string;
};

export type Registration = {
  id: number;
  showId: number;
  partnerId: number;
  partnerName: string;
  registeredBy: string | null;
  registeredAt: string;
};

export type NomineeBatch = 1 | 2 | 3;

function rowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    scheduledAt: (row.scheduled_at as Date).toISOString(),
    purpose: row.purpose as string | null,
    status: row.status as Appointment["status"],
    assignedTo: row.assigned_to as string | null,
    notes: row.notes as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function rowToShow(row: Record<string, unknown>): CollectionShow {
  return {
    id: row.id as number,
    name: row.name as string,
    eventDate: row.event_date ? (row.event_date as Date).toISOString().slice(0, 10) : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function rowToNomination(row: Record<string, unknown>): Nomination {
  return {
    id: row.id as number,
    showId: row.show_id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    nominatedBy: row.nominated_by as string | null,
    notes: row.notes as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function rowToRegistration(row: Record<string, unknown>): Registration {
  return {
    id: row.id as number,
    showId: row.show_id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    registeredBy: row.registered_by as string | null,
    registeredAt: (row.registered_at as Date).toISOString(),
  };
}

// ---- Appointments ---------------------------------------------------

export async function listAppointments(): Promise<Appointment[]> {
  const db = await getDb();
  const { rows } = await db.query("SELECT * FROM appointments ORDER BY scheduled_at ASC");
  return rows.map(rowToAppointment);
}

export async function createAppointment(input: {
  partnerId: number;
  partnerName: string;
  scheduledAt: string;
  purpose: string | null;
  assignedTo: string | null;
}): Promise<Appointment> {
  const db = await getDb();
  const { rows } = await db.query(
    `INSERT INTO appointments (partner_id, partner_name, scheduled_at, purpose, assigned_to)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.partnerId, input.partnerName, input.scheduledAt, input.purpose, input.assignedTo]
  );
  return rowToAppointment(rows[0]);
}

export async function updateAppointmentStatus(id: number, status: Appointment["status"]): Promise<void> {
  const db = await getDb();
  await db.query("UPDATE appointments SET status = $1 WHERE id = $2", [status, id]);
}

// ---- Collection shows -------------------------------------------------

export async function listShows(): Promise<CollectionShow[]> {
  const db = await getDb();
  const { rows } = await db.query("SELECT * FROM collection_shows ORDER BY created_at DESC");
  return rows.map(rowToShow);
}

export async function getShow(id: number): Promise<CollectionShow | undefined> {
  const db = await getDb();
  const { rows } = await db.query("SELECT * FROM collection_shows WHERE id = $1", [id]);
  return rows[0] ? rowToShow(rows[0]) : undefined;
}

export async function createShow(input: { name: string; eventDate: string | null }): Promise<CollectionShow> {
  const db = await getDb();
  const { rows } = await db.query(
    "INSERT INTO collection_shows (name, event_date) VALUES ($1, $2) RETURNING *",
    [input.name, input.eventDate]
  );
  return rowToShow(rows[0]);
}

// ---- Nominations & registrations --------------------------------------

export async function listNominations(showId: number): Promise<Nomination[]> {
  const db = await getDb();
  const { rows } = await db.query(
    "SELECT * FROM nominations WHERE show_id = $1 ORDER BY created_at DESC",
    [showId]
  );
  return rows.map(rowToNomination);
}

export async function getNominationCounts(showId: number): Promise<Map<number, number>> {
  const db = await getDb();
  const { rows } = await db.query(
    "SELECT partner_id, COUNT(*)::int as count FROM nominations WHERE show_id = $1 GROUP BY partner_id",
    [showId]
  );
  return new Map(rows.map((r) => [r.partner_id as number, r.count as number]));
}

export class DuplicateNominationError extends Error {
  constructor() {
    super("لقد رشّحت هذا العميل مسبقًا لهذا العرض.");
    this.name = "DuplicateNominationError";
  }
}

export async function createNomination(input: {
  showId: number;
  partnerId: number;
  partnerName: string;
  nominatedBy: string | null;
  notes: string | null;
}): Promise<Nomination> {
  const db = await getDb();
  try {
    const { rows } = await db.query(
      `INSERT INTO nominations (show_id, partner_id, partner_name, nominated_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.showId, input.partnerId, input.partnerName, input.nominatedBy, input.notes]
    );
    return rowToNomination(rows[0]);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw new DuplicateNominationError();
    }
    throw err;
  }
}

export async function listRegistrations(showId: number): Promise<Registration[]> {
  const db = await getDb();
  const { rows } = await db.query(
    "SELECT * FROM registrations WHERE show_id = $1 ORDER BY registered_at DESC",
    [showId]
  );
  return rows.map(rowToRegistration);
}

export async function registerCustomer(input: {
  showId: number;
  partnerId: number;
  partnerName: string;
  registeredBy: string | null;
}): Promise<Registration> {
  const db = await getDb();
  await db.query(
    `INSERT INTO registrations (show_id, partner_id, partner_name, registered_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (show_id, partner_id) DO NOTHING`,
    [input.showId, input.partnerId, input.partnerName, input.registeredBy]
  );
  const { rows } = await db.query(
    "SELECT * FROM registrations WHERE show_id = $1 AND partner_id = $2",
    [input.showId, input.partnerId]
  );
  return rowToRegistration(rows[0]);
}

// ---- Nominee batches (دفعات الاستدعاء) ---------------------------------

export async function getNomineeBatches(showId: number): Promise<Map<number, NomineeBatch>> {
  const db = await getDb();
  const { rows } = await db.query("SELECT partner_id, batch FROM nominee_batches WHERE show_id = $1", [
    showId,
  ]);
  return new Map(rows.map((r) => [r.partner_id as number, r.batch as NomineeBatch]));
}

export async function setNomineeBatch(input: {
  showId: number;
  partnerId: number;
  batch: NomineeBatch;
  updatedBy: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO nominee_batches (show_id, partner_id, batch, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (show_id, partner_id)
     DO UPDATE SET batch = EXCLUDED.batch, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [input.showId, input.partnerId, input.batch, input.updatedBy]
  );
}
