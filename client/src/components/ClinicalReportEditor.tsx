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
import { lookupDAYC2WithBayley4AB, computeDAYC2BayleyComposites, type CompositeResult } from '@/lib/bayley4AdaptiveSE';
import { lookupREEL3AbilityScore, lookupREEL3PercentileRank, lookupREEL3DescriptiveTerm } from '@/lib/reel3ScoringTables';
import { SP2_ENGLISH_CUTOFFS, SP2_BIRTH6MO_CUTOFFS, SP2_QUADRANT_MAP, getSP2Description } from '@/lib/sensoryProfileData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, FileText, ChevronDown, ChevronUp, Pencil, Check, RotateCcw, Save, Eye, EyeOff, LayoutTemplate, FileDown, BookmarkPlus, FileOutput } from 'lucide-react';
import { generateDocxReport, type DocxReportData, type DomainNarrativeData as DocxDomainNarrative } from '@/lib/generateDocx';
import { generatePdfReport } from '@/lib/generateReportPdf';
import { loadAppSettings, type RecommendationTemplate } from '@/components/SettingsPreferences';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { parseLocalDate, formatDateLocal, calculateAge } from '@/lib/dateUtils';

// ============================================================
// Types & Constants
// ============================================================

type ReportTemplate = 'developmental' | 'sensory';

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
  // SI-specific
  testingConditions: string;
  validityStatement: string;
  quadrantNarratives: Record<string, string>;
  sectionNarratives: Record<string, string>;
  siSummary: string;
  childKey: string;
  savedAt: string;
}

function getChildKey(childInfo: ChildInfo): string {
  return `${childInfo.firstName}_${childInfo.lastName}_${childInfo.dob}_${childInfo.testDate}`;
}

// ============================================================
// EditableSection
// ============================================================

