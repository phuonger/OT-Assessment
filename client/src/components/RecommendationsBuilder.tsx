import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, GripVertical, ChevronDown, ChevronUp, PenLine } from 'lucide-react';

// ── Preset recommendation options ──────────────────────────────
const PRESET_RECOMMENDATIONS = [
  'Please consider continuation of Feeding Therapy 1x/wk. until child reaches 3 years of age to address adaptive skills and oral motor strength and coordination, oral sensory processing and to provide parent education.',
  'Please consider the recommendation of Feeding therapy (SWC not required/required) 1x/week to work on oral motor skills, oral sensory performance, and improve overall adaptive skills.',
  'Please consider the recommendation of Occupational Therapy services to address skills related to cognitive, fine motor, gross motor, social emotional, adaptive behavior skills, and sensory processing skills.',
  'Please continue Occupational therapy services at a frequency of 1x/wk to work on progressing client toward age-appropriate skills in the areas of cognition, fine motor, gross motor, social emotional skills, and adaptive skills.',
  'Please refer to Speech and language pathology report for further details.',
  'Please refer to Physical Therapy report for further details.',
  'Please consider Infant Stimulation to address cognitive skills and to assist with overall development.',
  'Please consider psychological evaluation to determine etiology of delay.',
  'Please consider formal medical evaluation to determine eligibility of continuation of services through insurance.',
  'Please consider routine visits with pediatrician.',
  'Please defer to school district to assess for educationally relevant services specifically occupational therapy and speech therapy services.',
  'If not found eligible, caregivers recommended to seek services via private/medical insurance.',
];

interface RecommendationsBuilderProps {
  /** The full recommendations text (synced with parent state) */
  value: string;
  onChange: (val: string) => void;
  firstName: string;
  /** Optional intro line before the numbered list */
  introLine?: string;
}

interface RecItem {
  id: string;
  text: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Parse a recommendations string back into structured items */
function parseRecommendations(text: string): { intro: string; items: RecItem[]; closing: string } {
  if (!text.trim()) return { intro: '', items: [], closing: '' };

  const lines = text.split('\n');
  let intro = '';
  const items: RecItem[] = [];
  let closing = '';
  let inItems = false;
  let closingStartIdx = -1;

  // Find the "Thank you" closing line
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().toLowerCase().startsWith('thank you')) {
      closingStartIdx = i;
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (closingStartIdx >= 0 && i >= closingStartIdx) {
      closing += (closing ? '\n' : '') + line;
      continue;
    }

    // Check if line starts with a number (1. or 1) or 1.)
    const numMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);
    if (numMatch) {
      inItems = true;
      items.push({ id: generateId(), text: numMatch[2] });
    } else if (inItems && trimmed && !trimmed.match(/^[A-Z].*:$/)) {
      // Continuation of previous item
      if (items.length > 0) {
        items[items.length - 1].text += ' ' + trimmed;
      }
    } else if (!inItems) {
      intro += (intro ? '\n' : '') + line;
    }
  }

  return { intro, items, closing };
}

/** Build the full text from structured data */
function buildRecommendationsText(intro: string, items: RecItem[], closing: string): string {
  let text = intro.trim();
  if (items.length > 0) {
    if (text) text += '\n\n';
    text += items.map((item, i) => `${i + 1}. ${item.text}`).join('\n');
  }
  if (closing.trim()) {
    text += '\n\n' + closing.trim();
  }
  return text;
}

