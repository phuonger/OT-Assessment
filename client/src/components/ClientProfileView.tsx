/**
 * ClientProfileView
 *
 * Design: Clinical Precision / Swiss Medical
 * Shows a single client's profile dashboard with their info, categorized goals,
 * assessment history, and ability to start a new assessment.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Play, Calendar,
  Target, CheckCircle2, Clock, XCircle, FileText, User, Baby,
  ChevronDown, ChevronUp, FolderPlus, MessageSquare, Milestone as MilestoneIcon,
  Download, ClipboardList, Archive, ArchiveRestore, Camera, Shield
} from 'lucide-react';
import SyncStatusIndicator from './SyncStatusIndicator';
import {
  getProfile, updateProfile, deleteProfile, touchProfile,
  addGoalCategory, updateGoalCategory, deleteGoalCategory,
  addGoal, updateGoal, deleteGoal,
  updateMilestone, addMilestone, removeMilestone,
  CATEGORY_PRESETS, DEFAULT_MILESTONES,
  type ClientProfile, type ClientGoal, type GoalCategory, type Milestone, type BirthHistory
} from '@/lib/clientProfileStorage';
import { getAllMultiSessions, type SavedMultiSession } from '@/lib/multiSessionStorage';
import { toast } from 'sonner';
import { generateProfileDocx } from '@/lib/generateProfileDocx';
import { getAttendanceCount, type AttendanceRecord } from '@/lib/attendanceStorage';
import AttendanceForm from '@/components/AttendanceForm';
import AttendanceHistory from '@/components/AttendanceHistory';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { generateAttendanceDocx } from '@/lib/generateAttendanceDocx';
import SendForSignatureDialog from '@/components/SendForSignatureDialog';
import SignedDocumentsPanel from '@/components/SignedDocumentsPanel';
import { getPendingSignatureCount } from '@/lib/signatureService';

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
  const [expandedSection, setExpandedSection] = useState<'info' | 'milestones' | 'goals' | 'history' | null>('goals');

  // Attendance state
  const [attendanceView, setAttendanceView] = useState<'none' | 'form' | 'history' | 'calendar' | 'signedDocs'>('none');
  const [signatureRecord, setSignatureRecord] = useState<AttendanceRecord | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editPrematureWeeks, setEditPrematureWeeks] = useState(0);
  const [editParentNames, setEditParentNames] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editUci, setEditUci] = useState('');
  const [editSc, setEditSc] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Birth History edit state
  const [editBirthHistory, setEditBirthHistory] = useState<BirthHistory>({
    weeksGestation: '',
    deliveryType: '',
    hospitalName: '',
    weight: '',
    length: '',
    complications: 'none',
    complicationsNarrative: '',
    dischargeNote: '',
  });

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNote, setNewCategoryNote] = useState('');

  // Goal form state — tracks which category is adding a goal
  const [addingGoalToCategoryId, setAddingGoalToCategoryId] = useState<string | null>(null);
  const [goalText, setGoalText] = useState('');
  const [goalDate, setGoalDate] = useState('');

  // Editing category note
  const [editingCategoryNoteId, setEditingCategoryNoteId] = useState<string | null>(null);
  const [editCategoryNote, setEditCategoryNote] = useState('');

  // Milestone state
  const [newMilestoneLabel, setNewMilestoneLabel] = useState('');

  const refreshProfile = useCallback(() => {
    const p = getProfile(profileId);
    if (p) {
      setProfile(p);
      touchProfile(profileId);
      const allSessions = getAllMultiSessions();
      const linked = allSessions.filter((s: SavedMultiSession) => p.linkedAssessmentIds.includes(s.id));
      setLinkedSessions(linked);
      setAttendanceCount(getAttendanceCount(profileId));
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
    setEditParentEmail(profile.parentEmail || '');
    setEditUci(profile.uci || '');
    setEditSc(profile.sc || '');
    setEditNotes(profile.notes);
    setEditBirthHistory(profile.birthHistory || {
      weeksGestation: '',
      deliveryType: '',
      hospitalName: '',
      weight: '',
      length: '',
      complications: 'none',
      complicationsNarrative: '',
      dischargeNote: '',
    });
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
      parentEmail: editParentEmail.trim(),
      uci: editUci.trim(),
      sc: editSc.trim(),
      notes: editNotes.trim(),
      birthHistory: editBirthHistory,
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

  const handleToggleArchive = () => {
    if (!profile) return;
    const newArchived = !profile.archived;
    updateProfile(profile.id, { archived: newArchived });
    refreshProfile();
    toast.success(newArchived ? 'Client archived' : 'Client restored to active');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Image must be under 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateProfile(profile.id, { photoUrl: dataUrl });
      refreshProfile();
      toast.success('Photo updated');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!profile) return;
    updateProfile(profile.id, { photoUrl: undefined });
    refreshProfile();
    toast.success('Photo removed');
  };

  // ---- Category handlers ----
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) { toast.error('Category name is required'); return; }
    addGoalCategory(profileId, newCategoryName.trim(), newCategoryNote.trim() || undefined);
    setNewCategoryName('');
    setNewCategoryNote('');
    setShowCategoryForm(false);
    refreshProfile();
    toast.success('Category added');
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete "${categoryName}" and all its goals? This cannot be undone.`)) return;
    deleteGoalCategory(profileId, categoryId);
    refreshProfile();
    toast.success('Category deleted');
  };

  const handleSaveCategoryNote = (categoryId: string) => {
    updateGoalCategory(profileId, categoryId, { note: editCategoryNote.trim() || undefined });
    setEditingCategoryNoteId(null);
    setEditCategoryNote('');
    refreshProfile();
  };

  // ---- Goal handlers ----
  const handleAddGoal = (categoryId: string) => {
    if (!goalText.trim()) { toast.error('Goal text is required'); return; }
    addGoal(profileId, categoryId, goalText.trim(), goalDate || undefined);
    setGoalText('');
    setGoalDate('');
    setAddingGoalToCategoryId(null);
    refreshProfile();
    toast.success('Goal added');
  };

  const handleGoalStatusChange = (goalId: string, newStatus: ClientGoal['status'], currentStatus: ClientGoal['status']) => {
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

  // Count total goals across all categories
  const totalGoals = profile?.goalCategories.reduce((sum, cat) => sum + cat.goals.length, 0) ?? 0;
  const activeGoals = profile?.goalCategories.reduce(
    (sum, cat) => sum + cat.goals.filter(g => g.status === 'in-progress' || g.status === 'not-started').length, 0
  ) ?? 0;

  // Get existing category names to filter presets
  const existingCategoryNames = profile?.goalCategories.map(c => c.name.toLowerCase()) ?? [];
  const availablePresets = CATEGORY_PRESETS.filter(p => !existingCategoryNames.includes(p.toLowerCase()));

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-[#8B8B8B]">Loading profile...</p>
      </div>
    );
  }

  // Attendance views
  if (attendanceView === 'form') {
    return (
      <AttendanceForm
        profile={profile}
        existingRecord={editingAttendance}
        onBack={() => { setAttendanceView('none'); setEditingAttendance(null); }}
        onSaved={() => { setAttendanceView('history'); setEditingAttendance(null); refreshProfile(); }}
      />
    );
  }

  if (attendanceView === 'history') {
    return (
      <AttendanceHistory
        profile={profile}
        onBack={() => setAttendanceView('none')}
        onNewEntry={() => { setEditingAttendance(null); setAttendanceView('form'); }}
        onEditEntry={(record) => { setEditingAttendance(record); setAttendanceView('form'); }}
        onPrintEntry={async (record) => {
          try {
            await generateAttendanceDocx(record);
            toast.success('Attendance record exported');
          } catch (err) {
            console.error(err);
            toast.error('Failed to export attendance record');
          }
        }}
        onSendForSignature={(record) => setSignatureRecord(record)}
        onCalendarView={() => setAttendanceView('calendar')}
      />
    );
  }

  if (attendanceView === 'calendar') {
    return (
      <AttendanceCalendar
        profile={profile}
        onBack={() => setAttendanceView('none')}
        onNewEntry={(prefilledDate) => {
          setEditingAttendance(null);
          // Store prefilled date in sessionStorage for the form to pick up
          if (prefilledDate) sessionStorage.setItem('attendance-prefill-date', prefilledDate);
          setAttendanceView('form');
        }}
        onViewEntry={(record) => { setEditingAttendance(record); setAttendanceView('form'); }}
      />
    );
  }

  if (attendanceView === 'signedDocs') {
    return (
      <SignedDocumentsPanel
        profile={profile}
        onBack={() => setAttendanceView('none')}
      />
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
          {/* Profile Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#0D7377]/10 flex items-center justify-center">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[#0D7377]">
                {profile.firstName[0]}{profile.lastName?.[0] || ''}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#2C2C2C] truncate">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.archived && (
                <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Archived</span>
              )}
            </div>
            <p className="text-xs text-[#8B8B8B]">{calculateAge(profile.dob)}</p>
          </div>
          <SyncStatusIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await generateProfileDocx({ profile, linkedSessions });
                toast.success('Profile summary exported');
              } catch (err) {
                console.error(err);
                toast.error('Failed to export profile');
              }
            }}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAttendanceView('form'); setEditingAttendance(null); }}
            className="gap-1.5 border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/5"
          >
            <ClipboardList className="w-4 h-4" />
            Attendance
            {attendanceCount > 0 && (
              <span className="ml-1 text-xs bg-[#0D7377]/10 px-1.5 py-0.5 rounded-full">{attendanceCount}</span>
            )}
          </Button>
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
                    <Label>Parent/Guardian Email</Label>
                    <Input type="email" value={editParentEmail} onChange={e => setEditParentEmail(e.target.value)} className="mt-1" placeholder="parent@email.com (for e-signature requests)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>UCI</Label>
                      <Input value={editUci} onChange={e => setEditUci(e.target.value)} className="mt-1" placeholder="UCI number" />
                    </div>
                    <div>
                      <Label>SC</Label>
                      <Input value={editSc} onChange={e => setEditSc(e.target.value)} className="mt-1" placeholder="SC number" />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} className="mt-1" placeholder="Any additional notes..." />
                  </div>

                  {/* Birth History Section */}
                  <div className="border-t border-[#E5E1D8] pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3 flex items-center gap-2">
                      <Baby className="w-4 h-4 text-[#0D7377]" /> Birth History
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Weeks Gestation</Label>
                        <Input value={editBirthHistory.weeksGestation} onChange={e => setEditBirthHistory(prev => ({ ...prev, weeksGestation: e.target.value }))} className="mt-1" placeholder="e.g. 40" />
                      </div>
                      <div>
                        <Label>Type of Delivery</Label>
                        <Select value={editBirthHistory.deliveryType || 'none'} onValueChange={(v) => setEditBirthHistory(prev => ({ ...prev, deliveryType: v === 'none' ? '' : v as 'vaginal' | 'c-section' }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            <SelectItem value="vaginal">Vaginal</SelectItem>
                            <SelectItem value="c-section">C-Section</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <Label>Hospital Name</Label>
                        <Input value={editBirthHistory.hospitalName} onChange={e => setEditBirthHistory(prev => ({ ...prev, hospitalName: e.target.value }))} className="mt-1" placeholder="e.g. Kaiser Permanente" />
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <Input value={editBirthHistory.weight} onChange={e => setEditBirthHistory(prev => ({ ...prev, weight: e.target.value }))} className="mt-1" placeholder="e.g. 7 lbs 4 oz" />
                      </div>
                      <div>
                        <Label>Length</Label>
                        <Input value={editBirthHistory.length} onChange={e => setEditBirthHistory(prev => ({ ...prev, length: e.target.value }))} className="mt-1" placeholder="e.g. 20 inches" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Complications</Label>
                      <div className="flex items-center gap-4 mt-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="complications" checked={editBirthHistory.complications === 'none'} onChange={() => setEditBirthHistory(prev => ({ ...prev, complications: 'none', complicationsNarrative: '' }))} className="accent-[#0D7377]" />
                          <span className="text-sm">No complications</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="complications" checked={editBirthHistory.complications === 'yes'} onChange={() => setEditBirthHistory(prev => ({ ...prev, complications: 'yes' }))} className="accent-[#0D7377]" />
                          <span className="text-sm">Yes, complications</span>
                        </label>
                      </div>
                      {editBirthHistory.complications === 'yes' && (
                        <Textarea
                          value={editBirthHistory.complicationsNarrative}
                          onChange={e => setEditBirthHistory(prev => ({ ...prev, complicationsNarrative: e.target.value }))}
                          rows={2}
                          className="mt-2"
                          placeholder="Describe complications..."
                        />
                      )}
                    </div>
                    <div className="mt-3">
                      <Label>Discharge Note</Label>
                      <Input value={editBirthHistory.dischargeNote} onChange={e => setEditBirthHistory(prev => ({ ...prev, dischargeNote: e.target.value }))} className="mt-1" placeholder="e.g. He was discharged home without medical equipment" />
                    </div>
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
                    {profile.parentEmail && (
                      <div>
                        <span className="text-[#8B8B8B]">Email:</span>
                        <span className="ml-2 text-[#2C2C2C]">{profile.parentEmail}</span>
                      </div>
                    )}
                    {profile.uci && (
                      <div>
                        <span className="text-[#8B8B8B]">UCI:</span>
                        <span className="ml-2 text-[#2C2C2C]">{profile.uci}</span>
                      </div>
                    )}
                    {profile.sc && (
                      <div>
                        <span className="text-[#8B8B8B]">SC:</span>
                        <span className="ml-2 text-[#2C2C2C]">{profile.sc}</span>
                      </div>
                    )}
                  </div>
                  {profile.notes && (
                    <div className="mt-3 pt-3 border-t border-[#E5E1D8]">
                      <span className="text-xs text-[#8B8B8B] uppercase tracking-wide">Notes</span>
                      <p className="text-sm text-[#2C2C2C] mt-1 whitespace-pre-wrap">{profile.notes}</p>
                    </div>
                  )}
                  {/* Birth History display */}
                  {profile.birthHistory && (profile.birthHistory.weeksGestation || profile.birthHistory.deliveryType || profile.birthHistory.hospitalName || profile.birthHistory.weight) && (
                    <div className="mt-3 pt-3 border-t border-[#E5E1D8]">
                      <span className="text-xs text-[#8B8B8B] uppercase tracking-wide">Birth History</span>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-2">
                        {profile.birthHistory.weeksGestation && (
                          <div><span className="text-[#8B8B8B]">Gestation:</span> <span className="text-[#2C2C2C]">{profile.birthHistory.weeksGestation} weeks</span></div>
                        )}
                        {profile.birthHistory.deliveryType && (
                          <div><span className="text-[#8B8B8B]">Delivery:</span> <span className="text-[#2C2C2C] capitalize">{profile.birthHistory.deliveryType}</span></div>
                        )}
                        {profile.birthHistory.hospitalName && (
                          <div><span className="text-[#8B8B8B]">Hospital:</span> <span className="text-[#2C2C2C]">{profile.birthHistory.hospitalName}</span></div>
                        )}
                        {profile.birthHistory.weight && (
                          <div><span className="text-[#8B8B8B]">Weight:</span> <span className="text-[#2C2C2C]">{profile.birthHistory.weight}</span></div>
                        )}
                        {profile.birthHistory.length && (
                          <div><span className="text-[#8B8B8B]">Length:</span> <span className="text-[#2C2C2C]">{profile.birthHistory.length}</span></div>
                        )}
                        {profile.birthHistory.complications && (
                          <div className="col-span-2">
                            <span className="text-[#8B8B8B]">Complications:</span>
                            <span className="text-[#2C2C2C] ml-1">
                              {profile.birthHistory.complications === 'none' ? 'None reported' : profile.birthHistory.complicationsNarrative || 'Yes (details not provided)'}
                            </span>
                          </div>
                        )}
                        {profile.birthHistory.dischargeNote && (
                          <div className="col-span-2"><span className="text-[#8B8B8B]">Discharge:</span> <span className="text-[#2C2C2C]">{profile.birthHistory.dischargeNote}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Photo Upload */}
                  <div className="mt-3 pt-3 border-t border-[#E5E1D8]">
                    <span className="text-xs text-[#8B8B8B] uppercase tracking-wide">Profile Photo</span>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0 border-2 border-[#E5E1D8]">
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-[#8B8B8B]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-[#0D7377] hover:text-[#0a5c5f]">
                          <Camera className="w-3.5 h-3.5" />
                          {profile.photoUrl ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                        {profile.photoUrl && (
                          <button onClick={handleRemovePhoto} className="text-xs text-red-500 hover:text-red-700 text-left">
                            Remove
                          </button>
                        )}
                        <span className="text-[10px] text-[#8B8B8B]">Max 500KB, JPG/PNG</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5E1D8]">
                    <Button variant="outline" size="sm" onClick={startEditProfile} className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToggleArchive} className={`gap-1.5 ${profile.archived ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}`}>
                      {profile.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      {profile.archived ? 'Restore' : 'Archive'}
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

        {/* ===== MILESTONES SECTION ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'milestones' ? null : 'milestones')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <MilestoneIcon className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Developmental Milestones</span>
              {profile.milestones.filter(m => m.ageAchieved).length > 0 && (
                <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                  {profile.milestones.filter(m => m.ageAchieved).length}/{profile.milestones.length} recorded
                </span>
              )}
            </div>
            {expandedSection === 'milestones' ? <ChevronUp className="w-4 h-4 text-[#8B8B8B]" /> : <ChevronDown className="w-4 h-4 text-[#8B8B8B]" />}
          </button>

          {expandedSection === 'milestones' && (
            <div className="px-5 pb-5 border-t border-[#E5E1D8]">
              <div className="pt-4 space-y-2">
                {profile.milestones.map((milestone, idx) => (
                  <div key={milestone.label} className="flex items-center gap-3">
                    <span className="text-sm text-[#2C2C2C] font-medium w-28 flex-shrink-0">{milestone.label}:</span>
                    <Input
                      value={milestone.ageAchieved}
                      onChange={e => {
                        updateMilestone(profileId, milestone.label, e.target.value);
                        refreshProfile();
                      }}
                      placeholder="e.g., 6 months"
                      className="flex-1 h-8 text-sm"
                    />
                    {/* Only allow removing custom milestones (not the 6 defaults) */}
                    {!DEFAULT_MILESTONES.some(d => d.label === milestone.label) && (
                      <button
                        onClick={() => { removeMilestone(profileId, milestone.label); refreshProfile(); }}
                        className="p-1 text-[#C0BDB6] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add custom milestone */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E5E1D8]">
                  <Input
                    value={newMilestoneLabel}
                    onChange={e => setNewMilestoneLabel(e.target.value)}
                    placeholder="Add custom milestone..."
                    className="flex-1 h-8 text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newMilestoneLabel.trim()) {
                        addMilestone(profileId, newMilestoneLabel.trim());
                        setNewMilestoneLabel('');
                        refreshProfile();
                        toast.success('Milestone added');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newMilestoneLabel.trim()) {
                        addMilestone(profileId, newMilestoneLabel.trim());
                        setNewMilestoneLabel('');
                        refreshProfile();
                        toast.success('Milestone added');
                      }
                    }}
                    className="h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===== GOALS SECTION (CATEGORIZED) ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'goals' ? null : 'goals')}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Goals</span>
              {totalGoals > 0 && (
                <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                  {activeGoals} active
                </span>
              )}
            </div>
            {expandedSection === 'goals' ? <ChevronUp className="w-4 h-4 text-[#8B8B8B]" /> : <ChevronDown className="w-4 h-4 text-[#8B8B8B]" />}
          </button>

          {expandedSection === 'goals' && (
            <div className="px-5 pb-5 border-t border-[#E5E1D8]">
              <div className="pt-4 space-y-4">
                {profile.goalCategories.length === 0 && !showCategoryForm && (
                  <p className="text-sm text-[#8B8B8B] italic">No goal categories set yet. Add a category to start tracking goals.</p>
                )}

                {/* Category List */}
                {profile.goalCategories.map(category => (
                  <div key={category.id} className="border border-[#E5E1D8] rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-[#FAF9F6] px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#2C2C2C] uppercase tracking-wide">{category.name}</h4>
                        <span className="text-xs text-[#8B8B8B]">({category.goals.length} goal{category.goals.length !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (editingCategoryNoteId === category.id) {
                              setEditingCategoryNoteId(null);
                            } else {
                              setEditingCategoryNoteId(category.id);
                              setEditCategoryNote(category.note || '');
                            }
                          }}
                          className="p-1.5 rounded hover:bg-[#E5E1D8] transition-colors"
                          title="Add/edit note"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#8B8B8B]" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#C0BDB6] hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Category Note (edit or display) */}
                    {editingCategoryNoteId === category.id && (
                      <div className="px-4 py-2 bg-[#FAF9F6] border-t border-[#E5E1D8]">
                        <Textarea
                          value={editCategoryNote}
                          onChange={e => setEditCategoryNote(e.target.value)}
                          placeholder="Add a note for this category (e.g., *Child receives PT services through private insurance)"
                          rows={2}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingCategoryNoteId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => handleSaveCategoryNote(category.id)} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white">Save Note</Button>
                        </div>
                      </div>
                    )}
                    {!editingCategoryNoteId && category.note && (
                      <div className="px-4 py-2 bg-[#FAF9F6] border-t border-[#E5E1D8]">
                        <p className="text-xs text-[#6B6B6B] italic">*{category.note}</p>
                      </div>
                    )}

                    {/* Goals within this category */}
                    <div className="divide-y divide-[#E5E1D8]">
                      {category.goals.map(goal => (
                        <div key={goal.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{statusIcon(goal.status)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#2C2C2C]">{goal.text}</p>
                              <div className="flex items-center gap-3 mt-1">
                                {goal.goalDate && (
                                  <span className="text-xs text-[#8B8B8B]">
                                    Target: {new Date(goal.goalDate).toLocaleDateString()}
                                  </span>
                                )}
                                {goal.dateMet && goal.status === 'met' && (
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
                    </div>

                    {/* Add Goal to this category */}
                    {addingGoalToCategoryId === category.id ? (
                      <div className="px-4 py-3 border-t border-[#E5E1D8] bg-[#0D7377]/[0.02] space-y-3">
                        <div>
                          <Label className="text-xs">Goal Description *</Label>
                          <Textarea
                            value={goalText}
                            onChange={e => setGoalText(e.target.value)}
                            placeholder={`e.g., ${profile.firstName} will exhibit improved ${category.name.toLowerCase()} skills...`}
                            rows={2}
                            className="mt-1 text-sm"
                            autoFocus
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Target Date (optional)</Label>
                          <Input
                            type="date"
                            value={goalDate}
                            onChange={e => setGoalDate(e.target.value)}
                            className="mt-1 w-48 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => { setAddingGoalToCategoryId(null); setGoalText(''); setGoalDate(''); }}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleAddGoal(category.id)} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Goal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingGoalToCategoryId(category.id); setGoalText(''); setGoalDate(''); }}
                        className="w-full px-4 py-2.5 border-t border-[#E5E1D8] text-xs text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Goal
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Category Form */}
                {showCategoryForm ? (
                  <div className="border-2 border-dashed border-[#0D7377]/30 rounded-lg p-4 space-y-3 bg-[#0D7377]/[0.02]">
                    <div>
                      <Label className="text-xs">Category Name *</Label>
                      <Input
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Fine Motor"
                        className="mt-1"
                        autoFocus
                      />
                      {/* Quick preset buttons */}
                      {availablePresets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {availablePresets.map(preset => (
                            <button
                              key={preset}
                              onClick={() => setNewCategoryName(preset)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                newCategoryName === preset
                                  ? 'bg-[#0D7377] text-white border-[#0D7377]'
                                  : 'border-[#E5E1D8] text-[#6B6B6B] hover:border-[#0D7377]/40 hover:text-[#0D7377]'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Category Note (optional)</Label>
                      <Textarea
                        value={newCategoryNote}
                        onChange={e => setNewCategoryNote(e.target.value)}
                        placeholder="e.g., Child receives physical therapy services through private insurance"
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); setNewCategoryNote(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddCategory} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5" /> Add Category
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryForm(true)}
                    className="gap-1.5 w-full border-dashed"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Add Goal Category
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ===== ATTENDANCE RECORDS QUICK ACCESS ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Attendance Records</span>
              {attendanceCount > 0 && (
                <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                  {attendanceCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAttendanceView('calendar')}
                className="gap-1.5 text-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAttendanceView('history')}
                className="gap-1.5 text-xs"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                History
              </Button>
            </div>
          </div>
        </section>

        {/* ===== SIGNED DOCUMENTS QUICK ACCESS ===== */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Signed Documents</span>
              {getPendingSignatureCount(profile.id) > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {getPendingSignatureCount(profile.id)} pending
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttendanceView('signedDocs')}
              className="gap-1.5 text-xs border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/5"
            >
              <Shield className="w-3.5 h-3.5" />
              View All
            </Button>
          </div>
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

      {/* Send for Signature Dialog */}
      {signatureRecord && profile && (
        <SendForSignatureDialog
          record={signatureRecord}
          profile={profile}
          onClose={() => setSignatureRecord(null)}
          onSent={() => {
            setSignatureRecord(null);
            refreshProfile();
            toast.success('Signature request tracked');
          }}
        />
      )}
    </div>
  );
}
