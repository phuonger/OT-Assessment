/**
 * Auto-Filing Scanner
 * 
 * Scans for signed PDFs in two locations:
 * 1. Google Drive: otassess/signed-documents/Adobe-Signed/ folder
 * 2. Local folder: a user-configured folder on the therapist's laptop (Electron only)
 * 
 * Parses filenames to extract profile numbers and automatically moves files
 * to the correct client subfolder (e.g., "Jim Bob 100001").
 * 
 * Filename format expected: Attendance_Jim_Bob-100001-2026-07-15.pdf
 *                       or: Assessment_Jim_Bob-100001-2026-07-15.pdf
 * 
 * The scanner extracts the profile number (e.g., 100001) from the filename,
 * looks up the corresponding client profile, and files the document accordingly.
 */

import { loadAllProfiles, getProfileByNumber, updateProfile } from '@/lib/clientProfileStorage';
import { loadSyncConfig, type SyncConfig } from '@/lib/googleDriveSync';

// ============================================================
// Types
// ============================================================

export interface FilingResult {
  filename: string;
  profileNumber: number;
  clientName: string;
  destination: string; // folder path or Drive folder name
  success: boolean;
  error?: string;
}

export interface ScanResult {
  scannedAt: string;
  source: 'google-drive' | 'local-folder';
  filesFound: number;
  filesFiled: number;
  results: FilingResult[];
}

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

// ============================================================
// Constants
// ============================================================

const ADOBE_SIGNED_FOLDER = 'Adobe-Signed';
const SCAN_HISTORY_KEY = 'ot_autofiling_scan_history';
const WATCHED_FOLDER_KEY = 'ot_watched_folder_path';

// ============================================================
// Settings
// ============================================================

/** Get the configured local watched folder path */
export function getWatchedFolderPath(): string {
  return localStorage.getItem(WATCHED_FOLDER_KEY) || '';
}

/** Set the local watched folder path */
export function setWatchedFolderPath(path: string): void {
  localStorage.setItem(WATCHED_FOLDER_KEY, path);
}

/** Get scan history */
export function getScanHistory(): ScanResult[] {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save scan result to history */
function saveScanResult(result: ScanResult): void {
  const history = getScanHistory();
  history.unshift(result);
  // Keep only last 50 scans
  if (history.length > 50) history.length = 50;
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
}

// ============================================================
// Filename Parsing
// ============================================================

/**
 * Extract profile number from a filename.
 * Expected formats:
 *   Attendance_Jim_Bob-100001-2026-07-15.pdf
 *   Assessment_Jim_Bob-100001-2026-07-15.pdf
 * 
 * Pattern: looks for a 6-digit number between hyphens
 */
export function extractProfileNumber(filename: string): number | null {
  // Match pattern: -NNNNNN- where N is a digit (5-7 digits to be flexible)
  const match = filename.match(/-(\d{5,7})-/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 100001) return num;
  }
  return null;
}

/**
 * Determine document type from filename
 */
export function extractDocumentType(filename: string): 'attendance' | 'assessment' | 'unknown' {
  const lower = filename.toLowerCase();
  if (lower.startsWith('attendance')) return 'attendance';
  if (lower.startsWith('assessment')) return 'assessment';
  return 'unknown';
}

// ============================================================
// Google Drive Scanner
// ============================================================

async function refreshAccessToken(config: SyncConfig): Promise<string> {
  if (config.accessToken && config.tokenExpiry > Date.now()) {
    return config.accessToken;
  }
  
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh token');
  const data = await res.json();
  
  // Update stored config
  const updatedConfig = {
    ...config,
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in * 1000),
  };
  localStorage.setItem('ot_drive_sync_config', JSON.stringify(updatedConfig));
  
  return data.access_token;
}

/**
 * Scan the Google Drive "Adobe-Signed" folder for files to auto-file.
 */
