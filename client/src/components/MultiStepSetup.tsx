/**
 * MultiStepSetup
 * 
 * Design: Clinical Precision / Swiss Medical
 * Step 1: Child Information (name, DOB, test date, gender, premature)
 * Step 2: Examiner Information (name, title, agency)
 * Step 3: Assessment Form Selection (multi-select from 5 form types)
 * Step 4: Per-form Domain Selection with age-based start points
 */

import { useState, useEffect, useMemo } from 'react';
import { useMultiAssessment, type ChildInfo, type ExaminerInfo, type FormSelection } from '@/contexts/MultiAssessmentContext';
import { FORM_REGISTRY, type FormDefinition } from '@/lib/formRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, User, Stethoscope, ClipboardList, Settings2, Check, Baby, Settings } from 'lucide-react';
import { loadAppSettings } from '@/components/SettingsPreferences';

// ============================================================
// Age calculation helpers
// ============================================================

function calculateAgeMonths(dob: string, testDate: string): number {
  if (!dob || !testDate) return -1;
  const birth = new Date(dob);
  const test = new Date(testDate);
  let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
  if (test.getDate() < birth.getDate()) months--;
  return Math.max(0, months);
}

function calculateAgeDays(dob: string, testDate: string): { months: number; days: number } {
  if (!dob || !testDate) return { months: 0, days: 0 };
  const birth = new Date(dob);
  const test = new Date(testDate);
  let months = (test.getFullYear() - birth.getFullYear()) * 12 + (test.getMonth() - birth.getMonth());
  let days = test.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0);
    days += prevMonth.getDate();
  }
  return { months: Math.max(0, months), days: Math.max(0, days) };
}

function autoSelectBayleyAgeRange(ageMonths: number, ageDays: number, totalDays: number): string {
  // Bayley-4 age ranges from the assessment data
  if (totalDays <= 60) return '0 months 16 days - 1 month 30 days';
  if (ageMonths < 3) return '2 months 0 days - 2 months 30 days';
  if (ageMonths < 4) return '3 months 0 days - 3 months 30 days';
  if (ageMonths < 5) return '4 months 0 days - 4 months 30 days';
  if (ageMonths < 6) return '5 months 0 days - 5 months 30 days';
  if (ageMonths < 7) return '6 months 0 days - 6 months 30 days';
  if (ageMonths < 8) return '7 months 0 days - 7 months 30 days';
  if (ageMonths < 11) return '8 months 0 days - 10 months 30 days';
  if (ageMonths < 14) return '11 months 0 days - 13 months 30 days';
  if (ageMonths < 17) return '14 months 0 days - 16 months 30 days';
  if (ageMonths < 20) return '17 months 0 days - 19 months 30 days';
  if (ageMonths < 23) return '20 months 0 days - 22 months 30 days';
  if (ageMonths < 26) return '23 months 0 days - 25 months 30 days';
  if (ageMonths < 29) return '26 months 0 days - 28 months 30 days';
  if (ageMonths < 33) return '29 months 0 days - 32 months 30 days';
  if (ageMonths < 39) return '33 months 0 days - 38 months 30 days';
  return '39 months 0 days - 42 months 30 days';
}

function autoSelectDayc2AgeRange(ageMonths: number): string {
  if (ageMonths < 12) return 'Birth-11 months';
  if (ageMonths < 24) return '12-23 months';
  if (ageMonths < 36) return '24-35 months';
  if (ageMonths < 48) return '36-47 months';
  if (ageMonths < 60) return '48-59 months';
  return '60+ months';
}

function autoSelectReel3AgeRange(ageMonths: number): string {
  if (ageMonths <= 6) return 'Birth-6 months';
  if (ageMonths <= 12) return '7-12 months';
  if (ageMonths <= 18) return '13-18 months';
  if (ageMonths <= 24) return '19-24 months';
  return '25-36 months';
}

function autoSelectSP2AgeRange(ageMonths: number): string {
  if (ageMonths <= 6) return 'Birth to 6 months';
  return '7+ months (English)';
}

