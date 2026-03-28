/*
 * Design: Clinical Precision — Swiss Medical Design
 * Warm off-white base, DM Sans headings, Source Sans 3 body
 * Domain-colored accents, card-based layout with domain selection
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { AGE_RANGES, ALL_DOMAINS, getStartPointForAge } from '@/lib/assessmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Baby, ClipboardList, User, Brain, Move, Hand, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const DOMAIN_META: Record<string, { color: string; icon: React.ReactNode; desc: string }> = {
  cognitive: {
    color: '#0D7377',
    icon: <Brain className="w-5 h-5" />,
    desc: 'Visual preference, attention, memory, sensorimotor exploration, concept formation, problem solving, and counting abilities.',
  },
  receptiveCommunication: {
    color: '#B8860B',
    icon: <MessageSquare className="w-5 h-5" />,
    desc: 'Receptive communication skills including preverbal behaviors, vocabulary development, and morpho-syntactic understanding.',
  },
  expressiveCommunication: {
    color: '#9B6B2F',
    icon: <MessageSquare className="w-5 h-5" />,
    desc: 'Expressive communication skills including preverbal communication, vocabulary use, and morpho-syntactic production.',
  },
  fineMotor: {
    color: '#2D6A4F',
    icon: <Hand className="w-5 h-5" />,
    desc: 'Grasping, perceptual-motor integration, and hand-eye coordination.',
  },
  grossMotor: {
    color: '#7B5B3A',
    icon: <Move className="w-5 h-5" />,
    desc: 'Static positioning, dynamic movement, balance, and motor planning.',
  },
};

export default function ChildInfoForm() {
  const { state, dispatch } = useAssessment();
  const [info, setInfo] = useState(state.childInfo);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(state.selectedDomainIds);

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    );
  };

  const handleAgeChange = (ageLabel: string) => {
    const sp = getStartPointForAge(ageLabel);
    setInfo({ ...info, ageRange: ageLabel, startPointLetter: sp });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.firstName || !info.examinerName || !info.examDate) {
      toast.error("Please fill in the child's name, examiner name, and test date.");
      return;
    }
    if (selectedDomains.length === 0) {
      toast.error('Please select at least one assessment domain.');
      return;
    }
    dispatch({ type: 'SET_CHILD_INFO', payload: info });
    dispatch({ type: 'SET_SELECTED_DOMAINS', payload: selectedDomains });
    dispatch({ type: 'START_ASSESSMENT' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0D7377] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Bayley-4
              </h1>
              <p className="text-xs text-muted-foreground">Developmental Assessment Form</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#f0f7f7] via-white to-[#fdf6ec]">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D7377]/10 text-[#0D7377] text-sm font-medium mb-6">
              <Baby className="w-4 h-4" />
              Ages 16 days – 42 months
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Bayley Scales of Infant and Toddler Development
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-2">
              Fourth Edition (Bayley-4) — Cognitive, Language, and Motor assessment.
            </p>
            <p className="text-sm text-muted-foreground">
              Complete the child information below, select the domains to assess, and begin.
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 pointer-events-none hidden lg:block">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663309733831/cMqqYSsKCsL3dhdDqopNkg/hero-banner-ENUYEcLbkq6nM4ygjTDvpq.webp"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Form */}
      <main className="container py-10 flex-1">
        <form onSubmit={handleSubmit} className="max-w-3xl">
          {/* Child Information */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-md bg-[#0D7377]/10 flex items-center justify-center">
                <Baby className="w-4 h-4 text-[#0D7377]" />
              </div>
              <h3 className="text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Child Information
              </h3>
            </div>
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    Child's Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={info.firstName}
                    onChange={e => setInfo({ ...info, firstName: e.target.value })}
                    placeholder="Child's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sex</Label>
                  <Select value={info.gender} onValueChange={v => setInfo({ ...info, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other / Not specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium">Birth Date</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={info.dateOfBirth}
                    onChange={e => setInfo({ ...info, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examDate" className="text-sm font-medium">
                    Test Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={info.examDate}
                    onChange={e => setInfo({ ...info, examDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral" className="text-sm font-medium">Reason for Referral</Label>
                <Input
                  id="referral"
                  value={info.reasonForReferral}
                  onChange={e => setInfo({ ...info, reasonForReferral: e.target.value })}
                  placeholder="e.g., intake - OT dev and SI"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Premature</Label>
                  <Select value={info.premature} onValueChange={v => setInfo({ ...info, premature: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Yes/No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {info.premature === 'Yes' && (
                  <div className="space-y-2">
                    <Label htmlFor="premWeeks" className="text-sm font-medium">Weeks Premature</Label>
                    <Input
                      id="premWeeks"
                      value={info.prematureWeeks}
                      onChange={e => setInfo({ ...info, prematureWeeks: e.target.value })}
                      placeholder="e.g., 4"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Age Range / Start Point */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-md bg-[#0D7377]/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-[#0D7377]" />
              </div>
              <h3 className="text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Test Age / Start Point
              </h3>
            </div>
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Test Age / Adjusted Test Age <span className="text-destructive">*</span>
                </Label>
                <Select value={info.ageRange} onValueChange={handleAgeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the child's age range" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map(ar => (
                      <SelectItem key={ar.startPoint} value={ar.label}>
                        {ar.label} — Start Point {ar.startPoint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This determines the start point for each domain. Items before the start point will still be accessible for reverse rule administration.
                </p>
              </div>
              {info.startPointLetter && info.ageRange && (
                <div className="flex items-center gap-3 p-3 bg-[#0D7377]/5 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-[#0D7377] flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {info.startPointLetter}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Point {info.startPointLetter}</p>
                    <p className="text-xs text-muted-foreground">
                      Assessment will begin at the start point items for each selected domain.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Examiner Information */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-md bg-[#B8860B]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#B8860B]" />
              </div>
              <h3 className="text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Examiner Information
              </h3>
            </div>
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <Label htmlFor="examinerName" className="text-sm font-medium">
                  Examiner's Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="examinerName"
                  value={info.examinerName}
                  onChange={e => setInfo({ ...info, examinerName: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes / Observations</Label>
                <Textarea
                  id="notes"
                  value={info.notes}
                  onChange={e => setInfo({ ...info, notes: e.target.value })}
                  placeholder="Any additional notes about the assessment session..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Domain Selection */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Select Assessment Domains
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Choose which domains to include in this assessment session. You can select one or more.
            </p>
            <div className="space-y-3">
              {ALL_DOMAINS.map(domain => {
                const meta = DOMAIN_META[domain.id];
                if (!meta) return null;
                const isSelected = selectedDomains.includes(domain.id);
                const startItem = domain.startPoints.find(sp => sp.letter === info.startPointLetter);

                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => toggleDomain(domain.id)}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                      isSelected
                        ? 'shadow-md'
                        : 'border-border bg-white opacity-60 hover:opacity-80'
                    }`}
                    style={{
                      borderColor: isSelected ? meta.color : undefined,
                      backgroundColor: isSelected ? `${meta.color}06` : undefined,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox indicator */}
                      <div
                        className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          borderColor: isSelected ? meta.color : '#d1d5db',
                          backgroundColor: isSelected ? meta.color : 'transparent',
                        }}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Domain icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                      >
                        {meta.icon}
                      </div>

                      {/* Domain info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="font-semibold text-base" style={{ color: meta.color, fontFamily: "'DM Sans', sans-serif" }}>
                            {domain.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                            {domain.items.length} items
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                            {domain.administration}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{meta.desc}</p>
                        {startItem && info.ageRange && (
                          <p className="text-xs mt-2 font-medium" style={{ color: meta.color }}>
                            Start Point {info.startPointLetter}: Item #{startItem.firstItem}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''} selected
            </p>
            <Button type="submit" size="lg" className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2 px-8">
              Begin Assessment
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
