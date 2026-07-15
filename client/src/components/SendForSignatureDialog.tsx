/**
 * SendForSignatureDialog
 * 
 * A dialog that guides the therapist through sending an attendance record
 * or assessment for parent e-signature via Adobe Sign.
 * 
 * Steps:
 * 1. Confirm parent email and review document details
 * 2. Generate PDF and download it
 * 3. Open Adobe Sign to send for signature
 * 4. Track the request
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send, Download, ExternalLink, CheckCircle2, Mail,
  FileText, Shield, Clock, X, AlertCircle
} from 'lucide-react';
import { type AttendanceRecord } from '@/lib/attendanceStorage';
import { type ClientProfile } from '@/lib/clientProfileStorage';
import {
  sendAttendanceForSignature,
  openAdobeSignForSend,
  downloadPdfBlob,
} from '@/lib/signatureService';
import { uploadSignedDocument, loadSyncConfig } from '@/lib/googleDriveSync';
import { toast } from 'sonner';

interface SendForSignatureDialogProps {
  record: AttendanceRecord;
  profile: ClientProfile;
  onClose: () => void;
  onSent: () => void;
}

export default function SendForSignatureDialog({ record, profile, onClose, onSent }: SendForSignatureDialogProps) {
  const [step, setStep] = useState<'confirm' | 'generating' | 'download' | 'done'>('confirm');
  const [uploading, setUploading] = useState(false);
  const driveConnected = loadSyncConfig().connected;
  const [parentEmail, setParentEmail] = useState(profile.parentEmail || '');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!parentEmail.trim() || !parentEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep('generating');

    try {
      const { request, pdfBlob: blob, filename } = await sendAttendanceForSignature(
        profile.id,
        record,
        parentEmail.trim()
      );
      setPdfBlob(blob);
      setPdfFilename(filename);
      setStep('download');
      toast.success('PDF generated and signature request created');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError('Failed to generate PDF. Please try again.');
      setStep('confirm');
    }
  };

  const handleDownload = () => {
    if (pdfBlob && pdfFilename) {
      downloadPdfBlob(pdfBlob, pdfFilename);
    }
  };

  const handleOpenAdobeSign = () => {
    openAdobeSignForSend();
    setStep('done');
  };

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return `${m}/${d}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E1D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0D7377] to-[#14919B] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2C2C2C]">Send for E-Signature</h2>
              <p className="text-xs text-[#8B8B8B]">Adobe Sign — Audit-proof parent verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F2ED] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#8B8B8B]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Step 1: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* Document summary */}
              <div className="bg-[#F5F2ED] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#0D7377]" />
                  <span className="text-sm font-medium text-[#2C2C2C]">Document Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[#8B8B8B]">Child:</span>
                    <span className="ml-1 text-[#2C2C2C]">{record.childName}</span>
                  </div>
                  <div>
                    <span className="text-[#8B8B8B]">Date:</span>
                    <span className="ml-1 text-[#2C2C2C]">{formatDate(record.date)}</span>
                  </div>
                  <div>
                    <span className="text-[#8B8B8B]">Time:</span>
                    <span className="ml-1 text-[#2C2C2C]">{record.time}</span>
                  </div>
                  <div>
                    <span className="text-[#8B8B8B]">Therapist:</span>
                    <span className="ml-1 text-[#2C2C2C]">{record.therapistName}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[#8B8B8B] text-sm">Therapist signed:</span>
                  {record.therapistSignature ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Yes</span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Not yet</span>
                  )}
                </div>
              </div>

              {/* Parent email */}
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C]">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                  Parent/Guardian Email
                </Label>
                <Input
                  type="email"
                  value={parentEmail}
                  onChange={e => { setParentEmail(e.target.value); setError(''); }}
                  className="mt-1.5"
                  placeholder="parent@email.com"
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
                <p className="text-xs text-[#8B8B8B] mt-1.5">
                  The parent will receive the attendance record at this email and sign it on their own device.
                </p>
              </div>

              {/* How it works */}
              <div className="border border-[#E5E1D8] rounded-lg p-4">
                <p className="text-xs font-medium text-[#2C2C2C] mb-2">How it works:</p>
                <ol className="text-xs text-[#6B6B6B] space-y-1.5 list-decimal list-inside">
                  <li>A PDF of this attendance record is generated</li>
                  <li>You upload it to Adobe Sign and enter the parent's email</li>
                  <li>Parent receives the document via email and signs on their device</li>
                  <li>Adobe Sign creates a tamper-proof audit trail (timestamp, IP, email)</li>
                  <li>Both you and the parent receive a signed copy</li>
                </ol>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
              >
                <Send className="w-4 h-4" /> Generate PDF & Continue
              </Button>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 border-3 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#6B6B6B] mt-4">Generating PDF...</p>
            </div>
          )}

          {/* Step 3: Download & Send */}
          {step === 'download' && (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">PDF Generated Successfully</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Signature request tracked. Now download and send via Adobe Sign.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#2C2C2C]">Step 1: Download the PDF</p>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full gap-2 border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/5"
                >
                  <Download className="w-4 h-4" /> Download {pdfFilename}
                </Button>
              </div>

              {driveConnected && pdfBlob && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#2C2C2C]">Also: Save to Google Drive</p>
                  <Button
                    onClick={async () => {
                      if (!pdfBlob) return;
                      setUploading(true);
                      const result = await uploadSignedDocument(
                        pdfBlob,
                        pdfFilename,
                        `${profile.firstName} ${profile.lastName}`
                      );
                      setUploading(false);
                      if (result.success) {
                        toast.success('PDF saved to Google Drive');
                      } else {
                        toast.error(result.error || 'Failed to upload to Drive');
                      }
                    }}
                    variant="outline"
                    disabled={uploading}
                    className="w-full gap-2 text-xs"
                  >
                    {uploading ? 'Uploading...' : '☁️ Save PDF to Google Drive'}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#2C2C2C]">Step 2: Send via Adobe Sign</p>
                <p className="text-xs text-[#6B6B6B]">
                  Click below to open Adobe Sign. Upload the PDF, enter <strong>{parentEmail}</strong> as the recipient, and send.
                </p>
                <Button
                  onClick={handleOpenAdobeSign}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Open Adobe Sign
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="space-y-5">
              <div className="bg-[#F5F2ED] rounded-lg p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#0D7377]/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-[#0D7377]" />
                </div>
                <h3 className="text-base font-semibold text-[#2C2C2C]">Signature Request Sent</h3>
                <p className="text-sm text-[#6B6B6B] mt-2">
                  The request has been recorded. Once the parent signs in Adobe Sign, 
                  you can update the status in the Signed Documents section.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">Reminder:</p>
                    <p className="mt-0.5">
                      After the parent signs, come back to this client's profile → Signed Documents 
                      to mark it as "Signed" and optionally upload the signed PDF.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => { onSent(); onClose(); }}
                className="w-full bg-[#0D7377] hover:bg-[#0a5c5f] text-white"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
