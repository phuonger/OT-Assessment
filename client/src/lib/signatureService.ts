/**
 * Signature Service
 * 
 * Manages the e-signature workflow:
 * 1. Generate PDF from attendance/assessment
 * 2. Open Adobe Sign with the document pre-loaded
 * 3. Track signature request status per client profile
 * 
 * Semi-automated approach: generates the PDF locally, then opens
 * Adobe Sign's web interface for the therapist to send.
 */

import { type SignatureRequest, type SignatureStatus, getProfile, updateProfile } from '@/lib/clientProfileStorage';
import { type AttendanceRecord } from '@/lib/attendanceStorage';
import { generateAttendancePdfBlob } from '@/lib/generateAttendancePdf';
import { generateAssessmentPdfBlob } from '@/lib/generateAssessmentPdf';
import type { FormScoreSummary } from '@/lib/multiSessionStorage';

const SIGNATURE_REQUESTS_KEY = 'ot_signature_requests';

function generateRequestId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Signature Request CRUD (global store + per-profile)
// ============================================================

/** Load all signature requests from global store */
export function loadAllSignatureRequests(): SignatureRequest[] {
  try {
    const raw = localStorage.getItem(SIGNATURE_REQUESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAllSignatureRequests(requests: SignatureRequest[]): void {
  localStorage.setItem(SIGNATURE_REQUESTS_KEY, JSON.stringify(requests));
}

/** Create a new signature request and add it to the profile */
export function createSignatureRequest(
  profileId: string,
  data: {
    type: 'attendance' | 'assessment';
    referenceId: string;
    documentName: string;
    parentEmail: string;
    therapistSigned: boolean;
  }
): SignatureRequest {
  const request: SignatureRequest = {
    id: generateRequestId(),
    type: data.type,
    referenceId: data.referenceId,
    documentName: data.documentName,
    parentEmail: data.parentEmail,
    therapistSigned: data.therapistSigned,
    status: 'pending',
    sentAt: new Date().toISOString(),
  };

  // Add to global store
  const all = loadAllSignatureRequests();
  all.unshift(request);
  saveAllSignatureRequests(all);

  // Add to profile
  const profile = getProfile(profileId);
  if (profile) {
    const requests = [...(profile.signatureRequests || []), request];
    updateProfile(profileId, { signatureRequests: requests });
  }

  return request;
}

/** Update a signature request status */
export function updateSignatureRequestStatus(
  profileId: string,
  requestId: string,
  status: SignatureStatus,
  signedPdfPath?: string
): void {
  // Update global store
  const all = loadAllSignatureRequests();
  const idx = all.findIndex(r => r.id === requestId);
  if (idx !== -1) {
    all[idx].status = status;
    if (status === 'signed') {
      all[idx].signedAt = new Date().toISOString();
      if (signedPdfPath) all[idx].signedPdfPath = signedPdfPath;
    }
    saveAllSignatureRequests(all);
  }

  // Update profile
  const profile = getProfile(profileId);
  if (profile) {
    const requests = (profile.signatureRequests || []).map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          ...(status === 'signed' ? { signedAt: new Date().toISOString(), signedPdfPath } : {}),
        };
      }
      return r;
    });
    updateProfile(profileId, { signatureRequests: requests });
  }
}

/** Delete a signature request */
export function deleteSignatureRequest(profileId: string, requestId: string): void {
  // Remove from global store
  const all = loadAllSignatureRequests();
  saveAllSignatureRequests(all.filter(r => r.id !== requestId));

  // Remove from profile
  const profile = getProfile(profileId);
  if (profile) {
    const requests = (profile.signatureRequests || []).filter(r => r.id !== requestId);
    updateProfile(profileId, { signatureRequests: requests });
  }
}

/** Get signature requests for a profile */
export function getSignatureRequestsByProfile(profileId: string): SignatureRequest[] {
  const profile = getProfile(profileId);
  if (!profile) return [];
  return (profile.signatureRequests || []).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );
}

/** Get pending signature requests count */
export function getPendingSignatureCount(profileId: string): number {
  const profile = getProfile(profileId);
  if (!profile) return 0;
  return (profile.signatureRequests || []).filter(r => r.status === 'pending').length;
}

// ============================================================
// Adobe Sign Integration (Semi-Automated)
// ============================================================

/**
 * Generate PDF and initiate the Adobe Sign workflow.
 * 
 * Flow:
 * 1. Generate the attendance PDF
 * 2. Download it locally (so therapist has it)
 * 3. Open Adobe Sign's "Request Signature" page
 * 4. Create a tracking record
 * 
 * The therapist then uploads the PDF to Adobe Sign and sends it.
 * In the future, this could be fully automated via API.
 */
export async function sendAttendanceForSignature(
  profileId: string,
  record: AttendanceRecord,
  parentEmail: string
): Promise<{ request: SignatureRequest; pdfBlob: Blob; filename: string }> {
  // Get profile number for filename
  const profile = getProfile(profileId);
  const profileNumber = profile?.profileNumber;
  // Generate the PDF
  const { blob, filename } = await generateAttendancePdfBlob(record, profileNumber);

  // Create the signature request tracking record
  const request = createSignatureRequest(profileId, {
    type: 'attendance',
    referenceId: record.id,
    documentName: `Attendance - ${record.childName} - ${formatDate(record.date)}`,
    parentEmail,
    therapistSigned: !!record.therapistSignature,
  });

  return { request, pdfBlob: blob, filename };
}

/**
 * Generate PDF and initiate the Adobe Sign workflow for an assessment.
 */
export async function sendAssessmentForSignature(
  profileId: string,
  assessmentId: string,
  data: {
    childName: string;
    childDob: string;
    testDate: string;
    examinerName: string;
    examinerTitle: string;
    formSummaries: FormScoreSummary[];
    label?: string;
  },
  parentEmail: string
): Promise<{ request: SignatureRequest; pdfBlob: Blob; filename: string }> {
  // Get profile number for filename
  const profile = getProfile(profileId);
  const profileNumber = profile?.profileNumber;
  // Generate the PDF
  const { blob, filename } = await generateAssessmentPdfBlob({ ...data, profileNumber });

  // Create the signature request tracking record
  const request = createSignatureRequest(profileId, {
    type: 'assessment',
    referenceId: assessmentId,
    documentName: `Assessment - ${data.childName} - ${data.testDate || 'undated'}`,
    parentEmail,
    therapistSigned: true, // therapist completed the assessment
  });

  return { request, pdfBlob: blob, filename };
}

/**
 * Open Adobe Sign in the browser for the therapist to complete the send.
 * Uses the Adobe Acrobat Sign web interface.
 */
export function openAdobeSignForSend(): void {
  // Adobe Sign's "Request Signature" page
  const adobeSignUrl = 'https://documentcloud.adobe.com/link/acrobat/sendforsignature';
  
  // Try Electron shell.openExternal first, fallback to window.open
  if ((window as any).electronAPI?.openExternal) {
    (window as any).electronAPI.openExternal(adobeSignUrl);
  } else {
    window.open(adobeSignUrl, '_blank');
  }
}

/**
 * Download the PDF blob as a file.
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return dateStr;
  }
}
