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

export type ReportTemplate = 'developmental' | 'sensory';

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
    { label: 'DATE OF EVALUATION:', value: data.testDate },
    { label: 'DATE OF BIRTH:', value: data.dob },
    { label: 'CHRONOLOGICAL AGE:', value: data.chronAge },
  ];
  if (data.adjAge) {
    rows.push({ label: 'ADJUSTED AGE:', value: data.adjAge });
  }

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

    // Score line for Bayley
    if (n.scaledScore !== null) {
      elements.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `${firstName} obtained a raw score of ${n.rawScore} with a scaled score of ${n.scaledScore}.`,
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

  // ===== CLOSING (both templates) =====
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 8 } },
      spacing: { before: 300 },
      children: [],
    })
  );
  children.push(bodyParagraph(data.closingNote));

  // ===== SIGNATURE =====
  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 20 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 8 } },
      children: [
        new TextRun({
          text: data.examinerName,
          font: FONT,
          size: FONT_SIZE,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: data.examinerTitle,
          font: FONT,
          size: FONT_SIZE,
          color: '666666',
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
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
  const fileName = `${data.childName.replace(/\s+/g, '_')}_${data.template === 'developmental' ? 'OT_Dev_Intake' : 'OT_SI_Assessment'}_${data.testDate.replace(/\//g, '-')}.docx`;
  saveAs(blob, fileName);
}
