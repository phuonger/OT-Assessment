/**
 * Bayley-4 Appendix A2-A5: Adaptive Behavior & Social-Emotional Scoring Tables
 *
 * Table A.2: Social-Emotional Scale — Total Raw Score → Scaled Score (8 age groups)
 * Table A.3: Adaptive Behavior Scale — Per-subscale Raw Score → Scaled Score (33 age groups, 5 subscales)
 * Table A.4: Standard Score Norms for COG, LANG, MOT, SOEM composites
 * Table A.5: Standard Score Norms for Adaptive Behavior composite (COM, DLS, SOC, ADBE)
 *
 * Subscale abbreviations:
 *   REC = Receptive Communication (AB)
 *   EXP = Expressive Communication (AB)
 *   PER = Personal (AB)
 *   IPR = Interpersonal Relationships (AB)
 *   PLA = Play & Leisure (AB)
 *
 * Composite domains (Table A.5):
 *   COM = Communication (REC + EXP)
 *   DLS = Daily Living Skills (PER)
 *   SOC = Socialization (IPR + PLA)
 *   ADBE = Adaptive Behavior (sum of all 5 subscale scaled scores)
 */

// ============================================================
// Table A.2: Social-Emotional Scale
// ============================================================

export interface SEScaledScoreRange {
  scaledScore: number;
  minRaw: number;
  maxRaw: number;
}

export interface SEAgeGroup {
  ageLabel: string;
  minMonths: number;
  maxMonths: number;
  ranges: SEScaledScoreRange[];
}

export const SE_SCALED_SCORE_TABLES: SEAgeGroup[] = [
  {
    ageLabel: '0-3 months', minMonths: 0, maxMonths: 3,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 14 },
      { scaledScore: 2, minRaw: 15, maxRaw: 18 },
      { scaledScore: 3, minRaw: 19, maxRaw: 21 },
      { scaledScore: 4, minRaw: 22, maxRaw: 24 },
      { scaledScore: 5, minRaw: 25, maxRaw: 28 },
      { scaledScore: 6, minRaw: 29, maxRaw: 32 },
      { scaledScore: 7, minRaw: 33, maxRaw: 36 },
      { scaledScore: 8, minRaw: 37, maxRaw: 40 },
      { scaledScore: 9, minRaw: 41, maxRaw: 43 },
      { scaledScore: 10, minRaw: 44, maxRaw: 45 },
      { scaledScore: 11, minRaw: 46, maxRaw: 47 },
      { scaledScore: 12, minRaw: 48, maxRaw: 49 },
      { scaledScore: 13, minRaw: 50, maxRaw: 51 },
      { scaledScore: 14, minRaw: 52, maxRaw: 52 },
      { scaledScore: 15, minRaw: 53, maxRaw: 53 },
      { scaledScore: 16, minRaw: 54, maxRaw: 54 },
      { scaledScore: 17, minRaw: 55, maxRaw: 55 },
    ],
  },
  {
    ageLabel: '4-5 months', minMonths: 4, maxMonths: 5,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 27 },
      { scaledScore: 2, minRaw: 28, maxRaw: 31 },
      { scaledScore: 3, minRaw: 32, maxRaw: 34 },
      { scaledScore: 4, minRaw: 35, maxRaw: 39 },
      { scaledScore: 5, minRaw: 40, maxRaw: 43 },
      { scaledScore: 6, minRaw: 44, maxRaw: 46 },
      { scaledScore: 7, minRaw: 47, maxRaw: 50 },
      { scaledScore: 8, minRaw: 51, maxRaw: 53 },
      { scaledScore: 9, minRaw: 54, maxRaw: 55 },
      { scaledScore: 10, minRaw: 56, maxRaw: 58 },
      { scaledScore: 11, minRaw: 59, maxRaw: 60 },
      { scaledScore: 12, minRaw: 61, maxRaw: 62 },
      { scaledScore: 13, minRaw: 63, maxRaw: 63 },
      { scaledScore: 14, minRaw: 64, maxRaw: 64 },
      { scaledScore: 16, minRaw: 65, maxRaw: 65 },
    ],
  },
  {
    ageLabel: '6-9 months', minMonths: 6, maxMonths: 9,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 40 },
      { scaledScore: 2, minRaw: 41, maxRaw: 43 },
      { scaledScore: 3, minRaw: 44, maxRaw: 45 },
      { scaledScore: 4, minRaw: 46, maxRaw: 49 },
      { scaledScore: 5, minRaw: 50, maxRaw: 53 },
      { scaledScore: 6, minRaw: 54, maxRaw: 57 },
      { scaledScore: 7, minRaw: 58, maxRaw: 60 },
      { scaledScore: 8, minRaw: 61, maxRaw: 62 },
      { scaledScore: 9, minRaw: 63, maxRaw: 64 },
      { scaledScore: 10, minRaw: 65, maxRaw: 66 },
      { scaledScore: 11, minRaw: 67, maxRaw: 68 },
      { scaledScore: 12, minRaw: 69, maxRaw: 70 },
      { scaledScore: 13, minRaw: 71, maxRaw: 72 },
      { scaledScore: 14, minRaw: 73, maxRaw: 73 },
      { scaledScore: 16, minRaw: 74, maxRaw: 74 },
      { scaledScore: 18, minRaw: 75, maxRaw: 75 },
    ],
  },
  {
    ageLabel: '10-14 months', minMonths: 10, maxMonths: 14,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 49 },
      { scaledScore: 2, minRaw: 50, maxRaw: 53 },
      { scaledScore: 3, minRaw: 54, maxRaw: 57 },
      { scaledScore: 4, minRaw: 58, maxRaw: 61 },
      { scaledScore: 5, minRaw: 62, maxRaw: 64 },
      { scaledScore: 6, minRaw: 65, maxRaw: 66 },
      { scaledScore: 7, minRaw: 67, maxRaw: 68 },
      { scaledScore: 8, minRaw: 69, maxRaw: 70 },
      { scaledScore: 9, minRaw: 71, maxRaw: 72 },
      { scaledScore: 10, minRaw: 73, maxRaw: 75 },
      { scaledScore: 11, minRaw: 76, maxRaw: 77 },
      { scaledScore: 12, minRaw: 78, maxRaw: 79 },
      { scaledScore: 13, minRaw: 80, maxRaw: 80 },
      { scaledScore: 14, minRaw: 81, maxRaw: 81 },
      { scaledScore: 15, minRaw: 82, maxRaw: 82 },
      { scaledScore: 16, minRaw: 83, maxRaw: 83 },
      { scaledScore: 17, minRaw: 84, maxRaw: 84 },
      { scaledScore: 18, minRaw: 85, maxRaw: 85 },
    ],
  },
  {
    ageLabel: '15-18 months', minMonths: 15, maxMonths: 18,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 54 },
      { scaledScore: 2, minRaw: 55, maxRaw: 59 },
      { scaledScore: 3, minRaw: 60, maxRaw: 64 },
      { scaledScore: 4, minRaw: 65, maxRaw: 69 },
      { scaledScore: 5, minRaw: 70, maxRaw: 74 },
      { scaledScore: 6, minRaw: 75, maxRaw: 78 },
      { scaledScore: 7, minRaw: 79, maxRaw: 83 },
      { scaledScore: 8, minRaw: 84, maxRaw: 86 },
      { scaledScore: 9, minRaw: 87, maxRaw: 89 },
      { scaledScore: 10, minRaw: 90, maxRaw: 92 },
      { scaledScore: 11, minRaw: 93, maxRaw: 95 },
      { scaledScore: 12, minRaw: 96, maxRaw: 97 },
      { scaledScore: 13, minRaw: 98, maxRaw: 98 },
      { scaledScore: 14, minRaw: 99, maxRaw: 100 },
      { scaledScore: 15, minRaw: 101, maxRaw: 102 },
      { scaledScore: 16, minRaw: 103, maxRaw: 103 },
      { scaledScore: 17, minRaw: 104, maxRaw: 104 },
      { scaledScore: 19, minRaw: 105, maxRaw: 105 },
    ],
  },
  {
    ageLabel: '19-24 months', minMonths: 19, maxMonths: 24,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 60 },
      { scaledScore: 2, minRaw: 61, maxRaw: 67 },
      { scaledScore: 3, minRaw: 68, maxRaw: 74 },
      { scaledScore: 4, minRaw: 75, maxRaw: 82 },
      { scaledScore: 5, minRaw: 83, maxRaw: 89 },
      { scaledScore: 6, minRaw: 90, maxRaw: 95 },
      { scaledScore: 7, minRaw: 96, maxRaw: 99 },
      { scaledScore: 8, minRaw: 100, maxRaw: 102 },
      { scaledScore: 9, minRaw: 103, maxRaw: 106 },
      { scaledScore: 10, minRaw: 107, maxRaw: 110 },
      { scaledScore: 11, minRaw: 111, maxRaw: 113 },
      { scaledScore: 12, minRaw: 114, maxRaw: 115 },
      { scaledScore: 13, minRaw: 116, maxRaw: 117 },
      { scaledScore: 14, minRaw: 118, maxRaw: 118 },
      { scaledScore: 15, minRaw: 119, maxRaw: 119 },
      { scaledScore: 16, minRaw: 120, maxRaw: 120 },
    ],
  },
  {
    ageLabel: '25-30 months', minMonths: 25, maxMonths: 30,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 69 },
      { scaledScore: 2, minRaw: 70, maxRaw: 77 },
      { scaledScore: 3, minRaw: 78, maxRaw: 85 },
      { scaledScore: 4, minRaw: 86, maxRaw: 93 },
      { scaledScore: 5, minRaw: 94, maxRaw: 98 },
      { scaledScore: 6, minRaw: 99, maxRaw: 107 },
      { scaledScore: 7, minRaw: 108, maxRaw: 114 },
      { scaledScore: 8, minRaw: 115, maxRaw: 120 },
      { scaledScore: 9, minRaw: 121, maxRaw: 124 },
      { scaledScore: 10, minRaw: 125, maxRaw: 128 },
      { scaledScore: 11, minRaw: 129, maxRaw: 131 },
      { scaledScore: 12, minRaw: 132, maxRaw: 134 },
      { scaledScore: 13, minRaw: 135, maxRaw: 136 },
      { scaledScore: 14, minRaw: 137, maxRaw: 138 },
      { scaledScore: 15, minRaw: 139, maxRaw: 139 },
      { scaledScore: 16, minRaw: 140, maxRaw: 140 },
    ],
  },
  {
    ageLabel: '31-42 months', minMonths: 31, maxMonths: 42,
    ranges: [
      { scaledScore: 1, minRaw: 0, maxRaw: 78 },
      { scaledScore: 2, minRaw: 79, maxRaw: 85 },
      { scaledScore: 3, minRaw: 86, maxRaw: 93 },
      { scaledScore: 4, minRaw: 94, maxRaw: 100 },
      { scaledScore: 5, minRaw: 101, maxRaw: 107 },
      { scaledScore: 6, minRaw: 108, maxRaw: 115 },
      { scaledScore: 7, minRaw: 116, maxRaw: 125 },
      { scaledScore: 8, minRaw: 126, maxRaw: 136 },
      { scaledScore: 9, minRaw: 137, maxRaw: 146 },
      { scaledScore: 10, minRaw: 147, maxRaw: 156 },
      { scaledScore: 11, minRaw: 157, maxRaw: 163 },
      { scaledScore: 12, minRaw: 164, maxRaw: 167 },
      { scaledScore: 13, minRaw: 168, maxRaw: 169 },
      { scaledScore: 14, minRaw: 170, maxRaw: 171 },
      { scaledScore: 15, minRaw: 172, maxRaw: 172 },
      { scaledScore: 16, minRaw: 173, maxRaw: 173 },
      { scaledScore: 17, minRaw: 174, maxRaw: 174 },
      { scaledScore: 18, minRaw: 175, maxRaw: 175 },
    ],
  },
];

// ============================================================
// Table A.3: Adaptive Behavior Scale (5 subscales)
// ============================================================

export interface ABSubscaleEntry {
  scaledScore: number;
  REC: [number, number] | null;  // [min, max] raw score range, or null if not applicable
  EXP: [number, number] | null;
  PER: [number, number] | null;
  IPR: [number, number] | null;
  PLA: [number, number] | null;
}

export interface ABAgeGroup {
  ageLabel: string;
  minMonths: number;
  maxMonths: number;
  data: ABSubscaleEntry[];
}

// Helper to create range tuples more concisely
function r(min: number, max: number): [number, number] { return [min, max]; }
const N = null;

