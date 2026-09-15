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

export type CallLog = {
  id: number;
  partnerId: number;
  partnerName: string;
  appointmentId: number | null;
  callDate: string;
  outcome: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
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

function rowToCallLog(row: Record<string, unknown>): CallLog {
  return {
    id: row.id as number,
    partnerId: row.partner_id as number,
    partnerName: row.partner_name as string,
    appointmentId: row.appointment_id as number | null,
    callDate: row.call_date as string,
    outcome: row.outcome as string,
    notes: row.notes as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

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

export function listCallLogs(): CallLog[] {
  const rows = getDb()
    .prepare("SELECT * FROM call_logs ORDER BY call_date DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToCallLog);
}

export function createCallLog(input: {
  partnerId: number;
  partnerName: string;
  appointmentId: number | null;
  outcome: string;
  notes: string | null;
  createdBy: string | null;
}): CallLog {
  const result = getDb()
    .prepare(
      `INSERT INTO call_logs (partner_id, partner_name, appointment_id, outcome, notes, created_by)
       VALUES (@partnerId, @partnerName, @appointmentId, @outcome, @notes, @createdBy)`
    )
    .run(input);
  const row = getDb()
    .prepare("SELECT * FROM call_logs WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToCallLog(row);
}
