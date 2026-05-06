/**
 * MultiAssessmentContext
 * 
 * Design: Clinical Precision / Swiss Medical
 * Manages state for multiple assessment form types simultaneously.
 * Each form type has its own set of domain scores, timers, notes, and discontinue state.
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { FORM_REGISTRY, getFormById, type FormDefinition, type UnifiedDomain } from '@/lib/formRegistry';
import { todayLocal } from '@/lib/dateUtils';

// ============================================================
// Types
// ============================================================

export interface ChildInfo {
  firstName: string;
  lastName: string;
  dob: string;
  testDate: string;
  gender: string;
  premature: boolean;
  weeksPremature: number;
  reasonForReferral: string;
}

export interface ExaminerInfo {
  name: string;
  title: string;
  agency: string;
}

export interface FormSelection {
  formId: string;
  selectedDomainIds: string[];  // localId within the form
  ageRangeLabel: string;        // selected age range for start point
  scoringMethod?: 'native' | 'bayley4ab';  // DAYC-2 only: native DAYC-2 scoring or Bayley-4 Adaptive Behavior
}

export interface DomainState {
  scores: Record<number, number | null>;  // itemNumber -> score
  notes: Record<number, string>;          // itemNumber -> note text
  discontinued: boolean;
  discontinuedAtItem: number | null;
  timerSeconds: number;
}

export interface FormState {
  formId: string;
  domains: Record<string, DomainState>;  // domainLocalId -> DomainState
  ageRangeLabel: string;
}

export type AppPhase = 'welcome' | 'profiles' | 'profileView' | 'dashboard' | 'allAssessments' | 'childInfo' | 'examinerInfo' | 'formSelection' | 'assessment' | 'summary' | 'report' | 'history' | 'backup' | 'settings';

export interface MultiAssessmentState {
  phase: AppPhase;
  childInfo: ChildInfo;
  examinerInfo: ExaminerInfo;
  formSelections: FormSelection[];
  formStates: Record<string, FormState>;  // formId -> FormState
  activeFormId: string | null;
  activeDomainLocalId: string | null;
  timerRunning: boolean;
  sessionStartTime: number | null;
  totalElapsedSeconds: number;
  activeProfileId: string | null;  // linked client profile
}

// ============================================================
// Actions
// ============================================================

type Action =
  | { type: 'SET_CHILD_INFO'; payload: ChildInfo }
  | { type: 'SET_EXAMINER_INFO'; payload: ExaminerInfo }
  | { type: 'SET_FORM_SELECTIONS'; payload: FormSelection[] }
  | { type: 'START_ASSESSMENT' }
  | { type: 'SET_SCORE'; formId: string; domainLocalId: string; itemNumber: number; score: number }
  | { type: 'SET_NOTE'; formId: string; domainLocalId: string; itemNumber: number; note: string }
  | { type: 'SET_ACTIVE_FORM'; formId: string }
  | { type: 'SET_ACTIVE_DOMAIN'; formId: string; domainLocalId: string }
  | { type: 'GO_TO_SUMMARY' }
  | { type: 'ADJUST_START_POINT'; formId: string; newAgeRangeLabel: string }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'RESET_ALL' }
  | { type: 'NEW_ASSESSMENT' }
  | { type: 'LOAD_STATE'; payload: MultiAssessmentState }
  | { type: 'GO_TO_PHASE'; phase: AppPhase }
  | { type: 'GO_TO_REPORT' };

// ============================================================
// Initial State
// ============================================================

const initialChildInfo: ChildInfo = {
  firstName: '',
  lastName: '',
  dob: '',
  testDate: todayLocal(),
  gender: '',
  premature: false,
  weeksPremature: 0,
  reasonForReferral: '',
};

const initialExaminerInfo: ExaminerInfo = {
  name: '',
  title: '',
  agency: '',
};

const initialState: MultiAssessmentState = {
  phase: 'welcome',
  childInfo: initialChildInfo,
  examinerInfo: initialExaminerInfo,
  formSelections: [],
  formStates: {},
  activeFormId: null,
  activeDomainLocalId: null,
  timerRunning: false,
  sessionStartTime: null,
  totalElapsedSeconds: 0,
  activeProfileId: null,
};

// ============================================================
// Helpers
// ============================================================

function createDomainState(): DomainState {
  return {
    scores: {},
    notes: {},
    discontinued: false,
    discontinuedAtItem: null,
    timerSeconds: 0,
  };
}

function preScoreItems(
  form: FormDefinition,
  domain: UnifiedDomain,
  ageRangeLabel: string,
): Record<number, number | null> {
  const startItem = form.getStartItem(domain.localId, ageRangeLabel);
  const scores: Record<number, number | null> = {};
  for (const item of domain.items) {
    if (item.number < startItem) {
      scores[item.number] = domain.maxScorePerItem; // auto-score as max
    }
  }
  return scores;
}

/**
 * Check if a domain should be discontinued.
 * @param scores - current item scores
 * @param items - ordered list of items
 * @param consecutiveCount - how many consecutive low scores trigger discontinue
 * @param threshold - scores <= threshold count as "low" (default 0 = only zeros)
 */
