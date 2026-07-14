/**
 * CompanySetupWizard Component
 * 
 * First-run wizard that prompts the user to enter company info and
 * therapist details before using the app. Shown only on first launch
 * (when no settings have been saved).
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, ImagePlus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { loadAppSettings, saveAppSettings, type AppSettings } from '@/components/SettingsPreferences';
import { toast } from 'sonner';

interface CompanySetupWizardProps {
  onComplete: () => void;
}

export default function CompanySetupWizard({ onComplete }: CompanySetupWizardProps) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company info
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');

  // Therapist info
  const [therapistName, setTherapistName] = useState('');
  const [therapistTitle, setTherapistTitle] = useState('');
  const [therapistLicense, setTherapistLicense] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo must be under 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = () => {
    const settings = loadAppSettings();
    const updated: AppSettings = {
      ...settings,
      practiceName: companyName,
      practicePhone: companyPhone,
      practiceEmail: companyEmail,
      practiceAddress: companyAddress,
      practiceLogo: companyLogo,
      defaultExaminerName: therapistName,
      defaultExaminerTitle: therapistTitle,
      signatureName: therapistName,
      signatureTitle: therapistTitle,
      signatureLicense: therapistLicense,
      signatureEmail: companyEmail,
    };
    saveAppSettings(updated);
    // Mark wizard as completed
    localStorage.setItem('bayley4-setup-complete', 'true');
    toast.success('Company setup complete!');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('bayley4-setup-complete', 'true');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-[#0D7377]' : 'bg-[#E5E1D8]'}`} />
          <div className={`w-8 h-0.5 transition-colors ${step >= 2 ? 'bg-[#0D7377]' : 'bg-[#E5E1D8]'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-[#0D7377]' : 'bg-[#E5E1D8]'}`} />
          <div className={`w-8 h-0.5 transition-colors ${step >= 3 ? 'bg-[#0D7377]' : 'bg-[#E5E1D8]'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 3 ? 'bg-[#0D7377]' : 'bg-[#E5E1D8]'}`} />
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0D7377]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Company Information</h2>
                  <p className="text-sm text-[#6B6B6B]">This will appear on reports and exports</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="wiz-company-name">Company Name</Label>
                  <Input
                    id="wiz-company-name"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g., Elevate Pediatric Therapy"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="wiz-company-phone">Phone</Label>
                  <Input
                    id="wiz-company-phone"
                    value={companyPhone}
                    onChange={e => setCompanyPhone(e.target.value)}
                    placeholder="e.g., (626) 209-9421"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="wiz-company-email">Email</Label>
                  <Input
                    id="wiz-company-email"
                    value={companyEmail}
                    onChange={e => setCompanyEmail(e.target.value)}
                    placeholder="e.g., info@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="wiz-company-address">Address</Label>
                  <Input
                    id="wiz-company-address"
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, CA 91234"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-sm text-[#8B8B8B] hover:text-[#6B6B6B] underline"
                >
                  Skip setup
                </button>
                <Button
                  onClick={() => setStep(2)}
                  className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Logo Upload */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-[#0D7377]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Company Logo</h2>
                  <p className="text-sm text-[#6B6B6B]">Upload your logo for report headers</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center">
                {companyLogo ? (
                  <div className="relative group mb-4">
                    <div className="w-40 h-40 rounded-xl border-2 border-[#E5E1D8] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={companyLogo}
                        alt="Company logo preview"
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    </div>
                    <button
                      onClick={() => setCompanyLogo('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-xl border-2 border-dashed border-[#E5E1D8] hover:border-[#0D7377] bg-[#FAF9F6] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer mb-4"
                  >
                    <ImagePlus className="w-10 h-10 text-[#8B8B8B]" />
                    <span className="text-sm text-[#8B8B8B]">Click to upload</span>
                    <span className="text-xs text-[#ABABAB]">PNG, JPG, SVG (max 500 KB)</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {companyLogo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Change Logo
                  </Button>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="gap-2 text-[#6B6B6B]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Therapist Info */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0D7377]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2C2C2C]">Therapist Information</h2>
                  <p className="text-sm text-[#6B6B6B]">Your name and credentials for reports</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="wiz-therapist-name">Full Name</Label>
                  <Input
                    id="wiz-therapist-name"
                    value={therapistName}
                    onChange={e => setTherapistName(e.target.value)}
                    placeholder="e.g., Amy Duong"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="wiz-therapist-title">Title / Credentials</Label>
                  <Input
                    id="wiz-therapist-title"
                    value={therapistTitle}
                    onChange={e => setTherapistTitle(e.target.value)}
                    placeholder="e.g., OTR/L"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="wiz-therapist-license">License Number</Label>
                  <Input
                    id="wiz-therapist-license"
                    value={therapistLicense}
                    onChange={e => setTherapistLicense(e.target.value)}
                    placeholder="e.g., CA License #12345"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="gap-2 text-[#6B6B6B]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
                >
                  <Check className="w-4 h-4" />
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#ABABAB] mt-4">
          You can update these settings anytime from the Settings page.
        </p>
      </div>
    </div>
  );
}
