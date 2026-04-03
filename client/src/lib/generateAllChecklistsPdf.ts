/**
 * generateAllChecklistsPdf.ts
 *
 * Combines all four feeding evaluation checklists (Oral Motor, Feeding Behaviors,
 * Self-Feeding, Drinking) into a single multi-page PDF for comprehensive
 * clinical reference.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FeedingChecklistDataType } from '@/components/FeedingPerformanceChecklist';
import { ASPIRATION_SIGN_LABELS } from '@/components/FeedingPerformanceChecklist';
import type { FeedingBehaviorsData } from '@/components/FeedingBehaviorsChecklist';
import type { SelfFeedingData } from '@/components/SelfFeedingChecklist';
import type { DrinkingData } from '@/components/DrinkingChecklist';

interface AllChecklistsPdfOptions {
  childName: string;
  dateOfEval?: string;
  examinerName?: string;
  oralMotorData: FeedingChecklistDataType | null;
  feedingBehaviorsData: FeedingBehaviorsData | null;
  selfFeedingData: SelfFeedingData | null;
  drinkingData: DrinkingData | null;
}

function yn(v: string): string { return v === 'Y' ? 'Yes' : v === 'N' ? 'No' : '—'; }
function val(v: string): string { return v || '—'; }
function endurance(wfl: string, rating: string): string {
  if (wfl === 'WFL') return 'WFL';
  if (wfl === 'Impaired') return `Impaired – ${rating || 'N/A'}`;
  return '—';
}

type DrawFn = (title: string, rows: [string, string][], y: number, color: [number, number, number]) => number;

export function generateAllChecklistsPdf(options: AllChecklistsPdfOptions) {
  const { childName, dateOfEval, examinerName, oralMotorData, feedingBehaviorsData, selfFeedingData, drinkingData } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Shared header renderer
  const drawHeader = (title: string) => {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const hdr: string[] = [];
    if (childName) hdr.push(`Child: ${childName}`);
    if (dateOfEval) hdr.push(`Date: ${dateOfEval}`);
    if (examinerName) hdr.push(`Examiner: ${examinerName}`);
    if (hdr.length) doc.text(hdr.join('   |   '), pageWidth / 2, 17, { align: 'center' });
  };

  // Shared footer renderer
  const drawFooter = () => {
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text('Generated from OT Feeding Evaluation Tool — All Checklists Combined', pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.setTextColor(0);
  };

  // Shared section table renderer
  const drawSection: DrawFn = (title, rows, currentY, color) => {
    autoTable(doc, {
      startY: currentY,
      head: [[title, 'Finding']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.2, lineWidth: 0.1, lineColor: [160, 160, 160] },
      headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
      margin: { left: 8, right: 8 },
    });
    return (doc as any).lastAutoTable.finalY + 2;
  };

  // ================================================================
  // PAGE 1: Oral Motor Coordination
  // ================================================================
  drawHeader('Feeding Evaluation — Oral Motor Coordination');
  if (oralMotorData) {
    const d = oralMotorData;
    let y = 20;
    const c: [number, number, number] = [76, 175, 80]; // teal-green

    y = drawSection('Oral Sensory & Feeding Performance', [
      ['Foods During Assessment', val(d.foodsDuringAssessment)],
      ['Oral Seeking', yn(d.oralSeeking)],
      ['Extra-Oral Sensitivity', val(d.extraOralSensitivity)],
      ['Intra-Oral Sensitivity', val(d.intraOralSensitivity)],
    ], y, c);

    y = drawSection('Jaw', [
      ['Strength', val(d.jawStrength)],
      ['Cup Drinking', val(d.jawCupDrinking)],
      ['Biting Through Food', val(d.jawBitingThrough)],
      ['Chewing Endurance', endurance(d.jawChewingEndurance, d.jawChewingEnduranceRating)],
      ['Wide Excursions', yn(d.jawWideExcursions)],
      ['Loss of Food', yn(d.jawLossOfFood)],
      ['Chewing Pattern', val(d.jawChewingPattern)],
      ['Closed at Rest', yn(d.jawClosedAtRest)],
      ['Anticipatory Opening', yn(d.jawAnticipatoryOpening)],
    ], y, c);

    y = drawSection('Lips', [
      ['Strength', val(d.lipsStrength)],
      ['Drinking Seal', val(d.lipsDrinking) + (d.lipsDrinkingDetail ? ` (${d.lipsDrinkingDetail})` : '')],
      ['Chewing Closure', val(d.lipsChewing)],
      ['Endurance', endurance(d.lipsEndurance, d.lipsEnduranceRating)],
      ['Drooling', yn(d.lipsDrooling)],
      ['Loss of Liquid/Food', yn(d.lipsLossOfFood)],
    ], y, c);

    y = drawSection('Tongue', [
      ['Strength', val(d.tongueStrength)],
      ['Drinking (Cupping)', val(d.tongueDrinking)],
      ['Lateralizing to Molar Ridge', val(d.tongueChewingLat)],
      ['Keeping Food on Molar Ridge', val(d.tongueChewingKeep)],
      ['Chewing Endurance', endurance(d.tongueChewingEndurance, d.tongueChewingEnduranceRating)],
      ['Loss of Seal (Breast/Bottle)', yn(d.tongueLossSeal)],
      ['Loss of Food w/ Chewing', yn(d.tongueLossFood)],
      ['Lateralizes To', val(d.tongueLateralizesTo)],
      ['Prefers', val(d.tonguePrefers)],
      ['Transfers Across Midline', yn(d.tongueTransfersMidline)],
      ['Tip Elevation', val(d.tongueTipElevation)],
      ['Cleans Lips', yn(d.tongueCleanLips)],
      ['Protrusion with Swallow', yn(d.tongueProtrusionSwallow)],
    ], y, c);

    const positiveAsp = ASPIRATION_SIGN_LABELS.filter(s => d.aspirationSigns?.[s] === 'Y');
    drawSection('Additional Observations', [
      ['Soft Palate', val(d.softPalate) + (d.softPalateDescribe ? ` — ${d.softPalateDescribe}` : '')],
      ['Food Residue', yn(d.foodResidue) + ((d.foodResidueReasons?.length) ? `: ${d.foodResidueReasons.join('; ')}` : '')],
      ['Compensatory Strategies', (d.compensatoryStrategies?.length) ? d.compensatoryStrategies.join('; ') : '—'],
      ['Overall Quality', val(d.overallQuality)],
      ['Coordinated Swallow', yn(d.swallowCoordinated) + (d.swallowDescribe ? ` — ${d.swallowDescribe}` : '')],
      ['Aspiration – Thin Liquids', yn(d.aspirationThinLiquids)],
      ['Aspiration – Thickened Liquids', yn(d.aspirationThickenedLiquids) + (d.aspirationThickenedLevel ? ` (${d.aspirationThickenedLevel})` : '')],
      ['Aspiration – Solids', yn(d.aspirationSolids) + (d.aspirationSolidsType ? ` (${d.aspirationSolidsType})` : '')],
      ['Positive Aspiration Signs', positiveAsp.length > 0 ? positiveAsp.join(', ') : 'None'],
      ['Refusal Behaviors', yn(d.refusalBehaviors) + (d.refusalParentResponse ? ` — ${d.refusalParentResponse}` : '')],
      ['Self-Feeding', yn(d.selfFeeding) + (d.selfFeedingDesc ? ` — ${d.selfFeedingDesc}` : '')],
    ], y, c);
  } else {
    doc.setFontSize(9);
    doc.text('No oral motor checklist data recorded.', 10, 25);
  }
  drawFooter();

  // ================================================================
  // PAGE 2: Feeding Behaviors
  // ================================================================
  doc.addPage();
  drawHeader('Feeding Evaluation — Feeding Behaviors');
  if (feedingBehaviorsData) {
    const d = feedingBehaviorsData;
    const c: [number, number, number] = [37, 99, 235]; // blue

    drawSection('Feeding Behaviors', [
      ['Feeding Readiness', val(d.readiness)],
      ['Posture During Feeding', val(d.posture)],
      ['Seated Tolerance', val(d.seatedTolerance) + (d.seatedToleranceDesc ? ` — ${d.seatedToleranceDesc}` : '')],
      ['Drooling', yn(d.drooling) + (d.droolingDesc ? ` — ${d.droolingDesc}` : '')],
      ['Finger Feeding', yn(d.fingerFeeding) + (d.fingerFeedingDesc ? ` — ${d.fingerFeedingDesc}` : '')],
      ['Food Acceptance', val(d.foodAcceptance) + (d.foodAcceptanceDesc ? ` — ${d.foodAcceptanceDesc}` : '')],
      ['Gagging Observed', yn(d.gagging) + (d.gaggingDesc ? ` — ${d.gaggingDesc}` : '')],
      ['Refusal Behaviors', yn(d.refusalBehaviors) + (d.refusalDesc ? ` — ${d.refusalDesc}` : '')],
      ['Sensory Response to Food', val(d.sensoryResponse)],
      ['Typical Meal Duration', val(d.mealDuration)],
      ['Additional Observations', val(d.additionalObs)],
    ], 20, c);
  } else {
    doc.setFontSize(9);
    doc.text('No feeding behaviors checklist data recorded.', 10, 25);
  }
  drawFooter();

  // ================================================================
  // PAGE 3: Self-Feeding Skills
  // ================================================================
  doc.addPage();
  drawHeader('Feeding Evaluation — Self-Feeding Skills');
  if (selfFeedingData) {
    const d = selfFeedingData;
    const c: [number, number, number] = [124, 58, 237]; // violet
    let y = 20;

    y = drawSection('Finger Feeding & Utensils', [
      ['Finger Feeds Independently', yn(d.fingerFeeds) + (d.fingerFeedsDesc ? ` — ${d.fingerFeedsDesc}` : '')],
      ['Spoon Use', val(d.spoonUse)],
      ['Spoon Grasp Pattern', val(d.spoonGrasp)],
      ['Spoon Accuracy', val(d.spoonAccuracy)],
      ['Fork Use', val(d.forkUse)],
      ['Fork Stabbing Ability', val(d.forkStabbing)],
    ], y, c);

    y = drawSection('Cup Drinking (Self-Feeding)', [
      ['Cup Drinking Level', val(d.cupDrinking)],
      ['Cup Type', val(d.cupType)],
      ['Spillage', yn(d.cupSpilling)],
    ], y, c);

    drawSection('Motor Coordination & Independence', [
      ['Hand-Eye Coordination', val(d.handEyeCoord)],
      ['Bilateral Coordination', val(d.bilateralCoord)],
      ['Grasp & Release', val(d.graspRelease)],
      ['Messiness', val(d.messiness)],
      ['Overall Independence', val(d.independence)],
      ['Additional Observations', val(d.additionalObs)],
    ], y, c);
  } else {
    doc.setFontSize(9);
    doc.text('No self-feeding checklist data recorded.', 10, 25);
  }
  drawFooter();

  // ================================================================
  // PAGE 4: Drinking Skills
  // ================================================================
  doc.addPage();
  drawHeader('Feeding Evaluation — Drinking Skills');
  if (drinkingData) {
    const d = drinkingData;
    const c: [number, number, number] = [0, 151, 167]; // cyan
    let y = 20;

    y = drawSection('Bottle', [
      ['Current Status', val(d.bottleUse)],
      ['Nipple Type', val(d.bottleNippleType)],
      ['Suck Pattern', val(d.bottleSuckPattern)],
      ['Lip Seal', val(d.bottleLipSeal)],
      ['Suck-Swallow-Breathe Coordination', val(d.bottleSwallowCoord)],
    ], y, c);

    y = drawSection('Sippy Cup', [
      ['Current Status', val(d.sippyCupUse)],
      ['Type', val(d.sippyCupType)],
      ['Lip Seal', val(d.sippyCupLipSeal)],
      ['Jaw Stability', val(d.sippyCupJawStability)],
    ], y, c);

    y = drawSection('Straw', [
      ['Current Status', val(d.strawUse)],
      ['Suck Strength', val(d.strawSuckStrength)],
      ['Lip Seal', val(d.strawLipSeal)],
      ['Liquid Loss', yn(d.strawLiquidLoss)],
    ], y, c);

    y = drawSection('Open Cup', [
      ['Current Status', val(d.openCupUse)],
      ['Jaw Grading', val(d.openCupJawGrading)],
      ['Lip Seal', val(d.openCupLipSeal)],
      ['Liquid Loss', yn(d.openCupLiquidLoss)],
      ['Assist Level', val(d.openCupAssistLevel)],
    ], y, c);

    drawSection('General Drinking Observations', [
      ['Liquid Preferences', val(d.liquidPreferences)],
      ['Liquid Consistency', val(d.liquidConsistency)],
      ['Liquid Temperature', val(d.liquidTemp)],
      ['Swallow Coordination', val(d.swallowCoordDrinking)],
      ['Coughing with Liquids', yn(d.coughingWithLiquids)],
      ['Nasal Regurgitation', yn(d.nasalRegurgitation)],
      ['Additional Observations', val(d.additionalObs)],
    ], y, c);
  } else {
    doc.setFontSize(9);
    doc.text('No drinking checklist data recorded.', 10, 25);
  }
  drawFooter();

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
    doc.setTextColor(0);
  }

  // Save
  const safeName = childName.replace(/\s+/g, '_') || 'Child';
  doc.save(`${safeName}_All_Feeding_Checklists.pdf`);
}
