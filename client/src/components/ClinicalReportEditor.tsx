/**
 * ClinicalReportEditor
 *
 * Post-assessment clinical narrative report generator with template selector.
 * Supports two report formats:
 *   1. OT Developmental Intake Assessment — scoring tables, domain narratives, feeding, sensory, summary
 *   2. OT SI Assessment (Sensory Integration) — SP2 quadrant/section tables, detailed sensory narratives
 *
 * Features:
 * - Template selector: switch between Developmental Intake and SI Assessment layouts
 * - Save Report: persists all editable fields to localStorage with debounced save
 * - Cognitive Composite: displays COG composite alongside Motor composite
 * - Not Demonstrated: toggleable per-domain section listing items not demonstrated
 */

import { useMultiAssessment, type ChildInfo, type ExaminerInfo } from '@/contexts/MultiAssessmentContext';
import { getFormById, type FormDefinition, type UnifiedDomain } from '@/lib/formRegistry';
import { lookupScaledScore, lookupAgeEquivalent, lookupGrowthScaleValue, lookupStandardScore } from '@/lib/scoringTables';
import { REEL3_AGE_EQUIVALENT } from '@/lib/reel3Data';
import { lookupDAYC2StandardScore, lookupDAYC2AgeEquivalent, lookupDAYC2PercentileRank, lookupDAYC2DescriptiveTerm } from '@/lib/dayc2ScoringTables';
import { lookupDAYC2WithBayley4AB, computeDAYC2BayleyComposites, getScaledScoreClassification, getCompositeClassification, type CompositeResult } from '@/lib/bayley4AdaptiveSE';
import { lookupREEL3AbilityScore, lookupREEL3PercentileRank, lookupREEL3DescriptiveTerm } from '@/lib/reel3ScoringTables';
import { SP2_ENGLISH_CUTOFFS, SP2_BIRTH6MO_CUTOFFS, SP2_QUADRANT_MAP, getSP2Description } from '@/lib/sensoryProfileData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, FileText, ChevronDown, ChevronUp, Pencil, Check, RotateCcw, Save, Eye, EyeOff, LayoutTemplate, FileDown, BookmarkPlus, FileOutput, WandSparkles, Loader2, Undo2 } from 'lucide-react';
import { generateDocxReport, type DocxReportData, type DomainNarrativeData as DocxDomainNarrative } from '@/lib/generateDocx';
import { generatePdfReport } from '@/lib/generateReportPdf';
import { loadAppSettings, type RecommendationTemplate } from '@/components/SettingsPreferences';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { saveMultiSession } from '@/lib/multiSessionStorage';
import { FeedingPerformanceChecklist, ASPIRATION_SIGN_LABELS } from '@/components/FeedingPerformanceChecklist';
import type { FeedingChecklistDataType } from '@/components/FeedingPerformanceChecklist';
import type { FeedingChecklistExportData } from '@/lib/generateDocx';
import { FeedingBehaviorsChecklist } from '@/components/FeedingBehaviorsChecklist';
import { SelfFeedingChecklist } from '@/components/SelfFeedingChecklist';
import { DrinkingChecklist } from '@/components/DrinkingChecklist';
import type { FeedingBehaviorsData } from '@/components/FeedingBehaviorsChecklist';
import type { SelfFeedingData } from '@/components/SelfFeedingChecklist';
import type { DrinkingData } from '@/components/DrinkingChecklist';
import { generateAllChecklistsPdf } from '@/lib/generateAllChecklistsPdf';
import { parseLocalDate, formatDateLocal, calculateAge } from '@/lib/dateUtils';
import { enhanceWithAI, generateRecommendations, isOnline, isAiConfigured } from '@/lib/aiEnhance';

// ============================================================
// Types & Constants
// ============================================================

type ReportTemplate = 'developmental' | 'sensory' | 'feeding';

const REPORT_STORAGE_KEY = 'bayley4-clinical-report';

const TEMPLATE_INFO: Record<ReportTemplate, { label: string; title: string; description: string }> = {
  developmental: {
    label: 'OT Developmental Intake',
    title: 'Occupational Therapy Developmental Intake Assessment',
    description: 'Includes Bayley-4, DAYC-2, REEL-3 scoring tables, domain narratives, feeding/oral motor, and brief sensory processing.',
  },
  sensory: {
    label: 'OT SI Assessment',
    title: 'Occupational Therapy Sensory Integration Assessment',
    description: 'Focuses on Sensory Profile 2 quadrant and section scores with detailed sensory processing narratives.',
  },
  feeding: {
    label: 'OT Feeding Evaluation',
    title: 'Occupational Therapy Feeding Evaluation',
    description: 'Feeding-focused evaluation using DAYC-2 or Bayley-4 Adaptive scores with oral motor, sensory, and neuromuscular sections.',
  },
};

// ============================================================
// Helpers
// ============================================================

function calculateAgeInDays(dob: string, testDate: string, premWeeks: number): number | null {
  if (!dob || !testDate) return null;
  const birth = parseLocalDate(dob);
  const test = parseLocalDate(testDate);
  let days = Math.floor((test.getTime() - birth.getTime()) / 86400000);
  if (premWeeks > 0) days -= premWeeks * 7;
  return Math.max(0, days);
}

function ageInMonths(dob: string, testDate: string, premWeeks: number): number {
  const days = calculateAgeInDays(dob, testDate, premWeeks);
  if (days === null) return 0;
  return Math.floor(days / 30.44);
}

function formatAgeDisplay(dob: string, testDate: string): string {
  if (!dob || !testDate) return 'N/A';
  const { months, days } = calculateAge(dob, testDate);
  return `${months} months, ${days} days`;
}

function formatDate(dateStr: string): string {
  return formatDateLocal(dateStr);
}

function pronoun(gender: string, type: 'subject' | 'object' | 'possessive'): string {
  const g = gender.toLowerCase();
  if (g === 'male' || g === 'm') return type === 'subject' ? 'he' : type === 'object' ? 'him' : 'his';
  if (g === 'female' || g === 'f') return type === 'subject' ? 'she' : type === 'object' ? 'her' : 'her';
  return type === 'subject' ? 'they' : type === 'object' ? 'them' : 'their';
}

