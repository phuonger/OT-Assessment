/**
 * generateProfileDocx.ts
 *
 * Generates a Word (.docx) document summarizing a client profile,
 * including child info, milestones, categorized goals, and assessment history.
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
  ShadingType,
  VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ClientProfile, GoalCategory, Milestone } from './clientProfileStorage';
import type { SavedMultiSession } from './multiSessionStorage';

// ============================================================
// Styling constants (matching generateDocx.ts)
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

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '333333', space: 4 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
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

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  }
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} year${y !== 1 ? 's' : ''}, ${m} month${m !== 1 ? 's' : ''}` : `${y} year${y !== 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'met': return 'Met';
    case 'in-progress': return 'In Progress';
    case 'not-met': return 'Not Met';
    case 'not-started': return 'Not Started';
    default: return status;
  }
}

// ============================================================
// Main export function
// ============================================================

export interface ProfileExportData {
  profile: ClientProfile;
  linkedSessions: SavedMultiSession[];
}

export async function generateProfileDocx(data: ProfileExportData): Promise<void> {
  const { profile, linkedSessions } = data;
  const children: (Paragraph | Table)[] = [];

  // ===== TITLE =====
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CLIENT PROFILE SUMMARY',
          bold: true,
          font: FONT,
          size: 28, // 14pt
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated: ${formatDate(new Date().toISOString())}`,
          font: FONT,
          size: SMALL_SIZE,
          color: '888888',
          italics: true,
        }),
      ],
    })
  );

  // ===== CLIENT INFORMATION =====
  children.push(heading('Client Information'));

  const infoRows: { label: string; value: string }[] = [
    { label: 'Name:', value: `${profile.firstName} ${profile.lastName}` },
    { label: 'Date of Birth:', value: formatDate(profile.dob) },
    { label: 'Age:', value: calculateAge(profile.dob) },
    { label: 'Gender:', value: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) },
  ];
  if (profile.prematureWeeks > 0) {
    infoRows.push({ label: 'Premature:', value: `${profile.prematureWeeks} weeks early` });
  }
  if (profile.parentNames) {
    infoRows.push({ label: 'Parent/Guardian:', value: profile.parentNames });
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: infoRows.map(
        (r) =>
          new TableRow({
            children: [
              tableCell(r.label, { bold: true, shading: 'F5F5F0', width: 30 }),
              tableCell(r.value, { width: 70 }),
            ],
          })
      ),
    })
  );

  // Notes
  if (profile.notes) {
    children.push(
      new Paragraph({
        spacing: { before: 150, after: 50 },
        children: [
          new TextRun({ text: 'Notes:', bold: true, font: FONT, size: FONT_SIZE }),
        ],
      })
    );
    children.push(bodyParagraph(profile.notes, { italic: true }));
  }

  // ===== DEVELOPMENTAL MILESTONES =====
  const recordedMilestones = profile.milestones.filter(m => m.ageAchieved);
  if (recordedMilestones.length > 0) {
    children.push(heading('Developmental Milestones'));

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row
          new TableRow({
            children: [
              tableCell('Milestone', { bold: true, shading: 'E8E5DD', width: 40 }),
              tableCell('Age Achieved', { bold: true, shading: 'E8E5DD', width: 60 }),
            ],
          }),
          // Data rows
          ...recordedMilestones.map(
            (m) =>
              new TableRow({
                children: [
                  tableCell(m.label, { bold: true, width: 40 }),
                  tableCell(m.ageAchieved, { width: 60 }),
                ],
              })
          ),
        ],
      })
    );
  }

  // ===== GOALS =====
  const categoriesWithGoals = profile.goalCategories.filter(c => c.goals.length > 0);
  if (categoriesWithGoals.length > 0) {
    children.push(heading('Goals'));

    // Goal summary counts
    const allGoals = categoriesWithGoals.flatMap(c => c.goals);
    const metCount = allGoals.filter(g => g.status === 'met').length;
    const inProgressCount = allGoals.filter(g => g.status === 'in-progress').length;
    const notMetCount = allGoals.filter(g => g.status === 'not-met').length;
    const notStartedCount = allGoals.filter(g => g.status === 'not-started').length;

    const summaryParts: string[] = [];
    if (metCount > 0) summaryParts.push(`${metCount} Met`);
    if (inProgressCount > 0) summaryParts.push(`${inProgressCount} In Progress`);
    if (notStartedCount > 0) summaryParts.push(`${notStartedCount} Not Started`);
    if (notMetCount > 0) summaryParts.push(`${notMetCount} Not Met`);

    children.push(
      new Paragraph({
        spacing: { before: 100, after: 150 },
        children: [
          new TextRun({
            text: `Total: ${allGoals.length} goal${allGoals.length !== 1 ? 's' : ''} — ${summaryParts.join(' | ')}`,
            font: FONT,
            size: FONT_SIZE,
            italics: true,
            color: '555555',
          }),
        ],
      })
    );

    for (const category of categoriesWithGoals) {
      // Category sub-heading
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: category.name.toUpperCase(),
              bold: true,
              font: FONT,
              size: FONT_SIZE,
              underline: {},
            }),
            ...(category.note
              ? [
                  new TextRun({ text: '  ', font: FONT, size: FONT_SIZE }),
                  new TextRun({
                    text: `*${category.note}`,
                    font: FONT,
                    size: SMALL_SIZE,
                    italics: true,
                    color: '666666',
                  }),
                ]
              : []),
          ],
        })
      );

      // Goals table for this category
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Header row
            new TableRow({
              children: [
                tableCell('Goal', { bold: true, shading: 'E8E5DD', width: 50 }),
                tableCell('Status', { bold: true, shading: 'E8E5DD', width: 15, alignment: AlignmentType.CENTER }),
                tableCell('Target Date', { bold: true, shading: 'E8E5DD', width: 17, alignment: AlignmentType.CENTER }),
                tableCell('Date Met', { bold: true, shading: 'E8E5DD', width: 18, alignment: AlignmentType.CENTER }),
              ],
            }),
            // Goal rows
            ...category.goals.map(
              (goal) =>
                new TableRow({
                  children: [
                    tableCell(goal.text, { width: 50 }),
                    tableCell(statusLabel(goal.status), {
                      width: 15,
                      alignment: AlignmentType.CENTER,
                      shading: goal.status === 'met' ? 'E8F5E9' : goal.status === 'in-progress' ? 'FFF8E1' : undefined,
                    }),
                    tableCell(goal.goalDate ? formatDate(goal.goalDate) : '—', { width: 17, alignment: AlignmentType.CENTER }),
                    tableCell(goal.dateMet ? formatDate(goal.dateMet) : '—', { width: 18, alignment: AlignmentType.CENTER }),
                  ],
                })
            ),
          ],
        })
      );
    }
  }

  // ===== ASSESSMENT HISTORY =====
  if (linkedSessions.length > 0) {
    children.push(heading('Assessment History'));

    const sortedSessions = [...linkedSessions].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row
          new TableRow({
            children: [
              tableCell('Date', { bold: true, shading: 'E8E5DD', width: 20 }),
              tableCell('Assessment Tools', { bold: true, shading: 'E8E5DD', width: 45 }),
              tableCell('Status', { bold: true, shading: 'E8E5DD', width: 15, alignment: AlignmentType.CENTER }),
              tableCell('Label', { bold: true, shading: 'E8E5DD', width: 20 }),
            ],
          }),
          // Session rows
          ...sortedSessions.map(
            (session) =>
              new TableRow({
                children: [
                  tableCell(formatDate(session.savedAt), { width: 20 }),
                  tableCell(
                    session.formSummaries?.map((f) => f.formName || f.formId.toUpperCase()).join(', ') || 'Assessment',
                    { width: 45 }
                  ),
                  tableCell(session.status === 'completed' ? 'Completed' : 'In Progress', {
                    width: 15,
                    alignment: AlignmentType.CENTER,
                    shading: session.status === 'completed' ? 'E8F5E9' : 'FFF8E1',
                  }),
                  tableCell(session.label || '—', { width: 20 }),
                ],
              })
          ),
        ],
      })
    );

    // Domain score details for each completed session
    for (const session of sortedSessions) {
      if (session.status !== 'completed' || !session.formSummaries?.length) continue;

      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: `${formatDate(session.savedAt)} — Score Summary`,
              bold: true,
              font: FONT,
              size: FONT_SIZE,
              italics: true,
            }),
          ],
        })
      );

      for (const form of session.formSummaries) {
        if (!form.domains?.length) continue;

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Form header
              new TableRow({
                children: [
                  tableCell(form.formName || form.formId.toUpperCase(), { bold: true, shading: 'E0F2F1', width: 40 }),
                  tableCell('Raw Score', { bold: true, shading: 'E0F2F1', width: 20, alignment: AlignmentType.CENTER }),
                  tableCell('Items Scored', { bold: true, shading: 'E0F2F1', width: 20, alignment: AlignmentType.CENTER }),
                  tableCell('Total Items', { bold: true, shading: 'E0F2F1', width: 20, alignment: AlignmentType.CENTER }),
                ],
              }),
              ...form.domains.map(
                (d) =>
                  new TableRow({
                    children: [
                      tableCell(d.domainName, { width: 40 }),
                      tableCell(String(d.rawScore), { width: 20, alignment: AlignmentType.CENTER }),
                      tableCell(String(d.itemsScored), { width: 20, alignment: AlignmentType.CENTER }),
                      tableCell(String(d.totalItems), { width: 20, alignment: AlignmentType.CENTER }),
                    ],
                  })
              ),
            ],
          })
        );
      }
    }
  }

  // ===== FOOTER =====
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 8 },
      },
      children: [
        new TextRun({
          text: `Profile created: ${formatDate(profile.createdAt)} | Last updated: ${formatDate(profile.updatedAt)}`,
          font: FONT,
          size: SMALL_SIZE,
          color: '999999',
          italics: true,
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
              top: 1440,
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
  const fileName = `${profile.firstName}_${profile.lastName}_Profile_Summary.docx`;
  saveAs(blob, fileName);
}
