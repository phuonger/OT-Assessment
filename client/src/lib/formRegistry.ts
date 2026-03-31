/**
 * Unified Form Registry
 * Abstracts all assessment form types (Bayley-4, DAYC-2, DAYC-2 Spanish, REEL-3, Sensory Profile 2)
 * into a common interface so the app can handle any form type generically.
 */

import { ALL_DOMAINS as BAYLEY_DOMAINS, AGE_RANGES as BAYLEY_AGE_RANGES, getStartItem as getBayleyStartItem } from './assessmentData';
import { DAYC2_DOMAINS, DAYC2_AGE_RANGES, getDayc2StartItem } from './dayc2Data';
import { DAYC2_SPANISH_DOMAINS as DAYC2_SP_DOMAINS, DAYC2_SPANISH_AGE_RANGES as DAYC2_SP_AGE_RANGES, getDayc2SpanishStartItem as getDayc2SpStartItem } from './dayc2SpanishData';
import { REEL3_DOMAINS, REEL3_AGE_RANGES, getReel3StartItem } from './reel3Data';
import { SP2_SECTIONS } from './sensoryProfileData';

// ============================================================
// Common types
// ============================================================

export type ScoringType = 'bayley' | 'binary' | 'yesno' | 'likert5';

export interface UnifiedItem {
  number: number;
  description: string;
  materials?: string;
  caregiverQuestion?: string;
  scoringCriteria?: { score: number; label: string; description: string }[];
  sectionId?: string; // for Sensory Profile grouping
}

export interface UnifiedDomain {
  id: string;           // globally unique: formType_domainId  e.g. "bayley4_cognitive"
  localId: string;      // form-local id e.g. "cognitive"
  name: string;
  formType: string;
  items: UnifiedItem[];
  scoringType: ScoringType;
  maxScorePerItem: number;
  administration?: string;
}

export interface FormAgeRange {
  label: string;
  startPoint?: string;  // letter for Bayley, unused for others
}

export interface FormDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  ageRanges: FormAgeRange[];
  domains: UnifiedDomain[];
  getStartItem: (domainLocalId: string, ageLabel: string) => number;
  hasStartPoints: boolean;
  discontinueRule?: { consecutiveZeros: number };
  basalRule?: { consecutiveMax: number };
}

// ============================================================
// Bayley-4
// ============================================================

function buildBayleyDomains(): UnifiedDomain[] {
  return BAYLEY_DOMAINS.map(d => ({
    id: `bayley4_${d.id}`,
    localId: d.id,
    name: d.name,
    formType: 'bayley4',
    items: d.items.map(item => ({
      number: item.number,
      description: item.description,
      materials: item.material,
      caregiverQuestion: item.caregiverQuestion,
      scoringCriteria: item.criteria?.map((c: any) => ({ score: c.score, label: c.label || '', description: c.description })),
    })),
    scoringType: 'bayley' as ScoringType,
    maxScorePerItem: 2,
    administration: d.administration,
  }));
}

const bayley4Form: FormDefinition = {
  id: 'bayley4',
  name: 'Bayley Scales of Infant and Toddler Development, 4th Edition',
  shortName: 'Bayley-4',
  description: 'Cognitive, Language, and Motor assessment for ages 16 days to 42 months.',
  color: '#0D7377',
  ageRanges: BAYLEY_AGE_RANGES.map(ar => ({ label: ar.label, startPoint: ar.startPoint })),
  domains: buildBayleyDomains(),
  getStartItem: (domainLocalId: string, ageLabel: string) => {
    const domain = BAYLEY_DOMAINS.find(d => d.id === domainLocalId);
    if (!domain) return 1;
    const ageRange = BAYLEY_AGE_RANGES.find(ar => ar.label === ageLabel);
    if (!ageRange) return 1;
    return getBayleyStartItem(domain, ageRange.startPoint);
  },
  hasStartPoints: true,
  discontinueRule: { consecutiveZeros: 5 },
};

// ============================================================
// DAYC-2 English
// ============================================================

function buildDayc2Domains(): UnifiedDomain[] {
  return DAYC2_DOMAINS.map(d => ({
    id: `dayc2_${d.id}`,
    localId: d.id,
    name: d.name,
    formType: 'dayc2',
    items: d.items.map(item => ({
      number: item.number,
      description: item.description,
    })),
    scoringType: 'binary' as ScoringType,
    maxScorePerItem: 1,
  }));
}

const dayc2Form: FormDefinition = {
  id: 'dayc2',
  name: 'Developmental Assessment of Young Children, 2nd Edition',
  shortName: 'DAYC-2',
  description: 'Social-Emotional, Adaptive Behavior, Receptive and Expressive Communication for ages birth to 5 years 11 months.',
  color: '#6D28D9',
  ageRanges: DAYC2_AGE_RANGES.map(ar => ({ label: ar.label })),
  domains: buildDayc2Domains(),
  getStartItem: getDayc2StartItem,
  hasStartPoints: true,
  discontinueRule: { consecutiveZeros: 5 },
  basalRule: { consecutiveMax: 5 },
};

// ============================================================
// DAYC-2 Spanish
// ============================================================

function buildDayc2SpDomains(): UnifiedDomain[] {
  return DAYC2_SP_DOMAINS.map((d: any) => ({
    id: `dayc2sp_${d.id}`,
    localId: d.id,
    name: d.name,
    formType: 'dayc2sp',
    items: d.items.map((item: any) => ({
      number: item.number,
      description: item.description,
    })),
    scoringType: 'binary' as ScoringType,
    maxScorePerItem: 1,
  }));
}

