/**
 * Multi-Assessment Session Storage
 * 
 * Manages saving, loading, listing, and comparing multi-form assessment sessions.
 * Works with the MultiAssessmentContext state shape.
 */

import type { MultiAssessmentState, ChildInfo, ExaminerInfo, FormState } from '@/contexts/MultiAssessmentContext';
import { getFormById } from '@/lib/formRegistry';

const SESSIONS_KEY = 'bayley4-multi-sessions';

// ============================================================
// Types
// ============================================================

export interface DomainScoreSummary {
  domainLocalId: string;
  domainName: string;
  rawScore: number;
  itemsScored: number;
  totalItems: number;
  timerSeconds: number;
}

export interface FormScoreSummary {
  formId: string;
  formName: string;
  domains: DomainScoreSummary[];
  totalRawScore: number;
}

export interface SavedMultiSession {
  id: string;
  savedAt: string;                  // ISO timestamp
  label: string;                    // e.g., "Initial Evaluation", "6-Month Re-eval"
  childInfo: ChildInfo;
  examinerInfo: ExaminerInfo;
  childName: string;                // derived for easy search
  testDate: string;
  status: 'in-progress' | 'completed';
  formSummaries: FormScoreSummary[];
  totalElapsedSeconds: number;
  // Full state snapshot for potential restore
  stateSnapshot: MultiAssessmentState;
}

export interface DomainComparison {
  domainLocalId: string;
  domainName: string;
  formId: string;
  formName: string;
  score1: number;
  score2: number;
  change: number;
  percentChange: number;
  items1: number;
  items2: number;
}

export interface MultiSessionComparison {
  session1: SavedMultiSession;
  session2: SavedMultiSession;
  timeBetween: string;
  daysBetween: number;
  formComparisons: {
    formId: string;
    formName: string;
    domainChanges: DomainComparison[];
    totalScore1: number;
    totalScore2: number;
    totalChange: number;
  }[];
  overallChange: number;
  childAgeAtSession1: string;
  childAgeAtSession2: string;
}

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function computeAge(dob: string, testDate: string): string {
  if (!dob || !testDate) return 'N/A';
  try {
    const birth = new Date(dob);
    const test = new Date(testDate);
    let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
    let days = test.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
      days += prevMonth.getDate();
    }
    return `${months}m ${days}d`;
  } catch {
    return 'N/A';
  }
}

function computeTimeBetween(date1: string, date2: string): { text: string; days: number } {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Same day', days: 0 };
    if (diffDays < 7) return { text: `${diffDays} day${diffDays !== 1 ? 's' : ''}`, days: diffDays };
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainDays = diffDays % 7;
      return {
        text: remainDays > 0 ? `${weeks}w ${remainDays}d` : `${weeks} week${weeks !== 1 ? 's' : ''}`,
        days: diffDays,
      };
    }
    const months = Math.floor(diffDays / 30);
    const remainDays = diffDays % 30;
    return {
      text: remainDays > 0 ? `${months}mo ${remainDays}d` : `${months} month${months !== 1 ? 's' : ''}`,
      days: diffDays,
    };
  } catch {
    return { text: 'Unknown', days: 0 };
  }
}

function extractFormSummaries(state: MultiAssessmentState): FormScoreSummary[] {
  const summaries: FormScoreSummary[] = [];

  for (const [formId, formState] of Object.entries(state.formStates)) {
    const form = getFormById(formId);
    if (!form) continue;

    const domains: DomainScoreSummary[] = [];
    let totalRawScore = 0;

    for (const [domainLocalId, domainState] of Object.entries(formState.domains)) {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) continue;

      const rawScore = Object.values(domainState.scores).reduce(
        (sum: number, s) => sum + (s || 0),
        0
      );
      const itemsScored = Object.values(domainState.scores).filter(
        s => s !== null && s !== undefined
      ).length;

      domains.push({
        domainLocalId,
        domainName: domain.name,
        rawScore,
        itemsScored,
        totalItems: domain.items.length,
        timerSeconds: domainState.timerSeconds,
      });

      totalRawScore += rawScore;
    }

    summaries.push({
      formId,
      formName: form.name,
      domains,
      totalRawScore,
    });
  }

  return summaries;
}

// ============================================================
// CRUD Operations
// ============================================================

export function getAllMultiSessions(): SavedMultiSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as SavedMultiSession[];
    return sessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return [];
  }
}

export function getSessionsForChild(childName: string): SavedMultiSession[] {
  return getAllMultiSessions().filter(
    s => s.childName.toLowerCase().trim() === childName.toLowerCase().trim()
  );
}

export function saveMultiSession(
  state: MultiAssessmentState,
  status: 'in-progress' | 'completed',
  label?: string
): SavedMultiSession {
  const sessions = getAllMultiSessions();
  const childName = [state.childInfo.firstName, state.childInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unknown Child';

  const session: SavedMultiSession = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    label: label || `Assessment ${new Date(state.childInfo.testDate || Date.now()).toLocaleDateString()}`,
    childInfo: { ...state.childInfo },
    examinerInfo: { ...state.examinerInfo },
    childName,
    testDate: state.childInfo.testDate,
    status,
    formSummaries: extractFormSummaries(state),
    totalElapsedSeconds: state.totalElapsedSeconds,
    stateSnapshot: {
      ...state,
      timerRunning: false,
      sessionStartTime: null,
    },
  };

  sessions.unshift(session);

  // Keep max 50 sessions
  while (sessions.length > 50) sessions.pop();

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — remove oldest
    while (sessions.length > 10) sessions.pop();
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch { /* give up */ }
  }

  return session;
}

