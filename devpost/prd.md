---
doc: prd
status: approved
---

# Ember — Product Requirements

An evening web app for busy adults who stall at night; it keeps one goal alive by splitting it into three evidence-set bands and refusing to let the floor vanish.
Sources: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

## The Core Journey
The complete path, end to end. A stranger should be able to act this out on a screen.

1. **First open.** A dark screen. A single glowing system window fades in: **"What do you want to keep alive?"** with a text box. The top bar shows the rank badge **Spark**. No dashboard, no empty tabs.
2. **Name the goal and the why.** The person types a goal (e.g. "Gym") and why it matters, in their own words. The why is saved and later quoted back in reminders.
3. **The interview.** 8–10 short questions, **one per screen**, about real capacity, what else is taking their time, and what happened to their last big plan.
4. **Band reveal.** A status window shows three glowing bars — **Stretch / Realistic / Floor** — each with a one-line reason drawn from the answers. A button enters the app.
5. **Today.** The goal with its three bands (S/R one-step raise, Floor locked), a rank badge and progress that update on rank changes, the four nightly-log buttons, and a reminder settings panel. **Sensei** appears on the left. If last night's shutdown happened, today's top 3 quests are listed.
6. **The refusal (kernel beat).** The person tries to override the bands: zero or lower the Floor, lower a band, or "I feel unstoppable, raise everything." The Floor is **read-only to the person**; Ember allows at most a **one-step raise on Stretch and Realistic**, holds the Floor, and explains why. Earning the **Held the Line** badge.
7. **Tonight (evening shutdown).** A large "data input" box takes a messy brain dump. **Plan tomorrow** returns **tomorrow's top 3**, each with a tiny first step, shown as a **Daily Quest** list. It ends on **Quest Complete** ("done for today"). Earning **Lights Out**.
8. **Nightly log.** One tap: **Stretch / Realistic / Floor / Nothing**. Ten seconds. Earning **First Kindling** on the first kept day (Floor or better).
9. **Next evening.** Ember opens on Today; yesterday's top 3 are now today's quests; the log buttons are blank for the new day.
10. **Week (weekly check-in), once 3 nights are logged.** An evidence window shows the logs, what they proved, and a **single-step** proposal. Accepting records a history line. The person cannot lower the Floor; Ember sets it on evidence. Earning **Honest Week**, live on this check-in.
11. **Reminder (triggerable mockup).** The settings panel holds a start and end time; a **Preview reminder** action pops the reminder window — quoting the person's own why words — ending **"Do the floor and it still counts,"** with a one-tap **Start the floor**. Earning **Tapped In**.

## Screens and Layout
Distinct screens, never one long page — Ember is used when tired, so each screen does one thing and nothing competes for attention.

- **First-run setup** — a registration-style sequence: one question per screen (goal + why, then the 8–10 interview questions, then the band reveal).
- **Top bar** (persistent) — Ember name; **rank badge** (Spark → Kindle → Flame → Blaze → Inferno) which updates on rank changes (penalized by two consecutive Nothing/unlogged days); three tabs: **Today**, **Tonight**, **Week**. Tapping the rank badge opens a small **Status** pop-up over the current screen (rank, progress to next rank, earned badges) — a pop-up, not a fourth screen. **Sensei** is visible on key screens covering the leftmost part of the page.
- **Today** — the goal with its three bands, where **Stretch** and **Realistic** each carry a one-step raise control and the **Floor** is visibly locked; the rank badge and rank progress display (updates on rank change); the nightly log as four glowing buttons; today's quests if last night's shutdown happened; the reminder settings panel; **+ Add goal** (present but inactive — PoC caps at one goal). **Sensei** (virtual coach, head-to-waist knight in folded-arm/sword pose) covers the leftmost part of the page.
- **Tonight** — a big "data input" box for the brain dump, a **Plan tomorrow** button, the resulting **Daily Quest** list (top 3, each with a tiny first step), and a **Quest Complete** window. **Sensei** remains visible on the left (head-to-waist knight with sword, folded arms).
- **Week** — the evaluation window: empty state before enough logs; else the check-in evidence, the proposed band change with its reason, and a history of past band changes. A **"The Floor is set by Ember — not by you."** system alert guards the Floor. **Sensei** remains visible on the left.
- **Pop-ups (over any screen)** — Reminder, Rank change, Badge earned, Status.

