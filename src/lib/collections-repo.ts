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

function rowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    scheduledAt: row.scheduled_at as string,
    purpose: row.purpose as string | null,
    status: row.status as Appointment["status"],
    assignedTo: row.assigned_to as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

function rowToShow(row: Record<string, unknown>): CollectionShow {
  return {
    id: row.id as number,
    name: row.name as string,
    eventDate: row.event_date as string | null,
    createdAt: row.created_at as string,
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
    createdAt: row.created_at as string,
  };
}

function rowToRegistration(row: Record<string, unknown>): Registration {
  return {
    id: row.id as number,
    showId: row.show_id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    registeredBy: row.registered_by as string | null,
    registeredAt: row.registered_at as string,
  };
}

// ---- Appointments ---------------------------------------------------

export function listAppointments(): Appointment[] {
  const rows = getDb()
    .prepare("SELECT * FROM appointments ORDER BY scheduled_at ASC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToAppointment);
}

export function createAppointment(input: {
  partnerId: number;
  partnerName: string;
  scheduledAt: string;
  purpose: string | null;
  assignedTo: string | null;
}): Appointment {
  const result = getDb()
    .prepare(
      `INSERT INTO appointments (partner_id, partner_name, scheduled_at, purpose, assigned_to)
       VALUES (@partnerId, @partnerName, @scheduledAt, @purpose, @assignedTo)`
    )
    .run(input);
  const row = getDb()
    .prepare("SELECT * FROM appointments WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToAppointment(row);
}

export function updateAppointmentStatus(id: number, status: Appointment["status"]): void {
  getDb().prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
}

// ---- Collection shows -------------------------------------------------

export function listShows(): CollectionShow[] {
  const rows = getDb()
    .prepare("SELECT * FROM collection_shows ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToShow);
}

export function getShow(id: number): CollectionShow | undefined {
  const row = getDb().prepare("SELECT * FROM collection_shows WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToShow(row) : undefined;
}

export function createShow(input: { name: string; eventDate: string | null }): CollectionShow {
  const result = getDb()
    .prepare("INSERT INTO collection_shows (name, event_date) VALUES (@name, @eventDate)")
    .run(input);
  return getShow(Number(result.lastInsertRowid))!;
}

// ---- Nominations & registrations --------------------------------------

export function listNominations(showId: number): Nomination[] {
  const rows = getDb()
    .prepare("SELECT * FROM nominations WHERE show_id = ? ORDER BY created_at DESC")
    .all(showId) as Record<string, unknown>[];
  return rows.map(rowToNomination);
}

export function getNominationCounts(showId: number): Map<number, number> {
  const rows = getDb()
    .prepare("SELECT partner_id, COUNT(*) as count FROM nominations WHERE show_id = ? GROUP BY partner_id")
    .all(showId) as { partner_id: number; count: number }[];
  return new Map(rows.map((r) => [r.partner_id, r.count]));
}

export function createNomination(input: {
  showId: number;
  partnerId: number;
  partnerName: string;
  nominatedBy: string | null;
  notes: string | null;
}): Nomination {
  const result = getDb()
    .prepare(
      `INSERT INTO nominations (show_id, partner_id, partner_name, nominated_by, notes)
       VALUES (@showId, @partnerId, @partnerName, @nominatedBy, @notes)`
    )
    .run(input);
  const row = getDb().prepare("SELECT * FROM nominations WHERE id = ?").get(result.lastInsertRowid) as Record<
    string,
    unknown
  >;
  return rowToNomination(row);
}

export function listRegistrations(showId: number): Registration[] {
  const rows = getDb()
    .prepare("SELECT * FROM registrations WHERE show_id = ? ORDER BY registered_at DESC")
    .all(showId) as Record<string, unknown>[];
  return rows.map(rowToRegistration);
}

export function registerCustomer(input: {
  showId: number;
  partnerId: number;
  partnerName: string;
  registeredBy: string | null;
}): Registration {
  getDb()
    .prepare(
      `INSERT INTO registrations (show_id, partner_id, partner_name, registered_by)
       VALUES (@showId, @partnerId, @partnerName, @registeredBy)
       ON CONFLICT(show_id, partner_id) DO NOTHING`
    )
    .run(input);
  const row = getDb()
    .prepare("SELECT * FROM registrations WHERE show_id = ? AND partner_id = ?")
    .get(input.showId, input.partnerId) as Record<string, unknown>;
  return rowToRegistration(row);
}