function EditableSection({
  label, value, onChange, placeholder, rows = 4,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const isHeader = !label;
  return (
    <div className="mb-4">
      {label ? (
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{label}</h3>
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 print:hidden">
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      ) : (
        <div className="flex justify-end mb-1 print:hidden">
          <button onClick={() => setEditing(!editing)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
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
          className={`leading-relaxed font-serif text-slate-800 whitespace-pre-wrap cursor-text hover:bg-slate-50 rounded-md p-2 -m-2 min-h-[2rem] ${isHeader ? 'text-center text-lg font-bold' : 'text-sm'}`}
        >
          {value || <span className="text-slate-400 italic">{placeholder || 'Click to edit...'}</span>}
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
    if (score === 2) demonstrated.push(item.description);
    else if (score === 0) notDemonstrated.push(item.description);
    else if (score === 1) emerging.push(item.description);
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
    if (score === 1) demonstrated.push(item.description);
    else if (score === 0) notDemonstrated.push(item.description);
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
    // Items have a quadrant field from the SP2 data
    const quadrantAbbr = (item as any).quadrant || '';
    const quadrantKey = SP2_QUADRANT_MAP[quadrantAbbr] || SP2_QUADRANT_MAP[quadrantAbbr.replace(/\./g, '')] || '';
    if (quadrantKey && quadrantKey !== 'none' && quadrantTotals[quadrantKey] !== undefined) {
      quadrantTotals[quadrantKey] += score;
    }
  }

  // Compute section scores by item number ranges (Toddler SP2 standard ranges)
  const sectionRanges: Record<string, [number, number]> = isBirth6mo
    ? { general: [1, 10], auditory: [11, 16], visual: [17, 22], touch: [23, 28], movement: [29, 33], oral: [34, 38], behavioral: [39, 44] }
    : { general: [1, 10], auditory: [11, 17], visual: [18, 23], touch: [24, 29], movement: [30, 34], oral: [35, 41], behavioral: [42, 48] };

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
  const sCutoffs = (cutoffsData as any).sections || {};
  for (const [key, label] of Object.entries(SECTION_LABELS)) {
    const range = sectionRanges[key];
    if (!range) continue;
    let raw = 0;
    for (let n = range[0]; n <= range[1]; n++) {
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

  // Save state
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(savedReport?.savedAt ?? null);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveReport = useCallback(() => {
    const reportState: SavedReportState = {
      template, referralInfo, medicalHistory, parentConcerns, clinicalObservation,
      feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName,
      reportTitle, domainOverrides, scoreOverrides, testingConditions, validityStatement,
      quadrantNarratives, sectionNarratives, siSummary, childKey,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportState));
      setLastSavedAt(reportState.savedAt);
      setIsDirty(false);
    } catch { /* localStorage full */ }
  }, [template, referralInfo, medicalHistory, parentConcerns, clinicalObservation, feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName, reportTitle, domainOverrides, scoreOverrides, testingConditions, validityStatement, quadrantNarratives, sectionNarratives, siSummary, childKey]);

  useEffect(() => { setIsDirty(true); }, [template, referralInfo, medicalHistory, parentConcerns, clinicalObservation, feedingOralMotor, sensoryNarrative, recommendations, closingNote, practiceName, reportTitle, domainOverrides, scoreOverrides, testingConditions, validityStatement, quadrantNarratives, sectionNarratives, siSummary]);

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
  interface Dayc2ScoreRow { domain: string; rawScore: number; standardScore: string; descriptiveTerm: string; ageEquivalent: string; percentDelay: string; scoringMethod?: 'native' | 'bayley4ab'; }
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

      let pctDelay = '—';
      if (ageEq !== 'N/A') {
        const aeMonths = parseInt(ageEq) || 0;
        if (ageMonthsVal > 0 && aeMonths < ageMonthsVal) pctDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
        else if (aeMonths >= ageMonthsVal) pctDelay = '0%';
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
      let pctDelay = '';
      if (ageMonthsVal > 0 && aeMonths !== null && aeMonths < ageMonthsVal) pctDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
      else if (aeMonths !== null && aeMonths >= ageMonthsVal) pctDelay = '0%';

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
            if (ageMonthsVal > 0 && aeMonths < ageMonthsVal) {
              percentDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
            } else if (aeMonths >= ageMonthsVal) {
              percentDelay = '0%';
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
            if (ageMonthsVal > 0 && aeMonths < ageMonthsVal) {
              percentDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
            } else if (aeMonths >= ageMonthsVal) {
              percentDelay = '0%';
            }
          }
        }
      }

      return { domain: domain.name, rawScore, standardScore, descriptiveTerm, ageEquivalent, percentDelay, scoringMethod: useBayley4AB ? 'bayley4ab' : 'native' };
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
          if (ageMonthsVal > 0 && aeMonths < ageMonthsVal) {
            percentDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
          } else if (aeMonths >= ageMonthsVal) {
            percentDelay = '0%';
          }
        }
      }

      return { domain: domain.name, rawScore, standardScore, descriptiveTerm, ageEquivalent, percentDelay, scoringMethod: alternateMethod };
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
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    }
  }, [collapsedSections, childName, template]);

  const handleManualSave = useCallback(() => {
    saveReport();
    toast.success('Report saved successfully');
  }, [saveReport]);

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
            narrativeText: overrideText !== undefined ? overrideText : autoText,
            notDemonstratedItems: narrative.allNotDemonstrated,
          };
        });

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
        quadrantNarratives,
        sectionNarratives,
      };

      await generateDocxReport(data);
      toast.success('Word document downloaded successfully');
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error('Failed to generate Word document');
    }
  }, [
    template, practiceName, reportTitle, examinerInfo, childName, firstName, childInfo,
    chronAge, adjAge, referralInfo, medicalHistory, parentConcerns, assessmentTools,
    closingNote, recommendations, clinicalObservation, bayleyScores, bayleyCogComposite,
    bayleyMotorComposite, dayc2Scores, reel3Scores, domainNarratives, domainOverrides,
    gender, feedingOralMotor, sensoryNarrative, summaryOfDevelopment, testingConditions,
    validityStatement, sp2Scores, quadrantNarratives, sectionNarratives, scoreOverrides,
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
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:hidden">
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
              {showTemplateSelector && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden">
                  {(Object.keys(TEMPLATE_INFO) as ReportTemplate[]).map(t => (
                    <button
                      key={t}
                      onClick={() => handleTemplateSwitch(t)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${template === t ? 'bg-teal-50 border-l-2 border-l-teal-600' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{TEMPLATE_INFO[t].label}</span>
                        {template === t && <span className="text-xs text-teal-700 font-medium">Active</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{TEMPLATE_INFO[t].description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="w-4 h-4 mr-1" /> Save
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
              if (confirm('Start a new assessment? Make sure you have saved the current one first.')) {
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
                  <EditableSection label="" value={practiceName} onChange={setPracticeName} rows={1} />
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
            <EditableSection label="" value={reportTitle} onChange={setReportTitle} rows={1} />

            {/* ===== CLIENT INFO TABLE ===== */}
            <div className="border border-slate-300 rounded-md overflow-hidden mb-6">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700 w-48 bg-slate-50">CLIENT'S NAME:</td>
                    <td className="px-4 py-2 text-slate-900">{childName.toUpperCase()}</td>
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
                  <EditableSection label="" value={referralInfo} onChange={setReferralInfo} placeholder="Enter referral information..." rows={3} />
                )}

                <SectionHeader title="Birth/Medical History" sectionKey="medical" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.medical && (
                  <EditableSection label="" value={medicalHistory} onChange={setMedicalHistory} placeholder="Enter birth and medical history details..." rows={6} />
                )}

                <SectionHeader title="Parent's Concerns" sectionKey="concerns" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.concerns && (
                  <EditableSection label="" value={parentConcerns} onChange={setParentConcerns} placeholder="Enter parent/caregiver concerns..." rows={4} />
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
                  <EditableSection label="" value={clinicalObservation} onChange={setClinicalObservation} placeholder={`Enter clinical observations about ${firstName}'s behavior, state control, regulation, and interaction during the assessment...`} rows={6} />
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
                              {bayleyCogComposite && (
                                <tr className="bg-blue-50 font-semibold">
                                  <td className="border border-slate-400 px-3 py-2">Cognitive Composite</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">—</td>
                                  <EditableCell value={bayleyCogComposite.scaledScore} overrideKey="bayley4_cogComposite_scaledScore" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={`SS: ${bayleyCogComposite.standardScore}`} overrideKey="bayley4_cogComposite_standardScore" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={`PR: ${bayleyCogComposite.percentile}`} overrideKey="bayley4_cogComposite_percentile" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                </tr>
                              )}
                              {bayleyMotorComposite && (
                                <tr className="bg-green-50 font-semibold">
                                  <td className="border border-slate-400 px-3 py-2">Motor Composite</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center">—</td>
                                  <EditableCell value={bayleyMotorComposite.sumScaled} overrideKey="bayley4_motorComposite_scaledScore" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={`SS: ${bayleyMotorComposite.standardScore}`} overrideKey="bayley4_motorComposite_standardScore" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                  <EditableCell value={`PR: ${bayleyMotorComposite.percentile}`} overrideKey="bayley4_motorComposite_percentile" overrides={scoreOverrides} setOverrides={setScoreOverrides} />
                                </tr>
                              )}
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
                          <div className="mt-3">
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
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">90% CI</th>
                                <th className="border border-slate-400 px-3 py-2 text-center font-bold">95% CI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayc2BayleyComposites.map((comp, i) => (
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
                                  <td className="border border-slate-400 px-3 py-2 text-center text-[10px]">{comp.confidence90}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center text-[10px]">{comp.confidence95}</td>
                                </tr>
                              ))}
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
                          {formId === 'bayley4' && narrative.scaledScore !== null && (
                            <p className="text-sm font-serif text-slate-700 mb-2">
                              <strong>{firstName} obtained a raw score of {narrative.rawScore} with a scaled score of {narrative.scaledScore}.</strong>
                            </p>
                          )}
                          <EditableSection label="" value={isOverridden ? overrideText : autoText} onChange={(v) => setDomainOverrides(prev => ({ ...prev, [key]: v }))} placeholder="Domain narrative..." rows={6} />
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
                  <EditableSection label="" value={feedingOralMotor} onChange={setFeedingOralMotor} placeholder="Enter feeding and oral motor observations (texture progression, self-feeding, straw cup, open cup, positioning)..." rows={5} />
                )}

                {/* Sensory Processing (brief) */}
                <SectionHeader title="Sensory Processing" sectionKey="sensory" collapsed={collapsedSections} toggle={toggleSection} />
                {!collapsedSections.sensory && (
                  <EditableSection label="" value={sensoryNarrative} onChange={setSensoryNarrative} placeholder="Enter sensory processing observations..." rows={8} />
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
                    {appSettings.recommendationTemplates.length > 0 && (
                      <div className="mb-2 relative">
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
                    <EditableSection label="" value={recommendations} onChange={setRecommendations} placeholder="Enter recommendations..." rows={10} />
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
                  <EditableSection label="" value={medicalHistory} onChange={setMedicalHistory} placeholder="Enter birth and medical history (born full term/preterm, delivery method, hospital, NICU stay, health history, allergies, medications)..." rows={6} />
                )}

                <SectionHeader title="Referral Information" sectionKey="si_referral" collapsed={collapsedSections} toggle={toggleSection} number="II" />
                {!collapsedSections.si_referral && (
                  <EditableSection label="" value={referralInfo} onChange={setReferralInfo} placeholder="This evaluation is being completed to assess eligibility for Early Start Services..." rows={3} />
                )}

                <SectionHeader title="Parent's Concerns" sectionKey="si_concerns" collapsed={collapsedSections} toggle={toggleSection} number="III" />
                {!collapsedSections.si_concerns && (
                  <EditableSection label="" value={parentConcerns} onChange={setParentConcerns} placeholder="Enter parent/caregiver concerns..." rows={4} />
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
                  <EditableSection label="" value={testingConditions} onChange={setTestingConditions} placeholder={`The assessment was completed in-home with ${childName} and caregiver present...`} rows={5} />
                )}

                <SectionHeader title="Validity of Assessment Findings" sectionKey="si_validity" collapsed={collapsedSections} toggle={toggleSection} number="VI" />
                {!collapsedSections.si_validity && (
                  <EditableSection label="" value={validityStatement} onChange={setValidityStatement} placeholder="Behavior and performance observed during the assessment is reported to be typical..." rows={2} />
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
                            const defaultNarrative = `${firstName} ${q.description.toLowerCase().includes('just like') ? 'uses sensory input just like the majority of others' : q.description.toLowerCase().includes('more') ? `demonstrates ${q.description.toLowerCase()} sensory ${q.key} behaviors compared to peers` : `demonstrates ${q.description.toLowerCase()} sensory ${q.key} behaviors`} to ${q.key === 'seeking' ? 'gather information necessary for participation' : q.key === 'avoiding' ? 'manage sensory input for participation' : q.key === 'sensitivity' ? 'detect sensory input that enables participation' : 'notice sensory input to support participation'}.`;
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
                            const defaultNarrative = `(${s.description}) ${firstName}'s ${s.name.toLowerCase()} processing appears to be ${s.description.toLowerCase().includes('just like') ? 'within functional limits' : s.description.toLowerCase().includes('more') ? 'an area of concern' : 'within expected range'}.`;
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
                    {appSettings.recommendationTemplates.length > 0 && (
                      <div className="mb-2 relative">
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
                    <EditableSection label="" value={recommendations} onChange={setRecommendations} placeholder="Enter summary and recommendations..." rows={10} />
                  </>
                )}
              </>
            )}

            {/* ===== CLOSING (both templates) ===== */}
            <div className="border-t border-slate-300 pt-4 mt-6">
              <EditableSection label="" value={closingNote} onChange={setClosingNote} rows={2} />
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
