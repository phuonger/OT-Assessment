/**
 * Google Drive Sync Module
 * 
 * Handles OAuth2 authentication with Google, and syncs all app data
 * (profiles, assessments, attendance, settings) to a folder called
 * "otassess" on the user's Google Drive.
 * 
 * Sync triggers:
 * - On app open (pull latest)
 * - On app close (push current)
 * - Every hour while app is running
 * - Manual "Sync Now" button
 * - Reminder if no sync for 7+ days
 */

// ============================================================
// TYPES
// ============================================================

export interface SyncConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number; // Unix timestamp
  connected: boolean;
  lastSyncAt: string | null; // ISO timestamp
  lastSyncDirection: 'push' | 'pull' | null;
  folderId: string | null; // Google Drive folder ID for "otassess"
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // default 60
  reminderDays: number; // default 7
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  message: string;
  lastSyncAt: string | null;
  needsReminder: boolean;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'bayley4-gdrive-sync-config';
const FOLDER_NAME = 'otassess';
const DATA_FILE_NAME = 'otassess_backup.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const REDIRECT_URI = 'http://localhost';

// Pre-configured OAuth credentials (shared across all users)
export const DEFAULT_CLIENT_ID = '510997634868-87764bvo14ehkllh8m5denadtq7i5ebq.apps.googleusercontent.com';
export const DEFAULT_CLIENT_SECRET = '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';

// ============================================================
// UNSYNCED CHANGES TRACKING
// ============================================================

const DIRTY_KEY = 'bayley4-gdrive-dirty';
const CONFLICT_KEY = 'bayley4-gdrive-conflict';

export interface ConflictData {
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  localTimestamp: string;
  remoteTimestamp: string;
}

export function markDirty(): void {
  const config = loadSyncConfig();
  if (config.connected) {
    localStorage.setItem(DIRTY_KEY, new Date().toISOString());
  }
}

export function clearDirty(): void {
  localStorage.removeItem(DIRTY_KEY);
}

export function isDirty(): boolean {
  return !!localStorage.getItem(DIRTY_KEY);
}

export function getDirtyTimestamp(): string | null {
  return localStorage.getItem(DIRTY_KEY);
}

export function saveConflict(conflict: ConflictData): void {
  localStorage.setItem(CONFLICT_KEY, JSON.stringify(conflict));
}

