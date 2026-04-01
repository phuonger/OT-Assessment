# Code Signing & Distribution Guide

## Developmental Assessment Suite — Desktop App

This guide walks you through the complete process of signing, notarizing, and distributing the app so that your users can open it without security warnings. It is written for someone who has never done code signing before.

---

## Overview: What You Need to Do

There are **two separate workflows** depending on your situation:

| Situation | What to do |
|-----------|------------|
| **First time ever** (no certificates yet) | Complete Parts A through E below |
| **Releasing an update** (already signed before) | Skip to Part D |

The entire first-time process takes about 30-45 minutes. Future updates take about 5 minutes.

---

## Part A: Get Your Apple Developer Account Ready

You need an active Apple Developer Program membership ($99/year). If you already have one, skip to Part B.

**A1.** Go to [developer.apple.com/account](https://developer.apple.com/account) and sign in with your Apple ID.

**A2.** If you are not yet enrolled, click "Join the Apple Developer Program" and complete the enrollment. It may take up to 48 hours for Apple to approve.

**A3.** Once enrolled, verify you can access the [Certificates page](https://developer.apple.com/account/resources/certificates/list). If you see this page without errors, you are ready.

---

## Part B: Create Your Signing Certificate

This certificate is what proves the app was made by you. You only need to do this once.

**B1.** On your Mac, open **Keychain Access** (search for it in Spotlight).

**B2.** From the menu bar, click **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**.

**B3.** Fill in:
- **User Email Address:** Your Apple ID email
- **Common Name:** Your name
- **CA Email Address:** Leave blank
- **Request is:** Select "Saved to disk"

**B4.** Click "Continue" and save the `.certSigningRequest` file to your Desktop.

**B5.** Go to [developer.apple.com/account/resources/certificates/add](https://developer.apple.com/account/resources/certificates/add).

**B6.** Select **"Developer ID Application"** (this is the one for distributing apps outside the Mac App Store). Click Continue.

**B7.** Upload the `.certSigningRequest` file you saved in step B4. Click Continue.

**B8.** Download the certificate (`.cer` file). **Double-click it** to install it into your Keychain.

**B9.** Verify it installed correctly by opening Terminal and running:

```bash
security find-identity -v -p codesigning
```

You should see a line like:

```
1) ABC123DEF456... "Developer ID Application: Your Name (ABCDE12345)"
```

**Write down the full text in quotes** — you will need it in Part C. The 10-character code in parentheses (like `ABCDE12345`) is your **Team ID**.

---

## Part C: Set Up Your Credentials

You need to gather 4 pieces of information and save them. Here is where to find each one:

| Credential | Where to find it | Example |
|-----------|-----------------|---------|
| **Apple ID** | Your Apple account email | `jane@example.com` |
| **App-Specific Password** | Generate below (step C1) | `abcd-efgh-ijkl-mnop` |
| **Team ID** | From step B9 (in parentheses) or [developer.apple.com/account](https://developer.apple.com/account) → Membership | `ABCDE12345` |
| **Signing Identity** | From step B9 (the full quoted string) | `Developer ID Application: Jane Smith (ABCDE12345)` |

**C1. Create an App-Specific Password** (required by Apple for notarization):

1. Go to [appleid.apple.com](https://appleid.apple.com) and sign in
2. Click **Sign-In and Security** → **App-Specific Passwords**
3. Click the **+** button to generate a new password
4. Name it something like `Electron Notarize`
5. **Copy and save the generated password** (you will not be able to see it again)

---

## Part D: Clone the Repo and Build on Your Mac

This is where you actually build the signed app. **You must do this on your Mac** (code signing only works on macOS).

### D1. Clone the GitHub repository

Open Terminal on your Mac and run:

```bash
git clone https://github.com/phuonger/OT-Assessment.git
cd OT-Assessment/desktop
```

> **Already cloned before?** Just pull the latest and navigate to the desktop folder:
> ```bash
> cd OT-Assessment
> git pull
> cd desktop
> ```

### D2. Install dependencies

Make sure you are inside the `desktop/` folder, then run:

```bash
npm install
```

This only installs 3 small packages (Electron, electron-builder, and the notarize tool). It should complete in under a minute with no errors.

> **If you get an ERESOLVE error:** You are probably in the wrong folder. Make sure you are in `OT-Assessment/desktop/`, not `OT-Assessment/`.

### D3. Edit `package.json` — Add your signing identity

Open `desktop/package.json` in any text editor (VS Code, TextEdit, etc.) and find this line (around line 62):

```json
"identity": null
```

Replace `null` with your signing identity from step B9. For example:

```json
"identity": "Developer ID Application: Jane Smith (ABCDE12345)"
```

**That is the only change you need to make to any file.** Save the file.

### D4. Set your credentials in the Terminal

In the same Terminal window, paste these 4 lines, replacing the placeholder values with your actual credentials from Part C:

```bash
export APPLE_ID="jane@example.com"
export APPLE_APP_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="ABCDE12345"
export CSC_NAME="Developer ID Application: Jane Smith (ABCDE12345)"
```

> **Important:** These environment variables only last for the current Terminal session. If you close Terminal and reopen it, you will need to paste them again. To make them permanent, you can add them to your `~/.zshrc` file.

### D5. Build the signed app

For Mac only:

```bash
npm run build:mac
```

For both Mac and Windows:

```bash
npm run build:all
```

**What happens during the build:**
1. The app is packaged with Electron
2. Your Developer ID certificate signs the app
3. The signed app is submitted to Apple for notarization (this takes 2-5 minutes)
4. Apple's notarization ticket is stapled to the app
5. The finished files appear in the `dist/` folder

### D6. Verify the signature (optional but recommended)

```bash
codesign --verify --deep --strict "dist/mac-arm64/Developmental Assessment Suite.app"
```

If there is no output, the signature is valid. Then check notarization:

```bash
spctl --assess --type execute "dist/mac-arm64/Developmental Assessment Suite.app"
```

This should output: `accepted` with source `Notarized Developer ID`.

### D7. Find your signed files

Your ready-to-distribute files are in the `desktop/dist/` folder:

| File | Platform | For whom |
|------|----------|----------|
| `Developmental Assessment Suite-1.3.0-arm64-mac.zip` | Mac (Apple Silicon M1/M2/M3) | Most newer Macs |
| `Developmental Assessment Suite-1.3.0-mac.zip` | Mac (Intel) | Older Macs |
| `Developmental Assessment Suite Setup 1.3.0.exe` | Windows (installer) | Windows users |
| `Developmental Assessment Suite-Portable-1.3.0.exe` | Windows (portable) | Windows users who cannot install software |

You can now share these files directly with your users. The Mac versions will open without any security warnings.

---

## Part E: Publish to GitHub for Auto-Updates (Optional)

If you want existing users to receive automatic update notifications when you release a new version, you can publish to GitHub Releases.

### E1. Create a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name like `Electron Builder`
4. Check the **`repo`** scope (full control of private repositories)
5. Click "Generate token" and **copy it immediately**

### E2. Publish the release

In Terminal (with all your environment variables from D4 still set, and still in the `desktop/` folder):

```bash
export GH_TOKEN="ghp_your_token_here"
npx electron-builder --mac --win --publish always
```

This will:
- Build signed Mac and Windows packages
- Create a GitHub Release tagged with the current version (e.g., `v1.3.0`)
- Upload all installer files and update metadata

### E3. How auto-updates work for your users

When a user opens the app, it automatically checks GitHub for a newer version. If one is found, they see a notification bar with a "Download Update" button. After downloading, they click "Install & Restart" to apply it.

---

## Quick Reference: Releasing Future Updates

Once you have completed the first-time setup above, releasing updates is simple:

```bash
# 1. Pull the latest code
cd OT-Assessment
git pull
cd desktop

# 2. Set your environment variables (paste the export lines from D4 + E2)
export APPLE_ID="jane@example.com"
export APPLE_APP_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="ABCDE12345"
export CSC_NAME="Developer ID Application: Jane Smith (ABCDE12345)"
export GH_TOKEN="ghp_your_token_here"

# 3. Build and publish
npx electron-builder --mac --win --publish always
```

Make sure `package.json` still has your signing identity (it should, unless it was overwritten by a git pull).

That is it. Your users will be notified of the update automatically.

---

## Troubleshooting

### "App is damaged and can't be opened"

This means the app was not signed or notarized. Double-check that:
- Your Developer ID certificate is installed in Keychain (step B8)
- All 4 environment variables are set correctly (step D4)
- The build log shows "Notarization complete" (not "Skipping notarization")

### "Developer cannot be verified"

This means the app is signed but not notarized. Right-click the app → Open → Open to bypass Gatekeeper for the first launch. To fix it permanently, rebuild with the `APPLE_ID` and `APPLE_APP_PASSWORD` environment variables set.

### Notarization fails with "invalid signature"

Make sure the `build/entitlements.mac.plist` file exists in your project. It should already be there from the repository.

### Windows SmartScreen warning

The Windows build is not code-signed (that requires a separate, expensive EV certificate). Users will see a SmartScreen warning on first launch. They can click **"More info" → "Run anyway"** to proceed. This is normal for unsigned Windows apps.

### "Skipping notarization" in the build log

This means the `APPLE_ID` or `APPLE_APP_PASSWORD` environment variables are not set. Make sure you ran the `export` commands in the same Terminal window where you are running the build.

### Build fails with "no identity found"

Make sure the `identity` value in `package.json` exactly matches the output from `security find-identity -v -p codesigning`, including the Team ID in parentheses.

### npm install fails with ERESOLVE

You are running `npm install` from the wrong folder. The root `OT-Assessment/` folder contains the web app source code with many complex dependencies. You need to be in `OT-Assessment/desktop/` instead:

```bash
cd OT-Assessment/desktop
npm install
```
