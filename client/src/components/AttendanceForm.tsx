/**
 * AttendanceForm Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * Form for recording daily attendance/session notes with signatures.
 * Auto-populates child info, therapist name, UCI, SC from profile and settings.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar, Clock } from 'lucide-react';
import { type ClientProfile } from '@/lib/clientProfileStorage';
import { createAttendance, updateAttendance, type AttendanceRecord } from '@/lib/attendanceStorage';
import { loadAppSettings } from '@/components/SettingsPreferences';
import SignaturePad from '@/components/SignaturePad';
import { toast } from 'sonner';

interface AttendanceFormProps {
  profile: ClientProfile;
  existingRecord?: AttendanceRecord | null;
  onBack: () => void;
  onSaved: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getCurrentMonth(): string {
  return MONTHS[new Date().getMonth()];
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentTime(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function AttendanceForm({ profile, existingRecord, onBack, onSaved }: AttendanceFormProps) {
  const appSettings = useMemo(() => loadAppSettings(), []);
  const therapistName = appSettings.defaultExaminerName || appSettings.signatureName || '';

  // Form state
  const [typeFrequency, setTypeFrequency] = useState(existingRecord?.typeFrequency ?? '');
  const [payPeriodMonth, setPayPeriodMonth] = useState(() => {
    if (existingRecord?.payPeriod) {
      const parts = existingRecord.payPeriod.split(' ');
      return parts[0] || getCurrentMonth();
    }
    return getCurrentMonth();
  });
  const [payPeriodYear, setPayPeriodYear] = useState(() => {
    if (existingRecord?.payPeriod) {
      const parts = existingRecord.payPeriod.split(' ');
      return parseInt(parts[1]) || getCurrentYear();
    }
    return getCurrentYear();
  });
  const [date, setDate] = useState(existingRecord?.date ?? getTodayISO());
  const [time, setTime] = useState(existingRecord?.time ?? getCurrentTime());
  const [progressNote, setProgressNote] = useState(existingRecord?.progressNote ?? '');
  const [parentSignature, setParentSignature] = useState(existingRecord?.parentSignature ?? '');
  const [therapistSignature, setTherapistSignature] = useState(existingRecord?.therapistSignature ?? '');
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const current = getCurrentYear();
    return [current - 1, current, current + 1];
  }, []);

  const handleSave = () => {
    if (!progressNote.trim()) {
      toast.error('Please enter a progress note before saving.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        profileId: profile.id,
        childName: `${profile.firstName} ${profile.lastName}`,
        therapistName,
        uci: profile.uci || '',
        sc: profile.sc || '',
        typeFrequency,
        payPeriod: `${payPeriodMonth} ${payPeriodYear}`,
        date,
        time,
        progressNote,
        parentSignature,
        therapistSignature,
      };

      if (existingRecord) {
        updateAttendance(existingRecord.id, data);
        toast.success('Attendance record updated');
      } else {
        createAttendance(data);
        toast.success('Attendance record saved');
      }
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E5E1D8] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-[#2C2C2C]">
            {existingRecord ? 'Edit Attendance' : 'New Attendance Entry'}
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header Info Section */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0D7377] border-b border-[#E5E1D8] pb-2">
            Session Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Child Name</Label>
              <p className="text-sm font-semibold text-[#2C2C2C] mt-1">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Therapist Name</Label>
              <p className="text-sm font-semibold text-[#2C2C2C] mt-1">
                {therapistName || <span className="text-slate-400 italic">Set in Settings</span>}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">UCI</Label>
              <p className="text-sm text-[#2C2C2C] mt-1">
                {profile.uci || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">SC</Label>
              <p className="text-sm text-[#2C2C2C] mt-1">
                {profile.sc || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Type / Frequency</Label>
              <Input
                value={typeFrequency}
                onChange={e => setTypeFrequency(e.target.value)}
                placeholder="e.g. OT 1x/wk"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Pay Period</Label>
              <div className="flex gap-2 mt-1">
                <Select value={payPeriodMonth} onValueChange={setPayPeriodMonth}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(payPeriodYear)} onValueChange={v => setPayPeriodYear(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Note Section */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0D7377] border-b border-[#E5E1D8] pb-2">
            Daily Note
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </Label>
              <Input
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Progress Note</Label>
            <Textarea
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              rows={6}
              placeholder="Enter session notes, observations, and progress..."
              className="mt-1 resize-none"
            />
          </div>
        </section>

        {/* Signatures Section */}
        <section className="bg-white rounded-xl border border-[#E5E1D8] p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0D7377] border-b border-[#E5E1D8] pb-2">
            Signatures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignaturePad
              label="Parent/Guardian Signature"
              value={parentSignature}
              onChange={setParentSignature}
              width={350}
              height={120}
            />
            <SignaturePad
              label="Therapist Signature"
              value={therapistSignature}
              onChange={setTherapistSignature}
              width={350}
              height={120}
            />
          </div>
        </section>

        {/* Save Button (bottom) */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-8"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : existingRecord ? 'Update Record' : 'Save Attendance'}
          </Button>
        </div>
      </main>
    </div>
  );
}
