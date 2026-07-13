/**
 * AttendanceHistory Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * Shows a list of all attendance records for a client profile.
 * Allows viewing, editing, printing, and deleting records.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Pencil, Trash2, Printer, Calendar, Clock, FileText } from 'lucide-react';
import { type ClientProfile } from '@/lib/clientProfileStorage';
import { getAttendanceByProfile, deleteAttendance, type AttendanceRecord } from '@/lib/attendanceStorage';
import { toast } from 'sonner';

interface AttendanceHistoryProps {
  profile: ClientProfile;
  onBack: () => void;
  onNewEntry: () => void;
  onEditEntry: (record: AttendanceRecord) => void;
  onPrintEntry: (record: AttendanceRecord) => void;
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function AttendanceHistory({ profile, onBack, onNewEntry, onEditEntry, onPrintEntry }: AttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(getAttendanceByProfile(profile.id));
  }, [profile.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (record: AttendanceRecord) => {
    if (!confirm(`Delete attendance record from ${formatDate(record.date)}?`)) return;
    deleteAttendance(record.id);
    toast.success('Attendance record deleted');
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E5E1D8] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-[#2C2C2C]">
            Attendance History
          </h1>
          <span className="text-sm text-slate-500">
            {profile.firstName} {profile.lastName}
          </span>
        </div>
        <Button
          onClick={onNewEntry}
          className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {records.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Attendance Records</h3>
            <p className="text-sm text-slate-500 mb-6">
              Start recording attendance by creating a new entry.
            </p>
            <Button onClick={onNewEntry} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2">
              <Plus className="w-4 h-4" />
              New Attendance Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-[#E5E1D8] p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#2C2C2C]">
                        <Calendar className="w-3.5 h-3.5 text-[#0D7377]" />
                        {formatDate(record.date)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {record.time}
                      </span>
                      {record.typeFrequency && (
                        <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                          {record.typeFrequency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                      {record.progressNote}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-400">
                        Pay Period: {record.payPeriod}
                      </span>
                      {record.parentSignature && (
                        <span className="text-xs text-green-600 font-medium">✓ Parent signed</span>
                      )}
                      {record.therapistSignature && (
                        <span className="text-xs text-green-600 font-medium">✓ Therapist signed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintEntry(record)}
                      className="text-slate-500 hover:text-[#0D7377] h-8 w-8 p-0"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditEntry(record)}
                      className="text-slate-500 hover:text-blue-600 h-8 w-8 p-0"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record)}
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
      </main>
    </div>
  );
}