function checkDiscontinue(
  scores: Record<number, number | null>,
  items: { number: number }[],
  consecutiveCount: number,
  threshold: number = 0,
): { discontinued: boolean; discontinuedAtItem: number | null } {
  let consecutive = 0;
  for (const item of items) {
    const score = scores[item.number];
    if (score !== null && score !== undefined && score <= threshold) {
      consecutive++;
      if (consecutive >= consecutiveCount) {
        return { discontinued: true, discontinuedAtItem: item.number };
      }
    } else if (score !== null && score !== undefined) {
      consecutive = 0;
    } else {
      // null/unscored breaks the chain
      consecutive = 0;
    }
  }
  return { discontinued: false, discontinuedAtItem: null };
}

function applyDiscontinue(
  domainState: DomainState,
  domain: UnifiedDomain,
  discontinuedAtItem: number,
): DomainState {
  const newScores = { ...domainState.scores };
  for (const item of domain.items) {
    if (item.number > discontinuedAtItem && (newScores[item.number] === null || newScores[item.number] === undefined)) {
      newScores[item.number] = 0;
    }
  }
  return {
    ...domainState,
    scores: newScores,
    discontinued: true,
    discontinuedAtItem,
  };
}

/**
 * Remove the discontinued state: clear auto-scored trailing 0s after the old discontinue point.
 * Only clears items that were auto-filled (after the discontinue point), preserving any
 * manually entered scores.
 */
function undoDiscontinue(
  domainState: DomainState,
  domain: UnifiedDomain,
  oldDiscontinuedAtItem: number,
): DomainState {
  const newScores = { ...domainState.scores };
  // Clear auto-scored 0s after the old discontinue point
  for (const item of domain.items) {
    if (item.number > oldDiscontinuedAtItem) {
      // Only clear if it was auto-scored as 0 (we can't distinguish perfectly,
      // but items after discontinue point with score 0 were auto-filled)
      if (newScores[item.number] === 0) {
        delete newScores[item.number];
      }
    }
  }
  return {
    ...domainState,
    scores: newScores,
    discontinued: false,
    discontinuedAtItem: null,
  };
}

// ============================================================
// Reducer
// ============================================================