export const AB_SCALED_SCORE_TABLES: ABAgeGroup[] = [
  {
    ageLabel: '0:00-0:30', minMonths: 0, maxMonths: 0,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 4, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 5, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 6, REC: r(0,0), EXP: N, PER: N, IPR: r(1,1), PLA: N },
      { scaledScore: 7, REC: r(1,1), EXP: r(0,0), PER: N, IPR: N, PLA: r(0,0) },
      { scaledScore: 8, REC: r(2,2), EXP: N, PER: N, IPR: r(2,2), PLA: N },
      { scaledScore: 9, REC: r(3,3), EXP: r(1,1), PER: N, IPR: r(3,3), PLA: r(1,1) },
      { scaledScore: 10, REC: r(4,4), EXP: N, PER: r(0,0), IPR: r(4,4), PLA: N },
      { scaledScore: 11, REC: r(5,5), EXP: r(2,2), PER: r(1,1), IPR: r(5,6), PLA: r(2,2) },
      { scaledScore: 12, REC: r(6,7), EXP: r(3,3), PER: r(2,2), IPR: r(7,8), PLA: r(3,3) },
      { scaledScore: 13, REC: r(8,10), EXP: r(4,5), PER: r(3,4), IPR: r(9,10), PLA: r(4,4) },
      { scaledScore: 14, REC: r(11,13), EXP: r(6,7), PER: r(5,7), IPR: r(11,12), PLA: r(5,5) },
      { scaledScore: 15, REC: r(14,17), EXP: r(8,10), PER: r(8,10), IPR: r(13,14), PLA: r(6,7) },
      { scaledScore: 16, REC: r(18,21), EXP: r(11,13), PER: r(11,14), IPR: r(15,17), PLA: r(8,10) },
      { scaledScore: 17, REC: r(22,26), EXP: r(14,17), PER: r(15,18), IPR: r(18,20), PLA: r(11,13) },
      { scaledScore: 18, REC: r(27,31), EXP: r(18,21), PER: r(19,23), IPR: r(21,23), PLA: r(14,15) },
      { scaledScore: 19, REC: r(32,46), EXP: r(22,56), PER: r(24,60), IPR: r(24,40), PLA: r(16,38) },
    ],
  },
  {
    ageLabel: '1:00-1:30', minMonths: 1, maxMonths: 1,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 4, REC: N, EXP: N, PER: N, IPR: r(1,1), PLA: N },
      { scaledScore: 5, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 6, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(2,2), PLA: r(0,0) },
      { scaledScore: 7, REC: r(1,1), EXP: N, PER: N, IPR: r(3,3), PLA: N },
      { scaledScore: 8, REC: r(2,3), EXP: r(1,1), PER: N, IPR: r(4,4), PLA: r(1,1) },
      { scaledScore: 9, REC: r(4,4), EXP: N, PER: r(0,0), IPR: r(5,5), PLA: N },
      { scaledScore: 10, REC: r(5,5), EXP: r(2,2), PER: N, IPR: r(6,7), PLA: r(2,2) },
      { scaledScore: 11, REC: r(6,7), EXP: r(3,3), PER: r(1,1), IPR: r(8,9), PLA: r(3,3) },
      { scaledScore: 12, REC: r(8,9), EXP: r(4,4), PER: r(2,3), IPR: r(10,11), PLA: r(4,4) },
      { scaledScore: 13, REC: r(10,12), EXP: r(5,6), PER: r(4,5), IPR: r(12,13), PLA: r(5,5) },
      { scaledScore: 14, REC: r(13,15), EXP: r(7,8), PER: r(6,8), IPR: r(14,15), PLA: r(6,6) },
      { scaledScore: 15, REC: r(16,18), EXP: r(9,11), PER: r(9,11), IPR: r(16,17), PLA: r(7,8) },
      { scaledScore: 16, REC: r(19,22), EXP: r(12,14), PER: r(12,15), IPR: r(18,20), PLA: r(9,11) },
      { scaledScore: 17, REC: r(23,27), EXP: r(15,18), PER: r(16,19), IPR: r(21,23), PLA: r(12,14) },
      { scaledScore: 18, REC: r(28,32), EXP: r(19,23), PER: r(20,24), IPR: r(24,26), PLA: r(15,16) },
      { scaledScore: 19, REC: r(33,46), EXP: r(24,56), PER: r(25,60), IPR: r(27,40), PLA: r(17,38) },
    ],
  },
  {
    ageLabel: '2:00-2:30', minMonths: 2, maxMonths: 2,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(1,1), PLA: N },
      { scaledScore: 4, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 5, REC: N, EXP: N, PER: N, IPR: r(2,2), PLA: N },
      { scaledScore: 6, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(3,3), PLA: r(0,0) },
      { scaledScore: 7, REC: r(1,1), EXP: N, PER: N, IPR: r(4,4), PLA: N },
      { scaledScore: 8, REC: r(2,3), EXP: r(1,1), PER: N, IPR: r(5,5), PLA: r(1,1) },
      { scaledScore: 9, REC: r(4,4), EXP: N, PER: r(0,0), IPR: r(6,6), PLA: N },
      { scaledScore: 10, REC: r(5,5), EXP: r(2,2), PER: N, IPR: r(7,7), PLA: r(2,2) },
      { scaledScore: 11, REC: r(6,7), EXP: r(3,3), PER: r(1,1), IPR: r(8,9), PLA: r(3,3) },
      { scaledScore: 12, REC: r(8,9), EXP: r(4,4), PER: r(2,3), IPR: r(10,11), PLA: r(4,4) },
      { scaledScore: 13, REC: r(10,12), EXP: r(5,6), PER: r(4,5), IPR: r(12,13), PLA: r(5,5) },
      { scaledScore: 14, REC: r(13,15), EXP: r(7,8), PER: r(6,8), IPR: r(14,15), PLA: r(6,6) },
      { scaledScore: 15, REC: r(16,18), EXP: r(9,11), PER: r(9,11), IPR: r(16,17), PLA: r(7,8) },
      { scaledScore: 16, REC: r(19,22), EXP: r(12,14), PER: r(12,15), IPR: r(18,20), PLA: r(9,11) },
      { scaledScore: 17, REC: r(23,27), EXP: r(15,18), PER: r(16,19), IPR: r(21,23), PLA: r(12,14) },
      { scaledScore: 18, REC: r(28,32), EXP: r(19,23), PER: r(20,24), IPR: r(24,26), PLA: r(15,16) },
      { scaledScore: 19, REC: r(33,46), EXP: r(24,56), PER: r(25,60), IPR: r(27,40), PLA: r(17,38) },
    ],
  },
  {
    ageLabel: '3:00-3:30', minMonths: 3, maxMonths: 3,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,1), PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(2,2), PLA: N },
      { scaledScore: 4, REC: N, EXP: N, PER: N, IPR: r(3,3), PLA: r(0,0) },
      { scaledScore: 5, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(4,4), PLA: N },
      { scaledScore: 6, REC: r(1,1), EXP: N, PER: N, IPR: r(5,6), PLA: r(1,1) },
      { scaledScore: 7, REC: r(2,3), EXP: r(1,1), PER: r(0,0), IPR: r(7,7), PLA: N },
      { scaledScore: 8, REC: r(4,4), EXP: N, PER: r(1,1), IPR: r(8,9), PLA: r(2,2) },
      { scaledScore: 9, REC: r(5,6), EXP: r(2,2), PER: N, IPR: r(10,11), PLA: r(3,3) },
      { scaledScore: 10, REC: r(7,8), EXP: r(3,3), PER: r(2,2), IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 11, REC: r(9,10), EXP: r(4,4), PER: r(3,3), IPR: r(14,15), PLA: r(5,5) },
      { scaledScore: 12, REC: r(11,12), EXP: r(5,6), PER: r(4,5), IPR: r(16,17), PLA: r(6,6) },
      { scaledScore: 13, REC: r(13,15), EXP: r(7,8), PER: r(6,8), IPR: r(18,19), PLA: r(7,7) },
      { scaledScore: 14, REC: r(16,17), EXP: r(9,10), PER: r(9,10), IPR: r(20,22), PLA: r(8,9) },
      { scaledScore: 15, REC: r(18,20), EXP: r(11,13), PER: r(10,13), IPR: r(23,24), PLA: r(10,11) },
      { scaledScore: 16, REC: r(21,24), EXP: r(14,17), PER: r(14,17), IPR: r(25,26), PLA: r(12,14) },
      { scaledScore: 17, REC: r(25,29), EXP: r(18,22), PER: r(18,22), IPR: r(27,28), PLA: r(15,17) },
      { scaledScore: 18, REC: r(30,35), EXP: r(23,28), PER: r(23,28), IPR: r(29,31), PLA: r(18,20) },
      { scaledScore: 19, REC: r(36,46), EXP: r(29,56), PER: r(29,60), IPR: r(32,40), PLA: r(21,38) },
    ],
  },
  {
    ageLabel: '4:00-4:30', minMonths: 4, maxMonths: 4,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,1), PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(2,2), PLA: N },
      { scaledScore: 4, REC: N, EXP: N, PER: N, IPR: r(3,4), PLA: N },
      { scaledScore: 5, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(5,5), PLA: r(1,1) },
      { scaledScore: 6, REC: r(1,1), EXP: N, PER: N, IPR: r(6,7), PLA: N },
      { scaledScore: 7, REC: r(2,3), EXP: r(1,1), PER: r(0,0), IPR: r(8,8), PLA: r(2,2) },
      { scaledScore: 8, REC: r(4,5), EXP: r(2,2), PER: r(1,1), IPR: r(9,10), PLA: r(3,3) },
      { scaledScore: 9, REC: r(6,7), EXP: r(3,3), PER: N, IPR: r(11,12), PLA: r(4,4) },
      { scaledScore: 10, REC: r(8,9), EXP: r(4,4), PER: r(2,2), IPR: r(13,14), PLA: r(5,5) },
      { scaledScore: 11, REC: r(10,11), EXP: r(5,5), PER: r(3,3), IPR: r(15,16), PLA: r(6,6) },
      { scaledScore: 12, REC: r(12,13), EXP: r(6,7), PER: r(4,5), IPR: r(17,18), PLA: r(7,7) },
      { scaledScore: 13, REC: r(14,16), EXP: r(8,9), PER: r(6,7), IPR: r(19,20), PLA: r(8,9) },
      { scaledScore: 14, REC: r(17,19), EXP: r(10,12), PER: r(8,10), IPR: r(21,23), PLA: r(10,11) },
      { scaledScore: 15, REC: r(20,22), EXP: r(13,15), PER: r(11,14), IPR: r(24,25), PLA: r(12,13) },
      { scaledScore: 16, REC: r(23,26), EXP: r(16,19), PER: r(15,18), IPR: r(26,27), PLA: r(14,16) },
      { scaledScore: 17, REC: r(27,31), EXP: r(20,24), PER: r(19,22), IPR: r(28,29), PLA: r(17,19) },
      { scaledScore: 18, REC: r(32,37), EXP: r(25,30), PER: r(23,27), IPR: r(30,32), PLA: r(20,22) },
      { scaledScore: 19, REC: r(38,46), EXP: r(31,56), PER: r(28,60), IPR: r(33,40), PLA: r(23,38) },
    ],
  },
  {
    ageLabel: '5:00-5:30', minMonths: 5, maxMonths: 5,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,1), PLA: r(0,0) },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(2,3), PLA: N },
      { scaledScore: 4, REC: r(0,0), EXP: N, PER: N, IPR: r(4,4), PLA: N },
      { scaledScore: 5, REC: r(1,1), EXP: r(0,0), PER: N, IPR: r(5,6), PLA: r(1,1) },
      { scaledScore: 6, REC: r(2,2), EXP: r(1,1), PER: N, IPR: r(7,7), PLA: N },
      { scaledScore: 7, REC: r(3,4), EXP: r(2,2), PER: r(0,0), IPR: r(8,9), PLA: r(2,2) },
      { scaledScore: 8, REC: r(5,6), EXP: r(3,3), PER: r(1,1), IPR: r(10,11), PLA: r(3,3) },
      { scaledScore: 9, REC: r(7,8), EXP: r(4,4), PER: N, IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 10, REC: r(9,10), EXP: r(5,5), PER: r(2,2), IPR: r(14,15), PLA: r(5,6) },
      { scaledScore: 11, REC: r(11,12), EXP: r(6,6), PER: r(3,4), IPR: r(16,17), PLA: r(7,7) },
      { scaledScore: 12, REC: r(13,15), EXP: r(7,8), PER: r(5,6), IPR: r(18,19), PLA: r(8,8) },
      { scaledScore: 13, REC: r(16,17), EXP: r(9,10), PER: r(7,8), IPR: r(20,21), PLA: r(9,10) },
      { scaledScore: 14, REC: r(18,20), EXP: r(11,13), PER: r(9,11), IPR: r(22,24), PLA: r(11,12) },
      { scaledScore: 15, REC: r(21,23), EXP: r(14,17), PER: r(12,15), IPR: r(25,26), PLA: r(13,14) },
      { scaledScore: 16, REC: r(24,27), EXP: r(18,22), PER: r(16,19), IPR: r(27,28), PLA: r(15,17) },
      { scaledScore: 17, REC: r(28,32), EXP: r(23,27), PER: r(20,23), IPR: r(29,30), PLA: r(18,20) },
      { scaledScore: 18, REC: r(33,38), EXP: r(28,33), PER: r(24,28), IPR: r(31,33), PLA: r(21,23) },
      { scaledScore: 19, REC: r(39,46), EXP: r(34,56), PER: r(29,60), IPR: r(34,40), PLA: r(24,38) },
    ],
  },
  {
    ageLabel: '6:00-6:30', minMonths: 6, maxMonths: 6,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: N },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,2), PLA: r(0,0) },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(3,3), PLA: N },
      { scaledScore: 4, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(4,5), PLA: r(1,1) },
      { scaledScore: 5, REC: r(1,2), EXP: N, PER: N, IPR: r(6,6), PLA: N },
      { scaledScore: 6, REC: r(3,3), EXP: r(1,1), PER: r(0,0), IPR: r(7,8), PLA: r(2,2) },
      { scaledScore: 7, REC: r(4,5), EXP: r(2,2), PER: r(1,1), IPR: r(9,10), PLA: r(3,3) },
      { scaledScore: 8, REC: r(6,7), EXP: r(3,4), PER: r(2,2), IPR: r(11,12), PLA: r(4,4) },
      { scaledScore: 9, REC: r(8,9), EXP: r(5,5), PER: N, IPR: r(13,14), PLA: r(5,5) },
      { scaledScore: 10, REC: r(10,11), EXP: r(6,6), PER: r(3,3), IPR: r(15,16), PLA: r(6,6) },
      { scaledScore: 11, REC: r(12,14), EXP: r(7,7), PER: r(4,5), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 12, REC: r(15,16), EXP: r(8,9), PER: r(6,7), IPR: r(19,20), PLA: r(9,9) },
      { scaledScore: 13, REC: r(17,19), EXP: r(10,12), PER: r(8,9), IPR: r(21,22), PLA: r(10,11) },
      { scaledScore: 14, REC: r(20,22), EXP: r(13,15), PER: r(10,12), IPR: r(23,25), PLA: r(12,14) },
      { scaledScore: 15, REC: r(23,25), EXP: r(16,19), PER: r(13,16), IPR: r(26,27), PLA: r(15,16) },
      { scaledScore: 16, REC: r(26,29), EXP: r(20,24), PER: r(17,21), IPR: r(28,29), PLA: r(17,19) },
      { scaledScore: 17, REC: r(30,34), EXP: r(25,29), PER: r(22,25), IPR: r(30,31), PLA: r(20,22) },
      { scaledScore: 18, REC: r(35,39), EXP: r(30,34), PER: r(26,30), IPR: r(32,34), PLA: r(23,25) },
      { scaledScore: 19, REC: r(40,46), EXP: r(35,56), PER: r(31,60), IPR: r(35,40), PLA: r(26,38) },
    ],
  },
  {
    ageLabel: '7:00-7:30', minMonths: 7, maxMonths: 7,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: r(0,0) },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,2), PLA: N },
      { scaledScore: 3, REC: N, EXP: N, PER: N, IPR: r(3,4), PLA: r(1,1) },
      { scaledScore: 4, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(5,5), PLA: N },
      { scaledScore: 5, REC: r(1,2), EXP: r(1,1), PER: N, IPR: r(6,7), PLA: r(2,2) },
      { scaledScore: 6, REC: r(3,4), EXP: r(2,2), PER: r(0,0), IPR: r(8,9), PLA: r(3,3) },
      { scaledScore: 7, REC: r(5,6), EXP: r(3,3), PER: r(1,1), IPR: r(10,11), PLA: r(4,4) },
      { scaledScore: 8, REC: r(7,8), EXP: r(4,5), PER: r(2,2), IPR: r(12,13), PLA: r(5,5) },
      { scaledScore: 9, REC: r(9,10), EXP: r(6,6), PER: r(3,3), IPR: r(14,15), PLA: r(6,6) },
      { scaledScore: 10, REC: r(11,13), EXP: r(7,7), PER: r(4,4), IPR: r(16,17), PLA: r(7,7) },
      { scaledScore: 11, REC: r(14,15), EXP: r(8,9), PER: r(5,6), IPR: r(18,19), PLA: r(8,9) },
      { scaledScore: 12, REC: r(16,18), EXP: r(10,11), PER: r(7,8), IPR: r(20,21), PLA: r(10,11) },
      { scaledScore: 13, REC: r(19,21), EXP: r(12,14), PER: r(9,10), IPR: r(22,23), PLA: r(12,13) },
      { scaledScore: 14, REC: r(22,24), EXP: r(15,17), PER: r(11,13), IPR: r(24,26), PLA: r(14,16) },
      { scaledScore: 15, REC: r(25,27), EXP: r(18,21), PER: r(14,17), IPR: r(27,28), PLA: r(17,18) },
      { scaledScore: 16, REC: r(28,31), EXP: r(22,26), PER: r(18,22), IPR: r(29,30), PLA: r(19,21) },
      { scaledScore: 17, REC: r(32,36), EXP: r(27,32), PER: r(23,26), IPR: r(31,32), PLA: r(22,24) },
      { scaledScore: 18, REC: r(37,41), EXP: r(33,37), PER: r(27,32), IPR: r(33,35), PLA: r(25,27) },
      { scaledScore: 19, REC: r(42,46), EXP: r(38,56), PER: r(33,60), IPR: r(36,40), PLA: r(28,38) },
    ],
  },
  {
    ageLabel: '8:00-8:30', minMonths: 8, maxMonths: 8,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: r(0,0) },
      { scaledScore: 2, REC: N, EXP: N, PER: N, IPR: r(1,2), PLA: N },
      { scaledScore: 3, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(3,4), PLA: r(1,1) },
      { scaledScore: 4, REC: r(1,2), EXP: N, PER: r(0,0), IPR: r(5,6), PLA: N },
      { scaledScore: 5, REC: r(3,4), EXP: r(1,1), PER: N, IPR: r(7,8), PLA: r(2,2) },
      { scaledScore: 6, REC: r(5,5), EXP: r(2,2), PER: r(1,1), IPR: r(9,10), PLA: r(3,3) },
      { scaledScore: 7, REC: r(6,7), EXP: r(3,4), PER: r(2,2), IPR: r(11,12), PLA: r(4,4) },
      { scaledScore: 8, REC: r(8,9), EXP: r(5,6), PER: r(3,3), IPR: r(13,14), PLA: r(5,5) },
      { scaledScore: 9, REC: r(10,12), EXP: r(7,7), PER: r(4,4), IPR: r(15,16), PLA: r(6,6) },
      { scaledScore: 10, REC: r(13,14), EXP: r(8,8), PER: r(5,6), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 11, REC: r(15,17), EXP: r(9,10), PER: r(7,8), IPR: r(19,20), PLA: r(9,10) },
      { scaledScore: 12, REC: r(18,19), EXP: r(11,12), PER: r(9,11), IPR: r(21,22), PLA: r(11,12) },
      { scaledScore: 13, REC: r(20,22), EXP: r(13,15), PER: r(12,13), IPR: r(23,24), PLA: r(13,15) },
      { scaledScore: 14, REC: r(23,25), EXP: r(16,19), PER: r(14,16), IPR: r(25,27), PLA: r(16,18) },
      { scaledScore: 15, REC: r(26,29), EXP: r(20,24), PER: r(17,20), IPR: r(28,29), PLA: r(19,20) },
      { scaledScore: 16, REC: r(30,34), EXP: r(25,29), PER: r(21,25), IPR: r(30,31), PLA: r(21,23) },
      { scaledScore: 17, REC: r(35,38), EXP: r(30,35), PER: r(26,30), IPR: r(32,33), PLA: r(24,26) },
      { scaledScore: 18, REC: r(39,42), EXP: r(36,40), PER: r(31,35), IPR: r(34,36), PLA: r(27,28) },
      { scaledScore: 19, REC: r(43,46), EXP: r(41,56), PER: r(36,60), IPR: r(37,40), PLA: r(29,38) },
    ],
  },
  {
    ageLabel: '9:00-9:30', minMonths: 9, maxMonths: 9,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,0), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,0), EXP: N, PER: N, IPR: r(1,2), PLA: N },
      { scaledScore: 3, REC: r(1,1), EXP: r(0,0), PER: N, IPR: r(3,4), PLA: r(1,1) },
      { scaledScore: 4, REC: r(2,3), EXP: r(1,1), PER: r(0,0), IPR: r(5,7), PLA: N },
      { scaledScore: 5, REC: r(4,5), EXP: r(2,2), PER: r(1,1), IPR: r(8,9), PLA: r(2,2) },
      { scaledScore: 6, REC: r(6,7), EXP: r(3,3), PER: r(2,2), IPR: r(10,11), PLA: r(3,3) },
      { scaledScore: 7, REC: r(8,9), EXP: r(4,5), PER: r(3,3), IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 8, REC: r(10,11), EXP: r(6,7), PER: r(4,4), IPR: r(14,15), PLA: r(5,5) },
      { scaledScore: 9, REC: r(12,13), EXP: r(8,8), PER: r(5,5), IPR: r(16,17), PLA: r(6,7) },
      { scaledScore: 10, REC: r(14,16), EXP: r(9,10), PER: r(6,7), IPR: r(18,19), PLA: r(8,9) },
      { scaledScore: 11, REC: r(17,18), EXP: r(11,12), PER: r(8,10), IPR: r(20,21), PLA: r(10,11) },
      { scaledScore: 12, REC: r(19,21), EXP: r(13,14), PER: r(11,12), IPR: r(22,23), PLA: r(12,13) },
      { scaledScore: 13, REC: r(22,24), EXP: r(15,17), PER: r(13,15), IPR: r(24,25), PLA: r(14,16) },
      { scaledScore: 14, REC: r(25,28), EXP: r(18,21), PER: r(16,19), IPR: r(26,27), PLA: r(17,19) },
      { scaledScore: 15, REC: r(29,31), EXP: r(22,26), PER: r(20,23), IPR: r(28,31), PLA: r(20,21) },
      { scaledScore: 16, REC: r(32,35), EXP: r(27,31), PER: r(24,28), IPR: r(29,30), PLA: r(22,24) },
      { scaledScore: 17, REC: r(36,39), EXP: r(32,37), PER: r(29,33), IPR: r(33,34), PLA: r(25,27) },
      { scaledScore: 18, REC: r(40,43), EXP: r(38,42), PER: r(34,38), IPR: r(35,37), PLA: r(28,29) },
      { scaledScore: 19, REC: r(44,46), EXP: r(43,56), PER: r(39,60), IPR: r(38,40), PLA: r(30,38) },
    ],
  },
  {
    ageLabel: '10:00-10:30', minMonths: 10, maxMonths: 10,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,1), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,0), EXP: N, PER: N, IPR: r(2,3), PLA: r(1,1) },
      { scaledScore: 3, REC: r(1,2), EXP: r(0,0), PER: N, IPR: r(4,5), PLA: N },
      { scaledScore: 4, REC: r(3,3), EXP: r(1,1), PER: r(0,0), IPR: r(6,8), PLA: r(2,2) },
      { scaledScore: 5, REC: r(4,5), EXP: r(2,2), PER: r(1,1), IPR: r(9,10), PLA: r(3,3) },
      { scaledScore: 6, REC: r(6,8), EXP: r(3,3), PER: r(2,2), IPR: r(11,12), PLA: r(4,4) },
      { scaledScore: 7, REC: r(9,10), EXP: r(4,5), PER: r(3,4), IPR: r(13,14), PLA: r(5,6) },
      { scaledScore: 8, REC: r(11,12), EXP: r(6,7), PER: r(5,5), IPR: r(15,16), PLA: r(6,6) },
      { scaledScore: 9, REC: r(13,15), EXP: r(8,9), PER: r(6,6), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 10, REC: r(16,17), EXP: r(10,11), PER: r(7,8), IPR: r(19,20), PLA: r(9,10) },
      { scaledScore: 11, REC: r(18,19), EXP: r(12,13), PER: r(9,11), IPR: r(21,22), PLA: r(11,12) },
      { scaledScore: 12, REC: r(20,22), EXP: r(14,16), PER: r(12,14), IPR: r(23,24), PLA: r(13,14) },
      { scaledScore: 13, REC: r(23,26), EXP: r(17,19), PER: r(15,17), IPR: r(25,26), PLA: r(15,17) },
      { scaledScore: 14, REC: r(27,29), EXP: r(20,23), PER: r(18,21), IPR: r(27,28), PLA: r(18,20) },
      { scaledScore: 15, REC: r(30,33), EXP: r(24,28), PER: r(22,25), IPR: r(30,31), PLA: r(21,22) },
      { scaledScore: 16, REC: r(34,37), EXP: r(29,33), PER: r(26,30), IPR: r(31,32), PLA: r(23,25) },
      { scaledScore: 17, REC: r(38,41), EXP: r(34,38), PER: r(31,35), IPR: r(33,34), PLA: r(26,28) },
      { scaledScore: 18, REC: r(42,44), EXP: r(39,44), PER: r(36,40), IPR: r(35,37), PLA: r(29,30) },
      { scaledScore: 19, REC: r(45,46), EXP: r(45,56), PER: r(41,60), IPR: r(38,40), PLA: r(31,38) },
    ],
  },
  {
    ageLabel: '11:00-11:30', minMonths: 11, maxMonths: 11,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,1), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,0), EXP: N, PER: N, IPR: r(2,3), PLA: r(1,1) },
      { scaledScore: 3, REC: r(1,2), EXP: r(0,0), PER: r(0,0), IPR: r(4,6), PLA: N },
      { scaledScore: 4, REC: r(3,4), EXP: r(1,1), PER: r(1,1), IPR: r(7,9), PLA: r(2,2) },
      { scaledScore: 5, REC: r(5,6), EXP: r(2,2), PER: r(2,2), IPR: r(10,11), PLA: r(3,3) },
      { scaledScore: 6, REC: r(7,8), EXP: r(3,4), PER: r(3,3), IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 7, REC: r(9,10), EXP: r(5,6), PER: r(4,5), IPR: r(14,15), PLA: r(5,5) },
      { scaledScore: 8, REC: r(11,13), EXP: r(7,8), PER: r(6,7), IPR: r(16,17), PLA: r(6,7) },
      { scaledScore: 9, REC: r(14,16), EXP: r(9,10), PER: r(8,9), IPR: r(18,19), PLA: r(8,9) },
      { scaledScore: 10, REC: r(17,18), EXP: r(11,12), PER: r(10,12), IPR: r(20,21), PLA: r(10,11) },
      { scaledScore: 11, REC: r(19,21), EXP: r(13,15), PER: r(11,13), IPR: r(22,23), PLA: r(12,13) },
      { scaledScore: 12, REC: r(22,24), EXP: r(16,18), PER: r(14,16), IPR: r(24,25), PLA: r(14,15) },
      { scaledScore: 13, REC: r(25,28), EXP: r(19,21), PER: r(17,20), IPR: r(26,27), PLA: r(16,18) },
      { scaledScore: 14, REC: r(29,31), EXP: r(22,25), PER: r(21,25), IPR: r(28,29), PLA: r(19,21) },
      { scaledScore: 15, REC: r(32,35), EXP: r(26,29), PER: r(26,27), IPR: r(30,31), PLA: r(22,23) },
      { scaledScore: 16, REC: r(36,39), EXP: r(30,34), PER: r(28,32), IPR: r(33,37), PLA: r(24,26) },
      { scaledScore: 17, REC: r(40,42), EXP: r(35,40), PER: r(33,37), IPR: r(34,34), PLA: r(27,29) },
      { scaledScore: 18, REC: r(43,45), EXP: r(41,46), PER: r(38,43), IPR: r(35,37), PLA: r(30,31) },
      { scaledScore: 19, REC: r(46,46), EXP: r(47,56), PER: r(44,60), IPR: r(38,40), PLA: r(32,38) },
    ],
  },
  {
    ageLabel: '12:00-12:30', minMonths: 12, maxMonths: 12,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,1), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,0), EXP: N, PER: N, IPR: r(2,4), PLA: r(1,1) },
      { scaledScore: 3, REC: r(1,2), EXP: r(0,0), PER: r(0,0), IPR: r(5,6), PLA: N },
      { scaledScore: 4, REC: r(3,4), EXP: r(1,2), PER: r(1,1), IPR: r(7,9), PLA: r(2,2) },
      { scaledScore: 5, REC: r(5,6), EXP: r(3,3), PER: r(2,2), IPR: r(10,11), PLA: r(3,3) },
      { scaledScore: 6, REC: r(7,8), EXP: r(4,5), PER: r(3,4), IPR: r(12,14), PLA: r(4,4) },
      { scaledScore: 7, REC: r(9,11), EXP: r(6,7), PER: r(5,5), IPR: r(13,14), PLA: r(5,6) },
      { scaledScore: 8, REC: r(12,14), EXP: r(7,8), PER: r(5,6), IPR: r(15,16), PLA: r(5,6) },
      { scaledScore: 9, REC: r(15,17), EXP: r(9,10), PER: r(7,8), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 10, REC: r(18,20), EXP: r(11,13), PER: r(9,11), IPR: r(19,20), PLA: r(9,10) },
      { scaledScore: 11, REC: r(21,23), EXP: r(14,16), PER: r(12,14), IPR: r(21,22), PLA: r(11,12) },
      { scaledScore: 12, REC: r(24,27), EXP: r(17,19), PER: r(15,18), IPR: r(23,24), PLA: r(13,14) },
      { scaledScore: 13, REC: r(28,30), EXP: r(20,23), PER: r(19,22), IPR: r(25,26), PLA: r(15,16) },
      { scaledScore: 14, REC: r(31,33), EXP: r(24,27), PER: r(23,25), IPR: r(27,28), PLA: r(17,19) },
      { scaledScore: 15, REC: r(34,36), EXP: r(28,31), PER: r(26,29), IPR: r(31,31), PLA: r(20,22) },
      { scaledScore: 16, REC: r(37,40), EXP: r(32,36), PER: r(30,34), IPR: r(32,33), PLA: r(23,24) },
      { scaledScore: 17, REC: r(41,43), EXP: r(37,42), PER: r(35,39), IPR: r(34,34), PLA: r(25,27) },
      { scaledScore: 18, REC: r(44,45), EXP: r(43,48), PER: r(40,45), IPR: r(35,37), PLA: r(28,29) },
      { scaledScore: 19, REC: r(46,46), EXP: r(49,56), PER: r(46,60), IPR: r(38,40), PLA: r(30,38) },
    ],
  },
  {
    ageLabel: '13:00-13:30', minMonths: 13, maxMonths: 13,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,2), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,0), EXP: r(0,0), PER: N, IPR: r(3,4), PLA: r(1,1) },
      { scaledScore: 3, REC: r(1,2), EXP: r(1,1), PER: r(0,0), IPR: r(5,6), PLA: N },
      { scaledScore: 4, REC: r(3,5), EXP: r(2,2), PER: r(1,1), IPR: r(7,9), PLA: r(2,2) },
      { scaledScore: 5, REC: r(6,7), EXP: r(3,3), PER: r(2,2), IPR: r(10,12), PLA: r(3,3) },
      { scaledScore: 6, REC: r(8,10), EXP: r(4,5), PER: r(3,4), IPR: r(13,14), PLA: r(4,4) },
      { scaledScore: 7, REC: r(11,13), EXP: r(6,7), PER: r(5,5), IPR: r(15,16), PLA: r(5,6) },
      { scaledScore: 8, REC: r(14,16), EXP: r(8,9), PER: r(6,7), IPR: r(17,19), PLA: r(7,8) },
      { scaledScore: 9, REC: r(17,19), EXP: r(10,11), PER: r(8,9), IPR: r(20,21), PLA: r(9,11) },
      { scaledScore: 10, REC: r(20,22), EXP: r(12,14), PER: r(10,12), IPR: r(22,23), PLA: r(12,13) },
      { scaledScore: 11, REC: r(23,25), EXP: r(15,17), PER: r(13,16), IPR: r(24,25), PLA: r(14,15) },
      { scaledScore: 12, REC: r(26,29), EXP: r(18,21), PER: r(17,20), IPR: r(26,27), PLA: r(16,17) },
      { scaledScore: 13, REC: r(30,32), EXP: r(22,25), PER: r(21,24), IPR: r(28,29), PLA: r(18,20) },
      { scaledScore: 14, REC: r(33,35), EXP: r(26,29), PER: r(25,27), IPR: r(30,31), PLA: r(21,23) },
      { scaledScore: 15, REC: r(36,37), EXP: r(30,34), PER: r(28,31), IPR: r(32,32), PLA: r(24,25) },
      { scaledScore: 16, REC: r(38,40), EXP: r(35,39), PER: r(32,36), IPR: r(33,34), PLA: r(26,28) },
      { scaledScore: 17, REC: r(41,43), EXP: r(40,44), PER: r(37,41), IPR: r(35,35), PLA: r(29,30) },
      { scaledScore: 18, REC: r(44,45), EXP: r(45,49), PER: r(42,47), IPR: r(36,37), PLA: r(31,32) },
      { scaledScore: 19, REC: r(46,46), EXP: r(50,56), PER: r(48,60), IPR: r(38,40), PLA: r(33,38) },
    ],
  },
  {
    ageLabel: '14:00-14:30', minMonths: 14, maxMonths: 14,
    data: [
      { scaledScore: 1, REC: N, EXP: N, PER: N, IPR: r(0,2), PLA: r(0,0) },
      { scaledScore: 2, REC: r(0,1), EXP: r(0,0), PER: r(0,0), IPR: r(3,5), PLA: r(1,1) },
      { scaledScore: 3, REC: r(2,3), EXP: r(1,1), PER: r(1,1), IPR: r(6,8), PLA: r(2,2) },
      { scaledScore: 4, REC: r(4,6), EXP: r(2,2), PER: r(2,2), IPR: r(9,11), PLA: r(3,3) },
      { scaledScore: 5, REC: r(7,8), EXP: r(3,4), PER: r(3,3), IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 6, REC: r(9,11), EXP: r(5,6), PER: r(4,5), IPR: r(14,16), PLA: r(5,6) },
      { scaledScore: 7, REC: r(12,14), EXP: r(7,8), PER: r(5,6), IPR: r(15,16), PLA: r(5,6) },
      { scaledScore: 8, REC: r(15,17), EXP: r(9,10), PER: r(7,8), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 9, REC: r(18,20), EXP: r(11,13), PER: r(9,11), IPR: r(19,20), PLA: r(9,10) },
      { scaledScore: 10, REC: r(21,23), EXP: r(14,16), PER: r(12,14), IPR: r(21,22), PLA: r(11,12) },
      { scaledScore: 11, REC: r(24,27), EXP: r(17,19), PER: r(15,18), IPR: r(23,24), PLA: r(13,14) },
      { scaledScore: 12, REC: r(28,30), EXP: r(20,23), PER: r(19,22), IPR: r(25,26), PLA: r(15,16) },
      { scaledScore: 13, REC: r(31,33), EXP: r(24,26), PER: r(23,25), IPR: r(27,28), PLA: r(17,19) },
      { scaledScore: 14, REC: r(34,36), EXP: r(27,30), PER: r(26,29), IPR: r(29,31), PLA: r(20,22) },
      { scaledScore: 15, REC: r(37,39), EXP: r(31,34), PER: r(30,33), IPR: r(33,33), PLA: r(23,24) },
      { scaledScore: 16, REC: r(40,41), EXP: r(35,39), PER: r(34,38), IPR: r(34,34), PLA: r(25,27) },
      { scaledScore: 17, REC: r(42,43), EXP: r(40,45), PER: r(39,43), IPR: r(35,36), PLA: r(28,30) },
      { scaledScore: 18, REC: r(44,45), EXP: r(46,50), PER: r(44,49), IPR: r(37,38), PLA: r(31,32) },
      { scaledScore: 19, REC: r(46,46), EXP: r(51,56), PER: r(50,60), IPR: r(39,40), PLA: r(33,38) },
    ],
  },
  {
    ageLabel: '15:00-15:30', minMonths: 15, maxMonths: 15,
    data: [
      { scaledScore: 1, REC: r(0,0), EXP: N, PER: N, IPR: r(0,2), PLA: r(0,0) },
      { scaledScore: 2, REC: r(1,2), EXP: r(0,0), PER: r(0,1), IPR: r(3,5), PLA: r(1,1) },
      { scaledScore: 3, REC: r(3,4), EXP: r(1,2), PER: r(2,2), IPR: r(6,8), PLA: r(2,2) },
      { scaledScore: 4, REC: r(5,7), EXP: r(3,3), PER: r(3,3), IPR: r(9,11), PLA: r(3,3) },
      { scaledScore: 5, REC: r(8,10), EXP: r(4,5), PER: r(4,4), IPR: r(12,13), PLA: r(4,4) },
      { scaledScore: 6, REC: r(11,13), EXP: r(6,7), PER: r(5,6), IPR: r(14,16), PLA: r(5,6) },
      { scaledScore: 7, REC: r(14,16), EXP: r(7,9), PER: r(6,7), IPR: r(17,18), PLA: r(7,8) },
      { scaledScore: 8, REC: r(17,19), EXP: r(10,11), PER: r(8,9), IPR: r(19,21), PLA: r(9,10) },
      { scaledScore: 9, REC: r(20,22), EXP: r(12,14), PER: r(10,12), IPR: r(22,23), PLA: r(11,13) },
      { scaledScore: 10, REC: r(23,25), EXP: r(15,17), PER: r(13,16), IPR: r(24,25), PLA: r(14,15) },
      { scaledScore: 11, REC: r(26,28), EXP: r(18,20), PER: r(17,20), IPR: r(26,27), PLA: r(16,17) },
      { scaledScore: 12, REC: r(29,31), EXP: r(21,24), PER: r(21,24), IPR: r(28,29), PLA: r(18,19) },
      { scaledScore: 13, REC: r(32,34), EXP: r(25,28), PER: r(25,28), IPR: r(30,31), PLA: r(20,22) },
      { scaledScore: 14, REC: r(35,37), EXP: r(29,32), PER: r(29,32), IPR: r(32,35), PLA: r(23,25) },
      { scaledScore: 15, REC: r(38,40), EXP: r(33,37), PER: r(33,37), IPR: r(34,34), PLA: r(26,27) },
      { scaledScore: 16, REC: r(41,42), EXP: r(38,42), PER: r(38,42), IPR: r(35,35), PLA: r(28,30) },
      { scaledScore: 17, REC: r(43,44), EXP: r(43,46), PER: r(43,46), IPR: r(36,36), PLA: r(31,32) },
      { scaledScore: 18, REC: r(45,45), EXP: r(47,51), PER: r(47,51), IPR: r(37,38), PLA: r(33,34) },
      { scaledScore: 19, REC: r(46,46), EXP: r(52,56), PER: r(52,60), IPR: r(39,40), PLA: r(35,38) },
    ],
  },
  {
    ageLabel: '16:00-16:30', minMonths: 16, maxMonths: 16,
    data: [
      { scaledScore: 1, REC: r(0,2), EXP: r(0,0), PER: r(0,0), IPR: r(0,3), PLA: r(0,0) },
      { scaledScore: 2, REC: r(3,4), EXP: r(1,2), PER: r(1,2), IPR: r(4,6), PLA: r(1,1) },
      { scaledScore: 3, REC: r(5,7), EXP: r(3,3), PER: r(3,3), IPR: r(7,9), PLA: r(2,2) },
      { scaledScore: 4, REC: r(8,9), EXP: r(4,5), PER: r(4,4), IPR: r(10,12), PLA: r(3,3) },
      { scaledScore: 5, REC: r(10,12), EXP: r(6,7), PER: r(5,5), IPR: r(13,14), PLA: r(4,5) },
      { scaledScore: 6, REC: r(13,15), EXP: r(8,9), PER: r(6,7), IPR: r(15,17), PLA: r(6,7) },
      { scaledScore: 7, REC: r(16,18), EXP: r(9,10), PER: r(8,9), IPR: r(18,19), PLA: r(8,9) },
      { scaledScore: 8, REC: r(19,21), EXP: r(11,12), PER: r(10,11), IPR: r(20,22), PLA: r(10,11) },
      { scaledScore: 9, REC: r(22,24), EXP: r(13,15), PER: r(12,14), IPR: r(23,24), PLA: r(12,14) },
      { scaledScore: 10, REC: r(25,27), EXP: r(16,18), PER: r(15,18), IPR: r(25,26), PLA: r(15,16) },
      { scaledScore: 11, REC: r(28,30), EXP: r(19,21), PER: r(19,22), IPR: r(27,28), PLA: r(17,18) },
      { scaledScore: 12, REC: r(31,33), EXP: r(22,25), PER: r(23,26), IPR: r(29,30), PLA: r(19,20) },
      { scaledScore: 13, REC: r(34,35), EXP: r(26,29), PER: r(27,30), IPR: r(31,32), PLA: r(21,23) },
      { scaledScore: 14, REC: r(36,38), EXP: r(30,33), PER: r(31,34), IPR: r(33,34), PLA: r(24,26) },
      { scaledScore: 15, REC: r(39,41), EXP: r(34,38), PER: r(35,38), IPR: r(35,35), PLA: r(27,28) },
      { scaledScore: 16, REC: r(42,43), EXP: r(39,43), PER: r(39,43), IPR: r(36,36), PLA: r(29,31) },
      { scaledScore: 17, REC: r(44,44), EXP: r(44,47), PER: r(44,48), IPR: r(37,37), PLA: r(32,33) },
      { scaledScore: 18, REC: r(45,45), EXP: r(48,52), PER: r(49,52), IPR: r(38,38), PLA: r(34,35) },
      { scaledScore: 19, REC: r(46,46), EXP: r(53,56), PER: r(53,60), IPR: r(39,40), PLA: r(36,38) },
    ],
  },
  {
    ageLabel: '17:00-17:30', minMonths: 17, maxMonths: 17,
    data: [
      { scaledScore: 1, REC: r(0,4), EXP: r(0,0), PER: r(0,1), IPR: r(0,3), PLA: r(0,0) },
      { scaledScore: 2, REC: r(5,6), EXP: r(1,1), PER: r(2,3), IPR: r(4,6), PLA: r(1,1) },
      { scaledScore: 3, REC: r(7,8), EXP: r(2,2), PER: r(4,4), IPR: r(7,9), PLA: r(2,2) },
      { scaledScore: 4, REC: r(9,11), EXP: r(3,4), PER: r(5,5), IPR: r(10,12), PLA: r(3,4) },
      { scaledScore: 5, REC: r(12,14), EXP: r(5,7), PER: r(6,7), IPR: r(13,15), PLA: r(5,6) },
      { scaledScore: 6, REC: r(15,17), EXP: r(8,9), PER: r(8,9), IPR: r(16,18), PLA: r(7,8) },
      { scaledScore: 7, REC: r(18,20), EXP: r(10,11), PER: r(9,10), IPR: r(19,20), PLA: r(9,10) },
      { scaledScore: 8, REC: r(21,23), EXP: r(12,14), PER: r(11,12), IPR: r(21,23), PLA: r(11,12) },
      { scaledScore: 9, REC: r(24,26), EXP: r(15,17), PER: r(14,17), IPR: r(24,25), PLA: r(13,15) },
      { scaledScore: 10, REC: r(27,29), EXP: r(18,20), PER: r(18,21), IPR: r(26,27), PLA: r(16,17) },
      { scaledScore: 11, REC: r(30,32), EXP: r(21,24), PER: r(22,25), IPR: r(28,29), PLA: r(18,19) },
      { scaledScore: 12, REC: r(33,34), EXP: r(25,27), PER: r(26,29), IPR: r(30,31), PLA: r(20,21) },
      { scaledScore: 13, REC: r(35,36), EXP: r(28,31), PER: r(30,33), IPR: r(32,33), PLA: r(22,24) },
      { scaledScore: 14, REC: r(37,39), EXP: r(32,36), PER: r(34,37), IPR: r(34,34), PLA: r(25,26) },
      { scaledScore: 15, REC: r(40,42), EXP: r(37,40), PER: r(38,41), IPR: r(35,35), PLA: r(27,29) },
      { scaledScore: 16, REC: r(43,44), EXP: r(41,44), PER: r(42,46), IPR: r(36,36), PLA: r(30,31) },
      { scaledScore: 17, REC: r(45,45), EXP: r(45,49), PER: r(47,50), IPR: r(37,37), PLA: r(32,33) },
      { scaledScore: 18, REC: r(46,46), EXP: r(50,53), PER: r(51,54), IPR: r(38,38), PLA: r(34,35) },
      { scaledScore: 19, REC: N, EXP: r(54,56), PER: r(55,60), IPR: r(39,40), PLA: r(36,38) },
    ],
  },
  {
    ageLabel: '18:00-18:30', minMonths: 18, maxMonths: 18,
    data: [
      { scaledScore: 1, REC: r(0,5), EXP: r(0,0), PER: r(0,2), IPR: r(0,3), PLA: r(0,0) },
      { scaledScore: 2, REC: r(6,7), EXP: r(1,2), PER: r(3,4), IPR: r(4,5), PLA: r(1,1) },
      { scaledScore: 3, REC: r(8,10), EXP: r(3,3), PER: r(5,5), IPR: r(5,6), PLA: r(2,3) },
      { scaledScore: 4, REC: r(11,13), EXP: r(4,5), PER: r(6,6), IPR: r(7,8), PLA: r(4,5) },
      { scaledScore: 5, REC: r(14,16), EXP: r(6,8), PER: r(7,8), IPR: r(9,10), PLA: r(6,7) },
      { scaledScore: 6, REC: r(17,19), EXP: r(9,10), PER: r(9,10), IPR: r(10,11), PLA: r(8,9) },
      { scaledScore: 7, REC: r(20,22), EXP: r(11,13), PER: r(11,12), IPR: r(12,14), PLA: r(10,11) },
      { scaledScore: 8, REC: r(23,24), EXP: r(14,16), PER: r(13,15), IPR: r(15,17), PLA: r(12,13) },
      { scaledScore: 9, REC: r(25,27), EXP: r(17,19), PER: r(16,19), IPR: r(18,21), PLA: r(14,16) },
      { scaledScore: 10, REC: r(28,30), EXP: r(20,23), PER: r(20,23), IPR: r(20,23), PLA: r(17,18) },
      { scaledScore: 11, REC: r(31,33), EXP: r(24,26), PER: r(24,27), IPR: r(22,25), PLA: r(19,20) },
      { scaledScore: 12, REC: r(34,36), EXP: r(27,29), PER: r(28,31), IPR: r(26,28), PLA: r(21,22) },
      { scaledScore: 13, REC: r(37,38), EXP: r(30,33), PER: r(32,35), IPR: r(29,31), PLA: r(23,25) },
      { scaledScore: 14, REC: r(39,41), EXP: r(34,38), PER: r(36,39), IPR: r(32,35), PLA: r(26,27) },
      { scaledScore: 15, REC: r(41,42), EXP: r(39,42), PER: r(40,43), IPR: r(36,36), PLA: r(28,30) },
      { scaledScore: 16, REC: r(43,44), EXP: r(43,46), PER: r(44,48), IPR: r(37,37), PLA: r(31,32) },
      { scaledScore: 17, REC: r(45,45), EXP: r(47,50), PER: r(49,52), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 18, REC: r(46,46), EXP: r(51,54), PER: r(53,56), IPR: r(39,39), PLA: r(35,36) },
      { scaledScore: 19, REC: N, EXP: r(55,56), PER: r(57,60), IPR: r(40,40), PLA: r(37,38) },
    ],
  },
  {
    ageLabel: '19:00-19:30', minMonths: 19, maxMonths: 19,
    data: [
      { scaledScore: 1, REC: r(0,6), EXP: r(0,1), PER: r(0,3), IPR: r(0,5), PLA: r(0,1) },
      { scaledScore: 2, REC: r(7,9), EXP: r(2,3), PER: r(3,4), IPR: r(5,7), PLA: r(1,2) },
      { scaledScore: 3, REC: r(10,11), EXP: r(3,4), PER: r(5,6), IPR: r(8,9), PLA: r(2,3) },
      { scaledScore: 4, REC: r(12,14), EXP: r(5,6), PER: r(7,7), IPR: r(10,11), PLA: r(4,5) },
      { scaledScore: 5, REC: r(15,17), EXP: r(7,9), PER: r(7,9), IPR: r(12,14), PLA: r(6,7) },
      { scaledScore: 6, REC: r(18,20), EXP: r(10,11), PER: r(10,11), IPR: r(14,16), PLA: r(8,9) },
      { scaledScore: 7, REC: r(21,23), EXP: r(11,13), PER: r(12,13), IPR: r(17,18), PLA: r(10,12) },
      { scaledScore: 8, REC: r(24,26), EXP: r(14,16), PER: r(15,17), IPR: r(19,21), PLA: r(13,14) },
      { scaledScore: 9, REC: r(27,29), EXP: r(18,21), PER: r(19,22), IPR: r(22,25), PLA: r(15,17) },
      { scaledScore: 10, REC: r(30,31), EXP: r(23,25), PER: r(23,25), IPR: r(23,25), PLA: r(17,18) },
      { scaledScore: 11, REC: r(32,34), EXP: r(26,28), PER: r(26,29), IPR: r(26,29), PLA: r(19,20) },
      { scaledScore: 12, REC: r(35,37), EXP: r(29,31), PER: r(30,33), IPR: r(30,33), PLA: r(21,22) },
      { scaledScore: 13, REC: r(38,39), EXP: r(32,35), PER: r(34,37), IPR: r(33,37), PLA: r(23,25) },
      { scaledScore: 14, REC: r(39,40), EXP: r(36,39), PER: r(38,41), IPR: r(38,41), PLA: r(26,27) },
      { scaledScore: 15, REC: r(41,42), EXP: r(40,43), PER: r(42,45), IPR: r(36,36), PLA: r(28,30) },
      { scaledScore: 16, REC: r(43,44), EXP: r(44,48), PER: r(46,49), IPR: r(37,37), PLA: r(31,32) },
      { scaledScore: 17, REC: r(45,45), EXP: r(49,52), PER: r(50,53), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 18, REC: r(46,46), EXP: r(53,55), PER: r(54,56), IPR: r(39,39), PLA: r(35,36) },
      { scaledScore: 19, REC: N, EXP: r(56,56), PER: r(57,60), IPR: r(40,40), PLA: r(37,38) },
    ],
  },
  {
    ageLabel: '20:00-20:30', minMonths: 20, maxMonths: 20,
    data: [
      { scaledScore: 1, REC: r(0,8), EXP: r(0,1), PER: r(0,4), IPR: r(0,4), PLA: r(0,0) },
      { scaledScore: 2, REC: r(9,10), EXP: r(2,3), PER: r(5,6), IPR: r(5,8), PLA: r(1,2) },
      { scaledScore: 3, REC: r(11,12), EXP: r(4,5), PER: r(7,7), IPR: r(9,11), PLA: r(3,4) },
      { scaledScore: 4, REC: r(13,15), EXP: r(6,7), PER: r(8,9), IPR: r(12,14), PLA: r(5,6) },
      { scaledScore: 5, REC: r(16,18), EXP: r(8,10), PER: r(10,11), IPR: r(15,17), PLA: r(7,8) },
      { scaledScore: 6, REC: r(19,21), EXP: r(11,13), PER: r(12,13), IPR: r(18,19), PLA: r(9,10) },
      { scaledScore: 7, REC: r(22,24), EXP: r(14,16), PER: r(14,16), IPR: r(20,22), PLA: r(11,13) },
      { scaledScore: 8, REC: r(25,28), EXP: r(17,19), PER: r(17,19), IPR: r(23,24), PLA: r(14,15) },
      { scaledScore: 9, REC: r(28,30), EXP: r(20,23), PER: r(20,23), IPR: r(23,25), PLA: r(16,17) },
      { scaledScore: 10, REC: r(31,33), EXP: r(24,27), PER: r(24,27), IPR: r(27,29), PLA: r(18,19) },
      { scaledScore: 11, REC: r(34,35), EXP: r(28,31), PER: r(28,31), IPR: r(30,31), PLA: r(20,21) },
      { scaledScore: 12, REC: r(36,38), EXP: r(32,35), PER: r(32,35), IPR: r(32,33), PLA: r(22,24) },
      { scaledScore: 13, REC: r(39,40), EXP: r(36,39), PER: r(36,39), IPR: r(34,34), PLA: r(25,27) },
      { scaledScore: 14, REC: r(41,42), EXP: r(40,43), PER: r(40,43), IPR: r(35,35), PLA: r(28,29) },
      { scaledScore: 15, REC: r(43,43), EXP: r(44,47), PER: r(44,47), IPR: r(36,36), PLA: r(30,31) },
      { scaledScore: 16, REC: r(44,44), EXP: r(48,50), PER: r(48,51), IPR: r(37,37), PLA: r(32,34) },
      { scaledScore: 17, REC: r(45,46), EXP: r(51,53), PER: r(52,54), IPR: r(38,38), PLA: r(35,36) },
      { scaledScore: 18, REC: N, EXP: r(54,55), PER: r(55,58), IPR: r(39,39), PLA: r(37,37) },
      { scaledScore: 19, REC: N, EXP: r(56,56), PER: r(59,60), IPR: r(40,40), PLA: r(38,38) },
    ],
  },
  {
    ageLabel: '21:00-21:30', minMonths: 21, maxMonths: 21,
    data: [
      { scaledScore: 1, REC: r(0,9), EXP: r(0,2), PER: r(0,5), IPR: r(0,5), PLA: r(0,0) },
      { scaledScore: 2, REC: r(10,11), EXP: r(3,3), PER: r(6,7), IPR: r(6,8), PLA: r(1,2) },
      { scaledScore: 3, REC: r(12,13), EXP: r(4,5), PER: r(8,8), IPR: r(9,12), PLA: r(3,4) },
      { scaledScore: 4, REC: r(14,16), EXP: r(6,8), PER: r(9,11), IPR: r(13,15), PLA: r(5,6) },
      { scaledScore: 5, REC: r(17,19), EXP: r(9,11), PER: r(12,13), IPR: r(16,17), PLA: r(7,9) },
      { scaledScore: 6, REC: r(20,22), EXP: r(12,14), PER: r(14,15), IPR: r(18,20), PLA: r(10,11) },
      { scaledScore: 7, REC: r(23,25), EXP: r(15,18), PER: r(16,18), IPR: r(21,23), PLA: r(12,13) },
      { scaledScore: 8, REC: r(26,28), EXP: r(19,22), PER: r(19,21), IPR: r(24,25), PLA: r(14,16) },
      { scaledScore: 9, REC: r(29,31), EXP: r(23,25), PER: r(22,25), IPR: r(26,27), PLA: r(17,18) },
      { scaledScore: 10, REC: r(32,34), EXP: r(26,29), PER: r(26,29), IPR: r(28,29), PLA: r(19,20) },
      { scaledScore: 11, REC: r(35,36), EXP: r(30,33), PER: r(30,33), IPR: r(30,31), PLA: r(21,22) },
      { scaledScore: 12, REC: r(37,38), EXP: r(34,37), PER: r(34,37), IPR: r(32,33), PLA: r(23,25) },
      { scaledScore: 13, REC: r(39,40), EXP: r(38,41), PER: r(38,41), IPR: r(34,35), PLA: r(26,28) },
      { scaledScore: 14, REC: r(41,42), EXP: r(42,43), PER: r(42,46), IPR: r(36,36), PLA: r(29,30) },
      { scaledScore: 15, REC: r(43,44), EXP: r(44,47), PER: r(47,49), IPR: r(37,37), PLA: r(31,32) },
      { scaledScore: 16, REC: r(45,45), EXP: r(48,50), PER: r(50,53), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 17, REC: r(46,46), EXP: r(51,54), PER: r(54,56), IPR: N, PLA: r(35,36) },
      { scaledScore: 18, REC: N, EXP: r(55,56), PER: r(57,60), IPR: N, PLA: r(37,38) },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '22:00-22:30', minMonths: 22, maxMonths: 22,
    data: [
      { scaledScore: 1, REC: r(0,10), EXP: r(0,2), PER: r(0,6), IPR: r(0,5), PLA: r(0,0) },
      { scaledScore: 2, REC: r(11,12), EXP: r(3,4), PER: r(7,8), IPR: r(6,9), PLA: r(1,2) },
      { scaledScore: 3, REC: r(13,15), EXP: r(5,6), PER: r(9,10), IPR: r(10,12), PLA: r(3,4) },
      { scaledScore: 4, REC: r(16,18), EXP: r(7,9), PER: r(11,12), IPR: r(13,15), PLA: r(5,7) },
      { scaledScore: 5, REC: r(19,20), EXP: r(10,12), PER: r(13,15), IPR: r(16,18), PLA: r(8,10) },
      { scaledScore: 6, REC: r(21,23), EXP: r(13,16), PER: r(16,17), IPR: r(19,21), PLA: r(11,12) },
      { scaledScore: 7, REC: r(24,26), EXP: r(17,20), PER: r(18,20), IPR: r(22,24), PLA: r(13,14) },
      { scaledScore: 8, REC: r(27,29), EXP: r(21,24), PER: r(21,24), IPR: r(25,26), PLA: r(15,16) },
      { scaledScore: 9, REC: r(30,32), EXP: r(25,28), PER: r(25,27), IPR: r(27,28), PLA: r(17,19) },
      { scaledScore: 10, REC: r(33,35), EXP: r(29,32), PER: r(28,31), IPR: r(29,30), PLA: r(20,21) },
      { scaledScore: 11, REC: r(36,37), EXP: r(33,36), PER: r(32,35), IPR: r(31,32), PLA: r(22,23) },
      { scaledScore: 12, REC: r(38,39), EXP: r(37,39), PER: r(36,39), IPR: r(33,34), PLA: r(24,26) },
      { scaledScore: 13, REC: r(40,41), EXP: r(40,43), PER: r(40,43), IPR: r(35,36), PLA: r(27,29) },
      { scaledScore: 14, REC: r(42,43), EXP: r(44,47), PER: r(44,47), IPR: r(37,37), PLA: r(30,31) },
      { scaledScore: 15, REC: r(44,44), EXP: r(48,51), PER: r(48,51), IPR: r(38,38), PLA: r(32,33) },
      { scaledScore: 16, REC: r(45,45), EXP: r(52,53), PER: r(52,55), IPR: r(39,39), PLA: r(34,35) },
      { scaledScore: 17, REC: r(46,46), EXP: r(54,55), PER: r(56,57), IPR: N, PLA: r(36,37) },
      { scaledScore: 18, REC: N, EXP: r(56,56), PER: r(58,60), IPR: N, PLA: r(38,38) },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '23:00-23:30', minMonths: 23, maxMonths: 23,
    data: [
      { scaledScore: 1, REC: r(0,11), EXP: r(0,3), PER: r(0,7), IPR: r(0,6), PLA: r(0,1) },
      { scaledScore: 2, REC: r(12,13), EXP: r(4,5), PER: r(8,9), IPR: r(8,9), PLA: r(2,3) },
      { scaledScore: 3, REC: r(14,16), EXP: r(6,7), PER: r(10,11), IPR: r(10,13), PLA: r(4,5) },
      { scaledScore: 4, REC: r(17,19), EXP: r(8,10), PER: r(11,14), IPR: r(14,16), PLA: r(6,8) },
      { scaledScore: 5, REC: r(20,22), EXP: r(11,14), PER: r(14,16), IPR: r(17,18), PLA: r(9,10) },
      { scaledScore: 6, REC: r(23,25), EXP: r(15,18), PER: r(17,19), IPR: r(19,21), PLA: r(11,12) },
      { scaledScore: 7, REC: r(26,28), EXP: r(19,23), PER: r(20,22), IPR: r(22,24), PLA: r(13,15) },
      { scaledScore: 8, REC: r(29,31), EXP: r(24,27), PER: r(23,25), IPR: r(25,26), PLA: r(16,17) },
      { scaledScore: 9, REC: r(32,33), EXP: r(28,31), PER: r(26,29), IPR: r(27,28), PLA: r(18,20) },
      { scaledScore: 10, REC: r(34,36), EXP: r(32,35), PER: r(30,33), IPR: r(30,33), PLA: r(21,22) },
      { scaledScore: 11, REC: r(37,38), EXP: r(36,38), PER: r(34,37), IPR: r(31,32), PLA: r(23,24) },
      { scaledScore: 12, REC: r(39,40), EXP: r(39,42), PER: r(38,42), IPR: r(32,35), PLA: r(25,27) },
      { scaledScore: 13, REC: r(41,42), EXP: r(43,45), PER: r(43,46), IPR: r(35,36), PLA: r(28,30) },
      { scaledScore: 14, REC: r(43,43), EXP: r(46,49), PER: r(46,49), IPR: r(36,40), PLA: r(31,32) },
      { scaledScore: 15, REC: r(44,44), EXP: r(50,52), PER: r(49,52), IPR: r(37,37), PLA: r(32,33) },
      { scaledScore: 16, REC: r(45,46), EXP: r(52,54), PER: r(52,54), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 17, REC: N, EXP: r(54,55), PER: r(54,56), IPR: N, PLA: r(35,36) },
      { scaledScore: 18, REC: N, EXP: r(56,56), PER: r(57,60), IPR: N, PLA: r(37,38) },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  // Ages 24:00 through 42:30 use wider ranges
  {
    ageLabel: '24:00-25:30', minMonths: 24, maxMonths: 25,
    data: [
      { scaledScore: 1, REC: r(0,12), EXP: r(0,4), PER: r(0,8), IPR: r(0,7), PLA: r(0,1) },
      { scaledScore: 2, REC: r(13,15), EXP: r(5,6), PER: r(9,10), IPR: r(8,10), PLA: r(2,3) },
      { scaledScore: 3, REC: r(16,18), EXP: r(7,9), PER: r(11,12), IPR: r(11,13), PLA: r(4,5) },
      { scaledScore: 4, REC: r(19,21), EXP: r(10,13), PER: r(13,14), IPR: r(14,16), PLA: r(6,8) },
      { scaledScore: 5, REC: r(22,24), EXP: r(14,17), PER: r(15,17), IPR: r(17,19), PLA: r(9,11) },
      { scaledScore: 6, REC: r(25,27), EXP: r(18,22), PER: r(18,21), IPR: r(20,22), PLA: r(12,13) },
      { scaledScore: 7, REC: r(28,30), EXP: r(23,26), PER: r(22,24), IPR: r(23,25), PLA: r(14,16) },
      { scaledScore: 8, REC: r(31,32), EXP: r(27,30), PER: r(25,28), IPR: r(26,27), PLA: r(17,18) },
      { scaledScore: 9, REC: r(33,35), EXP: r(31,34), PER: r(29,32), IPR: r(28,29), PLA: r(19,21) },
      { scaledScore: 10, REC: r(36,37), EXP: r(35,37), PER: r(33,36), IPR: r(30,31), PLA: r(22,23) },
      { scaledScore: 11, REC: r(38,39), EXP: r(38,40), PER: r(37,40), IPR: r(32,33), PLA: r(24,25) },
      { scaledScore: 12, REC: r(40,41), EXP: r(41,44), PER: r(41,43), IPR: r(34,35), PLA: r(26,28) },
      { scaledScore: 13, REC: r(42,43), EXP: r(45,48), PER: r(44,47), IPR: r(36,37), PLA: r(29,31) },
      { scaledScore: 14, REC: r(44,44), EXP: r(49,51), PER: r(48,51), IPR: r(38,38), PLA: r(32,33) },
      { scaledScore: 15, REC: r(45,45), EXP: r(52,54), PER: r(52,54), IPR: r(39,39), PLA: r(34,35) },
      { scaledScore: 16, REC: r(46,46), EXP: r(55,57), PER: r(55,57), IPR: r(40,40), PLA: r(36,37) },
      { scaledScore: 17, REC: N, EXP: r(58,59), PER: r(58,60), IPR: N, PLA: r(38,38) },
      { scaledScore: 18, REC: N, EXP: r(60,60), PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '26:00-27:30', minMonths: 26, maxMonths: 27,
    data: [
      { scaledScore: 1, REC: r(0,14), EXP: r(0,5), PER: r(0,8), IPR: r(0,7), PLA: r(0,1) },
      { scaledScore: 2, REC: r(15,17), EXP: r(6,8), PER: r(9,10), IPR: r(8,11), PLA: r(2,3) },
      { scaledScore: 3, REC: r(18,20), EXP: r(9,12), PER: r(11,13), IPR: r(12,14), PLA: r(4,5) },
      { scaledScore: 4, REC: r(21,23), EXP: r(13,16), PER: r(13,16), IPR: r(15,17), PLA: r(6,8) },
      { scaledScore: 5, REC: r(24,26), EXP: r(17,20), PER: r(17,20), IPR: r(18,20), PLA: r(9,11) },
      { scaledScore: 6, REC: r(27,28), EXP: r(21,24), PER: r(21,23), IPR: r(21,22), PLA: r(12,14) },
      { scaledScore: 7, REC: r(29,31), EXP: r(25,29), PER: r(24,27), IPR: r(23,25), PLA: r(15,17) },
      { scaledScore: 8, REC: r(32,33), EXP: r(30,33), PER: r(27,30), IPR: r(26,27), PLA: r(18,19) },
      { scaledScore: 9, REC: r(34,36), EXP: r(34,36), PER: r(31,34), IPR: r(28,30), PLA: r(20,22) },
      { scaledScore: 10, REC: r(37,38), EXP: r(37,40), PER: r(35,38), IPR: r(31,32), PLA: r(23,24) },
      { scaledScore: 11, REC: r(39,40), EXP: r(41,43), PER: r(39,42), IPR: r(33,34), PLA: r(25,26) },
      { scaledScore: 12, REC: r(41,42), EXP: r(44,47), PER: r(43,45), IPR: r(34,37), PLA: r(27,29) },
      { scaledScore: 13, REC: r(43,43), EXP: r(48,50), PER: r(46,49), IPR: r(37,37), PLA: r(30,32) },
      { scaledScore: 14, REC: r(44,44), EXP: r(51,52), PER: r(50,53), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 15, REC: r(45,45), EXP: r(53,54), PER: r(53,55), IPR: r(39,39), PLA: r(35,36) },
      { scaledScore: 16, REC: r(46,46), EXP: r(55,56), PER: r(56,58), IPR: r(40,40), PLA: r(37,38) },
      { scaledScore: 17, REC: N, EXP: N, PER: r(59,59), IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: r(60,60), IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '28:00-29:30', minMonths: 28, maxMonths: 29,
    data: [
      { scaledScore: 1, REC: r(0,16), EXP: r(0,6), PER: r(0,9), IPR: r(0,8), PLA: r(0,1) },
      { scaledScore: 2, REC: r(17,19), EXP: r(7,9), PER: r(10,11), IPR: r(9,11), PLA: r(2,3) },
      { scaledScore: 3, REC: r(20,22), EXP: r(10,13), PER: r(12,14), IPR: r(12,15), PLA: r(4,6
) },
      { scaledScore: 4, REC: r(23,24), EXP: r(14,18), PER: r(15,17), IPR: r(16,18), PLA: r(7,9) },
      { scaledScore: 5, REC: r(25,27), EXP: r(19,22), PER: r(18,21), IPR: r(19,21), PLA: r(10,12) },
      { scaledScore: 6, REC: r(28,29), EXP: r(23,26), PER: r(22,25), IPR: r(22,23), PLA: r(13,15) },
      { scaledScore: 7, REC: r(30,32), EXP: r(27,31), PER: r(26,28), IPR: r(24,26), PLA: r(16,18) },
      { scaledScore: 8, REC: r(33,34), EXP: r(32,35), PER: r(29,32), IPR: r(27,28), PLA: r(19,20) },
      { scaledScore: 9, REC: r(35,37), EXP: r(36,38), PER: r(33,36), IPR: r(29,31), PLA: r(21,23) },
      { scaledScore: 10, REC: r(38,39), EXP: r(39,42), PER: r(37,40), IPR: r(32,33), PLA: r(24,25) },
      { scaledScore: 11, REC: r(40,41), EXP: r(43,45), PER: r(41,44), IPR: r(34,35), PLA: r(26,27) },
      { scaledScore: 12, REC: r(42,42), EXP: r(46,49), PER: r(45,47), IPR: r(36,37), PLA: r(28,30) },
      { scaledScore: 13, REC: r(43,43), EXP: r(50,52), PER: r(48,50), IPR: r(38,38), PLA: r(31,32) },
      { scaledScore: 14, REC: r(44,44), EXP: r(53,54), PER: r(51,53), IPR: r(39,39), PLA: r(33,34) },
      { scaledScore: 15, REC: r(45,45), EXP: r(55,55), PER: r(54,56), IPR: r(40,40), PLA: r(35,36) },
      { scaledScore: 16, REC: r(46,46), EXP: r(56,56), PER: r(57,58), IPR: N, PLA: r(37,38) },
      { scaledScore: 17, REC: N, EXP: N, PER: r(59,60), IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '30:00-31:30', minMonths: 30, maxMonths: 31,
    data: [
      { scaledScore: 1, REC: r(0,17), EXP: r(0,7), PER: r(0,10), IPR: r(0,9), PLA: r(0,2) },
      { scaledScore: 2, REC: r(18,20), EXP: r(8,11), PER: r(11,12), IPR: r(10,12), PLA: r(3,4) },
      { scaledScore: 3, REC: r(21,22), EXP: r(12,16), PER: r(13,15), IPR: r(13,16), PLA: r(5,7) },
      { scaledScore: 4, REC: r(23,25), EXP: r(17,21), PER: r(16,18), IPR: r(17,19), PLA: r(8,10) },
      { scaledScore: 5, REC: r(26,27), EXP: r(22,25), PER: r(19,22), IPR: r(20,22), PLA: r(11,13) },
      { scaledScore: 6, REC: r(28,30), EXP: r(26,29), PER: r(23,26), IPR: r(23,24), PLA: r(14,16) },
      { scaledScore: 7, REC: r(31,33), EXP: r(30,33), PER: r(27,30), IPR: r(25,27), PLA: r(17,19) },
      { scaledScore: 8, REC: r(34,36), EXP: r(34,37), PER: r(31,34), IPR: r(28,29), PLA: r(20,21) },
      { scaledScore: 9, REC: r(37,38), EXP: r(38,40), PER: r(35,38), IPR: r(30,32), PLA: r(22,24) },
      { scaledScore: 10, REC: r(39,40), EXP: r(41,41), PER: r(40,43), IPR: r(33,34), PLA: r(25,26) },
      { scaledScore: 11, REC: r(41,41), EXP: r(45,48), PER: r(44,46), IPR: r(35,36), PLA: r(27,28) },
      { scaledScore: 12, REC: r(42,42), EXP: r(49,51), PER: r(47,49), IPR: r(37,37), PLA: r(29,31) },
      { scaledScore: 13, REC: r(43,43), EXP: r(52,53), PER: r(50,52), IPR: r(38,38), PLA: r(32,33) },
      { scaledScore: 14, REC: r(44,44), EXP: r(54,54), PER: r(53,55), IPR: r(39,39), PLA: r(34,35) },
      { scaledScore: 15, REC: r(45,46), EXP: r(55,56), PER: r(56,57), IPR: r(40,40), PLA: r(36,37) },
      { scaledScore: 16, REC: N, EXP: N, PER: r(58,59), IPR: N, PLA: r(38,38) },
      { scaledScore: 17, REC: N, EXP: N, PER: r(60,60), IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '32:00-33:30', minMonths: 32, maxMonths: 33,
    data: [
      { scaledScore: 1, REC: r(0,18), EXP: r(0,9), PER: r(0,10), IPR: r(0,10), PLA: r(0,2) },
      { scaledScore: 2, REC: r(19,20), EXP: r(10,13), PER: r(11,13), IPR: r(11,13), PLA: r(3,4) },
      { scaledScore: 3, REC: r(21,23), EXP: r(14,17), PER: r(14,17), IPR: r(14,17), PLA: r(5,7) },
      { scaledScore: 4, REC: r(24,26), EXP: r(18,22), PER: r(17,20), IPR: r(18,20), PLA: r(8,10) },
      { scaledScore: 5, REC: r(27,28), EXP: r(23,27), PER: r(21,24), IPR: r(21,22), PLA: r(11,13) },
      { scaledScore: 6, REC: r(29,31), EXP: r(28,31), PER: r(25,28), IPR: r(23,25), PLA: r(14,16) },
      { scaledScore: 7, REC: r(32,34), EXP: r(32,35), PER: r(29,32), IPR: r(26,28), PLA: r(17,19) },
      { scaledScore: 8, REC: r(35,36), EXP: r(36,39), PER: r(33,36), IPR: r(29,30), PLA: r(20,22) },
      { scaledScore: 9, REC: r(37,39), EXP: r(40,42), PER: r(37,41), IPR: r(31,33), PLA: r(23,25) },
      { scaledScore: 10, REC: r(40,41), EXP: r(43,46), PER: r(42,45), IPR: r(34,35), PLA: r(26,27) },
      { scaledScore: 11, REC: r(42,42), EXP: r(47,49), PER: r(46,49), IPR: r(36,37), PLA: r(28,29) },
      { scaledScore: 12, REC: r(43,43), EXP: r(50,52), PER: r(50,52), IPR: r(38,38), PLA: r(30,32) },
      { scaledScore: 13, REC: r(44,44), EXP: r(53,55), PER: r(53,55), IPR: r(39,39), PLA: r(33,34) },
      { scaledScore: 14, REC: r(45,45), EXP: r(55,55), PER: r(56,57), IPR: r(40,40), PLA: r(35,36) },
      { scaledScore: 15, REC: N, EXP: r(56,56), PER: r(58,58), IPR: N, PLA: r(37,37) },
      { scaledScore: 16, REC: r(46,46), EXP: N, PER: r(59,59), IPR: N, PLA: r(38,38) },
      { scaledScore: 17, REC: N, EXP: N, PER: r(60,60), IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '34:00-35:30', minMonths: 34, maxMonths: 35,
    data: [
      { scaledScore: 1, REC: r(0,19), EXP: r(0,11), PER: r(0,11), IPR: r(0,10), PLA: r(0,3) },
      { scaledScore: 2, REC: r(20,21), EXP: r(12,15), PER: r(12,14), IPR: r(11,13), PLA: r(4,5) },
      { scaledScore: 3, REC: r(22,24), EXP: r(16,20), PER: r(15,17), IPR: r(14,17), PLA: r(6,8) },
      { scaledScore: 4, REC: r(25,27), EXP: r(21,25), PER: r(18,21), IPR: r(18,20), PLA: r(9,11) },
      { scaledScore: 5, REC: r(28,29), EXP: r(26,30), PER: r(22,26), IPR: r(21,23), PLA: r(12,14) },
      { scaledScore: 6, REC: r(30,32), EXP: r(31,34), PER: r(27,30), IPR: r(24,26), PLA: r(15,17) },
      { scaledScore: 7, REC: r(33,35), EXP: r(35,38), PER: r(31,34), IPR: r(27,28), PLA: r(18,20) },
      { scaledScore: 8, REC: r(36,38), EXP: r(39,41), PER: r(35,38), IPR: r(29,30), PLA: r(21,22) },
      { scaledScore: 9, REC: r(39,40), EXP: r(42,44), PER: r(39,41), IPR: r(31,33), PLA: r(23,25) },
      { scaledScore: 10, REC: r(41,42), EXP: r(45,47), PER: r(45,47), IPR: r(34,35), PLA: r(26,27) },
      { scaledScore: 11, REC: r(43,43), EXP: N, PER: r(48,50), IPR: r(36,37), PLA: r(28,30) },
      { scaledScore: 12, REC: r(44,44), EXP: r(54,55), PER: r(51,53), IPR: r(38,39), PLA: r(31,32) },
      { scaledScore: 13, REC: r(45,45), EXP: r(55,56), PER: r(55,56), IPR: r(40,40), PLA: r(33,35) },
      { scaledScore: 14, REC: r(46,46), EXP: r(56,56), PER: r(57,58), IPR: N, PLA: r(36,37) },
      { scaledScore: 15, REC: N, EXP: N, PER: r(59,59), IPR: N, PLA: r(38,38) },
      { scaledScore: 16, REC: N, EXP: N, PER: r(60,60), IPR: N, PLA: N },
      { scaledScore: 17, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '36:00-37:30', minMonths: 36, maxMonths: 37,
    data: [
      { scaledScore: 1, REC: r(0,20), EXP: r(0,13), PER: r(0,12), IPR: r(0,11), PLA: r(0,3) },
      { scaledScore: 2, REC: r(21,22), EXP: r(14,18), PER: r(13,15), IPR: r(12,14), PLA: r(4,5) },
      { scaledScore: 3, REC: r(23,25), EXP: r(19,23), PER: r(16,18), IPR: r(15,18), PLA: r(6,8) },
      { scaledScore: 4, REC: r(26,28), EXP: r(24,28), PER: r(19,22), IPR: r(19,21), PLA: r(9,11) },
      { scaledScore: 5, REC: r(29,31), EXP: r(29,32), PER: r(23,27), IPR: r(22,24), PLA: r(12,15) },
      { scaledScore: 6, REC: r(32,34), EXP: r(33,36), PER: r(28,31), IPR: r(25,27), PLA: r(16,18) },
      { scaledScore: 7, REC: r(35,37), EXP: r(37,40), PER: r(32,35), IPR: r(28,29), PLA: r(19,21) },
      { scaledScore: 8, REC: r(38,39), EXP: r(41,43), PER: r(36,40), IPR: r(30,31), PLA: r(22,23) },
      { scaledScore: 9, REC: r(40,41), EXP: r(44,46), PER: r(41,45), IPR: r(32,33), PLA: r(24,26) },
      { scaledScore: 10, REC: r(42,42), EXP: r(47,49), PER: r(46,49), IPR: r(34,35), PLA: r(27,28) },
      { scaledScore: 11, REC: r(43,43), EXP: r(50,52), PER: r(50,52), IPR: r(36,37), PLA: r(29,31) },
      { scaledScore: 12, REC: r(44,44), EXP: r(53,54), PER: r(53,55), IPR: r(38,39), PLA: r(32,33) },
      { scaledScore: 13, REC: N, EXP: r(55,55), PER: r(56,57), IPR: r(40,40), PLA: r(34,35) },
      { scaledScore: 14, REC: r(45,45), EXP: r(56,56), PER: r(58,59), IPR: N, PLA: r(36,37) },
      { scaledScore: 15, REC: N, EXP: N, PER: r(60,60), IPR: N, PLA: r(38,38) },
      { scaledScore: 16, REC: r(46,46), EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 17, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '38:00-39:30', minMonths: 38, maxMonths: 39,
    data: [
      { scaledScore: 1, REC: r(0,21), EXP: r(0,15), PER: r(0,13), IPR: r(0,12), PLA: r(0,4) },
      { scaledScore: 2, REC: r(22,23), EXP: r(16,20), PER: r(14,16), IPR: r(13,15), PLA: r(5,6) },
      { scaledScore: 3, REC: r(24,26), EXP: r(21,25), PER: r(17,19), IPR: r(16,19), PLA: r(7,9) },
      { scaledScore: 4, REC: r(27,29), EXP: r(26,30), PER: r(20,23), IPR: r(20,22), PLA: r(10,12) },
      { scaledScore: 5, REC: r(30,32), EXP: r(31,34), PER: r(24,28), IPR: r(23,25), PLA: r(13,16) },
      { scaledScore: 6, REC: r(33,35), EXP: r(35,38), PER: r(29,33), IPR: r(26,27), PLA: r(17,19) },
      { scaledScore: 7, REC: r(36,38), EXP: r(39,42), PER: r(34,37), IPR: r(28,30), PLA: r(20,22) },
      { scaledScore: 8, REC: r(39,40), EXP: r(43,45), PER: r(38,42), IPR: r(31,32), PLA: r(23,24) },
      { scaledScore: 9, REC: r(41,41), EXP: r(46,48), PER: r(43,47), IPR: r(33,34), PLA: r(25,27) },
      { scaledScore: 10, REC: r(42,42), EXP: r(49,51), PER: r(48,51), IPR: r(35,36), PLA: r(28,29) },
      { scaledScore: 11, REC: r(43,43), EXP: r(52,53), PER: r(52,54), IPR: r(37,37), PLA: r(30,32) },
      { scaledScore: 12, REC: r(44,44), EXP: r(54,54), PER: r(55,57), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 13, REC: N, EXP: r(55,55), PER: r(58,59), IPR: r(39,39), PLA: r(35,36) },
      { scaledScore: 14, REC: r(45,46), EXP: r(56,56), PER: r(60,60), IPR: r(40,40), PLA: r(37,37) },
      { scaledScore: 15, REC: N, EXP: N, PER: N, IPR: N, PLA: r(38,38) },
      { scaledScore: 16, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 17, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
  {
    ageLabel: '40:00-42:30', minMonths: 40, maxMonths: 42,
    data: [
      { scaledScore: 1, REC: r(0,22), EXP: r(0,17), PER: r(0,14), IPR: r(0,13), PLA: r(0,5) },
      { scaledScore: 2, REC: r(23,24), EXP: r(18,22), PER: r(15,17), IPR: r(14,16), PLA: r(6,7) },
      { scaledScore: 3, REC: r(25,27), EXP: r(23,27), PER: r(18,21), IPR: r(17,20), PLA: r(8,10) },
      { scaledScore: 4, REC: r(28,30), EXP: r(28,32), PER: r(22,25), IPR: r(21,23), PLA: r(11,13) },
      { scaledScore: 5, REC: r(31,33), EXP: r(33,36), PER: r(26,30), IPR: r(24,26), PLA: r(14,17) },
      { scaledScore: 6, REC: r(34,36), EXP: r(37,40), PER: r(31,35), IPR: r(27,28), PLA: r(18,20) },
      { scaledScore: 7, REC: r(37,39), EXP: r(41,44), PER: r(36,39), IPR: r(29,31), PLA: r(21,23) },
      { scaledScore: 8, REC: r(40,41), EXP: r(45,47), PER: r(40,43), IPR: r(32,33), PLA: r(24,25) },
      { scaledScore: 9, REC: r(42,42), EXP: r(48,50), PER: r(44,48), IPR: r(34,35), PLA: r(26,28) },
      { scaledScore: 10, REC: r(43,43), EXP: r(51,52), PER: r(49,52), IPR: r(36,36), PLA: r(29,30) },
      { scaledScore: 11, REC: r(44,44), EXP: r(53,53), PER: r(53,55), IPR: r(37,37), PLA: r(31,32) },
      { scaledScore: 12, REC: N, EXP: r(54,54), PER: r(56,58), IPR: r(38,38), PLA: r(33,34) },
      { scaledScore: 13, REC: N, EXP: r(55,55), PER: r(59,60), IPR: r(39,39), PLA: r(35,36) },
      { scaledScore: 14, REC: N, EXP: r(56,56), PER: N, IPR: r(40,40), PLA: r(37,37) },
      { scaledScore: 15, REC: r(45,46), EXP: N, PER: N, IPR: N, PLA: r(38,38) },
      { scaledScore: 16, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 17, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 18, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
      { scaledScore: 19, REC: N, EXP: N, PER: N, IPR: N, PLA: N },
    ],
  },
];

// ============================================================
// Table A.5: Standard Score Norms for Adaptive Behavior Scale
// Maps sum of scaled scores → Standard Score + Percentile Rank
// Composites: COM (REC+EXP), DLS (PER), SOC (IPR+PLA), ADBE (all 5)
// ============================================================

export interface ABCompositeEntry {
  standardScore: number;
  percentileRank: number;
  COM: number | null;  // sum of scaled scores needed
  DLS: number | null;
  SOC: number | null;
  ADBE: number | null;
}

export const AB_COMPOSITE_TABLE: ABCompositeEntry[] = [
  { standardScore: 40, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 5 },
  { standardScore: 41, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 6 },
  { standardScore: 42, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 43, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 7 },
  { standardScore: 44, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 45, percentileRank: 0.1, COM: 2, DLS: N, SOC: 2, ADBE: 8 },
  { standardScore: 46, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 47, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 9 },
  { standardScore: 48, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 49, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 10 },
  { standardScore: 50, percentileRank: 0.1, COM: 3, DLS: N, SOC: 3, ADBE: N },
  { standardScore: 51, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 11 },
  { standardScore: 52, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 53, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: 12 },
  { standardScore: 54, percentileRank: 0.1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 55, percentileRank: 0.1, COM: 4, DLS: 1, SOC: N, ADBE: 13 },
  { standardScore: 56, percentileRank: 0.2, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 57, percentileRank: 0.2, COM: N, DLS: N, SOC: N, ADBE: 14 },
  { standardScore: 58, percentileRank: 0.3, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 59, percentileRank: 0.3, COM: 5, DLS: N, SOC: 5, ADBE: 15 },
  { standardScore: 60, percentileRank: 0.4, COM: N, DLS: 2, SOC: N, ADBE: N },
  { standardScore: 61, percentileRank: 0.5, COM: N, DLS: N, SOC: N, ADBE: 16 },
  { standardScore: 62, percentileRank: 0.5, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 63, percentileRank: 1, COM: 6, DLS: N, SOC: 6, ADBE: 17 },
  { standardScore: 64, percentileRank: 1, COM: N, DLS: N, SOC: N, ADBE: 18 },
  { standardScore: 65, percentileRank: 1, COM: N, DLS: 3, SOC: N, ADBE: N },
  { standardScore: 66, percentileRank: 1, COM: 7, DLS: N, SOC: N, ADBE: 19 },
  { standardScore: 67, percentileRank: 1, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 68, percentileRank: 2, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 69, percentileRank: 2, COM: N, DLS: N, SOC: N, ADBE: 20 },
  { standardScore: 70, percentileRank: 2, COM: 8, DLS: 4, SOC: 8, ADBE: 22 },
  { standardScore: 71, percentileRank: 3, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 72, percentileRank: 3, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 73, percentileRank: 4, COM: 9, DLS: N, SOC: 9, ADBE: 23 },
  { standardScore: 74, percentileRank: 4, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 75, percentileRank: 5, COM: N, DLS: 5, SOC: 10, ADBE: 27 },
  { standardScore: 76, percentileRank: 5, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 77, percentileRank: 6, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 78, percentileRank: 7, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 79, percentileRank: 8, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 80, percentileRank: 9, COM: 10, DLS: 6, SOC: N, ADBE: 34 },
  { standardScore: 81, percentileRank: 10, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 82, percentileRank: 12, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 83, percentileRank: 13, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 84, percentileRank: 14, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 85, percentileRank: 16, COM: N, DLS: 7, SOC: N, ADBE: 38 },
  { standardScore: 86, percentileRank: 18, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 87, percentileRank: 19, COM: 17, DLS: N, SOC: 17, ADBE: 44 },
  { standardScore: 88, percentileRank: 21, COM: N, DLS: 8, SOC: N, ADBE: N },
  { standardScore: 89, percentileRank: 23, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 90, percentileRank: 25, COM: N, DLS: N, SOC: N, ADBE: 43 },
  { standardScore: 91, percentileRank: 27, COM: N, DLS: N, SOC: 17, ADBE: 44 },
  { standardScore: 92, percentileRank: 30, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 93, percentileRank: 32, COM: N, DLS: 9, SOC: N, ADBE: N },
  { standardScore: 94, percentileRank: 34, COM: 18, DLS: N, SOC: 18, ADBE: 46 },
  { standardScore: 95, percentileRank: 37, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 96, percentileRank: 39, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 97, percentileRank: 42, COM: 19, DLS: N, SOC: 19, ADBE: N },
  { standardScore: 98, percentileRank: 45, COM: N, DLS: N, SOC: N, ADBE: 48 },
  { standardScore: 99, percentileRank: 47, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 100, percentileRank: 50, COM: 20, DLS: 10, SOC: 20, ADBE: 50 },
  { standardScore: 101, percentileRank: 53, COM: N, DLS: N, SOC: N, ADBE: 51 },
  { standardScore: 102, percentileRank: 55, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 103, percentileRank: 58, COM: N, DLS: N, SOC: 21, ADBE: 53 },
  { standardScore: 104, percentileRank: 61, COM: 21, DLS: N, SOC: N, ADBE: N },
  { standardScore: 105, percentileRank: 63, COM: N, DLS: 11, SOC: N, ADBE: 54 },
  { standardScore: 106, percentileRank: 66, COM: N, DLS: N, SOC: 22, ADBE: N },
  { standardScore: 107, percentileRank: 68, COM: 22, DLS: N, SOC: N, ADBE: N },
  { standardScore: 108, percentileRank: 70, COM: N, DLS: N, SOC: 23, ADBE: 56 },
  { standardScore: 109, percentileRank: 73, COM: N, DLS: N, SOC: N, ADBE: 57 },
  { standardScore: 110, percentileRank: 75, COM: 23, DLS: 12, SOC: N, ADBE: N },
  { standardScore: 111, percentileRank: 77, COM: N, DLS: N, SOC: 24, ADBE: 58 },
  { standardScore: 112, percentileRank: 79, COM: 24, DLS: N, SOC: N, ADBE: 59 },
  { standardScore: 113, percentileRank: 81, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 114, percentileRank: 82, COM: N, DLS: N, SOC: 25, ADBE: 60 },
  { standardScore: 115, percentileRank: 84, COM: N, DLS: 13, SOC: N, ADBE: N },
  { standardScore: 116, percentileRank: 86, COM: 26, DLS: N, SOC: 26, ADBE: 63 },
  { standardScore: 117, percentileRank: 87, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 118, percentileRank: 88, COM: 27, DLS: N, SOC: N, ADBE: N },
  { standardScore: 119, percentileRank: 90, COM: N, DLS: N, SOC: 27, ADBE: N },
  { standardScore: 120, percentileRank: 91, COM: 28, DLS: 14, SOC: N, ADBE: 66 },
  { standardScore: 121, percentileRank: 92, COM: N, DLS: N, SOC: N, ADBE: 67 },
  { standardScore: 122, percentileRank: 93, COM: N, DLS: N, SOC: 28, ADBE: 68 },
  { standardScore: 123, percentileRank: 94, COM: 29, DLS: N, SOC: N, ADBE: 69 },
  { standardScore: 124, percentileRank: 95, COM: N, DLS: N, SOC: N, ADBE: 70 },
  { standardScore: 125, percentileRank: 95, COM: N, DLS: 15, SOC: N, ADBE: 71 },
  { standardScore: 126, percentileRank: 96, COM: 31, DLS: N, SOC: 30, ADBE: 72 },
  { standardScore: 127, percentileRank: 96, COM: N, DLS: N, SOC: N, ADBE: 73 },
  { standardScore: 128, percentileRank: 97, COM: N, DLS: N, SOC: 31, ADBE: 74 },
  { standardScore: 129, percentileRank: 97, COM: 32, DLS: N, SOC: N, ADBE: 75 },
  { standardScore: 130, percentileRank: 98, COM: N, DLS: 16, SOC: N, ADBE: 76 },
  { standardScore: 131, percentileRank: 98, COM: N, DLS: N, SOC: 32, ADBE: 77 },
  { standardScore: 132, percentileRank: 98, COM: N, DLS: N, SOC: N, ADBE: 78 },
  { standardScore: 133, percentileRank: 99, COM: 33, DLS: N, SOC: N, ADBE: 79 },
  { standardScore: 134, percentileRank: 99, COM: N, DLS: N, SOC: N, ADBE: 80 },
  { standardScore: 135, percentileRank: 99, COM: N, DLS: 17, SOC: N, ADBE: 81 },
  { standardScore: 136, percentileRank: 99, COM: N, DLS: N, SOC: N, ADBE: 82 },
  { standardScore: 137, percentileRank: 99, COM: 34, DLS: N, SOC: 34, ADBE: N },
  { standardScore: 138, percentileRank: 99, COM: N, DLS: N, SOC: N, ADBE: 83 },
  { standardScore: 139, percentileRank: 99.5, COM: N, DLS: N, SOC: N, ADBE: 84 },
  { standardScore: 140, percentileRank: 99.6, COM: N, DLS: 18, SOC: 35, ADBE: N },
  { standardScore: 141, percentileRank: 99.7, COM: 35, DLS: N, SOC: N, ADBE: 85 },
  { standardScore: 142, percentileRank: 99.7, COM: N, DLS: N, SOC: N, ADBE: 86 },
  { standardScore: 143, percentileRank: 99.8, COM: N, DLS: N, SOC: 35, ADBE: N },
  { standardScore: 144, percentileRank: 99.8, COM: N, DLS: N, SOC: N, ADBE: 87 },
  { standardScore: 145, percentileRank: 99.9, COM: 36, DLS: 19, SOC: 36, ADBE: N },
  { standardScore: 146, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 88 },
  { standardScore: 147, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 148, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 89 },
  { standardScore: 149, percentileRank: 99.9, COM: N, DLS: N, SOC: 37, ADBE: N },
  { standardScore: 150, percentileRank: 99.9, COM: 37, DLS: N, SOC: 37, ADBE: 90 },
  { standardScore: 151, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 152, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 91 },
  { standardScore: 153, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 154, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 92 },
  { standardScore: 155, percentileRank: 99.9, COM: 38, DLS: N, SOC: 38, ADBE: N },
  { standardScore: 156, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 93 },
  { standardScore: 157, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 158, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 94 },
  { standardScore: 159, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: N },
  { standardScore: 160, percentileRank: 99.9, COM: N, DLS: N, SOC: N, ADBE: 95 },
];

// Confidence intervals for Table A.5
export const AB_COMPOSITE_CONFIDENCE = {
  '90%': { COM: 4, DLS: 6, SOC: 5, ADBE: 3 },
  '95%': { COM: 5, DLS: 8, SOC: 6, ADBE: 4 },
};

// ============================================================
// Lookup Functions
// ============================================================

/**
 * Look up Social-Emotional scaled score from total raw score and age in months
 */
export function lookupSEScaledScore(totalRawScore: number, ageMonths: number): number | null {
  const ageGroup = SE_SCALED_SCORE_TABLES.find(g => ageMonths >= g.minMonths && ageMonths <= g.maxMonths);
  if (!ageGroup) return null;
  for (const range of ageGroup.ranges) {
    if (totalRawScore >= range.minRaw && totalRawScore <= range.maxRaw) {
      return range.scaledScore;
    }
  }
  return null;
}

/**
 * Look up Adaptive Behavior subscale scaled score from raw score, age in months, and subscale
 */
export function lookupABScaledScore(
  rawScore: number,
  ageMonths: number,
  subscale: 'REC' | 'EXP' | 'PER' | 'IPR' | 'PLA'
): number | null {
  const ageGroup = AB_SCALED_SCORE_TABLES.find(g => ageMonths >= g.minMonths && ageMonths <= g.maxMonths);
  if (!ageGroup) return null;
  for (const entry of ageGroup.data) {
    const range = entry[subscale];
    if (range && rawScore >= range[0] && rawScore <= range[1]) {
      return entry.scaledScore;
    }
  }
  return null;
}

/**
 * Look up Adaptive Behavior composite standard score from sum of scaled scores
 * composite: COM (REC+EXP), DLS (PER only), SOC (IPR+PLA), ADBE (all 5)
 */
export function lookupABCompositeScore(
  sumOfScaledScores: number,
  composite: 'COM' | 'DLS' | 'SOC' | 'ADBE'
): { standardScore: number; percentileRank: number } | null {
  for (const entry of AB_COMPOSITE_TABLE) {
    if (entry[composite] === sumOfScaledScores) {
      return { standardScore: entry.standardScore, percentileRank: entry.percentileRank };
    }
  }
  return null;
}

/**
 * Map DAYC-2 domain IDs to Bayley-4 AB subscales for cross-scoring
 * DAYC-2 domains → Bayley-4 AB subscales:
 *   socialemotional → uses SE scale (Table A.2) — total raw score
 *   adaptivebahavior → PER (Personal) subscale
 *   receptivecomm → REC (Receptive Communication) subscale
 *   expressivecomm → EXP (Expressive Communication) subscale
 */
export const DAYC2_TO_BAYLEY4_AB_MAP: Record<string, {
  type: 'ab_subscale' | 'se_scale';
  subscale?: 'REC' | 'EXP' | 'PER' | 'IPR' | 'PLA';
  label: string;
}> = {
  'socialemotional': { type: 'se_scale', label: 'Social-Emotional (Bayley-4)' },
  'adaptivebahavior': { type: 'ab_subscale', subscale: 'PER', label: 'Personal (Bayley-4 AB)' },
  'receptivecomm': { type: 'ab_subscale', subscale: 'REC', label: 'Receptive Communication (Bayley-4 AB)' },
  'expressivecomm': { type: 'ab_subscale', subscale: 'EXP', label: 'Expressive Communication (Bayley-4 AB)' },
};

/**
 * Cross-score a DAYC-2 domain using Bayley-4 Adaptive Behavior norms
 * Returns scaled score from the appropriate Bayley-4 table
 */
export function lookupDAYC2WithBayley4AB(
  rawScore: number,
  ageMonths: number,
  dayc2DomainId: string
): { scaledScore: number | null; label: string } {
  const mapping = DAYC2_TO_BAYLEY4_AB_MAP[dayc2DomainId];
  if (!mapping) return { scaledScore: null, label: 'Unknown' };

  if (mapping.type === 'se_scale') {
    return {
      scaledScore: lookupSEScaledScore(rawScore, ageMonths),
      label: mapping.label,
    };
  }

  if (mapping.type === 'ab_subscale' && mapping.subscale) {
    return {
      scaledScore: lookupABScaledScore(rawScore, ageMonths, mapping.subscale),
      label: mapping.label,
    };
  }

  return { scaledScore: null, label: mapping.label };
}


/**
 * Compute all Bayley-4 Adaptive Behavior composite scores from DAYC-2 domain raw scores.
 * 
 * Composites:
 *   COM = Communication (REC + EXP scaled scores)
 *   DLS = Daily Living Skills (PER scaled score only)
 *   SOC = Socialization (IPR + PLA scaled scores) — not available from DAYC-2 domains
 *   ADBE = Adaptive Behavior (sum of all 5 subscale scaled scores) — partial from DAYC-2
 *
 * Since DAYC-2 only maps to REC, EXP, and PER subscales, we can compute:
 *   - COM composite (REC + EXP)
 *   - DLS composite (PER only)
 *   - Partial ADBE (REC + EXP + PER, without IPR and PLA)
 *   - SOC is NOT available from DAYC-2 domains
 */
export interface CompositeResult {
  composite: string;
  fullName: string;
  sumOfScaledScores: number;
  standardScore: number | null;
  percentileRank: number | null;
  confidence90: string;
  confidence95: string;
  available: boolean;
  note?: string;
}

export function computeDAYC2BayleyComposites(
  domainScaledScores: Record<string, number | null>,
  // domainScaledScores keys: 'receptivecomm', 'expressivecomm', 'adaptivebahavior'
): CompositeResult[] {
  const recScaled = domainScaledScores['receptivecomm'];
  const expScaled = domainScaledScores['expressivecomm'];
  const perScaled = domainScaledScores['adaptivebahavior']; // maps to PER

  const results: CompositeResult[] = [];

  // COM = Communication (REC + EXP)
  if (recScaled !== null && recScaled !== undefined && expScaled !== null && expScaled !== undefined) {
    const comSum = recScaled + expScaled;
    const comResult = lookupABCompositeScore(comSum, 'COM');
    results.push({
      composite: 'COM',
      fullName: 'Communication',
      sumOfScaledScores: comSum,
      standardScore: comResult?.standardScore ?? null,
      percentileRank: comResult?.percentileRank ?? null,
      confidence90: comResult ? `${comResult.standardScore - AB_COMPOSITE_CONFIDENCE['90%'].COM}–${comResult.standardScore + AB_COMPOSITE_CONFIDENCE['90%'].COM}` : '—',
      confidence95: comResult ? `${comResult.standardScore - AB_COMPOSITE_CONFIDENCE['95%'].COM}–${comResult.standardScore + AB_COMPOSITE_CONFIDENCE['95%'].COM}` : '—',
      available: true,
    });
  } else {
    results.push({
      composite: 'COM',
      fullName: 'Communication',
      sumOfScaledScores: 0,
      standardScore: null,
      percentileRank: null,
      confidence90: '—',
      confidence95: '—',
      available: false,
      note: 'Requires both Receptive and Expressive Communication domains',
    });
  }

  // DLS = Daily Living Skills (PER only)
  if (perScaled !== null && perScaled !== undefined) {
    const dlsSum = perScaled;
    const dlsResult = lookupABCompositeScore(dlsSum, 'DLS');
    results.push({
      composite: 'DLS',
      fullName: 'Daily Living Skills',
      sumOfScaledScores: dlsSum,
      standardScore: dlsResult?.standardScore ?? null,
      percentileRank: dlsResult?.percentileRank ?? null,
      confidence90: dlsResult ? `${dlsResult.standardScore - AB_COMPOSITE_CONFIDENCE['90%'].DLS}–${dlsResult.standardScore + AB_COMPOSITE_CONFIDENCE['90%'].DLS}` : '—',
      confidence95: dlsResult ? `${dlsResult.standardScore - AB_COMPOSITE_CONFIDENCE['95%'].DLS}–${dlsResult.standardScore + AB_COMPOSITE_CONFIDENCE['95%'].DLS}` : '—',
      available: true,
    });
  } else {
    results.push({
      composite: 'DLS',
      fullName: 'Daily Living Skills',
      sumOfScaledScores: 0,
      standardScore: null,
      percentileRank: null,
      confidence90: '—',
      confidence95: '—',
      available: false,
      note: 'Requires Adaptive Behavior domain',
    });
  }

  // SOC = Socialization (IPR + PLA) — NOT available from DAYC-2
  results.push({
    composite: 'SOC',
    fullName: 'Socialization',
    sumOfScaledScores: 0,
    standardScore: null,
    percentileRank: null,
    confidence90: '—',
    confidence95: '—',
    available: false,
    note: 'Requires IPR & PLA subscales (not available from DAYC-2)',
  });

  // ADBE = Adaptive Behavior (all 5 subscales) — partial from DAYC-2
  const availableScores = [recScaled, expScaled, perScaled].filter((s): s is number => s !== null && s !== undefined);
  if (availableScores.length === 3) {
    const partialSum = availableScores.reduce((a, b) => a + b, 0);
    results.push({
      composite: 'ADBE',
      fullName: 'Adaptive Behavior (Partial)',
      sumOfScaledScores: partialSum,
      standardScore: null,
      percentileRank: null,
      confidence90: '—',
      confidence95: '—',
      available: false,
      note: `Partial: REC+EXP+PER = ${partialSum}. Full ADBE requires IPR & PLA subscales.`,
    });
  }

  return results;
}