## Look and Feel
A darker, weightier take on the **"System"** look, in the spirit of the status windows from *Solo Leveling* and the knight designs from *Black Clover*:
- **Deep navy blue** is the primary color. Allowed window colors are **deep navy blue**, **purple**, and **red** only when necessary for a negative alert. Use these sparingly with restraint.
- **Icons and windows must have a 3D feel.** Beveled edges, inner shadows, inset bevels, and subtle depth. Favor weight over glow.
- **Calm, deliberate motion.** Short fade-ins as windows appear. Not flashy.
- **No shaming copy.** Consequences are gentle ("Rank decreased. Resume at Floor."), and the tone stays warm.
- **Sensei (Virtual Coach):** An anime figure in the style of *Solo Leveling* or *Black Clover*. Depicted as a knight with a conspicuous sword, in a folded-arm pose (or equivalent knight pose), shown from **head to waist**. **Sensei must cover the leftmost part of the page** and remain visible on key screens (Today, Tonight, Week) to offer brief, gentle guidance. He does not interrupt the core flow.
- Typography and layout should read like a heavy system interface, not a bright productivity dashboard.
Sources: `scope.md > Inspiration & Identity`, learner answers.

## Features and Behavior

### First-run setup
- One question per screen; no competing content.
- Goal name + why (own words) are captured; the why is stored for reminders.
- 8–10 interview questions cover: honest capacity (e.g. how many evenings last week had real energy), competing demands, and what happened to the last big plan. Exact wording is authored during build; themes are fixed here.
- The band reveal presents Stretch / Realistic / Floor, each with a one-line reason grounded in the answers.
- - [ ] First open shows only the "What do you want to keep alive?" window with a text box.
- - [ ] The top bar shows the Spark badge during first run.
- - [ ] Completing setup lands on Today with three bands, each carrying a visible reason.

### Bands and the Floor
- Every goal is a range: **Stretch** (high-motivation), **Realistic** (sustainable middle), **Floor** (smallest version that still counts).
- **Who can change what:** the person may raise **Stretch** or **Realistic** by **one step**; they can never lower a band, and they can never change the **Floor**. Ember alone may adjust the Floor — during setup or a weekly check-in, one step at a time, and never to zero.
- The Floor never scales to zero.
- **Refusal behavior:** an attempt to zero or lower the Floor, or to lower any band, is blocked with a plain-language reason. On "raise everything," Ember applies at most a one-step raise to Stretch and Realistic and holds the Floor.
- - [ ] Attempting to set Floor to 0 leaves the Floor unchanged and shows a plain-language reason.
- - [ ] Attempting to lower Stretch or Realistic is blocked.
- - [ ] "Raise everything" raises Stretch and Realistic by at most one step each; the Floor is unchanged.
- - [ ] The person can raise Stretch and Realistic by one step; the Floor has no user control.
- - [ ] Accepting the limit awards **Held the Line**.

### Today
- Shows the goal and its three bands with reasons; Stretch and Realistic each carry a one-step raise control, and the Floor is visibly locked.
- Shows a rank badge and progress that update on rank changes (two consecutive **Nothing** days or **unlogged days count as Nothing** lower rank by one; cannot go below Spark).
- Four nightly-log buttons: Stretch / Realistic / Floor / Nothing. Blank each new day; yesterday's answer stays in history but is not pre-selected.
- Shows today's quests when last night's shutdown was completed.
- Shows the reminder settings panel (start/end time; visual/static) and **Preview reminder**.
- **+ Add goal** is present but inactive; PoC allows a maximum of **one** goal.
- - [ ] Stretch and Realistic can each be raised one step; neither can be lowered; the Floor cannot be changed by the person.
- - [ ] On a new day, no log button is pre-selected.
- - [ ] If last night's shutdown was skipped, Today shows no quests and points to Tonight.
- - [ ] With one goal registered, no second goal can be added.

### Tonight (evening shutdown)
- A large free-text "data input" box for the brain dump (deadlines, "what do I eat," "plan tomorrow").
- **Plan tomorrow** returns tomorrow's **top 3**, each with a tiny first step, as a **Daily Quest** list.
- Ends on a **Quest Complete** window meaning "done for today."
- The brain dump and top 3 persist and drive the next day.
- - [ ] A messy dump yields exactly three quests, each with one visible tiny first step.
- - [ ] Completing the shutdown shows Quest Complete and awards **Lights Out**.
- - [ ] The three quests appear on Today the next evening.