function Pronoun(gender: string, type: 'subject' | 'object' | 'possessive'): string {
  const p = pronoun(gender, type);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

const bayleyDomainKey: Record<string, 'CG' | 'FM' | 'GM' | 'RC' | 'EC' | null> = {
  cognitive: 'CG', receptiveCommunication: 'RC', expressiveCommunication: 'EC', fineMotor: 'FM', grossMotor: 'GM',
};

// ============================================================
// Saved Report State
// ============================================================

interface SavedReportState {
  template: ReportTemplate;
  referralInfo: string;
  medicalHistory: string;
  parentConcerns: string;
  clinicalObservation: string;
  feedingOralMotor: string;
  sensoryNarrative: string;
  recommendations: string;
  closingNote: string;
  practiceName: string;
  reportTitle: string;
  domainOverrides: Record<string, string>;
  scoreOverrides?: Record<string, string>; // e.g. "bayley4_cognitive_scaledScore" → "8"
  uciNumber?: string;
  regionalCenter?: string;
  // SI-specific
  testingConditions: string;
  validityStatement: string;
  quadrantNarratives: Record<string, string>;
  sectionNarratives: Record<string, string>;
  siSummary: string;
  childKey: string;
  savedAt: string;
  // Feeding-specific
  feedingTestingConditions?: string;
  feedingOralStructures?: string;
  feedingBehaviors?: string;
  feedingOralMotorCoord?: string;
  feedingFoodRepertoire?: string;
  feedingSelfFeeding?: string;
  feedingPreviousHistory?: string;
  feedingDrinking?: string;
  feedingVestibular?: string;
  feedingProprioceptive?: string;
  feedingTactile?: string;
  feedingROM?: string;
  feedingMuscleStrength?: string;
  feedingMuscleTone?: string;
  feedingPosturalStability?: string;
  feedingSummary?: string;
}

function getChildKey(childInfo: ChildInfo): string {
  return `${childInfo.firstName}_${childInfo.lastName}_${childInfo.dob}_${childInfo.testDate}`;
}

// ============================================================
// EditableSection
// ============================================================

function EditableSection({
  label, value, onChange, placeholder, rows = 4, childName, sectionContext,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
  childName?: string; sectionContext?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleAiEnhance = async () => {
    const textToEnhance = value?.trim();
    if (!textToEnhance || textToEnhance.length < 10) {
      toast.error('Please add more text before using AI Enhance.');
      return;
    }
    if (!isAiConfigured()) {
      toast('AI not configured', {
        description: 'Add your OpenRouter API key in Settings → AI Settings to enable AI Enhance.',
        duration: 6000,
      });
      return;
    }
    if (!isOnline()) {
      toast.error('No internet connection. AI Enhance requires an internet connection.');
      return;
    }
    setAiLoading(true);
    setPreviousValue(value);
    abortRef.current = new AbortController();
    try {
      const result = await enhanceWithAI({
        text: textToEnhance,
        sectionContext: sectionContext || label || undefined,
        childName,
        signal: abortRef.current.signal,
      });
      if (result.success && result.enhanced) {
        onChange(result.enhanced);
        toast.success('Text enhanced! Click "Undo AI" to revert.', { duration: 5000 });
      } else if (result.needsSetup) {
        setPreviousValue(null);
        toast('AI setup needed', {
          description: result.error,
          duration: 6000,
        });
      } else {
        setPreviousValue(null);
        toast.error(result.error || 'AI enhancement failed.');
      }
    } catch {
      setPreviousValue(null);
      toast.error('AI enhancement failed unexpectedly.');
    } finally {
      setAiLoading(false);
      abortRef.current = null;
    }
  };

  const handleUndoAi = () => {
    if (previousValue !== null) {
      onChange(previousValue);
      setPreviousValue(null);
      toast.info('Reverted to original text.');
    }
  };

  const handleCancelAi = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setAiLoading(false);
  };

  const isHeader = !label;
  const hasContent = !!value?.trim() && value.trim().length >= 10;

  return (
    <div className="mb-4">
      {label ? (
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{label}</h3>
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 print:hidden">
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
          {hasContent && !isHeader && (
            <>
              {aiLoading ? (
                <span className="flex items-center gap-1 text-xs text-purple-600 print:hidden">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enhancing…
                  <button onClick={handleCancelAi} className="ml-1 text-red-500 hover:text-red-700 underline">Cancel</button>
                </span>
              ) : (
                <button
                  onClick={handleAiEnhance}
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 print:hidden"
                  title="Rewrite this section using AI for a more professional clinical narrative"
                >
                  <WandSparkles className="w-3 h-3" />
                  AI Enhance
                </button>
              )}
              {previousValue !== null && !aiLoading && (
                <button
                  onClick={handleUndoAi}
                  className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 print:hidden"
                  title="Revert to the text before AI enhancement"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo AI
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-end gap-2 mb-1 print:hidden">
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
          {hasContent && (
            <>
              {aiLoading ? (
                <span className="flex items-center gap-1 text-xs text-purple-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enhancing…
                  <button onClick={handleCancelAi} className="ml-1 text-red-500 hover:text-red-700 underline">Cancel</button>
                </span>
              ) : (
                <button
                  onClick={handleAiEnhance}
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  title="Rewrite this section using AI for a more professional clinical narrative"
                >
                  <WandSparkles className="w-3 h-3" />
                  AI Enhance
                </button>
              )}
              {previousValue !== null && !aiLoading && (
                <button
                  onClick={handleUndoAi}
                  className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  title="Revert to the text before AI enhancement"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo AI
                </button>
              )}
            </>
          )}
        </div>
      )}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          rows={rows}
          placeholder={placeholder}
          className={`w-full border border-slate-300 rounded-md p-3 leading-relaxed font-serif resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${isHeader ? 'text-center text-lg font-bold' : 'text-sm'}`}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className={`leading-relaxed font-serif text-slate-800 whitespace-pre-wrap cursor-text hover:bg-slate-50 rounded-md p-2 -m-2 min-h-[2rem] ${isHeader ? 'text-center text-lg font-bold' : 'text-sm'} ${aiLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {aiLoading ? (
            <span className="flex items-center gap-2 text-purple-600 italic">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is enhancing this section…
            </span>
          ) : (
            value || <span className="text-slate-400 italic">{placeholder || 'Click to edit...'}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// EditableCell — inline-editable table cell for score overrides
// ============================================================

function EditableCell({
  value, overrideKey, overrides, setOverrides, className = '',
}: {
  value: string | number | null;
  overrideKey: string;
  overrides: Record<string, string>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasOverride = overrideKey in overrides;
  const displayValue = hasOverride ? overrides[overrideKey] : (value ?? '—');

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <td className={`border border-slate-400 px-1 py-1 text-center ${className}`}>
        <input
          ref={inputRef}
          type="text"
          defaultValue={String(displayValue)}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v === '' || v === String(value ?? '—')) {
              // Remove override if matches original
              setOverrides(prev => { const next = { ...prev }; delete next[overrideKey]; return next; });
            } else {
              setOverrides(prev => ({ ...prev, [overrideKey]: v }));
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-full text-center text-xs border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </td>
    );
  }

  return (
    <td
      className={`border border-slate-400 px-3 py-2 text-center cursor-pointer group/cell relative hover:bg-blue-50 ${hasOverride ? 'bg-amber-50 font-semibold' : ''} ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {String(displayValue)}
      {hasOverride && (
        <button
          onClick={(e) => { e.stopPropagation(); setOverrides(prev => { const next = { ...prev }; delete next[overrideKey]; return next; }); }}
          className="absolute top-0 right-0 p-0.5 text-amber-500 hover:text-red-500 opacity-0 group-hover/cell:opacity-100 print:hidden"
          title="Reset to auto-calculated value"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
      <Pencil className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 text-slate-300 opacity-0 group-hover/cell:opacity-100 print:hidden" />
    </td>
  );
}

// ============================================================
// SectionHeader
// ============================================================

function SectionHeader({ title, sectionKey, collapsed, toggle, number }: {
  title: string; sectionKey: string; collapsed: Record<string, boolean>; toggle: (key: string) => void; number?: string;
}) {
  const isCollapsed = collapsed[sectionKey];
  return (
    <button
      onClick={() => toggle(sectionKey)}
      className="w-full flex items-center justify-between py-2 border-b-2 border-slate-700 mb-3 group print:border-b print:border-slate-400"
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
        {number && <span className="mr-1">{number}.</span>}{title}
      </h2>
      <span className="text-slate-400 group-hover:text-slate-600 print:hidden">
        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </span>
    </button>
  );
}

// ============================================================
// Domain Narrative Generation
// ============================================================

interface DomainNarrative {
  domainName: string;
  ageEquivalent: string;
  rawScore: number;
  scaledScore: number | null;
  demonstratedItems: string[];
  notDemonstratedItems: string[];
  emergingItems: string[];
  allNotDemonstrated: string[];
}

function generateBayleyNarrative(domain: UnifiedDomain, scores: Record<number, number | null>, ageInDays: number | null, childName: string): DomainNarrative {
  const rawScore = Object.values(scores).reduce((sum: number, s) => sum + (s || 0), 0);
  const key = bayleyDomainKey[domain.localId];
  let scaledScore: number | null = null;
  let ageEq = 'N/A';

  if (key && ageInDays !== null) {
    scaledScore = lookupScaledScore(rawScore, key, ageInDays);
    const ae = lookupAgeEquivalent(rawScore, key);
    if (ae) ageEq = `${ae.months} months`;
  }

  const demonstrated: string[] = [];
  const notDemonstrated: string[] = [];
  const emerging: string[] = [];
  const sortedItems = [...domain.items].sort((a, b) => a.number - b.number);

  for (const item of sortedItems) {
    const score = scores[item.number];
    if (score === null || score === undefined) continue;
    // Use score-specific criteria description if available, otherwise fall back to item description
    const criteriaDesc = item.scoringCriteria?.find(c => c.score === score)?.description;
    const label = criteriaDesc ? `${item.description}: ${criteriaDesc}` : item.description;
    if (score === 2) demonstrated.push(label);
    else if (score === 0) notDemonstrated.push(label);
    else if (score === 1) emerging.push(label);
  }

  return {
    domainName: domain.name,
    ageEquivalent: ageEq,
    rawScore,
    scaledScore,
    demonstratedItems: demonstrated.slice(-5),
    notDemonstratedItems: notDemonstrated.slice(0, 5),
    emergingItems: emerging.slice(-3),
    allNotDemonstrated: notDemonstrated,
  };
}

function generateBinaryNarrative(domain: UnifiedDomain, scores: Record<number, number | null>, childName: string): DomainNarrative {
  const rawScore = Object.values(scores).reduce((sum: number, s) => sum + (s || 0), 0);
  const demonstrated: string[] = [];
  const notDemonstrated: string[] = [];
  const sortedItems = [...domain.items].sort((a, b) => a.number - b.number);

  for (const item of sortedItems) {
    const score = scores[item.number];
    if (score === null || score === undefined) continue;
    // Use score-specific criteria description if available, otherwise fall back to item description
    const criteriaDesc = item.scoringCriteria?.find(c => c.score === score)?.description;
    const label = criteriaDesc ? `${item.description}: ${criteriaDesc}` : item.description;
    if (score === 1) demonstrated.push(label);
    else if (score === 0) notDemonstrated.push(label);
  }

  return {
    domainName: domain.name,
    ageEquivalent: 'N/A',
    rawScore,
    scaledScore: null,
    demonstratedItems: demonstrated.slice(-5),
    notDemonstratedItems: notDemonstrated.slice(0, 5),
    emergingItems: [],
    allNotDemonstrated: notDemonstrated,
  };
}

function generateNarrativeText(narrative: DomainNarrative, firstName: string, gender: string, formId: string): string {
  const sub = Pronoun(gender, 'subject');
  let text = '';
  if (narrative.demonstratedItems.length > 0) {
    text += `${firstName} demonstrated the following skills: ${narrative.demonstratedItems.join('; ')}.`;
  }
  if (narrative.emergingItems.length > 0) {
    text += `\n\n${sub} showed emerging ability in: ${narrative.emergingItems.join('; ')}.`;
  }
  if (narrative.notDemonstratedItems.length > 0) {
    text += `\n\n${firstName} did not demonstrate the following: ${narrative.notDemonstratedItems.join('; ')}.`;
  }
  if (!text) text = 'No items were scored for this domain.';
  return text;
}

// ============================================================
// SP2 Scoring Helpers
// ============================================================

interface SP2QuadrantScore {
  name: string;
  key: string;
  rawScore: number;
  maxScore: number;
  description: string;
}

interface SP2SectionScore {
  name: string;
  key: string;
  rawScore: number;
  maxScore: number;
  description: string;
}

const QUADRANT_LABELS: Record<string, string> = {
  seeking: 'Seeking/Seeker',
  avoiding: 'Avoiding/Avoider',
  sensitivity: 'Sensitivity/Sensor',
  registration: 'Registration/Bystander',
};

const QUADRANT_DEFINITIONS: Record<string, string> = {
  seeking: 'The degree to which a child obtains sensory input. A child with a Much More Than Others score in this pattern seeks sensory input at a higher rate than others.',
  avoiding: 'The degree to which a child is bothered by sensory input. A child with a Much More Than Others score in this pattern moves away from sensory input at a higher rate than others.',
  sensitivity: 'The degree to which a child detects sensory input. A child with a Much More Than Others score in this pattern notices sensory input at a higher rate than others.',
  registration: 'The degree to which a child misses sensory input. A child with low registration often tends to appear uninterested, may have flat/dull affect, and may require repeated prompting/cueing to adequately respond.',
};

const SECTION_LABELS: Record<string, string> = {
  general: 'General',
  auditory: 'Auditory Processing',
  visual: 'Visual Processing',
  touch: 'Touch Processing',
  movement: 'Movement Processing',
  oral: 'Oral-Sensory Processing',
  oralsensory: 'Oral-Sensory Processing',
  behavioral: 'Behavioral Responses',
};

function computeSP2Scores(
  formStates: Record<string, any>,
  formSelections: { formId: string; selectedDomainIds: string[] }[],
): { quadrants: SP2QuadrantScore[]; sections: SP2SectionScore[] } {
  const fs = formSelections.find(f => f.formId === 'sp2');
  if (!fs) return { quadrants: [], sections: [] };
  const formState = formStates['sp2'];
  if (!formState) return { quadrants: [], sections: [] };
  const form = getFormById('sp2');
  if (!form) return { quadrants: [], sections: [] };

  // Determine which SP2 version is in use based on selected domains
  const selectedDomainId = fs.selectedDomainIds[0] || 'english';
  const isBirth6mo = selectedDomainId === 'birth6mo';
  const cutoffsData = isBirth6mo ? SP2_BIRTH6MO_CUTOFFS : SP2_ENGLISH_CUTOFFS;

  // Get all scores from the selected domain
  const ds = formState.domains[selectedDomainId];
  if (!ds) return { quadrants: [], sections: [] };

  const domain = form.domains.find(d => d.localId === selectedDomainId);
  if (!domain) return { quadrants: [], sections: [] };

  // Compute quadrant scores by mapping each item's quadrant tag
  const quadrantTotals: Record<string, number> = { seeking: 0, avoiding: 0, sensitivity: 0, registration: 0 };

  for (const item of domain.items) {
    const score = ds.scores[item.number];
    if (score === null || score === undefined) continue;
    const quadrantAbbr = item.quadrant || '';
    const quadrantKey = SP2_QUADRANT_MAP[quadrantAbbr] || SP2_QUADRANT_MAP[quadrantAbbr.replace(/\./g, '')] || '';
    if (quadrantKey && quadrantKey !== 'none' && quadrantTotals[quadrantKey] !== undefined) {
      quadrantTotals[quadrantKey] += score;
    }
  }

  // Compute section scores by item number ranges
  // Birth-6mo: 25 items total, English/Spanish: 54 items total
  // Note: Birth-6mo uses 'oralsensory' key in cutoffs, English uses 'oral'
  const sectionRanges: Record<string, [number, number]> = isBirth6mo
    ? { general: [1, 10], auditory: [11, 16], visual: [17, 19], touch: [20, 21], movement: [22, 23], oralsensory: [24, 25] }
    : { general: [1, 10], auditory: [11, 17], visual: [18, 23], touch: [26, 31], movement: [36, 40], oral: [42, 48], behavioral: [49, 54] };

  const quadrants: SP2QuadrantScore[] = [];
  const qCutoffs = (cutoffsData as any).quadrants || {};
  for (const [key, label] of Object.entries(QUADRANT_LABELS)) {
    const cutoff = qCutoffs[key];
    const raw = quadrantTotals[key] || 0;
    const maxScore = cutoff?.maxScore || 0;
    const desc = cutoff ? getSP2Description(raw, cutoff.cutoffs) : '—';
    quadrants.push({ name: label, key, rawScore: raw, maxScore, description: desc });
  }

  const sections: SP2SectionScore[] = [];
  // For Birth-6mo, cutoffs are flat (no .sections wrapper); for English they're under .sections
  const sCutoffs = isBirth6mo ? (cutoffsData as any) : (cutoffsData as any).sections || {};
  // Iterate over the section ranges (which are version-specific) rather than fixed SECTION_LABELS
  for (const [key, range] of Object.entries(sectionRanges)) {
    const label = SECTION_LABELS[key] || key;
    let raw = 0;
    for (let n = (range as [number, number])[0]; n <= (range as [number, number])[1]; n++) {
      const score = ds.scores[n];
      if (score !== null && score !== undefined) raw += score;
    }
    const cutoff = sCutoffs[key];
    const maxScore = cutoff?.maxScore || 0;
    const desc = cutoff ? getSP2Description(raw, cutoff.cutoffs) : '—';
    sections.push({ name: label, key, rawScore: raw, maxScore, description: desc });
  }

  return { quadrants, sections };
}

// ============================================================
// Main Component
// ============================================================

export default function ClinicalReportEditor() {
  const { state, dispatch } = useMultiAssessment();
  const { childInfo, examinerInfo, formSelections, formStates } = state;
  const childName = `${childInfo.firstName} ${childInfo.lastName}`.trim() || 'Child';
  const firstName = childInfo.firstName || 'Child';
  const gender = childInfo.gender || '';
  const premWeeks = childInfo.premature ? childInfo.weeksPremature : 0;

  const ageInDays = useMemo(() => calculateAgeInDays(childInfo.dob, childInfo.testDate, premWeeks), [childInfo.dob, childInfo.testDate, premWeeks]);
  const chronAge = useMemo(() => formatAgeDisplay(childInfo.dob, childInfo.testDate), [childInfo]);
  const adjAge = useMemo(() => {
    if (!childInfo.premature || !childInfo.weeksPremature) return null;
    const birth = parseLocalDate(childInfo.dob);
    const adjusted = new Date(birth.getTime() + childInfo.weeksPremature * 7 * 86400000);
    const adjY = adjusted.getFullYear();
    const adjM = String(adjusted.getMonth() + 1).padStart(2, '0');
    const adjD = String(adjusted.getDate()).padStart(2, '0');
    return formatAgeDisplay(`${adjY}-${adjM}-${adjD}`, childInfo.testDate);
  }, [childInfo]);

  // ============================================================
  // Load saved report
  // ============================================================
  const childKey = useMemo(() => getChildKey(childInfo), [childInfo]);

  const loadSavedReport = useCallback((): SavedReportState | null => {
    try {
      const raw = localStorage.getItem(REPORT_STORAGE_KEY);
      if (!raw) return null;
      const saved: SavedReportState = JSON.parse(raw);
      if (saved.childKey === childKey) return saved;
      return null;
    } catch { return null; }
  }, [childKey]);

  const savedReport = useMemo(() => loadSavedReport(), [loadSavedReport]);

  // ============================================================
  // Template selector state
  // ============================================================
  const hasSP2 = formSelections.some(f => f.formId === 'sp2');
  const appSettings = useMemo(() => loadAppSettings(), []);
  const [template, setTemplate] = useState<ReportTemplate>(() => {
    if (savedReport?.template) return savedReport.template;
    // Use settings default if not 'auto'
    if (appSettings.defaultReportTemplate && appSettings.defaultReportTemplate !== 'auto') {
      return appSettings.defaultReportTemplate;
    }
    // Auto-detect
    return hasSP2 ? 'sensory' : 'developmental';
  });
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRecTemplatePicker, setShowRecTemplatePicker] = useState(false);

  // Insert a recommendation template into the recommendations field
  const insertRecTemplate = useCallback((tpl: RecommendationTemplate) => {
    const text = tpl.text.replace(/\{child\}/g, firstName);
    setRecommendations(prev => {
      if (!prev.trim()) return text;
      return prev.trimEnd() + '\n\n' + text;
    });
    setShowRecTemplatePicker(false);
    toast.success(`Inserted "${tpl.title}"`);
  }, [firstName]);

  // ============================================================
  // Editable report sections — shared
  // ============================================================
  const [referralInfo, setReferralInfo] = useState(() =>
    savedReport?.referralInfo ??
    `${childName} was referred to the regional center due to concerns regarding ${pronoun(gender, 'possessive')} overall development. A developmental assessment is being completed to obtain present levels of performance and to determine eligibility for early intervention services.`
  );
  const [medicalHistory, setMedicalHistory] = useState(() => savedReport?.medicalHistory ?? '');
  const [parentConcerns, setParentConcerns] = useState(() => savedReport?.parentConcerns ?? '');
  const [clinicalObservation, setClinicalObservation] = useState(() => savedReport?.clinicalObservation ?? '');
  const [feedingOralMotor, setFeedingOralMotor] = useState(() => savedReport?.feedingOralMotor ?? '');
  const [sensoryNarrative, setSensoryNarrative] = useState(() => {
    if (savedReport?.sensoryNarrative) return savedReport.sensoryNarrative;
    return `Auditory System: Appears to be within functional limits. ${childName} responded to auditory stimulus by turning ${pronoun(gender, 'possessive')} head toward sound.\n\nVisual System: Appears to be within functional limits. ${childName} demonstrated fair eye contact with the evaluator.\n\nTactile System: Appears to be within functional limits. ${childName} is able to tolerate a wide variety of textures at this time.\n\nProprioceptive System: Appears to be within functional limits. ${childName} demonstrates good motor planning skills.\n\nVestibular System: Appears to be within functional limits. ${childName} demonstrated good righting reactions during play.`;
  });
  const [recommendations, setRecommendations] = useState(() => savedReport?.recommendations ?? '');
  const [closingNote, setClosingNote] = useState(() =>
    savedReport?.closingNote ??
    `Thank you for this referral. It was a pleasure to work with ${childName} and ${pronoun(gender, 'possessive')} family. Please feel free to contact me with any additional questions and/or concerns.`
  );
  const [practiceName, setPracticeName] = useState(() => savedReport?.practiceName ?? (appSettings.practiceName || examinerInfo.agency || 'Practice Name'));
  const [reportTitle, setReportTitle] = useState(() => savedReport?.reportTitle ?? TEMPLATE_INFO[template].title);
  const [domainOverrides, setDomainOverrides] = useState<Record<string, string>>(() => savedReport?.domainOverrides ?? {});
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, string>>(() => savedReport?.scoreOverrides ?? {});
  const [uciNumber, setUciNumber] = useState(() => savedReport?.uciNumber ?? '');
  const [regionalCenter, setRegionalCenter] = useState(() => savedReport?.regionalCenter ?? '');

  // SI-specific editable sections
  const [testingConditions, setTestingConditions] = useState(() =>
    savedReport?.testingConditions ??
    `The assessment was completed in-home with ${childName} and ${pronoun(gender, 'possessive')} caregiver present. ${childName} made good eye contact with evaluating therapist during the evaluation. ${Pronoun(gender, 'subject')} responded to ${pronoun(gender, 'possessive')} name, followed simple directions, and engaged with assessment tools.`
  );
  const [validityStatement, setValidityStatement] = useState(() =>
    savedReport?.validityStatement ??
    `Behavior and performance observed during the assessment is reported to be typical. Therefore, this assessment is believed to be valid and reliable in regard to present level of function.`
  );
  const [quadrantNarratives, setQuadrantNarratives] = useState<Record<string, string>>(() => savedReport?.quadrantNarratives ?? {});
  const [sectionNarratives, setSectionNarratives] = useState<Record<string, string>>(() => savedReport?.sectionNarratives ?? {});
  const [siSummary, setSiSummary] = useState(() => savedReport?.siSummary ?? '');

  // Feeding-specific editable sections
  const [feedingTestingConditions, setFeedingTestingConditions] = useState(() =>
    savedReport?.feedingTestingConditions ?? ''
  );
  const [feedingOralStructures, setFeedingOralStructures] = useState(() =>
    savedReport?.feedingOralStructures ??
    `${childName}'s facial structures are symmetrical. ${Pronoun(gender, 'possessive')} oral structures appear to be healthy and grossly intact as observed while ${pronoun(gender, 'subject')} was engaging in feeding.`
  );
  const [feedingBehaviors, setFeedingBehaviors] = useState(() => savedReport?.feedingBehaviors ?? '');
  const [feedingOralMotorCoord, setFeedingOralMotorCoord] = useState(() => savedReport?.feedingOralMotorCoord ?? '');
  const [feedingFoodRepertoire, setFeedingFoodRepertoire] = useState(() => savedReport?.feedingFoodRepertoire ?? '');
  const [feedingSelfFeeding, setFeedingSelfFeeding] = useState(() => savedReport?.feedingSelfFeeding ?? '');
  const [feedingPreviousHistory, setFeedingPreviousHistory] = useState(() => savedReport?.feedingPreviousHistory ?? '');
  const [feedingDrinking, setFeedingDrinking] = useState(() => savedReport?.feedingDrinking ?? '');
  const [feedingVestibular, setFeedingVestibular] = useState(() =>
    savedReport?.feedingVestibular ??
    `The vestibular system is located in the inner ear and has the primary function of giving the brain information about head position and movement in relation to gravity. Information received from this sensory system interacts with other sensory systems to give children their perception of space and position as well as orientation within that space. It is responsible in part for head stability, muscle tone, postural control, balance and equilibrium reaction and the development of eye-hand coordination and bilateral integration. It also has influence over arousal level, which affects the ability to learn and initiate tasks.\n\n${childName} demonstrated overall adequate trunk control when navigating ${pronoun(gender, 'possessive')} environment.`
  );
  const [feedingProprioceptive, setFeedingProprioceptive] = useState(() =>
    savedReport?.feedingProprioceptive ??
    `The proprioceptive system is a system of receptors found in the joints and muscle tissues that gives an internal awareness of limb and body position, position relative to the environment, information about joint and muscle movement, as well as the force and speed at which the muscles are moving.\n\n${childName} demonstrates adequate proprioceptive processing at this time.`
  );
  const [feedingTactile, setFeedingTactile] = useState(() =>
    savedReport?.feedingTactile ??
    `The sense of touch. The tactile system is involved with the identification and localization of touch and the discrimination of shapes, sizes, and textures of materials.\n\n${childName} appears to tolerate a variety of textures at this time.`
  );
  const [feedingROM, setFeedingROM] = useState(() => savedReport?.feedingROM ?? 'Within Functional Limits');
  const [feedingMuscleStrength, setFeedingMuscleStrength] = useState(() => savedReport?.feedingMuscleStrength ?? 'Within Functional Limits');
  const [feedingMuscleTone, setFeedingMuscleTone] = useState(() => savedReport?.feedingMuscleTone ?? 'Within Functional Limits');
  const [feedingPosturalStability, setFeedingPosturalStability] = useState(() => savedReport?.feedingPosturalStability ?? 'Within Functional Limits');
  const [feedingSummary, setFeedingSummary] = useState(() => savedReport?.feedingSummary ?? '');

  // Save state
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(savedReport?.savedAt ?? null);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveReport = useCallback(() => {
    const reportState: SavedReportState = {
      template, referralInfo, medicalHistory, parentConcerns, clinicalObservation,
      feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName,
      reportTitle, domainOverrides, scoreOverrides, uciNumber, regionalCenter,
      testingConditions, validityStatement,
      quadrantNarratives, sectionNarratives, siSummary, childKey,
      feedingTestingConditions, feedingOralStructures, feedingBehaviors, feedingOralMotorCoord,
      feedingFoodRepertoire, feedingSelfFeeding, feedingPreviousHistory, feedingDrinking,
      feedingVestibular, feedingProprioceptive, feedingTactile, feedingROM,
      feedingMuscleStrength, feedingMuscleTone, feedingPosturalStability, feedingSummary,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportState));
      setLastSavedAt(reportState.savedAt);
      setIsDirty(false);
    } catch { /* localStorage full */ }
  }, [template, referralInfo, medicalHistory, parentConcerns, clinicalObservation, feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName, reportTitle, domainOverrides, scoreOverrides, uciNumber, regionalCenter, testingConditions, validityStatement, quadrantNarratives, sectionNarratives, siSummary, childKey, feedingTestingConditions, feedingOralStructures, feedingBehaviors, feedingOralMotorCoord, feedingFoodRepertoire, feedingSelfFeeding, feedingPreviousHistory, feedingDrinking, feedingVestibular, feedingProprioceptive, feedingTactile, feedingROM, feedingMuscleStrength, feedingMuscleTone, feedingPosturalStability, feedingSummary]);

  useEffect(() => { setIsDirty(true); }, [template, referralInfo, medicalHistory, parentConcerns, clinicalObservation, feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName, reportTitle, domainOverrides, scoreOverrides, uciNumber, regionalCenter, testingConditions, validityStatement, quadrantNarratives, sectionNarratives, siSummary, feedingTestingConditions, feedingOralStructures, feedingBehaviors, feedingOralMotorCoord, feedingFoodRepertoire, feedingSelfFeeding, feedingPreviousHistory, feedingDrinking, feedingVestibular, feedingProprioceptive, feedingTactile, feedingROM, feedingMuscleStrength, feedingMuscleTone, feedingPosturalStability, feedingSummary]);

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveReport(), 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [isDirty, saveReport]);

  // Not Demonstrated toggle
  const [showNotDemonstrated, setShowNotDemonstrated] = useState<Record<string, boolean>>({});
  const toggleNotDemonstrated = (key: string) => setShowNotDemonstrated(prev => ({ ...prev, [key]: !prev[key] }));

  // Report-level DAYC-2 scoring method override (allows switching in report view)
  const [reportScoringOverride, setReportScoringOverride] = useState<'native' | 'bayley4ab' | null>(null);
  // Show comparison mode (both scoring methods side by side)
  const [showScoringComparison, setShowScoringComparison] = useState(false);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ============================================================
  // Scoring Data
  // ============================================================

  interface BayleyScoreRow { domain: string; domainLocalId: string; rawScore: number; scaledScore: number | null; ageEquivalent: string; gsv: number | null; percentDelay: string; }
  interface Dayc2ScoreRow { domain: string; rawScore: number; standardScore: string; descriptiveTerm: string; ageEquivalent: string; percentDelay: string; scoringMethod?: 'native' | 'bayley4ab'; classification?: string; }
  interface Reel3ScoreRow { domain: string; rawScore: number; ageEquivalent: string; percentDelay: string; abilityScore: number | null; percentileRank: string; descriptiveTerm: string; }

  const bayleyScores = useMemo((): BayleyScoreRow[] => {
    const fs = formSelections.find(f => f.formId === 'bayley4');
    if (!fs) return [];
    const formState = formStates['bayley4'];
    if (!formState) return [];
    const form = getFormById('bayley4');
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);

    return fs.selectedDomainIds.map(domainLocalId => {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) return null;
      const ds = formState.domains[domainLocalId];
      if (!ds) return null;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);
      const key = bayleyDomainKey[domainLocalId];
      let scaledScore: number | null = null;
      let ageEq = 'N/A';
      let gsv: number | null = null;

      if (key && ageInDays !== null) {
        scaledScore = lookupScaledScore(rawScore, key, ageInDays);
        const ae = lookupAgeEquivalent(rawScore, key);
        if (ae) ageEq = `${ae.months} months`;
        gsv = lookupGrowthScaleValue(rawScore, key);
      }

      // % delay using Excel formula: ((aeMonths*30 + aeDays) / (childMonths*30 + childDays)) - 1
      let pctDelay = '—';
      if (key && ageInDays !== null && ageInDays > 0) {
        const ae2 = lookupAgeEquivalent(rawScore, key);
        if (ae2 && ae2.months !== null && typeof ae2.months === 'number') {
          const aeTotalDays = ae2.months * 30 + (ae2.days || 0);
          const childMo = Math.floor(ageInDays / 30.44);
          const childDaysRem = Math.round(ageInDays - childMo * 30.44);
          const childTotalDays = childMo * 30 + childDaysRem;
          if (childTotalDays > 0) {
            const delayRatio = (aeTotalDays / childTotalDays) - 1;
            if (delayRatio < 0) {
              pctDelay = `${Math.round(Math.abs(delayRatio) * 100)}%`;
            } else {
              pctDelay = '0%';
            }
          }
        }
      }

      return { domain: domain.name, domainLocalId, rawScore, scaledScore, ageEquivalent: ageEq, gsv, percentDelay: pctDelay };
    }).filter(Boolean) as BayleyScoreRow[];
  }, [formSelections, formStates, ageInDays, childInfo, premWeeks]);

  const bayleyMotorComposite = useMemo(() => {
    const fmRow = bayleyScores.find(r => r.domainLocalId === 'fineMotor');
    const gmRow = bayleyScores.find(r => r.domainLocalId === 'grossMotor');
    if (!fmRow || !gmRow || fmRow.scaledScore === null || gmRow.scaledScore === null) return null;
    const sumScaled = fmRow.scaledScore + gmRow.scaledScore;
    const result = lookupStandardScore(sumScaled, 'MOT');
    if (!result) return null;
    return { sumScaled, standardScore: result.standardScore, percentile: result.percentileRank };
  }, [bayleyScores]);

  const bayleyCogComposite = useMemo(() => {
    const cgRow = bayleyScores.find(r => r.domainLocalId === 'cognitive');
    if (!cgRow || cgRow.scaledScore === null) return null;
    const result = lookupStandardScore(cgRow.scaledScore, 'COG');
    if (!result) return null;
    return { scaledScore: cgRow.scaledScore, standardScore: result.standardScore, percentile: result.percentileRank };
  }, [bayleyScores]);

  const reel3Scores = useMemo((): Reel3ScoreRow[] => {
    const fs = formSelections.find(f => f.formId === 'reel3');
    if (!fs) return [];
    const formState = formStates['reel3'];
    if (!formState) return [];
    const form = getFormById('reel3');
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);

    return fs.selectedDomainIds.map(domainLocalId => {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) return null;
      const ds = formState.domains[domainLocalId];
      if (!ds) return null;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);
      const aeEntry = REEL3_AGE_EQUIVALENT.find(e => {
        const key = domainLocalId === 'receptive' ? 'receptive' : 'expressive';
        return (e as any)[key] === rawScore;
      });
      const aeMonths = aeEntry ? (aeEntry as any).ageMonths : null;
      const ageEq = aeMonths !== null ? `${aeMonths} months` : 'N/A';
      // % delay using Excel formula: ((aeMonths*30) / (childMonths*30 + childDays)) - 1
      let pctDelay = '';
      if (ageInDays !== null && ageInDays > 0 && aeMonths !== null) {
        const childMo = Math.floor(ageInDays / 30.44);
        const childDaysRem = Math.round(ageInDays - childMo * 30.44);
        const childTotalDays = childMo * 30 + childDaysRem;
        const aeTotalDays = aeMonths * 30;
        if (childTotalDays > 0) {
          const delayRatio = (aeTotalDays / childTotalDays) - 1;
          if (delayRatio < 0) {
            pctDelay = `${Math.round(Math.abs(delayRatio) * 100)}%`;
          } else {
            pctDelay = '0%';
          }
        }
      }

      // Ability score lookup
      const scoringKey = domainLocalId === 'receptive' ? 'receptive' as const : 'expressive' as const;
      const abilityScore = lookupREEL3AbilityScore(rawScore, ageMonthsVal, scoringKey);
      const percentileRank = abilityScore !== null ? (lookupREEL3PercentileRank(abilityScore) ?? '—') : '—';
      const descriptiveTerm = abilityScore !== null ? lookupREEL3DescriptiveTerm(abilityScore) : '—';

      return { domain: domain.name, rawScore, ageEquivalent: ageEq, percentDelay: pctDelay, abilityScore, percentileRank, descriptiveTerm };
    }).filter(Boolean) as Reel3ScoreRow[];
  }, [formSelections, formStates, childInfo, premWeeks]);

  const dayc2OriginalScoringMethod = useMemo(() => {
    const fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    return fs?.scoringMethod || 'native';
  }, [formSelections]);

  // Effective scoring method: report override takes precedence
  const dayc2ScoringMethod = reportScoringOverride ?? dayc2OriginalScoringMethod;

  const dayc2Scores = useMemo((): Dayc2ScoreRow[] => {
    const fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    if (!fs) return [];
    const formState = formStates[fs.formId];
    if (!formState) return [];
    const form = getFormById(fs.formId);
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
    const useBayley4AB = dayc2ScoringMethod === 'bayley4ab';

    // Map domain localIds to DAYC-2 scoring table domain keys
    const domainKeyMap: Record<string, 'social' | 'adaptive' | 'receptive' | 'expressive'> = {
      'socialemotional': 'social',
      'adaptivebahavior': 'adaptive',
      'receptivecomm': 'receptive',
      'expressivecomm': 'expressive',
    };

    return fs.selectedDomainIds.map(domainLocalId => {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) return null;
      const ds = formState.domains[domainLocalId];
      if (!ds) return null;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);
      const scoringKey = domainKeyMap[domainLocalId];

      let standardScore = '\u2014';
      let descriptiveTerm = '\u2014';
      let percentDelay = '\u2014';
      let ageEquivalent = '\u2014';

      if (useBayley4AB) {
        // Bayley-4 Adaptive Behavior scoring
        const result = lookupDAYC2WithBayley4AB(rawScore, ageMonthsVal, domainLocalId);
        if (result.scaledScore !== null) {
          standardScore = String(result.scaledScore);
          descriptiveTerm = result.label;
        } else {
          descriptiveTerm = result.label + ' (no match)';
        }
        // Still use DAYC-2 age equivalents for reference
        if (scoringKey) {
          const aeMonths = lookupDAYC2AgeEquivalent(rawScore, scoringKey);
          if (aeMonths !== null) {
            ageEquivalent = `${aeMonths} months`;
            // Use Excel formula: ((aeMonths*30) / (childMonths*30 + childDays)) - 1
            if (ageInDays !== null && ageInDays > 0) {
              const childMo = Math.floor(ageInDays / 30.44);
              const childDaysRem = Math.round(ageInDays - childMo * 30.44);
              const childTotalDays = childMo * 30 + childDaysRem;
              const aeTotalDays = aeMonths * 30;
              if (childTotalDays > 0) {
                const delayRatio = (aeTotalDays / childTotalDays) - 1;
                if (delayRatio < 0) {
                  percentDelay = `${Math.round(Math.abs(delayRatio) * 100)}%`;
                } else {
                  percentDelay = '0%';
                }
              }
            }
          }
        }
      } else {
        // Native DAYC-2 scoring
        if (scoringKey) {
          const stdScore = lookupDAYC2StandardScore(rawScore, ageMonthsVal, scoringKey);
          if (stdScore !== null) {
            standardScore = String(stdScore);
            descriptiveTerm = lookupDAYC2DescriptiveTerm(stdScore);
            const pctRank = lookupDAYC2PercentileRank(stdScore);
            if (pctRank) descriptiveTerm += ` (PR: ${pctRank})`;
          }
        }
        if (scoringKey) {
          const aeMonths = lookupDAYC2AgeEquivalent(rawScore, scoringKey);
          if (aeMonths !== null) {
            ageEquivalent = `${aeMonths} months`;
            // Use Excel formula: ((aeMonths*30) / (childMonths*30 + childDays)) - 1
            if (ageInDays !== null && ageInDays > 0) {
              const childMo2 = Math.floor(ageInDays / 30.44);
              const childDaysRem2 = Math.round(ageInDays - childMo2 * 30.44);
              const childTotalDays2 = childMo2 * 30 + childDaysRem2;
              const aeTotalDays2 = aeMonths * 30;
              if (childTotalDays2 > 0) {
                const delayRatio2 = (aeTotalDays2 / childTotalDays2) - 1;
                if (delayRatio2 < 0) {
                  percentDelay = `${Math.round(Math.abs(delayRatio2) * 100)}%`;
                } else {
                  percentDelay = '0%';
                }
              }
            }
          }
        }
      }

      // Add classification label
      let classification: string | undefined;
      if (useBayley4AB && standardScore !== '\u2014') {
        classification = getScaledScoreClassification(parseInt(standardScore));
      }

      return { domain: domain.name, rawScore, standardScore, descriptiveTerm, ageEquivalent, percentDelay, scoringMethod: useBayley4AB ? 'bayley4ab' : 'native', classification };
    }).filter(Boolean) as Dayc2ScoreRow[];
  }, [formSelections, formStates, childInfo, premWeeks, dayc2ScoringMethod]);

  // Bayley-4 AB Composite scores (when using Bayley-4 AB scoring for DAYC-2)
  const dayc2BayleyComposites = useMemo((): CompositeResult[] => {
    if (dayc2ScoringMethod !== 'bayley4ab') return [];
    const fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    if (!fs) return [];
    const formState = formStates[fs.formId];
    if (!formState) return [];
    const form = getFormById(fs.formId);
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);

    // Compute scaled scores for each domain
    const domainScaledScores: Record<string, number | null> = {};
    for (const domainLocalId of fs.selectedDomainIds) {
      const ds = formState.domains[domainLocalId];
      if (!ds) continue;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);
      const result = lookupDAYC2WithBayley4AB(rawScore, ageMonthsVal, domainLocalId);
      domainScaledScores[domainLocalId] = result.scaledScore;
    }

    return computeDAYC2BayleyComposites(domainScaledScores);
  }, [dayc2ScoringMethod, formSelections, formStates, childInfo, premWeeks]);

  // Comparison scores: compute the alternate scoring method for side-by-side display
  const dayc2ComparisonScores = useMemo((): Dayc2ScoreRow[] => {
    if (!showScoringComparison) return [];
    const fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    if (!fs) return [];
    const formState = formStates[fs.formId];
    if (!formState) return [];
    const form = getFormById(fs.formId);
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
    const alternateMethod = dayc2ScoringMethod === 'bayley4ab' ? 'native' : 'bayley4ab';
    const useAltBayley4AB = alternateMethod === 'bayley4ab';

    const domainKeyMap: Record<string, 'social' | 'adaptive' | 'receptive' | 'expressive'> = {
      'socialemotional': 'social',
      'adaptivebahavior': 'adaptive',
      'receptivecomm': 'receptive',
      'expressivecomm': 'expressive',
    };

    return fs.selectedDomainIds.map(domainLocalId => {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) return null;
      const ds = formState.domains[domainLocalId];
      if (!ds) return null;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);
      const scoringKey = domainKeyMap[domainLocalId];

      let standardScore = '\u2014';
      let descriptiveTerm = '\u2014';
      let percentDelay = '\u2014';
      let ageEquivalent = '\u2014';

      if (useAltBayley4AB) {
        const result = lookupDAYC2WithBayley4AB(rawScore, ageMonthsVal, domainLocalId);
        if (result.scaledScore !== null) {
          standardScore = String(result.scaledScore);
          descriptiveTerm = result.label;
        } else {
          descriptiveTerm = result.label + ' (no match)';
        }
      } else {
        if (scoringKey) {
          const stdScore = lookupDAYC2StandardScore(rawScore, ageMonthsVal, scoringKey);
          if (stdScore !== null) {
            standardScore = String(stdScore);
            descriptiveTerm = lookupDAYC2DescriptiveTerm(stdScore);
            const pctRank = lookupDAYC2PercentileRank(stdScore);
            if (pctRank) descriptiveTerm += ` (PR: ${pctRank})`;
          }
        }
      }
      if (scoringKey) {
        const aeMonths = lookupDAYC2AgeEquivalent(rawScore, scoringKey);
        if (aeMonths !== null) {
          ageEquivalent = `${aeMonths} months`;
          // Use Excel formula: ((aeMonths*30) / (childMonths*30 + childDays)) - 1
          if (ageInDays !== null && ageInDays > 0) {
            const childMo3 = Math.floor(ageInDays / 30.44);
            const childDaysRem3 = Math.round(ageInDays - childMo3 * 30.44);
            const childTotalDays3 = childMo3 * 30 + childDaysRem3;
            const aeTotalDays3 = aeMonths * 30;
            if (childTotalDays3 > 0) {
              const delayRatio3 = (aeTotalDays3 / childTotalDays3) - 1;
              if (delayRatio3 < 0) {
                percentDelay = `${Math.round(Math.abs(delayRatio3) * 100)}%`;
              } else {
                percentDelay = '0%';
              }
            }
          }
        }
      }

      let classification: string | undefined;
      if (useAltBayley4AB && standardScore !== '\u2014') {
        classification = getScaledScoreClassification(parseInt(standardScore));
      }

      return { domain: domain.name, rawScore, standardScore, descriptiveTerm, ageEquivalent, percentDelay, scoringMethod: alternateMethod, classification };
    }).filter(Boolean) as Dayc2ScoreRow[];
  }, [showScoringComparison, dayc2ScoringMethod, formSelections, formStates, childInfo, premWeeks]);

  // SP2 scores
  const sp2Scores = useMemo(() => computeSP2Scores(formStates, formSelections), [formStates, formSelections]);

  // Domain narratives
  const domainNarratives = useMemo(() => {
    const narratives: { formName: string; formId: string; domainLocalId: string; narrative: DomainNarrative }[] = [];
    for (const fs of formSelections) {
      const form = getFormById(fs.formId);
      if (!form) continue;
      const formState = formStates[fs.formId];
      if (!formState) continue;
      for (const domainLocalId of fs.selectedDomainIds) {
        const domain = form.domains.find(d => d.localId === domainLocalId);
        if (!domain) continue;
        const ds = formState.domains[domainLocalId];
        if (!ds) continue;
        let narrative: DomainNarrative;
        if (fs.formId === 'bayley4') narrative = generateBayleyNarrative(domain, ds.scores, ageInDays, firstName);
        else narrative = generateBinaryNarrative(domain, ds.scores, firstName);
        narratives.push({ formName: form.shortName, formId: fs.formId, domainLocalId, narrative });
      }
    }
    return narratives;
  }, [formSelections, formStates, ageInDays, firstName]);

  // Summary of development
  const summaryOfDevelopment = useMemo(() => {
    const rows: { domain: string; ageEquivalent: string }[] = [];
    for (const row of bayleyScores) {
      const aeOverride = scoreOverrides[`bayley4_${row.domainLocalId}_ageEquivalent`];
      rows.push({ domain: row.domain, ageEquivalent: aeOverride ?? row.ageEquivalent });
    }
    for (const row of dayc2Scores) {
      const domKey = row.domain.toLowerCase().replace(/[^a-z]/g, '');
      const aeOverride = scoreOverrides[`dayc2_${domKey}_ageEquivalent`];
      rows.push({ domain: row.domain, ageEquivalent: aeOverride ?? row.ageEquivalent });
    }
    for (const row of reel3Scores) {
      const domKey = row.domain.toLowerCase().replace(/[^a-z]/g, '');
      const aeOverride = scoreOverrides[`reel3_${domKey}_ageEquivalent`];
      rows.push({ domain: row.domain, ageEquivalent: aeOverride ?? row.ageEquivalent });
    }
    return rows;
  }, [bayleyScores, dayc2Scores, reel3Scores, scoreOverrides]);

  // Auto-generate recommendations
  useEffect(() => {
    if (recommendations) return;
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
    const quarterDelay = Math.floor(ageMonthsVal * 0.75);
    const belowQuarter: string[] = [];
    const borderlineQuarter: string[] = [];

    for (const row of bayleyScores) {
      if (row.ageEquivalent === 'N/A') continue;
      const aeMonths = parseInt(row.ageEquivalent) || 0;
      if (aeMonths < quarterDelay) belowQuarter.push(row.domain.toLowerCase());
      else if (aeMonths <= quarterDelay + 2) borderlineQuarter.push(row.domain.toLowerCase());
    }
    for (const row of dayc2Scores) {
      const aeMonths = parseInt(row.ageEquivalent) || 0;
      if (aeMonths > 0 && aeMonths < quarterDelay) belowQuarter.push(row.domain.toLowerCase());
    }

    const genderWord = gender === 'male' || gender === 'm' ? 'boy' : gender === 'female' || gender === 'f' ? 'girl' : 'child';

    if (template === 'sensory') {
      // SI-specific recommendations
      let rec = `${childName} is a friendly and happy ${chronAge} old ${genderWord} who is being evaluated for services at this time.`;
      const concerning = sp2Scores.sections.filter(s => s.description.toLowerCase().includes('more'));
      if (concerning.length > 0) {
        rec += ` ${firstName} scored "${concerning[0].description.toLowerCase()}" in the ${concerning.map(s => s.name).join(', ')} section(s).`;
      }
      rec += `\n\nIt is recommended that the IFSP team consider the following, however, regional center to make the final determination of eligibility and services:\n\n1. Please consider Occupational therapy as ${pronoun(gender, 'subject')} demonstrates some concerns with sensory processing skills at this time.`;
      setRecommendations(rec);
    } else {
      let rec = `${childName} is a ${chronAge} old ${genderWord} who was referred due to concerns about ${pronoun(gender, 'possessive')} developmental milestones.`;
      if (quarterDelay > 0) rec += ` A ¼ delay would be considered ${quarterDelay} months.`;
      if (belowQuarter.length > 0) rec += ` ${firstName} is below the ¼ delay in the following areas: ${belowQuarter.join(', ')}.`;
      if (borderlineQuarter.length > 0) rec += ` ${Pronoun(gender, 'subject')} has a borderline ¼ delay in the following areas: ${borderlineQuarter.join(', ')}.`;
      rec += `\n\nIt is recommended that the IFSP team consider the following, however, regional center to make the final determination of eligibility and services.\n\n1) Please consider the recommendation of occupational therapy services to address skills related to ${belowQuarter.length > 0 ? belowQuarter.join(', ') : 'developmental'} skills.\n2) Please consider the recommendation or referral to speech and language pathology services for communication skills.\n3) Please refer to Physical therapy report for further details regarding gross motor skills.`;
      setRecommendations(rec);
    }
  }, [bayleyScores, dayc2Scores, childInfo, premWeeks, template, sp2Scores]);

  // Assessment tools list
  const assessmentTools = useMemo(() => {
    const tools: string[] = ['Clinical Observation', 'Parent/Caregiver Interview'];
    for (const fs of formSelections) {
      const form = getFormById(fs.formId);
      if (form) tools.push(form.name);
    }
    return tools;
  }, [formSelections]);

  // Feeding: Adaptive behavior items demonstrated / not demonstrated
  const feedingAdaptiveItems = useMemo(() => {
    const demonstrated: string[] = [];
    const notDemonstrated: string[] = [];

    // Try DAYC-2 adaptive domain first
    const dayc2Fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    if (dayc2Fs && dayc2Fs.selectedDomainIds.includes('adaptivebahavior')) {
      const formState = formStates[dayc2Fs.formId];
      const form = getFormById(dayc2Fs.formId);
      if (formState && form) {
        const adaptiveDomain = form.domains.find(d => d.localId === 'adaptivebahavior');
        const ds = formState.domains['adaptivebahavior'];
        if (adaptiveDomain && ds) {
          for (const item of adaptiveDomain.items) {
            const score = ds.scores[item.number];
            if (score === null || score === undefined) continue;
            const criteriaDesc = item.scoringCriteria?.find(c => c.score === score)?.description;
            const label = criteriaDesc ? `${item.description}: ${criteriaDesc}` : item.description;
            if (score === 1) demonstrated.push(label);
            else if (score === 0) notDemonstrated.push(label);
          }
        }
      }
    }

    // Try Bayley-4 adaptive domain if no DAYC-2
    if (demonstrated.length === 0 && notDemonstrated.length === 0) {
      const bayleyFs = formSelections.find(f => f.formId === 'bayley4');
      if (bayleyFs) {
        // Check for adaptive-related domains in Bayley-4
        const formState = formStates['bayley4'];
        const form = getFormById('bayley4');
        if (formState && form) {
          for (const domainId of bayleyFs.selectedDomainIds) {
            const domain = form.domains.find(d => d.localId === domainId);
            if (!domain) continue;
            // Only include adaptive-related domains
            const name = domain.name.toLowerCase();
            if (!name.includes('adaptive') && !name.includes('self-care') && !name.includes('daily')) continue;
            const ds = formState.domains[domainId];
            if (!ds) continue;
            for (const item of domain.items) {
              const score = ds.scores[item.number];
              if (score === null || score === undefined) continue;
              const criteriaDesc = item.scoringCriteria?.find(c => c.score === score)?.description;
              const label = criteriaDesc ? `${item.description}: ${criteriaDesc}` : item.description;
              if (score && score > 0) demonstrated.push(label);
              else if (score === 0) notDemonstrated.push(label);
            }
          }
        }
      }
    }

    return { demonstrated, notDemonstrated };
  }, [formSelections, formStates]);

  // Ref for PDF capture
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Print handler
  const handlePrint = useCallback(() => {
    const prev = { ...collapsedSections };
    setCollapsedSections({});
    setTimeout(() => { window.print(); setCollapsedSections(prev); }, 100);
  }, [collapsedSections]);

  // PDF Export handler
  const handlePdfExport = useCallback(async () => {
    if (!reportContentRef.current) {
      toast.error('Report content not found');
      return;
    }
    try {
      toast.info('Generating PDF...');
      const prevCollapsed = { ...collapsedSections };
      await generatePdfReport({
        filename: `${childName.replace(/\s+/g, '_')}_${TEMPLATE_INFO[template].label.replace(/\s+/g, '_')}_Report.pdf`,
        element: reportContentRef.current,
        onBeforeCapture: () => setCollapsedSections({}),
        onAfterCapture: () => setCollapsedSections(prevCollapsed),
      });
      toast.success('PDF downloaded successfully');

      // Auto-save session as completed so it appears in history/dashboard
      try {
        const { getAllMultiSessions } = await import('@/lib/multiSessionStorage');
        const existingSessions = getAllMultiSessions();
        const cName = [state.childInfo.firstName, state.childInfo.lastName].filter(Boolean).join(' ').trim();
        const recentCompleted = existingSessions.find(
          (s: any) => s.status === 'completed' && s.childName === cName && s.testDate === state.childInfo.testDate
            && (Date.now() - new Date(s.savedAt).getTime()) < 300000
        );
        if (!recentCompleted) {
          saveMultiSession(state, 'completed', `Report exported ${new Date().toLocaleDateString()}`);
        }
      } catch (saveErr) {
        console.error('Auto-save after PDF export failed:', saveErr);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    }
  }, [collapsedSections, childName, template, state]);

  const handleManualSave = useCallback(() => {
    saveReport();
    toast.success('Report saved successfully');
  }, [saveReport]);

  // Enhance All Sections handler
  const [enhancingAll, setEnhancingAll] = useState(false);
  const enhanceAllAbortRef = useRef<AbortController | null>(null);

  const handleEnhanceAll = useCallback(async () => {
    if (!isAiConfigured()) {
      toast('AI not configured', {
        description: 'Add your OpenRouter API key in Settings → AI Settings to enable AI Enhance.',
        duration: 6000,
      });
      return;
    }
    if (!isOnline()) {
      toast.error('No internet connection. AI Enhance requires an internet connection.');
      return;
    }
    if (!confirm('Enhance all report sections with AI?\n\nThis will rewrite all text sections into professional clinical narratives. You can undo individual sections afterwards.')) {
      return;
    }

    setEnhancingAll(true);
    enhanceAllAbortRef.current = new AbortController();
    const signal = enhanceAllAbortRef.current.signal;

    // Build list of sections to enhance
    type SectionItem = { label: string; value: string; setter: (v: string) => void };
    const sections: SectionItem[] = [];

    // Shared sections
    if (referralInfo?.trim().length > 10) sections.push({ label: 'Referral Information', value: referralInfo, setter: setReferralInfo });
    if (medicalHistory?.trim().length > 10) sections.push({ label: 'Medical History', value: medicalHistory, setter: setMedicalHistory });
    if (parentConcerns?.trim().length > 10) sections.push({ label: 'Parent Concerns', value: parentConcerns, setter: setParentConcerns });
    if (clinicalObservation?.trim().length > 10) sections.push({ label: 'Clinical Observation', value: clinicalObservation, setter: setClinicalObservation });
    if (feedingOralMotor?.trim().length > 10) sections.push({ label: 'Feeding/Oral Motor', value: feedingOralMotor, setter: setFeedingOralMotor });
    if (sensoryNarrative?.trim().length > 10) sections.push({ label: 'Sensory Processing', value: sensoryNarrative, setter: setSensoryNarrative });
    if (recommendations?.trim().length > 10) sections.push({ label: 'Recommendations', value: recommendations, setter: setRecommendations });
    if (closingNote?.trim().length > 10) sections.push({ label: 'Closing Note', value: closingNote, setter: setClosingNote });

    // SI-specific
    if (testingConditions?.trim().length > 10) sections.push({ label: 'Testing Conditions', value: testingConditions, setter: setTestingConditions });
    if (validityStatement?.trim().length > 10) sections.push({ label: 'Validity Statement', value: validityStatement, setter: setValidityStatement });

    // Feeding-specific
    if (feedingTestingConditions?.trim().length > 10) sections.push({ label: 'Feeding Testing Conditions', value: feedingTestingConditions, setter: setFeedingTestingConditions });
    if (feedingOralStructures?.trim().length > 10) sections.push({ label: 'Oral Structures', value: feedingOralStructures, setter: setFeedingOralStructures });
    if (feedingBehaviors?.trim().length > 10) sections.push({ label: 'Feeding Behaviors', value: feedingBehaviors, setter: setFeedingBehaviors });
    if (feedingOralMotorCoord?.trim().length > 10) sections.push({ label: 'Oral Motor Coordination', value: feedingOralMotorCoord, setter: setFeedingOralMotorCoord });
    if (feedingFoodRepertoire?.trim().length > 10) sections.push({ label: 'Food Repertoire', value: feedingFoodRepertoire, setter: setFeedingFoodRepertoire });
    if (feedingSelfFeeding?.trim().length > 10) sections.push({ label: 'Self-Feeding Skills', value: feedingSelfFeeding, setter: setFeedingSelfFeeding });
    if (feedingPreviousHistory?.trim().length > 10) sections.push({ label: 'Previous Feeding History', value: feedingPreviousHistory, setter: setFeedingPreviousHistory });
    if (feedingDrinking?.trim().length > 10) sections.push({ label: 'Drinking', value: feedingDrinking, setter: setFeedingDrinking });
    if (feedingVestibular?.trim().length > 10) sections.push({ label: 'Vestibular Processing', value: feedingVestibular, setter: setFeedingVestibular });
    if (feedingProprioceptive?.trim().length > 10) sections.push({ label: 'Proprioceptive Processing', value: feedingProprioceptive, setter: setFeedingProprioceptive });
    if (feedingTactile?.trim().length > 10) sections.push({ label: 'Tactile Processing', value: feedingTactile, setter: setFeedingTactile });
    if (feedingSummary?.trim().length > 10) sections.push({ label: 'Feeding Summary', value: feedingSummary, setter: setFeedingSummary });

    // Domain narrative overrides
    for (const dn of domainNarratives.filter(d => d.formId !== 'sp2')) {
      const key = `${dn.formId}_${dn.domainLocalId}`;
      const overrideText = domainOverrides[key];
      const autoText = generateNarrativeText(dn.narrative, firstName, gender, dn.formId);
      const currentText = overrideText !== undefined ? overrideText : autoText;
      if (currentText?.trim().length > 10) {
        sections.push({
          label: dn.narrative.domainName,
          value: currentText,
          setter: (v: string) => setDomainOverrides(prev => ({ ...prev, [key]: v })),
        });
      }
    }

    if (sections.length === 0) {
      toast.error('No sections with enough text to enhance.');
      setEnhancingAll(false);
      return;
    }

    toast.info(`Enhancing ${sections.length} sections... This may take a minute.`);

    let successCount = 0;
    let failCount = 0;

    // Process sections sequentially to avoid rate limits
    for (const section of sections) {
      if (signal.aborted) break;
      try {
        const result = await enhanceWithAI({
          text: section.value,
          sectionContext: section.label,
          childName: firstName,
          signal,
        });
        if (result.success && result.enhanced) {
          section.setter(result.enhanced);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
      // Small delay between requests to avoid rate limits
      if (!signal.aborted) await new Promise(r => setTimeout(r, 500));
    }

    setEnhancingAll(false);
    if (successCount > 0) {
      toast.success(`Enhanced ${successCount} section${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}. Save to keep changes.`);
    } else {
      toast.error('All sections failed to enhance. Please check your API key and try again.');
    }
  }, [
    referralInfo, medicalHistory, parentConcerns, clinicalObservation, feedingOralMotor,
    sensoryNarrative, recommendations, closingNote, testingConditions, validityStatement,
    feedingTestingConditions, feedingOralStructures, feedingBehaviors, feedingOralMotorCoord,
    feedingFoodRepertoire, feedingSelfFeeding, feedingPreviousHistory, feedingDrinking,
    feedingVestibular, feedingProprioceptive, feedingTactile, feedingSummary,
    domainNarratives, domainOverrides, firstName, gender,
  ]);

  // AI Generate Recommendations handler
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const recsAbortRef = useRef<AbortController | null>(null);

  const handleAiRecommendations = useCallback(async () => {
    if (!isAiConfigured()) {
      toast('AI not configured', {
        description: 'Add your OpenRouter API key in Settings → AI Settings to enable AI Enhance.',
        duration: 6000,
      });
      return;
    }
    if (!isOnline()) {
      toast.error('No internet connection. AI Enhance requires an internet connection.');
      return;
    }

    setGeneratingRecs(true);
    recsAbortRef.current = new AbortController();

    try {
      // Build domain findings summary
      const findingsParts: string[] = [];
      for (const row of bayleyScores) {
        findingsParts.push(`${row.domain}: Age Equivalence ${row.ageEquivalent} months, Scaled Score ${row.scaledScore}, Percent Delay ${row.percentDelay}`);
      }
      for (const row of dayc2Scores) {
        findingsParts.push(`${row.domain}: Age Equivalence ${row.ageEquivalent} months, Standard Score ${row.standardScore}`);
      }
      for (const row of reel3Scores) {
        findingsParts.push(`${row.domain}: Age Equivalence ${row.ageEquivalent} months`);
      }

      // Build report narrative summary from all sections
      const narrativeParts: string[] = [];
      if (clinicalObservation) narrativeParts.push(`Clinical Observation: ${clinicalObservation.substring(0, 500)}`);
      if (feedingOralMotor) narrativeParts.push(`Feeding/Oral Motor: ${feedingOralMotor.substring(0, 500)}`);
      if (sensoryNarrative) narrativeParts.push(`Sensory Processing: ${sensoryNarrative.substring(0, 500)}`);
      if (feedingBehaviors) narrativeParts.push(`Feeding Behaviors: ${feedingBehaviors.substring(0, 300)}`);
      if (feedingOralMotorCoord) narrativeParts.push(`Oral Motor Coordination: ${feedingOralMotorCoord.substring(0, 300)}`);
      if (feedingSelfFeeding) narrativeParts.push(`Self-Feeding: ${feedingSelfFeeding.substring(0, 300)}`);
      if (feedingDrinking) narrativeParts.push(`Drinking: ${feedingDrinking.substring(0, 300)}`);
      // Include domain narrative overrides
      for (const dn of domainNarratives) {
        const key = `${dn.formId}_${dn.domainLocalId}`;
        const override = domainOverrides[key];
        if (override) narrativeParts.push(`${dn.formName} - ${dn.domainLocalId}: ${override.substring(0, 300)}`);
      }

      const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
      const quarterDelay = Math.floor(ageMonthsVal * 0.75);

      const result = await generateRecommendations({
        childName,
        firstName,
        chronAge,
        gender,
        template,
        domainFindings: findingsParts.join('\n'),
        reportSummary: narrativeParts.join('\n\n'),
        quarterDelay,
        existingRecommendations: recommendations || undefined,
        signal: recsAbortRef.current.signal,
      });

      if (result.success && result.enhanced) {
        setRecommendations(result.enhanced);
        toast.success('Recommendations generated! Review and edit as needed.');
      } else {
        toast.error(result.error || 'Failed to generate recommendations.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Failed to generate recommendations. Please try again.');
      }
    } finally {
      setGeneratingRecs(false);
    }
  }, [
    bayleyScores, dayc2Scores, reel3Scores, clinicalObservation, feedingOralMotor,
    sensoryNarrative, feedingBehaviors, feedingOralMotorCoord, feedingSelfFeeding,
    feedingDrinking, domainNarratives, domainOverrides, childInfo, premWeeks,
    childName, firstName, chronAge, gender, template, recommendations,
  ]);

  // DOCX Export handler
  const handleDocxExport = useCallback(async () => {
    try {
      toast.info('Generating Word document...');

      // Build domain narratives for DOCX
      const docxNarratives: DocxDomainNarrative[] = domainNarratives
        .filter(d => d.formId !== 'sp2')
        .map(({ formName, formId, domainLocalId, narrative }) => {
          const key = `${formId}_${domainLocalId}`;
          const overrideText = domainOverrides[key];
          const autoText = generateNarrativeText(narrative, firstName, gender, formId);
          return {
            domainName: narrative.domainName,
            formName,
            scaledScore: narrative.scaledScore,
            rawScore: narrative.rawScore,
            ageEquivalent: narrative.ageEquivalent,
            narrativeText: overrideText !== undefined ? overrideText : autoText,
            notDemonstratedItems: narrative.allNotDemonstrated,
          };
        });

      // Load feeding checklist data from localStorage for export
      let feedingChecklistExport: FeedingChecklistExportData | undefined;
      if (template === 'feeding') {
        try {
          const clRaw = localStorage.getItem(`feeding-checklist-${childKey}`);
          if (clRaw) {
            const cl: FeedingChecklistDataType = JSON.parse(clRaw);
            const enduranceStr = (wfl: string, rating: string) => wfl === 'WFL' ? 'WFL' : wfl === 'Impaired' ? `Impaired - ${rating || 'N/A'}` : '';
            const positiveAsp = ASPIRATION_SIGN_LABELS.filter(s => cl.aspirationSigns?.[s] === 'Y');
            feedingChecklistExport = {
              oralSeeking: cl.oralSeeking || '',
              extraOralSensitivity: cl.extraOralSensitivity || '',
              intraOralSensitivity: cl.intraOralSensitivity || '',
              foodsDuringAssessment: cl.foodsDuringAssessment || '',
              jawStrength: cl.jawStrength || '',
              jawCupDrinking: cl.jawCupDrinking || '',
              jawBitingThrough: cl.jawBitingThrough || '',
              jawChewingEndurance: enduranceStr(cl.jawChewingEndurance, cl.jawChewingEnduranceRating),
              jawWideExcursions: cl.jawWideExcursions || '',
              jawLossOfFood: cl.jawLossOfFood || '',
              jawChewingPattern: cl.jawChewingPattern || '',
              jawClosedAtRest: cl.jawClosedAtRest || '',
              jawAnticipatoryOpening: cl.jawAnticipatoryOpening || '',
              lipsStrength: cl.lipsStrength || '',
              lipsDrinking: cl.lipsDrinking || '',
              lipsDrinkingDetail: cl.lipsDrinkingDetail || '',
              lipsChewing: cl.lipsChewing || '',
              lipsEndurance: enduranceStr(cl.lipsEndurance, cl.lipsEnduranceRating),
              lipsDrooling: cl.lipsDrooling || '',
              lipsLossOfFood: cl.lipsLossOfFood || '',
              tongueStrength: cl.tongueStrength || '',
              tongueDrinking: cl.tongueDrinking || '',
              tongueChewingLat: cl.tongueChewingLat || '',
              tongueChewingKeep: cl.tongueChewingKeep || '',
              tongueChewingEndurance: enduranceStr(cl.tongueChewingEndurance, cl.tongueChewingEnduranceRating),
              tongueLossSeal: cl.tongueLossSeal || '',
              tongueLossFood: cl.tongueLossFood || '',
              tongueLateralizesTo: cl.tongueLateralizesTo || '',
              tonguePrefers: cl.tonguePrefers || '',
              tongueTransfersMidline: cl.tongueTransfersMidline || '',
              tongueTipElevation: cl.tongueTipElevation || '',
              tongueCleanLips: cl.tongueCleanLips || '',
              tongueProtrusionSwallow: cl.tongueProtrusionSwallow || '',
              softPalate: cl.softPalate || '',
              softPalateDescribe: cl.softPalateDescribe || '',
              foodResidue: cl.foodResidue || '',
              foodResidueReasons: (cl.foodResidueReasons || []).join('; '),
              compensatoryStrategies: (cl.compensatoryStrategies || []).join('; '),
              overallQuality: cl.overallQuality || '',
              swallowCoordinated: cl.swallowCoordinated || '',
              swallowDescribe: cl.swallowDescribe || '',
              aspirationThinLiquids: cl.aspirationThinLiquids || '',
              aspirationThickenedLiquids: cl.aspirationThickenedLiquids ? `${cl.aspirationThickenedLiquids}${cl.aspirationThickenedLevel ? ` (${cl.aspirationThickenedLevel})` : ''}` : '',
              aspirationSolids: cl.aspirationSolids ? `${cl.aspirationSolids}${cl.aspirationSolidsType ? ` (${cl.aspirationSolidsType})` : ''}` : '',
              aspirationSignsPositive: positiveAsp.length > 0 ? positiveAsp.join(', ') : '',
              refusalBehaviors: cl.refusalBehaviors ? `${cl.refusalBehaviors}${cl.refusalParentResponse ? ` — ${cl.refusalParentResponse}` : ''}` : '',
              selfFeeding: cl.selfFeeding || '',
              selfFeedingDesc: cl.selfFeedingDesc || '',
            };
          }
        } catch { /* ignore parse errors */ }
      }

      const data: DocxReportData = {
        template,
        practiceName,
        practiceAddress: appSettings.practiceAddress,
        practicePhone: appSettings.practicePhone,
        practiceEmail: appSettings.practiceEmail,
        reportTitle,
        examinerName: examinerInfo.name,
        examinerTitle: examinerInfo.title,
        examinerAgency: examinerInfo.agency,
        childName,
        firstName,
        testDate: formatDate(childInfo.testDate),
        dob: formatDate(childInfo.dob),
        chronAge,
        adjAge,
        uciNumber,
        regionalCenter,

        referralInfo,
        medicalHistory,
        parentConcerns,
        assessmentTools,
        closingNote,
        recommendations,

        clinicalObservation,
        bayleyScores: bayleyScores.map(r => ({
          domain: r.domain,
          rawScore: r.rawScore,
          scaledScore: scoreOverrides[`bayley4_${r.domainLocalId}_scaledScore`] != null ? Number(scoreOverrides[`bayley4_${r.domainLocalId}_scaledScore`]) || r.scaledScore : r.scaledScore,
          ageEquivalent: scoreOverrides[`bayley4_${r.domainLocalId}_ageEquivalent`] ?? r.ageEquivalent,
          percentDelay: scoreOverrides[`bayley4_${r.domainLocalId}_percentDelay`] ?? r.percentDelay,
        })),
        cogComposite: bayleyCogComposite ? {
          label: 'Cognitive Composite',
          scaledScore: scoreOverrides['bayley4_cogComposite_scaledScore'] != null ? Number(scoreOverrides['bayley4_cogComposite_scaledScore']) || bayleyCogComposite.scaledScore : bayleyCogComposite.scaledScore,
          standardScore: scoreOverrides['bayley4_cogComposite_standardScore'] != null ? Number(scoreOverrides['bayley4_cogComposite_standardScore']) || bayleyCogComposite.standardScore : bayleyCogComposite.standardScore,
          percentile: scoreOverrides['bayley4_cogComposite_percentile'] ?? String(bayleyCogComposite.percentile),
        } : null,
        motorComposite: bayleyMotorComposite ? {
          label: 'Motor Composite',
          scaledScore: scoreOverrides['bayley4_motorComposite_scaledScore'] != null ? Number(scoreOverrides['bayley4_motorComposite_scaledScore']) || bayleyMotorComposite.sumScaled : bayleyMotorComposite.sumScaled,
          standardScore: scoreOverrides['bayley4_motorComposite_standardScore'] != null ? Number(scoreOverrides['bayley4_motorComposite_standardScore']) || bayleyMotorComposite.standardScore : bayleyMotorComposite.standardScore,
          percentile: scoreOverrides['bayley4_motorComposite_percentile'] ?? String(bayleyMotorComposite.percentile),
        } : null,
        dayc2Scores: dayc2Scores.map(r => {
          const domKey = r.domain.toLowerCase().replace(/[^a-z]/g, '');
          return {
            ...r,
            standardScore: scoreOverrides[`dayc2_${domKey}_standardScore`] ?? r.standardScore,
            descriptiveTerm: scoreOverrides[`dayc2_${domKey}_descriptiveTerm`] ?? r.descriptiveTerm,
            ageEquivalent: scoreOverrides[`dayc2_${domKey}_ageEquivalent`] ?? r.ageEquivalent,
            percentDelay: scoreOverrides[`dayc2_${domKey}_percentDelay`] ?? r.percentDelay,
          };
        }),
        dayc2BayleyComposites: dayc2BayleyComposites.map(c => ({
          composite: c.composite,
          fullName: c.fullName,
          sumOfScaledScores: c.sumOfScaledScores,
          standardScore: scoreOverrides[`bayley4ab_${c.composite}_standardScore`] != null
            ? Number(scoreOverrides[`bayley4ab_${c.composite}_standardScore`]) || c.standardScore
            : c.standardScore,
          percentileRank: c.percentileRank,
          confidence90: c.confidence90,
          confidence95: c.confidence95,
          available: c.available,
          note: c.note,
        })),
        reel3Scores: reel3Scores.map(r => {
          const domKey = r.domain.toLowerCase().replace(/[^a-z]/g, '');
          return {
            ...r,
            abilityScore: scoreOverrides[`reel3_${domKey}_abilityScore`] != null ? Number(scoreOverrides[`reel3_${domKey}_abilityScore`]) || r.abilityScore : r.abilityScore,
            percentileRank: scoreOverrides[`reel3_${domKey}_percentileRank`] ?? r.percentileRank,
            descriptiveTerm: scoreOverrides[`reel3_${domKey}_descriptiveTerm`] ?? r.descriptiveTerm,
            ageEquivalent: scoreOverrides[`reel3_${domKey}_ageEquivalent`] ?? r.ageEquivalent,
            percentDelay: scoreOverrides[`reel3_${domKey}_percentDelay`] ?? r.percentDelay,
          };
        }),
        domainNarratives: docxNarratives,
        feedingOralMotor,
        sensoryNarrative,
        summaryOfDevelopment,

        testingConditions,
        validityStatement,
        sp2Quadrants: sp2Scores.quadrants,
        sp2Sections: sp2Scores.sections,
        quadrantNarratives: (() => {
          // Build default narratives for any quadrant not manually edited
          const merged: Record<string, string> = { ...quadrantNarratives };
          for (const q of sp2Scores.quadrants) {
            if (!merged[q.key]) {
              const quadrantPurpose = q.key === 'seeking' ? 'gather information necessary for participation' : q.key === 'avoiding' ? 'manage sensory input for participation' : q.key === 'sensitivity' ? 'detect sensory input that enables participation' : 'notice sensory input to support participation';
              const isTypical = q.description.toLowerCase().includes('just like');
              const isMore = q.description.toLowerCase().includes('more');
              const isLess = q.description.toLowerCase().includes('less');
              if (isTypical) {
                merged[q.key] = `${firstName} scored in the "Just Like the Majority of Others" range for ${q.name} (${q.rawScore}/${q.maxScore}), indicating ${pronoun(gender, 'subject')} ${q.key === 'seeking' ? 'seeks sensory experiences' : q.key === 'avoiding' ? 'avoids sensory input' : q.key === 'sensitivity' ? 'responds to sensory input' : 'registers sensory input'} at a rate comparable to same-aged peers to ${quadrantPurpose}.`;
              } else if (isMore) {
                merged[q.key] = `${firstName} scored in the "${q.description}" range for ${q.name} (${q.rawScore}/${q.maxScore}), suggesting ${pronoun(gender, 'subject')} demonstrates a heightened pattern of sensory ${q.key} behaviors compared to same-aged peers. This may impact ${pronoun(gender, 'possessive')} ability to ${quadrantPurpose} in daily activities and routines.`;
              } else if (isLess) {
                merged[q.key] = `${firstName} scored in the "${q.description}" range for ${q.name} (${q.rawScore}/${q.maxScore}), suggesting ${pronoun(gender, 'subject')} demonstrates fewer sensory ${q.key} behaviors compared to same-aged peers. This pattern may affect ${pronoun(gender, 'possessive')} engagement in activities that require ${q.key === 'seeking' ? 'active exploration of the environment' : q.key === 'avoiding' ? 'managing overwhelming sensory experiences' : q.key === 'sensitivity' ? 'noticing and responding to sensory changes' : 'awareness of sensory input in the environment'}.`;
              } else {
                merged[q.key] = `${firstName} demonstrates sensory ${q.key} behaviors (${q.rawScore}/${q.maxScore}) to ${quadrantPurpose}.`;
              }
            }
          }
          return merged;
        })(),
        sectionNarratives: (() => {
          // Build default narratives for any section not manually edited
          const merged: Record<string, string> = { ...sectionNarratives };
          for (const s of sp2Scores.sections) {
            if (!merged[s.key]) {
              const isTypical = s.description.toLowerCase().includes('just like');
              const isMore = s.description.toLowerCase().includes('more');
              const isLess = s.description.toLowerCase().includes('less');
              if (isTypical) {
                merged[s.key] = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "Just Like the Majority of Others" range (${s.rawScore}/${s.maxScore}), indicating ${pronoun(gender, 'possessive')} ${s.name.toLowerCase()} abilities are within functional limits compared to same-aged peers.`;
              } else if (isMore) {
                merged[s.key] = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "${s.description}" range (${s.rawScore}/${s.maxScore}), suggesting this is an area of concern. ${Pronoun(gender, 'subject')} may demonstrate heightened or increased responses to ${s.key === 'general' ? 'everyday sensory experiences' : s.key === 'auditory' ? 'auditory input such as sounds and voices' : s.key === 'visual' ? 'visual stimuli in the environment' : s.key === 'touch' ? 'tactile input and textures' : s.key === 'movement' ? 'vestibular and movement-based activities' : s.key === 'oral' || s.key === 'oralsensory' ? 'oral-sensory input related to feeding and oral exploration' : 'behavioral regulation and emotional responses'} that may impact daily participation.`;
              } else if (isLess) {
                merged[s.key] = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "${s.description}" range (${s.rawScore}/${s.maxScore}), indicating ${pronoun(gender, 'subject')} may show reduced responsiveness to ${s.key === 'general' ? 'everyday sensory experiences' : s.key === 'auditory' ? 'auditory input' : s.key === 'visual' ? 'visual stimuli' : s.key === 'touch' ? 'tactile input' : s.key === 'movement' ? 'movement-based activities' : s.key === 'oral' || s.key === 'oralsensory' ? 'oral-sensory input' : 'behavioral cues'} compared to same-aged peers.`;
              } else {
                merged[s.key] = `${firstName}'s ${s.name.toLowerCase()} processing (${s.rawScore}/${s.maxScore}) appears to be within expected range.`;
              }
            }
          }
          return merged;
        })(),

        // Feeding template
        feedingTestingConditions,
        feedingOralStructures,
        feedingBehaviors,
        feedingOralMotorCoord,
        feedingFoodRepertoire,
        feedingSelfFeeding,
        feedingPreviousHistory,
        feedingDrinking,
        feedingVestibular,
        feedingProprioceptive,
        feedingTactile,
        feedingROM,
        feedingMuscleStrength,
        feedingMuscleTone,
        feedingPosturalStability,
        feedingSummary,
        feedingAdaptiveItemsDemonstrated: feedingAdaptiveItems.demonstrated,
        feedingAdaptiveItemsNotDemonstrated: feedingAdaptiveItems.notDemonstrated,
        feedingChecklistData: feedingChecklistExport,
        feedingBehaviorsData: (() => {
          try {
            const raw = localStorage.getItem(`feeding-behaviors-${childKey}`);
            return raw ? JSON.parse(raw) : undefined;
          } catch { return undefined; }
        })(),
        selfFeedingData: (() => {
          try {
            const raw = localStorage.getItem(`self-feeding-${childKey}`);
            return raw ? JSON.parse(raw) : undefined;
          } catch { return undefined; }
        })(),
        drinkingData: (() => {
          try {
            const raw = localStorage.getItem(`drinking-checklist-${childKey}`);
            return raw ? JSON.parse(raw) : undefined;
          } catch { return undefined; }
        })(),
      };

      await generateDocxReport(data);
      toast.success('Word document downloaded successfully');

      // Auto-save session as completed so it appears in history/dashboard
      // Only save if not already saved recently (avoid duplicates)
      try {
        const { getAllMultiSessions } = await import('@/lib/multiSessionStorage');
        const existingSessions = getAllMultiSessions();
        const childName = [state.childInfo.firstName, state.childInfo.lastName].filter(Boolean).join(' ').trim();
        const recentCompleted = existingSessions.find(
          (s: any) => s.status === 'completed' && s.childName === childName && s.testDate === state.childInfo.testDate
            && (Date.now() - new Date(s.savedAt).getTime()) < 300000 // within last 5 minutes
        );
        if (!recentCompleted) {
          saveMultiSession(state, 'completed', `Report exported ${new Date().toLocaleDateString()}`);
        }
      } catch (saveErr) {
        console.error('Auto-save after export failed:', saveErr);
      }
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error('Failed to generate Word document');
    }
  }, [
    template, practiceName, reportTitle, examinerInfo, childName, firstName, childInfo,
    chronAge, adjAge, uciNumber, regionalCenter, referralInfo, medicalHistory, parentConcerns, assessmentTools,
    closingNote, recommendations, clinicalObservation, bayleyScores, bayleyCogComposite,
    bayleyMotorComposite, dayc2Scores, reel3Scores, domainNarratives, domainOverrides,
    gender, feedingOralMotor, sensoryNarrative, summaryOfDevelopment, testingConditions,
    validityStatement, sp2Scores, quadrantNarratives, sectionNarratives, scoreOverrides,
    feedingTestingConditions, feedingOralStructures, feedingBehaviors, feedingOralMotorCoord,
    feedingFoodRepertoire, feedingSelfFeeding, feedingPreviousHistory, feedingDrinking,
    feedingVestibular, feedingProprioceptive, feedingTactile, feedingROM,
    feedingMuscleStrength, feedingMuscleTone, feedingPosturalStability, feedingSummary,
  ]);

  // Switch template
  const handleTemplateSwitch = (t: ReportTemplate) => {
    setTemplate(t);
    setReportTitle(TEMPLATE_INFO[t].title);
    setShowTemplateSelector(false);
    // Clear recommendations so they regenerate for the new template
    setRecommendations('');
    toast.success(`Switched to ${TEMPLATE_INFO[t].label} template`);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:hidden" style={{ overflow: 'visible' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'summary' })} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Summary
            </Button>
            <div className="h-5 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-slate-800 text-sm">Clinical Report</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">
              {isDirty ? 'Unsaved changes...' : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
            </span>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(!showTemplateSelector)} className="text-slate-600">
                <LayoutTemplate className="w-4 h-4 mr-1" /> Template
              </Button>
            </div>
            {/* Template selector as centered modal dialog */}
            {showTemplateSelector && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowTemplateSelector(false)}>
                <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-800">Select Report Template</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Choose a template for this clinical report</p>
                  </div>
                  <div className="p-2">
                    {(Object.keys(TEMPLATE_INFO) as ReportTemplate[]).map(t => (
                      <button
                        key={t}
                        onClick={() => handleTemplateSwitch(t)}
                        className={`w-full text-left px-4 py-3 rounded-lg mb-1 last:mb-0 transition-colors ${
                          template === t
                            ? 'bg-teal-50 border border-teal-300 ring-1 ring-teal-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">{TEMPLATE_INFO[t].label}</span>
                          {template === t && <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-medium">Active</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{TEMPLATE_INFO[t].description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
                    <button onClick={() => setShowTemplateSelector(false)} className="text-sm text-slate-600 hover:text-slate-800 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">Close</button>
                  </div>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={enhancingAll ? () => { enhanceAllAbortRef.current?.abort(); setEnhancingAll(false); } : handleEnhanceAll}
              className={enhancingAll ? 'text-amber-700 border-amber-300 hover:bg-amber-50' : 'text-purple-700 border-purple-300 hover:bg-purple-50'}
            >
              {enhancingAll ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Cancel
              </>) : (
                <><WandSparkles className="w-4 h-4 mr-1" /> Enhance All
              </>)}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDocxExport} className="text-blue-700 border-blue-300 hover:bg-blue-50">
              <FileDown className="w-4 h-4 mr-1" /> Word
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdfExport} className="text-red-700 border-red-300 hover:bg-red-50">
              <FileOutput className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <div className="h-5 w-px bg-slate-300" />
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' })} className="text-slate-600">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const hasData = state.childInfo.firstName || state.childInfo.lastName;
              if (!hasData) {
                dispatch({ type: 'NEW_ASSESSMENT' });
                return;
              }
              if (confirm('Start a new assessment?')) {
                // Skip auto-save: user is on report page, assessment is already completed/saved
                dispatch({ type: 'NEW_ASSESSMENT' });
              }
            }} className="text-teal-700">
              New Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        <div ref={reportContentRef} className="bg-white rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
          <div className="p-8 print:p-12 space-y-6">

            {/* ===== HEADER ===== */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                {appSettings.practiceLogo && (
                  <img
                    src={appSettings.practiceLogo}
                    alt="Practice logo"
                    className="w-16 h-16 object-contain print:w-14 print:h-14"
                  />
                )}
                <div className="text-center">
                  <EditableSection label="" value={practiceName} onChange={setPracticeName} childName={firstName} rows={1} />
                  <p className="text-sm text-slate-600 font-serif">{examinerInfo.name} — {examinerInfo.title}</p>
                  {(appSettings.practiceAddress || appSettings.practicePhone || appSettings.practiceEmail) && (
                    <p className="text-xs text-slate-500 font-serif mt-1">
                      {[appSettings.practiceAddress, appSettings.practicePhone, appSettings.practiceEmail].filter(Boolean).join(' | ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ===== TITLE ===== */}
            <EditableSection label="" value={reportTitle} onChange={setReportTitle} childName={firstName} rows={1} />

            {/* ===== CLIENT INFO TABLE ===== */}
            <div className="border border-slate-300 rounded-md overflow-hidden mb-6">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 w-48 bg-slate-50">CLIENT'S NAME:</td>
                    <td className="px-4 py-2 text-slate-900">{childName.toUpperCase()}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">UCI:</td>
                    <td className="px-4 py-2 text-slate-900">
                      <input
                        type="text"
                        value={uciNumber}
                        onChange={e => setUciNumber(e.target.value)}
                        placeholder="Enter UCI number..."
                        className="w-full bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 placeholder:italic text-sm p-0 focus:ring-0"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">DATE OF EVALUATION:</td>
                    <td className="px-4 py-2 text-slate-900">{formatDate(childInfo.testDate)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">DATE OF BIRTH:</td>
                    <td className="px-4 py-2 text-slate-900">{formatDate(childInfo.dob)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">CHRONOLOGICAL AGE:</td>
                    <td className="px-4 py-2 text-slate-900">{chronAge}</td>
                  </tr>
                  {adjAge && (
                    <tr className="border-b border-slate-200">
                      <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">ADJUSTED AGE:</td>
                      <td className="px-4 py-2 text-slate-900">{adjAge}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50">REGIONAL CENTER:</td>
                    <td className="px-4 py-2 text-slate-900">
                      <input
                        type="text"
                        value={regionalCenter}
                        onChange={e => setRegionalCenter(e.target.value)}
                        placeholder="Enter regional center..."
                        className="w-full bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 placeholder:italic text-sm p-0 focus:ring-0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ============================================================ */}
            {/* TEMPLATE: DEVELOPMENTAL INTAKE                                */}
            {/* ============================================================ */}
            {template === 'developmental' && (
              <>
                <SectionHeader title="Referral Information" sectionKey="referral" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.referral && (
                  <EditableSection label="" value={referralInfo} onChange={setReferralInfo} childName={firstName} placeholder="Enter referral information..." rows={3} />
                )}

                <SectionHeader title="Birth/Medical History" sectionKey="medical" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.medical && (
                  <EditableSection label="" value={medicalHistory} onChange={setMedicalHistory} childName={firstName} placeholder="Enter birth and medical history details..." rows={6} />
                )}

                <SectionHeader title="Parent's Concerns" sectionKey="concerns" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.concerns && (
                  <EditableSection label="" value={parentConcerns} onChange={setParentConcerns} childName={firstName} placeholder="Enter parent/caregiver concerns..." rows={4} />
                )}

                <SectionHeader title="Assessment Tools" sectionKey="tools" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.tools && (
                  <div className="mb-4">
                    <p className="text-sm font-serif text-slate-800 leading-relaxed mb-2">
                      The following assessments were completed in English with {childName} and {pronoun(gender, 'possessive')} caregiver present in {pronoun(gender, 'possessive')} home environment. Per parent report, participation, behavior, and performance observed during the assessment are reported to be typical. Therefore, this assessment is believed to be reliable and valid in regards to the client's present level of function.
                    </p>
                    <ul className="list-disc list-inside text-sm font-serif text-slate-800 space-y-1 ml-4">
                      {assessmentTools.map((tool, i) => <li key={i}>{tool}</li>)}
                    </ul>
                  </div>
                )}

                <SectionHeader title="Clinical Observation" sectionKey="observation" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.observation && (
                  <EditableSection label="" value={clinicalObservation} onChange={setClinicalObservation} childName={firstName} placeholder={`Enter clinical observations about ${firstName}'s behavior, state control, regulation, and interaction during the assessment...`} rows={6} />
                )}

                {/* Scoring Tables */}
                <SectionHeader title="Scoring Tables" sectionKey="scores" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.scores && (
                  <div className="space-y-4 mb-6">
                    {bayleyScores.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bayley Scales of Infant Development, 4th Edition (BSID-IV)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Subtest</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Scaled Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalence</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bayleyScores.map((row, i) => (
                                <tr key={i}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.rawScore}</td>
                                  <EditableCell value={row.scaledScore} overrideKey={`bayley4_${row.domainLocalId}_scaledScore`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={row.ageEquivalent} overrideKey={`bayley4_${row.domainLocalId}_ageEquivalent`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={row.percentDelay || '—'} overrideKey={`bayley4_${row.domainLocalId}_percentDelay`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                </tr>
                              ))}

                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {dayc2Scores.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2 no-print">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {dayc2ScoringMethod === 'bayley4ab'
                              ? 'DAYC-2 Items Scored with Bayley-4 Adaptive Behavior Scales'
                              : 'DAYC-2 Developmental Assessment of Young Children, 2nd Edition'}
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (dayc2ScoringMethod === 'native') {
                                  setReportScoringOverride('bayley4ab');
                                } else {
                                  setReportScoringOverride('native');
                                }
                                setShowScoringComparison(false);
                              }}
                              className="text-[10px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
                              title="Switch to alternate scoring method"
                            >
                              Switch to {dayc2ScoringMethod === 'bayley4ab' ? 'DAYC-2' : 'Bayley-4 AB'}
                            </button>
                            <button
                              onClick={() => setShowScoringComparison(!showScoringComparison)}
                              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                showScoringComparison
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-300 hover:bg-slate-50'
                              }`}
                              title="Compare both scoring methods side by side"
                            >
                              {showScoringComparison ? 'Hide' : 'Show'} Comparison
                            </button>
                            {reportScoringOverride !== null && (
                              <button
                                onClick={() => { setReportScoringOverride(null); setShowScoringComparison(false); }}
                                className="text-[10px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-500"
                                title="Reset to original scoring method"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 print-only" style={{ display: 'none' }}>
                          {dayc2ScoringMethod === 'bayley4ab'
                            ? 'DAYC-2 Items Scored with Bayley-4 Adaptive Behavior Scales'
                            : 'DAYC-2 Developmental Assessment of Young Children, 2nd Edition'}
                        </h4>
                        {dayc2ScoringMethod === 'bayley4ab' && (
                          <p className="text-[10px] text-amber-600 mb-1 italic">Scoring method: Bayley-4 Adaptive Behavior norms applied to DAYC-2 raw scores</p>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Subtest</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">
                                  {dayc2ScoringMethod === 'bayley4ab' ? 'Scaled Score' : 'Standard Score'}
                                </th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">
                                  {dayc2ScoringMethod === 'bayley4ab' ? 'Bayley-4 Subscale' : 'Descriptive Term'}
                                </th>
                                {dayc2ScoringMethod === 'bayley4ab' && (
                                  <th className="border border-slate-400 px-3 py-2 text-center font-bold">Classification</th>
                                )}
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalence</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayc2Scores.map((row, i) => {
                                const domKey = row.domain.toLowerCase().replace(/[^a-z]/g, '');
                                return (
                                  <tr key={i}>
                                    <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                                    <td className="border border-slate-400 px-3 py-2 text-center">{row.rawScore}</td>
                                    <EditableCell value={row.standardScore} overrideKey={`dayc2_${domKey}_standardScore`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.descriptiveTerm} overrideKey={`dayc2_${domKey}_descriptiveTerm`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    {dayc2ScoringMethod === 'bayley4ab' && (
                                      <td className="border border-slate-400 px-3 py-2 text-center">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                          row.classification === 'Average' ? 'bg-green-100 text-green-700' :
                                          row.classification === 'Above Average' || row.classification === 'Very Superior' ? 'bg-blue-100 text-blue-700' :
                                          row.classification === 'Below Average' ? 'bg-amber-100 text-amber-700' :
                                          row.classification === 'Well Below Average' ? 'bg-red-100 text-red-700' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>{row.classification || '\u2014'}</span>
                                      </td>
                                    )}
                                    <EditableCell value={row.ageEquivalent} overrideKey={`dayc2_${domKey}_ageEquivalent`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.percentDelay} overrideKey={`dayc2_${domKey}_percentDelay`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Comparison table: alternate scoring method side by side */}
                        {showScoringComparison && dayc2ComparisonScores.length > 0 && (
                          <div className="mt-3 print-comparison-section">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                              Comparison: {dayc2ScoringMethod === 'bayley4ab' ? 'DAYC-2 Standard Scoring' : 'Bayley-4 AB Scoring'}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse border border-amber-300">
                                <thead>
                                  <tr className="bg-amber-50">
                                    <th className="border border-amber-300 px-3 py-2 text-left font-bold">Subtest</th>
                                    <th className="border border-amber-300 px-3 py-2 text-center font-bold">Raw Score</th>
                                    <th className="border border-amber-300 px-3 py-2 text-center font-bold">
                                      {dayc2ScoringMethod === 'bayley4ab' ? 'Standard Score' : 'Scaled Score'}
                                    </th>
                                    <th className="border border-amber-300 px-3 py-2 text-center font-bold">
                                      {dayc2ScoringMethod === 'bayley4ab' ? 'Descriptive Term' : 'Bayley-4 Subscale'}
                                    </th>
                                    {dayc2ScoringMethod !== 'bayley4ab' && (
                                      <th className="border border-amber-300 px-3 py-2 text-center font-bold">Classification</th>
                                    )}
                                    <th className="border border-amber-300 px-3 py-2 text-center font-bold">Age Equivalence</th>
                                    <th className="border border-amber-300 px-3 py-2 text-center font-bold">% Delay</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dayc2ComparisonScores.map((row, i) => (
                                    <tr key={i}>
                                      <td className="border border-amber-300 px-3 py-2 font-medium">{row.domain}</td>
                                      <td className="border border-amber-300 px-3 py-2 text-center">{row.rawScore}</td>
                                      <td className="border border-amber-300 px-3 py-2 text-center">{row.standardScore}</td>
                                      <td className="border border-amber-300 px-3 py-2 text-center">{row.descriptiveTerm}</td>
                                      {dayc2ScoringMethod !== 'bayley4ab' && (
                                        <td className="border border-amber-300 px-3 py-2 text-center">
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                            row.classification === 'Average' ? 'bg-green-100 text-green-700' :
                                            row.classification === 'Above Average' || row.classification === 'Very Superior' ? 'bg-blue-100 text-blue-700' :
                                            row.classification === 'Below Average' ? 'bg-amber-100 text-amber-700' :
                                            row.classification === 'Well Below Average' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                          }`}>{row.classification || '\u2014'}</span>
                                        </td>
                                      )}
                                      <td className="border border-amber-300 px-3 py-2 text-center">{row.ageEquivalent}</td>
                                      <td className="border border-amber-300 px-3 py-2 text-center">{row.percentDelay}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {dayc2BayleyComposites.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bayley-4 Adaptive Behavior Composite Scores</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-amber-50">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Composite</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Sum of Scaled Scores</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Standard Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Percentile Rank</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Classification</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">90% CI</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">95% CI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayc2BayleyComposites.map((comp, i) => {
                                const compClassification = comp.standardScore !== null ? getCompositeClassification(comp.standardScore) : null;
                                return (
                                <tr key={i} className={!comp.available ? 'opacity-50' : ''}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">
                                    {comp.fullName}
                                    {comp.note && <span className="block text-[9px] text-slate-400 italic">{comp.note}</span>}
                                  </td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-mono">
                                    {comp.available ? comp.sumOfScaledScores : '\u2014'}
                                  </td>
                                  <EditableCell
                                    value={comp.standardScore !== null ? String(comp.standardScore) : '\u2014'}
                                    overrideKey={`bayley4ab_${comp.composite}_standardScore`}
                                    overrides={scoreOverrides}
                                    setOverrides={setScoreOverrides}
                                  />
                                  <td className="border border-slate-400 px-3 py-2 text-center">
                                    {comp.percentileRank !== null ? comp.percentileRank : '\u2014'}
                                  </td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">
                                    {compClassification ? (
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        compClassification === 'Average' ? 'bg-green-100 text-green-700' :
                                        compClassification === 'High Average' || compClassification === 'Very High' || compClassification === 'Extremely High' ? 'bg-blue-100 text-blue-700' :
                                        compClassification === 'Low Average' ? 'bg-amber-100 text-amber-700' :
                                        compClassification === 'Borderline' || compClassification === 'Very Low' || compClassification === 'Extremely Low' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>{compClassification}</span>
                                    ) : '\u2014'}
                                  </td>
                                  <td className="border border-slate-400 px-3 py-2 text-center text-[10px]">{comp.confidence90}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center text-[10px]">{comp.confidence95}</td>
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {reel3Scores.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Receptive-Expressive Emergent Language Test, 3rd Edition (REEL-3)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Subtest</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Ability Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Percentile</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Descriptive Term</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalence</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reel3Scores.map((row, i) => {
                                const domKey = row.domain.toLowerCase().replace(/[^a-z]/g, '');
                                return (
                                  <tr key={i}>
                                    <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                                    <td className="border border-slate-400 px-3 py-2 text-center">{row.rawScore}</td>
                                    <EditableCell value={row.abilityScore} overrideKey={`reel3_${domKey}_abilityScore`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.percentileRank} overrideKey={`reel3_${domKey}_percentileRank`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.descriptiveTerm} overrideKey={`reel3_${domKey}_descriptiveTerm`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.ageEquivalent} overrideKey={`reel3_${domKey}_ageEquivalent`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                    <EditableCell value={row.percentDelay || '—'} overrideKey={`reel3_${domKey}_percentDelay`} overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Domain Narratives */}
                <SectionHeader title="Domain Assessments" sectionKey="domains" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.domains && (
                  <div className="space-y-6 mb-6">
                    {domainNarratives.filter(d => d.formId !== 'sp2').map(({ formName, formId, domainLocalId, narrative }) => {
                      const key = `${formId}_${domainLocalId}`;
                      const overrideText = domainOverrides[key];
                      const isOverridden = overrideText !== undefined;
                      const autoText = generateNarrativeText(narrative, firstName, gender, formId);
                      const isNotDemoVisible = showNotDemonstrated[key] ?? false;

                      return (
                        <div key={key} className="border-l-2 border-teal-600 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                              {narrative.domainName}
                              {narrative.ageEquivalent !== 'N/A' && (
                                <span className="font-normal text-slate-500 ml-1">(age equivalence: {narrative.ageEquivalent})</span>
                              )}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{formName}</span>
                          </div>
                          {formId === 'bayley4' && narrative.ageEquivalent !== 'N/A' && (
                            <p className="text-sm font-serif text-slate-700 mb-2">
                              <strong>Age Equivalence: {narrative.ageEquivalent}</strong>
                            </p>
                          )}
                          <EditableSection label="" value={isOverridden ? overrideText : autoText} onChange={(v) => setDomainOverrides(prev => ({ ...prev, [key]: v }))} childName={firstName} placeholder="Domain narrative..." rows={6} />
                          {narrative.allNotDemonstrated.length > 0 && (
                            <div className="mt-2">
                              <button onClick={() => toggleNotDemonstrated(key)} className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition-colors print:hidden">
                                {isNotDemoVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {isNotDemoVisible ? 'Hide' : 'Show'} Items Not Demonstrated ({narrative.allNotDemonstrated.length})
                              </button>
                              {isNotDemoVisible && (
                                <div className="mt-2 bg-rose-50 border border-rose-200 rounded-md p-3 print:bg-white print:border-rose-300">
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">Items Not Demonstrated</h5>
                                  <ul className="text-xs font-serif text-slate-700 space-y-1">
                                    {narrative.allNotDemonstrated.map((item, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-rose-400 mt-0.5 shrink-0">•</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Feeding/Oral Motor */}
                <SectionHeader title="Feeding/Oral Motor Skills" sectionKey="feeding" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.feeding && (
                  <EditableSection label="" value={feedingOralMotor} onChange={setFeedingOralMotor} childName={firstName} placeholder="Enter feeding and oral motor observations (texture progression, self-feeding, straw cup, open cup, positioning)..." rows={5} />
                )}

                {/* Sensory Processing (brief) */}
                <SectionHeader title="Sensory Processing" sectionKey="sensory" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.sensory && (
                  <EditableSection label="" value={sensoryNarrative} onChange={setSensoryNarrative} childName={firstName} placeholder="Enter sensory processing observations..." rows={8} />
                )}

                {/* Summary of Development */}
                <SectionHeader title="Summary of Development" sectionKey="summaryDev" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.summaryDev && (
                  <div className="mb-6">
                    <p className="text-sm font-serif text-slate-800 mb-3">
                      {firstName} is a {chronAge} old {gender === 'male' || gender === 'm' ? 'boy' : gender === 'female' || gender === 'f' ? 'girl' : 'child'} who is functioning at the following levels:
                    </p>
                    <table className="w-full text-sm border-collapse border border-slate-400 mb-4">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-400 px-4 py-2 text-left font-bold">Domain</th>
                          <th className="border border-slate-400 px-4 py-2 text-center font-bold">Age Equivalent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryOfDevelopment.map((row, i) => (
                          <tr key={i}>
                            <td className="border border-slate-400 px-4 py-2">{row.domain}</td>
                            <td className="border border-slate-400 px-4 py-2 text-center">{row.ageEquivalent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Recommendations */}
                <SectionHeader title="Recommendations" sectionKey="recs" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.recs && (
                  <>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiRecommendations}
                        disabled={generatingRecs}
                        className="gap-1.5 text-xs bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
                      >
                        {generatingRecs ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                        ) : (
                          <><WandSparkles className="w-3.5 h-3.5" /> AI Generate Recommendations</>
                        )}
                      </Button>
                      {generatingRecs && (
                        <Button variant="ghost" size="sm" onClick={() => recsAbortRef.current?.abort()} className="text-xs text-red-500 hover:text-red-700">
                          Cancel
                        </Button>
                      )}
                    {appSettings.recommendationTemplates.length > 0 && (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRecTemplatePicker(!showRecTemplatePicker)}
                          className="gap-1.5 text-xs"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Insert Template
                        </Button>
                        {showRecTemplatePicker && (
                          <div className="absolute top-9 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-80 max-h-64 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100">
                              <p className="text-xs font-medium text-slate-500 px-2">Click to append to recommendations</p>
                            </div>
                            {appSettings.recommendationTemplates.map(tpl => (
                              <button
                                key={tpl.id}
                                onClick={() => insertRecTemplate(tpl)}
                                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-slate-800 truncate">{tpl.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.text}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <EditableSection label="" value={recommendations} onChange={setRecommendations} childName={firstName} placeholder="Enter recommendations..." rows={10} />
                  </>
                )}
              </>
            )}

            {/* ============================================================ */}
            {/* TEMPLATE: SENSORY INTEGRATION (SI) ASSESSMENT                 */}
            {/* ============================================================ */}
            {template === 'sensory' && (
              <>
                <SectionHeader title="Background Information" sectionKey="si_background" collapsed={collapsedSections} toggle={toggleSection} number="I" />
                {!collapsedSections.si_background && (
                  <EditableSection label="" value={medicalHistory} onChange={setMedicalHistory} childName={firstName} placeholder="Enter birth and medical history (born full term/preterm, delivery method, hospital, NICU stay, health history, allergies, medications)..." rows={6} />
                )}

                <SectionHeader title="Referral Information" sectionKey="si_referral" collapsed={collapsedSections} toggle={toggleSection} number="II" />
                {!collapsedSections.si_referral && (
                  <EditableSection label="" value={referralInfo} onChange={setReferralInfo} childName={firstName} placeholder="This evaluation is being completed to assess eligibility for Early Start Services..." rows={3} />
                )}

                <SectionHeader title="Parent's Concerns" sectionKey="si_concerns" collapsed={collapsedSections} toggle={toggleSection} number="III" />
                {!collapsedSections.si_concerns && (
                  <EditableSection label="" value={parentConcerns} onChange={setParentConcerns} childName={firstName} placeholder="Enter parent/caregiver concerns..." rows={4} />
                )}

                <SectionHeader title="Assessment Tools" sectionKey="si_tools" collapsed={collapsedSections} toggle={toggleSection} number="IV" />
                {!collapsedSections.si_tools && (
                  <div className="mb-4">
                    <ul className="list-disc list-inside text-sm font-serif text-slate-800 space-y-1 ml-4 mb-3">
                      {assessmentTools.map((tool, i) => <li key={i}>{tool}</li>)}
                    </ul>
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-700 leading-relaxed">
                      <p className="font-bold mb-1">Toddler Sensory Profile 2 (Dunn, 2014):</p>
                      <p>This test is administered as a caregiver questionnaire. It provides a summary of a child's sensory processing patterns. It was developed to identify children's strengths and challenges associated with sensory processing in the context of everyday life. Classifications are based on performance of children without disabilities. Scores are classified into five categories:</p>
                      <ul className="mt-2 space-y-1 ml-4">
                        <li><strong>Just Like the Majority of Others:</strong> Range from -1SD to +1SD. Indicates sensory processing patterns in the majority of the normative sample.</li>
                        <li><strong>More Than Others:</strong> Scores between +1SD and +2SD. Indicates behaviors in &gt;84% of the normative sample.</li>
                        <li><strong>Much More Than Others:</strong> Scores above +2SD. Indicates behaviors in &gt;98% of the normative sample.</li>
                        <li><strong>Less Than Others:</strong> Scores between -1SD and -2SD. Indicates behaviors in &lt;84% of the normative sample.</li>
                        <li><strong>Much Less Than Others:</strong> Scores below -2SD. Indicates behaviors in &lt;98% of the normative sample.</li>
                      </ul>
                    </div>
                  </div>
                )}

                <SectionHeader title="Testing Conditions and Behavior During Evaluation" sectionKey="si_testing" collapsed={collapsedSections} toggle={toggleSection} number="V" />
                {!collapsedSections.si_testing && (
                  <EditableSection label="" value={testingConditions} onChange={setTestingConditions} childName={firstName} placeholder={`The assessment was completed in-home with ${childName} and caregiver present...`} rows={5} />
                )}

                <SectionHeader title="Validity of Assessment Findings" sectionKey="si_validity" collapsed={collapsedSections} toggle={toggleSection} number="VI" />
                {!collapsedSections.si_validity && (
                  <EditableSection label="" value={validityStatement} onChange={setValidityStatement} childName={firstName} placeholder="Behavior and performance observed during the assessment is reported to be typical..." rows={2} />
                )}

                <SectionHeader title="Sensory Processing" sectionKey="si_sensory" collapsed={collapsedSections} toggle={toggleSection} number="VII" />
                {!collapsedSections.si_sensory && (
                  <div className="space-y-6 mb-6">
                    {/* Quadrant Definitions Table */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quadrant Summary</h4>
                      <p className="text-xs font-serif text-slate-600 mb-3">The quadrant scores reflect the child's responsiveness to sensory experiences.</p>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs border-collapse border border-slate-400">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-400 px-3 py-2 text-left font-bold w-36">Quadrant</th>
                              <th className="border border-slate-400 px-3 py-2 text-left font-bold">Definition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(QUADRANT_DEFINITIONS).map(([key, def]) => (
                              <tr key={key}>
                                <td className="border border-slate-400 px-3 py-2 font-medium">{QUADRANT_LABELS[key]}</td>
                                <td className="border border-slate-400 px-3 py-2 text-slate-700">{def}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quadrant Scores Table */}
                    {sp2Scores.quadrants.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quadrant Scores</h4>
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Quadrant</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sp2Scores.quadrants.map((q, i) => (
                                <tr key={i} className={q.description.toLowerCase().includes('more') ? 'bg-amber-50' : ''}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">{q.name}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{q.rawScore}/{q.maxScore}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-medium">{q.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Quadrant Narratives */}
                        <div className="space-y-3">
                          {sp2Scores.quadrants.map(q => {
                            // Build clinically meaningful default narrative based on quadrant score and description
                            const quadrantPurpose = q.key === 'seeking' ? 'gather information necessary for participation' : q.key === 'avoiding' ? 'manage sensory input for participation' : q.key === 'sensitivity' ? 'detect sensory input that enables participation' : 'notice sensory input to support participation';
                            const isTypical = q.description.toLowerCase().includes('just like');
                            const isMore = q.description.toLowerCase().includes('more');
                            const isLess = q.description.toLowerCase().includes('less');
                            let defaultNarrative: string;
                            if (isTypical) {
                              defaultNarrative = `${firstName} scored in the "Just Like the Majority of Others" range for ${q.name} (${q.rawScore}/${q.maxScore}), indicating ${pronoun(gender, 'subject')} ${q.key === 'seeking' ? 'seeks sensory experiences' : q.key === 'avoiding' ? 'avoids sensory input' : q.key === 'sensitivity' ? 'responds to sensory input' : 'registers sensory input'} at a rate comparable to same-aged peers to ${quadrantPurpose}.`;
                            } else if (isMore) {
                              defaultNarrative = `${firstName} scored in the "${q.description}" range for ${q.name} (${q.rawScore}/${q.maxScore}), suggesting ${pronoun(gender, 'subject')} demonstrates a heightened pattern of sensory ${q.key} behaviors compared to same-aged peers. This may impact ${pronoun(gender, 'possessive')} ability to ${quadrantPurpose} in daily activities and routines.`;
                            } else if (isLess) {
                              defaultNarrative = `${firstName} scored in the "${q.description}" range for ${q.name} (${q.rawScore}/${q.maxScore}), suggesting ${pronoun(gender, 'subject')} demonstrates fewer sensory ${q.key} behaviors compared to same-aged peers. This pattern may affect ${pronoun(gender, 'possessive')} engagement in activities that require ${q.key === 'seeking' ? 'active exploration of the environment' : q.key === 'avoiding' ? 'managing overwhelming sensory experiences' : q.key === 'sensitivity' ? 'noticing and responding to sensory changes' : 'awareness of sensory input in the environment'}.`;
                            } else {
                              defaultNarrative = `${firstName} demonstrates sensory ${q.key} behaviors (${q.rawScore}/${q.maxScore}) to ${quadrantPurpose}.`;
                            }
                            const currentNarrative = quadrantNarratives[q.key] ?? defaultNarrative;
                            return (
                              <div key={q.key} className="border-l-2 border-red-400 pl-3">
                                <EditableSection
                                  label={q.name}
                                  value={currentNarrative}
                                  onChange={(v) => setQuadrantNarratives(prev => ({ ...prev, [q.key]: v }))}
                                  rows={2}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section Scores Table */}
                    {sp2Scores.sections.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Sensory Processing and Behavior Sections</h4>
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Section</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sp2Scores.sections.map((s, i) => (
                                <tr key={i} className={s.description.toLowerCase().includes('more') ? 'bg-amber-50' : ''}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">{s.name}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{s.rawScore}/{s.maxScore}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-medium">{s.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Section Narratives */}
                        <div className="space-y-3">
                          {sp2Scores.sections.map(s => {
                            const isTypical = s.description.toLowerCase().includes('just like');
                            const isMore = s.description.toLowerCase().includes('more');
                            const isLess = s.description.toLowerCase().includes('less');
                            let defaultNarrative: string;
                            if (isTypical) {
                              defaultNarrative = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "Just Like the Majority of Others" range (${s.rawScore}/${s.maxScore}), indicating ${pronoun(gender, 'possessive')} ${s.name.toLowerCase()} abilities are within functional limits compared to same-aged peers.`;
                            } else if (isMore) {
                              defaultNarrative = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "${s.description}" range (${s.rawScore}/${s.maxScore}), suggesting this is an area of concern. ${Pronoun(gender, 'subject')} may demonstrate heightened or increased responses to ${s.key === 'general' ? 'everyday sensory experiences' : s.key === 'auditory' ? 'auditory input such as sounds and voices' : s.key === 'visual' ? 'visual stimuli in the environment' : s.key === 'touch' ? 'tactile input and textures' : s.key === 'movement' ? 'vestibular and movement-based activities' : s.key === 'oral' || s.key === 'oralsensory' ? 'oral-sensory input related to feeding and oral exploration' : 'behavioral regulation and emotional responses'} that may impact daily participation.`;
                            } else if (isLess) {
                              defaultNarrative = `${firstName}'s ${s.name.toLowerCase()} skills scored in the "${s.description}" range (${s.rawScore}/${s.maxScore}), indicating ${pronoun(gender, 'subject')} may show reduced responsiveness to ${s.key === 'general' ? 'everyday sensory experiences' : s.key === 'auditory' ? 'auditory input' : s.key === 'visual' ? 'visual stimuli' : s.key === 'touch' ? 'tactile input' : s.key === 'movement' ? 'movement-based activities' : s.key === 'oral' || s.key === 'oralsensory' ? 'oral-sensory input' : 'behavioral cues'} compared to same-aged peers.`;
                            } else {
                              defaultNarrative = `${firstName}'s ${s.name.toLowerCase()} processing (${s.rawScore}/${s.maxScore}) appears to be within expected range.`;
                            }
                            const currentNarrative = sectionNarratives[s.key] ?? defaultNarrative;
                            return (
                              <div key={s.key} className="border-l-2 border-red-400 pl-3">
                                <EditableSection
                                  label={s.name}
                                  value={currentNarrative}
                                  onChange={(v) => setSectionNarratives(prev => ({ ...prev, [s.key]: v }))}
                                  rows={3}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary and Recommendations */}
                <SectionHeader title="Summary and Recommendations" sectionKey="si_recs" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.si_recs && (
                  <>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiRecommendations}
                        disabled={generatingRecs}
                        className="gap-1.5 text-xs bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
                      >
                        {generatingRecs ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                        ) : (
                          <><WandSparkles className="w-3.5 h-3.5" /> AI Generate Recommendations</>
                        )}
                      </Button>
                      {generatingRecs && (
                        <Button variant="ghost" size="sm" onClick={() => recsAbortRef.current?.abort()} className="text-xs text-red-500 hover:text-red-700">
                          Cancel
                        </Button>
                      )}
                    {appSettings.recommendationTemplates.length > 0 && (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRecTemplatePicker(!showRecTemplatePicker)}
                          className="gap-1.5 text-xs"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Insert Template
                        </Button>
                        {showRecTemplatePicker && (
                          <div className="absolute top-9 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-80 max-h-64 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100">
                              <p className="text-xs font-medium text-slate-500 px-2">Click to append to recommendations</p>
                            </div>
                            {appSettings.recommendationTemplates.map(tpl => (
                              <button
                                key={tpl.id}
                                onClick={() => insertRecTemplate(tpl)}
                                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-slate-800 truncate">{tpl.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.text}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <EditableSection label="" value={recommendations} onChange={setRecommendations} childName={firstName} placeholder="Enter summary and recommendations..." rows={10} />
                  </>
                )}
              </>
            )}

            {/* ============================================================ */}
            {/* TEMPLATE: OT FEEDING EVALUATION                              */}
            {/* ============================================================ */}
            {template === 'feeding' && (
              <>
                <SectionHeader title="Referral Information" sectionKey="fd_referral" collapsed={collapsedSections} toggle={toggleSection} number="I" />
                {!collapsedSections.fd_referral && (
                  <EditableSection label="" value={referralInfo} onChange={setReferralInfo} childName={firstName} placeholder={`${firstName} was referred to the regional center due to concerns regarding ${pronoun(gender, 'possessive')} overall development. A developmental assessment is being completed to obtain present levels of performance and to determine eligibility for early intervention services.`} rows={4} />
                )}

                <SectionHeader title="Birth/Medical History" sectionKey="fd_medical" collapsed={collapsedSections} toggle={toggleSection} number="II" />
                {!collapsedSections.fd_medical && (
                  <EditableSection label="" value={medicalHistory} onChange={setMedicalHistory} childName={firstName} placeholder={`${firstName} was born full term via vaginal delivery at [Hospital], in [City], CA.\n\nFamily History: None reported.\nMedical History/Hospitalizations: \nMedications: N/A\nAllergies: None reported.\nMedical/Adaptive Equipment: N/A\nVision: There are no concerns reported at this time.\nHearing: Passed newborn hearing test`} rows={10} />
                )}

                <SectionHeader title="Testing Conditions and Behavior During Evaluation" sectionKey="fd_testing" collapsed={collapsedSections} toggle={toggleSection} number="III" />
                {!collapsedSections.fd_testing && (
                  <EditableSection label="" value={feedingTestingConditions} onChange={setFeedingTestingConditions} childName={firstName} placeholder={`${firstName} was seen at home with ${pronoun(gender, 'possessive')} caregiver present during the evaluation. ${Pronoun(gender, 'subject')} transitioned easily to a high chair for the meal. Behavior and performance observed during the assessment is reported to be typical. Therefore, this assessment is believed to be valid and reliable in regard to present levels of function in all areas.`} rows={6} />
                )}

                <SectionHeader title="Assessment Tools" sectionKey="fd_tools" collapsed={collapsedSections} toggle={toggleSection} number="IV" />
                {!collapsedSections.fd_tools && (
                  <div className="mb-4">
                    <ul className="list-disc list-inside text-sm font-serif text-slate-800 space-y-1 ml-4 mb-3">
                      <li>Clinical Observations</li>
                      <li>Parent Interview</li>
                      <li>Oral Motor Assessment</li>
                      {assessmentTools.filter(t => !['Clinical Observation', 'Parent/Caregiver Interview'].includes(t)).map((tool, i) => <li key={i}>{tool}</li>)}
                    </ul>
                    {formSelections.some(f => f.formId === 'dayc2' || f.formId === 'dayc2sp') && (
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-700 leading-relaxed">
                        <p><strong>Developmental Assessment of Young Children-Second Edition (DAYC-2):</strong> The DAYC-2 is a battery of five subtests that measures different but interrelated developmental abilities (cognitive, communication, social-emotional development, physical development, and adaptive behavior). This battery is designed for children from birth to 5 years, 11 months. For the purpose of this evaluation, the adaptive domain was utilized.</p>
                      </div>
                    )}
                    {formSelections.some(f => f.formId === 'bayley4') && (
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-700 leading-relaxed mt-2">
                        <p><strong>Bayley Scales of Infant and Toddler Development, Fourth Edition (Bayley-4):</strong> The Bayley-4 is a comprehensive developmental assessment for children ages 1-42 months. For the purpose of this evaluation, the adaptive behavior domain was utilized.</p>
                      </div>
                    )}
                  </div>
                )}

                <SectionHeader title="Testing Results" sectionKey="fd_results" collapsed={collapsedSections} toggle={toggleSection} number="V" />
                {!collapsedSections.fd_results && (
                  <div className="space-y-6 mb-6">
                    {/* Show only adaptive behavior scores */}
                    {dayc2Scores.filter(r => r.domain.toLowerCase().includes('adaptive')).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {dayc2ScoringMethod === 'bayley4ab' ? 'DAYC-2 (Bayley-4 Adaptive Behavior Scoring)' : 'DAYC-2'}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Domain</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">{dayc2ScoringMethod === 'bayley4ab' ? 'Scaled Score' : 'Standard Score'}</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Descriptive Term</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalency</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayc2Scores.filter(r => r.domain.toLowerCase().includes('adaptive')).map((row, i) => (
                                <tr key={i}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-mono">{row.rawScore}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-mono">{row.standardScore}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.descriptiveTerm}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.ageEquivalent}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.percentDelay}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {bayleyScores.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bayley-4</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 px-3 py-2 text-left font-bold">Domain</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Scaled Score</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalent</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bayleyScores.map((row, i) => (
                                <tr key={i}>
                                  <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-mono">{row.rawScore}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center font-mono">{row.scaledScore ?? '\u2014'}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.ageEquivalent}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">{row.percentDelay}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Adaptive Behavior Skills */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Adaptive Behavior Skills</h4>
                      {feedingAdaptiveItems.demonstrated.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-serif text-slate-800">
                            <strong>{firstName}</strong> demonstrated the following skills: {feedingAdaptiveItems.demonstrated.map(s => s.toLowerCase()).join('; ')}.
                          </p>
                        </div>
                      )}
                      {feedingAdaptiveItems.notDemonstrated.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-serif text-slate-800">
                            <strong>{firstName}</strong> did not demonstrate the following: {feedingAdaptiveItems.notDemonstrated.map(s => s.toLowerCase()).join('; ')}.
                          </p>
                        </div>
                      )}
                      {feedingAdaptiveItems.demonstrated.length === 0 && feedingAdaptiveItems.notDemonstrated.length === 0 && (
                        <p className="text-sm font-serif text-slate-400 italic">No adaptive behavior items scored yet. Complete the DAYC-2 or Bayley-4 adaptive domain to auto-populate this section.</p>
                      )}
                    </div>
                  </div>
                )}

                <SectionHeader title="Previous Feeding History" sectionKey="fd_prevhistory" collapsed={collapsedSections} toggle={toggleSection} number="" />
                {!collapsedSections.fd_prevhistory && (
                  <EditableSection label="" value={feedingPreviousHistory} onChange={setFeedingPreviousHistory} childName={firstName} placeholder={`Describe ${firstName}'s previous feeding history, including when solid foods were introduced, any history of breastfeeding/bottle feeding, feeding difficulties, tube feeding, etc.`} rows={5} />
                )}

                <SectionHeader title="Feeding/Oral Motor Skills" sectionKey="fd_oralmotor" collapsed={collapsedSections} toggle={toggleSection} number="VI" />
                {!collapsedSections.fd_oralmotor && (
                  <div className="space-y-5 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">a. Oral Structures</h4>
                      <EditableSection label="" value={feedingOralStructures} onChange={setFeedingOralStructures} childName={firstName} placeholder={`${firstName}'s facial structures are symmetrical. ${Pronoun(gender, 'possessive')} oral structures appear to be healthy and grossly intact as observed while ${pronoun(gender, 'subject')} was engaging in feeding.`} rows={4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">b. Feeding Behaviors</h4>
                      <FeedingBehaviorsChecklist
                        childName={firstName}
                        storageKey={childKey}
                        hasExistingContent={!!feedingBehaviors.trim()}
                        dateOfEval={formatDate(childInfo.testDate)}
                        examinerName={examinerInfo.name}
                        onInsertNarrative={(narrative, mode) => {
                          if (mode === 'replace') {
                            setFeedingBehaviors(narrative);
                            toast.success('Narrative replaced in Feeding Behaviors section');
                          } else {
                            setFeedingBehaviors(prev => {
                              const updated = prev ? prev + '\n\n' + narrative : narrative;
                              return updated;
                            });
                            toast.success('Narrative appended to Feeding Behaviors section');
                          }
                        }}
                      />
                      <EditableSection label="" value={feedingBehaviors} onChange={setFeedingBehaviors} childName={firstName} placeholder={`${firstName} demonstrates adequate readiness with feeding activity. Describe feeding behaviors observed during the evaluation (drooling, posture, ability to stay seated, finger feeding, etc.).`} rows={4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">c. Oral Motor Coordination</h4>
                      <FeedingPerformanceChecklist
                        childName={firstName}
                        storageKey={childKey}
                        hasExistingContent={!!feedingOralMotorCoord.trim()}
                        dateOfEval={formatDate(childInfo.testDate)}
                        examinerName={examinerInfo.name}
                        onInsertNarrative={(narrative, mode) => {
                          if (mode === 'replace') {
                            setFeedingOralMotorCoord(narrative);
                            toast.success('Narrative replaced in Oral Motor Coordination section');
                          } else {
                            setFeedingOralMotorCoord(prev => {
                              const updated = prev ? prev + '\n\n' + narrative : narrative;
                              return updated;
                            });
                            toast.success('Narrative appended to Oral Motor Coordination section');
                          }
                        }}
                      />
                      <EditableSection label="" value={feedingOralMotorCoord} onChange={setFeedingOralMotorCoord} childName={firstName} placeholder={`During the feeding evaluation, ${firstName} was provided with [foods]. Per clinical observation, describe tongue lateralization, chewing endurance, jaw strength, compensatory techniques, etc.`} rows={5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">d. Food Repertoire</h4>
                      <EditableSection label="" value={feedingFoodRepertoire} onChange={setFeedingFoodRepertoire} childName={firstName} placeholder={`${firstName} was introduced to solid foods around [age]. Per caregiver report, ${pronoun(gender, 'subject')} began with purees and is now eating [describe current foods]. Describe food preferences, textures accepted/refused, etc.`} rows={5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">e. Self-Feeding Skills</h4>
                      <SelfFeedingChecklist
                        childName={firstName}
                        storageKey={childKey}
                        hasExistingContent={!!feedingSelfFeeding.trim()}
                        dateOfEval={formatDate(childInfo.testDate)}
                        examinerName={examinerInfo.name}
                        onInsertNarrative={(narrative, mode) => {
                          if (mode === 'replace') {
                            setFeedingSelfFeeding(narrative);
                            toast.success('Narrative replaced in Self-Feeding Skills section');
                          } else {
                            setFeedingSelfFeeding(prev => {
                              const updated = prev ? prev + '\n\n' + narrative : narrative;
                              return updated;
                            });
                            toast.success('Narrative appended to Self-Feeding Skills section');
                          }
                        }}
                      />
                      <EditableSection label="" value={feedingSelfFeeding} onChange={setFeedingSelfFeeding} childName={firstName} placeholder={`${firstName} is able to finger feed ${pronoun(gender, 'object')}self independently. Describe hand-eye coordination, utensil use, cup drinking ability, etc.`} rows={4} />
                    </div>
                  </div>
                )}

                <SectionHeader title="Drinking" sectionKey="fd_drinking" collapsed={collapsedSections} toggle={toggleSection} number="" />
                {!collapsedSections.fd_drinking && (
                  <div>
                    <DrinkingChecklist
                      childName={firstName}
                      storageKey={childKey}
                      hasExistingContent={!!feedingDrinking.trim()}
                      dateOfEval={formatDate(childInfo.testDate)}
                      examinerName={examinerInfo.name}
                      onInsertNarrative={(narrative, mode) => {
                        if (mode === 'replace') {
                          setFeedingDrinking(narrative);
                          toast.success('Narrative replaced in Drinking section');
                        } else {
                          setFeedingDrinking(prev => {
                            const updated = prev ? prev + '\n\n' + narrative : narrative;
                            return updated;
                          });
                          toast.success('Narrative appended to Drinking section');
                        }
                      }}
                    />
                    <EditableSection label="" value={feedingDrinking} onChange={setFeedingDrinking} childName={firstName} placeholder={`Describe ${firstName}'s drinking skills, including bottle use, sippy cup, straw cup, open cup, liquid preferences, and any difficulties with drinking.`} rows={5} />
                  </div>
                )}

                <SectionHeader title="Sensory Processing" sectionKey="fd_sensory" collapsed={collapsedSections} toggle={toggleSection} number="VII" />
                {!collapsedSections.fd_sensory && (
                  <div className="space-y-5 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">a. Vestibular Processing and Modulation</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-600 mb-2 leading-relaxed">
                        The vestibular system is located in the inner ear and has the primary function of giving the brain information about head position and movement in relation to gravity. It is responsible in part for head stability, muscle tone, postural control, balance and equilibrium reaction and the development of eye-hand coordination and bilateral integration.
                      </div>
                      <EditableSection label="" value={feedingVestibular} onChange={setFeedingVestibular} childName={firstName} placeholder={`${firstName} demonstrated [describe vestibular processing observations, trunk control, balance, etc.].`} rows={3} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">b. Proprioceptive Processing and Modulation</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-600 mb-2 leading-relaxed">
                        The proprioceptive system is a system of receptors found in the joints and muscle tissues that gives an internal awareness of limb and body position, position relative to the environment, information about joint and muscle movement, as well as the force and speed at which the muscles are moving.
                      </div>
                      <EditableSection label="" value={feedingProprioceptive} onChange={setFeedingProprioceptive} childName={firstName} placeholder={`${firstName} demonstrates [describe proprioceptive processing, grading of force, body awareness, impact on feeding].`} rows={3} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">c. Tactile Processing and Modulation</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-serif text-slate-600 mb-2 leading-relaxed">
                        The sense of touch. The tactile system is involved with the identification and localization of touch and the discrimination of shapes, sizes, and textures of materials.
                      </div>
                      <EditableSection label="" value={feedingTactile} onChange={setFeedingTactile} childName={firstName} placeholder={`Per caregiver report, ${firstName} [describe tactile processing, messy play tolerance, texture sensitivity, etc.].`} rows={3} />
                    </div>
                  </div>
                )}

                <SectionHeader title="Neuromuscular / Musculoskeletal" sectionKey="fd_neuro" collapsed={collapsedSections} toggle={toggleSection} number="VIII" />
                {!collapsedSections.fd_neuro && (
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm font-serif">
                      <span className="font-bold text-slate-700">Range of Motion:</span>
                      <EditableSection label="" value={feedingROM} onChange={setFeedingROM} childName={firstName} rows={1} />
                    </div>
                    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm font-serif">
                      <span className="font-bold text-slate-700">Muscle Strength:</span>
                      <EditableSection label="" value={feedingMuscleStrength} onChange={setFeedingMuscleStrength} childName={firstName} rows={1} />
                    </div>
                    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm font-serif">
                      <span className="font-bold text-slate-700">Muscle Tone:</span>
                      <EditableSection label="" value={feedingMuscleTone} onChange={setFeedingMuscleTone} childName={firstName} rows={1} />
                    </div>
                    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm font-serif">
                      <span className="font-bold text-slate-700">Postural Stability:</span>
                      <EditableSection label="" value={feedingPosturalStability} onChange={setFeedingPosturalStability} childName={firstName} rows={1} />
                    </div>
                  </div>
                )}

                <SectionHeader title="Summary" sectionKey="fd_summary" collapsed={collapsedSections} toggle={toggleSection} number="IX" />
                {!collapsedSections.fd_summary && (
                  <>
                    <div className="mb-2 flex flex-wrap gap-2 no-print">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiRecommendations}
                        disabled={generatingRecs}
                        className="gap-1.5 text-xs bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
                      >
                        {generatingRecs ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                        ) : (
                          <><WandSparkles className="w-3.5 h-3.5" /> AI Generate Recommendations</>
                        )}
                      </Button>
                      {generatingRecs && (
                        <Button variant="ghost" size="sm" onClick={() => recsAbortRef.current?.abort()} className="text-xs text-red-500 hover:text-red-700">
                          Cancel
                        </Button>
                      )}
                    {appSettings.recommendationTemplates.length > 0 && (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRecTemplatePicker(!showRecTemplatePicker)}
                          className="gap-1.5 text-xs"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Insert Template
                        </Button>
                        {showRecTemplatePicker && (
                          <div className="absolute top-9 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-80 max-h-64 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100">
                              <p className="text-xs font-medium text-slate-500 px-2">Click to append to summary</p>
                            </div>
                            {appSettings.recommendationTemplates.map(tpl => (
                              <button
                                key={tpl.id}
                                onClick={() => { setFeedingSummary(prev => prev ? prev + '\n\n' + tpl.text : tpl.text); setShowRecTemplatePicker(false); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-slate-800 truncate">{tpl.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.text}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <EditableSection label="" value={feedingSummary} onChange={setFeedingSummary} childName={firstName} placeholder={`${firstName} is a [age] old [boy/girl] who was referred for difficulty with feeding development and feeding skills. Describe key findings and recommendations...\n\nIt is recommended that the IFSP team consider the following and make the final determination of eligibility and services:\n\n1. Occupational therapy feeding is recommended to address delays in oral motor skills impacting age-appropriate feeding.\n2. Occupational Therapy is recommended to work on fine motor skills and body awareness to support overall participation in adaptive skills, specifically feeding.`} rows={12} />
                  </>
                )}

                {/* Print All Checklists master button */}
                <div className="mt-6 pt-4 border-t border-dashed border-slate-300 no-print">
                  <Button
                    onClick={() => {
                      // Load all four checklist datasets from localStorage
                      let oralMotorData: FeedingChecklistDataType | null = null;
                      let feedingBehaviorsDataLocal: FeedingBehaviorsData | null = null;
                      let selfFeedingDataLocal: SelfFeedingData | null = null;
                      let drinkingDataLocal: DrinkingData | null = null;
                      try {
                        const om = localStorage.getItem(`feeding-checklist-${childKey}`);
                        if (om) oralMotorData = JSON.parse(om);
                      } catch { /* */ }
                      try {
                        const fb = localStorage.getItem(`feeding-behaviors-${childKey}`);
                        if (fb) feedingBehaviorsDataLocal = JSON.parse(fb);
                      } catch { /* */ }
                      try {
                        const sf = localStorage.getItem(`self-feeding-${childKey}`);
                        if (sf) selfFeedingDataLocal = JSON.parse(sf);
                      } catch { /* */ }
                      try {
                        const dk = localStorage.getItem(`drinking-checklist-${childKey}`);
                        if (dk) drinkingDataLocal = JSON.parse(dk);
                      } catch { /* */ }
                      if (!oralMotorData && !feedingBehaviorsDataLocal && !selfFeedingDataLocal && !drinkingDataLocal) {
                        toast.error('No checklist data found. Please fill out at least one checklist first.');
                        return;
                      }
                      generateAllChecklistsPdf({
                        childName: firstName,
                        dateOfEval: formatDate(childInfo.testDate),
                        examinerName: examinerInfo.name,
                        oralMotorData,
                        feedingBehaviorsData: feedingBehaviorsDataLocal,
                        selfFeedingData: selfFeedingDataLocal,
                        drinkingData: drinkingDataLocal,
                      });
                      toast.success('All checklists exported as a combined PDF');
                    }}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print All Checklists (Combined PDF)
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1.5">Exports Oral Motor, Feeding Behaviors, Self-Feeding, and Drinking checklists into a single multi-page PDF.</p>
                </div>
              </>
            )}

            {/* ===== CLOSING (both templates) ===== */}
            <div className="border-t border-slate-300 pt-4 mt-6">
              <EditableSection label="" value={closingNote} onChange={setClosingNote} childName={firstName} rows={2} />
            </div>

            {/* ===== SIGNATURE ===== */}
            <div className="mt-8 pt-4 border-t border-slate-300">
              <p className="text-sm font-serif text-slate-800">{examinerInfo.name}</p>
              <p className="text-sm font-serif text-slate-600">{examinerInfo.title}</p>
              <p className="text-sm font-serif text-slate-600">{examinerInfo.agency}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
