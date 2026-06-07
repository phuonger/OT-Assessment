/**
 * OT Feeding Assessment Form Data
 * 
 * Scoring items are duplicated from DAYC-2 Adaptive Behavior domain.
 * Additionally includes a "Discrete Oral Motor Skills" section with text-input questions
 * (not numerically scored) that feed into the report narrative.
 */

export interface OTFeedingItem {
  number: number;
  description: string;
}

export interface OTFeedingDomain {
  id: string;
  name: string;
  items: OTFeedingItem[];
  entryPoints: { label: string; startItem: number }[];
}

// ============================================================
// Adaptive Behavior Items (identical to DAYC-2 Adaptive)
// ============================================================

export const ADAPTIVE_BEHAVIOR_ITEMS: OTFeedingItem[] = [
  { number: 1, description: 'maintains body temperature without external assistance' },
  { number: 2, description: 'forms a tight seal around nipple when sucking' },
  { number: 3, description: 'swallows liquids with no difficulty' },
  { number: 4, description: 'coordinates sucking, swallowing, and breathing' },
  { number: 5, description: 'opens mouth in anticipation of feeding (sight of breast or bottle)' },
  { number: 6, description: 'enjoys bath; keeps eyes open and indicates pleasure when placed in warm water' },
  { number: 7, description: 'sleeps for 4- to 10-hour intervals' },
  { number: 8, description: 'closes lips when swallowing' },
  { number: 9, description: 'swallows pureed foods' },
  { number: 10, description: 'uses tongue to move food around in mouth' },
  { number: 11, description: 'shows definite likes and dislikes of various foods (e.g., may spit out or refuse to open lips for undesired foods, eagerly opens mouth for desired foods)' },
  { number: 12, description: 'sleeps through the night; may take two to three naps during the day' },
  { number: 13, description: 'holds or supports a bottle to feed self' },
  { number: 14, description: 'purposely pulls off own socks' },
  { number: 15, description: 'feeds self finger foods' },
  { number: 16, description: 'chews textured foods' },
  { number: 17, description: 'cooperates in dressing and undressing (e.g., helps put arms in holes)' },
  { number: 18, description: 'sleeps through the night; may take one nap during the day' },
  { number: 19, description: 'drinks from open cup or glass held by adult (not a sippy cup)' },
  { number: 20, description: 'sips liquid from glass or cup using a straw' },
  { number: 21, description: 'helps with simple household tasks (e.g., helps put things away)' },
  { number: 22, description: 'fusses when diaper needs to be changed' },
  { number: 23, description: 'tries to wash own hands and face' },
  { number: 24, description: 'removes loose clothing such as a jacket, shorts, or a shirt without assistance' },
  { number: 25, description: 'opens door by using handle or knob' },
  { number: 26, description: 'puts on simple clothing independently (e.g., hat, pants)' },
  { number: 27, description: 'independently eats entire meal with spoon' },
  { number: 28, description: 'wipes own nose; may need to be reminded' },
  { number: 29, description: 'sits on toilet for at least 1 minute supervised' },
  { number: 30, description: 'squats, holds self, or verbalizes bowel and bladder needs most of the time' },
  { number: 31, description: 'washes and dries hands and face without assistance' },
  { number: 32, description: 'cleans up spills, getting own cloth' },
  { number: 33, description: 'shows care when handling an infant or small animal' },
  { number: 34, description: 'pours milk or juice with some assistance' },
  { number: 35, description: 'tells adult of toilet needs in time to get to toilet' },
  { number: 36, description: 'takes responsibility for toileting; may require assistance in wiping' },
  { number: 37, description: 'gets drink of water from tap unassisted (may need help getting cup from cupboard)' },
  { number: 38, description: 'brushes teeth independently' },
  { number: 39, description: 'recognizes own home' },
  { number: 40, description: 'manipulates large buttons or snaps' },
  { number: 41, description: 'covers mouth and nose when coughing and sneezing (hand, elbow, tissue, or handkerchief may be used)' },
  { number: 42, description: 'sleeps through the night without wetting' },
  { number: 43, description: 'hangs up clothes (hanger, hook, or other designated device)' },
  { number: 44, description: 'dresses self completely, except for tying shoelaces (includes underwear; clothes must be on correctly, including all fasteners)' },
  { number: 45, description: 'serves self at the table (adult may need to hold serving dish)' },
  { number: 46, description: 'often wants privacy in bathroom' },
  { number: 47, description: 'answers what-to-do-if questions (e.g., "What would you do if you cut your finger?")' },
  { number: 48, description: 'fastens seat belt in automobile independently' },
  { number: 49, description: 'crosses street safely (e.g., looks both ways, uses crosswalks)' },
  { number: 50, description: 'puts dirty dishes in sink or dishwasher' },
  { number: 51, description: 'requests food to be passed at the table' },
  { number: 52, description: 'selects clothing appropriate for temperature and occasion' },
  { number: 53, description: 'makes own bed; may need to be reminded' },
  { number: 54, description: 'sets and clears table without assistance' },
  { number: 55, description: 'uses table knife for spreading soft butter, jelly, or peanut butter' },
  { number: 56, description: 'plans ahead to meet toileting needs before beginning an activity' },
  { number: 57, description: 'takes shower or bath independently' },
  { number: 58, description: 'cleans counter or work surface with sponge or paper towels' },
  { number: 59, description: 'dusts furniture' },
  { number: 60, description: 'makes simple breakfast and lunch' },
  { number: 61, description: 'washes own hair' },
  { number: 62, description: 'takes care of minor cuts (cleans and applies bandage)' },
  { number: 63, description: 'rides a bicycle safely without training wheels' },
  { number: 64, description: 'cuts food (including meat) into bite-sized pieces' },
];

