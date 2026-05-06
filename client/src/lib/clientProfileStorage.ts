/**
 * clientProfileStorage.ts
 *
 * Data model and localStorage CRUD for Client Profiles and Goals.
 * Each profile stores child info, parent info, notes, goals, and links to assessments.
 */

// ============================================================
// Types
// ============================================================

export interface ClientGoal {
  id: string;
  text: string;
  status: 'not-started' | 'met' | 'in-progress' | 'not-met';
  goalDate?: string; // ISO date string (optional)
  dateMet?: string; // ISO date string (optional)
  createdAt: string; // ISO date string
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  prematureWeeks: number; // 0 = full term
  parentNames: string; // freeform, e.g. "John & Jane Doe"
  notes: string; // freeform
  goals: ClientGoal[];
  linkedAssessmentIds: string[]; // session IDs from multiSessionStorage
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'bayley4-client-profiles';

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// CRUD Operations
// ============================================================

/** Load all profiles from localStorage */
export function loadAllProfiles(): ClientProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClientProfile[];
  } catch {
    return [];
  }
}

/** Save all profiles to localStorage */
function saveAllProfiles(profiles: ClientProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

/** Get a single profile by ID */
export function getProfile(id: string): ClientProfile | null {
  const profiles = loadAllProfiles();
  return profiles.find(p => p.id === id) || null;
}

/** Create a new profile */
export function createProfile(data: {
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  prematureWeeks: number;
  parentNames: string;
  notes: string;
}): ClientProfile {
  const now = new Date().toISOString();
  const profile: ClientProfile = {
    id: generateId(),
    firstName: data.firstName,
    lastName: data.lastName,
    dob: data.dob,
    gender: data.gender,
    prematureWeeks: data.prematureWeeks,
    parentNames: data.parentNames,
    notes: data.notes,
    goals: [],
    linkedAssessmentIds: [],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };
  const profiles = loadAllProfiles();
  profiles.unshift(profile);
  saveAllProfiles(profiles);
  return profile;
}

/** Update an existing profile (partial update) */
export function updateProfile(id: string, updates: Partial<Omit<ClientProfile, 'id' | 'createdAt'>>): ClientProfile | null {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return null;
  profiles[idx] = {
    ...profiles[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveAllProfiles(profiles);
  return profiles[idx];
}

/** Delete a profile */
export function deleteProfile(id: string): boolean {
  const profiles = loadAllProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  if (filtered.length === profiles.length) return false;
  saveAllProfiles(filtered);
  return true;
}

/** Mark a profile as recently accessed (moves to top of recent list) */
export function touchProfile(id: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return;
  profiles[idx].lastAccessedAt = new Date().toISOString();
  saveAllProfiles(profiles);
}

/** Search profiles by name (first or last) */
export function searchProfiles(query: string): ClientProfile[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const profiles = loadAllProfiles();
  return profiles.filter(p =>
    p.firstName.toLowerCase().includes(q) ||
    p.lastName.toLowerCase().includes(q) ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
  );
}

/** Get the most recently accessed profiles (up to limit) */
export function getRecentProfiles(limit: number = 10): ClientProfile[] {
  const profiles = loadAllProfiles();
  return [...profiles]
    .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, limit);
}

// ============================================================
// Goal Operations
// ============================================================

/** Add a goal to a profile */
export function addGoal(profileId: string, text: string, goalDate?: string): ClientGoal | null {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return null;
  const goal: ClientGoal = {
    id: generateGoalId(),
    text,
    status: 'not-started',
    goalDate: goalDate || undefined,
    createdAt: new Date().toISOString(),
  };
  profiles[idx].goals.push(goal);
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return goal;
}

/** Update a goal */
export function updateGoal(profileId: string, goalId: string, updates: Partial<Omit<ClientGoal, 'id' | 'createdAt'>>): ClientGoal | null {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return null;
  const gIdx = profiles[pIdx].goals.findIndex(g => g.id === goalId);
  if (gIdx === -1) return null;
  profiles[pIdx].goals[gIdx] = { ...profiles[pIdx].goals[gIdx], ...updates };
  // If status changed to 'met' and no dateMet, auto-set dateMet
  if (updates.status === 'met' && !profiles[pIdx].goals[gIdx].dateMet) {
    profiles[pIdx].goals[gIdx].dateMet = new Date().toISOString().split('T')[0];
  }
  profiles[pIdx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return profiles[pIdx].goals[gIdx];
}

/** Delete a goal */
export function deleteGoal(profileId: string, goalId: string): boolean {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return false;
  const before = profiles[pIdx].goals.length;
  profiles[pIdx].goals = profiles[pIdx].goals.filter(g => g.id !== goalId);
  if (profiles[pIdx].goals.length === before) return false;
  profiles[pIdx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return true;
}

// ============================================================
// Assessment Linking
// ============================================================

/** Link an assessment session ID to a profile */
export function linkAssessment(profileId: string, sessionId: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return;
  if (!profiles[idx].linkedAssessmentIds.includes(sessionId)) {
    profiles[idx].linkedAssessmentIds.push(sessionId);
    profiles[idx].updatedAt = new Date().toISOString();
    saveAllProfiles(profiles);
  }
}

/** Unlink an assessment session ID from a profile */
export function unlinkAssessment(profileId: string, sessionId: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return;
  profiles[idx].linkedAssessmentIds = profiles[idx].linkedAssessmentIds.filter(id => id !== sessionId);
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
}

/** Get all profiles that have a specific assessment linked */
export function getProfileByAssessment(sessionId: string): ClientProfile | null {
  const profiles = loadAllProfiles();
  return profiles.find(p => p.linkedAssessmentIds.includes(sessionId)) || null;
}
