/*
 * Design: Clinical Precision — Swiss Medical Design
 * Left-anchored vertical stepper with domain-colored indicators
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { domains } from '@/lib/assessmentData';
import { cn } from '@/lib/utils';
import { Brain, MessageSquare, Move, Heart, Star, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const domainIcons: Record<string, React.ReactNode> = {
  cognitive: <Brain className="w-4 h-4" />,
  language: <MessageSquare className="w-4 h-4" />,
  motor: <Move className="w-4 h-4" />,
  'social-emotional': <Heart className="w-4 h-4" />,
  'adaptive-behavior': <Star className="w-4 h-4" />,
};

export default function DomainSidebar() {
  const { state, dispatch, getDomainAnsweredCount, getDomainTotalItems, getSubdomainAnsweredCount, getAllItems } = useAssessment();
  const [expandedDomain, setExpandedDomain] = useState<number>(state.currentDomainIndex);

  const handleDomainClick = (index: number) => {
    if (expandedDomain === index) {
      setExpandedDomain(-1);
    } else {
      setExpandedDomain(index);
    }
    dispatch({ type: 'SET_DOMAIN', payload: index });
  };

  const handleSubdomainClick = (domainIndex: number, subIndex: number) => {
    dispatch({ type: 'SET_DOMAIN', payload: domainIndex });
    dispatch({ type: 'SET_SUBDOMAIN', payload: subIndex });
  };

  return (
    <div className="w-full">
      {/* Child info summary */}
      <div className="px-4 py-3 mb-3 bg-white rounded-lg border border-border shadow-sm">
        <p className="text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {state.childInfo.firstName} {state.childInfo.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          DOB: {state.childInfo.dateOfBirth} &middot; Exam: {state.childInfo.examDate}
        </p>
      </div>

      {/* Domain navigation */}
      <nav className="space-y-1">
        {domains.map((domain, dIdx) => {
          const answered = getDomainAnsweredCount(domain);
          const total = getDomainTotalItems(domain);
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          const isActive = state.currentDomainIndex === dIdx;
          const isExpanded = expandedDomain === dIdx;

          return (
            <div key={domain.id}>
              <button
                onClick={() => handleDomainClick(dIdx)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                  isActive
                    ? 'bg-white shadow-sm border border-border'
                    : 'hover:bg-white/60'
                )}
                style={{ borderLeftWidth: isActive ? '3px' : '0', borderLeftColor: isActive ? domain.color : 'transparent' }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${domain.color}15`, color: domain.color }}
                >
                  {domainIcons[domain.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {domain.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: domain.color }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {answered}/{total}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Subdomains */}
              {isExpanded && domain.subdomains.length > 1 && (
                <div className="ml-6 mt-1 space-y-0.5 pb-1">
                  {domain.subdomains.map((sub, sIdx) => {
                    const subItems = getAllItems(sub);
                    const subAnswered = getSubdomainAnsweredCount(sub);
                    const isSubActive = isActive && state.currentSubdomainIndex === sIdx;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubdomainClick(dIdx, sIdx)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-xs transition-all',
                          isSubActive
                            ? 'bg-white shadow-sm font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/40'
                        )}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSubActive ? domain.color : '#d1d5db' }}
                        />
                        <span className="truncate">{sub.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {subAnswered}/{subItems.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Summary button */}
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'summary' })}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm mt-3',
            state.currentStep === 'summary'
              ? 'bg-white shadow-sm border border-border'
              : 'hover:bg-white/60'
          )}
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-foreground/5">
            <BarChart3 className="w-4 h-4 text-foreground/60" />
          </div>
          <p className="font-medium text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Summary & Report
          </p>
        </button>
      </nav>
    </div>
  );
}
