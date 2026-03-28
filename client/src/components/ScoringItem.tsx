/*
 * Design: Clinical Precision — Swiss Medical Design
 * Individual assessment item with radio-style scoring
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import type { AssessmentItem, Subdomain } from '@/lib/assessmentData';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ScoringItemProps {
  item: AssessmentItem;
  subdomain: Subdomain;
  domainColor: string;
}

export default function ScoringItem({ item, subdomain, domainColor }: ScoringItemProps) {
  const { state, dispatch } = useAssessment();
  const currentScore = state.scores[item.id];

  const handleScore = (value: number) => {
    const newValue = currentScore === value ? null : value;
    dispatch({ type: 'SET_SCORE', payload: { itemId: item.id, score: newValue } });
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-lg border border-border p-4 transition-all hover:shadow-sm',
        currentScore !== undefined && currentScore !== null && 'border-l-[3px]'
      )}
      style={{
        borderLeftColor: currentScore !== undefined && currentScore !== null ? domainColor : undefined,
        borderLeftWidth: currentScore !== undefined && currentScore !== null ? '3px' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Item number */}
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ backgroundColor: `${domainColor}12`, color: domainColor }}
        >
          {item.number}
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm leading-relaxed text-foreground flex-1">{item.text}</p>
            {(item.scoringTip || item.scoringCriteria) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex-shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  {item.scoringTip && <p className="mb-1">{item.scoringTip}</p>}
                  {item.scoringCriteria && <p className="text-muted-foreground">{item.scoringCriteria}</p>}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Scoring buttons */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {subdomain.scoringLabels.map(sl => {
              const isSelected = currentScore === sl.value;
              return (
                <button
                  key={sl.value}
                  onClick={() => handleScore(sl.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: domainColor, borderColor: domainColor }
                      : undefined
                  }
                >
                  <span className="font-bold mr-1">{sl.value}</span>
                  {sl.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