function autoSelectAgeRange(formId: string, ageMonths: number, ageDays: number, totalDays: number, form: FormDefinition): string {
  switch (formId) {
    case 'bayley4': {
      const label = autoSelectBayleyAgeRange(ageMonths, ageDays, totalDays);
      const match = form.ageRanges.find(ar => ar.label === label);
      return match ? match.label : form.ageRanges[0]?.label || '';
    }
    case 'dayc2':
    case 'dayc2sp': {
      const label = autoSelectDayc2AgeRange(ageMonths);
      const match = form.ageRanges.find(ar => ar.label === label);
      return match ? match.label : form.ageRanges[0]?.label || '';
    }
    case 'reel3': {
      const label = autoSelectReel3AgeRange(ageMonths);
      const match = form.ageRanges.find(ar => ar.label === label);
      return match ? match.label : form.ageRanges[0]?.label || '';
    }
    case 'sp2':
      return autoSelectSP2AgeRange(ageMonths);
    default:
      return form.ageRanges[0]?.label || '';
  }
}

// ============================================================
// Steps
// ============================================================

const STEPS = [
  { id: 1, label: 'Child Info', icon: Baby },
  { id: 2, label: 'Examiner', icon: Stethoscope },
  { id: 3, label: 'Forms', icon: ClipboardList },
  { id: 4, label: 'Domains', icon: Settings2 },
];

