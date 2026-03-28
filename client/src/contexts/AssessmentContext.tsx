import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ALL_DOMAINS, AGE_RANGES, type DomainData, type AssessmentItem, getStartItem } from '@/lib/assessmentData';

const STORAGE_KEY = 'bayley4-assessment-state';

export interface ChildInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  examinerName: string;
  examDate: string;
  ageRange: string;
  startPointLetter: string;
  notes: string;
  reasonForReferral: string;
  premature: string;
  prematureWeeks: string;
}

export interface AssessmentState {
  childInfo: ChildInfo;
  currentStep: 'info' | 'assessment' | 'summary';
  selectedDomainIds: string[];
  currentDomainIndex: number;
  scores: Record<string, number | null>;
  isStarted: boolean;
}

type Action =
  | { type: 'SET_CHILD_INFO'; payload: ChildInfo }
  | { type: 'SET_STEP'; payload: 'info' | 'assessment' | 'summary' }
  | { type: 'SET_SELECTED_DOMAINS'; payload: string[] }
  | { type: 'SET_DOMAIN'; payload: number }
  | { type: 'SET_SCORE'; payload: { itemId: string; score: number | null; domainId: string } }
  | { type: 'START_ASSESSMENT' }
  | { type: 'ADJUST_START_POINT'; payload: { startPointLetter: string } }
  | { type: 'LOAD_STATE'; payload: AssessmentState }
  | { type: 'RESET' };

const defaultChildInfo: ChildInfo = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  examinerName: '',
  examDate: new Date().toISOString().split('T')[0],
  ageRange: '',
  startPointLetter: 'A',
  notes: '',
  reasonForReferral: '',
  premature: 'No',
  prematureWeeks: '',
};

const initialState: AssessmentState = {
  childInfo: defaultChildInfo,
  currentStep: 'info',
  selectedDomainIds: ALL_DOMAINS.map(d => d.id),
  currentDomainIndex: 0,
  scores: {},
  isStarted: false,
};

/**
 * Check if the discontinue rule has been triggered for a domain.
 * Rule: 5 consecutive items scored 0 (starting from the start item onward).
 */
export function getDiscontinuePoint(
  domain: DomainData,
  scores: Record<string, number | null>,
  startItemNumber: number
): number | null {
  let consecutiveZeros = 0;
  for (const item of domain.items) {
    if (item.number < startItemNumber) continue;
    const key = `${domain.id}-${item.number}`;
    const score = scores[key];
    if (score === 0) {
      consecutiveZeros++;
      if (consecutiveZeros >= 5) {
        return item.number;
      }
    } else if (score !== null && score !== undefined) {
      consecutiveZeros = 0;
    } else {
      break;
    }
  }
  return null;
}

function applyDiscontinueRule(
  domain: DomainData,
  scores: Record<string, number | null>,
  discontinueAt: number
): Record<string, number | null> {
  const updated = { ...scores };
  for (const item of domain.items) {
    if (item.number > discontinueAt) {
      updated[`${domain.id}-${item.number}`] = 0;
    }
  }
  return updated;
}

/**
 * Recalculate pre-scores for all domains based on a new start point letter.
 * Items before the new start point get score 2.
 * Items at/after the new start point that were previously auto-scored (before old start) get cleared.
 * Items that were manually scored by the examiner are always preserved.
 */
function recalculatePreScores(
  state: AssessmentState,
  newStartPointLetter: string
): Record<string, number | null> {
  const newScores: Record<string, number | null> = {};
  const selectedDomains = ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
  const oldStartLetter = state.childInfo.startPointLetter;

  for (const domain of selectedDomains) {
    const newStartItem = getStartItem(domain, newStartPointLetter);
    const oldStartItem = getStartItem(domain, oldStartLetter);

    for (const item of domain.items) {
      const key = `${domain.id}-${item.number}`;
      const existingScore = state.scores[key];

      if (item.number < newStartItem) {
        // Before new start point: always auto-score as 2
        newScores[key] = 2;
      } else if (item.number < oldStartItem) {
        // Between new start and old start (start moved backward):
        // These were auto-scored as 2 before — clear them for manual scoring
        newScores[key] = null;
      } else if (existingScore !== undefined && existingScore !== null) {
        // At or after old start point with an existing score: keep it
        // (these were manually scored or discontinued)
        newScores[key] = existingScore;
      } else {
        newScores[key] = null;
      }
    }

    // Re-check discontinue rule with new start point
    const discontinueAt = getDiscontinuePoint(domain, newScores, newStartItem);
    if (discontinueAt !== null) {
      for (const item of domain.items) {
        if (item.number > discontinueAt) {
          newScores[`${domain.id}-${item.number}`] = 0;
        }
      }
    }
  }

  return newScores;
}

