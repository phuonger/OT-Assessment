/**
 * Generate Assessment Summary PDF for E-Signature
 * 
 * Creates a clean PDF summary of a completed assessment suitable for
 * sending via Adobe Sign for parent signature. Returns a Blob.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadAppSettings } from '@/components/SettingsPreferences';
import type { FormScoreSummary } from '@/lib/multiSessionStorage';

interface AssessmentPdfData {
  childName: string;
  childDob: string;
  testDate: string;
  examinerName: string;
  examinerTitle: string;
  formSummaries: FormScoreSummary[];
  label?: string;
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate a PDF blob for an assessment summary.
 * Returns the blob and a suggested filename.
 */
export async function generateAssessmentPdfBlob(data: AssessmentPdfData): Promise<{ blob: Blob; filename: string }> {
  const appSettings = loadAppSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 15;

  // Practice header
  if (appSettings.practiceName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(appSettings.practiceName, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  if (appSettings.practicePhone || appSettings.practiceEmail) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const contactParts = [appSettings.practicePhone, appSettings.practiceEmail].filter(Boolean);
    doc.text(contactParts.join(' | '), pageWidth / 2, y, { align: 'center' });
    y += 4;
  }
  if (appSettings.practiceAddress) {
    doc.setFontSize(8);
    doc.text(appSettings.practiceAddress, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Title
  y += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVELOPMENTAL ASSESSMENT SUMMARY', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setDrawColor(13, 115, 119);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Child & Examiner info table
  const infoRows = [
    ['Child Name', data.childName],
    ['Date of Birth', data.childDob ? formatDate(data.childDob) : 'N/A'],
    ['Test Date', data.testDate ? formatDate(data.testDate) : 'N/A'],
    ['Examiner', data.examinerName || 'N/A'],
    ['Title', data.examinerTitle || 'N/A'],
  ];
  if (data.label) {
    infoRows.push(['Session Label', data.label]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: infoRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 115, 119], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: 20, right: 20 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Form summaries
  for (const form of data.formSummaries) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(form.formName, 20, y);
    y += 2;

    const domainRows = form.domains.map(d => [
      d.domainName,
      d.rawScore.toString(),
      `${d.itemsScored} / ${d.totalItems}`,
    ]);
    domainRows.push(['TOTAL', form.totalRawScore.toString(), '']);

    autoTable(doc, {
      startY: y,
      head: [['Domain', 'Raw Score', 'Items Scored']],
      body: domainRows,
      theme: 'striped',
      headStyles: { fillColor: [13, 115, 119], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signature section
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  // Therapist signature line
  doc.line(20, y, 90, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Therapist Signature', 20, y + 4);
  doc.text('Date: _______________', 95, y + 4);

  y += 15;

  // Parent signature line
  doc.line(20, y, 90, y);
  doc.text('Parent/Guardian Signature', 20, y + 4);
  doc.text('Date: _______________', 95, y + 4);

  y += 12;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'This document requires electronic signature via Adobe Sign. The Certificate of Completion',
    20, y
  );
  doc.text(
    'provides a tamper-proof audit trail including timestamp, email verification, and IP address.',
    20, y + 3.5
  );

  // Generate blob
  const pdfBlob = doc.output('blob');
  const safeName = data.childName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = data.testDate || new Date().toISOString().split('T')[0];
  const filename = `Assessment_${safeName}_${dateStr}.pdf`;

  return { blob: pdfBlob, filename };
}