export default function MultiStepSetup() {
  const { state, dispatch } = useMultiAssessment();
  const [step, setStep] = useState(1);

  // Step 1: Child Info
  const [childInfo, setChildInfo] = useState<ChildInfo>(state.childInfo);

  // Step 2: Examiner Info — pre-fill from saved settings if examiner info is empty
  const [examinerInfo, setExaminerInfo] = useState<ExaminerInfo>(() => {
    // If context already has examiner info (e.g., resumed session), use that
    if (state.examinerInfo.name) return state.examinerInfo;
    // Otherwise, try loading defaults from settings
    const settings = loadAppSettings();
    if (settings.defaultExaminerName || settings.defaultExaminerTitle || settings.defaultExaminerAgency) {
      return {
        name: settings.defaultExaminerName || '',
        title: settings.defaultExaminerTitle || '',
        agency: settings.defaultExaminerAgency || '',
      };
    }
    return state.examinerInfo;
  });

  // Step 3: Selected form IDs
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>(
    state.formSelections.map(fs => fs.formId)
  );

  // Step 4: Per-form selections
  const [formSelections, setFormSelections] = useState<FormSelection[]>(state.formSelections);

  // Computed age
  const age = useMemo(() => {
    if (!childInfo.dob || !childInfo.testDate) return { months: 0, days: 0, totalDays: 0 };
    const birthDate = new Date(childInfo.dob);
    if (isNaN(birthDate.getTime())) return { months: 0, days: 0, totalDays: 0 };
    let ageInfo = calculateAgeDays(childInfo.dob, childInfo.testDate);
    if (childInfo.premature && childInfo.weeksPremature > 0) {
      const adjustDays = childInfo.weeksPremature * 7;
      const adjusted = new Date(birthDate.getTime() + adjustDays * 86400000);
      ageInfo = calculateAgeDays(adjusted.toISOString().split('T')[0], childInfo.testDate);
    }
    const totalDays = Math.floor((new Date(childInfo.testDate).getTime() - birthDate.getTime()) / 86400000);
    return { ...ageInfo, totalDays };
  }, [childInfo.dob, childInfo.testDate, childInfo.premature, childInfo.weeksPremature]);

  // Auto-initialize form selections when forms are selected
  useEffect(() => {
    const newSelections: FormSelection[] = selectedFormIds.map(formId => {
      const existing = formSelections.find(fs => fs.formId === formId);
      if (existing) return existing;

      const form = FORM_REGISTRY.find(f => f.id === formId);
      if (!form) return { formId, selectedDomainIds: [], ageRangeLabel: '' };

      const ageLabel = childInfo.dob
        ? autoSelectAgeRange(formId, age.months, age.days, age.totalDays, form)
        : form.ageRanges[0]?.label || '';

      return {
        formId,
        selectedDomainIds: form.domains.map(d => d.localId),
        ageRangeLabel: ageLabel,
      };
    });
    setFormSelections(newSelections);
  }, [selectedFormIds, childInfo.dob, childInfo.testDate, age.months, age.days, age.totalDays]);

  const toggleForm = (formId: string) => {
    setSelectedFormIds(prev =>
      prev.includes(formId) ? prev.filter(id => id !== formId) : [...prev, formId]
    );
  };

  const toggleDomain = (formId: string, domainLocalId: string) => {
    setFormSelections(prev => prev.map(fs => {
      if (fs.formId !== formId) return fs;
      const ids = fs.selectedDomainIds.includes(domainLocalId)
        ? fs.selectedDomainIds.filter(id => id !== domainLocalId)
        : [...fs.selectedDomainIds, domainLocalId];
      return { ...fs, selectedDomainIds: ids };
    }));
  };

  const setAgeRange = (formId: string, ageLabel: string) => {
    setFormSelections(prev => prev.map(fs =>
      fs.formId === formId ? { ...fs, ageRangeLabel: ageLabel } : fs
    ));
  };

  const handleStart = () => {
    dispatch({ type: 'SET_CHILD_INFO', payload: childInfo });
    dispatch({ type: 'SET_EXAMINER_INFO', payload: examinerInfo });
    dispatch({ type: 'SET_FORM_SELECTIONS', payload: formSelections });
    dispatch({ type: 'START_ASSESSMENT' });
  };

  const canProceedStep1 = childInfo.firstName.trim().length > 0;
  const canProceedStep2 = examinerInfo.name.trim().length > 0;
  const canProceedStep3 = selectedFormIds.length > 0;
  const canStart = formSelections.some(fs => fs.selectedDomainIds.length > 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1D8] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C2C2C] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Developmental Assessment Suite
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">Multi-form assessment administration tool</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'settings' })}
            className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-colors"
            title="Settings & Preferences"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-[#E5E1D8] px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  s.id === step
                    ? 'bg-[#0D7377] text-white'
                    : s.id < step
                    ? 'bg-[#0D7377]/10 text-[#0D7377] cursor-pointer hover:bg-[#0D7377]/20'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.id < step ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${s.id < step ? 'bg-[#0D7377]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Child Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Baby className="w-5 h-5 text-[#0D7377]" />
                Child Information
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">Enter the child's identifying information and test date.</p>
            </div>

            <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={childInfo.firstName}
                    onChange={e => setChildInfo({ ...childInfo, firstName: e.target.value })}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={childInfo.lastName}
                    onChange={e => setChildInfo({ ...childInfo, lastName: e.target.value })}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Birth Date</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={childInfo.dob}
                    onChange={e => setChildInfo({ ...childInfo, dob: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="testDate">Test Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={childInfo.testDate}
                    onChange={e => setChildInfo({ ...childInfo, testDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={childInfo.gender} onValueChange={v => setChildInfo({ ...childInfo, gender: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Premature</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Select
                      value={childInfo.premature ? 'yes' : 'no'}
                      onValueChange={v => setChildInfo({ ...childInfo, premature: v === 'yes' })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                    {childInfo.premature && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={16}
                          value={childInfo.weeksPremature || ''}
                          onChange={e => setChildInfo({ ...childInfo, weeksPremature: parseInt(e.target.value) || 0 })}
                          className="w-20"
                          placeholder="Weeks"
                        />
                        <span className="text-sm text-[#6B6B6B]">weeks premature</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="referral">Reason for Referral</Label>
                <Input
                  id="referral"
                  value={childInfo.reasonForReferral}
                  onChange={e => setChildInfo({ ...childInfo, reasonForReferral: e.target.value })}
                  placeholder="e.g., intake - OT dev and SI"
                  className="mt-1"
                />
              </div>

              {childInfo.dob && childInfo.testDate && (
                <div className="bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-[#0D7377]">
                    Calculated Age: {age.months} months, {age.days} days
                    {childInfo.premature && childInfo.weeksPremature > 0 && (
                      <span className="text-[#6B6B6B]"> (adjusted for {childInfo.weeksPremature} weeks prematurity)</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-6"
              >
                Next: Examiner Info
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Examiner Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#0D7377]" />
                Examiner Information
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">Enter the examiner's details for the assessment record.</p>
            </div>

            <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
              <div>
                <Label htmlFor="examinerName">Examiner Name <span className="text-red-500">*</span></Label>
                <Input
                  id="examinerName"
                  value={examinerInfo.name}
                  onChange={e => setExaminerInfo({ ...examinerInfo, name: e.target.value })}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examinerTitle">Title / Credentials</Label>
                  <Input
                    id="examinerTitle"
                    value={examinerInfo.title}
                    onChange={e => setExaminerInfo({ ...examinerInfo, title: e.target.value })}
                    placeholder="e.g., OT, PT, SLP"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="examinerAgency">Agency / Organization</Label>
                  <Input
                    id="examinerAgency"
                    value={examinerInfo.agency}
                    onChange={e => setExaminerInfo({ ...examinerInfo, agency: e.target.value })}
                    placeholder="e.g., Early Intervention Services"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-6"
              >
                Next: Select Forms
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Assessment Form Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0D7377]" />
                Select Assessment Forms
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">Choose which assessment forms to administer. You can select multiple forms.</p>
            </div>

            <div className="grid gap-4">
              {FORM_REGISTRY.map(form => {
                const isSelected = selectedFormIds.includes(form.id);
                return (
                  <button
                    key={form.id}
                    onClick={() => toggleForm(form.id)}
                    className={`w-full text-left bg-white rounded-lg border-2 p-5 transition-all ${
                      isSelected
                        ? 'border-[color:var(--form-color)] shadow-md'
                        : 'border-[#E5E1D8] hover:border-gray-300'
                    }`}
                    style={{ '--form-color': form.color } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                          style={{ backgroundColor: form.color }}
                        >
                          {form.shortName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">{form.name}</p>
                          <p className="text-sm text-[#8B8B8B] mt-1">{form.description}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {form.domains.map(d => (
                              <span key={d.localId} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {d.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[color:var(--form-color)] bg-[color:var(--form-color)]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-6"
              >
                Next: Configure Domains
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Per-form Domain Selection */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#0D7377]" />
                Configure Assessment Domains
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">Select domains and set start points for each assessment form.</p>
            </div>

            {formSelections.filter(fs => selectedFormIds.includes(fs.formId)).map(fs => {
              const form = FORM_REGISTRY.find(f => f.id === fs.formId);
              if (!form) return null;

              return (
                <div key={fs.formId} className="bg-white rounded-lg border-2 border-[#E5E1D8] overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: form.color + '10', borderBottom: `2px solid ${form.color}30` }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: form.color }}
                    >
                      {form.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C2C2C]">{form.shortName}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Age Range / Start Point */}
                    {form.hasStartPoints && form.ageRanges.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Test Age / Start Point</Label>
                        <Select
                          value={fs.ageRangeLabel}
                          onValueChange={v => setAgeRange(fs.formId, v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.ageRanges.map(ar => (
                              <SelectItem key={ar.label} value={ar.label}>
                                {ar.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-[#8B8B8B] mt-1">
                          Items before the start point will be automatically scored as mastered.
                        </p>
                      </div>
                    )}

                    {/* SP2 version selection */}
                    {form.id === 'sp2' && (
                      <div>
                        <Label className="text-sm font-medium">Version</Label>
                        <Select
                          value={fs.ageRangeLabel}
                          onValueChange={v => {
                            setAgeRange(fs.formId, v);
                            // Auto-select the matching section
                            const sectionMap: Record<string, string> = {
                              'Birth to 6 months': 'birth6mo',
                              '7+ months (English)': 'english',
                              '7+ months (Spanish)': 'spanish',
                            };
                            const sectionId = sectionMap[v];
                            if (sectionId) {
                              setFormSelections(prev => prev.map(sel =>
                                sel.formId === 'sp2' ? { ...sel, selectedDomainIds: [sectionId], ageRangeLabel: v } : sel
                              ));
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Birth to 6 months">Birth to 6 months</SelectItem>
                            <SelectItem value="7+ months (English)">7+ months (English)</SelectItem>
                            <SelectItem value="7+ months (Spanish)">7+ months (Spanish)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Domain checkboxes (not for SP2 which auto-selects) */}
                    {form.id !== 'sp2' && (
                      <div>
                        <Label className="text-sm font-medium">Domains to Assess</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {form.domains.map(domain => {
                            const isChecked = fs.selectedDomainIds.includes(domain.localId);
                            return (
                              <label
                                key={domain.localId}
                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'border-[color:var(--form-color)] bg-[color:var(--form-color-bg)]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{
                                  '--form-color': form.color,
                                  '--form-color-bg': form.color + '08',
                                } as React.CSSProperties}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleDomain(fs.formId, domain.localId)}
                                />
                                <div>
                                  <span className="text-sm font-medium text-[#2C2C2C]">{domain.name}</span>
                                  <span className="text-xs text-[#8B8B8B] ml-1">({domain.items.length} items)</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleStart}
                disabled={!canStart}
                className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-8"
                size="lg"
              >
                Begin Assessment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