function reducer(state: AssessmentState, action: Action): AssessmentState {
  switch (action.type) {
    case 'SET_CHILD_INFO':
      return { ...state, childInfo: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SELECTED_DOMAINS':
      return { ...state, selectedDomainIds: action.payload };
    case 'SET_DOMAIN':
      return { ...state, currentDomainIndex: action.payload };
    case 'SET_SCORE': {
      let newScores = { ...state.scores, [action.payload.itemId]: action.payload.score };
      const domain = ALL_DOMAINS.find(d => d.id === action.payload.domainId);
      if (domain) {
        const startItemNumber = getStartItem(domain, state.childInfo.startPointLetter);
        const discontinueAt = getDiscontinuePoint(domain, newScores, startItemNumber);
        if (discontinueAt !== null) {
          newScores = applyDiscontinueRule(domain, newScores, discontinueAt);
        }
      }
      return { ...state, scores: newScores };
    }
    case 'START_ASSESSMENT': {
      const preScores: Record<string, number | null> = { ...state.scores };
      const selectedDomains = ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
      for (const domain of selectedDomains) {
        const startItemNumber = getStartItem(domain, state.childInfo.startPointLetter);
        for (const item of domain.items) {
          if (item.number < startItemNumber) {
            preScores[`${domain.id}-${item.number}`] = 2;
          }
        }
      }
      return { ...state, isStarted: true, currentStep: 'assessment', scores: preScores };
    }
    case 'ADJUST_START_POINT': {
      const newLetter = action.payload.startPointLetter;
      const ageRange = AGE_RANGES.find(r => r.startPoint === newLetter);
      const newChildInfo = {
        ...state.childInfo,
        startPointLetter: newLetter,
        ageRange: ageRange ? ageRange.label : state.childInfo.ageRange,
      };
      // Pass the ORIGINAL state (with old start letter) so recalculatePreScores
      // can compare old vs new start points correctly
      const newScores = recalculatePreScores(state, newLetter);
      return { ...state, childInfo: newChildInfo, scores: newScores };
    }
    case 'LOAD_STATE':
      return action.payload;
    case 'RESET':
      // Clear local storage on reset
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return initialState;
    default:
      return state;
  }
}

/**
 * Calculate child's age in total days for scoring table lookups.
 */
export function calculateAgeInDays(birthDate: string, testDate: string, prematureWeeks?: number): number | null {
  if (!birthDate || !testDate) return null;
  const birth = new Date(birthDate + 'T00:00:00');
  const test = new Date(testDate + 'T00:00:00');
  if (isNaN(birth.getTime()) || isNaN(test.getTime())) return null;
  if (test < birth) return null;
  let totalDays = Math.floor((test.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (prematureWeeks && prematureWeeks > 0) {
    totalDays -= prematureWeeks * 7;
    if (totalDays < 0) totalDays = 0;
  }
  return totalDays;
}

interface AssessmentContextType {
  state: AssessmentState;
  dispatch: React.Dispatch<Action>;
  getSelectedDomains: () => DomainData[];
  getDomainItems: (domain: DomainData) => AssessmentItem[];
  getDomainStartItem: (domain: DomainData) => number;
  getDomainRawScore: (domain: DomainData) => number;
  getDomainAnsweredCount: (domain: DomainData) => number;
  getDomainMaxScore: (domain: DomainData) => number;
  getDomainDiscontinuePoint: (domain: DomainData) => number | null;
  isDomainDiscontinued: (domain: DomainData) => boolean;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    // Lazy initializer: load saved state from localStorage synchronously
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AssessmentState;
        if (parsed && parsed.childInfo && typeof parsed.isStarted === 'boolean') {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return init;
  });

  // Auto-save state to localStorage on every change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage full or unavailable
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const getSelectedDomains = useCallback(() => {
    return ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
  }, [state.selectedDomainIds]);

  const getDomainItems = useCallback((domain: DomainData) => {
    return domain.items;
  }, []);

  const getDomainStartItem = useCallback((domain: DomainData) => {
    return getStartItem(domain, state.childInfo.startPointLetter);
  }, [state.childInfo.startPointLetter]);

  const getDomainRawScore = useCallback(
    (domain: DomainData) => {
      return domain.items.reduce((sum, item) => {
        const key = `${domain.id}-${item.number}`;
        const score = state.scores[key];
        return sum + (score ?? 0);
      }, 0);
    },
    [state.scores]
  );

  const getDomainAnsweredCount = useCallback(
    (domain: DomainData) => {
      return domain.items.filter(item => {
        const key = `${domain.id}-${item.number}`;
        return state.scores[key] !== undefined && state.scores[key] !== null;
      }).length;
    },
    [state.scores]
  );

  const getDomainMaxScore = useCallback((domain: DomainData) => {
    return domain.items.length * 2;
  }, []);

  const getDomainDiscontinuePoint = useCallback(
    (domain: DomainData) => {
      const startItemNumber = getStartItem(domain, state.childInfo.startPointLetter);
      return getDiscontinuePoint(domain, state.scores, startItemNumber);
    },
    [state.scores, state.childInfo.startPointLetter]
  );

  const isDomainDiscontinued = useCallback(
    (domain: DomainData) => {
      return getDomainDiscontinuePoint(domain) !== null;
    },
    [getDomainDiscontinuePoint]
  );

  return (
    <AssessmentContext.Provider
      value={{
        state,
        dispatch,
        getSelectedDomains,
        getDomainItems,
        getDomainStartItem,
        getDomainRawScore,
        getDomainAnsweredCount,
        getDomainMaxScore,
        getDomainDiscontinuePoint,
        isDomainDiscontinued,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
