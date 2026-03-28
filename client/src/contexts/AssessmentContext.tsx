import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ALL_DOMAINS, type DomainData, type AssessmentItem, getStartItem } from '@/lib/assessmentData';

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
  | { type: 'RESET' };

const initialState: AssessmentState = {
  childInfo: {
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
  },
  currentStep: 'info',
  selectedDomainIds: ALL_DOMAINS.map(d => d.id),
  currentDomainIndex: 0,
  scores: {},
  isStarted: false,
};

/**
 * Check if the discontinue rule has been triggered for a domain.
 * Returns the item number after which discontinue was triggered, or null if not triggered.
 * Rule: 5 consecutive items scored 0 (starting from the start item onward).
 */
export function getDiscontinuePoint(
  domain: DomainData,
  scores: Record<string, number | null>,
  startItemNumber: number
): number | null {
  let consecutiveZeros = 0;
  // Only check items from start point onward
  for (const item of domain.items) {
    if (item.number < startItemNumber) continue;
    const key = `${domain.id}-${item.number}`;
    const score = scores[key];
    if (score === 0) {
      consecutiveZeros++;
      if (consecutiveZeros >= 5) {
        return item.number; // Discontinue triggered at this item
      }
    } else if (score !== null && score !== undefined) {
      consecutiveZeros = 0;
    } else {
      // Item not yet scored — can't determine discontinue yet
      break;
    }
  }
  return null;
}

/**
 * Apply discontinue rule: auto-score all items after the discontinue point as 0.
 */
function applyDiscontinueRule(
  domain: DomainData,
  scores: Record<string, number | null>,
  discontinueAt: number
): Record<string, number | null> {
  const updated = { ...scores };
  for (const item of domain.items) {
    if (item.number > discontinueAt) {
      const key = `${domain.id}-${item.number}`;
      updated[key] = 0;
    }
  }
  return updated;
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

      // Check discontinue rule for the domain this item belongs to
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
      // Pre-score all items before the start point as 2 (Mastery) for each selected domain
      const preScores: Record<string, number | null> = { ...state.scores };
      const selectedDomains = ALL_DOMAINS.filter(d => state.selectedDomainIds.includes(d.id));
      for (const domain of selectedDomains) {
        const startItemNumber = getStartItem(domain, state.childInfo.startPointLetter);
        for (const item of domain.items) {
          if (item.number < startItemNumber) {
            const key = `${domain.id}-${item.number}`;
            preScores[key] = 2;
          }
        }
      }
      return { ...state, isStarted: true, currentStep: 'assessment', scores: preScores };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(reducer, initialState);

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