function reducer(state: MultiAssessmentState, action: Action): MultiAssessmentState {
  switch (action.type) {
    case 'SET_CHILD_INFO':
      return { ...state, childInfo: action.payload };

    case 'SET_EXAMINER_INFO':
      return { ...state, examinerInfo: action.payload };

    case 'SET_FORM_SELECTIONS':
      return { ...state, formSelections: action.payload };

    case 'START_ASSESSMENT': {
      const formStates: Record<string, FormState> = {};

      for (const sel of state.formSelections) {
        const form = getFormById(sel.formId);
        if (!form) continue;

        const domains: Record<string, DomainState> = {};
        for (const domainLocalId of sel.selectedDomainIds) {
          const domain = form.domains.find(d => d.localId === domainLocalId);
          if (!domain) continue;

          const ds = createDomainState();
          if (form.hasStartPoints) {
            ds.scores = preScoreItems(form, domain, sel.ageRangeLabel);
          }
          domains[domainLocalId] = ds;
        }

        formStates[sel.formId] = {
          formId: sel.formId,
          domains,
          ageRangeLabel: sel.ageRangeLabel,
        };
      }

      // Set first form and first domain as active
      const firstSel = state.formSelections[0];
      const firstDomainId = firstSel?.selectedDomainIds[0] || null;

      return {
        ...state,
        phase: 'assessment',
        formStates,
        activeFormId: firstSel?.formId || null,
        activeDomainLocalId: firstDomainId,
        timerRunning: true,
        sessionStartTime: Date.now(),
        totalElapsedSeconds: 0,
      };
    }

    case 'SET_SCORE': {
      const { formId, domainLocalId, itemNumber, score } = action;
      const formState = state.formStates[formId];
      if (!formState) return state;
      const domainState = formState.domains[domainLocalId];
      if (!domainState) return state;

      // Allow editing items at or before the discontinue point (for undo),
      // but block editing auto-scored items after the discontinue point
      if (domainState.discontinued && domainState.discontinuedAtItem !== null) {
        if (itemNumber > domainState.discontinuedAtItem) return state;
      }

      const form = getFormById(formId);
      const domain = form?.domains.find(d => d.localId === domainLocalId);

      // If currently discontinued and user is editing an item at/before the discontinue point,
      // first undo the discontinue so we can re-evaluate
      let workingState = domainState;
      if (domainState.discontinued && domainState.discontinuedAtItem !== null && domain) {
        workingState = undoDiscontinue(domainState, domain, domainState.discontinuedAtItem);
      }

      const newScores = { ...workingState.scores, [itemNumber]: score };
      let newDomainState: DomainState = { ...workingState, scores: newScores };

      // Re-check discontinue rule
      if (form?.discontinueRule && domain) {
        const threshold = form.discontinueRule.threshold ?? 0;
        const { discontinued, discontinuedAtItem } = checkDiscontinue(
          newScores,
          domain.items,
          form.discontinueRule.consecutiveZeros,
          threshold,
        );
        if (discontinued && discontinuedAtItem) {
          newDomainState = applyDiscontinue(newDomainState, domain, discontinuedAtItem);
        }
      }

      return {
        ...state,
        formStates: {
          ...state.formStates,
          [formId]: {
            ...formState,
            domains: {
              ...formState.domains,
              [domainLocalId]: newDomainState,
            },
          },
        },
      };
    }

    case 'SET_NOTE': {
      const { formId, domainLocalId, itemNumber, note } = action;
      const formState = state.formStates[formId];
      if (!formState) return state;
      const domainState = formState.domains[domainLocalId];
      if (!domainState) return state;

      return {
        ...state,
        formStates: {
          ...state.formStates,
          [formId]: {
            ...formState,
            domains: {
              ...formState.domains,
              [domainLocalId]: {
                ...domainState,
                notes: { ...domainState.notes, [itemNumber]: note },
              },
            },
          },
        },
      };
    }

    case 'SET_ACTIVE_FORM':
      return { ...state, activeFormId: action.formId };

    case 'SET_ACTIVE_DOMAIN': {
      return {
        ...state,
        activeFormId: action.formId,
        activeDomainLocalId: action.domainLocalId,
      };
    }

    case 'GO_TO_SUMMARY':
      return { ...state, phase: 'summary', timerRunning: false };

    case 'GO_TO_PHASE':
      return { ...state, phase: action.phase };

    case 'ADJUST_START_POINT': {
      const { formId, newAgeRangeLabel } = action;
      const form = getFormById(formId);
      if (!form) return state;
      const formState = state.formStates[formId];
      if (!formState) return state;

      const newDomains: Record<string, DomainState> = {};
      for (const [domainLocalId, domainState] of Object.entries(formState.domains)) {
        const domain = form.domains.find(d => d.localId === domainLocalId);
        if (!domain) {
          newDomains[domainLocalId] = domainState;
          continue;
        }

        const oldStartItem = form.getStartItem(domainLocalId, formState.ageRangeLabel);
        const newStartItem = form.getStartItem(domainLocalId, newAgeRangeLabel);
        const newScores: Record<number, number | null> = {};

        for (const item of domain.items) {
          if (item.number < newStartItem) {
            // Before new start: auto-score as max
            newScores[item.number] = domain.maxScorePerItem;
          } else if (item.number < oldStartItem && item.number >= newStartItem) {
            // Was auto-scored but now in active range: clear
            newScores[item.number] = null as any;
          } else {
            // Keep existing manual scores
            const existing = domainState.scores[item.number];
            if (existing !== null && existing !== undefined) {
              // If this was an auto-score from old start point, clear it
              if (item.number >= newStartItem && item.number < oldStartItem) {
                newScores[item.number] = null as any;
              } else {
                newScores[item.number] = existing;
              }
            }
          }
        }

        newDomains[domainLocalId] = {
          ...domainState,
          scores: newScores,
          discontinued: false,
          discontinuedAtItem: null,
        };
      }

      // Update the form selection too
      const newFormSelections = state.formSelections.map(sel =>
        sel.formId === formId ? { ...sel, ageRangeLabel: newAgeRangeLabel } : sel
      );

      return {
        ...state,
        formSelections: newFormSelections,
        formStates: {
          ...state.formStates,
          [formId]: {
            ...formState,
            domains: newDomains,
            ageRangeLabel: newAgeRangeLabel,
          },
        },
      };
    }

    case 'TICK_TIMER': {
      if (!state.timerRunning || !state.activeFormId || !state.activeDomainLocalId) {
        return { ...state, totalElapsedSeconds: state.totalElapsedSeconds + 1 };
      }
      const formState = state.formStates[state.activeFormId];
      if (!formState) return state;
      const domainState = formState.domains[state.activeDomainLocalId];
      if (!domainState) return state;

      return {
        ...state,
        totalElapsedSeconds: state.totalElapsedSeconds + 1,
        formStates: {
          ...state.formStates,
          [state.activeFormId]: {
            ...formState,
            domains: {
              ...formState.domains,
              [state.activeDomainLocalId]: {
                ...domainState,
                timerSeconds: domainState.timerSeconds + 1,
              },
            },
          },
        },
      };
    }

    case 'TOGGLE_TIMER':
      return { ...state, timerRunning: !state.timerRunning };

    case 'GO_TO_REPORT':
      return { ...state, phase: 'report' };

    case 'RESET_ALL':
      localStorage.removeItem('bayley4-multi-assessment');
      return { ...initialState, phase: 'profiles' };

    case 'NEW_ASSESSMENT':
      localStorage.removeItem('bayley4-multi-assessment');
      return {
        ...initialState,
        phase: 'childInfo',
        childInfo: {
          ...initialChildInfo,
          testDate: todayLocal(),
        },
        examinerInfo: { ...initialExaminerInfo },
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface MultiAssessmentContextType {
  state: MultiAssessmentState;
  dispatch: React.Dispatch<Action>;
  getActiveDomain: () => UnifiedDomain | null;
  getActiveForm: () => FormDefinition | null;
  getDomainProgress: (formId: string, domainLocalId: string) => { scored: number; total: number };
  getRawScore: (formId: string, domainLocalId: string) => number;
}

const MultiAssessmentContext = createContext<MultiAssessmentContextType | null>(null);

export function MultiAssessmentProvider({ children }: { children: React.ReactNode }) {
  // Always start at welcome — never auto-resume a previous assessment
  const [state, dispatch] = useReducer(reducer, initialState);

  // Auto-save current assessment state for crash recovery (but we always start at welcome on fresh launch)
  const saveRef = useRef(state);
  saveRef.current = state;
  useEffect(() => {
    // Only auto-save if we're in an active assessment phase (not welcome/dashboard/profiles)
    if (state.phase === 'welcome' || state.phase === 'dashboard' || state.phase === 'profiles' || state.phase === 'profileView' || state.phase === 'allAssessments') return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem('bayley4-multi-assessment', JSON.stringify(saveRef.current));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timeout);
  }, [state]);

  // Timer tick
  useEffect(() => {
    if (!state.timerRunning) return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.timerRunning]);

  const getActiveDomain = useCallback((): UnifiedDomain | null => {
    if (!state.activeFormId || !state.activeDomainLocalId) return null;
    const form = getFormById(state.activeFormId);
    if (!form) return null;
    return form.domains.find(d => d.localId === state.activeDomainLocalId) || null;
  }, [state.activeFormId, state.activeDomainLocalId]);

  const getActiveForm = useCallback((): FormDefinition | null => {
    if (!state.activeFormId) return null;
    return getFormById(state.activeFormId) || null;
  }, [state.activeFormId]);

  const getDomainProgress = useCallback((formId: string, domainLocalId: string): { scored: number; total: number } => {
    const form = getFormById(formId);
    if (!form) return { scored: 0, total: 0 };
    const domain = form.domains.find(d => d.localId === domainLocalId);
    if (!domain) return { scored: 0, total: 0 };
    const formState = state.formStates[formId];
    if (!formState) return { scored: 0, total: domain.items.length };
    const domainState = formState.domains[domainLocalId];
    if (!domainState) return { scored: 0, total: domain.items.length };
    const scored = domain.items.filter(item => {
      const s = domainState.scores[item.number];
      return s !== null && s !== undefined;
    }).length;
    return { scored, total: domain.items.length };
  }, [state.formStates]);

  const getRawScore = useCallback((formId: string, domainLocalId: string): number => {
    const formState = state.formStates[formId];
    if (!formState) return 0;
    const domainState = formState.domains[domainLocalId];
    if (!domainState) return 0;
    return Object.values(domainState.scores).reduce((sum: number, s) => sum + (s || 0), 0);
  }, [state.formStates]);

  return (
    <MultiAssessmentContext.Provider value={{ state, dispatch, getActiveDomain, getActiveForm, getDomainProgress, getRawScore }}>
      {children}
    </MultiAssessmentContext.Provider>
  );
}

export function useMultiAssessment() {
  const ctx = useContext(MultiAssessmentContext);
  if (!ctx) throw new Error('useMultiAssessment must be used within MultiAssessmentProvider');
  return ctx;
}
