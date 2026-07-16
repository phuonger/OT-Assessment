/**
 * GlobalSyncButton
 * 
 * A floating sync button visible across all pages of the app.
 * Triggers both data backup sync and auto-filing scan.
 * Shows progress/status overlay and handles connectivity errors.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertTriangle, WifiOff, Cloud, FolderSync, X } from 'lucide-react';
import { performSync, loadSyncConfig } from '@/lib/googleDriveSync';
import { runAutoFiling, type ScanResult } from '@/lib/autoFilingScanner';
import { toast } from 'sonner';

type SyncPhase = 'idle' | 'checking' | 'syncing' | 'filing' | 'done' | 'error';

interface SyncStatus {
  phase: SyncPhase;
  message: string;
  details?: string;
  filesFound?: number;
  filesFiled?: number;
}

export default function GlobalSyncButton() {
  const [status, setStatus] = useState<SyncStatus>({ phase: 'idle', message: '' });
  const [showPanel, setShowPanel] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Check connectivity
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };
    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Load last sync time on mount
  useEffect(() => {
    const config = loadSyncConfig();
    if (config.lastSyncAt) {
      setLastSyncTime(config.lastSyncAt);
    }
  }, []);

  const handleSync = useCallback(async () => {
    // Check if Google Drive is connected
    const config = loadSyncConfig();
    if (!config.connected) {
      toast.error('Google Drive not connected. Go to Settings to connect.');
      return;
    }

    // Check connectivity
    if (!navigator.onLine) {
      setStatus({
        phase: 'error',
        message: 'No internet connection',
        details: 'Please check your network connection and try again later.'
      });
      setShowPanel(true);
      toast.error('No internet connection. Please try again when connected.');
      return;
    }

    setShowPanel(true);
    
    try {
      // Phase 1: Sync data backup
      setStatus({ phase: 'syncing', message: 'Syncing data to Google Drive...' });
      
      const syncResult = await performSync('auto');
      
      if (!syncResult.success) {
        if (syncResult.conflict) {
          setStatus({
            phase: 'error',
            message: 'Sync conflict detected',
            details: 'Please resolve the conflict in Settings > Google Drive Sync.'
          });
          return;
        }
        throw new Error(syncResult.message || 'Sync failed');
      }

      // Phase 2: Auto-file documents
      setStatus({ phase: 'filing', message: 'Scanning for signed documents to file...' });
      
      let filingResults: ScanResult[] = [];
      try {
        filingResults = await runAutoFiling();
      } catch (filingError) {
        // Filing is optional, don't fail the whole sync
        console.warn('Auto-filing scan failed:', filingError);
      }

      const totalFound = filingResults.reduce((sum, r) => sum + r.filesFound, 0);
      const totalFiled = filingResults.reduce((sum, r) => sum + r.filesFiled, 0);

      // Done
      const now = new Date().toISOString();
      setLastSyncTime(now);
      setStatus({
        phase: 'done',
        message: 'Sync complete!',
        details: totalFound > 0
          ? `Data backed up. ${totalFiled} of ${totalFound} document(s) filed to client folders.`
          : 'Data backed up successfully. No new documents to file.',
        filesFound: totalFound,
        filesFiled: totalFiled
      });

      toast.success('Sync complete!');

      // Auto-hide panel after 4 seconds
      setTimeout(() => {
        setShowPanel(false);
        setStatus({ phase: 'idle', message: '' });
      }, 4000);

    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Check if it's a network error
      const isNetworkError = errorMessage.includes('fetch') || 
                             errorMessage.includes('network') ||
                             errorMessage.includes('Failed to fetch') ||
                             errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
                             !navigator.onLine;

      if (isNetworkError) {
        setStatus({
          phase: 'error',
          message: 'Connection issue',
          details: 'Unable to reach Google Drive. Please check your internet connection and try again later.'
        });
        toast.error('Connection issue. Please check your internet and try again.');
      } else {
        setStatus({
          phase: 'error',
          message: 'Sync failed',
          details: errorMessage
        });
        toast.error(`Sync failed: ${errorMessage}`);
      }
    }
  }, []);

  const formatLastSync = (isoStr: string | null): string => {
    if (!isoStr) return 'Never synced';
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const isSyncing = status.phase === 'syncing' || status.phase === 'filing' || status.phase === 'checking';
  const config = loadSyncConfig();
  
  // Don't show if Drive is not connected
  if (!config.connected) return null;

  return (
    <>
      {/* Floating Sync Button */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 ${
          !isConnected
            ? 'bg-amber-100 text-amber-700 border border-amber-300'
            : isSyncing
            ? 'bg-[#0D7377] text-white cursor-wait'
            : status.phase === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-white text-[#2C2C2C] border border-[#E5E1D8] hover:border-[#0D7377] hover:shadow-xl'
        }`}
        title={!isConnected ? 'No internet connection' : 'Sync to Google Drive'}
      >
        {!isConnected ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4 text-[#0D7377]" />
            <span className="text-sm font-medium">Sync</span>
            <span className="text-xs text-[#8B8B8B]">{formatLastSync(lastSyncTime)}</span>
          </>
        )}
      </button>

      {/* Status Panel Overlay */}
      {showPanel && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E1D8] bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-[#0D7377]" />
              <span className="text-sm font-semibold text-[#2C2C2C]">Sync Status</span>
            </div>
            <button
              onClick={() => {
                setShowPanel(false);
                if (status.phase === 'done' || status.phase === 'error') {
                  setStatus({ phase: 'idle', message: '' });
                }
              }}
              className="p-1 rounded hover:bg-[#E5E1D8] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Progress indicator */}
            {isSyncing && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D7377]/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-[#0D7377] animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C2C2C]">{status.message}</p>
                    <p className="text-xs text-[#8B8B8B]">Please wait...</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#E5E1D8] rounded-full overflow-hidden">
                  <div className={`h-full bg-[#0D7377] rounded-full transition-all duration-500 ${
                    status.phase === 'syncing' ? 'w-1/2' : 'w-3/4'
                  }`} />
                </div>
                <div className="flex justify-between text-xs text-[#8B8B8B]">
                  <span className={status.phase === 'syncing' ? 'text-[#0D7377] font-medium' : ''}>
                    1. Backup data
                  </span>
                  <span className={status.phase === 'filing' ? 'text-[#0D7377] font-medium' : ''}>
                    2. File documents
                  </span>
                </div>
              </div>
            )}

            {/* Success */}
            {status.phase === 'done' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">{status.message}</p>
                    <p className="text-xs text-[#6B6B6B]">{status.details}</p>
                  </div>
                </div>
                {(status.filesFound ?? 0) > 0 && (
                  <div className="bg-green-50 rounded-lg p-2.5 text-xs text-green-700">
                    <span className="font-medium">{status.filesFiled}</span> document(s) filed to client folders
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {status.phase === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    {status.message.includes('internet') || status.message.includes('Connection') ? (
                      <WifiOff className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">{status.message}</p>
                    <p className="text-xs text-[#6B6B6B]">{status.details}</p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  className="w-full py-2 text-sm font-medium text-[#0D7377] bg-[#0D7377]/5 rounded-lg hover:bg-[#0D7377]/10 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
