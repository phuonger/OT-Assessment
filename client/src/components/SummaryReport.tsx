/*
 * Design: Clinical Precision — Swiss Medical Design
 * Summary report with score profiles and domain breakdowns
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';
import type { DomainData } from '@/lib/assessmentData';

const domainColors: Record<string, string> = {
  cognitive: '#0D7377',
  receptiveCommunication: '#B8860B',
  expressiveCommunication: '#9B6B2F',
  fineMotor: '#2D6A4F',
  grossMotor: '#7B5B3A',
};

export default function SummaryReport() {
  const {
    state,
    dispatch,
    getSelectedDomains,
    getDomainRawScore,
    getDomainAnsweredCount,
    getDomainMaxScore,
  } = useAssessment();

  const selectedDomains = getSelectedDomains();

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

    // Add summary rows
    rows.push([]);
    rows.push(['--- SUMMARY ---']);
    rows.push(['Domain', 'Raw Score', 'Max Score', 'Items Answered', 'Total Items']);
    selectedDomains.forEach((domain: DomainData) => {
      rows.push([
        domain.name,
        String(getDomainRawScore(domain)),
        String(getDomainMaxScore(domain)),
        String(getDomainAnsweredCount(domain)),
        String(domain.items.length),
      ]);
    });

    // Add child info
    rows.push([]);
    rows.push(['--- CHILD INFO ---']);
    rows.push(['Name', `${state.childInfo.firstName}`]);
    rows.push(['DOB', state.childInfo.dateOfBirth]);
    rows.push(['Exam Date', state.childInfo.examDate]);
    rows.push(['Examiner', state.childInfo.examinerName]);
    rows.push(['Start Point', state.childInfo.startPointLetter]);
    rows.push(['Reason for Referral', state.childInfo.reasonForReferral]);
    if (state.childInfo.notes) {
      rows.push(['Notes', `"${state.childInfo.notes.replace(/"/g, '""')}"`]);
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bayley4-${state.childInfo.firstName}-${state.childInfo.examDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, selectedDomains, getDomainRawScore, getDomainAnsweredCount, getDomainMaxScore]);

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
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
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
          const rawScore = getDomainRawScore(domain);
          const answered = getDomainAnsweredCount(domain);
          const total = domain.items.length;
          const maxRaw = getDomainMaxScore(domain);
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          const color = domainColors[domain.id] || '#0D7377';

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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                    {pct}% complete
                  </span>
                </div>

                {/* Raw score display */}
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>
                    {rawScore}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/ {maxRaw}</span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">Items Answered</span>
                    <span className="text-muted-foreground">
                      {answered}/{total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed breakdown table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Detailed Score Breakdown
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Raw scores by domain. Consult the Bayley-4 manual for scaled score conversion tables.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">Domain</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Items Answered</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Total Items</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Raw Score</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Max Score</th>
                <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">% of Max</th>
              </tr>
            </thead>
            <tbody>
              {selectedDomains.map((domain: DomainData) => {
                const rawScore = getDomainRawScore(domain);
                const answered = getDomainAnsweredCount(domain);
                const total = domain.items.length;
                const maxRaw = getDomainMaxScore(domain);
                const pctMax = maxRaw > 0 ? Math.round((rawScore / maxRaw) * 100) : 0;
                const color = domainColors[domain.id] || '#0D7377';

                return (
                  <tr key={domain.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td
                      className="px-5 py-3 font-semibold"
                      style={{ color, borderLeft: `3px solid ${color}` }}
                    >
                      {domain.name}
                    </td>
                    <td className="px-5 py-3 text-center font-medium">{answered}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{total}</td>
                    <td className="px-5 py-3 text-center font-bold" style={{ color }}>
                      {rawScore}
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{maxRaw}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                        {pctMax}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {state.childInfo.notes && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
          <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Examiner Notes
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.childInfo.notes}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-sm text-amber-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Important Notice
        </h3>
        <p className="text-xs text-amber-700 leading-relaxed">
          This form is a digital adaptation of the Bayley Scales of Infant and Toddler Development, 4th Edition (Bayley-4) for data collection purposes.
          Raw scores shown here require conversion to scaled scores, composite scores, and percentile ranks using the official Bayley-4 scoring tables
          published by Pearson. This tool does not replace the official scoring software (Q-global) or the professional judgment of a qualified examiner.
          Always refer to the Bayley-4 Administration and Scoring Manual for proper interpretation.
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
