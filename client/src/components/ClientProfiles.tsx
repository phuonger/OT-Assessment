/**
 * ClientProfiles
 *
 * Design: Clinical Precision / Swiss Medical
 * Main entry point for the app. Shows search, recent profiles, and create new profile.
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, User, Calendar, Baby, ArrowRight, X, FileText, Settings
} from 'lucide-react';
import {
  loadAllProfiles, searchProfiles, getRecentProfiles, createProfile,
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
  const [recentProfiles, setRecentProfiles] = useState<ClientProfile[]>([]);

  // Create form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [newPrematureWeeks, setNewPrematureWeeks] = useState(0);
  const [newParentNames, setNewParentNames] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setRecentProfiles(getRecentProfiles(10));
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchProfiles(searchQuery);
  }, [searchQuery]);

  const displayedProfiles = searchQuery.trim() ? searchResults : recentProfiles;

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
            placeholder="Search client profiles..."
            className="pl-10 h-11 bg-white border-[#E5E1D8]"
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
          <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wide mb-3">
            {searchQuery.trim() ? `Search Results (${searchResults.length})` : 'Recent Profiles'}
          </h2>

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
            <div className="space-y-2">
              {displayedProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  className="w-full bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0D7377]/40 hover:shadow-sm p-4 flex items-center gap-4 transition-all text-left group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#0D7377]">
                      {profile.firstName[0]}{profile.lastName?.[0] || ''}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C2C2C] truncate">
                      {profile.firstName} {profile.lastName}
                    </p>
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
