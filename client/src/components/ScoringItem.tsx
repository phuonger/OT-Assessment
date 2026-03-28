/*
 * Design: Clinical Precision — Swiss Medical Design
 * Individual assessment item with hover-card scoring criteria tooltips
 * Supports: pre-scored items (before start point), discontinued items, and active scoring
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import type { AssessmentItem } from '@/lib/assessmentData';
import { cn } from '@/lib/utils';
import { Info, MessageCircle, Lock, Ban } from 'lucide-react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';

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

  const isLocked = isPreScored || isDiscontinued;

  const handleScore = (value: number) => {
    if (isLocked) return;
    const newValue = currentScore === value ? null : value;
    dispatch({ type: 'SET_SCORE', payload: { itemId: itemKey, score: newValue, domainId } });
  };

  const hasCriteria = item.criteria.length > 0;
  const hasNotes = item.notes && item.notes.length > 0;

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

            {/* Scoring criteria hover card */}
            {(hasCriteria || hasNotes) && !isDiscontinued && (
              <HoverCard openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    className="flex-shrink-0 mt-0.5 p-1 rounded-md hover:bg-muted/50 transition-colors"
                    aria-label="View scoring criteria"
                  >
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="left"
                  align="start"
                  sideOffset={8}
                  className="w-80 p-0 overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="px-3 py-2 border-b"
                    style={{ backgroundColor: `${domainColor}08`, borderColor: `${domainColor}20` }}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: domainColor }}>
                      Item {item.number} — Scoring Criteria
                    </p>
                  </div>

                  {/* Criteria list */}
                  {hasCriteria && (
                    <div className="p-3 space-y-2">
                      {item.criteria.map((c, idx) => {
                        const isActive = currentScore === c.score;
                        const bgMap: Record<number, string> = { 2: '#22c55e', 1: '#f59e0b', 0: '#ef4444' };
                        const labelMap: Record<number, string> = { 2: 'Mastery', 1: 'Emerging', 0: 'Not Present' };
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-2.5 p-2 rounded-md transition-colors',
                              isActive && 'bg-muted/50 ring-1 ring-border'
                            )}
                          >
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5"
                              style={{ backgroundColor: bgMap[c.score] || '#94a3b8' }}
                            >
                              {c.score}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                {labelMap[c.score] || `Score ${c.score}`}
                                {isActive && (
                                  <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground normal-case tracking-normal">
                                    Selected
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-foreground leading-relaxed">{c.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Notes section */}
                  {hasNotes && (
                    <div className="px-3 pb-3 pt-1 border-t border-border">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Notes</p>
                      {item.notes!.map((note, idx) => (
                        <p key={idx} className="text-[11px] text-muted-foreground italic leading-relaxed">{note}</p>
                      ))}
                    </div>
                  )}
                </HoverCardContent>
              </HoverCard>
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