export async function scanGoogleDriveAdobeSigned(): Promise<ScanResult> {
  const result: ScanResult = {
    scannedAt: new Date().toISOString(),
    source: 'google-drive',
    filesFound: 0,
    filesFiled: 0,
    results: [],
  };

  const config = loadSyncConfig();
  if (!config.connected || !config.refreshToken) {
    return result;
  }

  try {
    const token = await refreshAccessToken(config);

    // Find the root otassess folder
    const rootFolderId = config.folderId;
    if (!rootFolderId) return result;

    // Find signed-documents subfolder
    const signedDocsSearch = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='signed-documents' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!signedDocsSearch.ok) return result;
    const signedDocsData = await signedDocsSearch.json();
    if (!signedDocsData.files?.length) return result;
    const signedDocsFolderId = signedDocsData.files[0].id;

    // Find or verify Adobe-Signed subfolder exists
    const adobeSignedSearch = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${ADOBE_SIGNED_FOLDER}' and '${signedDocsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!adobeSignedSearch.ok) return result;
    const adobeSignedData = await adobeSignedSearch.json();
    if (!adobeSignedData.files?.length) {
      // Create the Adobe-Signed folder so user knows where to point Adobe Sign
      await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ADOBE_SIGNED_FOLDER,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [signedDocsFolderId],
        }),
      });
      return result; // Folder just created, nothing to scan yet
    }
    const adobeSignedFolderId = adobeSignedData.files[0].id;

    // List all PDF files in Adobe-Signed folder
    const filesSearch = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${adobeSignedFolderId}' in parents and mimeType='application/pdf' and trashed=false&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc&pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!filesSearch.ok) return result;
    const filesData = await filesSearch.json();
    const files: DriveFileItem[] = filesData.files || [];
    result.filesFound = files.length;

    // Process each file
    for (const file of files) {
      const profileNumber = extractProfileNumber(file.name);
      if (!profileNumber) {
        result.results.push({
          filename: file.name,
          profileNumber: 0,
          clientName: 'Unknown',
          destination: 'Skipped - no profile number in filename',
          success: false,
          error: 'Could not extract profile number from filename',
        });
        continue;
      }

      // Look up the profile
      const profile = getProfileByNumber(profileNumber);
      if (!profile) {
        result.results.push({
          filename: file.name,
          profileNumber,
          clientName: 'Unknown',
          destination: 'Skipped - profile not found',
          success: false,
          error: `No profile found with number ${profileNumber}`,
        });
        continue;
      }

      const clientName = `${profile.firstName} ${profile.lastName}`.trim();
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const folderName = `${sanitizedName} ${profileNumber}`;

      try {
        // Find or create the client folder
        const clientFolderSearch = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and '${signedDocsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let clientFolderId: string;
        if (clientFolderSearch.ok) {
          const clientFolderData = await clientFolderSearch.json();
          if (clientFolderData.files?.length) {
            clientFolderId = clientFolderData.files[0].id;
          } else {
            // Create client folder
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [signedDocsFolderId],
              }),
            });
            const createData = await createRes.json();
            clientFolderId = createData.id;
          }
        } else {
          throw new Error('Failed to search for client folder');
        }

        // Move the file from Adobe-Signed to the client folder
        const moveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?addParents=${clientFolderId}&removeParents=${adobeSignedFolderId}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (moveRes.ok) {
          result.filesFiled++;
          result.results.push({
            filename: file.name,
            profileNumber,
            clientName,
            destination: folderName,
            success: true,
          });

          // Update the signature request status if we can match it
          const docType = extractDocumentType(file.name);
          if (docType !== 'unknown') {
            const pendingRequests = (profile.signatureRequests || []).filter(
              r => r.status === 'pending' && r.type === docType
            );
            if (pendingRequests.length > 0) {
              // Mark the most recent pending request as signed
              const toUpdate = pendingRequests[pendingRequests.length - 1];
              toUpdate.status = 'signed';
              toUpdate.signedAt = new Date().toISOString();
              toUpdate.signedPdfPath = `Google Drive: ${folderName}/${file.name}`;
              updateProfile(profile.id, { signatureRequests: profile.signatureRequests });
            }
          }
        } else {
          throw new Error('Failed to move file');
        }
      } catch (err: any) {
        result.results.push({
          filename: file.name,
          profileNumber,
          clientName,
          destination: folderName,
          success: false,
          error: err.message,
        });
      }
    }
  } catch (err: any) {
    console.error('[Auto-Filing Scanner] Drive scan error:', err);
  }

  saveScanResult(result);
  return result;
}

// ============================================================
// Local Folder Scanner (Electron only)
// ============================================================

/**
 * Scan the local watched folder for signed PDFs.
 * Uses Electron's IPC to access the file system.
 */
