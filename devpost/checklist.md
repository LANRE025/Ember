---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. First run → Today with bands, rank, and Kael**
  Becomes usable: User can enter goal/why, complete interview or use fallback, see bands on Today screen with Kael on the leftmost edge (head-to-waist knight), rank badge showing Spark, and ability to raise S/R by 1 step (Floor locked).
  Why now: Proves the kernel end-to-end - setup, bands (with constraints), UI with required assets and styling. Includes all scaffolding (FastAPI backend, Expo React Native app, SQLite, Gemini integration with fallback).
  PRD ref: `prd.md > The Core Journey` (steps 1-5), `prd.md > Bands and the Floor`, `prd.md > Look and Feel`, `prd.md > Ranks and badges`
  Spec ref: `spec.md > Stack`, `spec.md > Components`, `spec.md > File Structure`, `spec.md > Look and Feel`
  Build: Scaffold backend (FastAPI) with routes for setup/goals/bands, scaffold mobile (Expo RN) with screens and Kael component using the exact image, set up SQLite schema, implement band constraints (S/R +1 only, Floor locked), add Gemini integration with fallback to manual setup, implement rank display (starts at Spark), style with deep navy/purple/red 3D theme.
  Verify (mechanical): Backend starts with `uvicorn` on port 8080, mobile starts with `npx expo start` with no errors. Can create goal via API/UI, bands are returned with correct constraints, Kael image loads from assets.
  Learner check: Open the app, create a goal and go through setup, see Today screen with Kael on the left (head-to-waist knight), try to raise S/R (should work) and try to change Floor (should be locked). Check rank shows Spark.
  Commit: `feat: first run to today with bands, rank, and Kael`

- [x] **2. Evening shutdown and nightly logging with rank penalties**
  Becomes usable: User can do evening shutdown (brain dump) to get top 3 quests, log the day as S/R/F/Nothing, and rank updates based on consecutive Nothing/unlogged days.
  Why now: Adds the daily loop and the rank penalty system (core mechanic). Unlogged days count as Nothing.
  PRD ref: `prd.md > Tonight (evening shutdown)`, `prd.md > Nightly log`, `prd.md > Ranks and badges`
  Spec ref: `spec.md > Components` (api/logs, api/ai, api/rank, rank_calc), `spec.md > Data Model`
  Build: Add Tonight screen, implement brain dump → Gemini top-3 generation with fallback, add logging API, implement rank calculation (penalty: -1 on 2 consecutive Nothing/unlogged, never below Spark; up: +2 on 3 consecutive ≥Realistic, +1 on 3 consecutive ≥Floor), track consecutive days in SQLite.
  Verify (mechanical): Can submit brain dump and get quests, can log S/R/F/Nothing, consecutive tracking works correctly, rank updates per rules.
  Learner check: Do evening shutdown, get 3 quests, log the day as Floor, check rank behavior. Simulate unlogged day by not logging and see it counts as Nothing.
  Commit: `feat: evening shutdown, nightly logging, rank penalties and promotions`

- [x] **3. Weekly check-in with evidence and Floor protection**
  Becomes usable: After 3+ nights logged, user can do weekly check-in, see evidence, get proposal, accept it. Floor is protected from user changes; system can adjust Floor on evidence (never to zero). Honest Week fires live.
  Why now: Completes the core loop with evidence-based adjustment. Proves the Floor protection and weekly cadence.
  PRD ref: `prd.md > Week (weekly check-in)`, `prd.md > Bands and the Floor`
  Spec ref: `spec.md > Components` (api/week), `spec.md > Data Model`
  Build: Add Week screen, implement week check-in logic (unlock at ≥3 nights), analyze logs, generate proposal, enforce Floor read-only to user, allow system to propose Floor adjustment (never to zero), fire Honest Week badge live.
  Verify (mechanical): With 3+ logged nights, week check-in unlocks, proposal generated, accepting updates bands/history, attempting to change Floor is blocked.
  Learner check: Log 3 nights, go to Week, see evidence and proposal, try to change Floor (should be blocked), accept proposal and see it applied.
  Commit: `feat: weekly check-in with evidence, floor protection, honest week`

- [x] **4. Reminder preview, polish UI to deep navy 3D style, and Cloud Run deployment**
  Becomes usable: Reminder preview works, UI matches deep navy/purple/red 3D style, app is deployable to Cloud Run.
  Why now: Completes all PRD features, ensures deployment target works, polishes look and feel.
  PRD ref: `prd.md > Reminder (triggerable mockup)`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Look and Feel`
  Build: Add reminder preview modal, apply deep navy theme with 3D styling (beveled edges, shadows), ensure Kael positioning is correct, create Dockerfile for backend, set up env vars (GEMINI_API_KEY, API_BASE_URL), test Cloud Run deployment flow.
  Verify (mechanical): Reminder preview shows why words and floor action, UI uses deep navy/purple/red with 3D feel, Docker builds successfully, env vars configured.
  Learner check: Trigger reminder preview, check UI colors/styling look heavy and 3D (not flashy), verify Kael is on leftmost.
  Commit: `feat: reminder preview, deep navy 3D UI, cloud run deployment setup`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 1 (first run through Today with Kael and bands)
- [ ] Final kick-the-tires exploration and feedback completed — after slice 4

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be filled during build]
Route and stops: [to be filled during build]
Edit outcome: [to be filled during build]
Reflection: [to be filled during build]
Activity mode: [to be filled during build]

## Revisions

