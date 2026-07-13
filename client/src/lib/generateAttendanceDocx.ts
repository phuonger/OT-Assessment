/**
 * Generate Attendance DOCX
 * 
 * Exports an attendance record as a Word document matching the
 * Elevate Pediatric Therapy attendance sheet format.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, HeadingLevel,
  VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';
import { loadAppSettings } from '@/components/SettingsPreferences';
import { type AttendanceRecord } from '@/lib/attendanceStorage';

function createBorderStyle() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  };
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, font: 'Arial' })],
      spacing: { before: 40, after: 40 },
    })],
    borders: createBorderStyle(),
    verticalAlign: VerticalAlign.CENTER,
  });
}

function valueCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, font: 'Arial' })],
      spacing: { before: 40, after: 40 },
    })],
    borders: createBorderStyle(),
    verticalAlign: VerticalAlign.CENTER,
  });
}

async function dataUriToBuffer(dataUri: string): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const buffer = await blob.arrayBuffer();
          resolve({ buffer, width: img.width, height: img.height });
        } else {
          resolve({ buffer: new ArrayBuffer(0), width: 0, height: 0 });
        }
      }, 'image/png');
    };
    img.src = dataUri;
  });
}

export async function generateAttendanceDocx(record: AttendanceRecord): Promise<void> {
  const appSettings = loadAppSettings();
  const sections: any[] = [];

  // Practice header with logo
  const headerParagraphs: Paragraph[] = [];
  if (appSettings.practiceLogo) {
    try {
      const { buffer, width, height } = await dataUriToBuffer(appSettings.practiceLogo);
      if (buffer.byteLength > 0) {
        const maxW = 180;
        const scale = maxW / width;
        headerParagraphs.push(new Paragraph({
          children: [new ImageRun({
            data: buffer,
            transformation: { width: maxW, height: Math.round(height * scale) },
            type: 'png',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }));
      }
    } catch { /* skip logo if it fails */ }
  }
  if (appSettings.practiceName) {
    headerParagraphs.push(new Paragraph({
      children: [new TextRun({ text: appSettings.practiceName, bold: true, size: 28, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }));
  }
  const contactParts = [appSettings.practicePhone, appSettings.practiceEmail, appSettings.practiceAddress].filter(Boolean);
  if (contactParts.length > 0) {
    headerParagraphs.push(new Paragraph({
      children: [new TextRun({
        text: contactParts.join(' | '),
        size: 18,
        font: 'Arial',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }

  // Info table
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('Child Name:'),
          valueCell(record.childName),
          headerCell('Therapist Name:'),
          valueCell(record.therapistName),
        ],
      }),
      new TableRow({
        children: [
          headerCell('UCI:'),
          valueCell(record.uci),
          headerCell('SC:'),
          valueCell(record.sc),
        ],
      }),
      new TableRow({
        children: [
          headerCell('Type / Frequency:'),
          valueCell(record.typeFrequency),
          headerCell('Pay Period:'),
          valueCell(record.payPeriod),
        ],
      }),
    ],
  });

  // Daily Note heading
  const dailyNoteHeading = new Paragraph({
    children: [new TextRun({ text: 'Daily Note', bold: true, size: 28, font: 'Arial' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 200 },
  });

  // Date/Time/Signature table header
  const dateTimeRow = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('DATE'),
          headerCell('TIME'),
          headerCell('CONSUMER SIGNATURE'),
          headerCell('THERAPIST SIGNATURE'),
        ],
      }),
      new TableRow({
        children: [
          valueCell(formatDateForDoc(record.date)),
          valueCell(record.time),
          // Parent signature cell
          new TableCell({
            children: record.parentSignature ? [new Paragraph({
              children: [new TextRun({ text: '[Signed]', italics: true, size: 18, font: 'Arial' })],
            })] : [new Paragraph({ children: [] })],
            borders: createBorderStyle(),
            verticalAlign: VerticalAlign.CENTER,
          }),
          // Therapist signature cell
          new TableCell({
            children: record.therapistSignature ? [new Paragraph({
              children: [new TextRun({ text: '[Signed]', italics: true, size: 18, font: 'Arial' })],
            })] : [new Paragraph({ children: [] })],
            borders: createBorderStyle(),
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  });

  // Progress note
  const progressNoteLabel = new Paragraph({
    children: [new TextRun({ text: 'Progress note:', bold: true, size: 20, font: 'Arial' })],
    spacing: { before: 100, after: 60 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
  });

  const progressNoteText = new Paragraph({
    children: [new TextRun({ text: record.progressNote, size: 20, font: 'Arial' })],
    spacing: { before: 60, after: 200 },
  });

  // Signature images (if available)
  const signatureElements: Paragraph[] = [];
  if (record.parentSignature || record.therapistSignature) {
    signatureElements.push(new Paragraph({
      children: [new TextRun({ text: '', size: 20 })],
      spacing: { before: 200 },
    }));

    if (record.parentSignature) {
      try {
        const { buffer, width, height } = await dataUriToBuffer(record.parentSignature);
        if (buffer.byteLength > 0) {
          const scale = 200 / width;
          signatureElements.push(new Paragraph({
            children: [new TextRun({ text: 'Parent/Guardian Signature:', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 100, after: 60 },
          }));
          signatureElements.push(new Paragraph({
            children: [new ImageRun({
              data: buffer,
              transformation: { width: 200, height: Math.round(height * scale) },
              type: 'png',
            })],
          }));
        }
      } catch { /* skip if image fails */ }
    }

    if (record.therapistSignature) {
      try {
        const { buffer, width, height } = await dataUriToBuffer(record.therapistSignature);
        if (buffer.byteLength > 0) {
          const scale = 200 / width;
          signatureElements.push(new Paragraph({
            children: [new TextRun({ text: 'Therapist Signature:', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 100, after: 60 },
          }));
          signatureElements.push(new Paragraph({
            children: [new ImageRun({
              data: buffer,
              transformation: { width: 200, height: Math.round(height * scale) },
              type: 'png',
            })],
          }));
        }
      } catch { /* skip if image fails */ }
    }
  }

  const doc = new Document({
    sections: [{
      children: [
        ...headerParagraphs,
        infoTable,
        dailyNoteHeading,
        dateTimeRow,
        progressNoteLabel,
        progressNoteText,
        ...signatureElements,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Attendance_${record.childName.replace(/\s+/g, '_')}_${record.date}.docx`;
  saveAs(blob, fileName);
}

function formatDateForDoc(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Batch export all attendance records for a given pay period as a single multi-page DOCX.
 * Each record becomes its own section (page break between entries).
 */
export async function generateBatchAttendanceDocx(records: AttendanceRecord[], payPeriod: string): Promise<void> {
  if (records.length === 0) return;

  const appSettings = loadAppSettings();

  // Build header elements (shared across all pages)
  async function buildHeader(): Promise<Paragraph[]> {
    const headerParagraphs: Paragraph[] = [];
    if (appSettings.practiceLogo) {
      try {
        const { buffer, width, height } = await dataUriToBuffer(appSettings.practiceLogo);
        if (buffer.byteLength > 0) {
          const maxW = 180;
          const scale = maxW / width;
          headerParagraphs.push(new Paragraph({
            children: [new ImageRun({
              data: buffer,
              transformation: { width: maxW, height: Math.round(height * scale) },
              type: 'png',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }));
        }
      } catch { /* skip */ }
    }
    if (appSettings.practiceName) {
      headerParagraphs.push(new Paragraph({
        children: [new TextRun({ text: appSettings.practiceName, bold: true, size: 28, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }));
    }
    const contactParts = [appSettings.practicePhone, appSettings.practiceEmail, appSettings.practiceAddress].filter(Boolean);
    if (contactParts.length > 0) {
      headerParagraphs.push(new Paragraph({
        children: [new TextRun({ text: contactParts.join(' | '), size: 18, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    }
    return headerParagraphs;
  }

  const headerParas = await buildHeader();

  // Build sections — one per record
  const sections = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            headerCell('Child Name:'),
            valueCell(record.childName),
            headerCell('Therapist Name:'),
            valueCell(record.therapistName),
          ],
        }),
        new TableRow({
          children: [
            headerCell('UCI:'),
            valueCell(record.uci),
            headerCell('SC:'),
            valueCell(record.sc),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Type / Frequency:'),
            valueCell(record.typeFrequency),
            headerCell('Pay Period:'),
            valueCell(record.payPeriod),
          ],
        }),
      ],
    });

    const dailyNoteHeading = new Paragraph({
      children: [new TextRun({ text: 'Daily Note', bold: true, size: 28, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 200 },
    });

    const dateTimeRow = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            headerCell('DATE'),
            headerCell('TIME'),
            headerCell('CONSUMER SIGNATURE'),
            headerCell('THERAPIST SIGNATURE'),
          ],
        }),
        new TableRow({
          children: [
            valueCell(formatDateForDoc(record.date)),
            valueCell(record.time),
            new TableCell({
              children: record.parentSignature ? [new Paragraph({
                children: [new TextRun({ text: '[Signed]', italics: true, size: 18, font: 'Arial' })],
              })] : [new Paragraph({ children: [] })],
              borders: createBorderStyle(),
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              children: record.therapistSignature ? [new Paragraph({
                children: [new TextRun({ text: '[Signed]', italics: true, size: 18, font: 'Arial' })],
              })] : [new Paragraph({ children: [] })],
              borders: createBorderStyle(),
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }),
      ],
    });

    const progressNoteLabel = new Paragraph({
      children: [new TextRun({ text: 'Progress note:', bold: true, size: 20, font: 'Arial' })],
      spacing: { before: 100, after: 60 },
    });

    const progressNoteText = new Paragraph({
      children: [new TextRun({ text: record.progressNote, size: 20, font: 'Arial' })],
      spacing: { before: 60, after: 200 },
    });

    // Signature images
    const signatureElements: Paragraph[] = [];
    if (record.parentSignature) {
      try {
        const { buffer, width, height } = await dataUriToBuffer(record.parentSignature);
        if (buffer.byteLength > 0) {
          const scale = 200 / width;
          signatureElements.push(new Paragraph({
            children: [new TextRun({ text: 'Parent/Guardian Signature:', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 100, after: 60 },
          }));
          signatureElements.push(new Paragraph({
            children: [new ImageRun({
              data: buffer,
              transformation: { width: 200, height: Math.round(height * scale) },
              type: 'png',
            })],
          }));
        }
      } catch { /* skip */ }
    }
    if (record.therapistSignature) {
      try {
        const { buffer, width, height } = await dataUriToBuffer(record.therapistSignature);
        if (buffer.byteLength > 0) {
          const scale = 200 / width;
          signatureElements.push(new Paragraph({
            children: [new TextRun({ text: 'Therapist Signature:', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 100, after: 60 },
          }));
          signatureElements.push(new Paragraph({
            children: [new ImageRun({
              data: buffer,
              transformation: { width: 200, height: Math.round(height * scale) },
              type: 'png',
            })],
          }));
        }
      } catch { /* skip */ }
    }

    sections.push({
      properties: i > 0 ? { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } } : undefined,
      children: [
        ...headerParas,
        infoTable,
        dailyNoteHeading,
        dateTimeRow,
        progressNoteLabel,
        progressNoteText,
        ...signatureElements,
      ],
    });
  }

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  const childName = records[0].childName.replace(/\s+/g, '_');
  const fileName = `Attendance_${childName}_${payPeriod.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
}