// ============================================================
// Discrete Oral Motor Skills Questions (text-input, not scored)
// ============================================================

export interface OralMotorQuestion {
  id: string;
  label: string;
  category: 'cheeks' | 'lips' | 'jaw' | 'tongue' | 'palate';
  optional?: boolean; // palate is optional (enabled via button)
}

export const ORAL_MOTOR_QUESTIONS: OralMotorQuestion[] = [
  // Cheeks
  { id: 'cheeks_lateral_sulci', label: 'Tends to keep food out of lateral sulci', category: 'cheeks' },
  // Lips
  { id: 'lips_seal_chewing', label: 'Seal for chewing', category: 'lips' },
  { id: 'lips_seal_cup_straw', label: 'Seal for cup/straw drinking', category: 'lips' },
  { id: 'lips_seal_swallow', label: 'Seal during swallow', category: 'lips' },
  // Jaw
  { id: 'jaw_chewing_pattern', label: 'Chewing pattern', category: 'jaw' },
  { id: 'jaw_endurance', label: 'Endurance', category: 'jaw' },
  // Tongue
  { id: 'tongue_cleaning_lips', label: 'Cleaning lips', category: 'tongue' },
  { id: 'tongue_lat_chewing', label: 'Lateralization for chewing', category: 'tongue' },
  { id: 'tongue_lat_cleaning', label: 'Lateralization for cleaning mouth', category: 'tongue' },
  { id: 'tongue_cupping', label: 'Cupping for liquids', category: 'tongue' },
  { id: 'tongue_bottle_seal', label: 'Seal around bottle nipple', category: 'tongue' },
  { id: 'tongue_bolus', label: 'Bolus formation', category: 'tongue' },
  { id: 'tongue_posterior', label: 'Posterior bolus movement', category: 'tongue' },
  // Palate (optional)
  { id: 'palate_closure', label: 'Closure of nasopharynx during speech and swallow', category: 'palate', optional: true },
];

export const ORAL_MOTOR_CATEGORIES = [
  { id: 'cheeks', label: 'Cheeks' },
  { id: 'lips', label: 'Lips' },
  { id: 'jaw', label: 'Jaw' },
  { id: 'tongue', label: 'Tongue' },
  { id: 'palate', label: 'Palate' },
] as const;

// ============================================================
// Domain definition (for form registry)
// ============================================================

export const OT_FEEDING_DOMAINS: OTFeedingDomain[] = [
  {
    id: 'adaptivebehavior',
    name: 'Adaptive Behavior',
    items: ADAPTIVE_BEHAVIOR_ITEMS,
    entryPoints: [
      { label: 'Birth-11 months', startItem: 1 },
      { label: '12-23 months', startItem: 16 },
      { label: '24-35 months', startItem: 23 },
      { label: '36-47 months', startItem: 38 },
      { label: '48-59 months', startItem: 46 },
      { label: '60+ months', startItem: 51 },
    ],
  },
];

export const OT_FEEDING_AGE_RANGES = [
  { label: 'Birth-11 months', minMonths: 0, maxMonths: 11 },
  { label: '12-23 months', minMonths: 12, maxMonths: 23 },
  { label: '24-35 months', minMonths: 24, maxMonths: 35 },
  { label: '36-47 months', minMonths: 36, maxMonths: 47 },
  { label: '48-59 months', minMonths: 48, maxMonths: 59 },
  { label: '60+ months', minMonths: 60, maxMonths: 999 },
];

export function getOtFeedingStartItem(domainId: string, ageLabel: string): number {
  const domain = OT_FEEDING_DOMAINS.find(d => d.id === domainId);
  if (!domain) return 1;
  const ep = domain.entryPoints.find(e => e.label === ageLabel);
  return ep ? ep.startItem : 1;
}
