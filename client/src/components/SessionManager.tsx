/**
 * SessionManager — lists saved assessment sessions, allows loading, comparing, and deleting.
 * Design: Swiss Clinical — clean cards, domain-colored accents, warm palette.
 */

import { useState, useMemo } from 'react';
import { parseLocalDate } from '@/lib/dateUtils';
import { useAssessment } from '@/contexts/AssessmentContext';
import {
  getAllSessions,
  getSessionsForChild,
  deleteSession,
  updateSessionLabel,
  compareSessions,
  type SavedSession,
  type SessionComparison,
} from '@/lib/sessionStorage';
import { formatTime } from '@/lib/formatTime';
import { ALL_DOMAINS } from '@/lib/assessmentData';
import {
  Clock,
  Calendar,
  User,
  FileText,
  Trash2,
  Download,
  ArrowLeftRight,
  ChevronRight,
  Plus,
  Search,
  Tag,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
} from 'lucide-react';

const DOMAIN_COLORS: Record<string, string> = {
  cognitive: '#2D7D6F',
  receptive: '#4A6FA5',
  expressive: '#7B5EA7',
  fineMotor: '#C17F3E',
  grossMotor: '#C15A3E',
};

const DOMAIN_NAMES: Record<string, string> = {
  cognitive: 'Cognitive',
  receptive: 'Receptive',
  expressive: 'Expressive',
  fineMotor: 'Fine Motor',
  grossMotor: 'Gross Motor',
};

interface SessionManagerProps {
  onNewAssessment: () => void;
  onLoadSession: (session: SavedSession) => void;
}

