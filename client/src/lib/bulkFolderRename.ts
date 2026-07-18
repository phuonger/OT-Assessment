/**
 * Bulk Folder Rename Utility
 * 
 * Scans all client folders under otassess/signed-documents/ on Google Drive
 * and renames any that don't match the standard format: FirstName_LastName_ProfileNumber
 * 
 * This ensures consistency for the auto-filing scanner and prevents issues
 * with duplicate client names.
 */

import { loadAllProfiles, type ClientProfile } from '@/lib/clientProfileStorage';
import { loadSyncConfig, type SyncConfig } from '@/lib/googleDriveSync';

// ============================================================
// Types
// ============================================================

export interface FolderRenameResult {
  folderId: string;
  oldName: string;
  newName: string;
  profileNumber: number;
  clientName: string;
  success: boolean;
  error?: string;
  skipped?: boolean; // Already in correct format
}

export interface BulkRenameReport {
  totalFolders: number;
  alreadyCorrect: number;
  renamed: number;
  unmatched: number;
  errors: number;
  results: FolderRenameResult[];
}

// ============================================================
// Token Refresh (same pattern as autoFilingScanner)
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

  const updatedConfig = {
    ...config,
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in * 1000),
  };
  localStorage.setItem('ot_drive_sync_config', JSON.stringify(updatedConfig));

  return data.access_token;
}

// ============================================================
// Matching Logic
// ============================================================

/**
 * Build the expected folder name for a profile
 */
function buildExpectedFolderName(profile: ClientProfile): string {
  const sanitizedName = `${profile.firstName} ${profile.lastName}`
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  const underscoreName = sanitizedName.replace(/\s+/g, '_');
  return `${underscoreName}_${profile.profileNumber}`;
}

/**
 * Try to match a Drive folder name to a client profile.
 * Handles various formats:
 *   - "FirstName LastName" (old format, no number)
 *   - "FirstName LastName 100001" (old format with number)
 *   - "FirstName_LastName_100001" (new format)
 *   - "firstname_lastname_100001" (case variations)
 *   - "firstname lastname" (lowercase, no number)
 */
function matchFolderToProfile(
  folderName: string,
  profiles: ClientProfile[]
): ClientProfile | null {
  // Strategy 1: Extract a profile number from the folder name
  const numberMatch = folderName.match(/(\d{5,7})/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (num >= 100001) {
      const profile = profiles.find(p => p.profileNumber === num);
      if (profile) return profile;
    }
  }

  // Strategy 2: Match by name (case-insensitive)
  const normalizedFolder = folderName
    .replace(/[_\s]+/g, ' ')  // Normalize separators to spaces
    .replace(/\d{5,7}/, '')    // Remove any numbers
    .trim()
    .toLowerCase();

  for (const profile of profiles) {
    const fullName = `${profile.firstName} ${profile.lastName}`.toLowerCase().trim();
    const reverseName = `${profile.lastName} ${profile.firstName}`.toLowerCase().trim();

    if (normalizedFolder === fullName || normalizedFolder === reverseName) {
      return profile;
    }
  }

  // Strategy 3: Partial match (first name + last name contained)
  for (const profile of profiles) {
    const first = profile.firstName.toLowerCase();
    const last = profile.lastName.toLowerCase();
    const folderLower = folderName.toLowerCase();

    if (folderLower.includes(first) && folderLower.includes(last)) {
      return profile;
    }
  }

  return null;
}

/**
 * Check if a folder already has the correct name format
 */
function isCorrectFormat(folderName: string, profile: ClientProfile): boolean {
  const expected = buildExpectedFolderName(profile);
  return folderName === expected;
}

// ============================================================
// Main Bulk Rename Function
// ============================================================

/**
 * Preview what would be renamed (dry run) without actually renaming
 */
export async function previewBulkRename(): Promise<BulkRenameReport> {
  return executeBulkRename(true);
}

/**
 * Execute the bulk rename operation
 */
export async function runBulkRename(): Promise<BulkRenameReport> {
  return executeBulkRename(false);
}

