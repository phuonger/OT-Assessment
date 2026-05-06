/**
 * ClientProfileView
 *
 * Design: Clinical Precision / Swiss Medical
 * Shows a single client's profile dashboard with their info, goals, assessment history,
 * and ability to start a new assessment.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Play, Calendar,
  Target, CheckCircle2, Clock, XCircle, FileText, User, Baby, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getProfile, updateProfile, deleteProfile, touchProfile,
  addGoal, updateGoal, deleteGoal, linkAssessment,
  type ClientProfile, type ClientGoal
} from '@/lib/clientProfileStorage';
import { getAllMultiSessions, type SavedMultiSession } from '@/lib/multiSessionStorage';
import { toast } from 'sonner';

interface ClientProfileViewProps {
  profileId: string;
  onBack: () => void;
  onStartAssessment: (profile: ClientProfile) => void;
  onLoadAssessment: (session: SavedMultiSession) => void;
}

export default function ClientProfileView({ profileId, onBack, onStartAssessment, onLoadAssessment }: ClientProfileViewProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [linkedSessions, setLinkedSessions] = useState<SavedMultiSession[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'info' | 'goals' | 'history' | null>('goals');

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editPrematureWeeks, setEditPrematureWeeks] = useState(0);
  const [editParentNames, setEditParentNames] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Goal form state
  const [goalText, setGoalText] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const refreshProfile = useCallback(() => {
    const p = getProfile(profileId);
    if (p) {
      setProfile(p);
      touchProfile(profileId);
      // Load linked sessions
      const allSessions = getAllMultiSessions();
      const linked = allSessions.filter((s: SavedMultiSession) => p.linkedAssessmentIds.includes(s.id));
      setLinkedSessions(linked);
    }
  }, [profileId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const startEditProfile = () => {
    if (!profile) return;
    setEditFirstName(profile.firstName);
    setEditLastName(profile.lastName);
    setEditDob(profile.dob);
    setEditGender(profile.gender);
    setEditPrematureWeeks(profile.prematureWeeks);
    setEditParentNames(profile.parentNames);
    setEditNotes(profile.notes);
    setEditingProfile(true);
  };

  const saveEditProfile = () => {
    if (!profile) return;
    updateProfile(profile.id, {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      dob: editDob,
      gender: editGender,
      prematureWeeks: editPrematureWeeks,
      parentNames: editParentNames.trim(),
      notes: editNotes.trim(),
    });
    setEditingProfile(false);
    refreshProfile();
    toast.success('Profile updated');
  };

  const handleDeleteProfile = () => {
    if (!profile) return;
    if (!confirm(`Delete profile for ${profile.firstName} ${profile.lastName}? This cannot be undone.`)) return;
    deleteProfile(profile.id);
    toast.success('Profile deleted');
    onBack();
  };

  const handleAddGoal = () => {
    if (!goalText.trim()) { toast.error('Goal text is required'); return; }
    addGoal(profileId, goalText.trim(), goalDate || undefined);
    setGoalText('');
    setGoalDate('');
    setShowGoalForm(false);
    refreshProfile();
    toast.success('Goal added');
  };

  const handleGoalStatusChange = (goalId: string, newStatus: ClientGoal['status'], currentStatus: ClientGoal['status']) => {
    // If clicking the already-active status, toggle back to 'not-started'
    const finalStatus = newStatus === currentStatus ? 'not-started' : newStatus;
    updateGoal(profileId, goalId, { status: finalStatus });
    refreshProfile();
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal(profileId, goalId);
    refreshProfile();
    toast.success('Goal removed');
  };

  const calculateAge = (dob: string): string => {
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 1) return 'Newborn';
    if (months < 24) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years} years, ${remainingMonths} months` : `${years} years`;
  };

  const statusIcon = (status: ClientGoal['status']) => {
    switch (status) {
      case 'met': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'not-met': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'not-started': return <Target className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusLabel = (status: ClientGoal['status']) => {
    switch (status) {
      case 'met': return 'Met';
      case 'in-progress': return 'In Progress';
      case 'not-met': return 'Not Met';
      case 'not-started': return 'Not Started';
    }
  };

  const statusColor = (status: ClientGoal['status']) => {
    switch (status) {
      case 'met': return 'bg-green-50 border-green-200 text-green-700';
      case 'in-progress': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'not-met': return 'bg-red-50 border-red-200 text-red-700';
      case 'not-started': return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-[#8B8B8B]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E5E1D8] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F0EDE8] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#6B6B6B]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[#2C2C2C] truncate">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-xs text-[#8B8B8B]">{calculateAge(profile.dob)}</p>
          </div>
          <Button
            onClick={() => onStartAssessment(profile)}
            className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
          >
            <Play className="w-4 h-4" />
            New Assessment
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* ===== PROFILE INFO SECTION ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'info' ? null : 'info')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Profile Information</span>
            </div>
            {expandedSection === 'info' ? <ChevronUp className="w-4 h-4 text-[#8B8B8B]" /> : <ChevronDown className="w-4 h-4 text-[#8B8B8B]" />}
          </button>

          {expandedSection === 'info' && (
            <div className="px-5 pb-5 border-t border-[#E5E1D8]">
              {editingProfile ? (
                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={editGender} onValueChange={(v) => setEditGender(v as 'male' | 'female' | 'other')}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Premature (weeks early)</Label>
                      <Input type="number" min={0} max={20} value={editPrematureWeeks} onChange={e => setEditPrematureWeeks(parseInt(e.target.value) || 0)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Parent/Guardian Name(s)</Label>
                      <Input value={editParentNames} onChange={e => setEditParentNames(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} className="mt-1" />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>Cancel</Button>
                    <Button size="sm" onClick={saveEditProfile} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <span className="text-[#8B8B8B]">Name:</span>
                      <span className="ml-2 text-[#2C2C2C] font-medium">{profile.firstName} {profile.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[#8B8B8B]">DOB:</span>
                      <span className="ml-2 text-[#2C2C2C]">{new Date(profile.dob).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[#8B8B8B]">Age:</span>
                      <span className="ml-2 text-[#2C2C2C]">{calculateAge(profile.dob)}</span>
                    </div>
                    <div>
                      <span className="text-[#8B8B8B]">Gender:</span>
                      <span className="ml-2 text-[#2C2C2C] capitalize">{profile.gender}</span>
                    </div>
                    {profile.prematureWeeks > 0 && (
                      <div>
                        <span className="text-[#8B8B8B]">Premature:</span>
                        <span className="ml-2 text-[#2C2C2C]">{profile.prematureWeeks} weeks early</span>
                      </div>
                    )}
                    {profile.parentNames && (
                      <div>
                        <span className="text-[#8B8B8B]">Parent(s):</span>
                        <span className="ml-2 text-[#2C2C2C]">{profile.parentNames}</span>
                      </div>
                    )}
                  </div>
                  {profile.notes && (
                    <div className="mt-3 pt-3 border-t border-[#E5E1D8]">
                      <span className="text-xs text-[#8B8B8B] uppercase tracking-wide">Notes</span>
                      <p className="text-sm text-[#2C2C2C] mt-1 whitespace-pre-wrap">{profile.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5E1D8]">
                    <Button variant="outline" size="sm" onClick={startEditProfile} className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteProfile} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===== GOALS SECTION ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'goals' ? null : 'goals')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Goals</span>
              {profile.goals.length > 0 && (
                <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                  {profile.goals.filter(g => g.status === 'in-progress').length} active
                </span>
              )}
            </div>
            {expandedSection === 'goals' ? <ChevronUp className="w-4 h-4 text-[#8B8B8B]" /> : <ChevronDown className="w-4 h-4 text-[#8B8B8B]" />}
          </button>

          {expandedSection === 'goals' && (
            <div className="px-5 pb-5 border-t border-[#E5E1D8]">
              <div className="pt-4 space-y-3">
                {profile.goals.length === 0 && !showGoalForm && (
                  <p className="text-sm text-[#8B8B8B] italic">No goals set yet. Add goals to track progress.</p>
                )}

                {/* Goal List */}
                {profile.goals.map(goal => (
                  <div key={goal.id} className="border border-[#E5E1D8] rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{statusIcon(goal.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#2C2C2C]">{goal.text}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {goal.goalDate && (
                            <span className="text-xs text-[#8B8B8B]">
                              Target: {new Date(goal.goalDate).toLocaleDateString()}
                            </span>
                          )}
                          {goal.dateMet && (
                            <span className="text-xs text-green-600">
                              Met: {new Date(goal.dateMet).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-[#C0BDB6] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Status toggle buttons */}
                    <div className="flex items-center gap-2 ml-7">
                      {(['in-progress', 'met', 'not-met'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleGoalStatusChange(goal.id, status, goal.status)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            goal.status === status
                              ? statusColor(status)
                              : 'border-[#E5E1D8] text-[#8B8B8B] hover:border-[#0D7377]/30'
                          }`}
                        >
                          {statusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Goal Form */}
                {showGoalForm ? (
                  <div className="border-2 border-dashed border-[#0D7377]/30 rounded-lg p-4 space-y-3 bg-[#0D7377]/[0.02]">
                    <div>
                      <Label>Goal Description *</Label>
                      <Textarea
                        value={goalText}
                        onChange={e => setGoalText(e.target.value)}
                        placeholder="e.g., Improve bilateral hand coordination for self-feeding tasks"
                        rows={2}
                        className="mt-1"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>Target Date (optional)</Label>
                      <Input
                        type="date"
                        value={goalDate}
                        onChange={e => setGoalDate(e.target.value)}
                        className="mt-1 w-48"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setShowGoalForm(false); setGoalText(''); setGoalDate(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddGoal} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Goal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGoalForm(true)}
                    className="gap-1.5 w-full border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Goal
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ===== ASSESSMENT HISTORY SECTION ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'history' ? null : 'history')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Assessment History</span>
              {linkedSessions.length > 0 && (
                <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                  {linkedSessions.length}
                </span>
              )}
            </div>
            {expandedSection === 'history' ? <ChevronUp className="w-4 h-4 text-[#8B8B8B]" /> : <ChevronDown className="w-4 h-4 text-[#8B8B8B]" />}
          </button>

          {expandedSection === 'history' && (
            <div className="px-5 pb-5 border-t border-[#E5E1D8]">
              <div className="pt-4 space-y-2">
                {linkedSessions.length === 0 ? (
                  <p className="text-sm text-[#8B8B8B] italic">No assessments linked to this profile yet. Start a new assessment or link existing ones from All Assessments.</p>
                ) : (
                  linkedSessions
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                    .map(session => (
                      <button
                        key={session.id}
                        onClick={() => onLoadAssessment(session)}
                        className="w-full border border-[#E5E1D8] rounded-lg p-3 flex items-center gap-3 hover:border-[#0D7377]/40 hover:bg-[#FAF9F6] transition-all text-left"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === 'completed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2C2C] truncate">
                            {session.formSummaries?.map((f: { formId: string }) => f.formId.toUpperCase()).join(', ') || 'Assessment'}
                          </p>
                          <p className="text-xs text-[#8B8B8B]">
                            {new Date(session.savedAt).toLocaleDateString()} — {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
