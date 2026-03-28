/*
 * Design: Clinical Precision — Swiss Medical Design
 * Left-anchored vertical stepper with domain-colored indicators
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { cn } from '@/lib/utils';
import { Brain, Move, Hand, BarChart3, MessageSquare } from 'lucide-react';

const domainIcons: Record<string, React.ReactNode> = {
  cognitive: <Brain className="w-4 h-4" />,
  receptiveCommunication: <MessageSquare className="w-4 h-4" />,
  expressiveCommunication: <MessageSquare className="w-4 h-4" />,
  fineMotor: <Hand className="w-4 h-4" />,
  grossMotor: <Move className="w-4 h-4" />,
};

const domainColors: Record<string, string> = {
  cognitive: '#0D7377',
  receptiveCommunication: '#B8860B',
  expressiveCommunication: '#9B6B2F',
  fineMotor: '#2D6A4F',
  grossMotor: '#7B5B3A',
};

export default function DomainSidebar() {
  const { state, dispatch, getSelectedDomains, getDomainAnsweredCount } = useAssessment();
  const selectedDomains = getSelectedDomains();

  const handleDomainClick = (index: number) => {
    dispatch({ type: 'SET_DOMAIN', payload: index });
    dispatch({ type: 'SET_STEP', payload: 'assessment' });
  };

  return (
    <div className="w-full">
      {/* Child info summary */}
      <div className="px-4 py-3 mb-3 bg-white rounded-lg border border-border shadow-sm">
        <p className="text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {state.childInfo.firstName} {state.childInfo.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {state.childInfo.dateOfBirth && <>DOB: {state.childInfo.dateOfBirth} &middot; </>}
          Exam: {state.childInfo.examDate}
        </p>
        {state.childInfo.startPointLetter && (
          <p className="text-xs font-medium text-[#0D7377] mt-1">
            Start Point: {state.childInfo.startPointLetter}
          </p>
        )}
      </div>

      {/* Domain navigation */}
      <nav className="space-y-1">
        {selectedDomains.map((domain, dIdx) => {
          const answered = getDomainAnsweredCount(domain);
          const total = domain.items.length;
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          const isActive = state.currentDomainIndex === dIdx && state.currentStep === 'assessment';
          const color = domainColors[domain.id] || '#0D7377';

          return (
            <button
              key={domain.id}
              onClick={() => handleDomainClick(dIdx)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                isActive
                  ? 'bg-white shadow-sm border border-border'
                  : 'hover:bg-white/60'
              )}
              style={{ borderLeftWidth: isActive ? '3px' : '0', borderLeftColor: isActive ? color : 'transparent' }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}15`, color }}
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
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    {answered}/{total}
                  </span>
                </div>
              </div>
            </button>
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
