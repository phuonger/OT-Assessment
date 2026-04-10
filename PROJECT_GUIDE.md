# Developmental Assessment Suite — Project Guide

> **Purpose:** This document captures the full architecture, design system, conventions, and development history of the Developmental Assessment Suite. It is intended as a comprehensive onboarding reference for any developer or AI assistant resuming work on this project.

**Repository:** [github.com/phuonger/OT-Assessment](https://github.com/phuonger/OT-Assessment)
**Current Version:** v1.9.0 (April 2026)

---

## 1. Project Overview

The Developmental Assessment Suite is a clinical tool for occupational therapists (OTs) to administer, score, and generate reports for pediatric developmental assessments. It supports multiple standardized assessment forms and runs as both a web application and a native desktop application via Electron.

All client data is stored locally in the browser's `localStorage` — no server-side database, no cloud storage of patient data. The only network calls are optional AI enhancement requests to OpenRouter for clinical report rewriting.

### Supported Assessment Forms

| Form | Domains | Scoring Type | Key Features |
|------|---------|-------------|--------------|
| **Bayley-4** | Cognitive, Fine Motor, Gross Motor, Receptive Communication, Expressive Communication | 0/1/2 (Not Present / Emerging / Mastery) | Scaled scores, standard scores, composite scores, age equivalents, growth scale values, percentile ranks |
| **DAYC-2** (English) | Cognitive, Communication, Social-Emotional, Physical Development, Adaptive Behavior | 0/1 (No/Yes) | Standard scores, age equivalents, percentile ranks, descriptive terms. Optional Bayley-4 Adaptive Behavior crosswalk scoring |
| **DAYC-2** (Spanish) | Same as DAYC-2 English | 0/1 (No/Yes) | Spanish-language items with same scoring tables |
| **REEL-3** | Receptive Language, Expressive Language | 0/1 (No/Yes) | Age equivalents, language ability composite |
| **Sensory Profile 2** | Seeking, Avoiding, Sensitivity, Registration (4 quadrants) + 6 sensory sections | 1-5 Likert scale | Quadrant scores, section scores, classification ranges |

### Key Features

The application provides a complete clinical workflow: child information entry, examiner details, multi-form selection with per-form domain picking, age-based start point calculation (with premature infant adjustment), item-by-item scoring with discontinue rules, real-time score tracking, multi-session save/load/compare, clinical report generation with two templates (OT Developmental Intake and OT SI Assessment), AI-powered report enhancement via OpenRouter, and export to PDF and Word (.docx) formats. The desktop version adds native file backup/restore and automatic updates via GitHub Releases.

---

## 2. Technology Stack

### Web Application

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 | Functional components, hooks only |
| **Routing** | Wouter | Hash-based routing (`useHashLocation`) for Electron `file://` compatibility |
| **Styling** | Tailwind CSS 4 | OKLCH color format in `@theme` blocks |
| **UI Components** | shadcn/ui (Radix primitives) | Imported into `client/src/components/ui/` |
| **Animation** | Framer Motion | Page transitions, micro-interactions |
| **Build Tool** | Vite | Dev server on port 3000 |
| **Language** | TypeScript (strict) | `tsconfig.json` with `ESNext` target |
| **Toasts** | Sonner | All notifications via `toast()` from sonner |
| **PDF Export** | jsPDF + jspdf-autotable, html2pdf.js | Two approaches: programmatic tables and DOM capture |
| **DOCX Export** | docx + file-saver | Browser-side Word document generation |

### Desktop Application (Electron)

| Component | Details |
|-----------|---------|
| **Electron Version** | 33.4.11 |
| **Main Process** | `desktop/main.js` (CommonJS) |
| **Preload** | `desktop/preload.js` — exposes `electronAPI` via contextBridge |
| **Builder** | electron-builder (configured in `desktop/package.json`) |
| **Auto-Update** | electron-updater, checks GitHub Releases |
| **Code Signing** | Apple Developer ID (macOS), unsigned (Windows) |
| **Notarization** | `@electron/notarize` via `desktop/notarize.js` |
| **Targets** | macOS: DMG + ZIP; Windows: NSIS installer + portable EXE |

### AI Integration

| Setting | Value |
|---------|-------|
| **Provider** | OpenRouter (openrouter.ai) |
| **API Key Storage** | `localStorage` key `bayley4-ai-api-key` |
| **Model Selection** | User-configurable in Settings; stored in `localStorage` key `bayley4-ai-model` |
| **Free Models** | GPT-OSS 120B, Gemma 3 27B, and others (model list in `aiEnhance.ts`) |
| **Paid Models** | Claude 3.5 Haiku |
| **Usage** | Single-section rewrite, batch "Enhance All", AI-generated recommendations |
| **Privacy** | Report text sent to OpenRouter for processing; no data stored by the AI service |

---

## 3. File Structure

```
bayley4-assessment/
├── client/                          # Web application source
│   ├── index.html                   # HTML entry point (loads Google Fonts CDN)
│   ├── src/
│   │   ├── App.tsx                  # Root component: routing, theme, error boundary
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Global styles, Tailwind theme, CSS variables
│   │   ├── fonts/                   # Font CSS imports (DM Sans, Source Sans 3)
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Main page — renders WelcomePage or app phases
│   │   │   └── NotFound.tsx         # 404 page (unused — catch-all routes to Home)
│   │   ├── contexts/
│   │   │   ├── AssessmentContext.tsx       # Legacy Bayley-4-only context (still used for single-form mode)
│   │   │   ├── MultiAssessmentContext.tsx  # Primary context: multi-form state management
│   │   │   └── ThemeContext.tsx            # Light/dark theme provider
│   │   ├── components/
│   │   │   ├── WelcomePage.tsx             # Landing/splash screen
│   │   │   ├── MultiStepSetup.tsx         # Child info → Examiner → Form selection wizard
│   │   │   ├── UnifiedAssessmentLayout.tsx # Main assessment layout (sidebar + panel)
│   │   │   ├── UnifiedAssessmentPanel.tsx  # Scoring panel for active domain
│   │   │   ├── UnifiedScoringItem.tsx      # Individual item scoring row
│   │   │   ├── UnifiedSidebar.tsx          # Domain navigation sidebar
│   │   │   ├── UnifiedSummaryReport.tsx    # Post-assessment scoring summary
│   │   │   ├── ClinicalReportEditor.tsx    # Full clinical report editor (largest component, ~1600 lines)
│   │   │   ├── SettingsPreferences.tsx     # Settings page (practice info, AI config, templates)
│   │   │   ├── SessionManager.tsx          # Save/load/compare assessment sessions
│   │   │   ├── DomainSidebar.tsx           # Legacy sidebar (Bayley-4 single-form)
│   │   │   ├── ScoringItem.tsx             # Legacy scoring item (Bayley-4 single-form)
│   │   │   ├── SummaryReport.tsx           # Legacy summary (Bayley-4 single-form)
│   │   │   ├── SelfFeedingChecklist.tsx    # OT feeding evaluation checklist
│   │   │   ├── DrinkingChecklist.tsx       # OT drinking skills checklist
│   │   │   ├── FeedingBehaviorsChecklist.tsx    # Feeding behaviors checklist
│   │   │   ├── FeedingPerformanceChecklist.tsx  # Feeding performance checklist
│   │   │   ├── UpdateNotification.tsx      # Electron auto-update UI
│   │   │   ├── ErrorBoundary.tsx           # React error boundary
│   │   │   └── ui/                         # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── lib/
│   │   │   ├── formRegistry.ts             # Unified form registry (abstracts all assessment types)
│   │   │   ├── assessmentData.ts           # Bayley-4 items, domains, age ranges
│   │   │   ├── scoringTables.ts            # Bayley-4 normative scoring tables (raw→scaled→standard)
│   │   │   ├── dayc2Data.ts                # DAYC-2 English items and domains
│   │   │   ├── dayc2SpanishData.ts         # DAYC-2 Spanish items and domains
│   │   │   ├── dayc2ScoringTables.ts       # DAYC-2 normative scoring tables
│   │   │   ├── reel3Data.ts                # REEL-3 items and domains
│   │   │   ├── reel3ScoringTables.ts       # REEL-3 normative scoring tables
│   │   │   ├── sensoryProfileData.ts       # Sensory Profile 2 items and sections
│   │   │   ├── aiEnhance.ts                # AI enhancement service (OpenRouter API)
│   │   │   ├── generatePDF.ts              # PDF export (jsPDF programmatic)
│   │   │   ├── generateReportPdf.ts        # PDF export (html2pdf DOM capture)
│   │   │   ├── generateDocx.ts             # Word document export
│   │   │   ├── generateMultiPDF.ts         # Multi-form PDF export
│   │   │   ├── generateChecklistPdf.ts     # Feeding checklist PDF export
│   │   │   ├── generateAllChecklistsPdf.ts # Combined checklist PDF export
│   │   │   ├── sessionStorage.ts           # Bayley-4 session save/load (legacy)
│   │   │   ├── multiSessionStorage.ts      # Multi-form session save/load
│   │   │   ├── dateUtils.ts                # Date parsing, age calculation, premature adjustment
│   │   │   ├── formatTime.ts               # Timer formatting utilities
│   │   │   └── utils.ts                    # General utilities (cn, etc.)
│   │   └── hooks/
│   │       ├── useComposition.ts           # Input composition handling (CJK support)
│   │       ├── useMobile.tsx               # Mobile breakpoint detection
│   │       └── usePersistFn.ts             # Stable function reference hook
│   └── public/                      # Static files (favicon only — NO images here)
├── desktop/                         # Electron shell
│   ├── main.js                      # Main process (window, menu, IPC, auto-update)
│   ├── preload.js                   # Context bridge (electronAPI)
│   ├── notarize.js                  # macOS notarization afterSign hook
│   ├── package.json                 # Electron dependencies + electron-builder config
│   ├── build/                       # Pre-built frontend copied here during CI
│   └── SIGNING_GUIDE.md             # Apple code signing setup instructions
├── .github/workflows/
│   └── release.yml                  # CI/CD: build frontend → build macOS + Windows → publish to GitHub Releases
├── server/                          # Placeholder (compatibility only — not used)
├── shared/                          # Placeholder (compatibility only — not used)
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Web app dependencies and scripts
├── ideas.md                         # Design brainstorm document
├── todo.md                          # Development roadmap and task tracking
└── PROJECT_GUIDE.md                 # This file
```

---

## 4. Design System — Clinical Precision (Swiss Medical)

The design follows a **Clinical Precision / Swiss Medical** aesthetic, chosen for its clear information hierarchy across hundreds of assessment items, professional clinical appearance, and warmth appropriate for pediatric settings.

### Color System

All colors use the **OKLCH** format (required by Tailwind CSS 4). The primary accent is a deep teal that conveys clinical professionalism.

| Token | OKLCH Value | Hex Approx. | Usage |
|-------|-------------|-------------|-------|
| **Primary** | `oklch(0.42 0.12 195)` | `#0D7377` | Buttons, links, active states |
| **Background** | `oklch(0.985 0.005 80)` | `#F8F7F4` | Warm off-white page background |
| **Foreground** | `oklch(0.2 0.015 60)` | `#2C2C2C` | Primary text |
| **Muted Foreground** | `oklch(0.5 0.015 60)` | `#6B6B6B` | Secondary text, descriptions |
| **Border** | `oklch(0.9 0.008 80)` | `#E5E1D8` | Card borders, dividers |
| **Card** | `oklch(1 0 0)` | `#FFFFFF` | Card backgrounds |

Domain-specific colors are used for wayfinding across assessment domains:

| Domain | CSS Variable | Color |
|--------|-------------|-------|
| Cognitive | `--color-domain-cognitive` | Teal |
| Language | `--color-domain-language` | Amber |
| Motor | `--color-domain-motor` | Green |
| Social-Emotional | `--color-domain-social` | Rose |
| Adaptive Behavior | `--color-domain-adaptive` | Blue |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| **Headings** | DM Sans | 600-700 | 18-24px |
| **Body text** | Source Sans 3 | 400-600 | 14-16px |
| **Metadata/labels** | Source Sans 3 | 400 | 12-13px |
| **Monospace (API keys)** | System monospace | 400 | 14px |

Fonts are loaded via Google Fonts CDN in `client/index.html` and declared in `client/src/fonts/`.

### Layout Patterns

The application uses a **structured grid layout** with a persistent left sidebar for domain navigation and a main content area. Key layout conventions include vertical steppers for the setup wizard, collapsible sections in the report editor, and tabbed interfaces for multi-form assessment views. The sidebar shows real-time score badges and completion indicators per domain.

---

## 5. Architecture Patterns

### State Management

The application uses **React Context + useReducer** for global state, with no external state library. There are two context systems:

**MultiAssessmentContext** (primary) manages the full application state including the current phase (`welcome`, `dashboard`, `childInfo`, `examinerInfo`, `formSelection`, `assessment`, `summary`, `report`, `history`, `backup`, `settings`), child and examiner information, form selections with per-form domain choices, and all scoring data organized by form → domain → item.

**AssessmentContext** (legacy) is the original Bayley-4-only context, still present for backward compatibility but superseded by MultiAssessmentContext for all new features.

### Data Flow

Assessment data flows through a layered architecture. The **Form Registry** (`formRegistry.ts`) provides a unified interface that abstracts all five assessment types into common `FormDefinition`, `UnifiedDomain`, and `UnifiedItem` types. Each form type has its own data file (e.g., `assessmentData.ts`, `dayc2Data.ts`) containing items, domains, age ranges, and start point logic. Scoring tables are separate files that provide normative lookup functions (raw score → scaled score → standard score → percentile rank → age equivalent).

### Persistence

All data persists in `localStorage` under namespaced keys:

| Key Pattern | Content |
|-------------|---------|
| `bayley4-multi-assessment-state` | Full multi-assessment state snapshot |
| `bayley4-multi-saved-sessions` | Array of saved session snapshots |
| `bayley4-app-settings` | Practice info, examiner defaults, templates |
| `bayley4-ai-api-key` | OpenRouter API key |
| `bayley4-ai-model` | Selected AI model ID |
| `bayley4-clinical-report-*` | Saved clinical report sections |

### Discontinue Rules

Each assessment form defines its own discontinue logic. Bayley-4 uses 5 consecutive items scored 0. DAYC-2 uses 3 consecutive items scored 0 or 1 (threshold-based). When triggered, all remaining items in the domain are auto-scored as 0, and a "DISCONTINUED" banner appears. Items before the start point are auto-scored at maximum (2 for Bayley-4, 1 for DAYC-2/REEL-3).

### Clinical Report Editor

`ClinicalReportEditor.tsx` is the largest component (~1,600 lines). It provides two report templates:

**OT Developmental Intake Assessment** includes scoring tables (Bayley-4, DAYC-2, REEL-3), domain narratives with demonstrated/not-demonstrated items, feeding/oral motor sections, sensory processing, summary of development, and recommendations with quarter-delay calculations.

**OT SI Assessment** includes numbered sections I-VII with SP2 quadrant/section scoring tables, quadrant definitions, sensory processing narratives, and SI-specific recommendations.

Both templates share header, client info, referral, medical history, and closing sections. All text sections are editable inline with auto-save to localStorage. The AI Enhance feature can rewrite individual sections or all sections in batch.

---

## 6. AI Enhancement System

The AI integration lives in `client/src/lib/aiEnhance.ts` and provides three capabilities:

**Single Section Enhancement** rewrites one report section into professional clinical language while preserving all factual content. Called from the "AI Enhance" button on each `EditableSection` in the report editor.

**Batch Enhancement** ("Enhance All") iterates through all editable report sections sequentially, enhancing each one. Shows progress toast with section count.

**AI Recommendations** generates clinical recommendations based on assessment scores, age, and domain performance. Produces structured recommendations with rationale.

### Model Configuration

The `AI_MODELS` array in `aiEnhance.ts` defines available models with their OpenRouter model IDs, labels, descriptions, and free/paid status. The system prompt instructs the model to act as a pediatric OT clinical report writer, preserving factual accuracy while improving clinical language.

### Adding a New Model

To add a new model, add an entry to the `AI_MODELS` array in `aiEnhance.ts`:

```typescript
{ id: 'new-model-id', label: 'Display Name', modelId: 'openrouter/model-id', description: 'Brief description', free: true }
```

The `modelId` must match the OpenRouter API model identifier. Free models on OpenRouter typically have a `:free` suffix.

---

## 7. Build & Release Pipeline

### Development

Run `pnpm dev` from the project root to start the Vite dev server on port 3000. The web app works standalone in any browser. For Electron development, the desktop shell loads the built frontend from `desktop/build/`.

### CI/CD (GitHub Actions)

The release workflow (`.github/workflows/release.yml`) triggers on version tags matching `v*.*.*`. It runs three jobs:

**build-frontend** runs on Ubuntu, installs pnpm dependencies, builds the Vite frontend with `--base './'` for relative paths, strips Manus debug scripts from the HTML, and uploads the build artifact.

**release-mac** runs on macOS, downloads the frontend artifact, copies it into the Electron shell, imports the Apple signing certificate from GitHub Secrets, builds the macOS app with electron-builder (DMG + ZIP), signs and notarizes it, and publishes to GitHub Releases.

**release-windows** runs on Windows, performs the same frontend copy, builds NSIS installer and portable EXE, and publishes to GitHub Releases.

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `GH_TOKEN` | GitHub token for publishing releases |
| `BUILD_CERTIFICATE_BASE64` | Apple Developer ID certificate (base64) |
| `P12_PASSWORD` | Certificate password |
| `KEYCHAIN_PASSWORD` | Temporary keychain password |
| `APPLE_ID` | Apple ID for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

### Versioning

Version tags follow semantic versioning. The desktop `package.json` version is automatically synced from the git tag during CI. To release a new version:

```bash
git tag -a v1.10.0 -m "v1.10.0: Description of changes"
git push origin v1.10.0
```

This triggers the full build pipeline and publishes installers to GitHub Releases. The Electron auto-updater checks these releases and notifies users of available updates.

---

## 8. Electron Desktop Integration

### IPC Bridge

The Electron preload script exposes a minimal `electronAPI` object via `contextBridge`:

| Method | Purpose |
|--------|---------|
| `exportBackup(data)` | Save JSON backup to user-chosen file |
| `importBackup()` | Load JSON backup from user-chosen file |
| `getAppVersion()` | Get current app version string |
| `checkForUpdates()` | Trigger update check |
| `downloadUpdate()` | Download available update |
| `installUpdate()` | Install downloaded update and restart |
| `onUpdateAvailable(cb)` | Listen for update-available event |
| `onUpdateDownloaded(cb)` | Listen for update-downloaded event |
| `onUpdateError(cb)` | Listen for update error event |
| `onDownloadProgress(cb)` | Listen for download progress event |

### Auto-Update Flow

The `UpdateNotification` component in the web layer listens for Electron update events and shows a non-intrusive notification bar when updates are available. Users can download and install updates from within the app, or check manually via the application menu.

### Routing Compatibility

The app uses hash-based routing (`/#/path`) when running in Electron to avoid issues with the `file://` protocol. The `App.tsx` component detects the Electron environment and switches to `useHashLocation` from Wouter accordingly.

---

## 9. Development Conventions

### Code Style

Components use functional React with hooks exclusively. State management uses `useReducer` for complex state and `useState` for simple local state. Side effects use `useEffect` with proper dependency arrays. Memoization via `useCallback` and `useMemo` is applied where performance matters (scoring calculations, large lists).

### File Organization

Each major feature gets its own component file. Data files (items, scoring tables) are separate from UI components. Utility functions live in `lib/`. The `formRegistry.ts` pattern should be followed when adding new assessment forms — define items and domains in a data file, add scoring tables in a separate file, and register the form in the registry.

### Naming Conventions

Components use PascalCase filenames matching the export name. Utility files use camelCase. CSS variables use kebab-case with semantic naming. localStorage keys use the `bayley4-` prefix for namespacing.

### Important Patterns to Preserve

The **Unified** prefix (UnifiedAssessmentLayout, UnifiedScoringItem, etc.) denotes the multi-form-aware components that replaced the original Bayley-4-only components. The legacy components (DomainSidebar, ScoringItem, SummaryReport) still exist but are not used in the primary flow.

The **EditableSection** pattern in ClinicalReportEditor provides inline editing with AI enhancement, undo capability, and auto-save. Any new report sections should follow this pattern.

The **formRegistry** abstraction is critical — all form-specific logic (items, domains, start points, scoring) is accessed through the registry, not directly from data files. This allows the assessment UI to be form-agnostic.

---

## 10. Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v1.0 | March 2026 | Initial Bayley-4 assessment with all 5 domains, scoring, PDF export |
| v1.1-1.3 | March 2026 | Discontinue rules, auto start points, adjustable start points, sticky sidebar, summary improvements |
| v1.4 | March 2026 | Multi-form support (DAYC-2, DAYC-2 Spanish, REEL-3, Sensory Profile 2), unified form registry |
| v1.5 | March-April 2026 | Clinical report editor with two templates, inline editing, save/restore |
| v1.6 | April 2026 | Word/DOCX export, feeding checklists, session management, Electron desktop app with auto-update |
| v1.7 | April 2026 | AI Enhance via OpenRouter (free + paid models), batch enhancement, AI recommendations |
| v1.8 | April 2026 | Local LLM attempt (wllama WebAssembly) — added then removed due to performance issues on older hardware |
| v1.9.0 | April 2026 | Cleaned to cloud-only AI, removed wllama dependency, simplified Settings |

---

## 11. Known Limitations & Future Work

### Current Limitations

The DAYC-2 discontinue rule (3 consecutive scores of 0 or 1) is defined in the todo but not yet fully implemented with undo capability. The OT Feeding Evaluation report template is planned but not yet built. Some scoring table edge cases for very young or very old age ranges may need verification against the published manuals.

### Planned Features (from todo.md)

The roadmap includes implementing the DAYC-2 threshold-based discontinue with undo logic, building the OT Feeding Evaluation report template, and potentially adding more assessment forms as needed. The AI integration could be expanded with a "Test API Key" button, automatic model fallback on rate limits, and usage tracking.

### Architecture Notes for Future Development

When adding a new assessment form, follow the established pattern: create a data file with items/domains/age ranges, create a scoring tables file with normative lookups, register the form in `formRegistry.ts`, and the existing UI components will handle it automatically. The clinical report editor may need template additions for form-specific report sections.

---

## 12. Quick Start for New Developers

```bash
# Clone the repository
git clone https://github.com/phuonger/OT-Assessment.git
cd OT-Assessment

# Install dependencies
pnpm install

# Start development server
pnpm dev
# → Opens at http://localhost:3000

# Type check
pnpm check

# Build for production
pnpm build
```

For Electron development, see `desktop/SIGNING_GUIDE.md` for code signing setup. The desktop app is built separately via `cd desktop && npm install && npx electron-builder --mac` (or `--win`).

---

*This guide was last updated on April 9, 2026, at version v1.9.0.*
