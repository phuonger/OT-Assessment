/**
 * DrinkingChecklist
 *
 * Guided checklist for the Drinking subsection of the Feeding Evaluation.
 * Covers: bottle, sippy cup, straw cup, open cup, liquid preferences,
 * swallow coordination during drinking, and difficulties.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wand2, RotateCcw, RefreshCw, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type YN = 'Y' | 'N' | '';
type Rating = 'Poor' | 'Fair' | 'Good' | '';

export interface DrinkingData {
  // Bottle
  bottleUse: string; // Current / Weaned / Never used
  bottleNippleType: string;
  bottleSuckPattern: Rating;
  bottleLipSeal: Rating;
  bottleSwallowCoord: Rating;
  // Sippy Cup
  sippyCupUse: string; // Current / Not yet / Weaned
  sippyCupType: string;
  sippyCupLipSeal: Rating;
  sippyCupJawStability: Rating;
  // Straw
  strawUse: string; // Current / Not yet / Emerging
  strawSuckStrength: Rating;
  strawLipSeal: Rating;
  strawLiquidLoss: YN;
  // Open Cup
  openCupUse: string; // Current / Not yet / Emerging
  openCupJawGrading: Rating;
  openCupLipSeal: Rating;
  openCupLiquidLoss: YN;
  openCupAssistLevel: string; // Independent / Hand-over-hand / Full assist
  // Liquid Preferences
  liquidPreferences: string;
  liquidConsistency: string; // Thin / Nectar-thick / Honey-thick
  liquidTemp: string; // Room temp / Cold / Warm
  // General
  swallowCoordDrinking: Rating;
  coughingWithLiquids: YN;
  nasalRegurgitation: YN;
  additionalObs: string;
}

const DEFAULT: DrinkingData = {
  bottleUse: '', bottleNippleType: '', bottleSuckPattern: '', bottleLipSeal: '', bottleSwallowCoord: '',
  sippyCupUse: '', sippyCupType: '', sippyCupLipSeal: '', sippyCupJawStability: '',
  strawUse: '', strawSuckStrength: '', strawLipSeal: '', strawLiquidLoss: '',
  openCupUse: '', openCupJawGrading: '', openCupLipSeal: '', openCupLiquidLoss: '', openCupAssistLevel: '',
  liquidPreferences: '', liquidConsistency: '', liquidTemp: '',
  swallowCoordDrinking: '', coughingWithLiquids: '', nasalRegurgitation: '', additionalObs: '',
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
              className="w-3.5 h-3.5 accent-cyan-600" />
            <span className="text-xs text-slate-700 group-hover:text-cyan-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function generateDrinkingNarrative(data: DrinkingData, childName: string): string {
  const parts: string[] = [];
  const name = childName || 'The child';

  // Bottle
  if (data.bottleUse === 'Current') {
    let s = `${name} is currently using a bottle`;
    if (data.bottleNippleType) s += ` with ${data.bottleNippleType} nipple`;
    s += '.';
    if (data.bottleSuckPattern) s += ` Suck pattern was rated ${data.bottleSuckPattern.toLowerCase()}.`;
    if (data.bottleLipSeal) s += ` Lip seal on bottle was ${data.bottleLipSeal.toLowerCase()}.`;
    if (data.bottleSwallowCoord) s += ` Suck-swallow-breathe coordination was ${data.bottleSwallowCoord.toLowerCase()}.`;
    parts.push(s);
  } else if (data.bottleUse === 'Weaned') {
    parts.push(`${name} has been weaned from the bottle.`);
  }

  // Sippy Cup
  if (data.sippyCupUse === 'Current') {
    let s = `${name} is using a sippy cup`;
    if (data.sippyCupType) s += ` (${data.sippyCupType})`;
    s += '.';
    if (data.sippyCupLipSeal) s += ` Lip seal was ${data.sippyCupLipSeal.toLowerCase()}.`;
    if (data.sippyCupJawStability) s += ` Jaw stability during sippy cup use was ${data.sippyCupJawStability.toLowerCase()}.`;
    parts.push(s);
  } else if (data.sippyCupUse === 'Not yet') {
    parts.push(`${name} is not yet using a sippy cup.`);
  }

  // Straw
  if (data.strawUse === 'Current') {
    let s = `${name} is drinking from a straw.`;
    if (data.strawSuckStrength) s += ` Straw suck strength was ${data.strawSuckStrength.toLowerCase()}.`;
    if (data.strawLipSeal) s += ` Lip seal on straw was ${data.strawLipSeal.toLowerCase()}.`;
    if (data.strawLiquidLoss === 'Y') s += ` Liquid loss was noted during straw drinking.`;
    parts.push(s);
  } else if (data.strawUse === 'Emerging') {
    parts.push(`${name} is emerging with straw drinking skills.`);
  } else if (data.strawUse === 'Not yet') {
    parts.push(`${name} is not yet drinking from a straw.`);
  }

  // Open Cup
  if (data.openCupUse === 'Current') {
    let s = `${name} is drinking from an open cup`;
    if (data.openCupAssistLevel) s += ` (${data.openCupAssistLevel.toLowerCase()})`;
    s += '.';
    if (data.openCupJawGrading) s += ` Jaw grading was ${data.openCupJawGrading.toLowerCase()}.`;
    if (data.openCupLipSeal) s += ` Lip seal on open cup was ${data.openCupLipSeal.toLowerCase()}.`;
    if (data.openCupLiquidLoss === 'Y') s += ` Liquid loss was noted during open cup drinking.`;
    parts.push(s);
  } else if (data.openCupUse === 'Emerging') {
    parts.push(`${name} is emerging with open cup drinking skills.`);
  } else if (data.openCupUse === 'Not yet') {
    parts.push(`${name} is not yet drinking from an open cup.`);
  }

  // Liquid preferences
  if (data.liquidPreferences) parts.push(`Liquid preferences: ${data.liquidPreferences}.`);
  if (data.liquidConsistency) parts.push(`Liquid consistency tolerated: ${data.liquidConsistency.toLowerCase()}.`);

  // General
  if (data.swallowCoordDrinking) parts.push(`Overall swallow coordination during drinking was ${data.swallowCoordDrinking.toLowerCase()}.`);
  if (data.coughingWithLiquids === 'Y') parts.push(`Coughing was observed with liquid intake.`);
  if (data.nasalRegurgitation === 'Y') parts.push(`Nasal regurgitation was observed during drinking.`);
  if (data.additionalObs) parts.push(data.additionalObs);

  return parts.join(' ');
}

function yn(v: string): string { return v === 'Y' ? 'Yes' : v === 'N' ? 'No' : '—'; }
function val(v: string): string { return v || '—'; }

function generateDrinkingPdf(data: DrinkingData, childName: string, dateOfEval?: string, examinerName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OT Feeding Evaluation – Drinking Skills Checklist', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const hdr: string[] = [];
  if (childName) hdr.push(`Child: ${childName}`);
  if (dateOfEval) hdr.push(`Date: ${dateOfEval}`);
  if (examinerName) hdr.push(`Examiner: ${examinerName}`);
  if (hdr.length) doc.text(hdr.join('   |   '), pageWidth / 2, 17, { align: 'center' });

  let startY = 20;
  const drawSection = (title: string, rows: [string, string][], y: number): number => {
    autoTable(doc, {
      startY: y, head: [[title, 'Finding']], body: rows, theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.2, lineWidth: 0.1, lineColor: [160, 160, 160] },
      headStyles: { fillColor: [0, 151, 167], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } },
      margin: { left: 8, right: 8 },
    });
    return (doc as any).lastAutoTable.finalY + 2;
  };

  startY = drawSection('Bottle', [
    ['Current Status', val(data.bottleUse)],
    ['Nipple Type', val(data.bottleNippleType)],
    ['Suck Pattern', val(data.bottleSuckPattern)],
    ['Lip Seal', val(data.bottleLipSeal)],
    ['Suck-Swallow-Breathe Coordination', val(data.bottleSwallowCoord)],
  ], startY);

  startY = drawSection('Sippy Cup', [
    ['Current Status', val(data.sippyCupUse)],
    ['Type', val(data.sippyCupType)],
    ['Lip Seal', val(data.sippyCupLipSeal)],
    ['Jaw Stability', val(data.sippyCupJawStability)],
  ], startY);

  startY = drawSection('Straw', [
    ['Current Status', val(data.strawUse)],
    ['Suck Strength', val(data.strawSuckStrength)],
    ['Lip Seal', val(data.strawLipSeal)],
    ['Liquid Loss', yn(data.strawLiquidLoss)],
  ], startY);

  startY = drawSection('Open Cup', [
    ['Current Status', val(data.openCupUse)],
    ['Jaw Grading', val(data.openCupJawGrading)],
    ['Lip Seal', val(data.openCupLipSeal)],
    ['Liquid Loss', yn(data.openCupLiquidLoss)],
    ['Assist Level', val(data.openCupAssistLevel)],
  ], startY);

  startY = drawSection('General Drinking Observations', [
    ['Liquid Preferences', val(data.liquidPreferences)],
    ['Liquid Consistency', val(data.liquidConsistency)],
    ['Liquid Temperature', val(data.liquidTemp)],
    ['Swallow Coordination', val(data.swallowCoordDrinking)],
    ['Coughing with Liquids', yn(data.coughingWithLiquids)],
    ['Nasal Regurgitation', yn(data.nasalRegurgitation)],
    ['Additional Observations', val(data.additionalObs)],
  ], startY);

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text('Generated from OT Feeding Evaluation Tool', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });

  const safeName = childName.replace(/\s+/g, '_') || 'Child';
  doc.save(`${safeName}_Drinking_Checklist.pdf`);
}

interface Props {
  childName: string;
  onInsertNarrative: (narrative: string, mode: 'append' | 'replace') => void;
  storageKey: string;
  hasExistingContent?: boolean;
  dateOfEval?: string;
  examinerName?: string;
}

export function DrinkingChecklist({ childName, onInsertNarrative, storageKey, hasExistingContent, dateOfEval, examinerName }: Props) {
  const STORAGE_KEY = `drinking-checklist-${storageKey}`;
  const [data, setData] = useState<DrinkingData>(() => {
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

  const update = useCallback(<K extends keyof DrinkingData>(key: K, value: DrinkingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback((mode: 'append' | 'replace') => {
    const narrative = generateDrinkingNarrative(data, childName);
    if (!narrative.trim()) return;
    onInsertNarrative(narrative, mode);
  }, [data, childName, onInsertNarrative]);

  const handleReset = useCallback(() => {
    setData({ ...DEFAULT });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
  }, [STORAGE_KEY]);

  const handlePrint = useCallback(() => {
    generateDrinkingPdf(data, childName, dateOfEval, examinerName);
  }, [data, childName, dateOfEval, examinerName]);

  return (
    <div className="mb-4 print:hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-lg hover:from-cyan-100 hover:to-sky-100 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-800 uppercase tracking-wide">Drinking Skills Guide</span>
          <span className="text-[10px] text-cyan-600 font-normal">(Guided Checklist)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-cyan-600" /> : <ChevronDown className="w-4 h-4 text-cyan-600" />}
      </button>

      {expanded && (
        <div className="mt-2 border border-cyan-200 rounded-lg p-4 bg-white space-y-3">
          <p className="text-[11px] text-slate-500 italic">
            Document drinking skills observed during the evaluation across different vessels.
          </p>

          {/* Bottle */}
          <div className="p-2 bg-cyan-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-cyan-700">Bottle</span>
            <RadioGroup label="Status:" options={['Current', 'Weaned', 'Never used']} value={data.bottleUse} onChange={v => update('bottleUse', v)} />
            {data.bottleUse === 'Current' && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 min-w-[140px]">Nipple type:</span>
                  <input type="text" value={data.bottleNippleType} onChange={e => update('bottleNippleType', e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-cyan-400" placeholder="Standard / Slow flow / etc." />
                </div>
                <RadioGroup label="Suck pattern:" options={['Poor', 'Fair', 'Good']} value={data.bottleSuckPattern} onChange={v => update('bottleSuckPattern', v as Rating)} />
                <RadioGroup label="Lip seal:" options={['Poor', 'Fair', 'Good']} value={data.bottleLipSeal} onChange={v => update('bottleLipSeal', v as Rating)} />
                <RadioGroup label="Suck-swallow-breathe:" options={['Poor', 'Fair', 'Good']} value={data.bottleSwallowCoord} onChange={v => update('bottleSwallowCoord', v as Rating)} />
              </>
            )}
          </div>

          {/* Sippy Cup */}
          <div className="p-2 bg-cyan-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-cyan-700">Sippy Cup</span>
            <RadioGroup label="Status:" options={['Current', 'Not yet', 'Weaned']} value={data.sippyCupUse} onChange={v => update('sippyCupUse', v)} />
            {data.sippyCupUse === 'Current' && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 min-w-[140px]">Cup type:</span>
                  <input type="text" value={data.sippyCupType} onChange={e => update('sippyCupType', e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-cyan-400" placeholder="Hard spout / Soft spout / 360" />
                </div>
                <RadioGroup label="Lip seal:" options={['Poor', 'Fair', 'Good']} value={data.sippyCupLipSeal} onChange={v => update('sippyCupLipSeal', v as Rating)} />
                <RadioGroup label="Jaw stability:" options={['Poor', 'Fair', 'Good']} value={data.sippyCupJawStability} onChange={v => update('sippyCupJawStability', v as Rating)} />
              </>
            )}
          </div>

          {/* Straw */}
          <div className="p-2 bg-cyan-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-cyan-700">Straw</span>
            <RadioGroup label="Status:" options={['Current', 'Emerging', 'Not yet']} value={data.strawUse} onChange={v => update('strawUse', v)} />
            {(data.strawUse === 'Current' || data.strawUse === 'Emerging') && (
              <>
                <RadioGroup label="Suck strength:" options={['Poor', 'Fair', 'Good']} value={data.strawSuckStrength} onChange={v => update('strawSuckStrength', v as Rating)} />
                <RadioGroup label="Lip seal:" options={['Poor', 'Fair', 'Good']} value={data.strawLipSeal} onChange={v => update('strawLipSeal', v as Rating)} />
                <RadioGroup label="Liquid loss?" options={['Y', 'N']} value={data.strawLiquidLoss} onChange={v => update('strawLiquidLoss', v as YN)} />
              </>
            )}
          </div>

          {/* Open Cup */}
          <div className="p-2 bg-cyan-50 rounded-md space-y-2">
            <span className="text-xs font-bold text-cyan-700">Open Cup</span>
            <RadioGroup label="Status:" options={['Current', 'Emerging', 'Not yet']} value={data.openCupUse} onChange={v => update('openCupUse', v)} />
            {(data.openCupUse === 'Current' || data.openCupUse === 'Emerging') && (
              <>
                <RadioGroup label="Jaw grading:" options={['Poor', 'Fair', 'Good']} value={data.openCupJawGrading} onChange={v => update('openCupJawGrading', v as Rating)} />
                <RadioGroup label="Lip seal:" options={['Poor', 'Fair', 'Good']} value={data.openCupLipSeal} onChange={v => update('openCupLipSeal', v as Rating)} />
                <RadioGroup label="Liquid loss?" options={['Y', 'N']} value={data.openCupLiquidLoss} onChange={v => update('openCupLiquidLoss', v as YN)} />
                <RadioGroup label="Assist level:" options={['Independent', 'Hand-over-hand', 'Full assist']} value={data.openCupAssistLevel} onChange={v => update('openCupAssistLevel', v)} />
              </>
            )}
          </div>

          {/* Liquid Preferences */}
          <div>
            <label className="text-xs font-semibold text-slate-600">Liquid preferences:</label>
            <input type="text" value={data.liquidPreferences} onChange={e => update('liquidPreferences', e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-400" placeholder="e.g., water, milk, juice..." />
          </div>
          <RadioGroup label="Liquid consistency:" options={['Thin', 'Nectar-thick', 'Honey-thick']} value={data.liquidConsistency} onChange={v => update('liquidConsistency', v)} />
          <RadioGroup label="Preferred temperature:" options={['Room temp', 'Cold', 'Warm']} value={data.liquidTemp} onChange={v => update('liquidTemp', v)} />

          {/* General */}
          <RadioGroup label="Swallow coordination:" options={['Poor', 'Fair', 'Good']} value={data.swallowCoordDrinking} onChange={v => update('swallowCoordDrinking', v as Rating)} />
          <RadioGroup label="Coughing with liquids?" options={['Y', 'N']} value={data.coughingWithLiquids} onChange={v => update('coughingWithLiquids', v as YN)} />
          <RadioGroup label="Nasal regurgitation?" options={['Y', 'N']} value={data.nasalRegurgitation} onChange={v => update('nasalRegurgitation', v as YN)} />

          <div>
            <label className="text-xs font-semibold text-slate-600">Additional observations:</label>
            <textarea value={data.additionalObs} onChange={e => update('additionalObs', e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-400" rows={2} placeholder="Any other drinking observations..." />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
            <Button onClick={() => handleGenerate('append')} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Generate & Append
            </Button>
            <Button onClick={() => { if (hasExistingContent) { setShowReplaceConfirm(true); } else { handleGenerate('replace'); } }}
              size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Clear & Re-generate
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm" className="text-xs gap-1.5 text-slate-600 border-cyan-300 hover:bg-cyan-50">
              <Printer className="w-3.5 h-3.5" /> Print Checklist
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
                  <p className="text-[11px] text-amber-700 mt-0.5">This will clear the current Drinking text and replace it with newly generated text.</p>
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
