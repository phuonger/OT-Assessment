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
