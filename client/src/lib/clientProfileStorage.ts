/**
 * clientProfileStorage.ts
 *
 * Data model and localStorage CRUD for Client Profiles and Goals.
 * Goals are organized under GoalCategories (e.g. Fine Motor, Gross Motor, etc.).
 * Each profile stores child info, parent info, notes, goal categories, and links to assessments.
 */

// ============================================================
// Types
// ============================================================

export type GoalStatus = 'not-started' | 'met' | 'in-progress' | 'not-met';

export interface ClientGoal {
  id: string;
  text: string;
  status: GoalStatus;
  goalDate?: string; // ISO date string (optional)
  dateMet?: string; // ISO date string (optional)
  createdAt: string; // ISO date string
}

export interface GoalCategory {
  id: string;
  name: string; // e.g. "Fine Motor", "Gross Motor", "Social-Emotional", "Adaptive"
  note?: string; // optional category-level note (e.g. "*Xara receives PT services...")
  goals: ClientGoal[];
  createdAt: string;
}

export interface Milestone {
  label: string; // e.g. "Rolling", "Sitting"
  ageAchieved: string; // freeform, e.g. "6 months", "N/A", "Not yet"
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
  /** @deprecated Use goalCategories instead. Kept for migration. */
  goals?: ClientGoal[];
  goalCategories: GoalCategory[];
  milestones: Milestone[];
  linkedAssessmentIds: string[]; // session IDs from multiSessionStorage
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'bayley4-client-profiles';

/** Default developmental milestones */
export const DEFAULT_MILESTONES: Milestone[] = [
  { label: 'Rolling', ageAchieved: '' },
  { label: 'Sitting', ageAchieved: '' },
  { label: 'Standing', ageAchieved: '' },
  { label: 'Crawling', ageAchieved: '' },
  { label: 'Walking', ageAchieved: '' },
  { label: 'First Word', ageAchieved: '' },
];

/** Common category presets for quick-add */
export const CATEGORY_PRESETS = [
  'Fine Motor',
  'Gross Motor',
  'Social-Emotional',
  'Adaptive',
  'Cognitive',
  'Communication',
  'Feeding/Oral Motor',
  'Sensory Processing',
];

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Migrate legacy profiles that have flat `goals` array to `goalCategories`.
 * Moves all legacy goals into a "General" category.
 */
function migrateProfile(profile: ClientProfile): ClientProfile {
  if (!profile.goalCategories) {
    profile.goalCategories = [];
  }
  // Ensure milestones exist
  if (!profile.milestones) {
    profile.milestones = DEFAULT_MILESTONES.map(m => ({ ...m }));
  }
  // Migrate legacy flat goals into a "General" category
  if (profile.goals && profile.goals.length > 0 && profile.goalCategories.length === 0) {
    profile.goalCategories.push({
      id: generateCategoryId(),
      name: 'General',
      goals: profile.goals,
      createdAt: profile.createdAt,
    });
    delete profile.goals;
  }
  return profile;
}

// ============================================================
// CRUD Operations
// ============================================================

/** Load all profiles from localStorage */
export function loadAllProfiles(): ClientProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const profiles = JSON.parse(raw) as ClientProfile[];
    return profiles.map(migrateProfile);
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
  const p = profiles.find(p => p.id === id) || null;
  return p ? migrateProfile(p) : null;
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
    goalCategories: [],
    milestones: DEFAULT_MILESTONES.map(m => ({ ...m })),
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
// Goal Category Operations
// ============================================================

/** Add a new goal category to a profile */
export function addGoalCategory(profileId: string, name: string, note?: string): GoalCategory | null {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return null;
  const category: GoalCategory = {
    id: generateCategoryId(),
    name,
    note: note || undefined,
    goals: [],
    createdAt: new Date().toISOString(),
  };
  profiles[idx].goalCategories.push(category);
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return category;
}

/** Update a goal category (name or note) */
export function updateGoalCategory(profileId: string, categoryId: string, updates: { name?: string; note?: string }): GoalCategory | null {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return null;
  const cIdx = profiles[pIdx].goalCategories.findIndex(c => c.id === categoryId);
  if (cIdx === -1) return null;
  if (updates.name !== undefined) profiles[pIdx].goalCategories[cIdx].name = updates.name;
  if (updates.note !== undefined) profiles[pIdx].goalCategories[cIdx].note = updates.note;
  profiles[pIdx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return profiles[pIdx].goalCategories[cIdx];
}

/** Delete a goal category (and all its goals) */
export function deleteGoalCategory(profileId: string, categoryId: string): boolean {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return false;
  const before = profiles[pIdx].goalCategories.length;
  profiles[pIdx].goalCategories = profiles[pIdx].goalCategories.filter(c => c.id !== categoryId);
  if (profiles[pIdx].goalCategories.length === before) return false;
  profiles[pIdx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return true;
}

// ============================================================
// Goal Operations (within categories)
// ============================================================

/** Add a goal to a specific category */
export function addGoal(profileId: string, categoryId: string, text: string, goalDate?: string): ClientGoal | null {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return null;
  const cIdx = profiles[pIdx].goalCategories.findIndex(c => c.id === categoryId);
  if (cIdx === -1) return null;
  const goal: ClientGoal = {
    id: generateGoalId(),
    text,
    status: 'not-started',
    goalDate: goalDate || undefined,
    createdAt: new Date().toISOString(),
  };
  profiles[pIdx].goalCategories[cIdx].goals.push(goal);
  profiles[pIdx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
  return goal;
}

/** Update a goal within a category */
export function updateGoal(profileId: string, goalId: string, updates: Partial<Omit<ClientGoal, 'id' | 'createdAt'>>): ClientGoal | null {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return null;
  for (const cat of profiles[pIdx].goalCategories) {
    const gIdx = cat.goals.findIndex(g => g.id === goalId);
    if (gIdx !== -1) {
      cat.goals[gIdx] = { ...cat.goals[gIdx], ...updates };
      // If status changed to 'met' and no dateMet, auto-set dateMet
      if (updates.status === 'met' && !cat.goals[gIdx].dateMet) {
        cat.goals[gIdx].dateMet = new Date().toISOString().split('T')[0];
      }
      // If status changed away from 'met', clear dateMet
      if (updates.status && updates.status !== 'met') {
        cat.goals[gIdx].dateMet = undefined;
      }
      profiles[pIdx].updatedAt = new Date().toISOString();
      saveAllProfiles(profiles);
      return cat.goals[gIdx];
    }
  }
  return null;
}

/** Delete a goal from any category */
export function deleteGoal(profileId: string, goalId: string): boolean {
  const profiles = loadAllProfiles();
  const pIdx = profiles.findIndex(p => p.id === profileId);
  if (pIdx === -1) return false;
  for (const cat of profiles[pIdx].goalCategories) {
    const before = cat.goals.length;
    cat.goals = cat.goals.filter(g => g.id !== goalId);
    if (cat.goals.length < before) {
      profiles[pIdx].updatedAt = new Date().toISOString();
      saveAllProfiles(profiles);
      return true;
    }
  }
  return false;
}

/** Get all goals across all categories (flattened) */
export function getAllGoals(profileId: string): Array<ClientGoal & { categoryName: string; categoryId: string }> {
  const profile = getProfile(profileId);
  if (!profile) return [];
  const result: Array<ClientGoal & { categoryName: string; categoryId: string }> = [];
  for (const cat of profile.goalCategories) {
    for (const goal of cat.goals) {
      result.push({ ...goal, categoryName: cat.name, categoryId: cat.id });
    }
  }
  return result;
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

// ============================================================
// Milestone Operations
// ============================================================

/** Update a milestone's ageAchieved value */
export function updateMilestone(profileId: string, label: string, ageAchieved: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return;
  const mIdx = profiles[idx].milestones.findIndex(m => m.label === label);
  if (mIdx !== -1) {
    profiles[idx].milestones[mIdx].ageAchieved = ageAchieved;
  }
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
}

/** Add a custom milestone to a profile */
export function addMilestone(profileId: string, label: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return;
  // Don't add duplicates
  if (profiles[idx].milestones.some(m => m.label.toLowerCase() === label.toLowerCase())) return;
  profiles[idx].milestones.push({ label, ageAchieved: '' });
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
}

/** Remove a custom milestone from a profile */
export function removeMilestone(profileId: string, label: string): void {
  const profiles = loadAllProfiles();
  const idx = profiles.findIndex(p => p.id === profileId);
  if (idx === -1) return;
  profiles[idx].milestones = profiles[idx].milestones.filter(m => m.label !== label);
  profiles[idx].updatedAt = new Date().toISOString();
  saveAllProfiles(profiles);
}
