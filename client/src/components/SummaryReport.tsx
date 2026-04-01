/*
 * Design: Clinical Precision — Swiss Medical Design
 * Summary report with scoring table lookups (Table A.1, A.4, B.1, B.2)
 */
import { useAssessment, calculateAgeInDays } from '@/contexts/AssessmentContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Printer, RotateCcw, Timer, StickyNote, Save, FolderOpen } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { saveSession } from '@/lib/sessionStorage';
import { type DomainData, getStartItem } from '@/lib/assessmentData';
import {
  lookupScaledScore,
  lookupStandardScore,
  lookupAgeEquivalent,
  lookupGrowthScaleValue,
} from '@/lib/scoringTables';
import { generatePDFReport, type PDFReportData } from '@/lib/generatePDF';
import { toast } from 'sonner';

const domainColors: Record<string, string> = {
  cognitive: '#0D7377',
  receptiveCommunication: '#B8860B',
  expressiveCommunication: '#9B6B2F',
  fineMotor: '#2D6A4F',
  grossMotor: '#7B5B3A',
};

// Map domain IDs to scoring table keys
const domainToScoringKey: Record<string, 'CG' | 'FM' | 'GM' | 'RC' | 'EC' | null> = {
  cognitive: 'CG',
  receptiveCommunication: 'RC',
  expressiveCommunication: 'EC',
  fineMotor: 'FM',
  grossMotor: 'GM',
};

interface SummaryReportProps {
  onViewSessions?: () => void;
}

