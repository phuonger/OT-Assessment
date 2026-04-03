/**
 * generateChecklistPdf.ts
 *
 * Exports the raw feeding checklist selections as a compact, one-page PDF
 * for quick clinical reference during in-person sessions.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FeedingChecklistDataType } from '@/components/FeedingPerformanceChecklist';
import { ASPIRATION_SIGN_LABELS } from '@/components/FeedingPerformanceChecklist';

interface ChecklistPdfOptions {
  childName: string;
  dateOfEval?: string;
  examinerName?: string;
  data: FeedingChecklistDataType;
}

function endurance(wfl: string, rating: string): string {
  if (wfl === 'WFL') return 'WFL';
  if (wfl === 'Impaired') return `Impaired – ${rating || 'N/A'}`;
  return '—';
}

function yn(val: string): string {
  if (val === 'Y') return 'Yes';
  if (val === 'N') return 'No';
  return '—';
}

function val(v: string): string {
  return v || '—';
}

export function generateChecklistPdf(options: ChecklistPdfOptions) {
  const { childName, dateOfEval, examinerName, data } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OT Feeding Evaluation – Checklist Summary', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const headerParts: string[] = [];
  if (childName) headerParts.push(`Child: ${childName}`);
  if (dateOfEval) headerParts.push(`Date: ${dateOfEval}`);
  if (examinerName) headerParts.push(`Examiner: ${examinerName}`);
  if (headerParts.length > 0) {
    doc.text(headerParts.join('   |   '), pageWidth / 2, 17, { align: 'center' });
  }

  let startY = 20;

  // Helper to draw a section table
  const drawSection = (title: string, rows: [string, string][], currentY: number): number => {
    autoTable(doc, {
      startY: currentY,
      head: [[title, 'Finding']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.2, lineWidth: 0.1, lineColor: [160, 160, 160] },
      headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 62, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 8, right: 8 },
      tableWidth: 'auto',
    });
    return (doc as any).lastAutoTable.finalY + 2;
  };

  // 1. Oral Sensory
  startY = drawSection('Oral Sensory & Feeding Performance', [
    ['Foods During Assessment', val(data.foodsDuringAssessment)],
    ['Oral Seeking', yn(data.oralSeeking)],
    ['Extra-Oral Sensitivity', val(data.extraOralSensitivity)],
    ['Intra-Oral Sensitivity', val(data.intraOralSensitivity)],
  ], startY);

  // 2. Jaw
  startY = drawSection('Jaw', [
    ['Strength', val(data.jawStrength)],
    ['Cup Drinking', val(data.jawCupDrinking)],
    ['Biting Through Food', val(data.jawBitingThrough)],
    ['Chewing Endurance', endurance(data.jawChewingEndurance, data.jawChewingEnduranceRating)],
    ['Wide Excursions', yn(data.jawWideExcursions)],
    ['Loss of Food', yn(data.jawLossOfFood)],
    ['Chewing Pattern', val(data.jawChewingPattern)],
    ['Closed at Rest', yn(data.jawClosedAtRest)],
    ['Anticipatory Opening', yn(data.jawAnticipatoryOpening)],
  ], startY);

  // 3. Lips
  startY = drawSection('Lips', [
    ['Strength', val(data.lipsStrength)],
    ['Drinking Seal', val(data.lipsDrinking) + (data.lipsDrinkingDetail ? ` (${data.lipsDrinkingDetail})` : '')],
    ['Chewing Closure', val(data.lipsChewing)],
    ['Endurance', endurance(data.lipsEndurance, data.lipsEnduranceRating)],
    ['Drooling', yn(data.lipsDrooling)],
    ['Loss of Liquid/Food', yn(data.lipsLossOfFood)],
  ], startY);

  // 4. Tongue
  startY = drawSection('Tongue', [
    ['Strength', val(data.tongueStrength)],
    ['Drinking (Cupping)', val(data.tongueDrinking)],
    ['Lateralizing to Molar Ridge', val(data.tongueChewingLat)],
    ['Keeping Food on Molar Ridge', val(data.tongueChewingKeep)],
    ['Chewing Endurance', endurance(data.tongueChewingEndurance, data.tongueChewingEnduranceRating)],
    ['Loss of Seal (Breast/Bottle)', yn(data.tongueLossSeal)],
    ['Loss of Food w/ Chewing', yn(data.tongueLossFood)],
    ['Lateralizes To', val(data.tongueLateralizesTo)],
    ['Prefers', val(data.tonguePrefers)],
    ['Transfers Across Midline', yn(data.tongueTransfersMidline)],
    ['Tip Elevation', val(data.tongueTipElevation)],
    ['Cleans Lips', yn(data.tongueCleanLips)],
    ['Protrusion with Swallow', yn(data.tongueProtrusionSwallow)],
  ], startY);

  // 5. Additional
  const positiveAsp = ASPIRATION_SIGN_LABELS.filter(s => data.aspirationSigns?.[s] === 'Y');
  startY = drawSection('Additional Observations', [
    ['Soft Palate', val(data.softPalate) + (data.softPalateDescribe ? ` — ${data.softPalateDescribe}` : '')],
    ['Food Residue', yn(data.foodResidue) + ((data.foodResidueReasons?.length) ? `: ${data.foodResidueReasons.join('; ')}` : '')],
    ['Compensatory Strategies', (data.compensatoryStrategies?.length) ? data.compensatoryStrategies.join('; ') : '—'],
    ['Overall Quality', val(data.overallQuality)],
    ['Coordinated Swallow', yn(data.swallowCoordinated) + (data.swallowDescribe ? ` — ${data.swallowDescribe}` : '')],
    ['Aspiration Signs – Thin Liquids', yn(data.aspirationThinLiquids)],
    ['Aspiration Signs – Thickened Liquids', yn(data.aspirationThickenedLiquids) + (data.aspirationThickenedLevel ? ` (${data.aspirationThickenedLevel})` : '')],
    ['Aspiration Signs – Solids', yn(data.aspirationSolids) + (data.aspirationSolidsType ? ` (${data.aspirationSolidsType})` : '')],
    ['Positive Aspiration Signs', positiveAsp.length > 0 ? positiveAsp.join(', ') : 'None'],
    ['Refusal Behaviors', yn(data.refusalBehaviors) + (data.refusalParentResponse ? ` — ${data.refusalParentResponse}` : '')],
    ['Self-Feeding', yn(data.selfFeeding) + (data.selfFeedingDesc ? ` — ${data.selfFeedingDesc}` : '')],
  ], startY);

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text('Generated from Feeders & Growers OT Feeding Evaluation Tool', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });

  // Save
  const safeName = childName.replace(/\s+/g, '_') || 'Child';
  doc.save(`${safeName}_Feeding_Checklist.pdf`);
}
