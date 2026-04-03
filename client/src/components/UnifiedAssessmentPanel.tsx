/**
 * UnifiedAssessmentPanel
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Renders the active domain's items for any form type.
 * Handles start points, pre-scoring, discontinue rules, and adjustable start points.
 * Auto-scrolls to start point item when entering a domain.
 * Shows Next Domain / Next Test navigation at the bottom.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getFormById, type UnifiedDomain } from '@/lib/formRegistry';
import UnifiedScoringItem from './UnifiedScoringItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Clock, ArrowRight, CheckCircle2, FlaskConical } from 'lucide-react';
import { useMemo, useRef, useEffect, useCallback } from 'react';

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

  // Compute next domain/form info for the navigation button
  const nextTarget = useMemo(() => {
    if (!form || !domain) return null;

    const currentFormSelection = state.formSelections.find(fs => fs.formId === form.id);
    if (!currentFormSelection) return null;

    const currentDomainIdx = currentFormSelection.selectedDomainIds.indexOf(domain.localId);

    // Check if there's a next domain in the same form
    if (currentDomainIdx < currentFormSelection.selectedDomainIds.length - 1) {
      const nextDomainLocalId = currentFormSelection.selectedDomainIds[currentDomainIdx + 1];
      const nextDomain = form.domains.find(d => d.localId === nextDomainLocalId);
      return {
        type: 'domain' as const,
        formId: form.id,
        domainLocalId: nextDomainLocalId,
        label: nextDomain?.name || 'Next Domain',
        formName: form.shortName,
      };
    }

    // Check if there's a next form
    const currentFormIdx = state.formSelections.findIndex(fs => fs.formId === form.id);
    if (currentFormIdx < state.formSelections.length - 1) {
      const nextFormSelection = state.formSelections[currentFormIdx + 1];
      const nextForm = getFormById(nextFormSelection.formId);
      if (nextForm && nextFormSelection.selectedDomainIds.length > 0) {
        const nextDomainLocalId = nextFormSelection.selectedDomainIds[0];
        const nextDomain = nextForm.domains.find(d => d.localId === nextDomainLocalId);
        return {
          type: 'form' as const,
          formId: nextFormSelection.formId,
          domainLocalId: nextDomainLocalId,
          label: nextDomain?.name || 'First Domain',
          formName: nextForm.shortName,
        };
      }
    }

    // This is the last domain of the last form — go to summary
    return {
      type: 'summary' as const,
      formId: '',
      domainLocalId: '',
      label: 'View Summary Report',
      formName: '',
    };
  }, [form, domain, state.formSelections]);

  // Auto-scroll to start point item when domain changes
  useEffect(() => {
    if (!scrollRef.current || !form || !domain) return;

    // Small delay to let items render
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;

      // If start item > 1, scroll to it; otherwise scroll to top
      if (startItem > 1) {
        const targetEl = scrollRef.current.querySelector(`[data-item-number="${startItem}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);

    return () => clearTimeout(timer);
  }, [state.activeFormId, state.activeDomainLocalId, startItem, form, domain]);

  const handleNextNavigation = useCallback(() => {
    if (!nextTarget) return;

    if (nextTarget.type === 'summary') {
      dispatch({ type: 'GO_TO_SUMMARY' });
    } else {
      dispatch({ type: 'SET_ACTIVE_DOMAIN', formId: nextTarget.formId, domainLocalId: nextTarget.domainLocalId });
    }
  }, [nextTarget, dispatch]);

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

  // Check if this is a DAYC-2 form using Bayley-4 AB scoring
  const currentFormSelection = state.formSelections.find(fs => fs.formId === form.id);
  const isDayc2Bayley4AB = (form.id === 'dayc2' || form.id === 'dayc2sp') && currentFormSelection?.scoringMethod === 'bayley4ab';

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
                {isDayc2Bayley4AB && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <FlaskConical className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] font-medium text-amber-600">Scoring: Bayley-4 Adaptive Behavior Scales</span>
                  </div>
                )}
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
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700">
                Domain discontinued at item {domainState.discontinuedAtItem} ({form.discontinueRule?.consecutiveZeros || 5} consecutive {form.discontinueRule?.threshold ? `scores of ${form.discontinueRule.threshold} or below` : 'scores of 0'}). Remaining items auto-scored as 0.
              </p>
              <p className="text-[10px] text-red-500 mt-0.5">
                To undo: change a score on items at or before item {domainState.discontinuedAtItem} to break the consecutive chain.
              </p>
            </div>
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

      {/* Next Domain / Next Test Navigation */}
      {nextTarget && (
        <div className="px-6 pb-6 pt-2">
          <div className="border-t border-border pt-5">
            <button
              onClick={handleNextNavigation}
              className="w-full group flex items-center justify-between px-5 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                {nextTarget.type === 'summary' ? (
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${form.color}15` }}
                  >
                    <ArrowRight className="w-5 h-5" style={{ color: form.color }} />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-[#0D7377] transition-colors">
                    {nextTarget.type === 'summary'
                      ? 'View Summary Report'
                      : nextTarget.type === 'form'
                        ? `Next: ${nextTarget.formName}`
                        : `Next: ${nextTarget.label}`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextTarget.type === 'summary'
                      ? 'All domains complete — review scores and generate report'
                      : nextTarget.type === 'form'
                        ? `Continue to ${nextTarget.label} in ${nextTarget.formName}`
                        : `Continue to the next domain in ${nextTarget.formName}`
                    }
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#0D7377] group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