### Nightly log
- One tap among Stretch / Realistic / Floor / Nothing.
- Logging a kept day (Floor or better) on the first occasion awards **First Kindling**.
- Logs are stored and feed the Week evidence.
- - [ ] One tap records the result and is reflected in history.
- - [ ] The first kept day awards First Kindling.

### Week (weekly check-in)
- **Unlocks at 3 nights logged.** Before that, an empty evaluation window says **"Begin your journey to view your conquests."**, shows a progress bar (0 of 3 nights, filling as logs arrive), the goal's current bands (unchanged), one **Log tonight** button that jumps to Today, and a faded example card of what will appear later.
- Once unlocked, the check-in shows the evidence (in the demo, seven preloaded logs: 1 Stretch, 1 Realistic, 5 Floor, 0 Nothing) and states what they prove, e.g.: **"You hit Stretch on 1 of 7 nights, and Realistic or better on 2. You met your Floor all 7 nights. Proposal: lower Stretch from 5 to 4 a week."**
- The proposal is a **single step**; the Floor is never touched when it held; no overcorrection. Ember may propose a one-step Floor adjustment only when the evidence requires it, and never to zero.
- Accepting writes a history line, e.g.: **"Stretch 5 → 4 a week. Hit Stretch on 1 of 7 nights; Floor met all 7."**
- Any attempt by the person to change the Floor shows **"The Floor is set by Ember — not by you."**
- Completing the check-in awards **Honest Week**, firing live on the seeded check-in.
- - [ ] Before 3 nights, the empty state appears with the 0-of-3 progress bar and a working Log tonight button.
- - [ ] With the seeded week, the evidence text and single-step proposal match the logs.
- - [ ] Accepting writes the history line; the Floor is unchanged.
- - [ ] Attempting to lower the Floor is blocked with the system alert.

### Ranks and badges
- **Rank system is active in a minimal form for the PoC.** Ranks: **Spark → Kindle → Flame → Blaze → Inferno**.
- **Rank penalty:** **Two consecutive Nothing days** or **unlogged days count as Nothing** lower the rank by one level; the rank cannot go below **Spark**.
- **Rank display:** The rank badge shows the current rank (starting at **Spark**). A rank-progress display is shown; it updates on rank changes.
- **Badges fire live when earned in-session:** First Kindling (first kept day), Lights Out (first completed shutdown), Held the Line (accepted refusal), Tapped In (started the Floor from a reminder), Honest Week (completed a check-in).
- **Rage** (Stretch for 7+ consecutive days) is a **present-but-inactive placeholder** — it needs a real streak.
- Badge shelf is visible (via the Status pop-up), with locked states for unearned/inactive badges.
- - [ ] Two consecutive Nothing days (including unlogged days) lower the rank by one level.
- - [ ] Rank does not go below Spark.
- - [ ] Rank badge updates on rank change.
- - [ ] In-session badges unlock with a brief window when earned.
- - [ ] Rage remains inactive in the PoC.

### Reminder (triggerable mockup)
- The settings panel on Today presents a start and end time (visual/static — no real scheduler).
- **Preview reminder** pops the reminder window anywhere in the app: it quotes the person's own why words and ends **"Do the floor and it still counts,"** with a one-tap **Start the floor** for that goal's smallest task.
- Acting on it records the action and awards **Tapped In**.
- No OS notifications in the PoC; no real per-evening timer.
- - [ ] Preview reminder shows the window with the person's own why words and the floor call-to-action.
- - [ ] One-tap Start the floor opens the smallest task and awards Tapped In.

## States and Boundaries

- **First use (no goal):** only the "What do you want to keep alive?" window; rank badge Spark.
- **Return (persistence):** goal and current bands, current rank display and progress, every nightly log and weekly check-in, last night's brain dump and top 3, earned badges, and reminder settings all persist. Opens on Today.
- **New day:** log buttons blank; yesterday's answer in history but not pre-selected.
- **Skipped shutdown:** Today has no quests and points the user to Tonight.
- **Week empty state:** "Begin your journey to view your conquests.", 0-of-3 progress bar, unchanged bands, Log tonight button, faded example card.
- **AI failure:** a calm retry is offered. If it fails again, the user may **retry** or continue with a simple manual setup: they set Stretch and Realistic, and Ember assigns a safe Floor.
- **Reminder limit (mockup):** a reminder appears only via Preview while the tab is open; the "one per evening, none if logged" rule is not enforced in the PoC.
- **Rank active:** badge and progress update on rank changes (two consecutive **Nothing** days or **unlogged days count as Nothing** lower rank by one; cannot go below Spark).
- **Single goal:** a second goal cannot be added.

