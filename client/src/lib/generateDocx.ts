/**
 * generateDocx.ts
 *
 * Generates a Word (.docx) document from the clinical report data.
 * Supports both OT Developmental Intake and OT SI Assessment templates.
 * Uses the `docx` library for document generation and `file-saver` for download.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  TableOfContents,
  ShadingType,
  VerticalAlign,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';

// ============================================================
// Types
// ============================================================

export type ReportTemplate = 'developmental' | 'sensory' | 'feeding';

export interface BayleyScoreRow {
  domain: string;
  rawScore: number;
  scaledScore: number | null;
  ageEquivalent: string;
  percentDelay: string;
}

export interface Dayc2ScoreRow {
  domain: string;
  rawScore: number;
  standardScore: string;
  descriptiveTerm: string;
  ageEquivalent: string;
  percentDelay: string;
  scoringMethod?: 'native' | 'bayley4ab';
  classification?: string;
}

export interface Bayley4ABCompositeRow {
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

export interface Reel3ScoreRow {
  domain: string;
  rawScore: number;
  ageEquivalent: string;
  percentDelay: string;
  abilityScore: number | null;
  percentileRank: string;
  descriptiveTerm: string;
}

export interface SP2QuadrantScore {
  name: string;
  key: string;
  rawScore: number;
  maxScore: number;
  description: string;
}

export interface SP2SectionScore {
  name: string;
  key: string;
  rawScore: number;
  maxScore: number;
  description: string;
}

export interface CompositeScore {
  label: string;
  scaledScore: number;
  standardScore: number;
  percentile: number | string;
}

export interface DomainNarrativeData {
  domainName: string;
  formName: string;
  scaledScore: number | null;
  rawScore: number;
  ageEquivalent: string;
  narrativeText: string;
  notDemonstratedItems: string[];
}

export interface SummaryRow {
  domain: string;
  ageEquivalent: string;
}

export interface DocxReportData {
  template: ReportTemplate;
  practiceName: string;
  practiceAddress?: string;
  practicePhone?: string;
  practiceEmail?: string;
  reportTitle: string;
  examinerName: string;
  examinerTitle: string;
  examinerAgency: string;
  childName: string;
  firstName: string;
  testDate: string;
  dob: string;
  chronAge: string;
  adjAge: string | null;
  uciNumber?: string;
  regionalCenter?: string;
  evalPeriodMode?: 'text' | 'range';
  evalPeriodText?: string;
  evalPeriodStart?: string;
  evalPeriodEnd?: string;

  // Shared sections
  referralInfo: string;
  medicalHistory: string;
  parentConcerns: string;
  assessmentTools: string[];
  closingNote: string;
  recommendations: string;

  // Developmental template
  clinicalObservation: string;
  bayleyScores: BayleyScoreRow[];
  cogComposite: CompositeScore | null;
  motorComposite: CompositeScore | null;
  dayc2Scores: Dayc2ScoreRow[];
  dayc2BayleyComposites: Bayley4ABCompositeRow[];
  reel3Scores: Reel3ScoreRow[];
  domainNarratives: DomainNarrativeData[];
  feedingOralMotor: string;
  sensoryNarrative: string;
  summaryOfDevelopment: SummaryRow[];

  // SI template
  testingConditions: string;
  validityStatement: string;
  sp2Quadrants: SP2QuadrantScore[];
  sp2Sections: SP2SectionScore[];
  quadrantNarratives: Record<string, string>;
  sectionNarratives: Record<string, string>;

  // Signature / credentials
  signatureName?: string;
  signatureTitle?: string;
  signatureLicense?: string;
  signatureEmail?: string;
  signatureImage?: string; // base64 data URI

  // Feeding template
  feedingTestingConditions?: string;
  feedingOralStructures?: string;
  feedingBehaviors?: string;
  feedingOralMotorCoord?: string;
  feedingFoodRepertoire?: string;
  feedingSelfFeeding?: string;
  feedingPreviousHistory?: string;
  feedingDrinking?: string;
  feedingVestibular?: string;
  feedingProprioceptive?: string;
  feedingTactile?: string;
  feedingROM?: string;
  feedingMuscleStrength?: string;
  feedingMuscleTone?: string;
  feedingPosturalStability?: string;
  feedingSummary?: string;
  feedingAdaptiveItemsDemonstrated?: string[];
  feedingAdaptiveItemsNotDemonstrated?: string[];
  feedingChecklistData?: FeedingChecklistExportData;
  feedingBehaviorsData?: FeedingBehaviorsExportData;
  selfFeedingData?: SelfFeedingExportData;
  drinkingData?: DrinkingExportData;
}

/** Feeding Behaviors checklist data */
export interface FeedingBehaviorsExportData {
  readiness: string;
  drooling: string;
  droolingDesc: string;
  posture: string;
  seatedTolerance: string;
  seatedToleranceDesc: string;
  fingerFeeding: string;
  fingerFeedingDesc: string;
  foodAcceptance: string;
  foodAcceptanceDesc: string;
  refusalBehaviors: string;
  refusalDesc: string;
  gagging: string;
  gaggingDesc: string;
  sensoryResponse: string;
  mealDuration: string;
  additionalObs: string;
}

/** Self-Feeding checklist data */
export interface SelfFeedingExportData {
  fingerFeeds: string;
  fingerFeedsDesc: string;
  spoonUse: string;
  spoonGrasp: string;
  spoonAccuracy: string;
  forkUse: string;
  forkStabbing: string;
  cupDrinking: string;
  cupType: string;
  cupSpilling: string;
  handEyeCoord: string;
  bilateralCoord: string;
  graspRelease: string;
  messiness: string;
  independence: string;
  additionalObs: string;
}

/** Drinking checklist data */
export interface DrinkingExportData {
  bottleUse: string;
  bottleNippleType: string;
  bottleSuckPattern: string;
  bottleLipSeal: string;
  bottleSwallowCoord: string;
  sippyCupUse: string;
  sippyCupType: string;
  sippyCupLipSeal: string;
  sippyCupJawStability: string;
  strawUse: string;
  strawSuckStrength: string;
  strawLipSeal: string;
  strawLiquidLoss: string;
  openCupUse: string;
  openCupJawGrading: string;
  openCupLipSeal: string;
  openCupLiquidLoss: string;
  openCupAssistLevel: string;
  liquidPreferences: string;
  liquidConsistency: string;
  liquidTemp: string;
  swallowCoordDrinking: string;
  coughingWithLiquids: string;
  nasalRegurgitation: string;
  additionalObs: string;
}

