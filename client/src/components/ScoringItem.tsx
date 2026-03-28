/*
 * Design: Clinical Precision — Swiss Medical Design
 * Individual assessment item with criteria-based scoring
 * Supports: pre-scored items (before start point), discontinued items, and active scoring
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import type { AssessmentItem } from '@/lib/assessmentData';
import { cn } from '@/lib/utils';
import { Info, MessageCircle, Lock, Ban } from 'lucide-react';
import { useState } from 'react';

interface ScoringItemProps {
  item: AssessmentItem;
  domainId: string;
  domainColor: string;
  isStartItem?: boolean;
  isPreScored?: boolean;
  isDiscontinued?: boolean;
}

export default function ScoringItem({
  item,
  domainId,
  domainColor,
  isStartItem,
  isPreScored,
  isDiscontinued,
}: ScoringItemProps) {
  const { state, dispatch } = useAssessment();
  const itemKey = `${domainId}-${item.number}`;
  const currentScore = state.scores[itemKey];
  const [showCriteria, setShowCriteria] = useState(false);

  const isLocked = isPreScored || isDiscontinued;

  const handleScore = (value: number) => {
    if (isLocked) return;
    const newValue = currentScore === value ? null : value;
    dispatch({ type: 'SET_SCORE', payload: { itemId: itemKey, score: newValue, domainId } });
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-lg border border-border p-4 transition-all',
        !isLocked && 'hover:shadow-sm',
        currentScore !== undefined && currentScore !== null && 'border-l-[3px]',
        isStartItem && 'ring-2 ring-offset-2',
        isPreScored && 'opacity-60 bg-green-50/50',
        isDiscontinued && 'opacity-50 bg-gray-50'
      )}
      style={{
        borderLeftColor: currentScore !== undefined && currentScore !== null ? domainColor : undefined,
        borderLeftWidth: currentScore !== undefined && currentScore !== null ? '3px' : undefined,
        outlineColor: isStartItem ? domainColor : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Item number */}
        <div
          className={cn(
            'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold',
            isDiscontinued && 'bg-gray-200 text-gray-400'
          )}
          style={!isDiscontinued ? { backgroundColor: `${domainColor}15`, color: domainColor } : undefined}
        >
          {item.number}
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium leading-relaxed',
                isDiscontinued ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {item.description}
              </p>
              {item.material && !isDiscontinued && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Materials:</span> {item.material}
                </p>
              )}
              {isStartItem && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white mt-1.5"
                  style={{ backgroundColor: domainColor }}
                >
                  START POINT
                </span>
              )}
              {isPreScored && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 mt-1.5">
                  <Lock className="w-3 h-3" />
                  AUTO-SCORED (Before Start Point)
                </span>
              )}
              {isDiscontinued && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 mt-1.5">
                  <Ban className="w-3 h-3" />
                  DISCONTINUED
                </span>
              )}
            </div>
            {item.criteria.length > 0 && !isDiscontinued && (
              <button
                onClick={() => setShowCriteria(!showCriteria)}
                className="flex-shrink-0 mt-0.5"
              >
                <Info className={cn(
                  'w-4 h-4 transition-colors',
                  showCriteria ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )} />
              </button>
            )}
          </div>

          {/* Caregiver question */}
          {item.caregiverQuestion && !isDiscontinued && (
            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">{item.caregiverQuestion}</p>
              </div>
            </div>
          )}

          {/* Scoring criteria (expandable) */}
          {showCriteria && item.criteria.length > 0 && !isDiscontinued && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Scoring Criteria</p>
              {item.criteria.map((c, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 text-xs p-1.5 rounded',
                    currentScore === c.score && 'bg-white shadow-sm'
                  )}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                    style={{ backgroundColor: c.score === 2 ? '#22c55e' : c.score === 1 ? '#f59e0b' : '#ef4444' }}
                  >
                    {c.score}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{c.description}</span>
                </div>
              ))}
              {item.notes && item.notes.length > 0 && (
                <div className="pt-2 border-t border-border mt-2">
                  {item.notes.map((note, idx) => (
                    <p key={idx} className="text-[10px] text-muted-foreground italic">{note}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scoring buttons */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[2, 1, 0].map(score => {
              const isSelected = currentScore === score;
              const label = score === 2 ? 'Mastery' : score === 1 ? 'Emerging' : 'Not Present';
              const bgColor = score === 2 ? '#22c55e' : score === 1 ? '#f59e0b' : '#ef4444';
              return (
                <button
                  key={score}
                  onClick={() => handleScore(score)}
                  disabled={isLocked}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white text-muted-foreground border-border',
                    isLocked
                      ? 'cursor-not-allowed opacity-70'
                      : 'hover:border-foreground/20 hover:text-foreground'
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: bgColor, borderColor: bgColor }
                      : undefined
                  }
                >
                  <span className="font-bold mr-1">{score}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
