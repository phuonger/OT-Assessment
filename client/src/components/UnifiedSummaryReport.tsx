/**
 * UnifiedSummaryReport
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Generates per-form summary reports with form-specific scoring lookups.
 * Bayley-4: Scaled scores, standard scores, age equivalents, growth scale values
 * DAYC-2: Raw scores, standard scores, percentiles
 * REEL-3: Age equivalents, ability scores, percentiles
 * Sensory Profile 2: Quadrant scores, classification categories
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getFormById, type FormDefinition, type UnifiedDomain } from '@/lib/formRegistry';
import { lookupScaledScore, lookupAgeEquivalent, lookupGrowthScaleValue, lookupStandardScore } from '@/lib/scoringTables';
import { REEL3_AGE_EQUIVALENT, REEL3_ABILITY_TO_PERCENTILE, REEL3_DESCRIPTIVE_TERMS, REEL3_LANGUAGE_ABILITY } from '@/lib/reel3Data';
import { SP2_BIRTH6MO_CUTOFFS, SP2_ENGLISH_CUTOFFS, SP2_QUADRANT_MAP, getSP2Description } from '@/lib/sensoryProfileData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, RotateCcw, Clock, FileText } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function calculateAgeInDays(dob: string, testDate: string, premWeeks: number): number | null {
  if (!dob || !testDate) return null;
  const birth = new Date(dob);
  const test = new Date(testDate);
  let days = Math.floor((test.getTime() - birth.getTime()) / 86400000);
  if (premWeeks > 0) days -= premWeeks * 7;
  return Math.max(0, days);
}

// Bayley-4 domain mapping to scoring table keys
const bayleyDomainKey: Record<string, 'CG' | 'FM' | 'GM' | null> = {
  cognitive: 'CG',
  receptiveCommunication: null,
  expressiveCommunication: null,
  fineMotor: 'FM',
  grossMotor: 'GM',
};

export default function UnifiedSummaryReport() {
  const { state, dispatch, getRawScore, getDomainProgress } = useMultiAssessment();

  const ageInDays = useMemo(() => {
    const premWeeks = state.childInfo.premature ? state.childInfo.weeksPremature : 0;
    return calculateAgeInDays(state.childInfo.dob, state.childInfo.testDate, premWeeks);
  }, [state.childInfo]);

  // Calculate chronological age display
  const chronAgeDisplay = useMemo(() => {
    if (!state.childInfo.dob || !state.childInfo.testDate) return 'N/A';
    const birth = new Date(state.childInfo.dob);
    const test = new Date(state.childInfo.testDate);
    let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
    let days = test.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
      days += prevMonth.getDate();
    }
    return `${months} months, ${days} days`;
  }, [state.childInfo]);

  // Calculate adjusted age display (for premature children)
  const adjAgeDisplay = useMemo(() => {
    if (!state.childInfo.premature || !state.childInfo.weeksPremature || !state.childInfo.dob || !state.childInfo.testDate) return null;
    const birth = new Date(state.childInfo.dob);
    const adjusted = new Date(birth.getTime() + state.childInfo.weeksPremature * 7 * 86400000);
    const test = new Date(state.childInfo.testDate);
    let months = (test.getFullYear() - adjusted.getFullYear()) * 12 + (test.getMonth() - adjusted.getMonth());
    let days = test.getDate() - adjusted.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
      days += prevMonth.getDate();
    }
    return `${months} months, ${days} days`;
  }, [state.childInfo]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportCSV = useCallback(() => {
    const lines: string[] = ['Form,Domain,Raw Score,Items Scored,Total Items,Timer'];
    state.formSelections.forEach(fs => {
      const form = getFormById(fs.formId);
      if (!form) return;
      fs.selectedDomainIds.forEach(dId => {
        const domain = form.domains.find(d => d.localId === dId);
        if (!domain) return;
        const raw = getRawScore(fs.formId, dId);
        const prog = getDomainProgress(fs.formId, dId);
        const timer = state.formStates[fs.formId]?.domains[dId]?.timerSeconds || 0;
        lines.push(`"${form.shortName}","${domain.name}",${raw},${prog.scored},${prog.total},${formatTime(timer)}`);
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.childInfo.firstName}_${state.childInfo.lastName}_assessment_${state.childInfo.testDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [state]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to start a new assessment? All current data will be cleared.')) {
      dispatch({ type: 'RESET_ALL' });
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] print:bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1D8] px-6 py-4 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'assessment' })}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Assessment
            </Button>
            <h1 className="text-lg font-semibold text-[#2C2C2C]">Summary Report</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => dispatch({ type: 'GO_TO_REPORT' })}
              className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-red-600 hover:text-red-700">
              <RotateCcw className="w-3.5 h-3.5" />
              New Assessment
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Child & Examiner Info */}
        <div className="bg-white rounded-lg border border-[#E5E1D8] p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0D7377] mb-4">Assessment Information</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Child Name:</span>
              <span className="font-medium">{state.childInfo.firstName} {state.childInfo.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Examiner:</span>
              <span className="font-medium">{state.examinerInfo.name} {state.examinerInfo.title && `(${state.examinerInfo.title})`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Date of Birth:</span>
              <span className="font-medium">{state.childInfo.dob || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Agency:</span>
              <span className="font-medium">{state.examinerInfo.agency || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Test Date:</span>
              <span className="font-medium">{state.childInfo.testDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Reason for Referral:</span>
              <span className="font-medium">{state.childInfo.reasonForReferral || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Chronological Age:</span>
              <span className="font-medium">{chronAgeDisplay}</span>
            </div>
            {adjAgeDisplay && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Adjusted Age:</span>
                <span className="font-medium">{adjAgeDisplay} <span className="text-xs text-[#6B6B6B]">(corrected for {state.childInfo.weeksPremature} wks prematurity)</span></span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Total Assessment Time:</span>
              <span className="font-medium">{formatTime(state.totalElapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Per-form reports */}
        {state.formSelections.map(fs => {
          const form = getFormById(fs.formId);
          if (!form) return null;
          return (
            <FormReport
              key={fs.formId}
              form={form}
              formState={state.formStates[fs.formId]}
              selectedDomainIds={fs.selectedDomainIds}
              ageInDays={ageInDays}
              getRawScore={getRawScore}
              getDomainProgress={getDomainProgress}
            />
          );
        })}

        {/* Disclaimer */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-xs text-[#6B6B6B] leading-relaxed print:border-t print:mt-8">
          <p className="font-semibold text-[#2C2C2C] mb-1">Disclaimer</p>
          <p>
            This report is generated from a digital assessment administration tool. All scores should be verified
            by a qualified professional. Scoring table lookups are based on the assessment manual's normative data.
            This tool is intended to assist clinicians and does not replace professional clinical judgment.
          </p>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Per-form report sections
// ============================================================

interface FormReportProps {
  form: FormDefinition;
  formState: any;
  selectedDomainIds: string[];
  ageInDays: number | null;
  getRawScore: (formId: string, domainLocalId: string) => number;
  getDomainProgress: (formId: string, domainLocalId: string) => { scored: number; total: number };
}

function FormReport({ form, formState, selectedDomainIds, ageInDays, getRawScore, getDomainProgress }: FormReportProps) {
  switch (form.id) {
    case 'bayley4':
      return <Bayley4Report form={form} formState={formState} selectedDomainIds={selectedDomainIds} ageInDays={ageInDays} getRawScore={getRawScore} getDomainProgress={getDomainProgress} />;
    case 'dayc2':
    case 'dayc2sp':
      return <Dayc2Report form={form} formState={formState} selectedDomainIds={selectedDomainIds} getRawScore={getRawScore} getDomainProgress={getDomainProgress} />;
    case 'reel3':
      return <Reel3Report form={form} formState={formState} selectedDomainIds={selectedDomainIds} getRawScore={getRawScore} getDomainProgress={getDomainProgress} />;
    case 'sp2':
      return <SP2Report form={form} formState={formState} selectedDomainIds={selectedDomainIds} getRawScore={getRawScore} getDomainProgress={getDomainProgress} />;
    default:
      return <GenericReport form={form} formState={formState} selectedDomainIds={selectedDomainIds} getRawScore={getRawScore} getDomainProgress={getDomainProgress} />;
  }
}

// ============================================================
// Bayley-4 Report
// ============================================================

function Bayley4Report({ form, formState, selectedDomainIds, ageInDays, getRawScore, getDomainProgress }: FormReportProps) {
  const scoringData = useMemo(() => {
    return selectedDomainIds.map(dId => {
      const domain = form.domains.find(d => d.localId === dId);
      if (!domain) return null;
      const rawScore = getRawScore(form.id, dId);
      const progress = getDomainProgress(form.id, dId);
      const timer = formState?.domains[dId]?.timerSeconds || 0;
      const discontinued = formState?.domains[dId]?.discontinued || false;
      const key = bayleyDomainKey[dId];

      let scaledScore: number | null = null;
      let ageEquivalent: string | null = null;
      let growthScaleValue: number | null = null;

      if (key && ageInDays !== null) {
        scaledScore = lookupScaledScore(rawScore, key, ageInDays);
        const ageEq = lookupAgeEquivalent(rawScore, key);
        if (ageEq && ageEq.months !== null) {
          ageEquivalent = `${ageEq.months} mo${ageEq.days !== null ? ` ${ageEq.days} d` : ''}`;
        }
        growthScaleValue = lookupGrowthScaleValue(rawScore, key);
      }

      // Calculate % delay
      let percentDelay: string | null = null;
      if (ageInDays !== null && ageEquivalent) {
        const aeMonths = parseInt(ageEquivalent);
        const childAgeMonths = Math.floor(ageInDays / 30.44);
        if (childAgeMonths > 0 && !isNaN(aeMonths)) {
          const delay = ((childAgeMonths - aeMonths) / childAgeMonths) * 100;
          if (delay > 0) {
            percentDelay = `${Math.round(delay)}%`;
          } else {
            percentDelay = '0%';
          }
        }
      }

      return {
        domain,
        rawScore,
        progress,
        timer,
        discontinued,
        scaledScore,
        ageEquivalent,
        growthScaleValue,
        percentDelay,
      };
    }).filter(Boolean);
  }, [selectedDomainIds, form, formState, ageInDays]);

  // Composite scores
  const compositeScores = useMemo(() => {
    const cgData = scoringData.find((d: any) => d?.domain.localId === 'cognitive');
    const fmData = scoringData.find((d: any) => d?.domain.localId === 'fineMotor');
    const gmData = scoringData.find((d: any) => d?.domain.localId === 'grossMotor');

    const results: { name: string; sumScaled: number | null; standardScore: number | null; percentileRank: string | null }[] = [];

    if (cgData?.scaledScore !== null && cgData?.scaledScore !== undefined) {
      const stdResult = lookupStandardScore(cgData.scaledScore, 'COG');
      results.push({ name: 'Cognitive Composite', sumScaled: cgData.scaledScore, standardScore: stdResult?.standardScore ?? null, percentileRank: stdResult?.percentileRank ?? null });
    }

    if (fmData?.scaledScore !== null && fmData?.scaledScore !== undefined &&
        gmData?.scaledScore !== null && gmData?.scaledScore !== undefined) {
      const sum = fmData.scaledScore + gmData.scaledScore;
      const stdResult = lookupStandardScore(sum, 'MOT');
      results.push({ name: 'Motor Composite', sumScaled: sum, standardScore: stdResult?.standardScore ?? null, percentileRank: stdResult?.percentileRank ?? null });
    }

    return results;
  }, [scoringData]);

  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: form.color + '40' }}>
      <div className="px-6 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '08' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: form.color }}>
          B4
        </div>
        <div>
          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
          <p className="text-xs text-[#6B6B6B]">{form.name}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Domain Scores Table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: form.color + '30' }}>
              <th className="text-left py-2 pr-4 font-semibold text-[#2C2C2C]">Domain</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Raw Score</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Scaled Score</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Age Equiv.</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">GSV</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">% Delay</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Status</th>
              <th className="text-center py-2 pl-2 font-semibold text-[#2C2C2C]">Time</th>
            </tr>
          </thead>
          <tbody>
            {scoringData.map((d: any) => (
              <tr key={d.domain.localId} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium" style={{ color: form.color }}>{d.domain.name}</td>
                <td className="text-center py-2 px-2 font-mono">{d.rawScore}</td>
                <td className="text-center py-2 px-2 font-mono">{d.scaledScore ?? '—'}</td>
                <td className="text-center py-2 px-2">{d.ageEquivalent ?? '—'}</td>
                <td className="text-center py-2 px-2 font-mono">{d.growthScaleValue ?? '—'}</td>
                <td className="text-center py-2 px-2">{d.percentDelay ?? '—'}</td>
                <td className="text-center py-2 px-2">
                  {d.discontinued ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Disc.</span>
                  ) : d.progress.scored === d.progress.total ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Complete</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {d.progress.scored}/{d.progress.total}
                    </span>
                  )}
                </td>
                <td className="text-center py-2 pl-2 text-xs text-[#6B6B6B]">{formatTime(d.timer)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Composite Scores */}
        {compositeScores.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3">Composite Scores</h4>
            <div className="grid grid-cols-2 gap-4">
              {compositeScores.map(cs => (
                <div key={cs.name} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-[#6B6B6B] font-medium">{cs.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold" style={{ color: form.color }}>
                      {cs.standardScore ?? '—'}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">
                      (Sum of Scaled: {cs.sumScaled})
                    </span>
                  </div>
                  {cs.percentileRank && (
                    <p className="text-xs text-[#6B6B6B] mt-1">Percentile Rank: {cs.percentileRank}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DAYC-2 Report
// ============================================================

function Dayc2Report({ form, formState, selectedDomainIds, getRawScore, getDomainProgress }: Omit<FormReportProps, 'ageInDays'>) {
  const scoringData = useMemo(() => {
    return selectedDomainIds.map(dId => {
      const domain = form.domains.find(d => d.localId === dId);
      if (!domain) return null;
      const rawScore = getRawScore(form.id, dId);
      const progress = getDomainProgress(form.id, dId);
      const timer = formState?.domains[dId]?.timerSeconds || 0;
      const discontinued = formState?.domains[dId]?.discontinued || false;
      return { domain, rawScore, progress, timer, discontinued };
    }).filter(Boolean);
  }, [selectedDomainIds, form, formState]);

  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: form.color + '40' }}>
      <div className="px-6 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '08' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: form.color }}>
          {form.id === 'dayc2sp' ? 'DS' : 'D2'}
        </div>
        <div>
          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
          <p className="text-xs text-[#6B6B6B]">{form.name}</p>
        </div>
      </div>

      <div className="p-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: form.color + '30' }}>
              <th className="text-left py-2 pr-4 font-semibold text-[#2C2C2C]">Domain</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Raw Score</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Items</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Status</th>
              <th className="text-center py-2 pl-2 font-semibold text-[#2C2C2C]">Time</th>
            </tr>
          </thead>
          <tbody>
            {scoringData.map((d: any) => (
              <tr key={d.domain.localId} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium" style={{ color: form.color }}>{d.domain.name}</td>
                <td className="text-center py-2 px-2 font-mono">{d.rawScore}</td>
                <td className="text-center py-2 px-2 text-xs text-[#6B6B6B]">{d.progress.scored}/{d.progress.total}</td>
                <td className="text-center py-2 px-2">
                  {d.discontinued ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Disc.</span>
                  ) : d.progress.scored === d.progress.total ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Complete</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">In Progress</span>
                  )}
                </td>
                <td className="text-center py-2 pl-2 text-xs text-[#6B6B6B]">{formatTime(d.timer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-[#8B8B8B] mt-3 italic">
          Note: Standard scores and percentiles require manual lookup from the DAYC-2 manual's normative tables based on the child's age.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// REEL-3 Report
// ============================================================

function Reel3Report({ form, formState, selectedDomainIds, getRawScore, getDomainProgress }: Omit<FormReportProps, 'ageInDays'>) {
  const scoringData = useMemo(() => {
    return selectedDomainIds.map(dId => {
      const domain = form.domains.find(d => d.localId === dId);
      if (!domain) return null;
      const rawScore = getRawScore(form.id, dId);
      const progress = getDomainProgress(form.id, dId);
      const timer = formState?.domains[dId]?.timerSeconds || 0;
      const discontinued = formState?.domains[dId]?.discontinued || false;

      // REEL-3 age equivalent lookup
      let ageEquivalent: string | null = null;
      const aeEntry = REEL3_AGE_EQUIVALENT.find(e => e.raw === rawScore);
      if (aeEntry) {
        const months = dId === 'receptive' ? aeEntry.receptiveMonths : aeEntry.expressiveMonths;
        if (months !== null) ageEquivalent = `${months} months`;
      }

      return { domain, rawScore, progress, timer, discontinued, ageEquivalent };
    }).filter(Boolean);
  }, [selectedDomainIds, form, formState]);

  // Language ability composite
  const languageAbility = useMemo(() => {
    const recData = scoringData.find((d: any) => d?.domain.localId === 'receptive');
    const expData = scoringData.find((d: any) => d?.domain.localId === 'expressive');
    if (!recData || !expData) return null;
    const sum = recData.rawScore + expData.rawScore;
    const entry = REEL3_LANGUAGE_ABILITY.find(e => e.subtestSum === sum);
    if (!entry) return null;
    const percEntry = REEL3_ABILITY_TO_PERCENTILE.find(e => e.ability === entry.languageAbility);
    const termEntry = REEL3_DESCRIPTIVE_TERMS.find(e => e.ability === entry.languageAbility);
    return {
      subtestSum: sum,
      ability: entry.languageAbility,
      percentile: percEntry?.percentile ?? null,
      term: termEntry?.term ?? null,
    };
  }, [scoringData]);

  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: form.color + '40' }}>
      <div className="px-6 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '08' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: form.color }}>
          R3
        </div>
        <div>
          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
          <p className="text-xs text-[#6B6B6B]">{form.name}</p>
        </div>
      </div>

      <div className="p-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: form.color + '30' }}>
              <th className="text-left py-2 pr-4 font-semibold text-[#2C2C2C]">Domain</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Raw Score</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Age Equiv.</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Status</th>
              <th className="text-center py-2 pl-2 font-semibold text-[#2C2C2C]">Time</th>
            </tr>
          </thead>
          <tbody>
            {scoringData.map((d: any) => (
              <tr key={d.domain.localId} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium" style={{ color: form.color }}>{d.domain.name}</td>
                <td className="text-center py-2 px-2 font-mono">{d.rawScore}</td>
                <td className="text-center py-2 px-2">{d.ageEquivalent ?? '—'}</td>
                <td className="text-center py-2 px-2">
                  {d.discontinued ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Disc.</span>
                  ) : d.progress.scored === d.progress.total ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Complete</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {d.progress.scored}/{d.progress.total}
                    </span>
                  )}
                </td>
                <td className="text-center py-2 pl-2 text-xs text-[#6B6B6B]">{formatTime(d.timer)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Language Ability Composite */}
        {languageAbility && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3">Language Ability Composite</h4>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#6B6B6B]">Subtest Sum</p>
                <p className="text-lg font-bold" style={{ color: form.color }}>{languageAbility.subtestSum}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Language Ability</p>
                <p className="text-lg font-bold" style={{ color: form.color }}>{languageAbility.ability}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Percentile</p>
                <p className="text-lg font-bold" style={{ color: form.color }}>{languageAbility.percentile ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Classification</p>
                <p className="text-sm font-semibold mt-1" style={{ color: form.color }}>{languageAbility.term ?? '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sensory Profile 2 Report
// ============================================================

function SP2Report({ form, formState, selectedDomainIds, getRawScore, getDomainProgress }: Omit<FormReportProps, 'ageInDays'>) {
  const scoringData = useMemo(() => {
    return selectedDomainIds.map(dId => {
      const domain = form.domains.find(d => d.localId === dId);
      if (!domain) return null;
      const rawScore = getRawScore(form.id, dId);
      const progress = getDomainProgress(form.id, dId);
      const timer = formState?.domains[dId]?.timerSeconds || 0;

      // Get classification based on cutoffs
      let classification: string | null = null;
      const cutoffs = dId === 'birth6mo' ? SP2_BIRTH6MO_CUTOFFS : SP2_ENGLISH_CUTOFFS;
      // SP2 has quadrant-level scoring, but for now show section-level raw scores
      
      return { domain, rawScore, progress, timer, classification };
    }).filter(Boolean);
  }, [selectedDomainIds, form, formState]);

  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: form.color + '40' }}>
      <div className="px-6 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '08' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: form.color }}>
          SP
        </div>
        <div>
          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
          <p className="text-xs text-[#6B6B6B]">{form.name}</p>
        </div>
      </div>

      <div className="p-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: form.color + '30' }}>
              <th className="text-left py-2 pr-4 font-semibold text-[#2C2C2C]">Section</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Raw Score</th>
              <th className="text-center py-2 px-2 font-semibold text-[#2C2C2C]">Items</th>
              <th className="text-center py-2 pl-2 font-semibold text-[#2C2C2C]">Time</th>
            </tr>
          </thead>
          <tbody>
            {scoringData.map((d: any) => (
              <tr key={d.domain.localId} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium" style={{ color: form.color }}>{d.domain.name}</td>
                <td className="text-center py-2 px-2 font-mono">{d.rawScore}</td>
                <td className="text-center py-2 px-2 text-xs text-[#6B6B6B]">{d.progress.scored}/{d.progress.total}</td>
                <td className="text-center py-2 pl-2 text-xs text-[#6B6B6B]">{formatTime(d.timer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-[#8B8B8B] mt-3 italic">
          Note: Sensory Profile 2 quadrant classifications require manual calculation based on the scoring manual's cutoff tables.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Generic Report (fallback)
// ============================================================

function GenericReport({ form, formState, selectedDomainIds, getRawScore, getDomainProgress }: Omit<FormReportProps, 'ageInDays'>) {
  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: form.color + '40' }}>
      <div className="px-6 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '08' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: form.color }}>
          {form.shortName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
          <p className="text-xs text-[#6B6B6B]">{form.name}</p>
        </div>
      </div>
      <div className="p-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: form.color + '30' }}>
              <th className="text-left py-2 pr-4 font-semibold">Domain</th>
              <th className="text-center py-2 px-2 font-semibold">Raw Score</th>
              <th className="text-center py-2 px-2 font-semibold">Items</th>
            </tr>
          </thead>
          <tbody>
            {selectedDomainIds.map(dId => {
              const domain = form.domains.find(d => d.localId === dId);
              if (!domain) return null;
              const rawScore = getRawScore(form.id, dId);
              const progress = getDomainProgress(form.id, dId);
              return (
                <tr key={dId} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium" style={{ color: form.color }}>{domain.name}</td>
                  <td className="text-center py-2 px-2 font-mono">{rawScore}</td>
                  <td className="text-center py-2 px-2 text-xs text-[#6B6B6B]">{progress.scored}/{progress.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
