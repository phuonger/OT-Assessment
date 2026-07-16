/**
 * Generate Attendance PDF for E-Signature
 * 
 * Creates a clean PDF of an attendance record suitable for sending
 * via Adobe Sign for parent signature. Returns a Blob instead of
 * downloading directly, so it can be used in the signature workflow.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadAppSettings } from '@/components/SettingsPreferences';
import { type AttendanceRecord } from '@/lib/attendanceStorage';

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate a PDF blob for an attendance record.
 * Returns the blob and a suggested filename.
 */
export async function generateAttendancePdfBlob(record: AttendanceRecord, profileNumber?: number): Promise<{ blob: Blob; filename: string }> {
  const appSettings = loadAppSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPos = 15;

  // Practice header
  if (appSettings.practiceName) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(appSettings.practiceName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
  }

  const contactParts = [appSettings.practicePhone, appSettings.practiceEmail, appSettings.practiceAddress].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(contactParts.join(' | '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance / Daily Note', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Info table
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Child Name:', record.childName, 'Therapist:', record.therapistName],
      ['UCI:', record.uci || 'N/A', 'SC:', record.sc || 'N/A'],
      ['Type/Frequency:', record.typeFrequency || 'N/A', 'Pay Period:', record.payPeriod],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 55 },
    },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Date/Time
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Time']],
    body: [[formatDate(record.date), record.time]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [13, 115, 119], textColor: 255 },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Progress Note
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Progress Note:', 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Wrap long text
  const noteLines = doc.splitTextToSize(record.progressNote || 'No progress note recorded.', pageWidth - 30);
  doc.text(noteLines, 15, yPos);
  yPos += noteLines.length * 4 + 10;

  // Therapist Signature section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Therapist Signature:', 15, yPos);
  yPos += 5;

  if (record.therapistSignature) {
    try {
      doc.addImage(record.therapistSignature, 'PNG', 15, yPos, 50, 20);
      yPos += 23;
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('[Signed electronically]', 15, yPos + 5);
      yPos += 10;
    }
  } else {
    // Draw signature line for therapist
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(15, yPos + 10, 100, yPos + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sign here', 15, yPos + 14);
    yPos += 18;
    doc.text('Date: _______________', 15, yPos);
    yPos += 10;
  }

  // Parent/Guardian Signature section
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Parent/Guardian Signature:', 15, yPos);
  yPos += 5;

  if (record.parentSignature) {
    try {
      doc.addImage(record.parentSignature, 'PNG', 15, yPos, 50, 20);
      yPos += 23;
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('[Signed electronically]', 15, yPos + 5);
      yPos += 10;
    }
  } else {
    // Draw signature line for parent/guardian
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(15, yPos + 10, 100, yPos + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sign here', 15, yPos + 14);
    yPos += 18;
    doc.text('Date: _______________', 15, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} — This document requires electronic signature via Adobe Sign.`,
    pageWidth / 2, footerY, { align: 'center' }
  );

  const blob = doc.output('blob');
  const profileSuffix = profileNumber ? `-${profileNumber}` : '';
  const filename = `Attendance_${record.childName.replace(/\s+/g, '_')}${profileSuffix}-${record.date}.pdf`;

  return { blob, filename };
}

/**
 * Generate and immediately download the attendance PDF.
 */
export async function downloadAttendancePdf(record: AttendanceRecord): Promise<void> {
  const { blob, filename } = await generateAttendancePdfBlob(record);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