export default function RecommendationsBuilder({ value, onChange, firstName, introLine }: RecommendationsBuilderProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Parse the current value into structured form
  const { intro, items, closing } = parseRecommendations(value);

  const defaultIntro = introLine || 'It is recommended that the IFSP team consider the following, however, Regional Center is to make the final determination of eligibility and services:';
  const defaultClosing = `Thank you for this referral. It was a pleasure to work with ${firstName} and their family. Please feel free to contact me with any additional questions and/or concerns.`;

  // Check which presets are already selected
  const selectedPresets = new Set(items.map(item => {
    // Normalize for comparison
    return PRESET_RECOMMENDATIONS.find(p =>
      item.text.trim().toLowerCase() === p.trim().toLowerCase()
    ) || null;
  }).filter(Boolean));

  const togglePreset = useCallback((preset: string) => {
    const currentItems = [...items];
    const existingIdx = currentItems.findIndex(item =>
      item.text.trim().toLowerCase() === preset.trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      // Remove it
      currentItems.splice(existingIdx, 1);
    } else {
      // Add it
      currentItems.push({ id: generateId(), text: preset });
    }

    const currentIntro = intro.trim() || (currentItems.length > 0 ? defaultIntro : '');
    const currentClosing = closing.trim() || (currentItems.length > 0 ? defaultClosing : '');
    onChange(buildRecommendationsText(currentIntro, currentItems, currentClosing));
  }, [items, intro, closing, defaultIntro, defaultClosing, onChange]);

  const addCustomItem = useCallback(() => {
    if (!customText.trim()) return;
    const currentItems = [...items, { id: generateId(), text: customText.trim() }];
    const currentIntro = intro.trim() || defaultIntro;
    const currentClosing = closing.trim() || defaultClosing;
    onChange(buildRecommendationsText(currentIntro, currentItems, currentClosing));
    setCustomText('');
    setShowCustomInput(false);
  }, [customText, items, intro, closing, defaultIntro, defaultClosing, onChange]);

  const removeItem = useCallback((idx: number) => {
    const currentItems = [...items];
    currentItems.splice(idx, 1);
    if (currentItems.length === 0) {
      onChange('');
    } else {
      const currentIntro = intro.trim() || defaultIntro;
      const currentClosing = closing.trim() || defaultClosing;
      onChange(buildRecommendationsText(currentIntro, currentItems, currentClosing));
    }
  }, [items, intro, closing, defaultIntro, defaultClosing, onChange]);

  const moveItem = useCallback((idx: number, direction: 'up' | 'down') => {
    const currentItems = [...items];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentItems.length) return;
    [currentItems[idx], currentItems[newIdx]] = [currentItems[newIdx], currentItems[idx]];
    const currentIntro = intro.trim() || defaultIntro;
    const currentClosing = closing.trim() || defaultClosing;
    onChange(buildRecommendationsText(currentIntro, currentItems, currentClosing));
  }, [items, intro, closing, defaultIntro, defaultClosing, onChange]);

  const startEditing = useCallback((item: RecItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  }, []);

  const saveEditing = useCallback(() => {
    if (!editingItemId) return;
    const currentItems = items.map(item =>
      item.id === editingItemId ? { ...item, text: editingText } : item
    );
    const currentIntro = intro.trim() || defaultIntro;
    const currentClosing = closing.trim() || defaultClosing;
    onChange(buildRecommendationsText(currentIntro, currentItems, currentClosing));
    setEditingItemId(null);
    setEditingText('');
  }, [editingItemId, editingText, items, intro, closing, defaultIntro, defaultClosing, onChange]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="gap-1.5 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {showPicker ? 'Hide Options' : 'Add Recommendation'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="gap-1.5 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <PenLine className="w-3.5 h-3.5" />
          Custom Entry
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode(!editMode)}
          className={`gap-1.5 text-xs ${editMode ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-500'}`}
        >
          {editMode ? 'Done Editing' : 'Edit Items'}
        </Button>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange('')}
            className="gap-1.5 text-xs border-red-200 text-red-500 hover:bg-red-50 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Preset Picker Dropdown */}
      {showPicker && (
        <div className="no-print border border-teal-200 rounded-lg bg-teal-50/30 p-3 space-y-1.5 max-h-72 overflow-y-auto">
          <p className="text-xs font-medium text-teal-700 mb-2">Click to add/remove recommendations:</p>
          {PRESET_RECOMMENDATIONS.map((preset, i) => {
            const isSelected = selectedPresets.has(preset);
            return (
              <button
                key={i}
                onClick={() => togglePreset(preset)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-start gap-2 ${
                  isSelected
                    ? 'bg-teal-100 border border-teal-300 text-teal-900'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs ${
                  isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                }`}>
                  {isSelected && '✓'}
                </span>
                <span className="flex-1 leading-snug">{preset}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Entry Input */}
      {showCustomInput && (
        <div className="no-print border border-slate-200 rounded-lg bg-slate-50/50 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-500">Write a custom recommendation:</p>
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Enter custom recommendation text..."
            rows={3}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-teal-400 focus:border-teal-400 resize-y"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addCustomItem} disabled={!customText.trim()} className="text-xs bg-teal-600 hover:bg-teal-700">
              Add to List
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowCustomInput(false); setCustomText(''); }} className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Preview of built recommendations */}
      {items.length > 0 ? (
        <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-3">
          {/* Intro */}
          <p className="text-sm text-slate-700 leading-relaxed italic">
            {intro.trim() || defaultIntro}
          </p>

          {/* Numbered items */}
          <ol className="list-none space-y-2 pl-0">
            {items.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2 group">
                {editMode && (
                  <div className="flex flex-col gap-0.5 mt-0.5 no-print">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === items.length - 1}
                      className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                )}
                <span className="text-sm font-semibold text-teal-700 mt-0.5 flex-shrink-0 min-w-[1.5rem]">
                  {idx + 1}.
                </span>
                {editingItemId === item.id ? (
                  <div className="flex-1 space-y-1.5 no-print">
                    <textarea
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full border border-teal-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-teal-400 resize-y"
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={saveEditing} className="text-xs h-6 bg-teal-600 hover:bg-teal-700">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingItemId(null)} className="text-xs h-6">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <span
                    className={`flex-1 text-sm text-slate-700 leading-relaxed ${editMode ? 'cursor-pointer hover:bg-amber-50 rounded px-1 -mx-1' : ''}`}
                    onClick={() => editMode && startEditing(item)}
                  >
                    {item.text}
                  </span>
                )}
                {editMode && editingItemId !== item.id && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="no-print p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ol>

          {/* Closing */}
          <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
            {closing.trim() || defaultClosing}
          </p>
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 rounded-lg bg-slate-50/50 p-6 text-center no-print">
          <p className="text-sm text-slate-400">No recommendations added yet. Click "Add Recommendation" to select from preset options or write a custom one.</p>
        </div>
      )}

      {/* Hidden raw text for print/export */}
      {items.length > 0 && (
        <div className="hidden print:block">
          <p className="text-sm mb-2">{intro.trim() || defaultIntro}</p>
          {items.map((item, idx) => (
            <p key={item.id} className="text-sm ml-6 mb-1">{idx + 1}. {item.text}</p>
          ))}
          <p className="text-sm mt-2">{closing.trim() || defaultClosing}</p>
        </div>
      )}
    </div>
  );
}