/** Structured checklist data from Feeders & Growers evaluation tool */
export interface FeedingChecklistExportData {
  // Oral Sensory
  oralSeeking: string;
  extraOralSensitivity: string;
  intraOralSensitivity: string;
  foodsDuringAssessment: string;
  // Jaw
  jawStrength: string;
  jawCupDrinking: string;
  jawBitingThrough: string;
  jawChewingEndurance: string;
  jawWideExcursions: string;
  jawLossOfFood: string;
  jawChewingPattern: string;
  jawClosedAtRest: string;
  jawAnticipatoryOpening: string;
  // Lips
  lipsStrength: string;
  lipsDrinking: string;
  lipsDrinkingDetail: string;
  lipsChewing: string;
  lipsEndurance: string;
  lipsDrooling: string;
  lipsLossOfFood: string;
  // Tongue
  tongueStrength: string;
  tongueDrinking: string;
  tongueChewingLat: string;
  tongueChewingKeep: string;
  tongueChewingEndurance: string;
  tongueLossSeal: string;
  tongueLossFood: string;
  tongueLateralizesTo: string;
  tonguePrefers: string;
  tongueTransfersMidline: string;
  tongueTipElevation: string;
  tongueCleanLips: string;
  tongueProtrusionSwallow: string;
  // Soft Palate
  softPalate: string;
  softPalateDescribe: string;
  // Food Residue & Compensatory
  foodResidue: string;
  foodResidueReasons: string;
  compensatoryStrategies: string;
  // Overall
  overallQuality: string;
  swallowCoordinated: string;
  swallowDescribe: string;
  // Aspiration
  aspirationThinLiquids: string;
  aspirationThickenedLiquids: string;
  aspirationSolids: string;
  aspirationSignsPositive: string;
  // Refusal & Self-feeding
  refusalBehaviors: string;
  selfFeeding: string;
  selfFeedingDesc: string;
}

// ============================================================
// Styling constants
// ============================================================

const FONT = 'Times New Roman';
const FONT_SIZE = 22; // 11pt in half-points
const HEADING_SIZE = 24; // 12pt
const SMALL_SIZE = 20; // 10pt
const TABLE_FONT_SIZE = 18; // 9pt

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '666666',
};

const TABLE_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

// ============================================================
// Helper functions
// ============================================================

function heading(text: string, number?: string): Paragraph {
  const displayText = number ? `${number}. ${text.toUpperCase()}` : text.toUpperCase();
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '333333', space: 4 },
    },
    children: [
      new TextRun({
        text: displayText,
        bold: true,
        font: FONT,
        size: HEADING_SIZE,
      }),
    ],
  });
}

function bodyParagraph(text: string, options?: { bold?: boolean; italic?: boolean; spacing?: { before?: number; after?: number } }): Paragraph {
  if (!text) {
    return new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: '[Not provided]',
          font: FONT,
          size: FONT_SIZE,
          italics: true,
          color: '999999',
        }),
      ],
    });
  }

  // Split by newlines and create runs with line breaks
  const lines = text.split('\n');
  const runs: TextRun[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) {
      runs.push(new TextRun({ break: 1, font: FONT, size: FONT_SIZE, text: '' }));
    }
    runs.push(
      new TextRun({
        text: line,
        font: FONT,
        size: FONT_SIZE,
        bold: options?.bold,
        italics: options?.italic,
      })
    );
  });

  return new Paragraph({
    spacing: options?.spacing ?? { before: 100, after: 100 },
    children: runs,
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: FONT_SIZE,
      }),
    ],
  });
}

function tableCell(text: string, options?: { bold?: boolean; shading?: string; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; width?: number }): TableCell {
  return new TableCell({
    width: options?.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options?.shading ? { type: ShadingType.SOLID, color: options.shading, fill: options.shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    borders: TABLE_BORDERS,
    children: [
      new Paragraph({
        alignment: options?.alignment ?? AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: text || '—',
            font: FONT,
            size: TABLE_FONT_SIZE,
            bold: options?.bold,
          }),
        ],
      }),
    ],
  });
}

function createInfoTable(data: DocxReportData): Table {
  const rows: { label: string; value: string }[] = [
    { label: "CLIENT'S NAME:", value: data.childName.toUpperCase() },
    { label: 'UCI:', value: data.uciNumber || '' },
    { label: 'DATE OF EVALUATION:', value: data.testDate },
    { label: 'EVALUATION PERIOD:', value: data.evalPeriodMode === 'range' && data.evalPeriodStart ? `${data.evalPeriodStart}${data.evalPeriodEnd ? ' to ' + data.evalPeriodEnd : ''}` : (data.evalPeriodText || '') },
    { label: 'DATE OF BIRTH:', value: data.dob },
    { label: 'CHRONOLOGICAL AGE:', value: data.chronAge },
  ];
  if (data.adjAge) {
    rows.push({ label: 'ADJUSTED AGE:', value: data.adjAge });
  }
  rows.push({ label: 'REGIONAL CENTER:', value: data.regionalCenter || '' });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r) =>
        new TableRow({
          children: [
            tableCell(r.label, { bold: true, shading: 'F1F5F9', width: 35 }),
            tableCell(r.value, { width: 65 }),
          ],
        })
    ),
  });
}

// ============================================================
// Scoring Tables
// ============================================================

function createBayleyTable(scores: BayleyScoreRow[], cogComposite: CompositeScore | null, motorComposite: CompositeScore | null): (Paragraph | Table)[] {
  if (scores.length === 0) return [];

  const headerRow = new TableRow({
    children: [
      tableCell('Subtest', { bold: true, shading: 'F1F5F9' }),
      tableCell('Raw Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Scaled Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Age Equivalence', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('% Delay', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
    ],
  });

  const dataRows = scores.map(
    (row) =>
      new TableRow({
        children: [
          tableCell(row.domain, { bold: true }),
          tableCell(String(row.rawScore), { alignment: AlignmentType.CENTER }),
          tableCell(row.scaledScore !== null ? String(row.scaledScore) : '—', { alignment: AlignmentType.CENTER }),
          tableCell(row.ageEquivalent, { alignment: AlignmentType.CENTER }),
          tableCell(row.percentDelay || '—', { alignment: AlignmentType.CENTER }),
        ],
      })
  );

  const compositeRows: TableRow[] = [];
  if (cogComposite) {
    compositeRows.push(
      new TableRow({
        children: [
          tableCell('Cognitive Composite', { bold: true, shading: 'EFF6FF' }),
          tableCell('—', { alignment: AlignmentType.CENTER, shading: 'EFF6FF' }),
          tableCell(String(cogComposite.scaledScore), { alignment: AlignmentType.CENTER, shading: 'EFF6FF' }),
          tableCell(`SS: ${cogComposite.standardScore}`, { alignment: AlignmentType.CENTER, shading: 'EFF6FF' }),
          tableCell(`PR: ${cogComposite.percentile}`, { alignment: AlignmentType.CENTER, shading: 'EFF6FF' }),
        ],
      })
    );
  }
  if (motorComposite) {
    compositeRows.push(
      new TableRow({
        children: [
          tableCell('Motor Composite', { bold: true, shading: 'F0FDF4' }),
          tableCell('—', { alignment: AlignmentType.CENTER, shading: 'F0FDF4' }),
          tableCell(String(motorComposite.scaledScore), { alignment: AlignmentType.CENTER, shading: 'F0FDF4' }),
          tableCell(`SS: ${motorComposite.standardScore}`, { alignment: AlignmentType.CENTER, shading: 'F0FDF4' }),
          tableCell(`PR: ${motorComposite.percentile}`, { alignment: AlignmentType.CENTER, shading: 'F0FDF4' }),
        ],
      })
    );
  }

  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: 'BAYLEY SCALES OF INFANT DEVELOPMENT, 4TH EDITION (BSID-IV)',
          bold: true,
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows, ...compositeRows],
    }),
  ];
}

