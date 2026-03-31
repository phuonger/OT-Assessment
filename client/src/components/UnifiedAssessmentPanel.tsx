/**
 * UnifiedAssessmentPanel
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Renders the active domain's items for any form type.
 * Handles start points, pre-scoring, discontinue rules, and adjustable start points.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getFormById, type UnifiedDomain } from '@/lib/formRegistry';
import UnifiedScoringItem from './UnifiedScoringItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { useMemo, useRef, useEffect } from 'react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function UnifiedAssessmentPanel() {
  const { state, dispatch, getActiveForm, getActiveDomain, getDomainProgress, getRawScore } = useMultiAssessment();
  const scrollRef = useRef<HTMLDivElement>(null);

  const form = getActiveForm();
  const domain = getActiveDomain();

  const formState = form ? state.formStates[form.id] : null;
  const domainState = domain && formState ? formState.domains[domain.localId] : null;

  const startItem = useMemo(() => {
    if (!form || !domain || !formState) return 1;
    return form.getStartItem(domain.localId, formState.ageRangeLabel);
  }, [form, domain, formState?.ageRangeLabel]);

  // Scroll to top when domain changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.activeFormId, state.activeDomainLocalId]);

  if (!form || !domain || !domainState) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a domain from the sidebar to begin assessment.</p>
      </div>
    );
  }

  const progress = getDomainProgress(form.id, domain.localId);
  const rawScore = getRawScore(form.id, domain.localId);
  const timerSeconds = domainState.timerSeconds;

  const handleAgeRangeChange = (newLabel: string) => {
    dispatch({ type: 'ADJUST_START_POINT', formId: form.id, newAgeRangeLabel: newLabel });
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {/* Domain Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: form.color }}
              />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{domain.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {form.shortName} • {progress.scored}/{progress.total} items scored • Raw Score: {rawScore}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timerSeconds)}
              </div>
              {/* Progress bar */}
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.scored / progress.total) * 100 : 0}%`,
                    backgroundColor: form.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Adjustable start point (for forms with start points) */}
          {form.hasStartPoints && form.ageRanges.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Start Point:</span>
              <Select value={formState?.ageRangeLabel || ''} onValueChange={handleAgeRangeChange}>
                <SelectTrigger className="h-7 text-xs w-auto min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {form.ageRanges.map(ar => (
                    <SelectItem key={ar.label} value={ar.label} className="text-xs">
                      {ar.label}
                      {ar.startPoint && ` (${ar.startPoint})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                → Item {startItem}
              </span>
            </div>
          )}
        </div>

        {/* Discontinued banner */}
        {domainState.discontinued && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs font-medium text-red-700">
              Domain discontinued at item {domainState.discontinuedAtItem} ({form.discontinueRule?.consecutiveZeros || 5} consecutive scores of 0). Remaining items auto-scored as 0.
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-3">
        {domain.items.map(item => {
          const isPreScored = form.hasStartPoints && item.number < startItem;
          const isDiscontinued = domainState.discontinued &&
            domainState.discontinuedAtItem !== null &&
            item.number > domainState.discontinuedAtItem;
          const isStartItemFlag = form.hasStartPoints && item.number === startItem;

          return (
            <UnifiedScoringItem
              key={item.number}
              item={item}
              formId={form.id}
              domainLocalId={domain.localId}
              domainColor={form.color}
              scoringType={domain.scoringType}
              isStartItem={isStartItemFlag}
              isPreScored={isPreScored}
              isDiscontinued={isDiscontinued}
            />
          );
        })}
      </div>
    </div>
  );
}
