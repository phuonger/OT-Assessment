/**
 * SignedDocumentsPanel
 * 
 * Shows all signature requests for a client profile with status tracking.
 * Allows therapists to update status (mark as signed, expired, etc.)
 * and upload signed PDFs from Adobe Sign.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  Send, Trash2, Upload, ExternalLink, Shield
} from 'lucide-react';
import {
  type ClientProfile, type SignatureRequest, type SignatureStatus,
  getProfile
} from '@/lib/clientProfileStorage';
import {
  getSignatureRequestsByProfile,
  updateSignatureRequestStatus,
  deleteSignatureRequest
} from '@/lib/signatureService';
import { toast } from 'sonner';

interface SignedDocumentsPanelProps {
  profile: ClientProfile;
  onBack: () => void;
}

function statusIcon(status: SignatureStatus) {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'signed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
  }
}

function statusLabel(status: SignatureStatus) {
  switch (status) {
    case 'pending': return 'Pending';
    case 'signed': return 'Signed';
    case 'expired': return 'Expired';
    case 'declined': return 'Declined';
  }
}

function statusColor(status: SignatureStatus) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'signed': return 'bg-green-50 text-green-700 border-green-200';
    case 'expired': return 'bg-red-50 text-red-700 border-red-200';
    case 'declined': return 'bg-red-50 text-red-700 border-red-200';
  }
}

function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

export default function SignedDocumentsPanel({ profile, onBack }: SignedDocumentsPanelProps) {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);

  const refresh = useCallback(() => {
    setRequests(getSignatureRequestsByProfile(profile.id));
  }, [profile.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleStatusChange = (requestId: string, newStatus: SignatureStatus) => {
    updateSignatureRequestStatus(profile.id, requestId, newStatus);
    refresh();
    toast.success(`Status updated to "${statusLabel(newStatus)}"`);
  };

  const handleDelete = (requestId: string) => {
    if (!confirm('Delete this signature request record? This cannot be undone.')) return;
    deleteSignatureRequest(profile.id, requestId);
    refresh();
    toast.success('Signature request deleted');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const signedCount = requests.filter(r => r.status === 'signed').length;

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[#E5E1D8] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-[#6B6B6B]">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-5 w-px bg-[#E5E1D8]" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0D7377]" />
              <h1 className="text-base font-semibold text-[#2C2C2C]">Signed Documents</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Summary */}
        {requests.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 text-center">
              <p className="text-2xl font-bold text-[#2C2C2C]">{requests.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total Requests</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-xs text-slate-500 mt-1">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{signedCount}</p>
              <p className="text-xs text-slate-500 mt-1">Signed</p>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Signature Requests</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              When you send attendance records or assessments for parent e-signature, 
              they'll appear here for tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(request => (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-[#E5E1D8] p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      {statusIcon(request.status)}
                      <span className="text-sm font-semibold text-[#2C2C2C]">
                        {request.documentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#8B8B8B]">
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Sent to: {request.parentEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(request.sentAt)}
                      </span>
                    </div>
                    {request.signedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Signed: {formatDateTime(request.signedAt)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(request.status)}`}>
                        {statusLabel(request.status)}
                      </span>
                      <span className="text-xs text-[#8B8B8B] capitalize">
                        {request.type}
                      </span>
                      {request.therapistSigned && (
                        <span className="text-xs text-green-600">Therapist signed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {/* Status update dropdown */}
                    <Select
                      value={request.status}
                      onValueChange={(v) => handleStatusChange(request.id, v as SignatureStatus)}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(request.id)}
                      className="text-slate-500 hover:text-red-600 h-8 w-8 p-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#0D7377] mt-0.5 shrink-0" />
            <div className="text-xs text-[#6B6B6B]">
              <p className="font-medium text-[#2C2C2C] mb-1">About E-Signature Audit Trail</p>
              <p>
                Each document signed via Adobe Sign includes a Certificate of Completion with:
                timestamp, signer's email verification, IP address, and tamper-proof document integrity.
                This proves the parent signed from their own device — not the therapist's.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
