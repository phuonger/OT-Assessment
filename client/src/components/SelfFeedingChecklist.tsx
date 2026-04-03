/**
 * SelfFeedingChecklist
 *
 * Lightweight guided checklist for the Self-Feeding Skills subsection.
 * Covers: finger feeding, utensil use, cup drinking, hand-eye coordination,
 * grasp patterns, and independence level.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wand2, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type YN = 'Y' | 'N' | '';
type Rating = 'Poor' | 'Fair' | 'Good' | '';

export interface SelfFeedingData {
  fingerFeeds: YN;
  fingerFeedsDesc: string;
  spoonUse: string; // Not yet / Emerging / Independent
  spoonGrasp: string; // Palmar / Digital / Mature
  spoonAccuracy: Rating;
  forkUse: string; // Not yet / Emerging / Independent
  forkStabbing: Rating;
  cupDrinking: string; // Not yet / With assist / Independent
  cupType: string; // Open / Sippy / Straw / Bottle
  cupSpilling: YN;
  handEyeCoord: Rating;
  bilateralCoord: Rating;
  graspRelease: Rating;
  messiness: string; // Age-appropriate / Excessive
  independence: string; // Fully dependent / Needs assist / Independent
  additionalObs: string;
}

const DEFAULT: SelfFeedingData = {
  fingerFeeds: '', fingerFeedsDesc: '', spoonUse: '', spoonGrasp: '', spoonAccuracy: '',
  forkUse: '', forkStabbing: '', cupDrinking: '', cupType: '', cupSpilling: '',
  handEyeCoord: '', bilateralCoord: '', graspRelease: '', messiness: '',
  independence: '', additionalObs: '',
};

function RadioGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold text-slate-600 min-w-[140px]">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer group">
            <input type="radio" checked={value === opt} onChange={() => onChange(value === opt ? '' : opt)}
              className="w-3.5 h-3.5 accent-violet-600" />
            <span className="text-xs text-slate-700 group-hover:text-violet-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function generateSelfFeedingNarrative(data: SelfFeedingData, childName: string): string {
  const parts: string[] = [];
  const name = childName || 'The child';

  if (data.fingerFeeds === 'Y') {
    let s = `${name} is able to finger feed independently`;
    if (data.fingerFeedsDesc) s += `. ${data.fingerFeedsDesc}`;
    s += '.';
    parts.push(s);
  } else if (data.fingerFeeds === 'N') {
    parts.push(`${name} is not yet finger feeding independently.`);
  }

  if (data.spoonUse) {
    let s = `Spoon use: ${data.spoonUse.toLowerCase()}`;
    if (data.spoonGrasp) s += ` with ${data.spoonGrasp.toLowerCase()} grasp`;
    if (data.spoonAccuracy) s += `, accuracy rated ${data.spoonAccuracy.toLowerCase()}`;
    s += '.';
    parts.push(s);
  }

  if (data.forkUse) {
    let s = `Fork use: ${data.forkUse.toLowerCase()}`;
    if (data.forkStabbing) s += `, stabbing ability rated ${data.forkStabbing.toLowerCase()}`;
    s += '.';
    parts.push(s);
  }

  if (data.cupDrinking) {
    let s = `Cup drinking: ${data.cupDrinking.toLowerCase()}`;
    if (data.cupType) s += ` (${data.cupType})`;
    if (data.cupSpilling === 'Y') s += ' with spillage noted';
    s += '.';
    parts.push(s);
  }

  if (data.handEyeCoord) parts.push(`Hand-eye coordination was rated ${data.handEyeCoord.toLowerCase()}.`);
  if (data.bilateralCoord) parts.push(`Bilateral coordination was rated ${data.bilateralCoord.toLowerCase()}.`);
  if (data.graspRelease) parts.push(`Grasp and release of food/utensils was rated ${data.graspRelease.toLowerCase()}.`);
  if (data.messiness) parts.push(`Messiness during self-feeding was ${data.messiness.toLowerCase()}.`);
  if (data.independence) parts.push(`Overall self-feeding independence: ${data.independence.toLowerCase()}.`);
  if (data.additionalObs) parts.push(data.additionalObs);

  return parts.join(' ');
}

interface Props {
  childName: string;
  onInsertNarrative: (narrative: string, mode: 'append' | 'replace') => void;
  storageKey: string;
  hasExistingContent?: boolean;
}

export function SelfFeedingChecklist({ childName, onInsertNarrative, storageKey, hasExistingContent }: Props) {
  const STORAGE_KEY = `self-feeding-${storageKey}`;
  const [data, setData] = useState<SelfFeedingData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : { ...DEFAULT };
    } catch { return { ...DEFAULT }; }
  });
  const [expanded, setExpanded] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
  }, [data, STORAGE_KEY]);

  const update = useCallback(<K extends keyof SelfFeedingData>(key: K, value: SelfFeedingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback((mode: 'append' | 'replace') => {
    const narrative = generateSelfFeedingNarrative(data, childName);
    if (!narrative.trim()) return;
    onInsertNarrative(narrative, mode);
  }, [data, childName, onInsertNarrative]);

  const handleReset = useCallback(() => {
    setData({ ...DEFAULT });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
  }, [STORAGE_KEY]);

  return (
    <div className="mb-4 print:hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg hover:from-violet-100 hover:to-purple-100 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-800 uppercase tracking-wide">Self-Feeding Skills Guide</span>
          <span className="text-[10px] text-violet-600 font-normal">(Guided Checklist)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-violet-600" /> : <ChevronDown className="w-4 h-4 text-violet-600" />}
      </button>

      {expanded && (
        <div className="mt-2 border border-violet-200 rounded-lg p-4 bg-white space-y-3">
          <p className="text-[11px] text-slate-500 italic">
            Document self-feeding skills observed during the evaluation.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Finger feeds independently?" options={['Y', 'N']} value={data.fingerFeeds} onChange={v => update('fingerFeeds', v as YN)} />
            {data.fingerFeeds === 'Y' && (
              <input type="text" value={data.fingerFeedsDesc} onChange={e => update('fingerFeedsDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-violet-400" placeholder="Quality/details..." />
            )}
          </div>

          <div className="p-2 bg-violet-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-violet-700">Spoon Use</span>
            <RadioGroup label="Level:" options={['Not yet', 'Emerging', 'Independent']} value={data.spoonUse} onChange={v => update('spoonUse', v)} />
            {data.spoonUse && data.spoonUse !== 'Not yet' && (
              <>
                <RadioGroup label="Grasp pattern:" options={['Palmar', 'Digital', 'Mature']} value={data.spoonGrasp} onChange={v => update('spoonGrasp', v)} />
                <RadioGroup label="Accuracy:" options={['Poor', 'Fair', 'Good']} value={data.spoonAccuracy} onChange={v => update('spoonAccuracy', v as Rating)} />
              </>
            )}
          </div>

          <div className="p-2 bg-violet-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-violet-700">Fork Use</span>
            <RadioGroup label="Level:" options={['Not yet', 'Emerging', 'Independent']} value={data.forkUse} onChange={v => update('forkUse', v)} />
            {data.forkUse && data.forkUse !== 'Not yet' && (
              <RadioGroup label="Stabbing ability:" options={['Poor', 'Fair', 'Good']} value={data.forkStabbing} onChange={v => update('forkStabbing', v as Rating)} />
            )}
          </div>

          <div className="p-2 bg-violet-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-violet-700">Cup Drinking</span>
            <RadioGroup label="Level:" options={['Not yet', 'With assist', 'Independent']} value={data.cupDrinking} onChange={v => update('cupDrinking', v)} />
            {data.cupDrinking && data.cupDrinking !== 'Not yet' && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 min-w-[140px]">Cup type:</span>
                  <input type="text" value={data.cupType} onChange={e => update('cupType', e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-violet-400" placeholder="Open / Sippy / Straw / Bottle" />
                </div>
                <RadioGroup label="Spillage?" options={['Y', 'N']} value={data.cupSpilling} onChange={v => update('cupSpilling', v as YN)} />
              </>
            )}
          </div>

          <RadioGroup label="Hand-eye coordination:" options={['Poor', 'Fair', 'Good']} value={data.handEyeCoord} onChange={v => update('handEyeCoord', v as Rating)} />
          <RadioGroup label="Bilateral coordination:" options={['Poor', 'Fair', 'Good']} value={data.bilateralCoord} onChange={v => update('bilateralCoord', v as Rating)} />
          <RadioGroup label="Grasp & release:" options={['Poor', 'Fair', 'Good']} value={data.graspRelease} onChange={v => update('graspRelease', v as Rating)} />
          <RadioGroup label="Messiness:" options={['Age-appropriate', 'Excessive']} value={data.messiness} onChange={v => update('messiness', v)} />
          <RadioGroup label="Overall independence:" options={['Fully dependent', 'Needs assist', 'Independent']} value={data.independence} onChange={v => update('independence', v)} />

          <div>
            <label className="text-xs font-semibold text-slate-600">Additional observations:</label>
            <textarea value={data.additionalObs} onChange={e => update('additionalObs', e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400" rows={2} placeholder="Any other self-feeding observations..." />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
            <Button onClick={() => handleGenerate('append')} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Generate & Append
            </Button>
            <Button onClick={() => { if (hasExistingContent) { setShowReplaceConfirm(true); } else { handleGenerate('replace'); } }}
              size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Clear & Re-generate
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="text-xs gap-1.5 text-slate-600">
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </Button>
            <span className="text-[10px] text-slate-400 ml-auto">Selections auto-save</span>
          </div>

          {showReplaceConfirm && (
            <div className="mt-3 border border-amber-300 bg-amber-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800">Replace existing text?</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">This will clear the current Self-Feeding Skills text and replace it with newly generated text.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button onClick={() => { handleGenerate('replace'); setShowReplaceConfirm(false); }} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1">
                      <RefreshCw className="w-3 h-3" /> Yes, Replace
                    </Button>
                    <Button onClick={() => setShowReplaceConfirm(false)} variant="outline" size="sm" className="text-xs">Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
