/**
 * DataBackupRestore — Backup & Restore all assessment data
 *
 * Detects Electron environment and uses native file dialogs when available.
 * Falls back to browser download/upload for the web version.
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  HardDrive,
  Clock,
  FileJson,
  Info,
} from 'lucide-react';

// Detect Electron environment
const isElectron = !!(window as any).electronAPI;

interface BackupMeta {
  version: string;
  exportedAt: string;
  keyCount: number;
  appVersion?: string;
}

interface Props {
  onBack: () => void;
}

export default function DataBackupRestore({ onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'importing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    return localStorage.getItem('__last_backup_date');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Count data entries
  const dataKeys = Object.keys(localStorage).filter(k => !k.startsWith('__'));
  const totalEntries = dataKeys.length;
  const dataSize = dataKeys.reduce((sum, k) => sum + (localStorage.getItem(k)?.length || 0), 0);
  const dataSizeKB = (dataSize / 1024).toFixed(1);

  // ─── Export Backup ─────────────────────────────────────────────────
  const handleExport = async () => {
    setStatus('exporting');
    try {
      const keys = Object.keys(localStorage);
      const data: Record<string, any> = {};
      keys.forEach(k => {
        data[k] = localStorage.getItem(k);
      });
      data.__backup_meta = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        keyCount: keys.filter(k => !k.startsWith('__')).length,
        appVersion: '1.0.0',
      } as BackupMeta;

      if (isElectron) {
        // Use native file dialog via Electron IPC
        const result = await (window as any).electronAPI.exportBackup(data);
        if (result.success) {
          localStorage.setItem('__last_backup_date', new Date().toISOString());
          setLastBackup(new Date().toISOString());
          setStatus('success');
          setStatusMessage(`Backup saved to ${result.filePath}`);
        } else if (result.reason === 'cancelled') {
          setStatus('idle');
        } else {
          setStatus('error');
          setStatusMessage(result.reason || 'Export failed');
        }
      } else {
        // Browser fallback: download as file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DAS-Backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        localStorage.setItem('__last_backup_date', new Date().toISOString());
        setLastBackup(new Date().toISOString());
        setStatus('success');
        setStatusMessage('Backup file downloaded');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Export failed');
    }
  };

  // ─── Import Backup ─────────────────────────────────────────────────
  const handleImport = async () => {
    if (isElectron) {
      setStatus('importing');
      try {
        const result = await (window as any).electronAPI.importBackup();
        if (result.success && result.data) {
          processImportedData(result.data, result.filePath);
        } else if (result.reason === 'cancelled') {
          setStatus('idle');
        } else {
          setStatus('error');
          setStatusMessage(result.reason || 'Import failed');
        }
      } catch (err: any) {
        setStatus('error');
        setStatusMessage(err.message || 'Import failed');
      }
    } else {
      // Browser fallback: trigger file input
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('importing');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        processImportedData(data, file.name);
      } catch (err: any) {
        setStatus('error');
        setStatusMessage('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const processImportedData = (data: Record<string, any>, source: string) => {
    const meta = data.__backup_meta as BackupMeta | undefined;
    const entries = Object.keys(data).filter(k => k !== '__backup_meta');

    if (entries.length === 0) {
      setStatus('error');
      setStatusMessage('Backup file is empty');
      return;
    }

    const confirmMsg = meta
      ? `Restore backup from ${new Date(meta.exportedAt).toLocaleDateString()} with ${meta.keyCount} data entries?\n\nThis will replace ALL current data.`
      : `Restore ${entries.length} data entries from ${source}?\n\nThis will replace ALL current data.`;

    if (!confirm(confirmMsg)) {
      setStatus('idle');
      return;
    }

    // Clear current data and restore
    localStorage.clear();
    entries.forEach(k => {
      if (typeof data[k] === 'string') {
        localStorage.setItem(k, data[k]);
      } else {
        localStorage.setItem(k, JSON.stringify(data[k]));
      }
    });

    setStatus('success');
    setStatusMessage(`Restored ${entries.length} entries. Reloading…`);

    // Reload after a brief delay so user sees the success message
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Data Backup & Restore
            </h1>
            <p className="text-sm text-muted-foreground">
              Protect your assessment data with local backups
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status Banner */}
        {status === 'success' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Data Overview Card */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Current Data
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <HardDrive className="w-5 h-5 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold text-foreground">{totalEntries}</div>
              <div className="text-xs text-muted-foreground">Data Entries</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <FileJson className="w-5 h-5 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold text-foreground">{dataSizeKB} KB</div>
              <div className="text-xs text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold text-foreground">
                {lastBackup ? new Date(lastBackup).toLocaleDateString() : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Last Backup</div>
            </div>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Download className="w-5 h-5 text-teal-600" />
                Export Backup
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Save all assessment data, session history, and report drafts to a JSON file.
                {isElectron
                  ? ' Choose where to save on your computer.'
                  : ' The file will be downloaded to your browser\'s download folder.'}
              </p>
            </div>
          </div>
          <Button
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleExport}
            disabled={status === 'exporting'}
          >
            <Download className="w-4 h-4 mr-2" />
            {status === 'exporting' ? 'Exporting…' : 'Export Backup File'}
          </Button>
        </div>

        {/* Import Card */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                Import Backup
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Restore assessment data from a previously exported backup file.
                This will <strong>replace all current data</strong> with the backup contents.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handleImport}
            disabled={status === 'importing'}
          >
            <Upload className="w-4 h-4 mr-2" />
            {status === 'importing' ? 'Importing…' : 'Import Backup File'}
          </Button>
          {/* Hidden file input for browser fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            About Backups
          </h3>
          <ul className="text-sm text-blue-700 space-y-1.5">
            <li>Backup files contain all assessment scores, session history, saved reports, and app settings.</li>
            <li>Backups are stored as standard JSON files that you can keep anywhere on your computer or cloud storage.</li>
            <li>Importing a backup replaces all current data — export first if you want to keep your current data.</li>
            <li>We recommend backing up after each assessment session to prevent data loss.</li>
            {isElectron && (
              <li>You can also use <strong>File → Export Backup</strong> (⇧⌘E) and <strong>File → Import Backup</strong> (⇧⌘I) from the menu bar.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
