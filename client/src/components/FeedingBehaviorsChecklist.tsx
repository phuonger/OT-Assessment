/**
 * FeedingBehaviorsChecklist
 *
 * Lightweight guided checklist for the Feeding Behaviors subsection.
 * Covers: readiness, drooling, posture, seated tolerance, finger feeding,
 * food acceptance, refusal behaviors, and sensory responses.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wand2, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type YN = 'Y' | 'N' | '';
type Rating = 'Poor' | 'Fair' | 'Good' | '';

export interface FeedingBehaviorsData {
  readiness: Rating;
  drooling: YN;
  droolingDesc: string;
  posture: string; // Adequate / Impaired
  seatedTolerance: string; // WFL / Impaired
  seatedToleranceDesc: string;
  fingerFeeding: YN;
  fingerFeedingDesc: string;
  foodAcceptance: string; // Readily accepts / Hesitant / Refuses
  foodAcceptanceDesc: string;
  refusalBehaviors: YN;
  refusalDesc: string;
  gagging: YN;
  gaggingDesc: string;
  sensoryResponse: string; // WFL / Hyper / Hypo
  mealDuration: string;
  additionalObs: string;
}

const DEFAULT: FeedingBehaviorsData = {
  readiness: '', drooling: '', droolingDesc: '', posture: '', seatedTolerance: '',
  seatedToleranceDesc: '', fingerFeeding: '', fingerFeedingDesc: '', foodAcceptance: '',
  foodAcceptanceDesc: '', refusalBehaviors: '', refusalDesc: '', gagging: '', gaggingDesc: '',
  sensoryResponse: '', mealDuration: '', additionalObs: '',
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
              className="w-3.5 h-3.5 accent-blue-600" />
            <span className="text-xs text-slate-700 group-hover:text-blue-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function generateBehaviorsNarrative(data: FeedingBehaviorsData, childName: string): string {
  const parts: string[] = [];
  const name = childName || 'The child';

  if (data.readiness) parts.push(`${name} demonstrates ${data.readiness.toLowerCase()} readiness with feeding activity.`);
  if (data.posture) parts.push(`Posture during feeding was ${data.posture === 'Adequate' ? 'adequate' : 'impaired'}.`);
  if (data.seatedTolerance) {
    let s = `Seated tolerance was ${data.seatedTolerance === 'WFL' ? 'within functional limits' : 'impaired'}`;
    if (data.seatedToleranceDesc) s += ` (${data.seatedToleranceDesc})`;
    s += '.';
    parts.push(s);
  }
  if (data.drooling === 'Y') {
    let s = `Drooling was observed`;
    if (data.droolingDesc) s += ` — ${data.droolingDesc}`;
    s += '.';
    parts.push(s);
  } else if (data.drooling === 'N') {
    parts.push(`No drooling was observed during the evaluation.`);
  }
  if (data.fingerFeeding === 'Y') {
    let s = `${name} is finger feeding`;
    if (data.fingerFeedingDesc) s += `. ${data.fingerFeedingDesc}`;
    s += '.';
    parts.push(s);
  } else if (data.fingerFeeding === 'N') {
    parts.push(`${name} is not yet finger feeding.`);
  }
  if (data.foodAcceptance) {
    let s = `Food acceptance: ${name} ${data.foodAcceptance.toLowerCase()} new foods`;
    if (data.foodAcceptanceDesc) s += `. ${data.foodAcceptanceDesc}`;
    s += '.';
    parts.push(s);
  }
  if (data.gagging === 'Y') {
    let s = `Gagging was observed during the evaluation`;
    if (data.gaggingDesc) s += ` — ${data.gaggingDesc}`;
    s += '.';
    parts.push(s);
  }
  if (data.refusalBehaviors === 'Y') {
    let s = `Refusal behaviors were observed`;
    if (data.refusalDesc) s += ` — ${data.refusalDesc}`;
    s += '.';
    parts.push(s);
  }
  if (data.sensoryResponse) {
    parts.push(`Sensory response to food was ${data.sensoryResponse === 'WFL' ? 'within functional limits' : data.sensoryResponse.toLowerCase()}.`);
  }
  if (data.mealDuration) parts.push(`Typical meal duration: ${data.mealDuration}.`);
  if (data.additionalObs) parts.push(data.additionalObs);

  return parts.join(' ');
}

interface Props {
  childName: string;
  onInsertNarrative: (narrative: string, mode: 'append' | 'replace') => void;
  storageKey: string;
  hasExistingContent?: boolean;
}

export function FeedingBehaviorsChecklist({ childName, onInsertNarrative, storageKey, hasExistingContent }: Props) {
  const STORAGE_KEY = `feeding-behaviors-${storageKey}`;
  const [data, setData] = useState<FeedingBehaviorsData>(() => {
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

  const update = useCallback(<K extends keyof FeedingBehaviorsData>(key: K, value: FeedingBehaviorsData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback((mode: 'append' | 'replace') => {
    const narrative = generateBehaviorsNarrative(data, childName);
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
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Feeding Behaviors Guide</span>
          <span className="text-[10px] text-blue-600 font-normal">(Guided Checklist)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
      </button>

      {expanded && (
        <div className="mt-2 border border-blue-200 rounded-lg p-4 bg-white space-y-3">
          <p className="text-[11px] text-slate-500 italic">
            Use this checklist to document feeding behaviors observed during the evaluation.
          </p>

          <RadioGroup label="Feeding readiness:" options={['Poor', 'Fair', 'Good']} value={data.readiness} onChange={v => update('readiness', v as Rating)} />
          <RadioGroup label="Posture during feeding:" options={['Adequate', 'Impaired']} value={data.posture} onChange={v => update('posture', v)} />
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Seated tolerance:" options={['WFL', 'Impaired']} value={data.seatedTolerance} onChange={v => update('seatedTolerance', v)} />
            {data.seatedTolerance === 'Impaired' && (
              <input type="text" value={data.seatedToleranceDesc} onChange={e => update('seatedToleranceDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Describe..." />
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Drooling?" options={['Y', 'N']} value={data.drooling} onChange={v => update('drooling', v as YN)} />
            {data.drooling === 'Y' && (
              <input type="text" value={data.droolingDesc} onChange={e => update('droolingDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Severity/context..." />
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Finger feeding?" options={['Y', 'N']} value={data.fingerFeeding} onChange={v => update('fingerFeeding', v as YN)} />
            {data.fingerFeeding === 'Y' && (
              <input type="text" value={data.fingerFeedingDesc} onChange={e => update('fingerFeedingDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Quality/details..." />
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Food acceptance:" options={['Readily accepts', 'Hesitant', 'Refuses']} value={data.foodAcceptance} onChange={v => update('foodAcceptance', v)} />
            <input type="text" value={data.foodAcceptanceDesc} onChange={e => update('foodAcceptanceDesc', e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Details..." />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Gagging observed?" options={['Y', 'N']} value={data.gagging} onChange={v => update('gagging', v as YN)} />
            {data.gagging === 'Y' && (
              <input type="text" value={data.gaggingDesc} onChange={e => update('gaggingDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Trigger/frequency..." />
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RadioGroup label="Refusal behaviors?" options={['Y', 'N']} value={data.refusalBehaviors} onChange={v => update('refusalBehaviors', v as YN)} />
            {data.refusalBehaviors === 'Y' && (
              <input type="text" value={data.refusalDesc} onChange={e => update('refusalDesc', e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Describe behaviors..." />
            )}
          </div>
          <RadioGroup label="Sensory response to food:" options={['WFL', 'Hyper-responsive', 'Hypo-responsive']} value={data.sensoryResponse} onChange={v => update('sensoryResponse', v)} />
          <div>
            <label className="text-xs font-semibold text-slate-600">Typical meal duration:</label>
            <input type="text" value={data.mealDuration} onChange={e => update('mealDuration', e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="e.g., 20-30 minutes" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Additional observations:</label>
            <textarea value={data.additionalObs} onChange={e => update('additionalObs', e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" rows={2} placeholder="Any other feeding behavior observations..." />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
            <Button onClick={() => handleGenerate('append')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
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
                  <p className="text-[11px] text-amber-700 mt-0.5">This will clear the current Feeding Behaviors text and replace it with newly generated text.</p>
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
