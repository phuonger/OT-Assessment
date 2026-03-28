/*
 * Design: Clinical Precision — Swiss Medical Design
 * Main content panel showing current domain/subdomain items
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { domains } from '@/lib/assessmentData';
import ScoringItem from './ScoringItem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

export default function AssessmentPanel() {
  const {
    state,
    dispatch,
    getSubdomainRawScore,
    getSubdomainAnsweredCount,
    getAllItems,
  } = useAssessment();

  const domain = domains[state.currentDomainIndex];
  const subdomain = domain.subdomains[state.currentSubdomainIndex];
  const items = useMemo(() => getAllItems(subdomain), [subdomain, getAllItems]);
  const answered = getSubdomainAnsweredCount(subdomain);
  const rawScore = getSubdomainRawScore(subdomain);
  const pct = items.length > 0 ? Math.round((answered / items.length) * 100) : 0;

  const goNext = () => {
    // Next subdomain in current domain
    if (state.currentSubdomainIndex < domain.subdomains.length - 1) {
      dispatch({ type: 'SET_SUBDOMAIN', payload: state.currentSubdomainIndex + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Next domain
    if (state.currentDomainIndex < domains.length - 1) {
      dispatch({ type: 'SET_DOMAIN', payload: state.currentDomainIndex + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Go to summary
    dispatch({ type: 'SET_STEP', payload: 'summary' });
  };

  const goPrev = () => {
    if (state.currentSubdomainIndex > 0) {
      dispatch({ type: 'SET_SUBDOMAIN', payload: state.currentSubdomainIndex - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (state.currentDomainIndex > 0) {
      const prevDomain = domains[state.currentDomainIndex - 1];
      dispatch({ type: 'SET_DOMAIN', payload: state.currentDomainIndex - 1 });
      dispatch({ type: 'SET_SUBDOMAIN', payload: prevDomain.subdomains.length - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isFirst = state.currentDomainIndex === 0 && state.currentSubdomainIndex === 0;
  const isLast = state.currentDomainIndex === domains.length - 1 && state.currentSubdomainIndex === domain.subdomains.length - 1;

  return (
    <div className="flex-1 min-w-0">
      {/* Domain header */}
      <div className="bg-white rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
        <div className="p-5 pb-4" style={{ borderBottom: `3px solid ${domain.color}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: domain.color }}
                >
                  {domain.name}
                </span>
                {domain.subdomains.length > 1 && (
                  <>
                    <span className="text-muted-foreground text-xs">/</span>
                    <span className="text-xs font-medium text-foreground">
                      {subdomain.name}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{items.length}</span> items
                </span>
                <span>
                  Scoring: <span className="font-medium text-foreground">
                    {subdomain.scoringType === 'mastery' ? '0–2 (Not Present / Emerging / Mastery)' :
                     subdomain.scoringType === 'frequency' ? '0–5 (Frequency Scale)' :
                     '0–2 (Never / Sometimes / Usually)'}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  Administration: <span className="font-medium text-foreground capitalize">{domain.administrationType}</span>
                </span>
              </div>
            </div>
            {domain.imageUrl && (
              <img
                src={domain.imageUrl}
                alt={domain.name}
                className="w-20 h-14 object-cover rounded-lg opacity-70 hidden sm:block"
              />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: domain.color }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {answered} of {items.length} answered ({pct}%)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium" style={{ color: domain.color }}>
              Raw Score: {rawScore}
            </span>
            <span className="text-muted-foreground">/ {subdomain.maxRawScore}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {subdomain.stages ? (
          subdomain.stages.map(stage => (
            <div key={stage.label}>
              <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: domain.color }}
                >
                  {stage.label}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{stage.ageRange}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {stage.items.map(item => (
                  <ScoringItem
                    key={item.id}
                    item={item}
                    subdomain={subdomain}
                    domainColor={domain.color}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          items.map(item => (
            <ScoringItem
              key={item.id}
              item={item}
              subdomain={subdomain}
              domainColor={domain.color}
            />
          ))
        )}
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
          {answered === items.length ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All items scored
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {items.length - answered} items remaining
            </span>
          )}
        </div>

        <Button
          onClick={goNext}
          className="gap-2"
          style={{ backgroundColor: domain.color }}
        >
          {isLast ? 'View Summary' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
