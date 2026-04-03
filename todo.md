# Bayley-4 Multi-Assessment App - Todo

## Completed
- [x] 1. Adjustable start point during assessment (with dynamic pre-score updates)
- [x] 2. Sticky sidebar navigation
- [x] 3. Fix summary report: remove max scores, remove max %, add Excel scoring standards
- [x] 4. Local storage auto-save for pause/resume
- [x] 5. PDF report export
- [x] 6. Item-level scoring criteria tooltips
- [x] 7. Examiner notes per item
- [x] 8. Progress timer per domain

## Phase 1: Download Additional Forms
- [ ] Access Google Drive folder and download DAY-C, DAY-C Spanish, REEL, Sensory Profile files
- [ ] Verify all files are accessible and readable

## Phase 2: Analyze Form Structures
- [ ] Analyze DAY-C form structure, domains, items, scoring
- [ ] Analyze DAY-C Spanish form structure, domains, items, scoring
- [ ] Analyze REEL form structure, domains, items, scoring
- [ ] Analyze Sensory Profile form structure, domains, items, scoring

## Phase 3: Extract Data
- [ ] Generate TypeScript data file for DAY-C
- [ ] Generate TypeScript data file for DAY-C Spanish
- [ ] Generate TypeScript data file for REEL
- [ ] Generate TypeScript data file for Sensory Profile

## Phase 4: Restructure App
- [ ] Unified child info entry (name, DOB → test age/start point)
- [ ] Examiner info section
- [ ] Assessment form type selection (multi-select: Bayley-4, DAY-C, DAY-C Spanish, REEL, Sensory Profile)
- [ ] Per-form domain selection
- [ ] Updated navigation to handle multiple forms

## Phase 5: Build Per-Form Assessment & Scoring
- [ ] DAY-C assessment panel and scoring report
- [ ] DAY-C Spanish assessment panel and scoring report
- [ ] REEL assessment panel and scoring report
- [ ] Sensory Profile assessment panel and scoring report

## Phase 6: Multi-Session Support
- [ ] Save/load sessions across all form types
- [ ] Comparison view for multi-form sessions

## Future: Report Generation
- [ ] Template-based report writer (waiting for user's template and reference reports)

## Phase 7: DAYC-2 Discontinue Rule + Undo Discontinue
- [ ] 1. Update FormDefinition interface to support `discontinueThreshold` (scores <= threshold count toward consecutive)
- [ ] 2. Update DAYC-2 forms in formRegistry.ts: 3 consecutive scores of 0 or 1 (threshold=1, count=3)
- [ ] 3. Update `checkDiscontinue` in MultiAssessmentContext to support threshold-based checking
- [ ] 4. Update SET_SCORE reducer to allow editing items at/before discontinuedAtItem even when discontinued
- [ ] 5. Add undo logic: when a score change breaks the consecutive chain, clear discontinued state and remove auto-scored trailing 0s
- [ ] 6. Update UnifiedScoringItem to allow editing items at/before the discontinue point (not locked)
- [ ] 7. Update UnifiedAssessmentPanel discontinued banner to show appropriate message and undo button

## OT Feeding Evaluation Report Feature
- [ ] Read existing report architecture (ClinicalReportEditor, generateDocx, App.tsx routes)
- [ ] Create OTFeedingEvaluation.tsx editor component with all sections
- [ ] Add route and navigation entry point from assessment completion
- [ ] Create generateOTFeedingDocx function matching template format
- [ ] Test and checkpoint
