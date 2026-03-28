import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { domains, type Domain, type Subdomain } from '@/lib/assessmentData';

export interface ChildInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  examinerName: string;
  examDate: string;
  ageRange: string;
  notes: string;
}

export interface AssessmentState {
  childInfo: ChildInfo;
  currentStep: 'info' | 'assessment' | 'summary';
  currentDomainIndex: number;
  currentSubdomainIndex: number;
  scores: Record<string, number | null>;
  isStarted: boolean;
}

type Action =
  | { type: 'SET_CHILD_INFO'; payload: ChildInfo }
  | { type: 'SET_STEP'; payload: 'info' | 'assessment' | 'summary' }
  | { type: 'SET_DOMAIN'; payload: number }
  | { type: 'SET_SUBDOMAIN'; payload: number }
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
    notes: '',
  },
  currentStep: 'info',
  currentDomainIndex: 0,
  currentSubdomainIndex: 0,
  scores: {},
  isStarted: false,
};

function reducer(state: AssessmentState, action: Action): AssessmentState {
  switch (action.type) {
    case 'SET_CHILD_INFO':
      return { ...state, childInfo: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_DOMAIN':
      return { ...state, currentDomainIndex: action.payload, currentSubdomainIndex: 0 };
    case 'SET_SUBDOMAIN':
      return { ...state, currentSubdomainIndex: action.payload };
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
  getSubdomainRawScore: (subdomain: Subdomain) => number;
  getSubdomainAnsweredCount: (subdomain: Subdomain) => number;
  getDomainRawScore: (domain: Domain) => number;
  getDomainAnsweredCount: (domain: Domain) => number;
  getDomainTotalItems: (domain: Domain) => number;
  getAllItems: (subdomain: Subdomain) => { id: string; text: string; number: number }[];
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getAllItems = useCallback((subdomain: Subdomain) => {
    if (subdomain.items) return subdomain.items;
    if (subdomain.stages) {
      return subdomain.stages.flatMap(s => s.items);
    }
    return [];
  }, []);

  const getSubdomainRawScore = useCallback(
    (subdomain: Subdomain) => {
      const items = getAllItems(subdomain);
      return items.reduce((sum, item) => {
        const score = state.scores[item.id];
        return sum + (score ?? 0);
      }, 0);
    },
    [state.scores, getAllItems]
  );

  const getSubdomainAnsweredCount = useCallback(
    (subdomain: Subdomain) => {
      const items = getAllItems(subdomain);
      return items.filter(item => state.scores[item.id] !== undefined && state.scores[item.id] !== null).length;
    },
    [state.scores, getAllItems]
  );

  const getDomainRawScore = useCallback(
    (domain: Domain) => {
      return domain.subdomains.reduce((sum, sub) => sum + getSubdomainRawScore(sub), 0);
    },
    [getSubdomainRawScore]
  );

  const getDomainAnsweredCount = useCallback(
    (domain: Domain) => {
      return domain.subdomains.reduce((sum, sub) => sum + getSubdomainAnsweredCount(sub), 0);
    },
    [getSubdomainAnsweredCount]
  );

  const getDomainTotalItems = useCallback((domain: Domain) => {
    return domain.subdomains.reduce((sum, sub) => {
      if (sub.items) return sum + sub.items.length;
      if (sub.stages) return sum + sub.stages.reduce((s, st) => s + st.items.length, 0);
      return sum;
    }, 0);
  }, []);

  return (
    <AssessmentContext.Provider
      value={{
        state,
        dispatch,
        getSubdomainRawScore,
        getSubdomainAnsweredCount,
        getDomainRawScore,
        getDomainAnsweredCount,
        getDomainTotalItems,
        getAllItems,
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
