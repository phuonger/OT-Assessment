/*
 * PDF Report Generator for Bayley-4 Assessment
 * Uses jsPDF + jspdf-autotable to create a formatted clinical report
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DomainScore {
  name: string;
  rawScore: number;
  scaledScore: number | null;
  ageEquivalent: string | null;
  growthScaleValue: number | null;
  percentDelay: string | null;
  itemsAnswered: number;
  totalItems: number;
  discontinued: boolean;
}

interface CompositeScore {
  name: string;
  scaledScoreSum: string;
  standardScore: number;
  percentileRank: string;
}

interface ChildInfo {
  name: string;
  dateOfBirth: string;
  sex: string;
  examDate: string;
  examiner: string;
  startPoint: string;
  ageRange: string;
  reasonForReferral: string;
  premature: string;
  prematureWeeks: string;
  notes: string;
}

interface ItemScore {
  domain: string;
  itemNumber: number;
  description: string;
  score: number | null;
  isPreScored: boolean;
  isDiscontinued: boolean;
  note?: string;
}

interface DomainTimer {
  name: string;
  elapsedSeconds: number;
}

export interface PDFReportData {
  childInfo: ChildInfo;
  domainScores: DomainScore[];
  compositeScores: CompositeScore[];
  itemScores: ItemScore[];
  domainTimers?: DomainTimer[];
}

export function generatePDFReport(data: PDFReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const teal = [13, 115, 119] as [number, number, number];
  const darkGray = [51, 51, 51] as [number, number, number];
  const medGray = [120, 120, 120] as [number, number, number];
  const lightBg = [248, 247, 244] as [number, number, number];

  // ── HEADER ──
  doc.setFillColor(...lightBg);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...teal);
  doc.text('Bayley-4 Assessment Report', margin, y + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...medGray);
  doc.text('Bayley Scales of Infant and Toddler Development, 4th Edition', margin, y + 17);

  // Date generated
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y + 10, { align: 'right' });

  y = 45;

  // ── CHILD INFORMATION ──
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...teal);
  doc.text('Child Information', margin, y);
  y += 2;

  doc.setDrawColor(...teal);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  const infoFields = [
    ['Child Name', data.childInfo.name],
    ['Date of Birth', data.childInfo.dateOfBirth || 'Not specified'],
    ['Sex', data.childInfo.sex || 'Not specified'],
    ['Exam Date', data.childInfo.examDate],
    ['Examiner', data.childInfo.examiner],
    ['Start Point', data.childInfo.startPoint],
    ['Age Range', data.childInfo.ageRange || 'Not specified'],
  ];

  if (data.childInfo.premature === 'Yes') {
    infoFields.push(['Premature', `Yes (${data.childInfo.prematureWeeks} weeks)`]);
  }
  if (data.childInfo.reasonForReferral) {
    infoFields.push(['Reason for Referral', data.childInfo.reasonForReferral]);
  }

  // Two-column child info layout
  const colWidth = contentWidth / 2;
  doc.setFontSize(8);
  for (let i = 0; i < infoFields.length; i += 2) {
    const [label1, value1] = infoFields[i];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text(label1 + ':', margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text(value1, margin + 30, y);

    if (i + 1 < infoFields.length) {
      const [label2, value2] = infoFields[i + 1];
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...medGray);
      doc.text(label2 + ':', margin + colWidth, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text(value2, margin + colWidth + 30, y);
    }
    y += 5;
  }

  y += 5;

  // ── DOMAIN SCORES TABLE ──
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...teal);
  doc.text('Domain Scores', margin, y);
  y += 2;
  doc.setDrawColor(...teal);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3;

  const domainTableData = data.domainScores.map(d => [
    d.name,
    String(d.rawScore),
    d.scaledScore !== null ? String(d.scaledScore) : '—',
    d.ageEquivalent || '—',
    d.growthScaleValue !== null ? String(d.growthScaleValue) : '—',
    d.percentDelay || '—',
    d.discontinued ? 'DISC.' : `${d.itemsAnswered}/${d.totalItems}`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Domain', 'Raw Score', 'Scaled Score', 'Age Equiv.', 'Growth Scale', '% Delay', 'Status']],
    body: domainTableData,
    headStyles: {
      fillColor: teal,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkGray,
      cellPadding: 2.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 45 },
    },
    alternateRowStyles: { fillColor: [252, 251, 248] },
    theme: 'grid',
    styles: {
      lineColor: [220, 220, 215],
      lineWidth: 0.2,
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── COMPOSITE SCORES ──
  if (data.compositeScores.length > 0) {
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...teal);
    doc.text('Composite Scores', margin, y);
    y += 2;
    doc.setDrawColor(...teal);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;

    const compositeData = data.compositeScores.map(c => [
      c.name,
      c.scaledScoreSum,
      String(c.standardScore),
      c.percentileRank,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Composite', 'Scaled Score(s)', 'Standard Score', 'Percentile Rank']],
      body: compositeData,
      headStyles: {
        fillColor: teal,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkGray,
        cellPadding: 2.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 45 },
      },
      alternateRowStyles: { fillColor: [252, 251, 248] },
      theme: 'grid',
      styles: {
        lineColor: [220, 220, 215],
        lineWidth: 0.2,
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── ITEM-LEVEL SCORES ──
  // Group items by domain
  const domainGroups: Record<string, ItemScore[]> = {};
  data.itemScores.forEach(item => {
    if (!domainGroups[item.domain]) domainGroups[item.domain] = [];
    domainGroups[item.domain].push(item);
  });

  for (const [domainName, items] of Object.entries(domainGroups)) {
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...teal);
    doc.text(`${domainName} — Item Scores`, margin, y);
    y += 2;
    doc.setDrawColor(220, 220, 215);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;

    const itemData = items.map(item => {
      let scoreText = '';
      if (item.score === null || item.score === undefined) {
        scoreText = '—';
      } else if (item.isPreScored) {
        scoreText = `${item.score} (auto)`;
      } else if (item.isDiscontinued) {
        scoreText = `${item.score} (disc.)`;
      } else {
        scoreText = String(item.score);
      }

      // Truncate long descriptions
      const desc = item.description.length > 80
        ? item.description.substring(0, 77) + '...'
        : item.description;

      return [String(item.itemNumber), desc, scoreText];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Item Description', 'Score']],
      body: itemData,
      headStyles: {
        fillColor: [240, 239, 236],
        textColor: darkGray,
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: darkGray,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [252, 251, 248] },
      theme: 'grid',
      styles: {
        lineColor: [235, 235, 230],
        lineWidth: 0.15,
        overflow: 'linebreak',
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const text = hookData.cell.raw as string;
          if (text.includes('(auto)')) {
            hookData.cell.styles.textColor = [34, 197, 94];
          } else if (text.includes('(disc.)')) {
            hookData.cell.styles.textColor = [156, 163, 175];
          } else if (text === '2') {
            hookData.cell.styles.textColor = [34, 197, 94];
          } else if (text === '1') {
            hookData.cell.styles.textColor = [245, 158, 11];
          } else if (text === '0') {
            hookData.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── ADMINISTRATION TIME ──
  if (data.domainTimers && data.domainTimers.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...teal);
    doc.text('Administration Time', margin, y);
    y += 2;
    doc.setDrawColor(220, 220, 215);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;

    const timerData = data.domainTimers.map(t => {
      const m = Math.floor(t.elapsedSeconds / 60);
      const s = t.elapsedSeconds % 60;
      return [t.name, `${m}:${String(s).padStart(2, '0')}`];
    });
    const totalSecs = data.domainTimers.reduce((sum, t) => sum + t.elapsedSeconds, 0);
    const totalM = Math.floor(totalSecs / 60);
    const totalS = totalSecs % 60;
    timerData.push(['Total Session Time', `${totalM}:${String(totalS).padStart(2, '0')}`]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Domain', 'Time']],
      body: timerData,
      headStyles: {
        fillColor: teal,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkGray,
        cellPadding: 2.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [252, 251, 248] },
      theme: 'grid',
      styles: {
        lineColor: [220, 220, 215],
        lineWidth: 0.2,
      },
      didParseCell: (hookData: any) => {
        // Bold the total row
        if (hookData.section === 'body' && hookData.row.index === timerData.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [240, 239, 236];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── EXAMINER NOTES ──
  const itemNotes = data.itemScores.filter(item => item.note && item.note.trim());
  if (data.childInfo.notes || itemNotes.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...teal);
    doc.text('Examiner Notes', margin, y);
    y += 2;
    doc.setDrawColor(220, 220, 215);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    // General notes
    if (data.childInfo.notes) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...medGray);
      doc.text('General Notes:', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      const noteLines = doc.splitTextToSize(data.childInfo.notes, contentWidth);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 3.5 + 4;
    }

    // Item-level notes
    if (itemNotes.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...medGray);
      doc.text(`Item-Level Notes (${itemNotes.length}):`, margin, y);
      y += 3;

      const notesTableData = itemNotes.map(item => [
        item.domain,
        `#${item.itemNumber}`,
        item.description.length > 50 ? item.description.substring(0, 47) + '...' : item.description,
        item.note || '',
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Domain', '#', 'Item', 'Note']],
        body: notesTableData,
        headStyles: {
          fillColor: [255, 243, 205],
          textColor: [146, 64, 14],
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: darkGray,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 45 },
          3: { cellWidth: 'auto' },
        },
        alternateRowStyles: { fillColor: [255, 252, 245] },
        theme: 'grid',
        styles: {
          lineColor: [235, 235, 230],
          lineWidth: 0.15,
          overflow: 'linebreak',
        },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ── DISCLAIMER ──
  if (y > 245) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('Important Notice', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(161, 98, 7);
  const disclaimerText = 'This report is a digital adaptation of the Bayley Scales of Infant and Toddler Development, 4th Edition (Bayley-4) for data collection purposes. Scaled scores, standard scores, age equivalents, and growth scale values are calculated from the scoring tables in the provided template. Always verify results against the official Bayley-4 scoring tables and consult the Administration and Scoring Manual for proper interpretation. This tool does not replace the professional judgment of a qualified examiner.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 6);
  doc.text(disclaimerLines, margin + 3, y + 8);

  // ── PAGE NUMBERS ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
    doc.text(
      'Bayley-4 Assessment Report',
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  // Save the PDF
  const fileName = `Bayley4-Report-${data.childInfo.name.replace(/\s+/g, '_')}-${data.childInfo.examDate}.pdf`;
  
  try {
    // Primary method: direct download
    doc.save(fileName);
  } catch {
    // Fallback: open in new tab
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
