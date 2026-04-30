/**
 * AllAssessments
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Full list of all saved assessments with search, filter by status,
 * sort by date/name, bulk delete, duplicate, Resume label, and
 * completion progress bar on in-progress cards.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getAllMultiSessions, deleteMultiSession, duplicateMultiSession, saveMultiSession, type SavedMultiSession } from '@/lib/multiSessionStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  User,
  Calendar,
  Clock,
  ChevronRight,
  Trash2,
  FileText,
  Plus,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Play,
  Copy,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { parseLocalDate } from '@/lib/dateUtils';

type StatusFilter = 'all' | 'in-progress' | 'completed';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

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

const SORT_LABELS: Record<SortOption, string> = {
  'date-desc': 'Newest First',
  'date-asc': 'Oldest First',
  'name-asc': 'Name A–Z',
  'name-desc': 'Name Z–A',
};

export default function AllAssessments() {
  const { state, dispatch } = useMultiAssessment();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState(() => getAllMultiSessions());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const filteredSortedSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.childName.toLowerCase().includes(q) ||
          s.label?.toLowerCase().includes(q) ||
          s.testDate?.includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'date-asc':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        case 'name-asc':
          return (a.childName || '').localeCompare(b.childName || '');
        case 'name-desc':
          return (b.childName || '').localeCompare(a.childName || '');
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, searchQuery, statusFilter, sortOption]);

  const handleLoadSession = (session: SavedMultiSession) => {
    if (selectMode) return;
    if (session.stateSnapshot) {
      // Determine the correct phase to navigate to:
      // - Completed sessions → summary (so user can view/export report)
      // - In-progress sessions → assessment (so user can continue scoring)
      // Never restore to 'dashboard', 'welcome', 'allAssessments' as that appears unresponsive
      let targetPhase = session.stateSnapshot.phase;
      if (session.status === 'completed') {
        targetPhase = 'summary';
      } else if (targetPhase === 'dashboard' || targetPhase === 'welcome' || targetPhase === 'allAssessments') {
        const hasFormData = Object.keys(session.stateSnapshot.formStates || {}).length > 0;
        targetPhase = hasFormData ? 'assessment' : 'childInfo';
      }
      dispatch({ type: 'LOAD_STATE', payload: { ...session.stateSnapshot, phase: targetPhase, timerRunning: false } });
    }
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this assessment? This cannot be undone.')) {
      deleteMultiSession(sessionId);
      setSessions(getAllMultiSessions());
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
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

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (confirm(`Delete ${count} assessment${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
      selectedIds.forEach((id) => deleteMultiSession(id));
      setSessions(getAllMultiSessions());
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(`${count} assessment${count !== 1 ? 's' : ''} deleted`);
    }
  };

  const toggleSelect = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSortedSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSortedSessions.map((s) => s.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBack = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' });
  };

  const handleNewAssessment = () => {
    // Auto-save current in-progress assessment if it has data
    // Skip if already on summary/report (assessment already completed, avoid duplicates)
    const hasData = state.childInfo.firstName || state.childInfo.lastName;
    const isAlreadySaved = state.phase === 'summary' || state.phase === 'report';
    if (hasData && !isAlreadySaved) {
      // Check if a completed session for this child+date already exists recently
      const childName = [state.childInfo.firstName, state.childInfo.lastName].filter(Boolean).join(' ').trim();
      const recentCompleted = sessions.find(
        s => s.status === 'completed' && s.childName === childName && s.testDate === state.childInfo.testDate
          && (Date.now() - new Date(s.savedAt).getTime()) < 120000
      );
      if (!recentCompleted) {
        try {
          saveMultiSession(state, 'in-progress', 'Auto-saved before new assessment');
        } catch (e) {
          console.error('Auto-save failed:', e);
        }
      }
    }
    dispatch({ type: 'NEW_ASSESSMENT' });
  };

  const allSelected = filteredSortedSessions.length > 0 && selectedIds.size === filteredSortedSessions.length;

  // Count by status for filter badges
  const inProgressCount = sessions.filter((s) => s.status === 'in-progress').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#faf8f5' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5E1D8] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <h1
              className="text-sm font-semibold text-[#2C2825]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              All Assessments
            </h1>
            <span className="text-xs text-[#BEBEBE]">
              {sessions.length} total
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleNewAssessment}
            className="gap-1.5 bg-[#0D7377] hover:bg-[#0a5c5f] text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BEBEBE]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by child name, label, or date..."
            className="pl-10 bg-white border-[#E5E1D8]"
          />
        </div>

        {/* Filter & Sort bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#8B8B8B] mr-0.5" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#0D7377] text-white'
                  : 'bg-white text-[#6B6B6B] border border-[#E5E1D8] hover:border-[#0D7377]/30'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setStatusFilter('in-progress')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                statusFilter === 'in-progress'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-[#6B6B6B] border border-[#E5E1D8] hover:border-amber-300'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-[#6B6B6B] border border-[#E5E1D8] hover:border-emerald-300'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Sort dropdown + Select toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-7 pr-3 py-1 rounded-lg text-[11px] font-medium bg-white border border-[#E5E1D8] text-[#6B6B6B] hover:border-[#0D7377]/30 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8B8B] pointer-events-none" />
            </div>

            {sessions.length > 0 && (
              <button
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectMode
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white text-[#6B6B6B] border border-[#E5E1D8] hover:border-[#0D7377]/30'
                }`}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectMode && (
          <div className="flex items-center justify-between bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 mb-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#0D7377] transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#0D7377]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs text-[#BEBEBE]">
                {selectedIds.size} selected
              </span>
            </div>
            <Button
              onClick={handleBulkDelete}
              size="sm"
              disabled={selectedIds.size === 0}
              className="gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs h-7 px-3 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}

        {/* Sessions list */}
        {filteredSortedSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-[#BEBEBE]" />
            </div>
            <p className="text-sm text-[#8B8B8B] mb-1">
              {searchQuery || statusFilter !== 'all'
                ? 'No matching assessments'
                : 'No saved assessments'}
            </p>
            <p className="text-xs text-[#BEBEBE]">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start a new assessment to begin evaluating'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSortedSessions.map((session) => {
              const isInProgress = session.status !== 'completed';
              const isSelected = selectedIds.has(session.id);
              const progress = isInProgress ? getCompletionProgress(session) : null;

              return (
                <button
                  key={session.id}
                  onClick={
                    selectMode
                      ? (e) => toggleSelect(e, session.id)
                      : () => handleLoadSession(session)
                  }
                  className={`w-full flex flex-col bg-white rounded-xl border transition-all text-left group ${
                    isSelected
                      ? 'border-[#0D7377] bg-[#0D7377]/[0.02] shadow-sm'
                      : 'border-[#E5E1D8] hover:border-[#0D7377]/30 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Select checkbox or Avatar */}
                    {selectMode ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#0D7377]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#D4D0C8]" />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0D7377]/8 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#0D7377]" />
                      </div>
                    )}

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
                        {session.label && (
                          <span className="text-[#BEBEBE] italic truncate max-w-[120px]">
                            {session.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Resume label for in-progress */}
                      {isInProgress && !selectMode && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#0D7377] bg-[#0D7377]/8 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3" />
                          Resume
                        </span>
                      )}
                      <span className="text-[11px] text-[#BEBEBE] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(session.savedAt)}
                      </span>
                      {!selectMode && (
                        <button
                          onClick={(e) => handleDuplicate(e, session.id)}
                          className="p-1.5 rounded-md text-[#D4D0C8] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors opacity-0 group-hover:opacity-100"
                          title="Duplicate assessment (new eval, same child)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!selectMode && (
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="p-1.5 rounded-md text-[#D4D0C8] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!selectMode && (
                        <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#0D7377] transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Completion progress bar for in-progress */}
                  {isInProgress && progress && progress.total > 0 && !selectMode && (
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
          </div>
        )}
      </main>
    </div>
  );
}