export function loadConflict(): ConflictData | null {
  try {
    const raw = localStorage.getItem(CONFLICT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function clearConflict(): void {
  localStorage.removeItem(CONFLICT_KEY);
}

// All localStorage keys that contain app data to sync
const SYNC_KEYS = [
  'bayley4-client-profiles',
  'bayley4-multi-sessions',
  'bayley4-attendance-records',
  'bayley4-app-settings',
  'bayley4-saved-reports',
  'bayley4-oral-motor-answers',
  'bayley4-palate-enabled',
  'bayley4-setup-complete',
];

// ============================================================
// CONFIG PERSISTENCE
// ============================================================

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: '',
    tokenExpiry: 0,
    connected: false,
    lastSyncAt: null,
    lastSyncDirection: null,
    folderId: null,
    autoSyncEnabled: true,
    syncIntervalMinutes: 60,
    reminderDays: 7,
  };
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ============================================================
// SYNC STATUS
// ============================================================

export function getSyncStatus(): SyncStatus {
  const config = loadSyncConfig();
  const now = Date.now();

  if (!config.connected) {
    return { state: 'idle', message: 'Not connected to Google Drive', lastSyncAt: null, needsReminder: false };
  }

  const lastSync = config.lastSyncAt ? new Date(config.lastSyncAt).getTime() : 0;
  const daysSinceSync = lastSync ? (now - lastSync) / (1000 * 60 * 60 * 24) : Infinity;
  const needsReminder = daysSinceSync >= config.reminderDays;

  if (!navigator.onLine) {
    return { state: 'offline', message: 'No internet connection', lastSyncAt: config.lastSyncAt, needsReminder };
  }

  return {
    state: 'idle',
    message: config.lastSyncAt
      ? `Last synced ${formatTimeAgo(config.lastSyncAt)}`
      : 'Never synced',
    lastSyncAt: config.lastSyncAt,
    needsReminder,
  };
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ============================================================
// OAUTH2 FLOW
// ============================================================

export function getAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function refreshAccessToken(config: SyncConfig): Promise<string> {
  if (Date.now() < config.tokenExpiry - 60000) {
    return config.accessToken; // Still valid
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token. Please reconnect Google Drive.');
  }

  const data = await response.json();
  config.accessToken = data.access_token;
  config.tokenExpiry = Date.now() + data.expires_in * 1000;
  saveSyncConfig(config);
  return data.access_token;
}

// ============================================================
// GOOGLE DRIVE API HELPERS
// ============================================================

async function getOrCreateFolder(token: string): Promise<string> {
  // Search for existing folder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) throw new Error('Failed to search Drive folders');
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) throw new Error('Failed to create Drive folder');
  const createData = await createRes.json();
  return createData.id;
}

async function findBackupFile(token: string, folderId: string): Promise<DriveFile | null> {
  const url = `https://www.googleapis.com/drive/v3/files?q=name='${DATA_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

async function downloadBackupFile(token: string, fileId: string): Promise<Record<string, any>> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to download backup file');
  return await res.json();
}

async function uploadBackupFile(
  token: string,
  folderId: string,
  data: Record<string, any>,
  existingFileId?: string
): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });

  if (existingFileId) {
    // Update existing file
    const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: blob,
    });
    if (!res.ok) throw new Error('Failed to update backup file');
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: DATA_FILE_NAME,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to create backup file');
  }
}

// ============================================================
// DATA SERIALIZATION
// ============================================================

function collectLocalData(): Record<string, any> {
  const data: Record<string, any> = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw; // Store as string if not JSON
      }
    }
  }
  data['_syncTimestamp'] = new Date().toISOString();
  data['_version'] = '1.0';
  return data;
}

function restoreLocalData(data: Record<string, any>): void {
  for (const key of SYNC_KEYS) {
    if (key in data) {
      const value = data[key];
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
}

// ============================================================
// SYNC OPERATIONS
// ============================================================

export type SyncDirection = 'push' | 'pull' | 'auto';

export interface SyncResult {
  success: boolean;
  direction: 'push' | 'pull' | 'none';
  message: string;
  conflict?: boolean;
  conflictData?: ConflictData;
}

/**
 * Main sync function.
 * - 'push': Force upload local data to Drive
 * - 'pull': Force download from Drive and overwrite local
 * - 'auto': Compare timestamps, sync whichever is newer
 */
export async function performSync(direction: SyncDirection = 'auto'): Promise<SyncResult> {
  const config = loadSyncConfig();

  if (!config.connected || !config.refreshToken) {
    return { success: false, direction: 'none', message: 'Not connected to Google Drive' };
  }

  if (!navigator.onLine) {
    return { success: false, direction: 'none', message: 'No internet connection' };
  }

  try {
    // Refresh token if needed
    const token = await refreshAccessToken(config);

    // Ensure folder exists
    if (!config.folderId) {
      config.folderId = await getOrCreateFolder(token);
      saveSyncConfig(config);
    }

    // Find existing backup file
    const existingFile = await findBackupFile(token, config.folderId);

    if (direction === 'push' || (!existingFile && direction === 'auto')) {
      // Push local data to Drive
      const localData = collectLocalData();
      await uploadBackupFile(token, config.folderId, localData, existingFile?.id);
      config.lastSyncAt = new Date().toISOString();
      config.lastSyncDirection = 'push';
      saveSyncConfig(config);
      clearDirty();
      return { success: true, direction: 'push', message: 'Data backed up to Google Drive' };
    }

    if (direction === 'pull') {
      // Pull from Drive and overwrite local
      if (!existingFile) {
        return { success: false, direction: 'none', message: 'No backup found on Google Drive' };
      }
      const remoteData = await downloadBackupFile(token, existingFile.id);
      restoreLocalData(remoteData);
      config.lastSyncAt = new Date().toISOString();
      config.lastSyncDirection = 'pull';
      saveSyncConfig(config);
      clearDirty();
      clearConflict();
      return { success: true, direction: 'pull', message: 'Data restored from Google Drive' };
    }

    // Auto mode: compare timestamps
    if (existingFile) {
      const remoteModified = new Date(existingFile.modifiedTime).getTime();
      const localTimestamp = config.lastSyncAt ? new Date(config.lastSyncAt).getTime() : 0;

      // Check if local has changes since last sync
      const localData = collectLocalData();
      const localModified = Date.now(); // Assume local is current

      if (remoteModified > localTimestamp + 5000) {
        // Remote is newer — check if local also has changes (conflict)
        const remoteData = await downloadBackupFile(token, existingFile.id);
        const remoteSyncTime = remoteData['_syncTimestamp'] ? new Date(remoteData['_syncTimestamp']).getTime() : remoteModified;

        if (remoteSyncTime > localTimestamp + 5000) {
          // Remote is newer. Check if local is also dirty (= conflict)
          const localIsDirty = isDirty();
          if (localIsDirty) {
            // CONFLICT: both local and remote changed since last sync
            const conflictInfo: ConflictData = {
              localData,
              remoteData,
              localTimestamp: getDirtyTimestamp() || new Date().toISOString(),
              remoteTimestamp: remoteData['_syncTimestamp'] || existingFile.modifiedTime,
            };
            saveConflict(conflictInfo);
            return { success: false, direction: 'none', message: 'Conflict detected: both local and remote data have changed', conflict: true, conflictData: conflictInfo };
          }

          // No local changes, safe to pull
          restoreLocalData(remoteData);
          config.lastSyncAt = new Date().toISOString();
          config.lastSyncDirection = 'pull';
          saveSyncConfig(config);
          clearDirty();
          return { success: true, direction: 'pull', message: 'Updated from Google Drive (remote was newer)' };
        }
      }

      // Local is newer or same — push
      await uploadBackupFile(token, config.folderId, localData, existingFile.id);
      config.lastSyncAt = new Date().toISOString();
      config.lastSyncDirection = 'push';
      saveSyncConfig(config);
      clearDirty();
      return { success: true, direction: 'push', message: 'Data backed up to Google Drive' };
    }

    return { success: false, direction: 'none', message: 'Unexpected state' };
  } catch (err: any) {
    console.error('[Sync Error]', err);
    return { success: false, direction: 'none', message: err.message || 'Sync failed' };
  }
}

// ============================================================
// AUTO-SYNC MANAGER
// ============================================================

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(): void {
  const config = loadSyncConfig();
  if (!config.connected || !config.autoSyncEnabled) return;

  stopAutoSync(); // Clear any existing interval

  const intervalMs = (config.syncIntervalMinutes || 60) * 60 * 1000;

  // Sync on start
  performSync('auto').catch(console.error);

  // Set up recurring sync
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      performSync('auto').catch(console.error);
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Call on app close/beforeunload to push final state
 */
export function syncOnClose(): void {
  const config = loadSyncConfig();
  if (!config.connected || !navigator.onLine) return;

  // Use sendBeacon for reliability on close, but it can't do auth headers
  // So we'll do a best-effort fetch
  performSync('push').catch(console.error);
}

// ============================================================
// DISCONNECT
// ============================================================

export function disconnectGoogleDrive(): void {
  stopAutoSync();
  const config = loadSyncConfig();
  config.connected = false;
  config.accessToken = '';
  config.refreshToken = '';
  config.tokenExpiry = 0;
  config.folderId = null;
  saveSyncConfig(config);
}
