/**
 * ClinicalReportEditor
 * 
 * Post-assessment clinical narrative report generator.
 * Auto-populates scoring tables, domain narratives (demonstrated/not demonstrated),
 * and provides editable sections for clinical observations, medical history, etc.
 * Based on OT Developmental Intake report templates.
 */

import { useMultiAssessment, type ChildInfo, type ExaminerInfo } from '@/contexts/MultiAssessmentContext';
import { getFormById, type FormDefinition, type UnifiedDomain } from '@/lib/formRegistry';
import { lookupScaledScore, lookupAgeEquivalent, lookupGrowthScaleValue, lookupStandardScore } from '@/lib/scoringTables';
import { REEL3_AGE_EQUIVALENT } from '@/lib/reel3Data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, FileText, ChevronDown, ChevronUp, Pencil, Check, RotateCcw } from 'lucide-react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// ============================================================
// Helpers
// ============================================================

function calculateAgeInDays(dob: string, testDate: string, premWeeks: number): number | null {
  if (!dob || !testDate) return null;
  const birth = new Date(dob);
  const test = new Date(testDate);
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
  const birth = new Date(dob);
  const test = new Date(testDate);
  let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
  let days = test.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
    days += prevMonth.getDate();
  }
  return `${months} months, ${days} days`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function pronoun(gender: string, type: 'subject' | 'object' | 'possessive'): string {
  const g = gender.toLowerCase();
  if (g === 'male' || g === 'm') {
    return type === 'subject' ? 'he' : type === 'object' ? 'him' : 'his';
  }
  if (g === 'female' || g === 'f') {
    return type === 'subject' ? 'she' : type === 'object' ? 'her' : 'her';
  }
  return type === 'subject' ? 'they' : type === 'object' ? 'them' : 'their';
}

