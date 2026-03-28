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
  | { type: 'SET_SCORE'; payload: { itemId: string; score: number | null } }
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
    case 'SET_SCORE':
      return {
        ...state,
        scores: { ...state.scores, [action.payload.itemId]: action.payload.score },
      };
    case 'START_ASSESSMENT':
      return { ...state, isStarted: true, currentStep: 'assessment' };
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
