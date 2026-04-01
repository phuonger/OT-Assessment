/**
 * Multi-Form PDF Report Generator
 * Uses jsPDF + jspdf-autotable to create formatted clinical reports for all form types
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MultiAssessmentState } from '@/contexts/MultiAssessmentContext';
import { getFormById, getScoringLabels } from '@/lib/formRegistry';
import { lookupScaledScore, lookupAgeEquivalent, lookupGrowthScaleValue, lookupStandardScore } from '@/lib/scoringTables';
import { REEL3_AGE_EQUIVALENT, REEL3_LANGUAGE_ABILITY, REEL3_ABILITY_TO_PERCENTILE, REEL3_DESCRIPTIVE_TERMS } from '@/lib/reel3Data';

const bayleyDomainKey: Record<string, 'CG' | 'FM' | 'GM' | 'RC' | 'EC' | null> = {
  cognitive: 'CG',
  receptiveCommunication: 'RC',
  expressiveCommunication: 'EC',
  fineMotor: 'FM',
  grossMotor: 'GM',
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function calculateAgeInDays(dob: string, testDate: string, premWeeks: number): number | null {
  if (!dob || !testDate) return null;
  const birth = new Date(dob);
  const test = new Date(testDate);
  let days = Math.floor((test.getTime() - birth.getTime()) / 86400000);
  if (premWeeks > 0) days -= premWeeks * 7;
  return Math.max(0, days);
}

export function generateMultiFormPDF(state: MultiAssessmentState): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  const premWeeks = state.childInfo.premature ? state.childInfo.weeksPremature : 0;
  const ageInDays = calculateAgeInDays(state.childInfo.dob, state.childInfo.testDate, premWeeks);

  // ============================================================
  // Title Page
  // ============================================================
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 115, 119); // #0D7377
  doc.text('Developmental Assessment Report', pageWidth / 2, y + 20, { align: 'center' });

  y += 35;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const infoRows = [
    ['Child Name', `${state.childInfo.firstName} ${state.childInfo.lastName}`],
    ['Date of Birth', state.childInfo.dob || 'N/A'],
    ['Test Date', state.childInfo.testDate || 'N/A'],
    ['Gender', state.childInfo.gender || 'N/A'],
    ['Premature', state.childInfo.premature ? `Yes (${state.childInfo.weeksPremature} weeks)` : 'No'],
    ['Reason for Referral', state.childInfo.reasonForReferral || 'N/A'],
    ['Examiner', `${state.examinerInfo.name}${state.examinerInfo.title ? ` (${state.examinerInfo.title})` : ''}`],
    ['Agency', state.examinerInfo.agency || 'N/A'],
    ['Total Assessment Time', formatTime(state.totalElapsedSeconds)],
    ['Forms Administered', state.formSelections.map(fs => {
      const form = getFormById(fs.formId);
      return form?.shortName || fs.formId;
    }).join(', ')],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [100, 100, 100] },
      1: { cellWidth: pageWidth - margin * 2 - 45 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // Per-form sections
  // ============================================================
  for (const fs of state.formSelections) {
    const form = getFormById(fs.formId);
    if (!form) continue;
    const formState = state.formStates[fs.formId];
    if (!formState) continue;

    // Check if we need a new page
    if (y > 220) {
      doc.addPage();
      y = margin;
    }

    // Form header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const rgb = hexToRgb(form.color);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(form.shortName, margin, y);
    y += 3;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(form.name, margin, y + 3);
    y += 8;

    // Domain scores table
    if (form.id === 'bayley4') {
      y = renderBayley4Section(doc, form, formState, fs.selectedDomainIds, ageInDays, margin, y, pageWidth);
    } else if (form.id === 'reel3') {
      y = renderReel3Section(doc, form, formState, fs.selectedDomainIds, margin, y, pageWidth);
    } else {
      y = renderGenericSection(doc, form, formState, fs.selectedDomainIds, margin, y, pageWidth);
    }

    y += 8;

    // Item-level details
    if (y > 200) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${form.shortName} — Item-Level Details`, margin, y);
    y += 5;

    for (const dId of fs.selectedDomainIds) {
      const domain = form.domains.find(d => d.localId === dId);
      if (!domain) continue;
      const domainState = formState.domains[dId];
      if (!domainState) continue;

      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      const scoringLabels = getScoringLabels(domain.scoringType);
      const startItem = form.getStartItem(dId, formState.ageRangeLabel);

      const itemRows = domain.items.map(item => {
        const score = domainState.scores[item.number];
        const isPreScored = form.hasStartPoints && item.number < startItem;
        const isDiscontinued = domainState.discontinued && domainState.discontinuedAtItem !== null && item.number > domainState.discontinuedAtItem;
        const note = domainState.notes[item.number] || '';

        const scoreLabel = score !== null && score !== undefined
          ? `${score} (${scoringLabels.find(sl => sl.value === score)?.label || ''})`
          : '—';

        const status = isPreScored ? 'Pre-scored' : isDiscontinued ? 'Discontinued' : '';
        const desc = item.description.length > 60 ? item.description.substring(0, 57) + '...' : item.description;

        return [String(item.number), desc, scoreLabel, status, note.length > 40 ? note.substring(0, 37) + '...' : note];
      });

      autoTable(doc, {
        startY: y,
        head: [[`#`, `${domain.name}`, 'Score', 'Status', 'Notes']],
        body: itemRows,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: {
          fillColor: [rgb.r, rgb.g, rgb.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: pageWidth - margin * 2 - 68 },
          2: { cellWidth: 25 },
          3: { cellWidth: 18 },
          4: { cellWidth: 17 },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 5;
    }
  }

  // ============================================================
  // Disclaimer
  // ============================================================
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(130, 130, 130);
  doc.text(
    'This report is generated from a digital assessment administration tool. All scores should be verified by a qualified professional.',
    margin,
    y + 5,
    { maxWidth: pageWidth - margin * 2 }
  );

  // Save
  const fileName = `${state.childInfo.firstName}_${state.childInfo.lastName}_assessment_${state.childInfo.testDate}.pdf`;
  doc.save(fileName);
}

// ============================================================
// Bayley-4 Section
// ============================================================

function renderBayley4Section(
  doc: jsPDF, form: any, formState: any, selectedDomainIds: string[],
  ageInDays: number | null, margin: number, y: number, pageWidth: number
): number {
  const rgb = hexToRgb(form.color);
  const rows: string[][] = [];

  const scaledScores: Record<string, number | null> = {};

  for (const dId of selectedDomainIds) {
    const domain = form.domains.find((d: any) => d.localId === dId);
    if (!domain) continue;
    const domainState = formState.domains[dId];
    if (!domainState) continue;

    const rawScore = Object.values(domainState.scores as Record<string, number | null>).reduce((sum: number, s) => sum + (s || 0), 0);
    const scored = domain.items.filter((item: any) => {
      const s = domainState.scores[item.number];
      return s !== null && s !== undefined;
    }).length;
    const key = bayleyDomainKey[dId];
    let scaledScore: number | null = null;
    let ageEquivalent = '—';
    let gsv = '—';
    let percentDelay = '—';

    if (key && ageInDays !== null) {
      scaledScore = lookupScaledScore(rawScore, key, ageInDays);
      const aeResult = lookupAgeEquivalent(rawScore, key);
      if (aeResult && aeResult.months !== null) {
        ageEquivalent = `${aeResult.months} mo${aeResult.days !== null ? ` ${aeResult.days} d` : ''}`;
        const childAgeMonths = Math.floor(ageInDays / 30.44);
        const aeMonths = typeof aeResult.months === 'string' ? parseFloat(aeResult.months) : aeResult.months;
        if (childAgeMonths > 0 && !isNaN(aeMonths)) {
          const delay = ((childAgeMonths - aeMonths) / childAgeMonths) * 100;
          percentDelay = `${Math.round(delay)}%`;
        }
      }
      const gsvResult = lookupGrowthScaleValue(rawScore, key);
      if (gsvResult !== null) gsv = String(gsvResult);
    }

    scaledScores[dId] = scaledScore;
    const timer = formatTime(domainState.timerSeconds || 0);
    const status = domainState.discontinued ? 'Disc.' : scored === domain.items.length ? 'Complete' : `${scored}/${domain.items.length}`;

    rows.push([
      domain.name,
      String(rawScore),
      scaledScore !== null ? String(scaledScore) : '—',
      ageEquivalent,
      gsv,
      percentDelay,
      status,
      timer,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Domain', 'Raw', 'Scaled', 'Age Eq.', 'GSV', '% Delay', 'Status', 'Time']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [rgb.r, rgb.g, rgb.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Composite scores
  const cgScaled = scaledScores['cognitive'];
  const fmScaled = scaledScores['fineMotor'];
  const gmScaled = scaledScores['grossMotor'];

  const compositeRows: string[][] = [];
  if (cgScaled !== null && cgScaled !== undefined) {
    const result = lookupStandardScore(cgScaled, 'COG');
    compositeRows.push(['Cognitive', String(cgScaled), result ? String(result.standardScore) : '—', result?.percentileRank || '—']);
  }
  if (fmScaled !== null && fmScaled !== undefined && gmScaled !== null && gmScaled !== undefined) {
    const sum = fmScaled + gmScaled;
    const result = lookupStandardScore(sum, 'MOT');
    compositeRows.push(['Motor', String(sum), result ? String(result.standardScore) : '—', result?.percentileRank || '—']);
  }

  if (compositeRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Composite', 'Sum Scaled', 'Standard Score', 'Percentile']],
      body: compositeRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY;
  }

  return y;
}

// ============================================================
// REEL-3 Section
// ============================================================

function renderReel3Section(
  doc: jsPDF, form: any, formState: any, selectedDomainIds: string[],
  margin: number, y: number, pageWidth: number
): number {
  const rgb = hexToRgb(form.color);
  const rows: string[][] = [];
  let recRaw = 0, expRaw = 0;

  for (const dId of selectedDomainIds) {
    const domain = form.domains.find((d: any) => d.localId === dId);
    if (!domain) continue;
    const domainState = formState.domains[dId];
    if (!domainState) continue;

    const rawScore = Object.values(domainState.scores as Record<string, number | null>).reduce((sum: number, s) => sum + (s || 0), 0);
    const scored = domain.items.filter((item: any) => domainState.scores[item.number] !== null && domainState.scores[item.number] !== undefined).length;

    if (dId === 'receptive') recRaw = rawScore;
    if (dId === 'expressive') expRaw = rawScore;

    let ageEquivalent = '—';
    const aeEntry = REEL3_AGE_EQUIVALENT.find(e => e.raw === rawScore);
    if (aeEntry) {
      const months = dId === 'receptive' ? aeEntry.receptiveMonths : aeEntry.expressiveMonths;
      if (months !== null) ageEquivalent = `${months} mo`;
    }

    const status = domainState.discontinued ? 'Disc.' : scored === domain.items.length ? 'Complete' : `${scored}/${domain.items.length}`;
    rows.push([domain.name, String(rawScore), ageEquivalent, status, formatTime(domainState.timerSeconds || 0)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Domain', 'Raw Score', 'Age Equiv.', 'Status', 'Time']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Language ability composite
  if (recRaw > 0 || expRaw > 0) {
    const sum = recRaw + expRaw;
    const entry = REEL3_LANGUAGE_ABILITY.find(e => e.subtestSum === sum);
    if (entry) {
      const percEntry = REEL3_ABILITY_TO_PERCENTILE.find(e => e.ability === entry.languageAbility);
      const termEntry = REEL3_DESCRIPTIVE_TERMS.find(e => e.ability === entry.languageAbility);
      autoTable(doc, {
        startY: y,
        head: [['Language Composite', 'Subtest Sum', 'Ability', 'Percentile', 'Classification']],
        body: [[
          'Language Ability',
          String(sum),
          String(entry.languageAbility),
          percEntry ? String(percEntry.percentile) : '—',
          termEntry?.term || '—',
        ]],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY;
    }
  }

  return y;
}

// ============================================================
// Generic Section (DAYC-2, SP2)
// ============================================================

function renderGenericSection(
  doc: jsPDF, form: any, formState: any, selectedDomainIds: string[],
  margin: number, y: number, pageWidth: number
): number {
  const rgb = hexToRgb(form.color);
  const rows: string[][] = [];

  for (const dId of selectedDomainIds) {
    const domain = form.domains.find((d: any) => d.localId === dId);
    if (!domain) continue;
    const domainState = formState.domains[dId];
    if (!domainState) continue;

    const rawScore = Object.values(domainState.scores as Record<string, number | null>).reduce((sum: number, s) => sum + (s || 0), 0);
    const scored = domain.items.filter((item: any) => domainState.scores[item.number] !== null && domainState.scores[item.number] !== undefined).length;
    const status = domainState.discontinued ? 'Disc.' : scored === domain.items.length ? 'Complete' : `${scored}/${domain.items.length}`;

    rows.push([domain.name, String(rawScore), `${scored}/${domain.items.length}`, status, formatTime(domainState.timerSeconds || 0)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Domain', 'Raw Score', 'Items', 'Status', 'Time']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY;
}

// ============================================================
// Helpers
// ============================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}
