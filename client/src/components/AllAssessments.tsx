/**
 * AllAssessments
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Full list of all saved assessments with search, grouped by child.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { getAllMultiSessions, deleteMultiSession, type SavedMultiSession } from '@/lib/multiSessionStorage';
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
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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

export default function AllAssessments() {
  const { dispatch } = useMultiAssessment();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState(() => getAllMultiSessions());

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.childName.toLowerCase().includes(q) ||
        s.label?.toLowerCase().includes(q) ||
        s.testDate?.includes(q)
    );
  }, [sessions, searchQuery]);

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

  const handleBack = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' });
  };

  const handleNewAssessment = () => {
    dispatch({ type: 'NEW_ASSESSMENT' });
  };

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
            New Assessment
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BEBEBE]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by child name, label, or date..."
            className="pl-10 bg-white border-[#E5E1D8]"
          />
        </div>

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-[#BEBEBE]" />
            </div>
            <p className="text-sm text-[#8B8B8B] mb-1">
              {searchQuery ? 'No matching assessments' : 'No saved assessments'}
            </p>
            <p className="text-xs text-[#BEBEBE]">
              {searchQuery
                ? 'Try a different search term'
                : 'Start a new assessment to begin evaluating'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleLoadSession(session)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0D7377]/30 hover:shadow-md transition-all text-left group"
              >
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
                        ? new Date(session.testDate).toLocaleDateString()
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-[#BEBEBE] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(session.savedAt)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="p-1.5 rounded-md text-[#D4D0C8] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete assessment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#0D7377] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
