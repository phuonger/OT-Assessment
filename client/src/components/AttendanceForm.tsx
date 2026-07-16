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
import { ArrowLeft, Save, Calendar, Clock, Printer } from 'lucide-react';
import { type ClientProfile } from '@/lib/clientProfileStorage';
import { createAttendance, updateAttendance, getAttendanceByProfile, type AttendanceRecord } from '@/lib/attendanceStorage';
import { loadAppSettings } from '@/components/SettingsPreferences';
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

  // Preset type/frequency options
  const TYPE_FREQUENCY_OPTIONS = [
    'OT 1x/wk', 'OT 2x/wk', 'OT 1x/month', 'OT 2x/month',
    'OTFD 1x/wk', 'OTFD 2x/wk', 'OTFD 1x/month', 'OTFD 2x/month',
    'OT EVAL', 'OT INTAKE', 'OTFD EVAL',
  ];

  // Form state — auto-fill typeFrequency from last entry for this child
  const [typeFrequency, setTypeFrequency] = useState(() => {
    if (existingRecord?.typeFrequency) return existingRecord.typeFrequency;
    const previous = getAttendanceByProfile(profile.id);
    if (previous.length > 0 && previous[0].typeFrequency) return previous[0].typeFrequency;
    return '';
  });
  const [isCustomType, setIsCustomType] = useState(() => {
    const val = existingRecord?.typeFrequency || '';
    if (!val) return false;
    return !['OT 1x/wk', 'OT 2x/wk', 'OT 1x/month', 'OT 2x/month', 'OTFD 1x/wk', 'OTFD 2x/wk', 'OTFD 1x/month', 'OTFD 2x/month', 'OT EVAL', 'OT INTAKE', 'OTFD EVAL'].includes(val);
  });
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
  const parentSignature = existingRecord?.parentSignature ?? '';
  const therapistSignature = existingRecord?.therapistSignature ?? '';
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-slate-600"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Print-only company header */}
        <div className="hidden print-only text-center mb-4">
          {appSettings.practiceLogo && (
            <img src={appSettings.practiceLogo} alt="Company logo" className="mx-auto h-16 mb-2 object-contain" />
          )}
          {appSettings.practiceName && (
            <p className="text-base font-bold">{appSettings.practiceName}</p>
          )}
          <p className="text-xs text-slate-600">
            {[appSettings.practicePhone, appSettings.practiceEmail].filter(Boolean).join(' | ')}
          </p>
        </div>

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
              {!isCustomType ? (
                <Select
                  value={typeFrequency}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomType(true);
                      setTypeFrequency('');
                    } else {
                      setTypeFrequency(val);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 no-print">
                    <SelectValue placeholder="Select type/frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-1 mt-1 no-print">
                  <Input
                    value={typeFrequency}
                    onChange={e => setTypeFrequency(e.target.value)}
                    placeholder="Enter custom type/frequency"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsCustomType(false); setTypeFrequency(''); }}
                    className="text-xs px-2"
                  >
                    List
                  </Button>
                </div>
              )}
              <p className="text-sm text-[#2C2C2C] mt-1 hidden print-only">{typeFrequency || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Pay Period</Label>
              <div className="flex gap-2 mt-1 no-print">
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
              <p className="text-sm text-[#2C2C2C] mt-1 hidden print-only">{payPeriodMonth} {payPeriodYear}</p>
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
                className="mt-1 no-print"
              />
              <p className="text-sm text-[#2C2C2C] mt-1 hidden print-only">{date}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </Label>
              <Input
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="mt-1 no-print"
              />
              <p className="text-sm text-[#2C2C2C] mt-1 hidden print-only">{time}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Progress Note</Label>
            <Textarea
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              rows={6}
              placeholder="Enter session notes, observations, and progress..."
              className="mt-1 resize-none no-print"
            />
            <p className="text-sm text-[#2C2C2C] mt-1 hidden print-only whitespace-pre-wrap leading-relaxed">{progressNote}</p>
          </div>
        </section>

        {/* E-Signature Notice */}
        <section className="bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">Signatures via Adobe Sign</p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                After saving, use the <strong>Send for E-Signature</strong> button (envelope icon) in the attendance history to send this record to the parent for audit-proof electronic signature.
              </p>
            </div>
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
