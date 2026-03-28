/*
 * Design: Clinical Precision — Swiss Medical Design
 * Warm off-white base, DM Sans headings, Source Sans 3 body
 * Domain-colored accents, card-based layout
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { ageRanges } from '@/lib/assessmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Baby, ClipboardList, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ChildInfoForm() {
  const { state, dispatch } = useAssessment();
  const [info, setInfo] = useState(state.childInfo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.firstName || !info.examinerName || !info.examDate) {
      toast.error('Please fill in the child\'s first name, examiner name, and exam date.');
      return;
    }
    dispatch({ type: 'SET_CHILD_INFO', payload: info });
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
              Fourth Edition (Bayley-4) — Comprehensive developmental assessment across five key domains.
            </p>
            <p className="text-sm text-muted-foreground">
              Complete the child information below to begin the assessment.
            </p>
          </div>
        </div>
        {/* Decorative hero image */}
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
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={info.firstName}
                    onChange={e => setInfo({ ...info, firstName: e.target.value })}
                    placeholder="Child's first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={info.lastName}
                    onChange={e => setInfo({ ...info, lastName: e.target.value })}
                    placeholder="Child's last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={info.dateOfBirth}
                    onChange={e => setInfo({ ...info, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gender</Label>
                  <Select value={info.gender} onValueChange={v => setInfo({ ...info, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other / Not specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Age Range</Label>
                <Select value={info.ageRange} onValueChange={v => setInfo({ ...info, ageRange: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageRanges.map(ar => (
                      <SelectItem key={ar.value} value={ar.value}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Optional — helps filter age-appropriate items.</p>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="examinerName" className="text-sm font-medium">
                    Examiner Name <span className="text-destructive">*</span>
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
                  <Label htmlFor="examDate" className="text-sm font-medium">
                    Exam Date <span className="text-destructive">*</span>
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

          {/* Domain Overview */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Assessment Domains
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Cognitive', color: '#0D7377', items: '81 items', type: 'Direct', desc: 'Visual preference, attention, memory, problem solving' },
                { name: 'Language', color: '#B8860B', items: '79 items', type: 'Direct', desc: 'Receptive & expressive communication' },
                { name: 'Motor', color: '#2D6A4F', items: '104 items', type: 'Direct', desc: 'Fine motor & gross motor skills' },
                { name: 'Social-Emotional', color: '#C97B84', items: '35 items', type: 'Caregiver', desc: 'Sensory processing & social-emotional milestones' },
                { name: 'Adaptive Behavior', color: '#5B7B9A', items: '120 items', type: 'Caregiver', desc: 'Communication, personal care, relationships, play' },
              ].map(d => (
                <div
                  key={d.name}
                  className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderLeftWidth: '4px', borderLeftColor: d.color }}
                >
                  <h4 className="font-semibold text-sm mb-1" style={{ color: d.color, fontFamily: "'DM Sans', sans-serif" }}>
                    {d.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">{d.desc}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{d.items}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{d.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
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