function createDayc2Table(scores: Dayc2ScoreRow[]): (Paragraph | Table)[] {
  if (scores.length === 0) return [];

  const useBayley4AB = scores[0]?.scoringMethod === 'bayley4ab';

  const headerCells = [
    tableCell('Subtest', { bold: true, shading: 'F1F5F9' }),
    tableCell('Raw Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
    tableCell(useBayley4AB ? 'Scaled Score' : 'Standard Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
    tableCell(useBayley4AB ? 'Bayley-4 Subscale' : 'Descriptive Term', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
  ];
  if (useBayley4AB) {
    headerCells.push(tableCell('Classification', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }));
  }
  headerCells.push(
    tableCell('Age Equivalence', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
    tableCell('% Delay', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
  );

  const headerRow = new TableRow({ children: headerCells });

  const dataRows = scores.map(
    (row) => {
      const cells = [
        tableCell(row.domain, { bold: true }),
        tableCell(String(row.rawScore), { alignment: AlignmentType.CENTER }),
        tableCell(row.standardScore, { alignment: AlignmentType.CENTER }),
        tableCell(row.descriptiveTerm, { alignment: AlignmentType.CENTER }),
      ];
      if (useBayley4AB) {
        cells.push(tableCell(row.classification || '\u2014', { alignment: AlignmentType.CENTER }));
      }
      cells.push(
        tableCell(row.ageEquivalent, { alignment: AlignmentType.CENTER }),
        tableCell(row.percentDelay, { alignment: AlignmentType.CENTER }),
      );
      return new TableRow({ children: cells });
    }
  );

  const titleText = useBayley4AB
    ? 'DAYC-2 ITEMS SCORED WITH BAYLEY-4 ADAPTIVE BEHAVIOR SCALES'
    : 'DAYC-2 DEVELOPMENTAL ASSESSMENT OF YOUNG CHILDREN, 2ND EDITION';

  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
  ];

  if (useBayley4AB) {
    elements.push(
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: 'Scoring method: Bayley-4 Adaptive Behavior norms applied to DAYC-2 raw scores',
            italics: true,
            font: FONT,
            size: SMALL_SIZE - 2,
            color: 'B45309',
          }),
        ],
      })
    );
  }

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    })
  );

  return elements;
}

function createBayley4ABCompositeTable(composites: Bayley4ABCompositeRow[]): (Paragraph | Table)[] {
  if (composites.length === 0) return [];

  const headerRow = new TableRow({
    children: [
      tableCell('Composite', { bold: true, shading: 'FEF3C7' }),
      tableCell('Sum of SS', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
      tableCell('Standard Score', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
      tableCell('Percentile Rank', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
      tableCell('Classification', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
      tableCell('90% CI', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
      tableCell('95% CI', { bold: true, shading: 'FEF3C7', alignment: AlignmentType.CENTER }),
    ],
  });

  const dataRows = composites.map(
    (comp) => {
      // Compute classification for composite standard scores
      let classification = '\u2014';
      if (comp.standardScore !== null) {
        const ss = comp.standardScore;
        if (ss >= 130) classification = 'Extremely High';
        else if (ss >= 120) classification = 'Very High';
        else if (ss >= 110) classification = 'High Average';
        else if (ss >= 90) classification = 'Average';
        else if (ss >= 80) classification = 'Low Average';
        else if (ss >= 70) classification = 'Borderline';
        else classification = 'Extremely Low';
      }
      return new TableRow({
        children: [
          tableCell(comp.fullName + (comp.note ? ` (${comp.note})` : ''), { bold: true }),
          tableCell(comp.available ? String(comp.sumOfScaledScores) : '\u2014', { alignment: AlignmentType.CENTER }),
          tableCell(comp.standardScore !== null ? String(comp.standardScore) : '\u2014', { alignment: AlignmentType.CENTER }),
          tableCell(comp.percentileRank !== null ? String(comp.percentileRank) : '\u2014', { alignment: AlignmentType.CENTER }),
          tableCell(classification, { alignment: AlignmentType.CENTER }),
          tableCell(comp.confidence90, { alignment: AlignmentType.CENTER }),
          tableCell(comp.confidence95, { alignment: AlignmentType.CENTER }),
        ],
      });
    }
  );

  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: 'BAYLEY-4 ADAPTIVE BEHAVIOR COMPOSITE SCORES',
          bold: true,
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  ];
}

function createReel3Table(scores: Reel3ScoreRow[]): (Paragraph | Table)[] {
  if (scores.length === 0) return [];

  const headerRow = new TableRow({
    children: [
      tableCell('Subtest', { bold: true, shading: 'F1F5F9' }),
      tableCell('Raw Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Ability Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Percentile', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Descriptive Term', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('Age Equivalence', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
      tableCell('% Delay', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
    ],
  });

  const dataRows = scores.map(
    (row) =>
      new TableRow({
        children: [
          tableCell(row.domain, { bold: true }),
          tableCell(String(row.rawScore), { alignment: AlignmentType.CENTER }),
          tableCell(row.abilityScore !== null ? String(row.abilityScore) : '\u2014', { alignment: AlignmentType.CENTER }),
          tableCell(row.percentileRank, { alignment: AlignmentType.CENTER }),
          tableCell(row.descriptiveTerm, { alignment: AlignmentType.CENTER }),
          tableCell(row.ageEquivalent, { alignment: AlignmentType.CENTER }),
          tableCell(row.percentDelay || '\u2014', { alignment: AlignmentType.CENTER }),
        ],
      })
  );

  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: 'RECEPTIVE-EXPRESSIVE EMERGENT LANGUAGE TEST, 3RD EDITION (REEL-3)',
          bold: true,
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  ];
}

// ============================================================
// SP2 Tables
// ============================================================

function createSP2QuadrantDefinitionsTable(): Table {
  const QUADRANT_DEFINITIONS: Record<string, { label: string; def: string }> = {
    seeking: { label: 'Seeking/Seeker', def: 'The degree to which a child obtains sensory input. A child with a Much More Than Others score in this pattern seeks sensory input at a higher rate than others.' },
    avoiding: { label: 'Avoiding/Avoider', def: 'The degree to which a child is bothered by sensory input. A child with a Much More Than Others score in this pattern moves away from sensory input at a higher rate than others.' },
    sensitivity: { label: 'Sensitivity/Sensor', def: 'The degree to which a child detects sensory input. A child with a Much More Than Others score in this pattern notices sensory input at a higher rate than others.' },
    registration: { label: 'Registration/Bystander', def: 'The degree to which a child misses sensory input. A child with low registration often tends to appear uninterested, may have flat/dull affect, and may require repeated prompting/cueing to adequately respond.' },
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          tableCell('Quadrant', { bold: true, shading: 'F1F5F9', width: 25 }),
          tableCell('Definition', { bold: true, shading: 'F1F5F9', width: 75 }),
        ],
      }),
      ...Object.values(QUADRANT_DEFINITIONS).map(
        (q) =>
          new TableRow({
            children: [
              tableCell(q.label, { bold: true, width: 25 }),
              tableCell(q.def, { width: 75 }),
            ],
          })
      ),
    ],
  });
}

