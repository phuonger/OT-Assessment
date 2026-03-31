/**
 * Multi-session storage for Bayley-4 assessments.
 * Manages saving, loading, listing, and comparing assessment sessions.
 */

import type { AssessmentState, ChildInfo } from '@/contexts/AssessmentContext';

const SESSIONS_KEY = 'bayley4-saved-sessions';

export interface SavedSession {
  id: string;
  savedAt: string;          // ISO timestamp
  childName: string;
  childDOB: string;
  examDate: string;
  examinerName: string;
  startPointLetter: string;
  domainsAssessed: string[];
  status: 'in-progress' | 'completed';
  totalRawScore: number;
  domainScores: Record<string, number>; // domainId -> raw score
  domainTimers: Record<string, number>;
  totalTimeSeconds: number;
  state: AssessmentState;    // full state snapshot for restoring
  label?: string;            // user-defined label (e.g., "Initial Eval", "Re-eval #2")
}

export interface SessionComparison {
  session1: SavedSession;
  session2: SavedSession;
  domainChanges: {
    domainId: string;
    domainName: string;
    score1: number;
    score2: number;
    change: number;
    percentChange: number;
  }[];
  totalChange: number;
  timeBetween: string; // human-readable
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function getAllSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as SavedSession[];
    return sessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return [];
  }
}

export function getSessionsForChild(childName: string): SavedSession[] {
  return getAllSessions().filter(
    s => s.childName.toLowerCase().trim() === childName.toLowerCase().trim()
  );
}

export function saveSession(
  assessmentState: AssessmentState,
  domainScores: Record<string, number>,
  status: 'in-progress' | 'completed',
  label?: string
): SavedSession {
  const sessions = getAllSessions();
  const childName = [assessmentState.childInfo.firstName, assessmentState.childInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unknown Child';

  const totalRawScore = Object.values(domainScores).reduce((sum, s) => sum + s, 0);
  const totalTimeSeconds = Object.values(assessmentState.domainTimers).reduce((sum, s) => sum + s, 0);

  const session: SavedSession = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    childName,
    childDOB: assessmentState.childInfo.dateOfBirth,
    examDate: assessmentState.childInfo.examDate,
    examinerName: assessmentState.childInfo.examinerName,
    startPointLetter: assessmentState.childInfo.startPointLetter,
    domainsAssessed: assessmentState.selectedDomainIds,
    status,
    totalRawScore,
    domainScores,
    domainTimers: { ...assessmentState.domainTimers },
    totalTimeSeconds,
    state: { ...assessmentState, activeDomainTimerStart: null },
    label,
  };

  sessions.unshift(session);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — try removing oldest sessions
    while (sessions.length > 20) sessions.pop();
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  return session;
}

export function updateSessionLabel(sessionId: string, label: string): void {
  const sessions = getAllSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    sessions[idx].label = label;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export function deleteSession(sessionId: string): void {
  const sessions = getAllSessions().filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function compareSessions(session1: SavedSession, session2: SavedSession): SessionComparison {
  // Ensure session1 is the earlier one
  const [s1, s2] = new Date(session1.examDate) <= new Date(session2.examDate)
    ? [session1, session2]
    : [session2, session1];

  // Find common domains
  const commonDomains = s1.domainsAssessed.filter(d => s2.domainsAssessed.includes(d));

  const DOMAIN_NAMES: Record<string, string> = {
    cognitive: 'Cognitive',
    receptive: 'Receptive Communication',
    expressive: 'Expressive Communication',
    fineMotor: 'Fine Motor',
    grossMotor: 'Gross Motor',
  };

  const domainChanges = commonDomains.map(domainId => {
    const score1 = s1.domainScores[domainId] || 0;
    const score2 = s2.domainScores[domainId] || 0;
    const change = score2 - score1;
    const percentChange = score1 > 0 ? Math.round((change / score1) * 100) : 0;
    return {
      domainId,
      domainName: DOMAIN_NAMES[domainId] || domainId,
      score1,
      score2,
      change,
      percentChange,
    };
  });

  const totalChange = (s2.totalRawScore || 0) - (s1.totalRawScore || 0);

  // Calculate time between sessions
  const d1 = new Date(s1.examDate);
  const d2 = new Date(s2.examDate);
  const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  let timeBetween: string;
  if (diffDays < 7) {
    timeBetween = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    timeBetween = `${weeks} week${weeks !== 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(diffDays / 30);
    timeBetween = `${months} month${months !== 1 ? 's' : ''}`;
  }

  return { session1: s1, session2: s2, domainChanges, totalChange, timeBetween };
}
