/**
 * Dashboard
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Shown after the welcome screen. Displays:
 * - "Start New Assessment" button
 * - List of last 5 saved assessments with status badges, delete, duplicate,
 *   Resume label, and completion progress bar on in-progress cards
 * - "See All Assessments" button if more exist
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getAllMultiSessions, deleteMultiSession, duplicateMultiSession, saveMultiSession, type SavedMultiSession } from '@/lib/multiSessionStorage';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ArrowRight,
  Clock,
  User,
  ChevronRight,
  ClipboardCheck,
  Calendar,
  FileText,
  Settings,
  Shield,
  Trash2,
  Play,
  Copy,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { parseLocalDate } from '@/lib/dateUtils';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'completed';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      {isCompleted ? 'Completed' : 'In Progress'}
    </span>
  );
}

/** Compute completion percentage from formSummaries */
function getCompletionProgress(session: SavedMultiSession): { scored: number; total: number; percent: number } {
  let scored = 0;
  let total = 0;
  for (const form of session.formSummaries || []) {
    for (const domain of form.domains || []) {
      scored += domain.itemsScored;
      total += domain.totalItems;
    }
  }
  const percent = total > 0 ? Math.round((scored / total) * 100) : 0;
  return { scored, total, percent };
}

export default function Dashboard() {
  const { state, dispatch } = useMultiAssessment();

  const [sessions, setSessions] = useState(() => getAllMultiSessions());
  const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions]);
  const hasMore = sessions.length > 5;

  // Refresh sessions list whenever the component re-renders (e.g., after navigation)
  useEffect(() => {
    setSessions(getAllMultiSessions());
  }, [state.phase]);

  const handleNewAssessment = () => {
    // Auto-save current in-progress assessment if it has data
    const hasData = state.childInfo.firstName || state.childInfo.lastName;
    if (hasData) {
      try {
        saveMultiSession(state, 'in-progress', 'Auto-saved before new assessment');
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }
    dispatch({ type: 'NEW_ASSESSMENT' });
    // Refresh sessions list after auto-save
    setTimeout(() => setSessions(getAllMultiSessions()), 100);
  };

  const handleLoadSession = (session: SavedMultiSession) => {
    if (session.stateSnapshot) {
      dispatch({ type: 'LOAD_STATE', payload: { ...session.stateSnapshot, timerRunning: false } });
    }
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this assessment? This cannot be undone.')) {
      deleteMultiSession(sessionId);
      setSessions(getAllMultiSessions());
      toast.success('Assessment deleted');
    }
  };

  const handleDuplicate = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const dup = duplicateMultiSession(sessionId);
    if (dup) {
      setSessions(getAllMultiSessions());
      toast.success('Assessment duplicated — scores reset, child info kept');
    } else {
      toast.error('Failed to duplicate assessment');
    }
  };

  const handleSeeAll = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'allAssessments' });
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#faf8f5' }}>
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E1D8] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-[#0D7377]" />
            </div>
            <span
              className="text-sm font-semibold text-[#2C2825]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Assessment Suite
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'settings' })}
              className="p-2 rounded-lg text-[#8B8B8B] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'backup' })}
              className="p-2 rounded-lg text-[#8B8B8B] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors"
              title="Backup & Restore"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Start New Assessment — prominent CTA */}
        <div className="mb-10">
          <button
            onClick={handleNewAssessment}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D7377] to-[#0a5c5f] p-6 text-left text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold mb-0.5"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Start New Assessment
                  </h2>
                  <p className="text-white/70 text-sm">
                    Begin a fresh evaluation with blank forms
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -right-12 w-32 h-32 rounded-full bg-white/5" />
          </button>
        </div>

        {/* Saved Assessments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-semibold uppercase tracking-wider text-[#6B6B6B]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {sessions.length > 0 ? 'Recent Assessments' : 'No Saved Assessments'}
            </h3>
            {sessions.length > 0 && (
              <span className="text-xs text-[#BEBEBE]">
                {sessions.length} total
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-[#BEBEBE]" />
              </div>
              <p className="text-sm text-[#8B8B8B] mb-1">No assessments yet</p>
              <p className="text-xs text-[#BEBEBE]">
                Start a new assessment to begin evaluating
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => {
                const isInProgress = session.status !== 'completed';
                const progress = isInProgress ? getCompletionProgress(session) : null;

                return (
                  <button
                    key={session.id}
                    onClick={() => handleLoadSession(session)}
                    className="w-full flex flex-col bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0D7377]/30 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#0D7377]/8 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#0D7377]" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[#2C2825] truncate group-hover:text-[#0D7377] transition-colors">
                            {session.childName || 'Unknown Child'}
                          </p>
                          <StatusBadge status={session.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#8B8B8B]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {session.testDate
                              ? parseLocalDate(session.testDate).toLocaleDateString()
                              : 'No date'}
                          </span>
                          <span>
                            {session.formSummaries?.map((f) => f.formName).join(', ') || 'No forms'}
                          </span>
                        </div>
                      </div>

                      {/* Time, Resume, actions & arrow */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Resume label for in-progress */}
                        {isInProgress && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#0D7377] bg-[#0D7377]/8 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3" />
                            Resume
                          </span>
                        )}
                        <span className="text-[11px] text-[#BEBEBE] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(session.savedAt)}
                        </span>
                        <button
                          onClick={(e) => handleDuplicate(e, session.id)}
                          className="p-1.5 rounded-md text-[#D4D0C8] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors opacity-0 group-hover:opacity-100"
                          title="Duplicate assessment (new eval, same child)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="p-1.5 rounded-md text-[#D4D0C8] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#0D7377] transition-colors" />
                      </div>
                    </div>

                    {/* Completion progress bar for in-progress */}
                    {isInProgress && progress && progress.total > 0 && (
                      <div className="px-5 pb-3 -mt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#E5E1D8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0D7377]/60 rounded-full transition-all duration-500"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#8B8B8B] whitespace-nowrap">
                            {progress.scored}/{progress.total} items ({progress.percent}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* See All button */}
              {hasMore && (
                <button
                  onClick={handleSeeAll}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-dashed border-[#D4D0C8] text-sm text-[#6B6B6B] hover:border-[#0D7377]/40 hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-all"
                >
                  See All Assessments
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[#BEBEBE] text-[10px] text-center mt-12">
          All data is stored locally on your device.
        </p>
      </main>
    </div>
  );
}
