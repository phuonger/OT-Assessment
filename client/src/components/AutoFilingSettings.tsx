/**
 * Auto-Filing Settings Panel
 * 
 * Allows therapists to:
 * - Configure a local watched folder for signed PDFs
 * - Manually trigger the auto-filing scanner
 * - View recent scan history/results
 */

import { useState, useEffect } from 'react';
import { FolderOpen, RefreshCw, CheckCircle2, AlertCircle, Clock, FileText, PenLine, Eye } from 'lucide-react';
import {
  getWatchedFolderPath,
  selectWatchedFolder,
  runAutoFiling,
  getScanHistory,
  type ScanResult,
} from '@/lib/autoFilingScanner';
import { previewBulkRename, runBulkRename, type BulkRenameReport } from '@/lib/bulkFolderRename';

export function AutoFilingSettings() {
  const [watchedPath, setWatchedPath] = useState(getWatchedFolderPath());
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult[] | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [renaming, setRenaming] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [renameReport, setRenameReport] = useState<BulkRenameReport | null>(null);
  const [renameMode, setRenameMode] = useState<'preview' | 'done' | null>(null);
  const isElectron = !!(window as any).electronAPI?.selectFolder;

  useEffect(() => {
    setScanHistory(getScanHistory().slice(0, 5));
  }, []);

  const handleSelectFolder = async () => {
    const path = await selectWatchedFolder();
    if (path) {
      setWatchedPath(path);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const results = await runAutoFiling();
      setLastScanResult(results);
      setScanHistory(getScanHistory().slice(0, 5));
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-[#0D7377]" />
        <h3 className="text-base font-semibold text-[#2C2C2C]">Auto-Filing (Signed Documents)</h3>
      </div>

      <p className="text-sm text-[#6B6B6B] leading-relaxed">
        The auto-filing scanner automatically moves signed PDFs to the correct client folder on Google Drive.
        It scans the <strong>Adobe-Signed</strong> folder on Drive and optionally a local folder on your computer.
        Files must include the client's profile number in the filename (e.g., <code>Attendance_Jim_Bob-100001-2026-07-15.pdf</code>).
      </p>

      {/* Google Drive Scanner Info */}
      <div className="bg-[#F5F3EE] rounded-lg p-3 border border-[#E8E4DC]">
        <p className="text-sm font-medium text-[#2C2C2C] mb-1">Google Drive Scanner</p>
        <p className="text-xs text-[#6B6B6B]">
          Scans <code>otassess/signed-documents/Adobe-Signed/</code> folder automatically during each sync.
          Point Adobe Sign's auto-save to this folder for fully automatic filing.
        </p>
      </div>

      {/* Local Folder (Electron only) */}
      {isElectron && (
        <div className="bg-[#F5F3EE] rounded-lg p-3 border border-[#E8E4DC]">
          <p className="text-sm font-medium text-[#2C2C2C] mb-1">Local Watched Folder</p>
          <p className="text-xs text-[#6B6B6B] mb-2">
            Save signed PDFs to this folder on your computer. The app will automatically upload and file them to Google Drive.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded border border-[#E8E4DC] px-3 py-1.5 text-sm text-[#2C2C2C] truncate">
              {watchedPath || <span className="text-[#8B8B8B] italic">No folder selected</span>}
            </div>
            <button
              onClick={handleSelectFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D7377] text-white text-sm rounded hover:bg-[#0A5C5F] transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {watchedPath ? 'Change' : 'Select'}
            </button>
          </div>
        </div>
      )}

      {!isElectron && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-amber-700">
            Local folder watching is only available in the desktop app. The Google Drive scanner works in both web and desktop.
          </p>
        </div>
      )}

      {/* Manual Scan Button */}
      <button
        onClick={handleRunScan}
        disabled={scanning}
        className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white text-sm font-medium rounded-lg hover:bg-[#0A5C5F] transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
        {scanning ? 'Scanning...' : 'Run Auto-Filing Now'}
      </button>

      {/* Last Scan Results */}
      {lastScanResult && lastScanResult.length > 0 && (
        <div className="border border-[#E8E4DC] rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-[#2C2C2C]">Last Scan Results</p>
          {lastScanResult.map((scan, i) => (
            <div key={i} className="text-xs space-y-1">
              <p className="text-[#6B6B6B]">
                Source: {scan.source === 'google-drive' ? 'Google Drive' : 'Local Folder'} •
                Found: {scan.filesFound} • Filed: {scan.filesFiled}
              </p>
              {scan.results.map((r, j) => (
                <div key={j} className="pl-2 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {r.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {r.filename} → {r.destination}
                    </span>
                  </div>
                  {!r.success && r.error && (
                    <p className="text-[10px] text-red-500 pl-4 break-all">
                      Error: {r.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {lastScanResult && lastScanResult.length === 0 && (
        <div className="text-xs text-[#8B8B8B] italic">
          No files found to auto-file. The Adobe-Signed folder is empty or no local folder is configured.
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="border-t border-[#E8E4DC] pt-3 mt-3">
          <p className="text-xs font-medium text-[#6B6B6B] mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent Scans
          </p>
          <div className="space-y-1">
            {scanHistory.map((scan, i) => (
              <div key={i} className="text-xs text-[#8B8B8B] flex items-center gap-2">
                <span>{new Date(scan.scannedAt).toLocaleString()}</span>
                <span className="text-[#6B6B6B]">
                  {scan.source === 'google-drive' ? 'Drive' : 'Local'}
                </span>
                <span>
                  {scan.filesFiled}/{scan.filesFound} filed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Folder Rename Section */}
      <div className="border-t border-[#E8E4DC] pt-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <PenLine className="w-4 h-4 text-[#0D7377]" />
          <h4 className="text-sm font-semibold text-[#2C2C2C]">Standardize Folder Names</h4>
        </div>
        <p className="text-xs text-[#6B6B6B] leading-relaxed mb-3">
          Renames all client folders in <code>signed-documents/</code> to the standard format:
          <code className="ml-1">FirstName_LastName_ProfileNumber</code>.
          This ensures the auto-filing scanner can always match folders correctly, even for clients with similar names.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setPreviewing(true);
              setRenameReport(null);
              try {
                const report = await previewBulkRename();
                setRenameReport(report);
                setRenameMode('preview');
              } catch (err: any) {
                setRenameReport({
                  totalFolders: 0, alreadyCorrect: 0, renamed: 0, unmatched: 0, errors: 1,
                  results: [{ folderId: '', oldName: '', newName: '', profileNumber: 0, clientName: '', success: false, error: err.message }]
                });
                setRenameMode('preview');
              } finally {
                setPreviewing(false);
              }
            }}
            disabled={previewing || renaming}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3EE] text-[#2C2C2C] text-sm border border-[#E8E4DC] rounded-lg hover:bg-[#EDE9E0] transition-colors disabled:opacity-50"
          >
            <Eye className={`w-3.5 h-3.5 ${previewing ? 'animate-pulse' : ''}`} />
            {previewing ? 'Scanning...' : 'Preview Changes'}
          </button>

          <button
            onClick={async () => {
              if (!confirm('This will rename all client folders on Google Drive to the standard format. Continue?')) return;
              setRenaming(true);
              setRenameReport(null);
              try {
                const report = await runBulkRename();
                setRenameReport(report);
                setRenameMode('done');
              } catch (err: any) {
                setRenameReport({
                  totalFolders: 0, alreadyCorrect: 0, renamed: 0, unmatched: 0, errors: 1,
                  results: [{ folderId: '', oldName: '', newName: '', profileNumber: 0, clientName: '', success: false, error: err.message }]
                });
                setRenameMode('done');
              } finally {
                setRenaming(false);
              }
            }}
            disabled={previewing || renaming}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D7377] text-white text-sm rounded-lg hover:bg-[#0A5C5F] transition-colors disabled:opacity-50"
          >
            <PenLine className={`w-3.5 h-3.5 ${renaming ? 'animate-spin' : ''}`} />
            {renaming ? 'Renaming...' : 'Rename All Folders'}
          </button>
        </div>

        {/* Rename Report */}
        {renameReport && (
          <div className="mt-3 border border-[#E8E4DC] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {renameMode === 'preview' ? 'Preview' : 'Results'}
              </p>
              {renameMode === 'done' && renameReport.errors === 0 && renameReport.renamed > 0 && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F5F3EE] rounded p-2">
                <span className="text-[#6B6B6B]">Total folders:</span>
                <span className="ml-1 font-medium text-[#2C2C2C]">{renameReport.totalFolders}</span>
              </div>
              <div className="bg-green-50 rounded p-2">
                <span className="text-green-700">Already correct:</span>
                <span className="ml-1 font-medium text-green-800">{renameReport.alreadyCorrect}</span>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <span className="text-blue-700">{renameMode === 'preview' ? 'Will rename:' : 'Renamed:'}</span>
                <span className="ml-1 font-medium text-blue-800">{renameReport.renamed}</span>
              </div>
              {renameReport.unmatched > 0 && (
                <div className="bg-amber-50 rounded p-2">
                  <span className="text-amber-700">Unmatched:</span>
                  <span className="ml-1 font-medium text-amber-800">{renameReport.unmatched}</span>
                </div>
              )}
              {renameReport.errors > 0 && (
                <div className="bg-red-50 rounded p-2">
                  <span className="text-red-700">Errors:</span>
                  <span className="ml-1 font-medium text-red-800">{renameReport.errors}</span>
                </div>
              )}
            </div>

            {/* Individual results */}
            {renameReport.results.filter(r => !r.skipped).length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                {renameReport.results.filter(r => !r.skipped).map((r, i) => (
                  <div key={i} className="text-xs pl-1 flex items-start gap-1.5">
                    {r.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      {r.success ? (
                        <span>
                          <span className="text-[#8B8B8B] line-through">{r.oldName}</span>
                          <span className="mx-1">→</span>
                          <span className="text-[#2C2C2C] font-medium">{r.newName}</span>
                        </span>
                      ) : (
                        <span>
                          <span className="text-[#2C2C2C]">{r.oldName}</span>
                          {r.error && <span className="text-red-500 ml-1">({r.error})</span>}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {renameReport.results.filter(r => !r.skipped).length === 0 && renameReport.alreadyCorrect > 0 && (
              <p className="text-xs text-green-700 italic mt-1">
                All folders are already in the correct format!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