export async function scanLocalWatchedFolder(): Promise<ScanResult> {
  const result: ScanResult = {
    scannedAt: new Date().toISOString(),
    source: 'local-folder',
    filesFound: 0,
    filesFiled: 0,
    results: [],
  };

  const watchedPath = getWatchedFolderPath();
  if (!watchedPath) return result;

  // Check if we're in Electron
  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.scanFolder) return result;

  try {
    // Get list of PDF files from the watched folder via Electron IPC
    const files: { name: string; path: string; data: ArrayBuffer }[] = await electronAPI.scanFolder(watchedPath);
    result.filesFound = files.length;

    const config = loadSyncConfig();
    if (!config.connected || !config.refreshToken) {
      // Can't upload to Drive, just report what was found
      for (const file of files) {
        const profileNumber = extractProfileNumber(file.name);
        result.results.push({
          filename: file.name,
          profileNumber: profileNumber || 0,
          clientName: 'N/A',
          destination: 'Cannot upload - Drive not connected',
          success: false,
          error: 'Google Drive not connected',
        });
      }
      saveScanResult(result);
      return result;
    }

    const token = await refreshAccessToken(config);
    const rootFolderId = config.folderId;
    if (!rootFolderId) return result;

    // Find signed-documents folder
    const signedDocsSearch = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='signed-documents' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!signedDocsSearch.ok) return result;
    const signedDocsData = await signedDocsSearch.json();
    if (!signedDocsData.files?.length) return result;
    const signedDocsFolderId = signedDocsData.files[0].id;

    for (const file of files) {
      const profileNumber = extractProfileNumber(file.name);
      if (!profileNumber) {
        result.results.push({
          filename: file.name,
          profileNumber: 0,
          clientName: 'Unknown',
          destination: 'Skipped - no profile number in filename',
          success: false,
          error: 'Could not extract profile number from filename',
        });
        continue;
      }

      const profile = getProfileByNumber(profileNumber);
      if (!profile) {
        result.results.push({
          filename: file.name,
          profileNumber,
          clientName: 'Unknown',
          destination: 'Skipped - profile not found',
          success: false,
          error: `No profile found with number ${profileNumber}`,
        });
        continue;
      }

      const clientName = `${profile.firstName} ${profile.lastName}`.trim();
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const folderName = `${sanitizedName} ${profileNumber}`;

      try {
        // Find or create client folder on Drive
        const clientFolderSearch = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and '${signedDocsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let clientFolderId: string;
        if (clientFolderSearch.ok) {
          const clientFolderData = await clientFolderSearch.json();
          if (clientFolderData.files?.length) {
            clientFolderId = clientFolderData.files[0].id;
          } else {
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [signedDocsFolderId],
              }),
            });
            const createData = await createRes.json();
            clientFolderId = createData.id;
          }
        } else {
          throw new Error('Failed to search for client folder');
        }

        // Check for duplicate
        const dupSearch = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(file.name).replace(/'/g, "\\'")}' and '${clientFolderId}' in parents and trashed=false&fields=files(id)`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (dupSearch.ok) {
          const dupData = await dupSearch.json();
          if (dupData.files?.length) {
            result.results.push({
              filename: file.name,
              profileNumber,
              clientName,
              destination: folderName,
              success: true,
              error: 'Already filed (duplicate skipped)',
            });
            // Delete from local watched folder
            if (electronAPI.deleteFile) {
              await electronAPI.deleteFile(file.path);
            }
            result.filesFiled++;
            continue;
          }
        }

        // Upload to Drive
        const pdfBlob = new Blob([file.data], { type: 'application/pdf' });
        const metadata = {
          name: file.name,
          parents: [clientFolderId],
          mimeType: 'application/pdf',
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);

        const uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }
        );

        if (uploadRes.ok) {
          result.filesFiled++;
          result.results.push({
            filename: file.name,
            profileNumber,
            clientName,
            destination: folderName,
            success: true,
          });

          // Delete from local watched folder after successful upload
          if (electronAPI.deleteFile) {
            await electronAPI.deleteFile(file.path);
          }

          // Update signature request status
          const docType = extractDocumentType(file.name);
          if (docType !== 'unknown') {
            const pendingRequests = (profile.signatureRequests || []).filter(
              r => r.status === 'pending' && r.type === docType
            );
            if (pendingRequests.length > 0) {
              const toUpdate = pendingRequests[pendingRequests.length - 1];
              toUpdate.status = 'signed';
              toUpdate.signedAt = new Date().toISOString();
              toUpdate.signedPdfPath = `Google Drive: ${folderName}/${file.name}`;
              updateProfile(profile.id, { signatureRequests: profile.signatureRequests });
            }
          }
        } else {
          throw new Error('Upload to Drive failed');
        }
      } catch (err: any) {
        result.results.push({
          filename: file.name,
          profileNumber,
          clientName,
          destination: folderName,
          success: false,
          error: err.message,
        });
      }
    }
  } catch (err: any) {
    console.error('[Auto-Filing Scanner] Local scan error:', err);
  }

  saveScanResult(result);
  return result;
}

// ============================================================
// Combined Scanner (runs both)
// ============================================================

/**
 * Run the auto-filing scanner on all configured sources.
 * Called during sync, on app open, and manually.
 */
export async function runAutoFiling(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  // Scan Google Drive Adobe-Signed folder
  try {
    const driveResult = await scanGoogleDriveAdobeSigned();
    if (driveResult.filesFound > 0) {
      results.push(driveResult);
    }
  } catch (err) {
    console.error('[Auto-Filing] Drive scan failed:', err);
  }

  // Scan local watched folder (Electron only)
  const watchedPath = getWatchedFolderPath();
  if (watchedPath && (window as any).electronAPI?.scanFolder) {
    try {
      const localResult = await scanLocalWatchedFolder();
      if (localResult.filesFound > 0) {
        results.push(localResult);
      }
    } catch (err) {
      console.error('[Auto-Filing] Local scan failed:', err);
    }
  }

  return results;
}

/**
 * Select a local folder via Electron's dialog.
 * Returns the selected folder path or null if cancelled.
 */
export async function selectWatchedFolder(): Promise<string | null> {
  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.selectFolder) return null;
  
  const path = await electronAPI.selectFolder();
  if (path) {
    setWatchedFolderPath(path);
  }
  return path;
}
