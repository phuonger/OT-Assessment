/**
 * UnifiedScoringItem
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Supports all scoring types: Bayley (0/1/2), Binary (0/1), Yes/No, Likert-5
 * Features: scoring criteria tooltips, examiner notes, pre-scored/discontinued states
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getScoringLabels, getFormById, type ScoringType, type UnifiedItem } from '@/lib/formRegistry';
import { cn } from '@/lib/utils';
import { Info, MessageCircle, Lock, Ban, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';

interface UnifiedScoringItemProps {
  item: UnifiedItem;
  formId: string;
  domainLocalId: string;
  domainColor: string;
  scoringType: ScoringType;
  isStartItem?: boolean;
  isPreScored?: boolean;
  isDiscontinued?: boolean;
}

export default function UnifiedScoringItem({
  item,
  formId,
  domainLocalId,
  domainColor,
  scoringType,
  isStartItem,
  isPreScored,
  isDiscontinued,
}: UnifiedScoringItemProps) {
  const { state, dispatch } = useMultiAssessment();
  const formState = state.formStates[formId];
  const domainState = formState?.domains[domainLocalId];
  const currentScore = domainState?.scores[item.number] ?? null;
  const currentNote = domainState?.notes[item.number] || '';
  const [notesOpen, setNotesOpen] = useState(currentNote.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Items after the discontinue point are fully locked (auto-scored as 0).
  // Items AT or BEFORE the discontinue point remain editable so the user can undo.
  // The isDiscontinued prop only applies to items AFTER the discontinue point.
  const isLocked = isPreScored || isDiscontinued;
  const scoringLabels = getScoringLabels(scoringType);

  // Check if this item is at the discontinue boundary (at or near the trigger point)
  // These items should show a visual hint that they can be edited to undo
  const isAtDiscontinueBoundary = !isDiscontinued && !isPreScored &&
    domainState?.discontinued && domainState.discontinuedAtItem !== null &&
    item.number <= domainState.discontinuedAtItem &&
    item.number > domainState.discontinuedAtItem - (getFormById(formId)?.discontinueRule?.consecutiveZeros || 5); // show hint on items in the discontinue window

  useEffect(() => {
    if (notesOpen && textareaRef.current && !currentNote) {
      textareaRef.current.focus();
    }
  }, [notesOpen]);

  const handleScore = (value: number) => {
    if (isLocked) return;
    const newValue = currentScore === value ? null : value;
    if (newValue !== null) {
      dispatch({ type: 'SET_SCORE', formId, domainLocalId, itemNumber: item.number, score: newValue });
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_NOTE', formId, domainLocalId, itemNumber: item.number, note: e.target.value });
  };

  const hasCriteria = item.scoringCriteria && item.scoringCriteria.length > 0;
  const hasExaminerNote = currentNote.length > 0;

  return (
    <div
      data-item-number={item.number}
      className={cn(
        'group bg-white rounded-lg border border-border p-4 transition-all',
        !isLocked && 'hover:shadow-sm',
        currentScore !== null && currentScore !== undefined && 'border-l-[3px]',
        isStartItem && 'ring-2 ring-offset-2',
        isPreScored && 'opacity-60 bg-green-50/50',
        isDiscontinued && 'opacity-50 bg-gray-50'
      )}
      style={{
        borderLeftColor: currentScore !== null && currentScore !== undefined ? domainColor : undefined,
        borderLeftWidth: currentScore !== null && currentScore !== undefined ? '3px' : undefined,
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
              {item.materials && !isDiscontinued && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Materials:</span> {item.materials}
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
              {isAtDiscontinueBoundary && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 mt-1.5">
                  Change score to undo discontinue
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!isPreScored && !isDiscontinued && (
                <button
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    hasExaminerNote
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setNotesOpen(!notesOpen)}
                  aria-label={notesOpen ? 'Hide examiner notes' : 'Add examiner notes'}
                  title={notesOpen ? 'Hide notes' : 'Add notes'}
                >
                  <StickyNote className="w-4 h-4" />
                </button>
              )}

              {hasCriteria && !isDiscontinued && (
                <HoverCard openDelay={150} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-muted/50 transition-colors" aria-label="View scoring criteria">
                      <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" align="start" sideOffset={8} className="w-80 p-0 overflow-hidden">
                    <div className="px-3 py-2 border-b" style={{ backgroundColor: `${domainColor}08`, borderColor: `${domainColor}20` }}>
                      <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: domainColor }}>
                        Item {item.number} — Scoring Criteria
                      </p>
                    </div>
                    <div className="p-3 space-y-2">
                      {item.scoringCriteria!.map((c, idx) => {
                        const isActive = currentScore === c.score;
                        const labelInfo = scoringLabels.find(sl => sl.value === c.score);
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
                              style={{ backgroundColor: labelInfo?.color || '#94a3b8' }}
                            >
                              {c.score}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                {c.label || labelInfo?.label || `Score ${c.score}`}
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
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
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
            {scoringLabels.map(sl => {
              const isSelected = currentScore === sl.value;
              return (
                <button
                  key={sl.value}
                  onClick={() => handleScore(sl.value)}
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
                      ? { backgroundColor: sl.color, borderColor: sl.color }
                      : undefined
                  }
                >
                  <span className="font-bold mr-1">{sl.value}</span>
                  {sl.label}
                </button>
              );
            })}
          </div>

          {/* Examiner notes — collapsible */}
          {notesOpen && !isPreScored && !isDiscontinued && (
            <div className="mt-3 border border-amber-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 bg-amber-50 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                onClick={() => setNotesOpen(false)}
              >
                <span className="flex items-center gap-1.5">
                  <StickyNote className="w-3 h-3" />
                  Examiner Notes
                  {hasExaminerNote && <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded-full">saved</span>}
                </span>
                <ChevronUp className="w-3 h-3" />
              </button>
              <textarea
                ref={textareaRef}
                value={currentNote}
                onChange={handleNoteChange}
                placeholder="Add clinical observations, behavioral notes, or comments for this item..."
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border-0 outline-none resize-none placeholder:text-muted-foreground/60"
                rows={2}
              />
            </div>
          )}

          {/* Collapsed note indicator */}
          {!notesOpen && hasExaminerNote && !isPreScored && !isDiscontinued && (
            <button
              className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700 hover:text-amber-800 transition-colors"
              onClick={() => setNotesOpen(true)}
            >
              <StickyNote className="w-3 h-3" />
              <span className="italic truncate max-w-xs">{currentNote}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