async function executeBulkRename(dryRun: boolean): Promise<BulkRenameReport> {
  const report: BulkRenameReport = {
    totalFolders: 0,
    alreadyCorrect: 0,
    renamed: 0,
    unmatched: 0,
    errors: 0,
    results: [],
  };

  const config = loadSyncConfig();
  if (!config.connected || !config.refreshToken) {
    throw new Error('Not connected to Google Drive. Please connect first.');
  }

  const token = await refreshAccessToken(config);
  const rootFolderId = config.folderId;
  if (!rootFolderId) {
    throw new Error('No root folder configured. Please reconnect Google Drive.');
  }

  // Find signed-documents subfolder
  const signedDocsSearch = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='signed-documents' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!signedDocsSearch.ok) {
    throw new Error('Failed to access Google Drive. Please check your connection.');
  }
  const signedDocsData = await signedDocsSearch.json();
  if (!signedDocsData.files?.length) {
    throw new Error('No "signed-documents" folder found. Run auto-filing first to create the folder structure.');
  }
  const signedDocsFolderId = signedDocsData.files[0].id;

  // List ALL subfolders in signed-documents (these are the client folders)
  let allFolders: Array<{ id: string; name: string }> = [];
  let pageToken: string | undefined;

  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${signedDocsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    url.searchParams.set('fields', 'nextPageToken,files(id,name)');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to list folders');
    const data = await res.json();
    allFolders = allFolders.concat(data.files || []);
    pageToken = data.nextPageToken;
  } while (pageToken);

  report.totalFolders = allFolders.length;

  // Load all profiles for matching
  const profiles = loadAllProfiles();

  // Process each folder
  for (const folder of allFolders) {
    // Skip the Adobe-Signed folder itself
    if (folder.name === 'Adobe-Signed') {
      report.totalFolders--;
      continue;
    }

    const matchedProfile = matchFolderToProfile(folder.name, profiles);

    if (!matchedProfile) {
      report.unmatched++;
      report.results.push({
        folderId: folder.id,
        oldName: folder.name,
        newName: '',
        profileNumber: 0,
        clientName: folder.name,
        success: false,
        error: 'Could not match to any client profile',
      });
      continue;
    }

    const expectedName = buildExpectedFolderName(matchedProfile);

    // Check if already in correct format
    if (folder.name === expectedName) {
      report.alreadyCorrect++;
      report.results.push({
        folderId: folder.id,
        oldName: folder.name,
        newName: expectedName,
        profileNumber: matchedProfile.profileNumber,
        clientName: `${matchedProfile.firstName} ${matchedProfile.lastName}`,
        success: true,
        skipped: true,
      });
      continue;
    }

    // Rename the folder (or just report in dry run)
    if (dryRun) {
      report.renamed++;
      report.results.push({
        folderId: folder.id,
        oldName: folder.name,
        newName: expectedName,
        profileNumber: matchedProfile.profileNumber,
        clientName: `${matchedProfile.firstName} ${matchedProfile.lastName}`,
        success: true,
      });
    } else {
      try {
        const renameRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${folder.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: expectedName }),
          }
        );

        if (renameRes.ok) {
          report.renamed++;
          report.results.push({
            folderId: folder.id,
            oldName: folder.name,
            newName: expectedName,
            profileNumber: matchedProfile.profileNumber,
            clientName: `${matchedProfile.firstName} ${matchedProfile.lastName}`,
            success: true,
          });
        } else {
          const errData = await renameRes.json().catch(() => ({}));
          report.errors++;
          report.results.push({
            folderId: folder.id,
            oldName: folder.name,
            newName: expectedName,
            profileNumber: matchedProfile.profileNumber,
            clientName: `${matchedProfile.firstName} ${matchedProfile.lastName}`,
            success: false,
            error: `Drive API error: ${(errData as any)?.error?.message || renameRes.status}`,
          });
        }
      } catch (err: any) {
        report.errors++;
        report.results.push({
          folderId: folder.id,
          oldName: folder.name,
          newName: expectedName,
          profileNumber: matchedProfile.profileNumber,
          clientName: `${matchedProfile.firstName} ${matchedProfile.lastName}`,
          success: false,
          error: err.message || 'Unknown error',
        });
      }
    }
  }

  return report;
}