export default function SessionManager({ onNewAssessment, onLoadSession }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SavedSession[]>(getAllSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparison, setComparison] = useState<SessionComparison | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      s =>
        s.childName.toLowerCase().includes(q) ||
        s.examinerName.toLowerCase().includes(q) ||
        (s.label && s.label.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Group sessions by child name
  const groupedSessions = useMemo(() => {
    const groups: Record<string, SavedSession[]> = {};
    for (const s of filteredSessions) {
      const key = s.childName.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups).sort(([, a], [, b]) => {
      return new Date(b[0].savedAt).getTime() - new Date(a[0].savedAt).getTime();
    });
  }, [filteredSessions]);

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions(getAllSessions());
    setConfirmDelete(null);
    setSelectedForCompare(prev => prev.filter(sid => sid !== id));
  }

  function handleLabelSave(id: string) {
    updateSessionLabel(id, labelValue);
    setSessions(getAllSessions());
    setEditingLabel(null);
  }

  function handleToggleCompare(id: string) {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function handleCompare() {
    if (selectedForCompare.length !== 2) return;
    const s1 = sessions.find(s => s.id === selectedForCompare[0]);
    const s2 = sessions.find(s => s.id === selectedForCompare[1]);
    if (s1 && s2) {
      setComparison(compareSessions(s1, s2));
    }
  }

  function formatDate(dateStr: string) {
    try {
      return parseLocalDate(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  if (comparison) {
    return (
      <ComparisonView
        comparison={comparison}
        onBack={() => {
          setComparison(null);
          setCompareMode(false);
          setSelectedForCompare([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DF] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2C2825] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Saved Assessments
            </h1>
            <p className="text-sm text-[#8A8480] mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sessions.length >= 2 && (
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  compareMode
                    ? 'bg-[#2D7D6F] text-white'
                    : 'bg-[#F0EEEB] text-[#5A5652] hover:bg-[#E8E4DF]'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                {compareMode ? 'Comparing...' : 'Compare'}
              </button>
            )}
            <button
              onClick={onNewAssessment}
              className="flex items-center gap-2 px-4 py-2 bg-[#2D7D6F] text-white rounded-lg text-sm font-medium hover:bg-[#256B5F] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Search */}
        {sessions.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8480]" />
            <input
              type="text"
              placeholder="Search by child name, examiner, or label..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4DF] rounded-lg text-sm text-[#2C2825] placeholder-[#B5B0AB] focus:outline-none focus:ring-2 focus:ring-[#2D7D6F]/20 focus:border-[#2D7D6F]"
            />
          </div>
        )}

        {/* Compare bar */}
        {compareMode && (
          <div className="mb-6 p-4 bg-[#2D7D6F]/5 border border-[#2D7D6F]/20 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#2D7D6F] font-medium">
                Select 2 sessions to compare ({selectedForCompare.length}/2 selected)
              </p>
              {selectedForCompare.length === 2 && (
                <button
                  onClick={handleCompare}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7D6F] text-white rounded-lg text-sm font-medium hover:bg-[#256B5F] transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Compare Sessions
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#F0EEEB] rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-[#8A8480]" />
            </div>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-2">No saved sessions yet</h2>
            <p className="text-sm text-[#8A8480] mb-6 max-w-sm mx-auto">
              Start a new assessment and save it when you're done to see it here. You can save multiple sessions per child to track progress over time.
            </p>
            <button
              onClick={onNewAssessment}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D7D6F] text-white rounded-lg text-sm font-medium hover:bg-[#256B5F] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start New Assessment
            </button>
          </div>
        )}

        {/* Grouped session list */}
        {groupedSessions.map(([childKey, childSessions]) => (
          <div key={childKey} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[#8A8480]" />
              <h2 className="text-sm font-semibold text-[#5A5652] uppercase tracking-wider">
                {childSessions[0].childName}
              </h2>
              <span className="text-xs text-[#B5B0AB]">
                ({childSessions.length} session{childSessions.length !== 1 ? 's' : ''})
              </span>
            </div>

            <div className="space-y-3">
              {childSessions.map(session => (
                <div
                  key={session.id}
                  className={`bg-white rounded-xl border transition-all ${
                    compareMode && selectedForCompare.includes(session.id)
                      ? 'border-[#2D7D6F] ring-2 ring-[#2D7D6F]/20'
                      : 'border-[#E8E4DF] hover:border-[#D5D0CB]'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Label + status */}
                        <div className="flex items-center gap-2 mb-1.5">
                          {editingLabel === session.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={labelValue}
                                onChange={e => setLabelValue(e.target.value)}
                                placeholder="e.g., Initial Evaluation"
                                className="px-2 py-1 text-sm border border-[#E8E4DF] rounded focus:outline-none focus:ring-1 focus:ring-[#2D7D6F]"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleLabelSave(session.id);
                                  if (e.key === 'Escape') setEditingLabel(null);
                                }}
                              />
                              <button
                                onClick={() => handleLabelSave(session.id)}
                                className="text-xs text-[#2D7D6F] font-medium hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingLabel(null)}
                                className="text-xs text-[#8A8480] hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              {session.label ? (
                                <span className="text-sm font-semibold text-[#2C2825]">{session.label}</span>
                              ) : null}
                              <button
                                onClick={() => {
                                  setEditingLabel(session.id);
                                  setLabelValue(session.label || '');
                                }}
                                className="text-xs text-[#B5B0AB] hover:text-[#2D7D6F] flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {session.label ? 'Edit' : 'Add label'}
                              </button>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  session.status === 'completed'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {session.status === 'completed' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Loader2 className="w-3 h-3" />
                                )}
                                {session.status === 'completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-xs text-[#8A8480] mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(session.examDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {session.examinerName || 'No examiner'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(session.totalTimeSeconds)}
                          </span>
                          <span>Start: {session.startPointLetter}</span>
                        </div>

                        {/* Domain score pills */}
                        <div className="flex flex-wrap gap-2">
                          {session.domainsAssessed.map(domainId => {
                            const score = session.domainScores[domainId] || 0;
                            const color = DOMAIN_COLORS[domainId] || '#8A8480';
                            const name = DOMAIN_NAMES[domainId] || domainId;
                            return (
                              <span
                                key={domainId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                style={{
                                  backgroundColor: color + '10',
                                  color: color,
                                  border: `1px solid ${color}20`,
                                }}
                              >
                                {name}: {score}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {compareMode ? (
                          <button
                            onClick={() => handleToggleCompare(session.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedForCompare.includes(session.id)
                                ? 'bg-[#2D7D6F] text-white'
                                : 'bg-[#F0EEEB] text-[#5A5652] hover:bg-[#E8E4DF]'
                            }`}
                          >
                            {selectedForCompare.includes(session.id) ? 'Selected' : 'Select'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onLoadSession(session)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#2D7D6F]/10 text-[#2D7D6F] rounded-lg text-sm font-medium hover:bg-[#2D7D6F]/20 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Load
                            </button>
                            {confirmDelete === session.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="px-2 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="px-2 py-1.5 bg-[#F0EEEB] text-[#5A5652] rounded text-xs hover:bg-[#E8E4DF]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(session.id)}
                                className="p-2 text-[#B5B0AB] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ComparisonView — side-by-side comparison of two sessions.
 */
function ComparisonView({
  comparison,
  onBack,
}: {
  comparison: SessionComparison;
  onBack: () => void;
}) {
  const { session1, session2, domainChanges, totalChange, timeBetween } = comparison;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DF] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#F0EEEB] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#5A5652]" />
          </button>
          <div>
            <h1
              className="text-xl font-bold text-[#2C2825] tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Session Comparison
            </h1>
            <p className="text-sm text-[#8A8480]">
              {session1.childName} — {timeBetween} between sessions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Session headers */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DF] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-[#4A6FA5]" />
              <span className="text-sm font-semibold text-[#2C2825]">
                {session1.label || 'Session 1'}
              </span>
            </div>
            <div className="text-xs text-[#8A8480] space-y-1">
              <p>Date: {parseLocalDate(session1.examDate).toLocaleDateString()}</p>
              <p>Examiner: {session1.examinerName}</p>
              <p>Start Point: {session1.startPointLetter}</p>
              <p>Total Score: <span className="font-semibold text-[#2C2825]">{session1.totalRawScore}</span></p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E4DF] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-[#2D7D6F]" />
              <span className="text-sm font-semibold text-[#2C2825]">
                {session2.label || 'Session 2'}
              </span>
            </div>
            <div className="text-xs text-[#8A8480] space-y-1">
              <p>Date: {parseLocalDate(session2.examDate).toLocaleDateString()}</p>
              <p>Examiner: {session2.examinerName}</p>
              <p>Start Point: {session2.startPointLetter}</p>
              <p>Total Score: <span className="font-semibold text-[#2C2825]">{session2.totalRawScore}</span></p>
            </div>
          </div>
        </div>

        {/* Overall change */}
        <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 mb-6 text-center">
          <p className="text-sm text-[#8A8480] mb-1">Overall Raw Score Change</p>
          <div className="flex items-center justify-center gap-2">
            {totalChange > 0 ? (
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            ) : totalChange < 0 ? (
              <ArrowDownRight className="w-6 h-6 text-red-500" />
            ) : (
              <Minus className="w-6 h-6 text-[#8A8480]" />
            )}
            <span
              className={`text-3xl font-bold ${
                totalChange > 0
                  ? 'text-green-600'
                  : totalChange < 0
                  ? 'text-red-500'
                  : 'text-[#8A8480]'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {totalChange > 0 ? '+' : ''}
              {totalChange}
            </span>
          </div>
          <p className="text-xs text-[#B5B0AB] mt-1">
            {session1.totalRawScore} → {session2.totalRawScore}
          </p>
        </div>

        {/* Domain-by-domain comparison */}
        <div className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E4DF]">
            <h3 className="text-sm font-semibold text-[#2C2825]">Domain Score Changes</h3>
          </div>
          <div className="divide-y divide-[#F0EEEB]">
            {domainChanges.map(dc => {
              const color = DOMAIN_COLORS[dc.domainId] || '#8A8480';
              const maxBar = Math.max(dc.score1, dc.score2, 1);
              return (
                <div key={dc.domainId} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-[#2C2825]">{dc.domainName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {dc.change > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : dc.change < 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-[#8A8480]" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          dc.change > 0
                            ? 'text-green-600'
                            : dc.change < 0
                            ? 'text-red-500'
                            : 'text-[#8A8480]'
                        }`}
                      >
                        {dc.change > 0 ? '+' : ''}
                        {dc.change}
                      </span>
                      {dc.percentChange !== 0 && (
                        <span className="text-xs text-[#B5B0AB]">
                          ({dc.percentChange > 0 ? '+' : ''}
                          {dc.percentChange}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Visual bars */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-[#4A6FA5] shrink-0" />
                      <div className="flex-1 h-5 bg-[#F0EEEB] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#4A6FA5]/40 transition-all"
                          style={{ width: `${(dc.score1 / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#5A5652] w-8 text-right">{dc.score1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-[#2D7D6F] shrink-0" />
                      <div className="flex-1 h-5 bg-[#F0EEEB] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2D7D6F]/40 transition-all"
                          style={{ width: `${(dc.score2 / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#5A5652] w-8 text-right">{dc.score2}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time comparison */}
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DF] p-6">
          <h3 className="text-sm font-semibold text-[#2C2825] mb-4">Administration Time Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#8A8480] mb-1">{session1.label || 'Session 1'}</p>
              <p className="text-lg font-semibold text-[#2C2825]">{formatTime(session1.totalTimeSeconds)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8A8480] mb-1">{session2.label || 'Session 2'}</p>
              <p className="text-lg font-semibold text-[#2C2825]">{formatTime(session2.totalTimeSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#F0EEEB] text-[#5A5652] rounded-lg text-sm font-medium hover:bg-[#E8E4DF] transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
