/**
 * UnifiedSidebar
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Shows all selected forms and their domains in a sticky sidebar.
 * Tracks progress per domain with visual indicators.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getFormById } from '@/lib/formRegistry';
import { cn } from '@/lib/utils';
import { Check, Clock, AlertTriangle, ChevronDown, ChevronRight, Pause, Play, FileText } from 'lucide-react';
import { useState } from 'react';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function UnifiedSidebar() {
  const { state, dispatch, getDomainProgress, getRawScore } = useMultiAssessment();
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>(() => {
    const expanded: Record<string, boolean> = {};
    state.formSelections.forEach(fs => { expanded[fs.formId] = true; });
    return expanded;
  });

  const toggleForm = (formId: string) => {
    setExpandedForms(prev => ({ ...prev, [formId]: !prev[formId] }));
  };

  const totalElapsed = state.totalElapsedSeconds;
  const totalH = Math.floor(totalElapsed / 3600);
  const totalM = Math.floor((totalElapsed % 3600) / 60);
  const totalS = totalElapsed % 60;
  const totalTimeStr = totalH > 0
    ? `${totalH}:${totalM.toString().padStart(2, '0')}:${totalS.toString().padStart(2, '0')}`
    : `${totalM}:${totalS.toString().padStart(2, '0')}`;

  return (
    <div className="w-64 bg-white border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {state.childInfo.firstName} {state.childInfo.lastName}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TIMER' })}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              state.timerRunning ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            )}
            title={state.timerRunning ? 'Pause timer' : 'Resume timer'}
          >
            {state.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Total: {totalTimeStr}</span>
          {!state.timerRunning && <span className="text-amber-600 font-medium">(paused)</span>}
        </div>
      </div>

      {/* Form/Domain Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {state.formSelections.map(fs => {
          const form = getFormById(fs.formId);
          if (!form) return null;
          const formState = state.formStates[fs.formId];
          const isExpanded = expandedForms[fs.formId] !== false;
          const isActiveForm = state.activeFormId === fs.formId;

          // Calculate form-level progress
          let totalScored = 0;
          let totalItems = 0;
          fs.selectedDomainIds.forEach(dId => {
            const prog = getDomainProgress(fs.formId, dId);
            totalScored += prog.scored;
            totalItems += prog.total;
          });
          const formPct = totalItems > 0 ? Math.round((totalScored / totalItems) * 100) : 0;

          return (
            <div key={fs.formId} className="mb-1">
              {/* Form header */}
              <button
                onClick={() => toggleForm(fs.formId)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-muted/50 transition-colors',
                  isActiveForm && 'bg-muted/30'
                )}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: form.color }}
                />
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{form.shortName}</p>
                  <p className="text-[10px] text-muted-foreground">{formPct}% complete</p>
                </div>
              </button>

              {/* Domain list */}
              {isExpanded && (
                <div className="ml-4 border-l-2 border-gray-100">
                  {fs.selectedDomainIds.map(domainLocalId => {
                    const domain = form.domains.find(d => d.localId === domainLocalId);
                    if (!domain) return null;
                    const domainState = formState?.domains[domainLocalId];
                    const isActive = state.activeFormId === fs.formId && state.activeDomainLocalId === domainLocalId;
                    const progress = getDomainProgress(fs.formId, domainLocalId);
                    const pct = progress.total > 0 ? Math.round((progress.scored / progress.total) * 100) : 0;
                    const rawScore = getRawScore(fs.formId, domainLocalId);
                    const isDiscontinued = domainState?.discontinued || false;
                    const isComplete = pct === 100;
                    const timer = domainState?.timerSeconds || 0;

                    return (
                      <button
                        key={domainLocalId}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_DOMAIN', formId: fs.formId, domainLocalId })}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-left transition-all border-l-2 -ml-[2px]',
                          isActive
                            ? 'border-l-2 bg-muted/50'
                            : 'border-transparent hover:bg-muted/30 hover:border-gray-200'
                        )}
                        style={isActive ? { borderLeftColor: form.color } : undefined}
                      >
                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {isDiscontinued ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          ) : isComplete ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <div
                              className="w-3.5 h-3.5 rounded-full border-2"
                              style={{
                                borderColor: pct > 0 ? form.color : '#d1d5db',
                                backgroundColor: pct > 0 ? `${form.color}20` : 'transparent',
                              }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs font-medium truncate',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {domain.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {progress.scored}/{progress.total}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              RS: {rawScore}
                            </span>
                            {timer > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTime(timer)}
                              </span>
                            )}
                          </div>
                          {/* Mini progress bar */}
                          <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: isDiscontinued ? '#ef4444' : form.color,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={() => dispatch({ type: 'GO_TO_SUMMARY' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0D7377] text-white rounded-lg text-xs font-medium hover:bg-[#0a5c5f] transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          View Summary Report
        </button>
        <button
          onClick={() => {
            if (confirm('Return to setup? Your progress is auto-saved.')) {
              dispatch({ type: 'GO_TO_PHASE', phase: 'childInfo' });
            }
          }}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          ← Back to Setup
        </button>
      </div>
    </div>
  );
}
