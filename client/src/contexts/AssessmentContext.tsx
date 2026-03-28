import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
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
  itemNotes: Record<string, string>;
  domainTimers: Record<string, number>; // accumulated seconds per domain
  activeDomainTimerStart: number | null; // timestamp when current domain timer started
  isStarted: boolean;
}

type Action =
  | { type: 'SET_CHILD_INFO'; payload: ChildInfo }
  | { type: 'SET_STEP'; payload: 'info' | 'assessment' | 'summary' }
  | { type: 'SET_SELECTED_DOMAINS'; payload: string[] }
  | { type: 'SET_DOMAIN'; payload: number }
  | { type: 'SET_SCORE'; payload: { itemId: string; score: number | null; domainId: string } }
  | { type: 'SET_ITEM_NOTE'; payload: { itemId: string; note: string } }
  | { type: 'TICK_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
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
  itemNotes: {},
  domainTimers: {},
  activeDomainTimerStart: null,
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
        newScores[key] = 2;
      } else if (item.number < oldStartItem) {
        newScores[key] = null;
      } else if (existingScore !== undefined && existingScore !== null) {
        newScores[key] = existingScore;
      } else {
        newScores[key] = null;
      }
    }

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

/**
 * Helper: flush the active timer into domainTimers accumulator.
 */
function flushTimer(state: AssessmentState): AssessmentState {
  if (state.activeDomainTimerStart === null) return state;
  const selectedDomains = ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
  const currentDomain = selectedDomains[state.currentDomainIndex];
  if (!currentDomain) return state;
  const elapsed = Math.floor((Date.now() - state.activeDomainTimerStart) / 1000);
  const prev = state.domainTimers[currentDomain.id] || 0;
  return {
    ...state,
    domainTimers: { ...state.domainTimers, [currentDomain.id]: prev + elapsed },
    activeDomainTimerStart: Date.now(),
  };
}

function reducer(state: AssessmentState, action: Action): AssessmentState {
  switch (action.type) {
    case 'SET_CHILD_INFO':
      return { ...state, childInfo: action.payload };
    case 'SET_STEP': {
      // Flush timer when leaving assessment
      const flushed = flushTimer(state);
      return {
        ...flushed,
        currentStep: action.payload,
        activeDomainTimerStart: action.payload === 'assessment' ? Date.now() : null,
      };
    }
    case 'SET_SELECTED_DOMAINS':
      return { ...state, selectedDomainIds: action.payload };
    case 'SET_DOMAIN': {
      // Flush timer for old domain, start timer for new domain
      const flushed = flushTimer(state);
      return {
        ...flushed,
        currentDomainIndex: action.payload,
        activeDomainTimerStart: Date.now(),
      };
    }
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
    case 'SET_ITEM_NOTE':
      return {
        ...state,
        itemNotes: { ...state.itemNotes, [action.payload.itemId]: action.payload.note },
      };
    case 'TICK_TIMER': {
      // No-op for re-render trigger; actual time is computed from activeDomainTimerStart
      return { ...state };
    }
    case 'PAUSE_TIMER': {
      const flushed = flushTimer(state);
      return { ...flushed, activeDomainTimerStart: null };
    }
    case 'RESUME_TIMER':
      return { ...state, activeDomainTimerStart: Date.now() };
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
      return {
        ...state,
        isStarted: true,
        currentStep: 'assessment',
        scores: preScores,
        activeDomainTimerStart: Date.now(),
      };
    }
    case 'ADJUST_START_POINT': {
      const newLetter = action.payload.startPointLetter;
      const ageRange = AGE_RANGES.find(r => r.startPoint === newLetter);
      const newChildInfo = {
        ...state.childInfo,
        startPointLetter: newLetter,
        ageRange: ageRange ? ageRange.label : state.childInfo.ageRange,
      };
      const newScores = recalculatePreScores(state, newLetter);
      return { ...state, childInfo: newChildInfo, scores: newScores };
    }
    case 'LOAD_STATE':
      return action.payload;
    case 'RESET':
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
  getDomainElapsedSeconds: (domain: DomainData) => number;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AssessmentState;
        if (parsed && parsed.childInfo && typeof parsed.isStarted === 'boolean') {
          // Ensure new fields exist for backward compat
          if (!parsed.itemNotes) parsed.itemNotes = {};
          if (!parsed.domainTimers) parsed.domainTimers = {};
          // Don't restore active timer start — it's stale from a previous session
          parsed.activeDomainTimerStart = parsed.currentStep === 'assessment' ? Date.now() : null;
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return init;
  });

  // Timer tick: re-render every second when timer is active
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (state.activeDomainTimerStart !== null) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.activeDomainTimerStart]);

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

  const getDomainElapsedSeconds = useCallback(
    (domain: DomainData) => {
      const accumulated = state.domainTimers[domain.id] || 0;
      // If this is the currently active domain, add live elapsed
      const selectedDomains = ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
      const currentDomain = selectedDomains[state.currentDomainIndex];
      if (
        currentDomain &&
        currentDomain.id === domain.id &&
        state.activeDomainTimerStart !== null
      ) {
        const live = Math.floor((Date.now() - state.activeDomainTimerStart) / 1000);
        return accumulated + live;
      }
      return accumulated;
    },
    [state.domainTimers, state.activeDomainTimerStart, state.currentDomainIndex, state.selectedDomainIds]
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
        getDomainElapsedSeconds,
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