## Product Decisions
- **One goal for the PoC** (max 1) — keeps the loop focused; multi-goal deferred.
- **Bands move on evidence at the weekly check-in** (minimum 3 nights); the person may raise **Stretch** or **Realistic** by one step, but never lower them. The **Floor is read-only to the person**; Ember alone may adjust the Floor, one step at setup or a weekly check-in, and never to zero.
- **Honest Week fires live on the seeded check-in.**
- **Demo seeds seven nights of logs** (1 Stretch, 1 Realistic, 5 Floor) so a band can visibly move in a minute without faking the reasoning.
- **In-session badges fire; ranks are active with a minimal penalty rule** (two consecutive **Nothing** days or **unlogged days count as Nothing** lower rank by one; cannot go below Spark). **Rage stays inactive.**
- **Reminder kept as a triggerable mockup** — preserves the founding story and Tapped In without a real scheduler.
- **AI failure ladder: calm retry → retry or simple setup with Stretch/Realistic and a system-assigned Floor** — keeps the user in control when the model misbehaves.
- **No red alarms or shaming copy** — consequences are gentle and point back to the smallest next step.
- **Distinct screens, one action each** — Ember is used when tired.
- **Virtual coach:** **Sensei** appears on key screens (Today, Tonight, Week), head-to-waist, knight in a folded-arm pose with a conspicuous sword, covering the **leftmost part of the page**.
- **Storage:** a **Python server with SQLite**.
- **Look:** deep navy blue primary; windows/icons use deep navy, purple, and red only for negative alerts; **3D feel** for icons and windows.

## What We're Building
- First-run: goal + why, 8–10 question interview, band reveal with reasons.
- Bands + Floor protection (person raises only Stretch/Realistic one step; Floor read-only; Ember alone may adjust Floor; refusal explained).
- Today: bands with one-step raise on Stretch/Realistic and locked Floor, rank badge/progress that update on rank changes, four log buttons, quests, reminder panel, inactive Add goal, **Sensei** on the left (head-to-waist knight with sword, folded arms).
- Tonight: brain dump → top 3 with tiny first steps → Quest Complete, **Sensei** on the left.
- Nightly log (one tap) with history (**unlogged days count as Nothing**).
- Week: 0-of-3 empty state; evidence + single-step proposal + history; Floor is set by Ember, not the person, **Sensei** on the left.
- In-session badges (First Kindling, Lights Out, Held the Line, Tapped In, Honest Week) + locked shelf.
- Triggerable reminder mockup with why words + one-tap floor start.
- Local persistence of the full state above.

## Deferred From the POC
- **Multi-goal** — one goal proves the kernel; the shorter add-goal interview comes later.
- **Real reminder scheduling / OS notifications** — a mockup trigger shows the moment; a scheduler is plumbing.
- **Extended rank engine** — thresholds 3/10/25/50 and additional rank mechanics. Designed, not built; the minimal penalty is implemented.
- **Rage badge and streak tracking** — needs real consecutive-day history.
- **Passive day-sensing / integrations** — contradicts "you tell it, it learns."

## Possible Later Enhancements
- Real time-window reminders and OS notifications.
- Full rank/XP engine with gentle rank changes.
- Multi-goal with per-goal bands.
- Streaks and band-drift analytics.
- Calendar/health integrations to enrich evidence.

## Non-Goals
- **No accounts, multi-user, or sync** — single local person.
- **No native mobile app** — a local web app proves the idea.
- **No passive/surveillance-style tracking** — the person tells Ember.
- **No shaming, red alarms, or punitive copy** — ever.
- **No multi-goal in the PoC.**
- **User control of the Floor** — the Floor is Ember's to set, never the person's.

## Open Questions
- Exact wording of the 8–10 interview questions — author during build; themes fixed above. *(Can wait.)*
- **User band-raise control:** one-step raise controls on Today's **Stretch** and **Realistic** rows; the **Floor** is visibly locked. *Assumption to confirm.*
- **Ember's Floor changes:** only at setup or a weekly check-in, one step, never to zero. *Assumption to confirm.*
- **Rank thresholds** for Spark→Kindle→Flame→Blaze→Inferno beyond the fixed penalty — exact values. *Assumption to confirm.*
- **Sensei placement:** exact vertical position so it doesn't obscure content on the leftmost part of the page. *Assumption to confirm.*