export function updateMultiSessionLabel(sessionId: string, label: string): void {
  const sessions = getAllMultiSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    sessions[idx].label = label;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export function deleteMultiSession(sessionId: string): void {
  const sessions = getAllMultiSessions().filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function duplicateMultiSession(sessionId: string): SavedMultiSession | null {
  const sessions = getAllMultiSessions();
  const original = sessions.find(s => s.id === sessionId);
  if (!original) return null;

  const duplicate: SavedMultiSession = {
    ...JSON.parse(JSON.stringify(original)),
    id: generateId(),
    savedAt: new Date().toISOString(),
    label: `${original.label || 'Assessment'} (Copy)`,
    status: 'in-progress' as const,
  };

  // Reset scores in the snapshot so it's a fresh start with same child/examiner info
  // but keep the form selections and domain selections intact
  if (duplicate.stateSnapshot) {
    for (const formState of Object.values(duplicate.stateSnapshot.formStates)) {
      for (const domainState of Object.values(formState.domains)) {
        // Clear all scores
        for (const key of Object.keys(domainState.scores)) {
          domainState.scores[Number(key)] = null;
        }
        // Clear notes
        if (domainState.notes) {
          for (const key of Object.keys(domainState.notes)) {
            domainState.notes[Number(key)] = '';
          }
        }
        // Reset timer
        domainState.timerSeconds = 0;
        // Reset discontinue
        domainState.discontinued = false;
        domainState.discontinuedAtItem = null;
      }
    }
    duplicate.stateSnapshot.totalElapsedSeconds = 0;
    duplicate.stateSnapshot.timerRunning = false;
    duplicate.stateSnapshot.sessionStartTime = null;
    // Update test date to today
    duplicate.stateSnapshot.childInfo = {
      ...duplicate.stateSnapshot.childInfo,
      testDate: new Date().toISOString().split('T')[0],
    };
  }

  // Update top-level fields to match
  duplicate.testDate = duplicate.stateSnapshot?.childInfo?.testDate || original.testDate;
  duplicate.totalElapsedSeconds = 0;
  duplicate.formSummaries = duplicate.formSummaries.map(fs => ({
    ...fs,
    totalRawScore: 0,
    domains: fs.domains.map(d => ({ ...d, rawScore: 0, itemsScored: 0, timerSeconds: 0 })),
  }));

  sessions.unshift(duplicate);

  // Keep max 50 sessions
  while (sessions.length > 50) sessions.pop();

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    while (sessions.length > 10) sessions.pop();
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch { /* give up */ }
  }

  return duplicate;
}

// ============================================================
// Comparison
// ============================================================

export function compareMultiSessions(
  sessionA: SavedMultiSession,
  sessionB: SavedMultiSession
): MultiSessionComparison {
  // Ensure session1 is the earlier one
  const [session1, session2] = new Date(sessionA.testDate) <= new Date(sessionB.testDate)
    ? [sessionA, sessionB]
    : [sessionB, sessionA];

  const { text: timeBetween, days: daysBetween } = computeTimeBetween(session1.testDate, session2.testDate);

  // Build form comparisons
  const formComparisons: MultiSessionComparison['formComparisons'] = [];
  let overallChange = 0;

  // Find common forms
  const formIds1 = new Set(session1.formSummaries.map(f => f.formId));
  const formIds2 = new Set(session2.formSummaries.map(f => f.formId));
  const commonFormIds = Array.from(formIds1).filter(id => formIds2.has(id));

  for (const formId of commonFormIds) {
    const fs1 = session1.formSummaries.find(f => f.formId === formId)!;
    const fs2 = session2.formSummaries.find(f => f.formId === formId)!;

    // Find common domains
    const domainIds1 = new Set(fs1.domains.map(d => d.domainLocalId));
    const domainIds2 = new Set(fs2.domains.map(d => d.domainLocalId));
    const commonDomainIds = Array.from(domainIds1).filter(id => domainIds2.has(id));

    const domainChanges: DomainComparison[] = commonDomainIds.map(domainLocalId => {
      const d1 = fs1.domains.find(d => d.domainLocalId === domainLocalId)!;
      const d2 = fs2.domains.find(d => d.domainLocalId === domainLocalId)!;
      const change = d2.rawScore - d1.rawScore;
      const percentChange = d1.rawScore > 0 ? Math.round((change / d1.rawScore) * 100) : 0;

      return {
        domainLocalId,
        domainName: d1.domainName,
        formId,
        formName: fs1.formName,
        score1: d1.rawScore,
        score2: d2.rawScore,
        change,
        percentChange,
        items1: d1.itemsScored,
        items2: d2.itemsScored,
      };
    });

    const totalChange = fs2.totalRawScore - fs1.totalRawScore;
    overallChange += totalChange;

    formComparisons.push({
      formId,
      formName: fs1.formName,
      domainChanges,
      totalScore1: fs1.totalRawScore,
      totalScore2: fs2.totalRawScore,
      totalChange,
    });
  }

  return {
    session1,
    session2,
    timeBetween,
    daysBetween,
    formComparisons,
    overallChange,
    childAgeAtSession1: computeAge(session1.childInfo.dob, session1.testDate),
    childAgeAtSession2: computeAge(session2.childInfo.dob, session2.testDate),
  };
}

// ============================================================
// Export / Import (JSON file)
// ============================================================

export function exportSessionToJSON(session: SavedMultiSession): string {
  return JSON.stringify(session, null, 2);
}

export function importSessionFromJSON(jsonString: string): SavedMultiSession | null {
  try {
    const parsed = JSON.parse(jsonString);
    // Validate minimum required fields
    if (!parsed.id || !parsed.childInfo || !parsed.stateSnapshot) {
      return null;
    }
    // Assign a new ID to avoid collisions
    parsed.id = generateId();
    parsed.savedAt = new Date().toISOString();
    return parsed as SavedMultiSession;
  } catch {
    return null;
  }
}
