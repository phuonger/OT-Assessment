/**
 * SyncConflictDialog
 * 
 * Shown when auto-sync detects both local and remote data have changed since last sync.
 * Presents a side-by-side comparison and lets the user choose which version to keep.
 */

import { useState } from 'react';
import { AlertTriangle, Cloud, Laptop, Clock, Users, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  loadConflict, clearConflict, clearDirty, performSync,
  loadSyncConfig, saveSyncConfig, type ConflictData
} from '@/lib/googleDriveSync';

interface SyncConflictDialogProps {
  conflictData?: ConflictData | null;
  onResolved: () => void;
}

function countItems(data: Record<string, any>, key: string): number {
  try {
    if (!data[key]) return 0;
    const parsed = typeof data[key] === 'string' ? JSON.parse(data[key]) : data[key];
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === 'object') return Object.keys(parsed).length;
    return 0;
  } catch { return 0; }
}

function DataSummary({ data, label }: { data: Record<string, any>; label: string }) {
  const profiles = countItems(data, 'bayley4-client-profiles');
  const sessions = countItems(data, 'bayley4-multi-sessions');
  const attendance = countItems(data, 'bayley4-attendance-records');
  const reports = countItems(data, 'bayley4-saved-reports');

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{profiles} client profile{profiles !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>{sessions} assessment session{sessions !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
          <span>{attendance} attendance record{attendance !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>{reports} saved report{reports !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

export default function SyncConflictDialog({ conflictData, onResolved }: SyncConflictDialogProps) {
  const [resolving, setResolving] = useState(false);
  const [choice, setChoice] = useState<'local' | 'remote' | null>(null);

  const conflict = conflictData || loadConflict();
  if (!conflict) return null;

  const handleResolve = async (keepVersion: 'local' | 'remote') => {
    setResolving(true);
    setChoice(keepVersion);

    try {
      if (keepVersion === 'local') {
        // Push local data to Drive, overwriting remote
        const result = await performSync('push');
        if (result.success) {
          clearConflict();
          clearDirty();
          onResolved();
        }
      } else {
        // Pull remote data, overwriting local
        const result = await performSync('pull');
        if (result.success) {
          clearConflict();
          clearDirty();
          onResolved();
          // Reload the page to reflect restored data
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    } finally {
      setResolving(false);
      setChoice(null);
    }
  };

  const handleDismiss = () => {
    clearConflict();
    onResolved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Sync Conflict Detected</h3>
            <p className="text-sm text-slate-600">Data was changed on both this device and another device since the last sync.</p>
          </div>
        </div>

        {/* Comparison */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Local version */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${choice === 'local' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">This Device</span>
              </div>
              <DataSummary data={conflict.localData} label="Local Data" />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Modified: {new Date(conflict.localTimestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Remote version */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${choice === 'remote' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Google Drive</span>
              </div>
              <DataSummary data={conflict.remoteData} label="Remote Data" />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Modified: {new Date(conflict.remoteTimestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mb-4">
            Choose which version to keep. The other version will be overwritten.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleResolve('local')}
              disabled={resolving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Laptop className="w-4 h-4 mr-2" />
              {resolving && choice === 'local' ? 'Pushing...' : 'Keep This Device'}
            </Button>
            <Button
              onClick={() => handleResolve('remote')}
              disabled={resolving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Cloud className="w-4 h-4 mr-2" />
              {resolving && choice === 'remote' ? 'Pulling...' : 'Keep Google Drive'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 flex justify-end">
          <button
            onClick={handleDismiss}
            disabled={resolving}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Dismiss (resolve later)
          </button>
        </div>
      </div>
    </div>
  );
}
