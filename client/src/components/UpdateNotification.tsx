/**
 * UpdateNotification
 *
 * Listens for auto-update events from Electron's main process via the preload bridge.
 * Shows a non-intrusive banner when an update is available, with download progress
 * and a restart button once the download is complete.
 *
 * Handles common errors gracefully, including the macOS "read-only volume" issue
 * when the app isn't installed in /Applications.
 *
 * Only renders in Electron (when window.electronAPI is available).
 */

import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Loader2, AlertTriangle, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error';

export default function UpdateNotification() {
  const [state, setState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [isReadOnlyError, setIsReadOnlyError] = useState(false);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return; // Not running in Electron

    // Listen for update events from main process
    api.onUpdateAvailable((info: UpdateInfo) => {
      console.log('[AutoUpdater] Update available:', info);
      setUpdateInfo(info);
      setState('available');
      setDismissed(false);
      setIsReadOnlyError(false);
    });

    api.onDownloadProgress((prog: DownloadProgress) => {
      setProgress(prog);
      setState('downloading');
    });

    api.onUpdateDownloaded((info: UpdateInfo) => {
      console.log('[AutoUpdater] Update downloaded:', info);
      setUpdateInfo(info);
      setState('downloaded');
    });

    api.onUpdateError((err: string) => {
      console.error('[AutoUpdater] Error:', err);
      setErrorMsg(err);
      setState('error');
      setDismissed(false);

      // Detect read-only volume error
      if (
        err.includes('read-only') ||
        err.includes('Applications folder') ||
        err.includes('EROFS')
      ) {
        setIsReadOnlyError(true);
      }
    });
  }, []);

  const handleDownload = () => {
    const api = (window as any).electronAPI;
    if (!api) return;
    setState('downloading');
    setProgress({ percent: 0, transferred: 0, total: 0 });
    api.downloadUpdate().catch(() => {
      setState('error');
      setErrorMsg('Failed to start download. Please try again.');
    });
  };

  const handleInstall = () => {
    const api = (window as any).electronAPI;
    if (!api) return;
    api.installUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleRetry = () => {
    setErrorMsg('');
    setIsReadOnlyError(false);
    setState('idle');
    const api = (window as any).electronAPI;
    if (api) {
      api.checkForUpdates();
    }
  };

  // Don't render if no update or dismissed
  if (state === 'idle' || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white border border-[#E5E0DB] rounded-xl shadow-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                state === 'error'
                  ? 'bg-red-50'
                  : 'bg-[#0D7377]/10'
              }`}
            >
              {state === 'downloading' ? (
                <Loader2 className="w-4 h-4 text-[#0D7377] animate-spin" />
              ) : state === 'downloaded' ? (
                <RefreshCw className="w-4 h-4 text-[#0D7377]" />
              ) : state === 'error' ? (
                isReadOnlyError ? (
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )
              ) : (
                <Download className="w-4 h-4 text-[#0D7377]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C2825]">
                {state === 'downloaded'
                  ? 'Update Ready — Restart Required'
                  : state === 'downloading'
                  ? 'Downloading Update…'
                  : state === 'error'
                  ? isReadOnlyError
                    ? 'Move to Applications'
                    : 'Update Error'
                  : 'Update Available'}
              </p>
              {updateInfo && (
                <p className="text-xs text-[#6B6B6B]">
                  Version {updateInfo.version}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#8B8B8B] hover:text-[#2C2825] transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        {state === 'downloading' && progress && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-[#E5E0DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D7377] rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress.percent)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8B8B8B] mt-1">
              {Math.round(progress.percent)}% — {formatBytes(progress.transferred)}{' '}
              / {formatBytes(progress.total)}
            </p>
          </div>
        )}

        {/* Downloaded message */}
        {state === 'downloaded' && (
          <p className="text-xs text-[#6B6B6B] mt-2">
            The update has been downloaded. Please save your work, then click
            below to restart and apply the update.
          </p>
        )}

        {/* Error message */}
        {state === 'error' && isReadOnlyError && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 leading-relaxed">
            <p className="font-medium mb-1">The app needs to be in your Applications folder to update.</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-600">
              <li>Close this application</li>
              <li>Move it to <strong>/Applications</strong></li>
              <li>Re-open from Applications</li>
            </ol>
          </div>
        )}
        {state === 'error' && !isReadOnlyError && errorMsg && (
          <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          {state === 'available' && (
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white text-xs h-8 px-3 rounded-lg"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Download Update
            </Button>
          )}
          {state === 'downloaded' && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white text-xs h-8 px-3 rounded-lg"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Restart &amp; Update
            </Button>
          )}
          {state === 'error' && (
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="text-xs h-8 px-3 rounded-lg"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
