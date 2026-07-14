/**
 * GoogleDriveSyncPanel Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * Settings panel for Google Drive sync configuration.
 * Credentials are pre-configured — users just click Connect and sign in.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle,
  Link2, Unlink, Download, Upload, Settings2, Wifi, WifiOff
} from 'lucide-react';
import {
  loadSyncConfig, saveSyncConfig, getSyncStatus,
  performSync, disconnectGoogleDrive, getAuthUrl,
  exchangeCodeForTokens, startAutoSync, stopAutoSync,
  DEFAULT_CLIENT_ID, DEFAULT_CLIENT_SECRET,
  type SyncConfig, type SyncStatus, type SyncResult
} from '@/lib/googleDriveSync';
import { toast } from 'sonner';

export default function GoogleDriveSyncPanel() {
  const [config, setConfig] = useState<SyncConfig>(loadSyncConfig);
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [syncing, setSyncing] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = useCallback(async (direction: 'push' | 'pull' | 'auto' = 'auto') => {
    setSyncing(true);
    try {
      const result: SyncResult = await performSync(direction);
      if (result.success) {
        toast.success(result.message);
      } else if (result.conflict) {
        toast.warning('Sync conflict detected — data changed on both this device and Google Drive. Please resolve the conflict.', { duration: 8000 });
      } else {
        toast.error(result.message);
      }
      setConfig(loadSyncConfig());
      setStatus(getSyncStatus());
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleConnect = () => {
    // Use pre-configured credentials
    const updated = { ...config, clientId: DEFAULT_CLIENT_ID, clientSecret: DEFAULT_CLIENT_SECRET };
    saveSyncConfig(updated);
    setConfig(updated);

    // Open Google sign-in
    const url = getAuthUrl(DEFAULT_CLIENT_ID);
    window.open(url, '_blank', 'width=600,height=700');
    setAwaitingCode(true);
  };

  const handleAuthCode = async () => {
    if (!authCode.trim()) {
      toast.error('Please paste the authorization code');
      return;
    }

    setConnecting(true);
    try {
      const tokens = await exchangeCodeForTokens(authCode.trim(), DEFAULT_CLIENT_ID, DEFAULT_CLIENT_SECRET);
      const updated: SyncConfig = {
        ...config,
        clientId: DEFAULT_CLIENT_ID,
        clientSecret: DEFAULT_CLIENT_SECRET,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: Date.now() + tokens.expiresIn * 1000,
        connected: true,
        autoSyncEnabled: true,
        syncIntervalMinutes: 60,
        reminderDays: 7,
      };
      saveSyncConfig(updated);
      setConfig(updated);
      setAwaitingCode(false);
      setAuthCode('');
      toast.success('Connected to Google Drive!');

      // Start auto-sync
      startAutoSync();

      // Do initial backup
      await performSync('push');
      setConfig(loadSyncConfig());
      setStatus(getSyncStatus());
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect from Google Drive? Your local data will remain, but auto-sync will stop.')) {
      disconnectGoogleDrive();
      setConfig(loadSyncConfig());
      setStatus(getSyncStatus());
      toast.success('Disconnected from Google Drive');
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = { ...config, autoSyncEnabled: enabled };
    saveSyncConfig(updated);
    setConfig(updated);
    if (enabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-[#0D7377]" />
        <h2 className="text-lg font-semibold text-[#2C2C2C]">Google Drive Sync</h2>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E1D8] divide-y divide-[#E5E1D8]">
        {/* Connection Status */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.connected ? (
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <CloudOff className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C]">
                  {config.connected ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-xs text-slate-500">
                  {config.connected
                    ? status.lastSyncAt
                      ? `Last synced ${status.message.replace('Last synced ', '')}`
                      : 'Connected, never synced'
                    : 'Connect your Google account to back up and sync data across devices'}
                </p>
              </div>
            </div>

            {config.connected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300">
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2">
                <Link2 className="w-4 h-4" />
                Connect Google Drive
              </Button>
            )}
          </div>

          {/* Authorization Code Entry (after clicking Connect) */}
          {!config.connected && awaitingCode && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Sign in and paste the code</p>
              <p className="text-xs text-blue-700 mb-3">
                A Google sign-in window should have opened. Sign in with your Google account, grant access, then copy the authorization code and paste it below.
              </p>
              <div className="flex gap-2">
                <Input
                  value={authCode}
                  onChange={e => setAuthCode(e.target.value)}
                  placeholder="Paste authorization code here..."
                  className="font-mono text-xs"
                />
                <Button
                  onClick={handleAuthCode}
                  disabled={connecting}
                  className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white whitespace-nowrap"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          )}

          {/* Sync Reminder Banner */}
          {status.needsReminder && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Sync Reminder</p>
                <p className="text-xs text-amber-700">
                  It's been over {config.reminderDays} days since your last sync. Back up your data now.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSync('push')}
                disabled={syncing}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sync Now
              </Button>
            </div>
          )}

          {/* Online/Offline indicator */}
          {config.connected && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              {navigator.onLine ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-500" />
                  <span>Offline — will sync when connection is restored</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sync Actions (when connected) */}
        {config.connected && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">Sync Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('auto')}
                disabled={syncing || !navigator.onLine}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('push')}
                disabled={syncing || !navigator.onLine}
                className="gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Backup to Drive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('This will overwrite your local data with the version from Google Drive. Continue?')) {
                    handleSync('pull');
                  }
                }}
                disabled={syncing || !navigator.onLine}
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Restore from Drive
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              "Restore from Drive" will replace all local data with the backup. Use this on a new device or after a data loss.
            </p>
          </div>
        )}

        {/* Auto-Sync Settings (when connected) */}
        {config.connected && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Auto-Sync Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2C2C2C]">Auto-sync enabled</p>
                  <p className="text-xs text-slate-500">Automatically sync on open, close, and every hour</p>
                </div>
                <Switch
                  checked={config.autoSyncEnabled}
                  onCheckedChange={handleToggleAutoSync}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2C2C2C]">Sync reminder</p>
                  <p className="text-xs text-slate-500">Show a reminder if no sync for {config.reminderDays}+ days</p>
                </div>
                <span className="text-sm text-slate-600">{config.reminderDays} days</span>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="p-6 bg-[#F8F7F4]">
          <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">How it works</h4>
          <ul className="text-xs text-[#6B6B6B] space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-[#0D7377] font-bold mt-0.5">1.</span>
              Click "Connect Google Drive" and sign in with your Google account
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0D7377] font-bold mt-0.5">2.</span>
              All your data (profiles, assessments, attendance, settings) is backed up to an "otassess" folder on your Drive
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0D7377] font-bold mt-0.5">3.</span>
              Auto-sync runs on app open, close, and every hour when connected to the internet
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0D7377] font-bold mt-0.5">4.</span>
              On a new device, connect the same Google account and click "Restore from Drive" to get all your data back
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0D7377] font-bold mt-0.5">5.</span>
              If no sync happens for {config.reminderDays}+ days, you'll see a reminder to back up
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
