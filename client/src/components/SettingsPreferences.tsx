/**
 * SettingsPreferences
 *
 * Design: Clinical Precision / Swiss Medical
 * Allows clinicians to configure default practice info, examiner info,
 * preferred report template, custom recommendation snippets, and practice logo.
 * All settings persist in localStorage under key 'bayley4-app-settings'.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Settings, Building2, Stethoscope, FileText,
  Save, RotateCcw, ImagePlus, Trash2, Check, Plus, GripVertical,
  BookmarkPlus, Pencil, Sparkles, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import {
  getApiKey, setApiKey as saveApiKey,
  getSelectedModel, setSelectedModel as saveSelectedModel,
  AI_MODELS, type AiModelId, isAiConfigured
} from '@/lib/aiEnhance';
import { toast } from 'sonner';


// ============================================================
// Types
// ============================================================

export interface RecommendationTemplate {
  id: string;
  title: string;
  text: string;
}

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

  // Custom recommendation templates
  recommendationTemplates: RecommendationTemplate[];

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
  recommendationTemplates: [],
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

function generateTemplateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// ============================================================
// Component
// ============================================================

export default function SettingsPreferences({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Settings
  const [aiApiKey, setAiApiKey] = useState(() => getApiKey());
  const [aiModel, setAiModel] = useState<AiModelId>(() => getSelectedModel());
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiKeyJustSaved, setAiKeyJustSaved] = useState(false);



  // Recommendation template editing
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [showAddTemplate, setShowAddTemplate] = useState(false);

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

  // Recommendation template CRUD
  const addTemplate = useCallback(() => {
    if (!newTemplateTitle.trim()) {
      toast.error('Please enter a template title');
      return;
    }
    if (!newTemplateText.trim()) {
      toast.error('Please enter template text');
      return;
    }
    const newTpl: RecommendationTemplate = {
      id: generateTemplateId(),
      title: newTemplateTitle.trim(),
      text: newTemplateText.trim(),
    };
    setSettings(prev => ({
      ...prev,
      recommendationTemplates: [...prev.recommendationTemplates, newTpl],
    }));
    setNewTemplateTitle('');
    setNewTemplateText('');
    setShowAddTemplate(false);
    setJustSaved(false);
    toast.success('Template added — remember to save settings');
  }, [newTemplateTitle, newTemplateText]);

  const updateTemplate = useCallback((id: string, field: 'title' | 'text', value: string) => {
    setSettings(prev => ({
      ...prev,
      recommendationTemplates: prev.recommendationTemplates.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
    setJustSaved(false);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      recommendationTemplates: prev.recommendationTemplates.filter(t => t.id !== id),
    }));
    setEditingTemplateId(null);
    setJustSaved(false);
    toast.success('Template removed — remember to save settings');
  }, []);

  const moveTemplate = useCallback((id: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      const templates = [...prev.recommendationTemplates];
      const idx = templates.findIndex(t => t.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= templates.length) return prev;
      [templates[idx], templates[swapIdx]] = [templates[swapIdx], templates[idx]];
      return { ...prev, recommendationTemplates: templates };
    });
    setJustSaved(false);
  }, []);

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

        {/* Custom Recommendation Templates */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookmarkPlus className="w-5 h-5 text-[#0D7377]" />
            <h2 className="text-lg font-semibold text-[#2C2C2C]">Recommendation Templates</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Save reusable recommendation text blocks that can be inserted into reports with one click.
            Use <code className="text-xs bg-[#F0EDE8] px-1 py-0.5 rounded">{'{child}'}</code> as a placeholder for the child's first name.
          </p>
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-4">
            {/* Existing templates */}
            {settings.recommendationTemplates.length === 0 && !showAddTemplate && (
              <div className="text-center py-6 text-[#8B8B8B]">
                <BookmarkPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recommendation templates yet.</p>
                <p className="text-xs mt-1">Add templates to quickly insert common recommendations into reports.</p>
              </div>
            )}

            {settings.recommendationTemplates.map((tpl, idx) => (
              <div
                key={tpl.id}
                className="border border-[#E5E1D8] rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E5E1D8]">
                  <GripVertical className="w-4 h-4 text-[#C0BDB6] flex-shrink-0" />
                  {editingTemplateId === tpl.id ? (
                    <Input
                      value={tpl.title}
                      onChange={e => updateTemplate(tpl.id, 'title', e.target.value)}
                      className="h-7 text-sm font-medium flex-1"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-[#2C2C2C] flex-1 truncate">{tpl.title}</span>
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {idx > 0 && (
                      <button
                        onClick={() => moveTemplate(tpl.id, 'up')}
                        className="p-1 text-[#8B8B8B] hover:text-[#0D7377] transition-colors"
                        title="Move up"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                    )}
                    {idx < settings.recommendationTemplates.length - 1 && (
                      <button
                        onClick={() => moveTemplate(tpl.id, 'down')}
                        className="p-1 text-[#8B8B8B] hover:text-[#0D7377] transition-colors"
                        title="Move down"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTemplateId(editingTemplateId === tpl.id ? null : tpl.id)}
                      className={`p-1 transition-colors ${editingTemplateId === tpl.id ? 'text-[#0D7377]' : 'text-[#8B8B8B] hover:text-[#0D7377]'}`}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1 text-[#8B8B8B] hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {editingTemplateId === tpl.id ? (
                  <div className="p-3">
                    <Textarea
                      value={tpl.text}
                      onChange={e => updateTemplate(tpl.id, 'text', e.target.value)}
                      rows={4}
                      className="text-sm"
                      placeholder="Enter recommendation text..."
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplateId(null)}
                        className="gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Done Editing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2.5">
                    <p className="text-sm text-[#6B6B6B] whitespace-pre-wrap line-clamp-3">{tpl.text}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Add new template form */}
            {showAddTemplate ? (
              <div className="border-2 border-dashed border-[#0D7377]/30 rounded-lg p-4 space-y-3 bg-[#0D7377]/[0.02]">
                <div>
                  <Label htmlFor="newTplTitle" className="text-sm">Template Title</Label>
                  <Input
                    id="newTplTitle"
                    value={newTemplateTitle}
                    onChange={e => setNewTemplateTitle(e.target.value)}
                    placeholder="e.g., OT Services Recommendation"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="newTplText" className="text-sm">Recommendation Text</Label>
                  <Textarea
                    id="newTplText"
                    value={newTemplateText}
                    onChange={e => setNewTemplateText(e.target.value)}
                    placeholder="e.g., Please consider the recommendation of occupational therapy services to address skills related to {child}'s fine motor and visual motor development."
                    rows={4}
                    className="mt-1 text-sm"
                  />
                  <p className="text-xs text-[#8B8B8B] mt-1">
                    Tip: Use <code className="bg-[#F0EDE8] px-1 py-0.5 rounded">{'{child}'}</code> and it will be replaced with the child's first name when inserted.
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowAddTemplate(false); setNewTemplateTitle(''); setNewTemplateText(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={addTemplate}
                    className="gap-1.5 bg-[#0D7377] hover:bg-[#0a5c5f] text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Template
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTemplate(true)}
                className="gap-1.5 w-full border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Recommendation Template
              </Button>
            )}
          </div>
        </section>


        {/* AI Settings */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#0D7377]" />
            <h2 className="text-lg font-semibold text-[#2C2C2C]">AI Settings</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            AI Enhance uses OpenRouter to rewrite report sections into professional clinical narratives. Free models are available — no credit card required.
          </p>
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 space-y-5">
            {/* API Key */}
            <div>
              <Label htmlFor="aiApiKey">OpenRouter API Key</Label>
              <p className="text-xs text-[#8B8B8B] mt-0.5 mb-2">
                Get a free API key at{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0D7377] hover:underline inline-flex items-center gap-0.5"
                >
                  openrouter.ai/keys <ExternalLink className="w-3 h-3" />
                </a>
                . Your key is stored locally and never shared.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="aiApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={aiApiKey}
                    onChange={e => { setAiApiKey(e.target.value); setAiKeyJustSaved(false); }}
                    placeholder="sk-or-v1-..."
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B8B] hover:text-[#2C2C2C] transition-colors"
                    title={showApiKey ? 'Hide key' : 'Show key'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    saveApiKey(aiApiKey);
                    setAiKeyJustSaved(true);
                    toast.success(aiApiKey ? 'API key saved' : 'API key removed');
                    setTimeout(() => setAiKeyJustSaved(false), 2000);
                  }}
                  className={`gap-1.5 px-4 ${aiKeyJustSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0D7377] hover:bg-[#0a5c5f]'} text-white`}
                >
                  {aiKeyJustSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {aiKeyJustSaved ? 'Saved' : 'Save Key'}
                </Button>
              </div>
              {aiApiKey && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-700">API key configured</span>
                </div>
              )}
              {!aiApiKey && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-amber-700">No API key — AI Enhance buttons will prompt you to add one</span>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <p className="text-xs text-[#8B8B8B] mt-0.5 mb-2">
                Choose which AI model to use for rewriting report sections.
              </p>
              <Select
                value={aiModel}
                onValueChange={(v: string) => {
                  const modelId = v as AiModelId;
                  setAiModel(modelId);
                  saveSelectedModel(modelId);
                  toast.success('AI model updated');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col">
                        <span>{m.label}</span>
                        <span className="text-xs text-[#8B8B8B]">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* How it works */}
            <div className="bg-[#F8F7F4] rounded-md p-4 border border-[#E5E1D8]">
              <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">How AI Enhance works</h4>
              <ul className="text-xs text-[#6B6B6B] space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold mt-0.5">1.</span>
                  Click the <span className="inline-flex items-center gap-0.5 bg-white border border-[#E5E1D8] rounded px-1.5 py-0.5 text-[#7C3AED] font-medium"><Sparkles className="w-3 h-3" /> AI Enhance</span> button next to any report section
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold mt-0.5">2.</span>
                  The AI rewrites the text into a professional clinical narrative while preserving all factual content
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold mt-0.5">3.</span>
                  Review the result — click "Undo AI" to revert if needed, or edit further manually
                </li>
              </ul>
              <p className="text-xs text-[#8B8B8B] mt-3 italic">
                Requires an internet connection. Your report text is sent to OpenRouter for processing — no data is stored by the AI service.
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