function Pronoun(gender: string, type: 'subject' | 'object' | 'possessive'): string {
  const p = pronoun(gender, type);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

const bayleyDomainKey: Record<string, 'CG' | 'FM' | 'GM' | null> = {
  cognitive: 'CG',
  receptiveCommunication: null,
  expressiveCommunication: null,
  fineMotor: 'FM',
  grossMotor: 'GM',
};

// ============================================================
// Editable Text Section
// ============================================================

function EditableSection({ 
  label, 
  value, 
  onChange, 
  placeholder,
  rows = 4 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  rows?: number;
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
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{label}</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 print:hidden"
          >
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      )}
      {!label && (
        <div className="flex justify-end mb-1 print:hidden">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      )}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
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
// Auto-generated Domain Narratives
// ============================================================

interface DomainNarrative {
  domainName: string;
  ageEquivalent: string;
  rawScore: number;
  scaledScore: number | null;
  demonstratedItems: string[];
  notDemonstratedItems: string[];
  emergingItems: string[];
}

function generateBayleyNarrative(
  domain: UnifiedDomain,
  scores: Record<number, number | null>,
  ageInDays: number | null,
  childName: string,
): DomainNarrative {
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

  // Get items in order, skip auto-scored items at the beginning
  const sortedItems = [...domain.items].sort((a, b) => a.number - b.number);
  
  for (const item of sortedItems) {
    const score = scores[item.number];
    if (score === 2) {
      demonstrated.push(item.description);
    } else if (score === 0) {
      notDemonstrated.push(item.description);
    } else if (score === 1) {
      emerging.push(item.description);
    }
  }

  // Per the tester's video: pick 3-5 consecutive high-scoring items for "demonstrated"
  // and list zeros for "not demonstrated"
  const recentDemonstrated = demonstrated.slice(-5);
  const recentNotDemonstrated = notDemonstrated.slice(0, 5);

  return {
    domainName: domain.name,
    ageEquivalent: ageEq,
    rawScore,
    scaledScore,
    demonstratedItems: recentDemonstrated,
    notDemonstratedItems: recentNotDemonstrated,
    emergingItems: emerging.slice(-3),
  };
}

function generateBinaryNarrative(
  domain: UnifiedDomain,
  scores: Record<number, number | null>,
  childName: string,
): DomainNarrative {
  const rawScore = Object.values(scores).reduce((sum: number, s) => sum + (s || 0), 0);
  const demonstrated: string[] = [];
  const notDemonstrated: string[] = [];

  const sortedItems = [...domain.items].sort((a, b) => a.number - b.number);
  for (const item of sortedItems) {
    const score = scores[item.number];
    if (score === 1) {
      demonstrated.push(item.description);
    } else if (score === 0) {
      notDemonstrated.push(item.description);
    }
  }

  return {
    domainName: domain.name,
    ageEquivalent: 'N/A',
    rawScore,
    scaledScore: null,
    demonstratedItems: demonstrated.slice(-5),
    notDemonstratedItems: notDemonstrated.slice(0, 5),
    emergingItems: [],
  };
}

// ============================================================
// Main Component
// ============================================================

export default function ClinicalReportEditor() {
  const { state, dispatch, getRawScore } = useMultiAssessment();
  const { childInfo, examinerInfo, formSelections, formStates } = state;
  const childName = `${childInfo.firstName} ${childInfo.lastName}`.trim() || 'Child';
  const firstName = childInfo.firstName || 'Child';
  const gender = childInfo.gender || '';
  const premWeeks = childInfo.premature ? childInfo.weeksPremature : 0;

  const ageInDays = useMemo(() => 
    calculateAgeInDays(childInfo.dob, childInfo.testDate, premWeeks),
    [childInfo.dob, childInfo.testDate, premWeeks]
  );

  const chronAge = useMemo(() => formatAgeDisplay(childInfo.dob, childInfo.testDate), [childInfo]);
  const adjAge = useMemo(() => {
    if (!childInfo.premature || !childInfo.weeksPremature) return null;
    const birth = new Date(childInfo.dob);
    const adjusted = new Date(birth.getTime() + childInfo.weeksPremature * 7 * 86400000);
    return formatAgeDisplay(adjusted.toISOString().split('T')[0], childInfo.testDate);
  }, [childInfo]);

  // ============================================================
  // Editable report sections state
  // ============================================================
  const [referralInfo, setReferralInfo] = useState(() => 
    `${childName} was referred to the regional center due to concerns regarding ${pronoun(gender, 'possessive')} overall development. A developmental assessment is being completed to obtain present levels of performance and to determine eligibility for early intervention services.`
  );
  const [medicalHistory, setMedicalHistory] = useState('');
  const [parentConcerns, setParentConcerns] = useState('');
  const [clinicalObservation, setClinicalObservation] = useState('');
  const [feedingOralMotor, setFeedingOralMotor] = useState('');
  const [sensoryNarrative, setSensoryNarrative] = useState(() => {
    const sub = Pronoun(gender, 'subject');
    return `Auditory System: Appears to be within functional limits. ${childName} responded to auditory stimulus by turning ${pronoun(gender, 'possessive')} head toward sound.\n\nVisual System: Appears to be within functional limits. ${childName} demonstrated fair eye contact with the evaluator.\n\nTactile System: Appears to be within functional limits. ${childName} is able to tolerate a wide variety of textures at this time.\n\nProprioceptive System: Appears to be within functional limits. ${childName} demonstrates good motor planning skills.\n\nVestibular System: Appears to be within functional limits. ${childName} demonstrated good righting reactions during play.`;
  });
  const [recommendations, setRecommendations] = useState('');
  const [closingNote, setClosingNote] = useState(() =>
    `Thank you for this referral. It was a pleasure to work with ${childName} and ${pronoun(gender, 'possessive')} family. Please feel free to contact me with any additional questions and/or concerns.`
  );

  // Practice/agency header
  const [practiceName, setPracticeName] = useState(examinerInfo.agency || 'Practice Name');
  const [reportTitle, setReportTitle] = useState('Occupational Therapy Developmental Intake Assessment');

  // Domain-level editable narratives (overrides for auto-generated text)
  const [domainOverrides, setDomainOverrides] = useState<Record<string, string>>({});

  // ============================================================
  // Compute scoring data for all forms
  // ============================================================

  interface BayleyScoreRow {
    domain: string;
    domainLocalId: string;
    rawScore: number;
    scaledScore: number | null;
    ageEquivalent: string;
    gsv: number | null;
    percentDelay: string;
  }

  interface Dayc2ScoreRow {
    domain: string;
    rawScore: number;
    standardScore: string;
    descriptiveTerm: string;
    ageEquivalent: string;
    percentDelay: string;
  }

  interface Reel3ScoreRow {
    domain: string;
    rawScore: number;
    ageEquivalent: string;
    percentDelay: string;
  }

  const bayleyScores = useMemo((): BayleyScoreRow[] => {
    const fs = formSelections.find(f => f.formId === 'bayley4');
    if (!fs) return [];
    const formState = formStates['bayley4'];
    if (!formState) return [];
    const form = getFormById('bayley4');
    if (!form) return [];

    const ageMonths = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
    const quarterDelay = Math.floor(ageMonths * 0.75);

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

      // Parse age equivalent months for % delay
      let pctDelay = '—';
      if (ageEq !== 'N/A') {
        const aeMonths = parseInt(ageEq) || 0;
        if (ageMonths > 0 && aeMonths < ageMonths) {
          pctDelay = `${Math.round(((ageMonths - aeMonths) / ageMonths) * 100)}%`;
        } else if (aeMonths >= ageMonths) {
          pctDelay = '0%';
        }
      }

      return {
        domain: domain.name,
        domainLocalId,
        rawScore,
        scaledScore,
        ageEquivalent: ageEq,
        gsv,
        percentDelay: pctDelay,
      };
    }).filter(Boolean) as BayleyScoreRow[];
  }, [formSelections, formStates, ageInDays, childInfo, premWeeks]);

  // Bayley composite
  const bayleyComposite = useMemo(() => {
    const fmRow = bayleyScores.find(r => r.domainLocalId === 'fineMotor');
    const gmRow = bayleyScores.find(r => r.domainLocalId === 'grossMotor');
    if (!fmRow || !gmRow || fmRow.scaledScore === null || gmRow.scaledScore === null) return null;
    const sumScaled = fmRow.scaledScore + gmRow.scaledScore;
    const result = lookupStandardScore(sumScaled, 'MOT');
    if (!result) return null;
    return { sumScaled, standardScore: result.standardScore, percentile: result.percentileRank };
  }, [bayleyScores]);

  const cogComposite = useMemo(() => {
    const cgRow = bayleyScores.find(r => r.domainLocalId === 'cognitive');
    if (!cgRow || cgRow.scaledScore === null) return null;
    const result = lookupStandardScore(cgRow.scaledScore, 'COG');
    if (!result) return null;
    return { standardScore: result.standardScore, percentile: result.percentileRank };
  }, [bayleyScores]);

  // REEL-3 scores
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

      // REEL-3 age equivalent lookup
      const aeEntry = REEL3_AGE_EQUIVALENT.find(e => {
        const key = domainLocalId === 'receptive' ? 'receptive' : 'expressive';
        return (e as any)[key] === rawScore;
      });
      const aeMonths = aeEntry ? (aeEntry as any).ageMonths : null;
      const ageEq = aeMonths !== null ? `${aeMonths} months` : 'N/A';

      let pctDelay = '';
      if (ageMonthsVal > 0 && aeMonths !== null && aeMonths < ageMonthsVal) {
        pctDelay = `${Math.round(((ageMonthsVal - aeMonths) / ageMonthsVal) * 100)}%`;
      } else if (aeMonths !== null && aeMonths >= ageMonthsVal) {
        pctDelay = '0%';
      }

      return {
        domain: domain.name,
        rawScore,
        ageEquivalent: ageEq,
        percentDelay: pctDelay,
      };
    }).filter(Boolean) as Reel3ScoreRow[];
  }, [formSelections, formStates, childInfo, premWeeks]);

  // DAYC-2 scores
  const dayc2Scores = useMemo((): Dayc2ScoreRow[] => {
    const fs = formSelections.find(f => f.formId === 'dayc2' || f.formId === 'dayc2sp');
    if (!fs) return [];
    const formState = formStates[fs.formId];
    if (!formState) return [];
    const form = getFormById(fs.formId);
    if (!form) return [];
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);

    return fs.selectedDomainIds.map(domainLocalId => {
      const domain = form.domains.find(d => d.localId === domainLocalId);
      if (!domain) return null;
      const ds = formState.domains[domainLocalId];
      if (!ds) return null;
      const rawScore = Object.values(ds.scores).reduce((sum: number, s) => sum + (s || 0), 0);

      return {
        domain: domain.name,
        rawScore,
        standardScore: '—',
        descriptiveTerm: '—',
        ageEquivalent: '— months',
        percentDelay: '—',
      };
    }).filter(Boolean) as Dayc2ScoreRow[];
  }, [formSelections, formStates, childInfo, premWeeks]);

  // ============================================================
  // Auto-generate domain narratives
  // ============================================================

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
        if (fs.formId === 'bayley4') {
          narrative = generateBayleyNarrative(domain, ds.scores, ageInDays, firstName);
        } else {
          narrative = generateBinaryNarrative(domain, ds.scores, firstName);
        }

        narratives.push({ formName: form.shortName, formId: fs.formId, domainLocalId, narrative });
      }
    }

    return narratives;
  }, [formSelections, formStates, ageInDays, firstName]);

  // ============================================================
  // Summary of Development table
  // ============================================================

  const summaryOfDevelopment = useMemo(() => {
    const rows: { domain: string; ageEquivalent: string }[] = [];

    for (const row of bayleyScores) {
      rows.push({ domain: row.domain, ageEquivalent: row.ageEquivalent });
    }
    for (const row of dayc2Scores) {
      rows.push({ domain: row.domain, ageEquivalent: row.ageEquivalent });
    }
    for (const row of reel3Scores) {
      rows.push({ domain: row.domain, ageEquivalent: row.ageEquivalent });
    }

    return rows;
  }, [bayleyScores, dayc2Scores, reel3Scores]);

  // ============================================================
  // Auto-generate recommendations
  // ============================================================

  useEffect(() => {
    if (recommendations) return; // Don't overwrite if already edited
    const ageMonthsVal = ageInMonths(childInfo.dob, childInfo.testDate, premWeeks);
    const quarterDelay = Math.floor(ageMonthsVal * 0.75);
    
    const belowQuarter: string[] = [];
    const borderlineQuarter: string[] = [];

    for (const row of bayleyScores) {
      if (row.ageEquivalent === 'N/A') continue; // skip domains without age equivalents
      const aeMonths = parseInt(row.ageEquivalent) || 0;
      if (aeMonths < quarterDelay) {
        belowQuarter.push(row.domain.toLowerCase());
      } else if (aeMonths <= quarterDelay + 2) {
        borderlineQuarter.push(row.domain.toLowerCase());
      }
    }
    for (const row of dayc2Scores) {
      const aeMonths = parseInt(row.ageEquivalent) || 0;
      if (aeMonths > 0 && aeMonths < quarterDelay) {
        belowQuarter.push(row.domain.toLowerCase());
      }
    }

    let rec = `${childName} is a ${chronAge} old ${gender === 'male' || gender === 'm' ? 'boy' : gender === 'female' || gender === 'f' ? 'girl' : 'child'} who was referred due to concerns about ${pronoun(gender, 'possessive')} developmental milestones.`;
    
    if (quarterDelay > 0) {
      rec += ` A ¼ delay would be considered ${quarterDelay} months.`;
    }
    if (belowQuarter.length > 0) {
      rec += ` ${firstName} is below the ¼ delay in the following areas: ${belowQuarter.join(', ')}.`;
    }
    if (borderlineQuarter.length > 0) {
      rec += ` ${Pronoun(gender, 'subject')} has a borderline ¼ delay in the following areas: ${borderlineQuarter.join(', ')}.`;
    }

    rec += `\n\nIt is recommended that the IFSP team consider the following, however, regional center to make the final determination of eligibility and services.\n\n1) Please consider the recommendation of occupational therapy services to address skills related to ${belowQuarter.length > 0 ? belowQuarter.join(', ') : 'developmental'} skills.\n2) Please consider the recommendation or referral to speech and language pathology services for communication skills.\n3) Please refer to Physical therapy report for further details regarding gross motor skills.`;

    setRecommendations(rec);
  }, [bayleyScores, dayc2Scores, childInfo, premWeeks]);

  // ============================================================
  // Collapsible sections state
  // ============================================================
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ============================================================
  // PDF Export
  // ============================================================
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    // Expand all sections before printing
    const prev = { ...collapsedSections };
    setCollapsedSections({});
    // Use a small timeout to let React re-render with all sections expanded
    setTimeout(() => {
      window.print();
      // Restore collapsed state after printing
      setCollapsedSections(prev);
    }, 100);
  }, [collapsedSections]);

  // ============================================================
  // Assessment tools list
  // ============================================================
  const assessmentTools = useMemo(() => {
    const tools: string[] = ['Clinical Observation', 'Parent/Caregiver Interview'];
    for (const fs of formSelections) {
      const form = getFormById(fs.formId);
      if (form) tools.push(form.name);
    }
    return tools;
  }, [formSelections]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'summary' })}
              className="text-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Summary
            </Button>
            <div className="h-5 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-slate-800 text-sm">Clinical Report</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
          <div className="p-8 print:p-12 space-y-6">

            {/* ===== HEADER ===== */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <EditableSection
                label=""
                value={practiceName}
                onChange={setPracticeName}
                rows={1}
              />
              <p className="text-sm text-slate-600 font-serif">{examinerInfo.name} — {examinerInfo.title}</p>
            </div>

            {/* ===== TITLE ===== */}
            <EditableSection
              label=""
              value={reportTitle}
              onChange={setReportTitle}
              rows={1}
            />

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

            {/* ===== REFERRAL INFORMATION ===== */}
            <SectionHeader title="Referral Information" sectionKey="referral" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.referral && (
              <EditableSection
                label=""
                value={referralInfo}
                onChange={setReferralInfo}
                placeholder="Enter referral information..."
                rows={3}
              />
            )}

            {/* ===== BIRTH/MEDICAL HISTORY ===== */}
            <SectionHeader title="Birth/Medical History" sectionKey="medical" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.medical && (
              <EditableSection
                label=""
                value={medicalHistory}
                onChange={setMedicalHistory}
                placeholder="Enter birth and medical history details..."
                rows={6}
              />
            )}

            {/* ===== PARENT'S CONCERNS ===== */}
            <SectionHeader title="Parent's Concerns" sectionKey="concerns" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.concerns && (
              <EditableSection
                label=""
                value={parentConcerns}
                onChange={setParentConcerns}
                placeholder="Enter parent/caregiver concerns..."
                rows={4}
              />
            )}

            {/* ===== ASSESSMENT TOOLS ===== */}
            <SectionHeader title="Assessment Tools" sectionKey="tools" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.tools && (
              <div className="mb-4">
                <p className="text-sm font-serif text-slate-800 leading-relaxed mb-2">
                  The following assessments were completed in English with {childName} and {pronoun(gender, 'possessive')} caregiver present in {pronoun(gender, 'possessive')} home environment. Per parent report, participation, behavior, and performance observed during the assessment are reported to be typical. Therefore, this assessment is believed to be reliable and valid in regards to the client's present level of function.
                </p>
                <ul className="list-disc list-inside text-sm font-serif text-slate-800 space-y-1 ml-4">
                  {assessmentTools.map((tool, i) => (
                    <li key={i}>{tool}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ===== CLINICAL OBSERVATION ===== */}
            <SectionHeader title="Clinical Observation" sectionKey="observation" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.observation && (
              <EditableSection
                label=""
                value={clinicalObservation}
                onChange={setClinicalObservation}
                placeholder={`Enter clinical observations about ${firstName}'s behavior, state control, regulation, and interaction during the assessment...`}
                rows={6}
              />
            )}

            {/* ===== SCORING TABLES ===== */}
            <SectionHeader title="Scoring Tables" sectionKey="scores" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.scores && (
              <div className="space-y-4 mb-6">
                {/* Bayley-4 Table */}
                {bayleyScores.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Bayley Scales of Infant Development, 4th Edition (BSID-IV)
                    </h4>
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
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.scaledScore ?? '—'}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.ageEquivalent}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.percentDelay || '—'}</td>
                            </tr>
                          ))}
                          {bayleyComposite && (
                            <tr className="bg-slate-50 font-semibold">
                              <td className="border border-slate-400 px-3 py-2">Motor Composite</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">—</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{bayleyComposite.sumScaled}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">SS: {bayleyComposite.standardScore}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{bayleyComposite.percentile}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DAYC-2 Table */}
                {dayc2Scores.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      DAYC-2 Developmental Assessment of Young Children, 2nd Edition
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-400 px-3 py-2 text-left font-bold">Subtest</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Standard Score</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Descriptive Term</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalence</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayc2Scores.map((row, i) => (
                            <tr key={i}>
                              <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.rawScore}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.standardScore}</td>
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

                {/* REEL-3 Table */}
                {reel3Scores.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Receptive-Expressive Emergent Language Test, 3rd Edition (REEL-3)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-400 px-3 py-2 text-left font-bold">Subtest</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Raw Score</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">Age Equivalence</th>
                            <th className="border border-slate-400 px-3 py-2 text-center font-bold">% Delay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reel3Scores.map((row, i) => (
                            <tr key={i}>
                              <td className="border border-slate-400 px-3 py-2 font-medium">{row.domain}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.rawScore}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.ageEquivalent}</td>
                              <td className="border border-slate-400 px-3 py-2 text-center">{row.percentDelay || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== DOMAIN NARRATIVES ===== */}
            <SectionHeader title="Domain Assessments" sectionKey="domains" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.domains && (
              <div className="space-y-6 mb-6">
                {domainNarratives.map(({ formName, formId, domainLocalId, narrative }) => {
                  const key = `${formId}_${domainLocalId}`;
                  const overrideText = domainOverrides[key];
                  const isOverridden = overrideText !== undefined;

                  // Auto-generate the narrative text
                  const autoText = generateNarrativeText(narrative, firstName, gender, formId);

                  return (
                    <div key={key} className="border-l-2 border-teal-600 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                          {narrative.domainName}
                          {narrative.ageEquivalent !== 'N/A' && (
                            <span className="font-normal text-slate-500 ml-1">
                              (age equivalence: {narrative.ageEquivalent})
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{formName}</span>
                      </div>

                      {formId === 'bayley4' && narrative.scaledScore !== null && (
                        <p className="text-sm font-serif text-slate-700 mb-2">
                          <strong>{firstName} obtained a raw score of {narrative.rawScore} with a scaled score of {narrative.scaledScore}.</strong>
                        </p>
                      )}

                      <EditableSection
                        label=""
                        value={isOverridden ? overrideText : autoText}
                        onChange={(v) => setDomainOverrides(prev => ({ ...prev, [key]: v }))}
                        placeholder="Domain narrative..."
                        rows={6}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== FEEDING/ORAL MOTOR ===== */}
            <SectionHeader title="Feeding/Oral Motor Skills" sectionKey="feeding" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.feeding && (
              <EditableSection
                label=""
                value={feedingOralMotor}
                onChange={setFeedingOralMotor}
                placeholder="Enter feeding and oral motor observations (texture progression, self-feeding, straw cup, open cup, positioning)..."
                rows={5}
              />
            )}

            {/* ===== SENSORY PROCESSING ===== */}
            <SectionHeader title="Sensory Processing" sectionKey="sensory" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.sensory && (
              <EditableSection
                label=""
                value={sensoryNarrative}
                onChange={setSensoryNarrative}
                placeholder="Enter sensory processing observations..."
                rows={8}
              />
            )}

            {/* ===== SUMMARY OF DEVELOPMENT ===== */}
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

            {/* ===== RECOMMENDATIONS ===== */}
            <SectionHeader title="Recommendations" sectionKey="recs" collapsed={collapsedSections} toggle={toggleSection} />
            {!collapsedSections.recs && (
              <EditableSection
                label=""
                value={recommendations}
                onChange={setRecommendations}
                placeholder="Enter recommendations..."
                rows={10}
              />
            )}

            {/* ===== CLOSING ===== */}
            <div className="border-t border-slate-300 pt-4 mt-6">
              <EditableSection
                label=""
                value={closingNote}
                onChange={setClosingNote}
                rows={2}
              />
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

// ============================================================
// Sub-components
// ============================================================

function SectionHeader({ 
  title, 
  sectionKey, 
  collapsed, 
  toggle 
}: { 
  title: string; 
  sectionKey: string; 
  collapsed: Record<string, boolean>; 
  toggle: (key: string) => void;
}) {
  const isCollapsed = collapsed[sectionKey];
  return (
    <button
      onClick={() => toggle(sectionKey)}
      className="w-full flex items-center justify-between py-2 border-b-2 border-slate-700 mb-3 group print:border-b print:border-slate-400"
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">{title}</h2>
      <span className="text-slate-400 group-hover:text-slate-600 print:hidden">
        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </span>
    </button>
  );
}

function generateNarrativeText(
  narrative: DomainNarrative,
  firstName: string,
  gender: string,
  formId: string,
): string {
  const sub = Pronoun(gender, 'subject');
  const subLower = pronoun(gender, 'subject');

  let text = '';

  if (narrative.demonstratedItems.length > 0) {
    if (formId === 'bayley4') {
      text += `${firstName} demonstrated the following skills: ${narrative.demonstratedItems.join('; ')}.`;
    } else {
      text += `${firstName} demonstrated the following skills: ${narrative.demonstratedItems.join('; ')}.`;
    }
  }

  if (narrative.emergingItems.length > 0) {
    text += `\n\n${sub} showed emerging ability in: ${narrative.emergingItems.join('; ')}.`;
  }

  if (narrative.notDemonstratedItems.length > 0) {
    text += `\n\n${firstName} did not demonstrate the following: ${narrative.notDemonstratedItems.join('; ')}.`;
  }

  if (!text) {
    text = `No items were scored for this domain.`;
  }

  return text;
}