function createSP2ScoresTable(scores: { name: string; rawScore: number; maxScore: number; description: string }[], title: string): (Paragraph | Table)[] {
  if (scores.length === 0) return [];

  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell(scores[0]?.name.includes('Seeking') || scores[0]?.name.includes('Avoiding') ? 'Quadrant' : 'Section', { bold: true, shading: 'F1F5F9' }),
            tableCell('Raw Score', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
            tableCell('Description', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER }),
          ],
        }),
        ...scores.map(
          (s) =>
            new TableRow({
              children: [
                tableCell(s.name, { bold: true }),
                tableCell(`${s.rawScore}/${s.maxScore}`, { alignment: AlignmentType.CENTER }),
                tableCell(s.description, { alignment: AlignmentType.CENTER, bold: true }),
              ],
            })
        ),
      ],
    }),
  ];
}

// ============================================================
// Domain Narratives
// ============================================================

function createDomainNarratives(narratives: DomainNarrativeData[], firstName: string): Paragraph[] {
  const elements: Paragraph[] = [];

  for (const n of narratives) {
    // Domain heading
    elements.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({
            text: n.domainName.toUpperCase(),
            bold: true,
            font: FONT,
            size: FONT_SIZE,
          }),
          new TextRun({
            text: `  (${n.formName})`,
            font: FONT,
            size: SMALL_SIZE,
            color: '888888',
          }),
        ],
      })
    );

    // Age Equivalence line for Bayley
    if (n.ageEquivalent && n.ageEquivalent !== 'N/A') {
      elements.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `Age Equivalence: ${n.ageEquivalent}`,
              font: FONT,
              size: FONT_SIZE,
              bold: true,
            }),
          ],
        })
      );
    }

    // Narrative text
    elements.push(bodyParagraph(n.narrativeText));

    // Not demonstrated items
    if (n.notDemonstratedItems.length > 0) {
      elements.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: 'Items Not Demonstrated:',
              bold: true,
              font: FONT,
              size: SMALL_SIZE,
              italics: true,
            }),
          ],
        })
      );
      for (const item of n.notDemonstratedItems) {
        elements.push(bulletItem(item));
      }
    }
  }

  return elements;
}

// ============================================================
// Summary of Development Table
// ============================================================

function createSummaryTable(rows: SummaryRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          tableCell('Domain', { bold: true, shading: 'F1F5F9', width: 60 }),
          tableCell('Age Equivalent', { bold: true, shading: 'F1F5F9', alignment: AlignmentType.CENTER, width: 40 }),
        ],
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: [
              tableCell(r.domain, { width: 60 }),
              tableCell(r.ageEquivalent, { alignment: AlignmentType.CENTER, width: 40 }),
            ],
          })
      ),
    ],
  });
}

// ============================================================
// Document Builders
// ============================================================

function buildDevelopmentalDocument(data: DocxReportData): Paragraph[] {
  const elements: Paragraph[] = [];

  // Referral Information
  elements.push(heading('Referral Information'));
  elements.push(bodyParagraph(data.referralInfo));

  // Birth/Medical History
  elements.push(heading('Birth/Medical History'));
  elements.push(bodyParagraph(data.medicalHistory));

  // Parent's Concerns
  elements.push(heading("Parent's Concerns"));
  elements.push(bodyParagraph(data.parentConcerns));

  // Assessment Tools
  elements.push(heading('Assessment Tools'));
  elements.push(
    bodyParagraph(
      `The following assessments were completed in English with ${data.childName} and their caregiver present in their home environment. Per parent report, participation, behavior, and performance observed during the assessment are reported to be typical. Therefore, this assessment is believed to be reliable and valid in regards to the client's present level of function.`
    )
  );
  for (const tool of data.assessmentTools) {
    elements.push(bulletItem(tool));
  }

  // Clinical Observation
  elements.push(heading('Clinical Observation'));
  elements.push(bodyParagraph(data.clinicalObservation));

  // Scoring Tables
  elements.push(heading('Scoring Tables'));
  // We'll return these as a mix of Paragraphs and Tables — need to handle separately
  return elements;
}

function buildSensoryDocument(data: DocxReportData): Paragraph[] {
  const elements: Paragraph[] = [];

  // I. Background Information
  elements.push(heading('Background Information', 'I'));
  elements.push(bodyParagraph(data.medicalHistory));

  // II. Referral Information
  elements.push(heading('Referral Information', 'II'));
  elements.push(bodyParagraph(data.referralInfo));

  // III. Parent's Concerns
  elements.push(heading("Parent's Concerns", 'III'));
  elements.push(bodyParagraph(data.parentConcerns));

  // IV. Assessment Tools
  elements.push(heading('Assessment Tools', 'IV'));
  for (const tool of data.assessmentTools) {
    elements.push(bulletItem(tool));
  }

  // V. Testing Conditions
  elements.push(heading('Testing Conditions and Behavior During Evaluation', 'V'));
  elements.push(bodyParagraph(data.testingConditions));

  // VI. Validity
  elements.push(heading('Validity of Assessment Findings', 'VI'));
  elements.push(bodyParagraph(data.validityStatement));

  return elements;
}

// ============================================================
// Main Export Function
// ============================================================

