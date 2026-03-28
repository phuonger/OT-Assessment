/*
 * Design: Clinical Precision — Swiss Medical Design
 * Main content panel showing current domain items
 * Supports: pre-scored items before start point, discontinue rule (5 consecutive 0s)
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { getStartItem, type DomainData } from '@/lib/assessmentData';
import ScoringItem from './ScoringItem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, OctagonX, Timer } from 'lucide-react';
import { formatTime } from '@/lib/formatTime';
import { useMemo, useRef, useEffect } from 'react';

const domainColors: Record<string, string> = {
  cognitive: '#0D7377',
  receptiveCommunication: '#B8860B',
  expressiveCommunication: '#9B6B2F',
  fineMotor: '#2D6A4F',
  grossMotor: '#7B5B3A',
};

export default function AssessmentPanel() {
  const {
    state,
    dispatch,
    getSelectedDomains,
    getDomainRawScore,
    getDomainAnsweredCount,
    getDomainMaxScore,
    getDomainDiscontinuePoint,
    isDomainDiscontinued,
    getDomainElapsedSeconds,
  } = useAssessment();

  const selectedDomains = getSelectedDomains();
  const domain = selectedDomains[state.currentDomainIndex];
  const startItemRef = useRef<HTMLDivElement>(null);

  // Compute start item number for this domain
  const startItemNumber = useMemo(() => {
    if (!domain) return 1;
    return getStartItem(domain, state.childInfo.startPointLetter);
  }, [domain, state.childInfo.startPointLetter]);

  const discontinuePoint = domain ? getDomainDiscontinuePoint(domain) : null;
  const discontinued = domain ? isDomainDiscontinued(domain) : false;

  const answered = domain ? getDomainAnsweredCount(domain) : 0;
  const rawScore = domain ? getDomainRawScore(domain) : 0;
  const maxScore = domain ? getDomainMaxScore(domain) : 0;
  const total = domain ? domain.items.length : 0;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const color = domain ? (domainColors[domain.id] || '#0D7377') : '#0D7377';

  // Scroll to start item on domain change
  useEffect(() => {
    if (startItemRef.current) {
      setTimeout(() => {
        startItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [state.currentDomainIndex]);

  if (!domain) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No domain selected.
      </div>
    );
  }

  const goNext = () => {
    if (state.currentDomainIndex < selectedDomains.length - 1) {
      dispatch({ type: 'SET_DOMAIN', payload: state.currentDomainIndex + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 'summary' });
  };

  const goPrev = () => {
    if (state.currentDomainIndex > 0) {
      dispatch({ type: 'SET_DOMAIN', payload: state.currentDomainIndex - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isFirst = state.currentDomainIndex === 0;
  const isLast = state.currentDomainIndex === selectedDomains.length - 1;

  // Group items by start point for visual grouping
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: typeof domain.items }[] = [];
    let currentGroup: string | null = null;

    domain.items.forEach(item => {
      if (item.startPoint !== currentGroup) {
        currentGroup = item.startPoint;
        groups.push({ label: `Start Point ${item.startPoint}`, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    });

    return groups;
  }, [domain]);

  return (
    <div className="flex-1 min-w-0">
      {/* Domain header */}
      <div className="bg-white rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
        <div className="p-5 pb-4" style={{ borderBottom: `3px solid ${color}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color }}
                >
                  {domain.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                  {domain.administration}
                </span>
                {discontinued && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1">
                    <OctagonX className="w-3 h-3" />
                    DISCONTINUED
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{total}</span> items
                </span>
                <span>
                  Scoring: <span className="font-medium text-foreground">0–2 (Not Present / Emerging / Mastery)</span>
                </span>
                <span>
                  Start Item: <span className="font-bold" style={{ color }}>#{startItemNumber}</span>
                </span>
              </div>
              {/* Rules */}
              <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Administration Rules</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Reverse:</span> {domain.reverseRule}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Discontinue:</span> {domain.discontinueRule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Discontinue banner */}
        {discontinued && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-3">
            <OctagonX className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Discontinue Rule Triggered</p>
              <p className="text-xs text-red-600">
                5 consecutive scores of 0 detected (ending at item #{discontinuePoint}). All remaining items have been automatically scored as 0.
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="px-5 py-3 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: discontinued ? '#ef4444' : color }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {answered} of {total} answered ({pct}%)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="w-3.5 h-3.5" />
              <span className="tabular-nums font-medium">{formatTime(domain ? getDomainElapsedSeconds(domain) : 0)}</span>
            </span>
            <span className="font-medium" style={{ color }}>
              Raw Score: {rawScore}
            </span>
            <span className="text-muted-foreground">/ {maxScore}</span>
          </div>
        </div>
      </div>

      {/* Items grouped by start point */}
      <div className="space-y-2">
        {groupedItems.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {group.label}
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3">
              {group.items.map(item => {
                const isStart = item.number === startItemNumber;
                const isPreScored = item.number < startItemNumber;
                const isDiscontinuedItem = discontinuePoint !== null && item.number > discontinuePoint;
                return (
                  <div key={item.number} ref={isStart ? startItemRef : undefined}>
                    <ScoringItem
                      item={item}
                      domainId={domain.id}
                      domainColor={color}
                      isStartItem={isStart}
                      isPreScored={isPreScored}
                      isDiscontinued={isDiscontinuedItem}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={isFirst}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {discontinued ? (
            <span className="flex items-center gap-1 text-red-600">
              <OctagonX className="w-3.5 h-3.5" />
              Domain discontinued at item #{discontinuePoint}
            </span>
          ) : answered === total ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All items scored
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {total - answered} items remaining
            </span>
          )}
        </div>

        <Button
          onClick={goNext}
          className="gap-2"
          style={{ backgroundColor: color }}
        >
          {isLast ? 'View Summary' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
