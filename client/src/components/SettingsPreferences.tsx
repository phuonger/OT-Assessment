/**
 * SettingsPreferences
 *
 * Design: Clinical Precision / Swiss Medical
 * Allows clinicians to configure default practice info, examiner info,
 * preferred report template, and practice logo. All settings persist
 * in localStorage under key 'bayley4-app-settings'.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Settings, Building2, Stethoscope, FileText,
  Save, RotateCcw, ImagePlus, Trash2, Check
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

export interface AppSettings {
  // Practice info
  practiceName: string;
  practiceAddress: string;
  practicePhone: string;
  practiceEmail: string;
  practiceLogo: string; // base64 data URI or empty

  // Default examiner info
  defaultExaminerName: string;
  defaultExaminerTitle: string;
  defaultExaminerAgency: string;

  // Report preferences
  defaultReportTemplate: 'developmental' | 'sensory' | 'auto';

  // Metadata
  savedAt: string;
}

export const SETTINGS_STORAGE_KEY = 'bayley4-app-settings';

const defaultSettings: AppSettings = {
  practiceName: '',
  practiceAddress: '',
  practicePhone: '',
  practiceEmail: '',
  practiceLogo: '',
  defaultExaminerName: '',
  defaultExaminerTitle: '',
  defaultExaminerAgency: '',
  defaultReportTemplate: 'auto',
  savedAt: '',
};

// ============================================================
// Helpers
// ============================================================

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      ...settings,
      savedAt: new Date().toISOString(),
    }));
  } catch { /* localStorage full */ }
}

// ============================================================
// Component
// ============================================================

export default function SettingsPreferences({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track changes
  const initialRef = useRef(JSON.stringify(settings));
  useEffect(() => {
    const current = JSON.stringify({ ...settings, savedAt: '' });
    const initial = JSON.stringify({ ...JSON.parse(initialRef.current), savedAt: '' });
    setHasChanges(current !== initial);
  }, [settings]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    saveAppSettings(settings);
    initialRef.current = JSON.stringify(settings);
    setHasChanges(false);
    setJustSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setJustSaved(false), 2000);
  }, [settings]);

  const handleReset = useCallback(() => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings({ ...defaultSettings });
      saveAppSettings({ ...defaultSettings });
      initialRef.current = JSON.stringify(defaultSettings);
      setHasChanges(false);
      toast.success('Settings reset to defaults');
    }
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Image must be under 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      update('practiceLogo', dataUri);
    };
    reader.readAsDataURL(file);
  }, [update]);

  const handleRemoveLogo = useCallback(() => {
    update('practiceLogo', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [update]);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1D8] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#0D7377]" />
              <h1 className="text-lg font-semibold text-[#2C2C2C]">Settings & Preferences</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-red-600 hover:text-red-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges && !justSaved}
              className={`gap-1.5 ${justSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0D7377] hover:bg-[#0a5c5f]'} text-white`}
            >
              {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {justSaved ? 'Saved' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Practice Information */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-[#0D7377]" />
            <h2 className="text-lg font-semibold text-[#2C2C2C]">Practice Information</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            This information will appear in the header of clinical reports and DOCX exports.
          </p>
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
            <div>
              <Label htmlFor="practiceName">Practice / Clinic Name</Label>
              <Input
                id="practiceName"
                value={settings.practiceName}
                onChange={e => update('practiceName', e.target.value)}
                placeholder="e.g., ABC Pediatric Therapy"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="practiceAddress">Address</Label>
              <Input
                id="practiceAddress"
                value={settings.practiceAddress}
                onChange={e => update('practiceAddress', e.target.value)}
                placeholder="e.g., 123 Main St, Suite 100, City, ST 12345"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="practicePhone">Phone</Label>
                <Input
                  id="practicePhone"
                  value={settings.practicePhone}
                  onChange={e => update('practicePhone', e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="practiceEmail">Email</Label>
                <Input
                  id="practiceEmail"
                  value={settings.practiceEmail}
                  onChange={e => update('practiceEmail', e.target.value)}
                  placeholder="e.g., info@practice.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <Label>Practice Logo</Label>
              <p className="text-xs text-[#8B8B8B] mt-0.5 mb-2">
                Upload a logo (PNG, JPG, SVG — max 500 KB) to display in report headers.
              </p>
              <div className="flex items-start gap-4">
                {settings.practiceLogo ? (
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-lg border border-[#E5E1D8] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={settings.practiceLogo}
                        alt="Practice logo"
                        className="max-w-full max-h-full object-contain p-1"
                      />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-[#E5E1D8] hover:border-[#0D7377] bg-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-6 h-6 text-[#8B8B8B]" />
                    <span className="text-xs text-[#8B8B8B]">Upload</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {settings.practiceLogo && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Change Logo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="gap-1.5 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Default Examiner Information */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-[#0D7377]" />
            <h2 className="text-lg font-semibold text-[#2C2C2C]">Default Examiner Information</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            These values will pre-fill the Examiner step when starting a new assessment. You can always override them per session.
          </p>
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
            <div>
              <Label htmlFor="defaultExaminerName">Examiner Name</Label>
              <Input
                id="defaultExaminerName"
                value={settings.defaultExaminerName}
                onChange={e => update('defaultExaminerName', e.target.value)}
                placeholder="Full name"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultExaminerTitle">Title / Credentials</Label>
                <Input
                  id="defaultExaminerTitle"
                  value={settings.defaultExaminerTitle}
                  onChange={e => update('defaultExaminerTitle', e.target.value)}
                  placeholder="e.g., OTR/L, OTD, PT, SLP"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="defaultExaminerAgency">Agency / Organization</Label>
                <Input
                  id="defaultExaminerAgency"
                  value={settings.defaultExaminerAgency}
                  onChange={e => update('defaultExaminerAgency', e.target.value)}
                  placeholder="e.g., Early Intervention Services"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Report Preferences */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#0D7377]" />
            <h2 className="text-lg font-semibold text-[#2C2C2C]">Report Preferences</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Set the default report template used when generating clinical reports. "Auto" selects based on which assessments were administered.
          </p>
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
            <div>
              <Label htmlFor="defaultReportTemplate">Default Report Template</Label>
              <Select
                value={settings.defaultReportTemplate}
                onValueChange={v => update('defaultReportTemplate', v as AppSettings['defaultReportTemplate'])}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect (based on assessments)</SelectItem>
                  <SelectItem value="developmental">OT Developmental Intake Assessment</SelectItem>
                  <SelectItem value="sensory">OT SI Assessment (Sensory Integration)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#8B8B8B] mt-2">
                <strong>Auto-detect:</strong> Uses SI Assessment when Sensory Profile 2 is administered, otherwise Developmental Intake.
              </p>
            </div>
          </div>
        </section>

        {/* Info footer */}
        {settings.savedAt && (
          <div className="text-center text-xs text-[#8B8B8B]">
            Last saved: {new Date(settings.savedAt).toLocaleString()}
          </div>
        )}
      </main>
    </div>
  );
}