export async function generateDocxReport(data: DocxReportData): Promise<void> {
  // Build the children array (mix of Paragraphs and Tables)
  const children: (Paragraph | Table)[] = [];

  // ===== HEADER =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: data.practiceName,
          bold: true,
          font: FONT,
          size: 28, // 14pt
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `${data.examinerName} \u2014 ${data.examinerTitle}`,
          font: FONT,
          size: FONT_SIZE,
          color: '666666',
        }),
      ],
    })
  );

  // Practice contact info line
  const contactParts = [data.practiceAddress, data.practicePhone, data.practiceEmail].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            font: FONT,
            size: SMALL_SIZE,
            color: '888888',
          }),
        ],
      })
    );
  }

  // Horizontal rule
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: '333333', space: 4 } },
      spacing: { after: 200 },
      children: [],
    })
  );

  // ===== TITLE =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: data.reportTitle,
          bold: true,
          font: FONT,
          size: 26, // 13pt
        }),
      ],
    })
  );

  // ===== CLIENT INFO TABLE =====
  children.push(createInfoTable(data));
  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // ===== TEMPLATE-SPECIFIC CONTENT =====
  if (data.template === 'developmental') {
    // Referral, Medical, Concerns, Tools, Observation
    children.push(heading('Referral Information'));
    children.push(bodyParagraph(data.referralInfo));

    children.push(heading('Birth/Medical History'));
    children.push(bodyParagraph(data.medicalHistory));

    children.push(heading("Parent's Concerns"));
    children.push(bodyParagraph(data.parentConcerns));

    children.push(heading('Assessment Tools'));
    children.push(
      bodyParagraph(
        `The following assessments were completed in English with ${data.childName} and their caregiver present in their home environment. Per parent report, participation, behavior, and performance observed during the assessment are reported to be typical. Therefore, this assessment is believed to be reliable and valid in regards to the client's present level of function.`
      )
    );
    for (const tool of data.assessmentTools) {
      children.push(bulletItem(tool));
    }

    children.push(heading('Clinical Observation'));
    children.push(bodyParagraph(data.clinicalObservation));

    // Scoring Tables
    children.push(heading('Scoring Tables'));
    const bayleyElements = createBayleyTable(data.bayleyScores, data.cogComposite, data.motorComposite);
    children.push(...bayleyElements);
    const dayc2Elements = createDayc2Table(data.dayc2Scores);
    children.push(...dayc2Elements);
    if (data.dayc2BayleyComposites && data.dayc2BayleyComposites.length > 0) {
      const compositeElements = createBayley4ABCompositeTable(data.dayc2BayleyComposites);
      children.push(...compositeElements);
    }
    const reel3Elements = createReel3Table(data.reel3Scores);
    children.push(...reel3Elements);

    // Domain Assessments
    children.push(heading('Domain Assessments'));
    const narrativeElements = createDomainNarratives(data.domainNarratives, data.firstName);
    children.push(...narrativeElements);

    // Feeding/Oral Motor
    children.push(heading('Feeding/Oral Motor Skills'));
    children.push(bodyParagraph(data.feedingOralMotor));

    // Sensory Processing
    children.push(heading('Sensory Processing'));
    children.push(bodyParagraph(data.sensoryNarrative));

    // Summary of Development
    children.push(heading('Summary of Development'));
    if (data.summaryOfDevelopment.length > 0) {
      children.push(
        bodyParagraph(
          `${data.firstName} is functioning at the following levels:`
        )
      );
      children.push(createSummaryTable(data.summaryOfDevelopment));
    }

    // Recommendations
    children.push(heading('Recommendations'));
    children.push(bodyParagraph(data.recommendations));

  } else {
    // ===== SENSORY INTEGRATION TEMPLATE =====

    children.push(heading('Background Information', 'I'));
    children.push(bodyParagraph(data.medicalHistory));

    children.push(heading('Referral Information', 'II'));
    children.push(bodyParagraph(data.referralInfo));

    children.push(heading("Parent's Concerns", 'III'));
    children.push(bodyParagraph(data.parentConcerns));

    children.push(heading('Assessment Tools', 'IV'));
    for (const tool of data.assessmentTools) {
      children.push(bulletItem(tool));
    }

    // SP2 scoring description
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: 'Toddler Sensory Profile 2 (Dunn, 2014):',
            bold: true,
            font: FONT,
            size: SMALL_SIZE,
          }),
        ],
      })
    );
    children.push(
      bodyParagraph(
        'This test is administered as a caregiver questionnaire. It provides a summary of a child\'s sensory processing patterns. Classifications are based on performance of children without disabilities. Scores are classified into five categories: Just Like the Majority of Others (range -1SD to +1SD), More Than Others (+1SD to +2SD), Much More Than Others (above +2SD), Less Than Others (-1SD to -2SD), and Much Less Than Others (below -2SD).'
      )
    );

    children.push(heading('Testing Conditions and Behavior During Evaluation', 'V'));
    children.push(bodyParagraph(data.testingConditions));

    children.push(heading('Validity of Assessment Findings', 'VI'));
    children.push(bodyParagraph(data.validityStatement));

    // VII. Sensory Processing
    children.push(heading('Sensory Processing', 'VII'));

    // Quadrant Definitions
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({
            text: 'QUADRANT SUMMARY',
            bold: true,
            font: FONT,
            size: SMALL_SIZE,
          }),
        ],
      })
    );
    children.push(bodyParagraph('The quadrant scores reflect the child\'s responsiveness to sensory experiences.'));
    children.push(createSP2QuadrantDefinitionsTable());

    // Quadrant Scores
    if (data.sp2Quadrants.length > 0) {
      const qElements = createSP2ScoresTable(data.sp2Quadrants, 'Quadrant Scores');
      children.push(...qElements);

      // Quadrant narratives
      for (const q of data.sp2Quadrants) {
        const narrative = data.quadrantNarratives[q.key] || '';
        if (narrative) {
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 40 },
              children: [
                new TextRun({
                  text: `${q.name}: `,
                  bold: true,
                  font: FONT,
                  size: FONT_SIZE,
                }),
                new TextRun({
                  text: narrative,
                  font: FONT,
                  size: FONT_SIZE,
                }),
              ],
            })
          );
        }
      }
    }

    // Section Scores
    if (data.sp2Sections.length > 0) {
      const sElements = createSP2ScoresTable(data.sp2Sections, 'Sensory Processing and Behavior Sections');
      children.push(...sElements);

      // Section narratives
      for (const s of data.sp2Sections) {
        const narrative = data.sectionNarratives[s.key] || '';
        if (narrative) {
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 40 },
              children: [
                new TextRun({
                  text: `${s.name}: `,
                  bold: true,
                  font: FONT,
                  size: FONT_SIZE,
                }),
                new TextRun({
                  text: narrative,
                  font: FONT,
                  size: FONT_SIZE,
                }),
              ],
            })
          );
        }
      }
    }

    // Summary and Recommendations
    children.push(heading('Summary and Recommendations'));
    children.push(bodyParagraph(data.recommendations));
  }

  // ============================================================
  // TEMPLATE: OT FEEDING EVALUATION
  // ============================================================
  if (data.template === 'feeding') {
    // I. Referral Information
    children.push(heading('Referral Information', 'I'));
    children.push(bodyParagraph(data.referralInfo));

    // II. Birth/Medical History
    children.push(heading('Birth/Medical History', 'II'));
    children.push(bodyParagraph(data.medicalHistory));

    // III. Testing Conditions and Behavior During Evaluation
    children.push(heading('Testing Conditions and Behavior During Evaluation', 'III'));
    children.push(bodyParagraph(data.feedingTestingConditions || ''));

    // IV. Assessment Tools
    children.push(heading('Assessment Tools', 'IV'));
    children.push(bulletItem('Clinical Observations'));
    children.push(bulletItem('Parent Interview'));
    children.push(bulletItem('Oral Motor Assessment'));
    for (const tool of data.assessmentTools.filter(t => !['Clinical Observation', 'Parent/Caregiver Interview'].includes(t))) {
      children.push(bulletItem(tool));
    }

    // DAYC-2 description if applicable
    const hasDayc2 = data.dayc2Scores.length > 0;
    const hasBayley = data.bayleyScores.length > 0;
    if (hasDayc2) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({
              text: 'Developmental Assessment of Young Children-Second Edition (DAYC-2): ',
              bold: true,
              font: FONT,
              size: SMALL_SIZE,
            }),
            new TextRun({
              text: 'The DAYC-2 is a battery of five subtests that measures different but interrelated developmental abilities (cognitive, communication, social-emotional development, physical development, and adaptive behavior). This battery is designed for children from birth to 5 years, 11 months. For the purpose of this evaluation, the adaptive domain was utilized.',
              font: FONT,
              size: SMALL_SIZE,
            }),
          ],
        })
      );
    }
    if (hasBayley) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({
              text: 'Bayley Scales of Infant and Toddler Development, Fourth Edition (Bayley-4): ',
              bold: true,
              font: FONT,
              size: SMALL_SIZE,
            }),
            new TextRun({
              text: 'The Bayley-4 is a comprehensive developmental assessment for children ages 1-42 months. For the purpose of this evaluation, the adaptive behavior domain was utilized.',
              font: FONT,
              size: SMALL_SIZE,
            }),
          ],
        })
      );
    }

    // V. Testing Results
    children.push(heading('Testing Results', 'V'));

    // Show only adaptive behavior scores from DAYC-2
    const adaptiveDayc2 = data.dayc2Scores.filter(r => r.domain.toLowerCase().includes('adaptive'));
    if (adaptiveDayc2.length > 0) {
      const isBayley4AB = adaptiveDayc2[0]?.scoringMethod === 'bayley4ab';
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: isBayley4AB ? 'DAYC-2 (BAYLEY-4 ADAPTIVE BEHAVIOR SCORING)' : 'DAYC-2',
              bold: true,
              font: FONT,
              size: SMALL_SIZE,
            }),
          ],
        })
      );

      const scoreHeaders = ['Domain', 'Raw Score', isBayley4AB ? 'Scaled Score' : 'Standard Score', 'Descriptive Term', 'Age Equivalency', '% Delay'];
      const headerRow = new TableRow({
        children: scoreHeaders.map(h =>
          tableCell(h, { bold: true, shading: 'E8E8E8', alignment: h === 'Domain' ? AlignmentType.LEFT : AlignmentType.CENTER })
        ),
      });
      const dataRows = adaptiveDayc2.map(row =>
        new TableRow({
          children: [
            tableCell(row.domain),
            tableCell(String(row.rawScore), { alignment: AlignmentType.CENTER }),
            tableCell(row.standardScore, { alignment: AlignmentType.CENTER }),
            tableCell(row.descriptiveTerm, { alignment: AlignmentType.CENTER }),
            tableCell(row.ageEquivalent, { alignment: AlignmentType.CENTER }),
            tableCell(row.percentDelay, { alignment: AlignmentType.CENTER }),
          ],
        })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        })
      );
    }

    // Show Bayley-4 adaptive scores if available
    const adaptiveBayley = data.bayleyScores.filter(r => r.domain.toLowerCase().includes('adaptive') || r.domain.toLowerCase().includes('self-direction') || r.domain.toLowerCase().includes('personal'));
    if (adaptiveBayley.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({ text: 'BAYLEY-4', bold: true, font: FONT, size: SMALL_SIZE }),
          ],
        })
      );
      const bHeaders = ['Domain', 'Raw Score', 'Scaled Score', 'Age Equivalent', '% Delay'];
      const bHeaderRow = new TableRow({
        children: bHeaders.map(h =>
          tableCell(h, { bold: true, shading: 'E8E8E8', alignment: h === 'Domain' ? AlignmentType.LEFT : AlignmentType.CENTER })
        ),
      });
      const bDataRows = adaptiveBayley.map(row =>
        new TableRow({
          children: [
            tableCell(row.domain),
            tableCell(String(row.rawScore), { alignment: AlignmentType.CENTER }),
            tableCell(row.scaledScore != null ? String(row.scaledScore) : '\u2014', { alignment: AlignmentType.CENTER }),
            tableCell(row.ageEquivalent, { alignment: AlignmentType.CENTER }),
            tableCell(row.percentDelay, { alignment: AlignmentType.CENTER }),
          ],
        })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [bHeaderRow, ...bDataRows],
        })
      );
    }

    // Adaptive Behavior Skills
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({ text: 'ADAPTIVE BEHAVIOR SKILLS:', bold: true, font: FONT, size: HEADING_SIZE }),
        ],
      })
    );

    if (data.feedingAdaptiveItemsDemonstrated && data.feedingAdaptiveItemsDemonstrated.length > 0) {
      children.push(
        bodyParagraph(
          `${data.firstName} demonstrated the following skills: ${data.feedingAdaptiveItemsDemonstrated.map(s => s.toLowerCase()).join('; ')}.`
        )
      );
    }
    if (data.feedingAdaptiveItemsNotDemonstrated && data.feedingAdaptiveItemsNotDemonstrated.length > 0) {
      children.push(
        bodyParagraph(
          `${data.firstName} did not demonstrate the following: ${data.feedingAdaptiveItemsNotDemonstrated.map(s => s.toLowerCase()).join('; ')}.`
        )
      );
    }

    // Previous Feeding History
    if (data.feedingPreviousHistory) {
      children.push(heading('Previous Feeding History'));
      children.push(bodyParagraph(data.feedingPreviousHistory));
    }

    // VI. Feeding/Oral Motor Skills
    children.push(heading('Feeding/Oral Motor Skills', 'VI'));

    // a. Oral Structures
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'a. Oral Structures', bold: true, font: FONT, size: FONT_SIZE })],
      })
    );
    children.push(bodyParagraph(data.feedingOralStructures || ''));

    // b. Feeding Behaviors
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'b. Feeding Behaviors', bold: true, font: FONT, size: FONT_SIZE })],
      })
    );
    children.push(bodyParagraph(data.feedingBehaviors || ''));

    // c. Oral Motor Coordination
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'c. Oral Motor Coordination', bold: true, font: FONT, size: FONT_SIZE })],
      })
    );
    children.push(bodyParagraph(data.feedingOralMotorCoord || ''));

    // d. Food Repertoire
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'd. Food Repertoire', bold: true, font: FONT, size: FONT_SIZE })],
      })
    );
    children.push(bodyParagraph(data.feedingFoodRepertoire || ''));

    // e. Self-Feeding Skills
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'e. Self-Feeding Skills', bold: true, font: FONT, size: FONT_SIZE })],
      })
    );
    children.push(bodyParagraph(data.feedingSelfFeeding || ''));

    // Drinking
    if (data.feedingDrinking) {
      children.push(heading('Drinking'));
      children.push(bodyParagraph(data.feedingDrinking));
    }

    // VII. Summary and Recommendations
    children.push(heading('Summary and Recommendations', 'VII'));
    children.push(bodyParagraph(data.feedingSummary || ''));

    // Appendix: Feeding Evaluation Checklist Data
    if (data.feedingChecklistData) {
      const cl = data.feedingChecklistData;
      const hasAnyData = Object.values(cl).some(v => v && v !== '');
      if (hasAnyData) {
        children.push(heading('Feeding Evaluation Checklist Data', 'Appendix'));
        children.push(
          bodyParagraph('Structured clinical observations recorded using the Feeders & Growers OT Feeding Evaluation Tool.', { italic: true })
        );

        const hdrCell = (text: string) => tableCell(text, { bold: true, shading: 'E8F5E9' });
        const valCell = (text: string) => tableCell(text || '—');

        // Helper to build a 2-column row
        const row2 = (label: string, value: string) =>
          new TableRow({ children: [hdrCell(label), valCell(value)] });

        // Oral Sensory & Feeding Performance
        children.push(
          bodyParagraph('Oral Sensory & Feeding Performance', { bold: true, spacing: { before: 200, after: 60 } })
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell('Assessment Item'), hdrCell('Finding')] }),
              row2('Foods During Assessment', cl.foodsDuringAssessment),
              row2('Oral Seeking Behavior', cl.oralSeeking),
              row2('Extra-Oral Sensitivity', cl.extraOralSensitivity),
              row2('Intra-Oral Sensitivity', cl.intraOralSensitivity),
            ],
          })
        );

        // Jaw
        children.push(
          bodyParagraph('Jaw Assessment', { bold: true, spacing: { before: 200, after: 60 } })
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell('Assessment Item'), hdrCell('Finding')] }),
              row2('Strength', cl.jawStrength),
              row2('Cup Drinking', cl.jawCupDrinking),
              row2('Biting Through Food', cl.jawBitingThrough),
              row2('Chewing Endurance', cl.jawChewingEndurance),
              row2('Wide Jaw Excursions', cl.jawWideExcursions),
              row2('Loss of Food While Chewing', cl.jawLossOfFood),
              row2('Chewing Pattern', cl.jawChewingPattern),
              row2('Closed at Rest', cl.jawClosedAtRest),
              row2('Anticipatory Mouth Opening', cl.jawAnticipatoryOpening),
            ],
          })
        );

        // Lips
        children.push(
          bodyParagraph('Lips Assessment', { bold: true, spacing: { before: 200, after: 60 } })
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell('Assessment Item'), hdrCell('Finding')] }),
              row2('Strength', cl.lipsStrength),
              row2('Drinking Seal', cl.lipsDrinking + (cl.lipsDrinkingDetail ? ` (${cl.lipsDrinkingDetail})` : '')),
              row2('Chewing Closure', cl.lipsChewing),
              row2('Lip Seal Endurance', cl.lipsEndurance),
              row2('Drooling', cl.lipsDrooling),
              row2('Loss of Liquid/Food', cl.lipsLossOfFood),
            ],
          })
        );

        // Tongue
        children.push(
          bodyParagraph('Tongue Assessment', { bold: true, spacing: { before: 200, after: 60 } })
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell('Assessment Item'), hdrCell('Finding')] }),
              row2('Strength', cl.tongueStrength),
              row2('Drinking (Cupping)', cl.tongueDrinking),
              row2('Lateralizing to Molar Ridge', cl.tongueChewingLat),
              row2('Keeping Food on Molar Ridge', cl.tongueChewingKeep),
              row2('Chewing Endurance', cl.tongueChewingEndurance),
              row2('Loss of Seal on Breast/Bottle', cl.tongueLossSeal),
              row2('Loss of Food w/ Chewing', cl.tongueLossFood),
              row2('Lateralizes To', cl.tongueLateralizesTo),
              row2('Prefers', cl.tonguePrefers),
              row2('Transfers Across Midline', cl.tongueTransfersMidline),
              row2('Tongue Tip Elevation', cl.tongueTipElevation),
              row2('Cleans Lips with Tongue', cl.tongueCleanLips),
              row2('Tongue Protrusion with Swallow', cl.tongueProtrusionSwallow),
            ],
          })
        );

        // Soft Palate, Overall, Aspiration, etc.
        children.push(
          bodyParagraph('Additional Observations', { bold: true, spacing: { before: 200, after: 60 } })
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell('Assessment Item'), hdrCell('Finding')] }),
              row2('Soft Palate Elevation', cl.softPalate + (cl.softPalateDescribe ? ` — ${cl.softPalateDescribe}` : '')),
              row2('Food Residue', cl.foodResidue + (cl.foodResidueReasons ? ` (${cl.foodResidueReasons})` : '')),
              row2('Compensatory Strategies', cl.compensatoryStrategies),
              row2('Overall Quality of Oral Motor Skills', cl.overallQuality),
              row2('Coordinated Swallow', cl.swallowCoordinated + (cl.swallowDescribe ? ` — ${cl.swallowDescribe}` : '')),
              row2('Aspiration Signs — Thin Liquids', cl.aspirationThinLiquids),
              row2('Aspiration Signs — Thickened Liquids', cl.aspirationThickenedLiquids),
              row2('Aspiration Signs — Solids', cl.aspirationSolids),
              row2('Positive Aspiration Signs', cl.aspirationSignsPositive || 'None'),
              row2('Refusal Behaviors', cl.refusalBehaviors),
              row2('Self-Feeding', cl.selfFeeding + (cl.selfFeedingDesc ? ` — ${cl.selfFeedingDesc}` : '')),
            ],
          })
        );
      }
    }

    // Appendix: Feeding Behaviors Checklist
    if (data.feedingBehaviorsData) {
      const fb = data.feedingBehaviorsData;
      const hasAny = Object.values(fb).some(v => v && v !== '');
      if (hasAny) {
        children.push(bodyParagraph('Feeding Behaviors Checklist', { bold: true, spacing: { before: 300, after: 60 } }));
        const hdrCell2 = (text: string) => tableCell(text, { bold: true, shading: 'E3F2FD' });
        const valCell2 = (text: string) => tableCell(text || '—');
        const row2b = (label: string, value: string) =>
          new TableRow({ children: [hdrCell2(label), valCell2(value)] });
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell2('Assessment Item'), hdrCell2('Finding')] }),
              row2b('Readiness with Feeding', fb.readiness),
              row2b('Drooling', fb.drooling + (fb.droolingDesc ? ` — ${fb.droolingDesc}` : '')),
              row2b('Posture During Feeding', fb.posture),
              row2b('Seated Tolerance', fb.seatedTolerance + (fb.seatedToleranceDesc ? ` — ${fb.seatedToleranceDesc}` : '')),
              row2b('Finger Feeding', fb.fingerFeeding + (fb.fingerFeedingDesc ? ` — ${fb.fingerFeedingDesc}` : '')),
              row2b('Food Acceptance', fb.foodAcceptance + (fb.foodAcceptanceDesc ? ` — ${fb.foodAcceptanceDesc}` : '')),
              row2b('Refusal Behaviors', fb.refusalBehaviors + (fb.refusalDesc ? ` — ${fb.refusalDesc}` : '')),
              row2b('Gagging', fb.gagging + (fb.gaggingDesc ? ` — ${fb.gaggingDesc}` : '')),
              row2b('Sensory Response', fb.sensoryResponse),
              row2b('Meal Duration', fb.mealDuration),
              ...(fb.additionalObs ? [row2b('Additional Observations', fb.additionalObs)] : []),
            ],
          })
        );
      }
    }

    // Appendix: Self-Feeding Checklist
    if (data.selfFeedingData) {
      const sf = data.selfFeedingData;
      const hasAny = Object.values(sf).some(v => v && v !== '');
      if (hasAny) {
        children.push(bodyParagraph('Self-Feeding Skills Checklist', { bold: true, spacing: { before: 300, after: 60 } }));
        const hdrCell3 = (text: string) => tableCell(text, { bold: true, shading: 'FFF3E0' });
        const valCell3 = (text: string) => tableCell(text || '—');
        const row2s = (label: string, value: string) =>
          new TableRow({ children: [hdrCell3(label), valCell3(value)] });
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [hdrCell3('Assessment Item'), hdrCell3('Finding')] }),
              row2s('Finger Feeds Independently', sf.fingerFeeds + (sf.fingerFeedsDesc ? ` — ${sf.fingerFeedsDesc}` : '')),
              row2s('Spoon Use', sf.spoonUse),
              row2s('Spoon Grasp Pattern', sf.spoonGrasp),
              row2s('Spoon Accuracy', sf.spoonAccuracy),
              row2s('Fork Use', sf.forkUse),
              row2s('Fork Stabbing', sf.forkStabbing),
              row2s('Cup Drinking', sf.cupDrinking + (sf.cupType ? ` (${sf.cupType})` : '')),
              row2s('Cup Spilling', sf.cupSpilling),
              row2s('Hand-Eye Coordination', sf.handEyeCoord),
              row2s('Bilateral Coordination', sf.bilateralCoord),
              row2s('Grasp & Release', sf.graspRelease),
              row2s('Messiness', sf.messiness),
              row2s('Overall Self-Feeding Independence', sf.independence),
              ...(sf.additionalObs ? [row2s('Additional Observations', sf.additionalObs)] : []),
            ],
          })
        );
      }
    }

    // Appendix: Drinking Checklist
    if (data.drinkingData) {
      const dk = data.drinkingData;
      const hasAny = Object.values(dk).some(v => v && v !== '');
      if (hasAny) {
        children.push(bodyParagraph('Drinking Skills Checklist', { bold: true, spacing: { before: 300, after: 60 } }));
        const hdrCell4 = (text: string) => tableCell(text, { bold: true, shading: 'F3E5F5' });
        const valCell4 = (text: string) => tableCell(text || '—');
        const row2d = (label: string, value: string) =>
          new TableRow({ children: [hdrCell4(label), valCell4(value)] });

        const rows: TableRow[] = [
          new TableRow({ children: [hdrCell4('Assessment Item'), hdrCell4('Finding')] }),
        ];

        // Bottle section
        if (dk.bottleUse && dk.bottleUse !== 'Never used') {
          rows.push(row2d('Bottle Use', dk.bottleUse));
          if (dk.bottleNippleType) rows.push(row2d('Nipple Type', dk.bottleNippleType));
          rows.push(row2d('Suck Pattern', dk.bottleSuckPattern));
          rows.push(row2d('Lip Seal (Bottle)', dk.bottleLipSeal));
          rows.push(row2d('Swallow Coordination (Bottle)', dk.bottleSwallowCoord));
        } else {
          rows.push(row2d('Bottle Use', dk.bottleUse || '—'));
        }

        // Sippy Cup section
        if (dk.sippyCupUse && dk.sippyCupUse !== 'Not yet') {
          rows.push(row2d('Sippy Cup Use', dk.sippyCupUse));
          if (dk.sippyCupType) rows.push(row2d('Sippy Cup Type', dk.sippyCupType));
          rows.push(row2d('Lip Seal (Sippy)', dk.sippyCupLipSeal));
          rows.push(row2d('Jaw Stability (Sippy)', dk.sippyCupJawStability));
        } else {
          rows.push(row2d('Sippy Cup Use', dk.sippyCupUse || '—'));
        }

        // Straw section
        if (dk.strawUse && dk.strawUse !== 'Not yet') {
          rows.push(row2d('Straw Use', dk.strawUse));
          rows.push(row2d('Suck Strength (Straw)', dk.strawSuckStrength));
          rows.push(row2d('Lip Seal (Straw)', dk.strawLipSeal));
          rows.push(row2d('Liquid Loss (Straw)', dk.strawLiquidLoss));
        } else {
          rows.push(row2d('Straw Use', dk.strawUse || '—'));
        }

        // Open Cup section
        if (dk.openCupUse && dk.openCupUse !== 'Not yet') {
          rows.push(row2d('Open Cup Use', dk.openCupUse));
          rows.push(row2d('Jaw Grading (Open Cup)', dk.openCupJawGrading));
          rows.push(row2d('Lip Seal (Open Cup)', dk.openCupLipSeal));
          rows.push(row2d('Liquid Loss (Open Cup)', dk.openCupLiquidLoss));
          rows.push(row2d('Assist Level (Open Cup)', dk.openCupAssistLevel));
        } else {
          rows.push(row2d('Open Cup Use', dk.openCupUse || '—'));
        }

        // Liquid preferences & general
        if (dk.liquidPreferences) rows.push(row2d('Liquid Preferences', dk.liquidPreferences));
        if (dk.liquidConsistency) rows.push(row2d('Liquid Consistency', dk.liquidConsistency));
        if (dk.liquidTemp) rows.push(row2d('Liquid Temperature', dk.liquidTemp));
        rows.push(row2d('Swallow Coordination', dk.swallowCoordDrinking));
        rows.push(row2d('Coughing with Liquids', dk.coughingWithLiquids));
        rows.push(row2d('Nasal Regurgitation', dk.nasalRegurgitation));
        if (dk.additionalObs) rows.push(row2d('Additional Observations', dk.additionalObs));

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
      }
    }
  }

  // ===== CLOSING (all templates) =====
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 8 } },
      spacing: { before: 300 },
      children: [],
    })
  );
  children.push(bodyParagraph(data.closingNote));

  // ===== SIGNATURE & CREDENTIALS =====
  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }));

  // Signature line (blank line for hand-signing)
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 20 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999', space: 8 } },
      children: [new TextRun({ text: '\t\t\t\t\t\t\t', font: FONT, size: FONT_SIZE })],
    })
  );

  // Name + credentials
  const sigName = data.signatureName || data.examinerName;
  const sigTitle = data.signatureTitle || data.examinerTitle;
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 20 },
      children: [
        new TextRun({
          text: sigTitle ? `${sigName}, ${sigTitle}` : sigName,
          font: FONT,
          size: FONT_SIZE,
          bold: true,
        }),
      ],
    })
  );

  // License number
  if (data.signatureLicense) {
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: data.signatureLicense,
            font: FONT,
            size: FONT_SIZE,
            color: '666666',
          }),
        ],
      })
    );
  }

  // Email
  if (data.signatureEmail) {
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: data.signatureEmail,
            font: FONT,
            size: FONT_SIZE,
            color: '666666',
          }),
        ],
      })
    );
  }

  // Fallback: agency if no signature fields configured
  if (!data.signatureName && !data.signatureTitle && !data.signatureLicense) {
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: data.examinerAgency,
            font: FONT,
            size: FONT_SIZE,
            color: '666666',
          }),
        ],
      })
    );
  }

  // ===== CREATE DOCUMENT =====
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // ===== GENERATE AND DOWNLOAD =====
  const blob = await Packer.toBlob(doc);
  const templateName = data.template === 'developmental' ? 'OT_Dev_Intake' : data.template === 'feeding' ? 'OT_Feeding_Eval' : 'OT_SI_Assessment';
  const fileName = `${data.childName.replace(/\s+/g, '_')}_${templateName}_${data.testDate.replace(/\//g, '-')}.docx`;
  saveAs(blob, fileName);
}
