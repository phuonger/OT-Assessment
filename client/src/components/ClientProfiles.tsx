/**
 * ClientProfiles
 *
 * Design: Clinical Precision / Swiss Medical
 * Main entry point for the app. Shows search, recent profiles, and create new profile.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, User, Calendar, Baby, ArrowRight, X, FileText, Settings,
  Archive, ArchiveRestore
} from 'lucide-react';
import SyncStatusIndicator from './SyncStatusIndicator';
import {
  loadAllProfiles, createProfile,
  type ClientProfile
} from '@/lib/clientProfileStorage';
import { toast } from 'sonner';

interface ClientProfilesProps {
  onSelectProfile: (profile: ClientProfile) => void;
  onOpenSettings: () => void;
  onOpenAllAssessments: () => void;
  onStartWithoutProfile: () => void;
}

export default function ClientProfiles({ onSelectProfile, onOpenSettings, onOpenAllAssessments, onStartWithoutProfile }: ClientProfilesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allProfiles, setAllProfiles] = useState<ClientProfile[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>(() => {
    return (localStorage.getItem('bayley4-profile-sort') as 'recent' | 'alpha') || 'alpha';
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Create form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [newPrematureWeeks, setNewPrematureWeeks] = useState(0);
  const [newParentNames, setNewParentNames] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setAllProfiles(loadAllProfiles());
  }, []);

  const handleSortChange = (newSort: 'recent' | 'alpha') => {
    setSortBy(newSort);
    localStorage.setItem('bayley4-profile-sort', newSort);
  };

  const archivedCount = useMemo(() => allProfiles.filter(p => p.archived).length, [allProfiles]);

  const displayedProfiles = useMemo(() => {
    let profiles = [...allProfiles];

    // Filter archived/active
    if (!showArchived) {
      profiles = profiles.filter(p => !p.archived);
    } else {
      profiles = profiles.filter(p => p.archived);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      profiles = profiles.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.parentNames?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'alpha') {
      profiles.sort((a, b) => {
        const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      profiles.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    }

    return profiles;
  }, [allProfiles, searchQuery, sortBy, showArchived]);

  // Compute available alphabet letters for quick-jump
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    displayedProfiles.forEach(p => {
      const letter = (p.lastName || p.firstName || '').charAt(0).toUpperCase();
      if (letter) letters.add(letter);
    });
    return Array.from(letters).sort();
  }, [displayedProfiles]);

  const scrollToLetter = (letter: string) => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-letter-group="${letter}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCreate = () => {
    if (!newFirstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!newDob) {
      toast.error('Date of birth is required');
      return;
    }
    const profile = createProfile({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      dob: newDob,
      gender: newGender,
      prematureWeeks: newPrematureWeeks,
      parentNames: newParentNames.trim(),
      notes: newNotes.trim(),
    });
    toast.success(`Profile created for ${profile.firstName}`);
    setShowCreateForm(false);
    resetForm();
    onSelectProfile(profile);
  };

  const resetForm = () => {
    setNewFirstName('');
    setNewLastName('');
    setNewDob('');
    setNewGender('male');
    setNewPrematureWeeks(0);
    setNewParentNames('');
    setNewNotes('');
  };

  const calculateAge = (dob: string): string => {
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 1) return 'Newborn';
    if (months < 24) return `${months} mo`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years} yr ${remainingMonths} mo` : `${years} yr`;
  };

  // ===== CREATE FORM =====
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E5E1D8] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-lg hover:bg-[#F0EDE8] transition-colors">
              <X className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            <h1 className="text-lg font-semibold text-[#2C2C2C]">Create Client Profile</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E1D8] p-6 space-y-5">
            {/* Child Info */}
            <div>
              <h3 className="text-sm font-semibold text-[#2C2C2C] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Baby className="w-4 h-4 text-[#0D7377]" />
                Child Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    placeholder="First name"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newDob}
                    onChange={e => setNewDob(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newGender} onValueChange={(v) => setNewGender(v as 'male' | 'female' | 'other')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="premature">Premature (weeks early)</Label>
                <Input
                  id="premature"
                  type="number"
                  min={0}
                  max={20}
                  value={newPrematureWeeks}
                  onChange={e => setNewPrematureWeeks(parseInt(e.target.value) || 0)}
                  className="mt-1 w-32"
                />
                <p className="text-xs text-[#8B8B8B] mt-1">Enter 0 for full-term births</p>
              </div>
            </div>

            {/* Parent Info */}
            <div className="border-t border-[#E5E1D8] pt-5">
              <h3 className="text-sm font-semibold text-[#2C2C2C] uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0D7377]" />
                Parent / Guardian
              </h3>
              <div>
                <Label htmlFor="parentNames">Parent/Guardian Name(s)</Label>
                <Input
                  id="parentNames"
                  value={newParentNames}
                  onChange={e => setNewParentNames(e.target.value)}
                  placeholder="e.g., John & Jane Doe"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-[#E5E1D8] pt-5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Any additional notes about this client..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Profile
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ===== MAIN PROFILES LIST =====
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E5E1D8] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#2C2C2C]">Client Profiles</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onOpenAllAssessments} className="gap-1.5 text-[#6B6B6B]">
              <FileText className="w-4 h-4" />
              All Assessments
            </Button>
            <SyncStatusIndicator onClick={onOpenSettings} />
            <Button variant="ghost" size="sm" onClick={onOpenSettings} className="gap-1.5 text-[#6B6B6B]">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8B8B8B]" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or parent..."
            className="pl-10 h-11 bg-white border-[#E5E1D8]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8B8B] hover:text-[#2C2C2C]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Create New Profile Button */}
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full h-12 bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 text-base"
        >
          <Plus className="w-5 h-5" />
          Create New Profile
        </Button>

        {/* Quick Start without profile */}
        <div className="text-center">
          <button
            onClick={onStartWithoutProfile}
            className="text-sm text-[#0D7377] hover:text-[#0a5c5f] underline underline-offset-2"
          >
            Or start a quick assessment without a profile
          </button>
        </div>

        {/* Profile List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wide">
                {searchQuery.trim()
                  ? `Search Results (${displayedProfiles.length})`
                  : showArchived
                    ? `Archived (${displayedProfiles.length})`
                    : `All Profiles (${displayedProfiles.length})`}
              </h2>
              {archivedCount > 0 && (
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                    showArchived
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-[#8B8B8B] hover:text-[#6B6B6B] hover:bg-[#F0EDE8]'
                  }`}
                >
                  {showArchived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                  {showArchived ? 'Show Active' : `Archived (${archivedCount})`}
                </button>
              )}
            </div>
            {!searchQuery.trim() && (
              <div className="flex items-center gap-1 bg-white border border-[#E5E1D8] rounded-lg p-0.5">
                <button
                  onClick={() => handleSortChange('alpha')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    sortBy === 'alpha'
                      ? 'bg-[#0D7377] text-white font-medium'
                      : 'text-[#6B6B6B] hover:text-[#2C2C2C]'
                  }`}
                >
                  A–Z
                </button>
                <button
                  onClick={() => handleSortChange('recent')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    sortBy === 'recent'
                      ? 'bg-[#0D7377] text-white font-medium'
                      : 'text-[#6B6B6B] hover:text-[#2C2C2C]'
                  }`}
                >
                  Recent
                </button>
              </div>
            )}
          </div>

          {displayedProfiles.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center">
              {searchQuery.trim() ? (
                <>
                  <Search className="w-8 h-8 text-[#C0BDB6] mx-auto mb-2" />
                  <p className="text-sm text-[#8B8B8B]">No profiles found for "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <User className="w-8 h-8 text-[#C0BDB6] mx-auto mb-2" />
                  <p className="text-sm text-[#8B8B8B]">No profiles yet. Create your first client profile to get started.</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Alphabet Quick-Jump Sidebar */}
              {sortBy === 'alpha' && availableLetters.length > 3 && !searchQuery.trim() && (
                <div className="flex flex-col items-center gap-0.5 py-1 sticky top-20 self-start">
                  {availableLetters.map(letter => (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className="w-6 h-6 text-[10px] font-semibold text-[#0D7377] hover:bg-[#0D7377]/10 rounded transition-colors flex items-center justify-center"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}

              {/* Profile Cards */}
              <div className="flex-1 space-y-2" ref={listRef}>
                {displayedProfiles.map((profile, idx) => {
                  const letter = (profile.lastName || profile.firstName || '').charAt(0).toUpperCase();
                  const prevLetter = idx > 0 ? (displayedProfiles[idx - 1].lastName || displayedProfiles[idx - 1].firstName || '').charAt(0).toUpperCase() : '';
                  const showLetterDivider = sortBy === 'alpha' && letter !== prevLetter;

                  return (
                    <div key={profile.id} data-letter-group={showLetterDivider ? letter : undefined}>
                      {showLetterDivider && (
                        <div className="text-xs font-bold text-[#0D7377] uppercase tracking-widest pl-1 pt-3 pb-1">
                          {letter}
                        </div>
                      )}
                      <button
                        onClick={() => onSelectProfile(profile)}
                        className={`w-full rounded-xl border hover:border-[#0D7377]/40 hover:shadow-sm p-4 flex items-center gap-4 transition-all text-left group ${
                          profile.archived
                            ? 'bg-amber-50/50 border-amber-200/60'
                            : 'bg-white border-[#E5E1D8]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0">
                          {profile.photoUrl ? (
                            <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-[#0D7377]">
                              {profile.firstName[0]}{profile.lastName?.[0] || ''}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#2C2C2C] truncate">
                              {profile.firstName} {profile.lastName}
                            </p>
                            {profile.archived && (
                              <span className="text-[9px] font-semibold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex-shrink-0">Archived</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[#8B8B8B] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {calculateAge(profile.dob)}
                            </span>
                            {(profile.goalCategories?.reduce((sum, c) => sum + c.goals.length, 0) ?? 0) > 0 && (
                              <span className="text-xs text-[#8B8B8B]">
                                {profile.goalCategories?.reduce((sum, c) => sum + c.goals.filter(g => g.status === 'in-progress' || g.status === 'not-started').length, 0) ?? 0} active goals
                              </span>
                            )}
                            {profile.linkedAssessmentIds.length > 0 && (
                              <span className="text-xs text-[#8B8B8B]">
                                {profile.linkedAssessmentIds.length} assessment{profile.linkedAssessmentIds.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-[#C0BDB6] group-hover:text-[#0D7377] transition-colors flex-shrink-0" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
