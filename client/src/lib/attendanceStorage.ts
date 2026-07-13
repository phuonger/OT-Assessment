/**
 * Attendance Storage
 * 
 * Stores attendance/daily note records linked to client profiles.
 * Each record contains session info, progress notes, and signature data.
 */

export interface AttendanceRecord {
  id: string;
  profileId: string;
  // Header info
  childName: string;
  therapistName: string;
  uci: string;
  sc: string;
  typeFrequency: string;
  payPeriod: string; // e.g. "July 2026"
  // Daily note
  date: string; // ISO date string
  time: string; // e.g. "10:00 AM"
  progressNote: string;
  // Signatures (base64 data URIs)
  parentSignature: string;
  therapistSignature: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

const ATTENDANCE_STORAGE_KEY = 'ot_attendance_records';

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Load all attendance records */
export function loadAllAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Save all attendance records */
function saveAllAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
}

/** Get attendance records for a specific profile, sorted by date descending */
export function getAttendanceByProfile(profileId: string): AttendanceRecord[] {
  const all = loadAllAttendance();
  return all
    .filter(r => r.profileId === profileId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Get a single attendance record by ID */
export function getAttendanceById(id: string): AttendanceRecord | null {
  const all = loadAllAttendance();
  return all.find(r => r.id === id) || null;
}

/** Create a new attendance record */
export function createAttendance(data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): AttendanceRecord {
  const now = new Date().toISOString();
  const record: AttendanceRecord = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAllAttendance();
  all.unshift(record);
  saveAllAttendance(all);
  return record;
}

/** Update an existing attendance record */
export function updateAttendance(id: string, updates: Partial<Omit<AttendanceRecord, 'id' | 'createdAt'>>): AttendanceRecord | null {
  const all = loadAllAttendance();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveAllAttendance(all);
  return all[idx];
}

/** Delete an attendance record */
export function deleteAttendance(id: string): boolean {
  const all = loadAllAttendance();
  const filtered = all.filter(r => r.id !== id);
  if (filtered.length === all.length) return false;
  saveAllAttendance(filtered);
  return true;
}

/** Get count of attendance records for a profile */
export function getAttendanceCount(profileId: string): number {
  return loadAllAttendance().filter(r => r.profileId === profileId).length;
}
