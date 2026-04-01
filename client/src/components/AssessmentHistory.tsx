/**
 * AssessmentHistory — Previous Assessments comparison view.
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Lists saved multi-form assessment sessions, allows comparing two sessions
 * side-by-side with domain-level score changes and progress visualization.
 */

import { useState, useMemo, useRef } from 'react';
import {
  getAllMultiSessions,
  deleteMultiSession,
  updateMultiSessionLabel,
  compareMultiSessions,
  saveMultiSession,
  importSessionFromJSON,
  exportSessionToJSON,
  type SavedMultiSession,
  type MultiSessionComparison,
} from '@/lib/multiSessionStorage';
import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Search,
  Trash2,
  Tag,
  Download,
  Upload,
  Save,
  Calendar,
  Clock,
  User,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// ============================================================
// Color palette
// ============================================================

const FORM_COLORS: Record<string, string> = {
  'bayley4': '#2D7D6F',
  'dayc2': '#4A6FA5',
  'dayc2es': '#7B5EA7',
  'reel3': '#C17F3E',
  'sp2': '#C15A3E',
};

const SESSION_COLORS = ['#4A6FA5', '#2D7D6F'];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================
// Main Component
// ============================================================

interface AssessmentHistoryProps {
  onBack: () => void;
}

export default function AssessmentHistory({ onBack }: AssessmentHistoryProps) {
  const { state } = useMultiAssessment();
  const [sessions, setSessions] = useState<SavedMultiSession[]>(getAllMultiSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparison, setComparison] = useState<MultiSessionComparison | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      s =>
        (s.childName || '').toLowerCase().includes(q) ||
        (s.examinerInfo?.name || '').toLowerCase().includes(q) ||
        (s.label || '').toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // Group by child
  const groupedSessions = useMemo(() => {
    const groups: Record<string, SavedMultiSession[]> = {};
    for (const s of filteredSessions) {
      const key = (s.childName || 'unknown').toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups).sort(([, a], [, b]) =>
      new Date(b[0].savedAt).getTime() - new Date(a[0].savedAt).getTime()
    );
  }, [filteredSessions]);

  // Save current assessment as a session
  function handleSaveCurrentSession() {
    if (!state.formStates || Object.keys(state.formStates).length === 0) {
      toast.error('No assessment data to save');
      return;
    }
    setShowSaveDialog(true);
    setSaveLabel('');
  }

  function confirmSaveSession() {
    saveMultiSession(state, 'completed', saveLabel || undefined);
    setSessions(getAllMultiSessions());
    setShowSaveDialog(false);
    setSaveLabel('');
    toast.success('Assessment saved to history');
  }

  function handleDelete(id: string) {
    deleteMultiSession(id);
    setSessions(getAllMultiSessions());
    setConfirmDelete(null);
    setSelectedForCompare(prev => prev.filter(sid => sid !== id));
    toast.success('Session deleted');
  }

  function handleLabelSave(id: string) {
    updateMultiSessionLabel(id, labelValue);
    setSessions(getAllMultiSessions());
    setEditingLabel(null);
    toast.success('Label updated');
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
      setComparison(compareMultiSessions(s1, s2));
    }
  }

  function handleExport(session: SavedMultiSession) {
    const json = exportSessionToJSON(session);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.childName.replace(/\s+/g, '_')}_${session.testDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Session exported');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const imported = importSessionFromJSON(text);
      if (imported) {
        // Save it
        const all = getAllMultiSessions();
        all.unshift(imported);
        localStorage.setItem('bayley4-multi-sessions', JSON.stringify(all));
        setSessions(getAllMultiSessions());
        toast.success(`Imported session for ${imported.childName}`);
      } else {
        toast.error('Invalid session file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ============================================================
  // Comparison View
  // ============================================================

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

  // ============================================================
  // Session List View
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DF] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#F0EEEB] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#5A5652]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2C2825] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Assessment History
              </h1>
              <p className="text-sm text-[#8A8480] mt-0.5">
                {sessions.length} saved session{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessions.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                }}
                className={compareMode ? 'bg-[#2D7D6F] text-white hover:bg-[#256B5F] border-[#2D7D6F]' : ''}
              >
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                {compareMode ? 'Cancel' : 'Compare'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            {state.formStates && Object.keys(state.formStates).length > 0 && (
              <Button size="sm" onClick={handleSaveCurrentSession} className="bg-[#2D7D6F] hover:bg-[#256B5F]">
                <Save className="w-4 h-4 mr-1.5" />
                Save Current
              </Button>
            )}
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
                <Button size="sm" onClick={handleCompare} className="bg-[#2D7D6F] hover:bg-[#256B5F]">
                  <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                  Compare Sessions
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#F0EEEB] rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-[#8A8480]" />
            </div>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-2">No saved sessions yet</h2>
            <p className="text-sm text-[#8A8480] mb-6 max-w-md mx-auto">
              Complete an assessment and save it from the Summary Report to track progress over time.
              You can also import sessions from JSON files.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import Session
              </Button>
              {state.formStates && Object.keys(state.formStates).length > 0 && (
                <Button onClick={handleSaveCurrentSession} className="bg-[#2D7D6F] hover:bg-[#256B5F]">
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Current Assessment
                </Button>
              )}
            </div>
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
              {childSessions.length >= 2 && !compareMode && (
                <button
                  onClick={() => {
                    setCompareMode(true);
                    setSelectedForCompare([childSessions[0].id, childSessions[1].id]);
                  }}
                  className="ml-auto text-xs text-[#2D7D6F] hover:underline flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  Quick Compare Latest
                </button>
              )}
            </div>

            <div className="space-y-3">
              {childSessions.map(session => {
                const isExpanded = expandedSession === session.id;
                const isSelected = selectedForCompare.includes(session.id);

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-xl border transition-all ${
                      compareMode && isSelected
                        ? 'border-[#2D7D6F] ring-2 ring-[#2D7D6F]/20'
                        : 'border-[#E8E4DF] hover:border-[#D5D0CB]'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => {
                        if (compareMode) {
                          handleToggleCompare(session.id);
                        } else {
                          setExpandedSession(isExpanded ? null : session.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Label */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {editingLabel === session.id ? (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={labelValue}
                                  onChange={e => setLabelValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleLabelSave(session.id)}
                                  placeholder="e.g., Initial Evaluation"
                                  className="px-2 py-1 text-sm border border-[#E8E4DF] rounded focus:outline-none focus:ring-1 focus:ring-[#2D7D6F]"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleLabelSave(session.id)}
                                  className="px-2 py-1 bg-[#2D7D6F] text-white rounded text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingLabel(null)}
                                  className="px-2 py-1 bg-[#F0EEEB] text-[#5A5652] rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-[#2C2825]">
                                  {session.label}
                                </span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingLabel(session.id);
                                    setLabelValue(session.label);
                                  }}
                                  className="p-1 text-[#B5B0AB] hover:text-[#5A5652] rounded"
                                >
                                  <Tag className="w-3 h-3" />
                                </button>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  session.status === 'completed'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-4 text-xs text-[#8A8480]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(session.testDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {session.examinerInfo.name || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(session.totalElapsedSeconds)}
                            </span>
                          </div>

                          {/* Form pills */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {session.formSummaries.map(fs => (
                              <span
                                key={fs.formId}
                                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: FORM_COLORS[fs.formId] || '#8A8480' }}
                              >
                                {fs.formName} ({fs.totalRawScore})
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-1 ml-3" onClick={e => e.stopPropagation()}>
                          {compareMode ? (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#2D7D6F] bg-[#2D7D6F]' : 'border-[#D5D0CB]'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleExport(session)}
                                className="p-2 text-[#B5B0AB] hover:text-[#5A5652] hover:bg-[#F0EEEB] rounded-lg transition-colors"
                                title="Export as JSON"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {confirmDelete === session.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(session.id)}
                                    className="px-2 py-1.5 bg-red-500 text-white rounded text-xs"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1.5 bg-[#F0EEEB] text-[#5A5652] rounded text-xs"
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
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#B5B0AB]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#B5B0AB]" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-[#F0EEEB] px-4 py-4">
                        {session.formSummaries.map(fs => (
                          <div key={fs.formId} className="mb-4 last:mb-0">
                            <h4 className="text-xs font-semibold text-[#5A5652] uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: FORM_COLORS[fs.formId] || '#8A8480' }}
                              />
                              {fs.formName}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {fs.domains.map(d => (
                                <div
                                  key={d.domainLocalId}
                                  className="bg-[#FAF8F5] rounded-lg p-2.5"
                                >
                                  <p className="text-xs text-[#8A8480] mb-0.5">{d.domainName}</p>
                                  <p className="text-lg font-bold text-[#2C2825]">{d.rawScore}</p>
                                  <p className="text-xs text-[#B5B0AB]">
                                    {d.itemsScored}/{d.totalItems} items · {formatTime(d.timerSeconds)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#2C2825] mb-2">Save Assessment Session</h3>
            <p className="text-sm text-[#8A8480] mb-4">
              Enter a label to identify this session (e.g., "Initial Evaluation", "6-Month Re-eval")
            </p>
            <input
              type="text"
              value={saveLabel}
              onChange={e => setSaveLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmSaveSession(); }}
              placeholder="Session label (optional)"
              className="w-full px-3 py-2.5 border border-[#E8E4DF] rounded-lg text-sm text-[#2C2825] placeholder-[#B5B0AB] focus:outline-none focus:ring-2 focus:ring-[#2D7D6F]/20 focus:border-[#2D7D6F] mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirmSaveSession} className="bg-[#2D7D6F] hover:bg-[#256B5F]">
                <Save className="w-4 h-4 mr-1.5" />
                Save Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Comparison View
// ============================================================

function ComparisonView({
  comparison,
  onBack,
}: {
  comparison: MultiSessionComparison;
  onBack: () => void;
}) {
  const { session1, session2, formComparisons, overallChange, timeBetween, daysBetween, childAgeAtSession1, childAgeAtSession2 } = comparison;

  // Build chart data for each form
  const chartData = useMemo(() => {
    return formComparisons.map(fc => ({
      formId: fc.formId,
      formName: fc.formName,
      data: fc.domainChanges.map(dc => ({
        name: dc.domainName.length > 12 ? dc.domainName.substring(0, 12) + '…' : dc.domainName,
        fullName: dc.domainName,
        [session1.label]: dc.score1,
        [session2.label]: dc.score2,
      })),
    }));
  }, [formComparisons, session1.label, session2.label]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DF] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#F0EEEB] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A5652]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#2C2825] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Progress Comparison
            </h1>
            <p className="text-sm text-[#8A8480]">
              {session1.childName} — {timeBetween} between assessments
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Session summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SESSION_COLORS[0] }} />
              <span className="text-sm font-semibold text-[#2C2825]">{session1.label}</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#8A8480]">
              <p className="flex justify-between">
                <span>Test Date:</span>
                <span className="font-medium text-[#2C2825]">{formatDate(session1.testDate)}</span>
              </p>
              <p className="flex justify-between">
                <span>Age at Testing:</span>
                <span className="font-medium text-[#2C2825]">{childAgeAtSession1}</span>
              </p>
              <p className="flex justify-between">
                <span>Examiner:</span>
                <span className="font-medium text-[#2C2825]">{session1.examinerInfo.name || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium text-[#2C2825]">{formatTime(session1.totalElapsedSeconds)}</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E4DF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SESSION_COLORS[1] }} />
              <span className="text-sm font-semibold text-[#2C2825]">{session2.label}</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#8A8480]">
              <p className="flex justify-between">
                <span>Test Date:</span>
                <span className="font-medium text-[#2C2825]">{formatDate(session2.testDate)}</span>
              </p>
              <p className="flex justify-between">
                <span>Age at Testing:</span>
                <span className="font-medium text-[#2C2825]">{childAgeAtSession2}</span>
              </p>
              <p className="flex justify-between">
                <span>Examiner:</span>
                <span className="font-medium text-[#2C2825]">{session2.examinerInfo.name || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium text-[#2C2825]">{formatTime(session2.totalElapsedSeconds)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Overall change card */}
        <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 mb-8 text-center">
          <p className="text-sm text-[#8A8480] mb-1">Overall Raw Score Change</p>
          <div className="flex items-center justify-center gap-2">
            {overallChange > 0 ? (
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            ) : overallChange < 0 ? (
              <ArrowDownRight className="w-6 h-6 text-red-500" />
            ) : (
              <Minus className="w-6 h-6 text-[#8A8480]" />
            )}
            <span
              className={`text-3xl font-bold ${
                overallChange > 0 ? 'text-green-600' : overallChange < 0 ? 'text-red-500' : 'text-[#8A8480]'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {overallChange > 0 ? '+' : ''}{overallChange}
            </span>
          </div>
          <p className="text-xs text-[#B5B0AB] mt-1">
            across {formComparisons.length} form{formComparisons.length !== 1 ? 's' : ''} over {timeBetween}
          </p>
        </div>

        {/* Per-form comparison */}
        {formComparisons.map((fc, fcIdx) => (
          <div key={fc.formId} className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden mb-6">
            {/* Form header */}
            <div className="px-6 py-4 border-b border-[#E8E4DF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: FORM_COLORS[fc.formId] || '#8A8480' }}
                />
                <h3 className="text-sm font-semibold text-[#2C2825]">{fc.formName}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {fc.totalChange > 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : fc.totalChange < 0 ? (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-[#8A8480]" />
                )}
                <span className={`text-sm font-bold ${
                  fc.totalChange > 0 ? 'text-green-600' : fc.totalChange < 0 ? 'text-red-500' : 'text-[#8A8480]'
                }`}>
                  {fc.totalChange > 0 ? '+' : ''}{fc.totalChange}
                </span>
                <span className="text-xs text-[#B5B0AB]">
                  ({fc.totalScore1} → {fc.totalScore2})
                </span>
              </div>
            </div>

            {/* Bar chart */}
            {chartData[fcIdx] && chartData[fcIdx].data.length > 0 && (
              <div className="px-6 py-4 border-b border-[#F0EEEB]">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData[fcIdx].data} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EEEB" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#8A8480' }}
                      axisLine={{ stroke: '#E8E4DF' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8A8480' }}
                      axisLine={{ stroke: '#E8E4DF' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E8E4DF',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(label: string) => {
                        const item = chartData[fcIdx].data.find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Bar
                      dataKey={session1.label}
                      fill={SESSION_COLORS[0]}
                      radius={[4, 4, 0, 0]}
                      opacity={0.7}
                    />
                    <Bar
                      dataKey={session2.label}
                      fill={SESSION_COLORS[1]}
                      radius={[4, 4, 0, 0]}
                      opacity={0.9}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Domain-by-domain detail */}
            <div className="divide-y divide-[#F0EEEB]">
              {fc.domainChanges.map(dc => {
                const maxBar = Math.max(dc.score1, dc.score2, 1);
                return (
                  <div key={dc.domainLocalId} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#2C2825]">{dc.domainName}</span>
                      <div className="flex items-center gap-1.5">
                        {dc.change > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : dc.change < 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-[#8A8480]" />
                        )}
                        <span className={`text-sm font-semibold ${
                          dc.change > 0 ? 'text-green-600' : dc.change < 0 ? 'text-red-500' : 'text-[#8A8480]'
                        }`}>
                          {dc.change > 0 ? '+' : ''}{dc.change}
                        </span>
                        {dc.percentChange !== 0 && (
                          <span className="text-xs text-[#B5B0AB]">
                            ({dc.percentChange > 0 ? '+' : ''}{dc.percentChange}%)
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual bars */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SESSION_COLORS[0] }} />
                        <div className="flex-1 h-5 bg-[#F0EEEB] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(dc.score1 / maxBar) * 100}%`,
                              backgroundColor: `${SESSION_COLORS[0]}66`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#5A5652] w-10 text-right">{dc.score1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SESSION_COLORS[1] }} />
                        <div className="flex-1 h-5 bg-[#F0EEEB] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(dc.score2 / maxBar) * 100}%`,
                              backgroundColor: `${SESSION_COLORS[1]}66`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#5A5652] w-10 text-right">{dc.score2}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Time comparison */}
        <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#2C2825] mb-4">Administration Time Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#8A8480] mb-1">{session1.label}</p>
              <p className="text-lg font-semibold text-[#2C2825]">{formatTime(session1.totalElapsedSeconds)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8A8480] mb-1">{session2.label}</p>
              <p className="text-lg font-semibold text-[#2C2825]">{formatTime(session2.totalElapsedSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Forms only in one session */}
        {(() => {
          const formIds1 = new Set(session1.formSummaries.map(f => f.formId));
          const formIds2 = new Set(session2.formSummaries.map(f => f.formId));
          const onlyIn1 = session1.formSummaries.filter(f => !formIds2.has(f.formId));
          const onlyIn2 = session2.formSummaries.filter(f => !formIds1.has(f.formId));

          if (onlyIn1.length === 0 && onlyIn2.length === 0) return null;

          return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Forms Not Compared</h3>
              <p className="text-xs text-amber-700 mb-3">
                These forms were only administered in one session and cannot be compared.
              </p>
              {onlyIn1.length > 0 && (
                <p className="text-xs text-amber-700">
                  <strong>{session1.label} only:</strong> {onlyIn1.map(f => f.formName).join(', ')}
                </p>
              )}
              {onlyIn2.length > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  <strong>{session2.label} only:</strong> {onlyIn2.map(f => f.formName).join(', ')}
                </p>
              )}
            </div>
          );
        })()}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onBack}>
            Back to History
          </Button>
        </div>
      </div>
    </div>
  );
}
