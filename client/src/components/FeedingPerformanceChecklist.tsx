/**
 * FeedingPerformanceChecklist
 *
 * Interactive guided assessment component based on the Feeders & Growers
 * OT Feeding Evaluation Tool. Provides structured checklists for:
 * - Jaw, Lips, Tongue (Strength, Function, Observations)
 * - Oral Sensory Performance
 * - Soft Palate Movement
 * - Feeding Performance (what child ate/drank)
 * - Aspiration Signs
 * - Compensatory Strategies
 * - Overall Quality & Swallow Coordination
 * - Refusal Behaviors & Self-Feeding
 *
 * Auto-generates narrative text from selections that can be inserted
 * into the report's editable sections.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wand2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================
// Types
// ============================================================

type YN = 'Y' | 'N' | '';
type Strength = 'WFL' | 'Impaired' | '';
type Rating = 'Poor' | 'Fair' | 'Good' | '';
type WFLImpaired = 'WFL' | 'Impaired' | '';
type Sensitivity = 'Hyper-responsive' | 'Hypo-responsive' | '';

export interface FeedingChecklistData {
  // Oral Sensory
  oralSeeking: YN;
  extraOralSensitivity: Sensitivity;
  intraOralSensitivity: Sensitivity;
  // What child ate/drank
  foodsDuringAssessment: string;
  // Jaw
  jawStrength: Strength;
  jawCupDrinking: Rating;
  jawBitingThrough: Rating;
  jawChewingEndurance: WFLImpaired;
  jawChewingEnduranceRating: Rating;
  jawWideExcursions: YN;
  jawLossOfFood: YN;
  jawChewingPattern: string; // Munching / Diagonal / Emerging Rotary / Mature Rotary
  jawClosedAtRest: YN;
  jawAnticipatoryOpening: YN;
  // Lips
  lipsStrength: Strength;
  lipsDrinking: Rating;
  lipsDrinkingDetail: string; // seal on straw/cup/bottle/breast
  lipsChewing: Rating;
  lipsEndurance: WFLImpaired;
  lipsEnduranceRating: Rating;
  lipsDrooling: YN;
  lipsLossOfFood: YN;
  // Tongue
  tongueStrength: Strength;
  tongueDrinking: Rating; // cupping
  tongueChewingLat: Rating; // lateralizing to molar ridge
  tongueChewingKeep: Rating; // keep food on molar ridge
  tongueChewingEndurance: WFLImpaired;
  tongueChewingEnduranceRating: Rating;
  tongueLossSeal: YN;
  tongueLossFood: YN;
  tongueLateralizesTo: string; // L / R / Both
  tonguePrefers: string; // L / R
  tongueTransfersMidline: YN;
  tongueTipElevation: Rating;
  tongueCleanLips: YN;
  tongueProtrusionSwallow: YN;
  // Soft Palate
  softPalate: string; // Symmetrically / Asymmetrically
  softPalateDescribe: string;
  // Food Residue
  foodResidue: YN;
  foodResidueReasons: string[];
  // Compensatory Strategies
  compensatoryStrategies: string[];
  compensatoryPositionalDesc: string;
  compensatoryTextureDesc: string;
  // Overall Quality
  overallQuality: string; // WFL / Impaired-Poor / Fair
  // Swallow
  swallowCoordinated: YN;
  swallowDescribe: string;
  // Aspiration Signs
  aspirationThinLiquids: YN;
  aspirationThickenedLiquids: YN;
  aspirationThickenedLevel: string;
  aspirationSolids: YN;
  aspirationSolidsType: string;
  aspirationSigns: Record<string, YN>;
  // Refusal
  refusalBehaviors: YN;
  refusalParentResponse: string;
  // Self-feeding
  selfFeeding: YN;
  selfFeedingDesc: string;
}

const DEFAULT_DATA: FeedingChecklistData = {
  oralSeeking: '', extraOralSensitivity: '', intraOralSensitivity: '',
  foodsDuringAssessment: '',
  jawStrength: '', jawCupDrinking: '', jawBitingThrough: '', jawChewingEndurance: '', jawChewingEnduranceRating: '',
  jawWideExcursions: '', jawLossOfFood: '', jawChewingPattern: '', jawClosedAtRest: '', jawAnticipatoryOpening: '',
  lipsStrength: '', lipsDrinking: '', lipsDrinkingDetail: '', lipsChewing: '', lipsEndurance: '', lipsEnduranceRating: '',
  lipsDrooling: '', lipsLossOfFood: '',
  tongueStrength: '', tongueDrinking: '', tongueChewingLat: '', tongueChewingKeep: '',
  tongueChewingEndurance: '', tongueChewingEnduranceRating: '',
  tongueLossSeal: '', tongueLossFood: '', tongueLateralizesTo: '', tonguePrefers: '',
  tongueTransfersMidline: '', tongueTipElevation: '', tongueCleanLips: '', tongueProtrusionSwallow: '',
  softPalate: '', softPalateDescribe: '',
  foodResidue: '', foodResidueReasons: [],
  compensatoryStrategies: [], compensatoryPositionalDesc: '', compensatoryTextureDesc: '',
  overallQuality: '',
  swallowCoordinated: '', swallowDescribe: '',
  aspirationThinLiquids: '', aspirationThickenedLiquids: '', aspirationThickenedLevel: '',
  aspirationSolids: '', aspirationSolidsType: '',
  aspirationSigns: {},
  refusalBehaviors: '', refusalParentResponse: '',
  selfFeeding: '', selfFeedingDesc: '',
};

const ASPIRATION_SIGN_LABELS = [
  'Stridor', 'Clunk w/ swallow', 'Delayed swallow trigger', 'Compensatory head movements',
  'Congestion w/ swallow', 'Coughing', 'Gagging', 'Color changes',
  'NP reflux', 'Tachypnea', 'Facial grimace', 'Reports or signs of pain',
  'Multiple swallows needed', 'Brady OR Desat',
];

const FOOD_RESIDUE_REASONS = [
  'Reduced tongue lateralization for bolus formation',
  'Reduced lip seal for intra-oral pressure',
  'Reduced oral sensory awareness',
];

const COMPENSATORY_OPTIONS = [
  'Liquid wash', 'Pacing', 'Decrease vessel size', 'Decrease bolus size',
  'Increase sensory properties (flavor)', 'Increase sensory properties (temp)',
  'Increase sensory properties (carbonated)', 'Increase sensory properties (texture)',
  'Unilateral presentation',
];

// ============================================================
// Sub-components
// ============================================================

function RadioGroup({ label, options, value, onChange, inline = true }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; inline?: boolean;
}) {
  return (
    <div className={`${inline ? 'flex items-center gap-3 flex-wrap' : 'space-y-1'}`}>
      <span className="text-xs font-semibold text-slate-600 min-w-[140px]">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer group">
            <input
              type="radio"
              name={`${label}-${options.join('-')}`}
              checked={value === opt}
              onChange={() => onChange(value === opt ? '' : opt)}
              className="w-3.5 h-3.5 accent-teal-600"
            />
            <span className="text-xs text-slate-700 group-hover:text-teal-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function YNRadio({ label, value, onChange }: { label: string; value: YN; onChange: (v: YN) => void }) {
  return (
    <RadioGroup label={label} options={['Y', 'N']} value={value} onChange={(v) => onChange(v as YN)} />
  );
}

function CheckboxGroup({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer group">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="w-3.5 h-3.5 accent-teal-600" />
            <span className="text-xs text-slate-700 group-hover:text-teal-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

// ============================================================
// Narrative Generator
// ============================================================

function generateNarrative(data: FeedingChecklistData, childName: string): string {
  const parts: string[] = [];
  const name = childName || 'The child';

  // Feeding Performance intro
  if (data.foodsDuringAssessment) {
    parts.push(`During the feeding evaluation, ${name} was provided with ${data.foodsDuringAssessment}.`);
  }

  // Jaw
  const jawParts: string[] = [];
  if (data.jawStrength) jawParts.push(`Jaw strength was ${data.jawStrength === 'WFL' ? 'within functional limits' : 'impaired'}.`);
  if (data.jawCupDrinking) jawParts.push(`Cup drinking demonstrated ${data.jawCupDrinking.toLowerCase()} stability on cup/bottle.`);
  if (data.jawBitingThrough) jawParts.push(`Ability to bite through food was ${data.jawBitingThrough.toLowerCase()}.`);
  if (data.jawChewingEndurance) {
    const endDesc = data.jawChewingEndurance === 'WFL' ? 'within functional limits' : `impaired (${data.jawChewingEnduranceRating || 'not rated'})`;
    jawParts.push(`Chewing endurance was ${endDesc}.`);
  }
  if (data.jawChewingPattern) jawParts.push(`Predominant chewing pattern observed was ${data.jawChewingPattern.toLowerCase()}.`);
  if (data.jawWideExcursions === 'Y') jawParts.push(`Wide jaw excursions were observed.`);
  if (data.jawLossOfFood === 'Y') jawParts.push(`Loss of food while chewing was noted.`);
  if (data.jawClosedAtRest === 'N') jawParts.push(`Jaw was not closed at rest.`);
  if (data.jawAnticipatoryOpening === 'Y') jawParts.push(`Anticipatory mouth opening to food approach was present.`);
  if (data.jawAnticipatoryOpening === 'N') jawParts.push(`Anticipatory mouth opening to food approach was not observed.`);
  if (jawParts.length > 0) parts.push(jawParts.join(' '));

  // Lips
  const lipParts: string[] = [];
  if (data.lipsStrength) lipParts.push(`Lip strength was ${data.lipsStrength === 'WFL' ? 'within functional limits' : 'impaired'}.`);
  if (data.lipsDrinking) {
    const detail = data.lipsDrinkingDetail ? ` on ${data.lipsDrinkingDetail}` : '';
    lipParts.push(`Lip seal during drinking was ${data.lipsDrinking.toLowerCase()}${detail}.`);
  }
  if (data.lipsChewing) lipParts.push(`Lip closure while chewing was ${data.lipsChewing.toLowerCase()}.`);
  if (data.lipsEndurance) {
    const endDesc = data.lipsEndurance === 'WFL' ? 'within functional limits' : `impaired (${data.lipsEnduranceRating || 'not rated'})`;
    lipParts.push(`Lip seal endurance was ${endDesc}.`);
  }
  if (data.lipsDrooling === 'Y') lipParts.push(`Drooling was observed.`);
  if (data.lipsLossOfFood === 'Y') lipParts.push(`Loss of liquid/food was noted.`);
  if (lipParts.length > 0) parts.push(lipParts.join(' '));

  // Tongue
  const tongueParts: string[] = [];
  if (data.tongueStrength) tongueParts.push(`Tongue strength was ${data.tongueStrength === 'WFL' ? 'within functional limits' : 'impaired'}.`);
  if (data.tongueDrinking) tongueParts.push(`Tongue cupping during drinking was ${data.tongueDrinking.toLowerCase()}.`);
  if (data.tongueChewingLat) tongueParts.push(`Lateralization of food to molar ridge was ${data.tongueChewingLat.toLowerCase()}.`);
  if (data.tongueChewingKeep) tongueParts.push(`Ability to keep food on molar ridge was ${data.tongueChewingKeep.toLowerCase()}.`);
  if (data.tongueChewingEndurance) {
    const endDesc = data.tongueChewingEndurance === 'WFL' ? 'within functional limits' : `impaired (${data.tongueChewingEnduranceRating || 'not rated'})`;
    tongueParts.push(`Tongue chewing endurance was ${endDesc}.`);
  }
  if (data.tongueLateralizesTo) tongueParts.push(`Tongue lateralizes to the ${data.tongueLateralizesTo.toLowerCase()}.`);
  if (data.tongueTransfersMidline === 'Y') tongueParts.push(`Transfers food across midline.`);
  if (data.tongueTransfersMidline === 'N') tongueParts.push(`Does not transfer food across midline.`);
  if (data.tongueTipElevation) tongueParts.push(`Tongue tip elevation was ${data.tongueTipElevation.toLowerCase()}.`);
  if (data.tongueCleanLips === 'Y') tongueParts.push(`${name} cleans lips with tongue.`);
  if (data.tongueCleanLips === 'N') tongueParts.push(`${name} does not clean lips with tongue.`);
  if (data.tongueProtrusionSwallow === 'Y') tongueParts.push(`Tongue protrusion with swallow was observed.`);
  if (tongueParts.length > 0) parts.push(tongueParts.join(' '));

  // Soft Palate
  if (data.softPalate) {
    let sp = `Soft palate elevates ${data.softPalate.toLowerCase()}.`;
    if (data.softPalateDescribe) sp += ` ${data.softPalateDescribe}`;
    parts.push(sp);
  }

  // Oral Sensory
  const sensoryParts: string[] = [];
  if (data.oralSeeking === 'Y') sensoryParts.push(`Oral seeking behavior was observed/reported.`);
  if (data.extraOralSensitivity) sensoryParts.push(`Extra-oral sensitivity was ${data.extraOralSensitivity.toLowerCase()}.`);
  if (data.intraOralSensitivity) sensoryParts.push(`Intra-oral sensitivity was ${data.intraOralSensitivity.toLowerCase()}.`);
  if (sensoryParts.length > 0) parts.push(sensoryParts.join(' '));

  // Food Residue
  if (data.foodResidue === 'Y') {
    let fr = `Food residue was observed in the face/mouth area`;
    if (data.foodResidueReasons.length > 0) fr += `, suspected related to ${data.foodResidueReasons.map(r => r.toLowerCase()).join(', ')}`;
    fr += '.';
    parts.push(fr);
  }

  // Overall Quality
  if (data.overallQuality) {
    parts.push(`Overall quality of oral motor skills during the meal was ${data.overallQuality === 'WFL' ? 'within functional limits' : data.overallQuality.toLowerCase()}.`);
  }

  // Swallow
  if (data.swallowCoordinated === 'Y') {
    parts.push(`Swallow was coordinated and efficient.`);
  } else if (data.swallowCoordinated === 'N') {
    let sw = `Swallow was not fully coordinated`;
    if (data.swallowDescribe) sw += `: ${data.swallowDescribe}`;
    sw += '.';
    parts.push(sw);
  }

  // Aspiration Signs
  const positiveAsp = ASPIRATION_SIGN_LABELS.filter(s => data.aspirationSigns[s] === 'Y');
  if (positiveAsp.length > 0) {
    parts.push(`Aspiration signs observed: ${positiveAsp.map(s => s.toLowerCase()).join(', ')}.`);
  } else if (Object.values(data.aspirationSigns).some(v => v === 'N')) {
    parts.push(`No aspiration signs were observed during the evaluation.`);
  }

  // Compensatory Strategies
  if (data.compensatoryStrategies.length > 0) {
    let cs = `Compensatory strategies tried: ${data.compensatoryStrategies.map(s => s.toLowerCase()).join(', ')}`;
    if (data.compensatoryPositionalDesc) cs += `. Positional changes: ${data.compensatoryPositionalDesc}`;
    if (data.compensatoryTextureDesc) cs += `. Texture modification: ${data.compensatoryTextureDesc}`;
    cs += '.';
    parts.push(cs);
  }

  // Refusal
  if (data.refusalBehaviors === 'Y') {
    let ref = `Refusal behaviors were observed`;
    if (data.refusalParentResponse) ref += `. Parent response: ${data.refusalParentResponse}`;
    ref += '.';
    parts.push(ref);
  }

  // Self-feeding
  if (data.selfFeeding === 'Y') {
    let sf = `${name} is self-feeding`;
    if (data.selfFeedingDesc) sf += `. ${data.selfFeedingDesc}`;
    sf += '.';
    parts.push(sf);
  } else if (data.selfFeeding === 'N') {
    parts.push(`${name} is not yet self-feeding.`);
  }

  return parts.join('\n\n');
}

// ============================================================
// Main Component
// ============================================================

interface FeedingPerformanceChecklistProps {
  childName: string;
  onInsertNarrative: (narrative: string) => void;
  storageKey: string;
}

export function FeedingPerformanceChecklist({ childName, onInsertNarrative, storageKey }: FeedingPerformanceChecklistProps) {
  const STORAGE_KEY = `feeding-checklist-${storageKey}`;
  const [data, setData] = useState<FeedingChecklistData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_DATA, ...JSON.parse(saved) } : { ...DEFAULT_DATA };
    } catch { return { ...DEFAULT_DATA }; }
  });
  const [expanded, setExpanded] = useState(false);

  // Auto-save
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* full */ }
  }, [data, STORAGE_KEY]);

  const update = useCallback(<K extends keyof FeedingChecklistData>(key: K, value: FeedingChecklistData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerateNarrative = useCallback(() => {
    const narrative = generateNarrative(data, childName);
    if (!narrative.trim()) {
      return;
    }
    onInsertNarrative(narrative);
  }, [data, childName, onInsertNarrative]);

  const handleReset = useCallback(() => {
    setData({ ...DEFAULT_DATA });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
  }, [STORAGE_KEY]);

  return (
    <div className="mb-4 print:hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg hover:from-teal-100 hover:to-emerald-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
            Feeding Evaluation Guide
          </span>
          <span className="text-[10px] text-teal-600 font-normal">(Feeders & Growers Tool)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-teal-600" />}
      </button>

      {expanded && (
        <div className="mt-2 border border-teal-200 rounded-lg p-4 bg-white space-y-3">
          <p className="text-[11px] text-slate-500 italic">
            Use this guided checklist during the in-person assessment. Selections auto-save. Click "Generate Narrative" to create report text from your selections.
          </p>

          {/* Feeding Performance Intro */}
          <SubSection title="Feeding Performance">
            <div>
              <label className="text-xs font-semibold text-slate-600">What did child eat/drink during assessment:</label>
              <input
                type="text"
                value={data.foodsDuringAssessment}
                onChange={e => update('foodsDuringAssessment', e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="e.g., purees, crackers, water from sippy cup..."
              />
            </div>
          </SubSection>

          {/* Oral Sensory */}
          <SubSection title="Oral Sensory Performance">
            <YNRadio label="Oral seeking behavior observed/reported?" value={data.oralSeeking} onChange={v => update('oralSeeking', v)} />
            <RadioGroup label="Extra-oral sensitivity:" options={['Hyper-responsive', 'Hypo-responsive']} value={data.extraOralSensitivity} onChange={v => update('extraOralSensitivity', v as Sensitivity)} />
            <RadioGroup label="Intra-oral sensitivity:" options={['Hyper-responsive', 'Hypo-responsive']} value={data.intraOralSensitivity} onChange={v => update('intraOralSensitivity', v as Sensitivity)} />
          </SubSection>

          {/* JAW */}
          <SubSection title="Jaw">
            <div className="space-y-2">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Strength</span>
                <RadioGroup label="" options={['WFL', 'Impaired']} value={data.jawStrength} onChange={v => update('jawStrength', v as Strength)} />
              </div>
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Function</span>
                <div className="space-y-1.5 mt-1">
                  <RadioGroup label="Cup drinking:" options={['Poor', 'Fair', 'Good']} value={data.jawCupDrinking} onChange={v => update('jawCupDrinking', v as Rating)} />
                  <RadioGroup label="Biting through food:" options={['Poor', 'Fair', 'Good']} value={data.jawBitingThrough} onChange={v => update('jawBitingThrough', v as Rating)} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <RadioGroup label="Chewing endurance:" options={['WFL', 'Impaired']} value={data.jawChewingEndurance} onChange={v => update('jawChewingEndurance', v as WFLImpaired)} />
                    {data.jawChewingEndurance === 'Impaired' && (
                      <RadioGroup label="" options={['Poor', 'Fair']} value={data.jawChewingEnduranceRating} onChange={v => update('jawChewingEnduranceRating', v as Rating)} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase">Observations</span>
                <div className="space-y-1.5 mt-1">
                  <YNRadio label="Wide jaw excursions?" value={data.jawWideExcursions} onChange={v => update('jawWideExcursions', v)} />
                  <YNRadio label="Loss of food while chewing?" value={data.jawLossOfFood} onChange={v => update('jawLossOfFood', v)} />
                  <RadioGroup label="Chewing pattern:" options={['Munching', 'Diagonal', 'Emerging Rotary', 'Mature Rotary']} value={data.jawChewingPattern} onChange={v => update('jawChewingPattern', v)} />
                  <YNRadio label="Closed at rest?" value={data.jawClosedAtRest} onChange={v => update('jawClosedAtRest', v)} />
                  <YNRadio label="Anticipatory mouth opening?" value={data.jawAnticipatoryOpening} onChange={v => update('jawAnticipatoryOpening', v)} />
                </div>
              </div>
            </div>
          </SubSection>

          {/* LIPS */}
          <SubSection title="Lips">
            <div className="space-y-2">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Strength</span>
                <RadioGroup label="" options={['WFL', 'Impaired']} value={data.lipsStrength} onChange={v => update('lipsStrength', v as Strength)} />
              </div>
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Function</span>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <RadioGroup label="Drinking:" options={['Poor', 'Fair', 'Good']} value={data.lipsDrinking} onChange={v => update('lipsDrinking', v as Rating)} />
                    <input
                      type="text"
                      value={data.lipsDrinkingDetail}
                      onChange={e => update('lipsDrinkingDetail', e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      placeholder="seal on straw/cup/bottle/breast"
                    />
                  </div>
                  <RadioGroup label="Chewing:" options={['Poor', 'Fair', 'Good']} value={data.lipsChewing} onChange={v => update('lipsChewing', v as Rating)} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <RadioGroup label="Lip seal endurance:" options={['WFL', 'Impaired']} value={data.lipsEndurance} onChange={v => update('lipsEndurance', v as WFLImpaired)} />
                    {data.lipsEndurance === 'Impaired' && (
                      <RadioGroup label="" options={['Poor', 'Fair']} value={data.lipsEnduranceRating} onChange={v => update('lipsEnduranceRating', v as Rating)} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase">Observations</span>
                <div className="space-y-1.5 mt-1">
                  <YNRadio label="Drooling?" value={data.lipsDrooling} onChange={v => update('lipsDrooling', v)} />
                  <YNRadio label="Loss of liquid/food?" value={data.lipsLossOfFood} onChange={v => update('lipsLossOfFood', v)} />
                </div>
              </div>
            </div>
          </SubSection>

          {/* TONGUE */}
          <SubSection title="Tongue">
            <div className="space-y-2">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Strength</span>
                <RadioGroup label="" options={['WFL', 'Impaired']} value={data.tongueStrength} onChange={v => update('tongueStrength', v as Strength)} />
              </div>
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Function</span>
                <div className="space-y-1.5 mt-1">
                  <RadioGroup label="Drinking (cupping):" options={['Poor', 'Fair', 'Good']} value={data.tongueDrinking} onChange={v => update('tongueDrinking', v as Rating)} />
                  <RadioGroup label="Lateralizing to molar ridge:" options={['Poor', 'Fair', 'Good']} value={data.tongueChewingLat} onChange={v => update('tongueChewingLat', v as Rating)} />
                  <RadioGroup label="Keeping food on molar ridge:" options={['Poor', 'Fair', 'Good']} value={data.tongueChewingKeep} onChange={v => update('tongueChewingKeep', v as Rating)} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <RadioGroup label="Chewing endurance:" options={['WFL', 'Impaired']} value={data.tongueChewingEndurance} onChange={v => update('tongueChewingEndurance', v as WFLImpaired)} />
                    {data.tongueChewingEndurance === 'Impaired' && (
                      <RadioGroup label="" options={['Poor', 'Fair', 'Good']} value={data.tongueChewingEnduranceRating} onChange={v => update('tongueChewingEnduranceRating', v as Rating)} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase">Observations</span>
                <div className="space-y-1.5 mt-1">
                  <YNRadio label="Loss of seal on breast/bottle?" value={data.tongueLossSeal} onChange={v => update('tongueLossSeal', v)} />
                  <YNRadio label="Loss of food w/ chewing?" value={data.tongueLossFood} onChange={v => update('tongueLossFood', v)} />
                  <RadioGroup label="Lateralizes to:" options={['L', 'R', 'Both']} value={data.tongueLateralizesTo} onChange={v => update('tongueLateralizesTo', v)} />
                  <RadioGroup label="Prefers:" options={['L', 'R']} value={data.tonguePrefers} onChange={v => update('tonguePrefers', v)} />
                  <YNRadio label="Transfers across midline?" value={data.tongueTransfersMidline} onChange={v => update('tongueTransfersMidline', v)} />
                  <RadioGroup label="Tongue tip elevation:" options={['Poor', 'Fair', 'Good']} value={data.tongueTipElevation} onChange={v => update('tongueTipElevation', v as Rating)} />
                  <YNRadio label="Cleans lips with tongue?" value={data.tongueCleanLips} onChange={v => update('tongueCleanLips', v)} />
                  <YNRadio label="Tongue protrusion with swallow?" value={data.tongueProtrusionSwallow} onChange={v => update('tongueProtrusionSwallow', v)} />
                </div>
              </div>
            </div>
          </SubSection>

          {/* Soft Palate */}
          <SubSection title="Soft Palate Movement">
            <RadioGroup label="Elevation:" options={['Symmetrically', 'Asymmetrically']} value={data.softPalate} onChange={v => update('softPalate', v)} />
            <div>
              <label className="text-xs font-semibold text-slate-600">Describe:</label>
              <input type="text" value={data.softPalateDescribe} onChange={e => update('softPalateDescribe', e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Additional observations..." />
            </div>
          </SubSection>

          {/* Food Residue */}
          <SubSection title="Food Residue & Compensatory Strategies">
            <YNRadio label="Food residue (face or mouth)?" value={data.foodResidue} onChange={v => update('foodResidue', v)} />
            {data.foodResidue === 'Y' && (
              <CheckboxGroup label="Suspected related to:" options={FOOD_RESIDUE_REASONS} selected={data.foodResidueReasons} onChange={v => update('foodResidueReasons', v)} />
            )}
            <CheckboxGroup label="Compensatory strategies tried:" options={COMPENSATORY_OPTIONS} selected={data.compensatoryStrategies} onChange={v => update('compensatoryStrategies', v)} />
            {data.compensatoryStrategies.length > 0 && (
              <div className="space-y-1.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Positional changes:</label>
                  <input type="text" value={data.compensatoryPositionalDesc} onChange={e => update('compensatoryPositionalDesc', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Describe positional changes..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Texture modification:</label>
                  <input type="text" value={data.compensatoryTextureDesc} onChange={e => update('compensatoryTextureDesc', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Describe texture modifications..." />
                </div>
              </div>
            )}
          </SubSection>

          {/* Overall Quality & Swallow */}
          <SubSection title="Overall Quality & Swallow">
            <RadioGroup label="Overall quality of oral motor skills:" options={['WFL', 'Impaired - Poor', 'Fair']} value={data.overallQuality} onChange={v => update('overallQuality', v)} />
            <YNRadio label="Coordinated and efficient swallow?" value={data.swallowCoordinated} onChange={v => update('swallowCoordinated', v)} />
            {data.swallowCoordinated === 'N' && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Describe:</label>
                <input type="text" value={data.swallowDescribe} onChange={e => update('swallowDescribe', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Describe swallow difficulties..." />
              </div>
            )}
          </SubSection>

          {/* Aspiration Signs */}
          <SubSection title="Aspiration Signs" defaultOpen={false}>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <YNRadio label="Thin Liquids:" value={data.aspirationThinLiquids} onChange={v => update('aspirationThinLiquids', v)} />
                <div className="flex items-center gap-3 flex-wrap">
                  <YNRadio label="Thickened Liquids:" value={data.aspirationThickenedLiquids} onChange={v => update('aspirationThickenedLiquids', v)} />
                  {data.aspirationThickenedLiquids === 'Y' && (
                    <RadioGroup label="" options={['Slightly', 'Mildly', 'Moderately', 'Extremely']} value={data.aspirationThickenedLevel} onChange={v => update('aspirationThickenedLevel', v)} />
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <YNRadio label="Solids:" value={data.aspirationSolids} onChange={v => update('aspirationSolids', v)} />
                  {data.aspirationSolids === 'Y' && (
                    <RadioGroup label="" options={['Liquidized', 'Puree', 'Minced & moist', 'Soft & bite sized', 'Regular']} value={data.aspirationSolidsType} onChange={v => update('aspirationSolidsType', v)} />
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <span className="text-xs font-semibold text-slate-600 mb-1 block">Signs (check Y or N for each):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ASPIRATION_SIGN_LABELS.map(sign => (
                    <YNRadio key={sign} label={sign} value={(data.aspirationSigns[sign] || '') as YN}
                      onChange={v => update('aspirationSigns', { ...data.aspirationSigns, [sign]: v })} />
                  ))}
                </div>
              </div>
            </div>
          </SubSection>

          {/* Refusal & Self-Feeding */}
          <SubSection title="Refusal Behaviors & Self-Feeding" defaultOpen={false}>
            <YNRadio label="Refusal behaviors?" value={data.refusalBehaviors} onChange={v => update('refusalBehaviors', v)} />
            {data.refusalBehaviors === 'Y' && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Parent response:</label>
                <input type="text" value={data.refusalParentResponse} onChange={e => update('refusalParentResponse', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Describe parent response..." />
              </div>
            )}
            <YNRadio label="Self-feeding?" value={data.selfFeeding} onChange={v => update('selfFeeding', v)} />
            {data.selfFeeding === 'Y' && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Utensils used and quality:</label>
                <input type="text" value={data.selfFeedingDesc} onChange={e => update('selfFeedingDesc', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="Describe utensils and quality of self-feeding..." />
              </div>
            )}
          </SubSection>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <Button
              onClick={handleGenerateNarrative}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Generate Narrative
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </Button>
            <span className="text-[10px] text-slate-400 ml-auto">Selections auto-save to browser</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { generateNarrative, DEFAULT_DATA };
export type { FeedingChecklistData as FeedingChecklistDataType };