const dayc2SpForm: FormDefinition = {
  id: 'dayc2sp',
  name: 'Evaluación del Desarrollo de Niños Pequeños, 2da Edición (Español)',
  shortName: 'DAYC-2 Spanish',
  description: 'Social-Emocional, Comportamiento Adaptativo, Comunicación Receptiva y Expresiva para edades de nacimiento a 5 años 11 meses.',
  color: '#B45309',
  ageRanges: DAYC2_SP_AGE_RANGES.map((ar: any) => ({ label: ar.label || ar })),
  domains: buildDayc2SpDomains(),
  getStartItem: getDayc2SpStartItem,
  hasStartPoints: true,
  discontinueRule: { consecutiveZeros: 5 },
  basalRule: { consecutiveMax: 5 },
};

// ============================================================
// REEL-3
// ============================================================

function buildReel3Domains(): UnifiedDomain[] {
  return REEL3_DOMAINS.map(d => ({
    id: `reel3_${d.id}`,
    localId: d.id,
    name: d.name,
    formType: 'reel3',
    items: d.items.map(item => ({
      number: item.number,
      description: item.description,
    })),
    scoringType: 'yesno' as ScoringType,
    maxScorePerItem: 1,
  }));
}

const reel3Form: FormDefinition = {
  id: 'reel3',
  name: 'Receptive-Expressive Emergent Language Test, 3rd Edition',
  shortName: 'REEL-3',
  description: 'Receptive and Expressive language assessment for ages birth to 36 months.',
  color: '#0369A1',
  ageRanges: REEL3_AGE_RANGES.map(ar => ({ label: ar.label })),
  domains: buildReel3Domains(),
  getStartItem: getReel3StartItem,
  hasStartPoints: true,
  discontinueRule: { consecutiveZeros: 5 },
  basalRule: { consecutiveMax: 5 },
};

// ============================================================
// Sensory Profile 2
// ============================================================

function buildSP2Domains(): UnifiedDomain[] {
  return SP2_SECTIONS.map(section => ({
    id: `sp2_${section.id}`,
    localId: section.id,
    name: section.name,
    formType: 'sp2',
    items: section.items.map(item => ({
      number: item.number,
      description: item.description,
      sectionId: section.id,
    })),
    scoringType: 'likert5' as ScoringType,
    maxScorePerItem: 5,
  }));
}

const sp2Form: FormDefinition = {
  id: 'sp2',
  name: 'Sensory Profile 2',
  shortName: 'Sensory Profile 2',
  description: 'Caregiver questionnaire measuring sensory processing patterns. Versions for Birth-6 months, 7+ months English, and 7+ months Spanish.',
  color: '#DC2626',
  ageRanges: [
    { label: 'Birth to 6 months' },
    { label: '7+ months (English)' },
    { label: '7+ months (Spanish)' },
  ],
  domains: buildSP2Domains(),
  getStartItem: () => 1, // SP2 always starts at item 1
  hasStartPoints: false,
};

// ============================================================
// Registry
// ============================================================

export const FORM_REGISTRY: FormDefinition[] = [
  bayley4Form,
  dayc2Form,
  dayc2SpForm,
  reel3Form,
  sp2Form,
];

export function getFormById(id: string): FormDefinition | undefined {
  return FORM_REGISTRY.find(f => f.id === id);
}

export function getFormDomain(formId: string, domainLocalId: string): UnifiedDomain | undefined {
  const form = getFormById(formId);
  if (!form) return undefined;
  return form.domains.find(d => d.localId === domainLocalId);
}

/**
 * Get the scoring labels for a given scoring type.
 */
export function getScoringLabels(scoringType: ScoringType): { value: number; label: string; color: string }[] {
  switch (scoringType) {
    case 'bayley':
      return [
        { value: 0, label: 'Not Present', color: '#DC2626' },
        { value: 1, label: 'Emerging', color: '#D97706' },
        { value: 2, label: 'Mastery', color: '#059669' },
      ];
    case 'binary':
      return [
        { value: 0, label: 'No / Not Yet', color: '#DC2626' },
        { value: 1, label: 'Yes', color: '#059669' },
      ];
    case 'yesno':
      return [
        { value: 0, label: 'No', color: '#DC2626' },
        { value: 1, label: 'Yes', color: '#059669' },
      ];
    case 'likert5':
      return [
        { value: 0, label: 'N/A', color: '#9CA3AF' },
        { value: 1, label: 'Almost Never', color: '#DC2626' },
        { value: 2, label: 'Seldom', color: '#EA580C' },
        { value: 3, label: 'Occasionally', color: '#D97706' },
        { value: 4, label: 'Frequently', color: '#65A30D' },
        { value: 5, label: 'Almost Always', color: '#059669' },
      ];
  }
}

/**
 * Calculate age range label for DAYC-2 based on age in months.
 */
export function calculateDayc2AgeRange(ageMonths: number): string {
  if (ageMonths < 12) return 'Birth-11 months';
  if (ageMonths < 24) return '12-23 months';
  if (ageMonths < 36) return '24-35 months';
  if (ageMonths < 48) return '36-47 months';
  if (ageMonths < 60) return '48-59 months';
  return '60+ months';
}

/**
 * Calculate age range label for REEL-3 based on age in months.
 */
export function calculateReel3AgeRange(ageMonths: number): string {
  if (ageMonths <= 6) return 'Birth-6 months';
  if (ageMonths <= 12) return '7-12 months';
  if (ageMonths <= 18) return '13-18 months';
  if (ageMonths <= 24) return '19-24 months';
  return '25-36 months';
}
