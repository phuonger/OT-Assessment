/**
 * macOS Notarization Script
 * 
 * This script runs automatically after code signing during the build process.
 * It submits the signed app to Apple's notarization service.
 * 
 * Required environment variables:
 *   APPLE_ID          — Your Apple ID email
 *   APPLE_APP_PASSWORD — App-specific password (generate at appleid.apple.com)
 *   APPLE_TEAM_ID     — Your Apple Developer Team ID
 */

const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip if not in CI or missing credentials
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_PASSWORD) {
    console.log('Skipping notarization: APPLE_ID or APPLE_APP_PASSWORD not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}...`);

  await notarize({
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('Notarization complete.');
};