export default function SummaryReport({ onViewSessions }: SummaryReportProps) {
  const {
    state,
    dispatch,
    getSelectedDomains,
    getDomainRawScore,
    getDomainAnsweredCount,
    isDomainDiscontinued,
    getDomainElapsedSeconds,
  } = useAssessment();

  const selectedDomains = getSelectedDomains();

  // Calculate age in days for scoring lookups
  const ageInDays = useMemo(() => {
    const premWeeks = state.childInfo.premature === 'Yes' ? parseInt(state.childInfo.prematureWeeks) || 0 : 0;
    return calculateAgeInDays(state.childInfo.dateOfBirth, state.childInfo.examDate, premWeeks);
  }, [state.childInfo]);

  // Calculate all scoring data
  const scoringData = useMemo(() => {
    const results: Record<string, {
      rawScore: number;
      scaledScore: number | null;
      ageEquivalent: string | null;
      growthScaleValue: number | null;
    }> = {};

    selectedDomains.forEach((domain: DomainData) => {
      const rawScore = getDomainRawScore(domain);
      const key = domainToScoringKey[domain.id];
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

      results[domain.id] = { rawScore, scaledScore, ageEquivalent, growthScaleValue };
    });

    return results;
  }, [selectedDomains, getDomainRawScore, ageInDays]);

  // Composite scores
  const compositeScores = useMemo(() => {
    const cgScaled = scoringData['cognitive']?.scaledScore;
    const fmScaled = scoringData['fineMotor']?.scaledScore;
    const gmScaled = scoringData['grossMotor']?.scaledScore;

    let cogComposite: { standardScore: number; percentileRank: string } | null = null;
    let motComposite: { standardScore: number; percentileRank: string } | null = null;

    if (cgScaled !== null && cgScaled !== undefined) {
      cogComposite = lookupStandardScore(cgScaled, 'COG');
    }
    if (fmScaled !== null && fmScaled !== undefined && gmScaled !== null && gmScaled !== undefined) {
      motComposite = lookupStandardScore(fmScaled + gmScaled, 'MOT');
    }

    return { cogComposite, motComposite, cgScaled, fmScaled, gmScaled };
  }, [scoringData]);

  // Percent delay calculation
  const percentDelay = useMemo(() => {
    if (!ageInDays || !state.childInfo.dateOfBirth) return null;

    const results: Record<string, string | null> = {};
    selectedDomains.forEach((domain: DomainData) => {
      const key = domainToScoringKey[domain.id];
      if (!key) { results[domain.id] = null; return; }

      const rawScore = getDomainRawScore(domain);
      const ageEq = lookupAgeEquivalent(rawScore, key);
      if (!ageEq || ageEq.months === null) { results[domain.id] = null; return; }

      // Convert age equivalent to total days for comparison
      const aeMonths = typeof ageEq.months === 'number' ? ageEq.months : parseInt(String(ageEq.months)) || 0;
      const aeDays = ageEq.days || 0;
      const aeTotal = aeMonths * 30.44 + aeDays;
      const chronTotal = ageInDays;

      if (chronTotal > 0) {
        const delay = ((chronTotal - aeTotal) / chronTotal) * 100;
        results[domain.id] = delay > 0 ? `-${delay.toFixed(1)}%` : `+${Math.abs(delay).toFixed(1)}%`;
      } else {
        results[domain.id] = null;
      }
    });
    return results;
  }, [selectedDomains, getDomainRawScore, ageInDays, state.childInfo.dateOfBirth]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [
      ['Domain', 'Item #', 'Item Description', 'Score'],
    ];

    selectedDomains.forEach((domain: DomainData) => {
      domain.items.forEach(item => {
        const key = `${domain.id}-${item.number}`;
        const score = state.scores[key];
        rows.push([
          domain.name,
          String(item.number),
          `"${item.description.replace(/"/g, '""')}"`,
          score !== undefined && score !== null ? String(score) : '',
        ]);
      });
    });

    rows.push([]);
    rows.push(['--- SCORING SUMMARY ---']);
    rows.push(['Domain', 'Raw Score', 'Scaled Score', 'Age Equivalent', 'Growth Scale Value', 'Percent Delay']);
    selectedDomains.forEach((domain: DomainData) => {
      const sd = scoringData[domain.id];
      const pd = percentDelay?.[domain.id];
      rows.push([
        domain.name,
        String(sd?.rawScore ?? ''),
        sd?.scaledScore !== null ? String(sd?.scaledScore) : 'N/A',
        sd?.ageEquivalent || 'N/A',
        sd?.growthScaleValue !== null ? String(sd?.growthScaleValue) : 'N/A',
        pd || 'N/A',
      ]);
    });

    rows.push([]);
    rows.push(['--- COMPOSITE SCORES ---']);
    if (compositeScores.cogComposite) {
      rows.push(['Cognitive (COG)', `Standard Score: ${compositeScores.cogComposite.standardScore}`, `Percentile: ${compositeScores.cogComposite.percentileRank}`]);
    }
    if (compositeScores.motComposite) {
      rows.push(['Motor (MOT)', `Standard Score: ${compositeScores.motComposite.standardScore}`, `Percentile: ${compositeScores.motComposite.percentileRank}`]);
    }

    rows.push([]);
    rows.push(['--- CHILD INFO ---']);
    rows.push(['Name', `${state.childInfo.firstName}`]);
    rows.push(['DOB', state.childInfo.dateOfBirth]);
    rows.push(['Exam Date', state.childInfo.examDate]);
    rows.push(['Examiner', state.childInfo.examinerName]);
    rows.push(['Start Point', state.childInfo.startPointLetter]);

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bayley4-${state.childInfo.firstName}-${state.childInfo.examDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, selectedDomains, scoringData, compositeScores, percentDelay]);

  const handleExportPDF = useCallback(() => {
    // Build item scores
    const itemScores: PDFReportData['itemScores'] = [];
    selectedDomains.forEach((domain: DomainData) => {
      const startItem = getStartItem(domain, state.childInfo.startPointLetter);
      const discontinued = isDomainDiscontinued(domain);
      let discontinueIdx = domain.items.length;

      if (discontinued) {
        // Find where discontinue happened
        for (let i = 0; i < domain.items.length; i++) {
          const key = `${domain.id}-${domain.items[i].number}`;
          const score = state.scores[key];
          if (score === 0) {
            let consecutive = 1;
            for (let j = i + 1; j < domain.items.length && consecutive < 5; j++) {
              const k2 = `${domain.id}-${domain.items[j].number}`;
              if (state.scores[k2] === 0) consecutive++;
              else break;
            }
            if (consecutive >= 5) {
              discontinueIdx = i + 5;
              break;
            }
          }
        }
      }

      domain.items.forEach((item, idx) => {
        const key = `${domain.id}-${item.number}`;
        const score = state.scores[key];
        const noteKey = `${domain.id}-${item.number}`;
        itemScores.push({
          domain: domain.name,
          itemNumber: item.number,
          description: item.description,
          score: score ?? null,
          isPreScored: item.number < startItem,
          isDiscontinued: idx >= discontinueIdx,
          note: state.itemNotes[noteKey] || undefined,
        });
      });
    });

    // Build composite scores
    const composites: PDFReportData['compositeScores'] = [];
    if (compositeScores.cogComposite && compositeScores.cgScaled !== null && compositeScores.cgScaled !== undefined) {
      composites.push({
        name: 'Cognitive (COG)',
        scaledScoreSum: String(compositeScores.cgScaled),
        standardScore: compositeScores.cogComposite.standardScore,
        percentileRank: compositeScores.cogComposite.percentileRank,
      });
    }
    if (compositeScores.motComposite && compositeScores.fmScaled !== null && compositeScores.fmScaled !== undefined && compositeScores.gmScaled !== null && compositeScores.gmScaled !== undefined) {
      composites.push({
        name: 'Motor (MOT)',
        scaledScoreSum: `${compositeScores.fmScaled} + ${compositeScores.gmScaled} = ${compositeScores.fmScaled + compositeScores.gmScaled}`,
        standardScore: compositeScores.motComposite.standardScore,
        percentileRank: compositeScores.motComposite.percentileRank,
      });
    }

    const reportData: PDFReportData = {
      childInfo: {
        name: state.childInfo.firstName,
        dateOfBirth: state.childInfo.dateOfBirth,
        sex: state.childInfo.gender,
        examDate: state.childInfo.examDate,
        examiner: state.childInfo.examinerName,
        startPoint: state.childInfo.startPointLetter,
        ageRange: state.childInfo.ageRange,
        reasonForReferral: state.childInfo.reasonForReferral,
        premature: state.childInfo.premature,
        prematureWeeks: state.childInfo.prematureWeeks,
        notes: state.childInfo.notes,
      },
      domainScores: selectedDomains.map((domain: DomainData) => {
        const sd = scoringData[domain.id];
        return {
          name: domain.name,
          rawScore: sd?.rawScore ?? 0,
          scaledScore: sd?.scaledScore ?? null,
          ageEquivalent: sd?.ageEquivalent ?? null,
          growthScaleValue: sd?.growthScaleValue ?? null,
          percentDelay: percentDelay?.[domain.id] ?? null,
          itemsAnswered: getDomainAnsweredCount(domain),
          totalItems: domain.items.length,
          discontinued: isDomainDiscontinued(domain),
        };
      }),
      compositeScores: composites,
      itemScores,
      domainTimers: selectedDomains.map((domain: DomainData) => ({
        name: domain.name,
        elapsedSeconds: getDomainElapsedSeconds(domain),
      })),
    };

    generatePDFReport(reportData);
  }, [state, selectedDomains, scoringData, compositeScores, percentDelay, getDomainAnsweredCount, isDomainDiscontinued, getDomainElapsedSeconds]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSession = useCallback(() => {
    setIsSaving(true);
    try {
      const domainScoresMap: Record<string, number> = {};
      selectedDomains.forEach((domain: DomainData) => {
        domainScoresMap[domain.id] = getDomainRawScore(domain);
      });

      // Determine status
      const allAnswered = selectedDomains.every((domain: DomainData) => {
        const answered = getDomainAnsweredCount(domain);
        const total = domain.items.length;
        return answered === total || isDomainDiscontinued(domain);
      });

      const session = saveSession(
        state,
        domainScoresMap,
        allAnswered ? 'completed' : 'in-progress'
      );

      toast.success('Session saved successfully', {
        description: `Saved as ${session.childName} — ${new Date(session.savedAt).toLocaleDateString()}`,
      });
    } catch (err) {
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  }, [state, selectedDomains, getDomainRawScore, getDomainAnsweredCount, isDomainDiscontinued]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start a new assessment? All current data will be lost.')) {
      dispatch({ type: 'RESET' });
    }
  };

  return (
    <div className="flex-1 min-w-0 print:p-0">
      {/* Report header */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6 print:shadow-none print:border-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Assessment Summary Report
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bayley Scales of Infant and Toddler Development, 4th Edition
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveSession} disabled={isSaving} className="gap-1.5 bg-[#2D7D6F]/10 text-[#2D7D6F] border-[#2D7D6F]/20 hover:bg-[#2D7D6F]/20">
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Session'}
            </Button>
            {onViewSessions && (
              <Button variant="outline" size="sm" onClick={onViewSessions} className="gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                Sessions
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-destructive hover:text-destructive">
              <RotateCcw className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
        </div>

        {/* Child info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Child Name</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.firstName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Date of Birth</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.dateOfBirth || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Examiner</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.examinerName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Exam Date</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.examDate}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Start Point</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.startPointLetter}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Age Range</p>
            <p className="text-sm font-semibold mt-0.5">{state.childInfo.ageRange || 'Not specified'}</p>
          </div>
          {state.childInfo.reasonForReferral && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Reason for Referral</p>
              <p className="text-sm font-semibold mt-0.5">{state.childInfo.reasonForReferral}</p>
            </div>
          )}
        </div>
      </div>

      {/* Domain score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {selectedDomains.map((domain: DomainData) => {
          const sd = scoringData[domain.id];
          const answered = getDomainAnsweredCount(domain);
          const total = domain.items.length;
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          const color = domainColors[domain.id] || '#0D7377';
          const discontinued = isDomainDiscontinued(domain);
          const scoringKey = domainToScoringKey[domain.id];

          return (
            <div
              key={domain.id}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="h-1.5" style={{ backgroundColor: color }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="font-bold text-sm"
                    style={{ color, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {domain.name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${discontinued ? 'bg-red-100 text-red-700' : 'bg-muted'}`}>
                    {discontinued ? 'Discontinued' : `${pct}% complete`}
                  </span>
                </div>

                {/* Raw score display */}
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-3xl font-bold" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>
                    {sd?.rawScore ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">raw score</span>
                </div>

                {/* Scoring results */}
                {scoringKey && (
                  <div className="space-y-1.5 pt-3 border-t border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Scaled Score</span>
                      <span className="font-bold" style={{ color }}>
                        {sd?.scaledScore !== null ? sd?.scaledScore : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Age Equivalent</span>
                      <span className="font-medium">
                        {sd?.ageEquivalent || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Growth Scale Value</span>
                      <span className="font-medium">
                        {sd?.growthScaleValue !== null ? sd?.growthScaleValue : '—'}
                      </span>
                    </div>
                    {percentDelay?.[domain.id] && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Percent Delay</span>
                        <span className={`font-bold ${percentDelay[domain.id]?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                          {percentDelay[domain.id]}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!scoringKey && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">
                      Scoring tables not available for this domain. Refer to the Bayley-4 manual.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Composite Scores */}
      {(compositeScores.cogComposite || compositeScores.motComposite) && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Composite Scores
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sum of scaled scores converted to standard scores (Table A.4)
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cognitive Composite */}
              {compositeScores.cgScaled !== null && compositeScores.cgScaled !== undefined && (
                <div className="p-4 bg-[#0D7377]/5 rounded-lg border border-[#0D7377]/20">
                  <h4 className="text-sm font-bold text-[#0D7377] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Cognitive (COG)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Scaled Score (CG)</span>
                      <span className="font-bold">{compositeScores.cgScaled}</span>
                    </div>
                    {compositeScores.cogComposite && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Standard Score</span>
                          <span className="font-bold text-[#0D7377]">{compositeScores.cogComposite.standardScore}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Percentile Rank</span>
                          <span className="font-medium">{compositeScores.cogComposite.percentileRank}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Motor Composite */}
              {compositeScores.fmScaled !== null && compositeScores.fmScaled !== undefined &&
               compositeScores.gmScaled !== null && compositeScores.gmScaled !== undefined && (
                <div className="p-4 bg-[#2D6A4F]/5 rounded-lg border border-[#2D6A4F]/20">
                  <h4 className="text-sm font-bold text-[#2D6A4F] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Motor (MOT)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">FM Scaled + GM Scaled</span>
                      <span className="font-bold">{compositeScores.fmScaled} + {compositeScores.gmScaled} = {compositeScores.fmScaled + compositeScores.gmScaled}</span>
                    </div>
                    {compositeScores.motComposite && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Standard Score</span>
                          <span className="font-bold text-[#2D6A4F]">{compositeScores.motComposite.standardScore}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Percentile Rank</span>
                          <span className="font-medium">{compositeScores.motComposite.percentileRank}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed breakdown table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Detailed Score Breakdown
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Raw scores and converted scores by domain (Tables A.1, B.1, B.2)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">Domain</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Raw Score</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Scaled Score</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Age Equiv.</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Growth Scale</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">% Delay</th>
              </tr>
            </thead>
            <tbody>
              {selectedDomains.map((domain: DomainData) => {
                const sd = scoringData[domain.id];
                const color = domainColors[domain.id] || '#0D7377';
                const pd = percentDelay?.[domain.id];

                return (
                  <tr key={domain.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td
                      className="px-5 py-3 font-semibold"
                      style={{ color, borderLeft: `3px solid ${color}` }}
                    >
                      {domain.name}
                    </td>
                    <td className="px-5 py-3 text-center font-bold" style={{ color }}>
                      {sd?.rawScore ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center font-medium">
                      {sd?.scaledScore !== null ? sd?.scaledScore : '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      {sd?.ageEquivalent || '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      {sd?.growthScaleValue !== null ? sd?.growthScaleValue : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {pd ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${pd.startsWith('-') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                          {pd}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administration Time */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Timer className="w-5 h-5 text-muted-foreground" />
            Administration Time
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {selectedDomains.map((domain: DomainData) => {
              const elapsed = getDomainElapsedSeconds(domain);
              const color = domainColors[domain.id] || '#0D7377';
              const mins = Math.floor(elapsed / 60);
              const secs = elapsed % 60;
              return (
                <div key={domain.id} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${color}08` }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color }}>
                    {domain.name}
                  </p>
                  <p className="text-lg font-bold tabular-nums" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {mins}:{String(secs).padStart(2, '0')}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Session Time</span>
            <span className="text-lg font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {(() => {
                const total = selectedDomains.reduce((sum, d) => sum + getDomainElapsedSeconds(d), 0);
                const h = Math.floor(total / 3600);
                const m = Math.floor((total % 3600) / 60);
                const s = total % 60;
                return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Item-Level Examiner Notes */}
      {(() => {
        const notesItems: { domain: string; domainColor: string; itemNumber: number; description: string; note: string }[] = [];
        selectedDomains.forEach((domain: DomainData) => {
          const color = domainColors[domain.id] || '#0D7377';
          domain.items.forEach(item => {
            const key = `${domain.id}-${item.number}`;
            const note = state.itemNotes[key];
            if (note && note.trim()) {
              notesItems.push({ domain: domain.name, domainColor: color, itemNumber: item.number, description: item.description, note });
            }
          });
        });

        if (notesItems.length === 0 && !state.childInfo.notes) return null;

        return (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <StickyNote className="w-5 h-5 text-amber-600" />
                Examiner Notes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notesItems.length} item-level note{notesItems.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <div className="p-5 space-y-3">
              {state.childInfo.notes && (
                <div className="p-3 bg-muted/30 rounded-lg mb-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">General Notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{state.childInfo.notes}</p>
                </div>
              )}
              {notesItems.map((ni, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ni.domainColor }}>
                    {ni.itemNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: ni.domainColor }}>{ni.domain}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 truncate">{ni.description}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{ni.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-sm text-amber-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Important Notice
        </h3>
        <p className="text-xs text-amber-700 leading-relaxed">
          This form is a digital adaptation of the Bayley Scales of Infant and Toddler Development, 4th Edition (Bayley-4) for data collection purposes.
          Scaled scores, standard scores, age equivalents, and growth scale values are calculated from the scoring tables in the provided template.
          Always verify results against the official Bayley-4 scoring tables and consult the Administration and Scoring Manual for proper interpretation.
          This tool does not replace the professional judgment of a qualified examiner.
        </p>
      </div>

      {/* Back to assessment */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'assessment' })}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assessment
        </Button>
      </div>
    </div>
  );
}
