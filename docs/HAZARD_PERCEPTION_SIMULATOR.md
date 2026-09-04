# Hazard Perception Simulator — full build plan

Everything needed to build the feature: how it works, the data model, scoring, playback,
API, web, mobile, admin, import, testing, delivery order — plus a plain-language ticket
set for the project tool at the end.

Status: **planned, not started.** The sections below are the reference for the build.

---

## 1. Context

Every state's Driving Test page already lists "hazard perception simulators" as premium
videos (component `DrivingVideosSection.tsx`, section label
`"Defensive Driving Hazard Simulators"`). Today, opening one just plays the Vimeo clip in
a popup dialog.

The source content behind each clip is far richer. Each simulator in `simulators.json`
carries a full hazard definition: per-hazard category, a start/end moment in the clip,
the play order, which hazards are "tutorial" hazards, an on-screen hint, spoken
narration (an MP3 URL), and a feedback message. The current importer
(`ImportSimulatorsFromCrawl.php`) deliberately imports only the flat video and leaves
"the per-hazard interactive layer" as future work (see `docs/PHASE_3_CONTENT_PLATFORM.md`
item 5, and `apps/api/docs/ARCHITECTURE.md` "Media").

This task builds that layer: the clip pauses to teach the first few hazards, then the
learner spots the rest under a timer and gets a Hazard Score broken into hazards spotted,
reaction speed, and false clicks — with review-missed-hazards and try-again. Web and
phone app, plus staff admin.

### Scope assumptions (confirmed)

- Covers the whole feature — website, phone app, staff admin, data import — as one task
  with five subtasks.
- The hazard indicator is a **simple highlighted area** shown over the hazard for its
  time window. A frame-by-frame outline that tracks the moving object is a **later
  enhancement**, not this build (`hazard_frames` table below is defined but left empty).
- Playback uses the **embedded Vimeo player driven by the Vimeo Player SDK** (for
  `currentTime` / `pause` / `ended`). Self-hosting the clips on our own streaming store is
  a later enhancement.
- Access follows the current premium rule (`Feature::Videos`); non-subscribers get the
  upgrade prompt; guests may play and keep their result if they sign up after.

---

## 2. How the exercise works

Confirmed by playing a screen recording frame by frame against
`AL Defensive Driving Hazard Simulator 1` (`sim_id 2858`, Vimeo `475031029`, 2:15,
"Hard", Los Angeles).

**Run flow**

1. **Intro card** — difficulty + duration chips, hazard categories (Vehicles /
   Pedestrians / Signs / Road marks), *Start Simulator*, and two toggles: *Sound on* and
   *Show first N hazards in tutorial with hints*.
2. **Countdown** — 3 · 2 · 1 over the first frame.
3. **Demo phase** — for the tutorial hazards (`mode: "demo"`), a highlighted area is
   drawn over the hazard for its window; on a hit (or when the window passes) the video
   auto-pauses and a card shows the feedback message (`comment`) with narration
   (`audio_url`); *Continue* resumes.
4. **Hand-off card** — "Now it's your turn. The hazards will no longer be highlighted."
5. **Assessment phase** — the same clip continues, no highlights. The learner
   clicks/taps hazards as they develop. HUD shows a progress pill (dots fill in) and an
   *N REMAINING* counter plus a timer. A correct click still pops the feedback card.
   Pause/resume via Space or click.
6. **Results** — a single *Hazard Score* %, three tiles (*Hazards spotted X/Y*,
   *Reaction speed NNNN ms* + Fast/Average/Slow band, *False clicks NN*), a *Review N
   missed hazards* button that seeks the player to each missed window, and *Try Again*.

**Two observed runs, for calibration:** `3/6` spotted · 424 ms (Fast) · 15 false clicks
→ **36%**; and `5/6` spotted · 1497 ms (Average) · 22 false clicks → **55%**. Detection
accuracy clearly dominates the formula.

**What a "hazard" is:** a time-boxed event that would make a real driver change speed or
direction. Each has a window (`time_start` → `time_end`); a click inside the window
counts, and how early in the window sets the reaction score. Clicks outside every window
are false clicks.

---

## 3. The source data, decoded

Each simulator in `simulators.json` has three layers. The importer today reads only the
first.

| Layer | Keys | Meaning | Today |
|---|---|---|---|
| Clip metadata | `title`, `url`, `vimeo_id`, `vimeo_embed_url`, `sim_id`, `page_id`, `test_level`, `test_length`, `test_location`, `test_number` | The watchable video and its framing. | Imported |
| Hazard pool | `hazards[]` — `id`, `type`, `group`, `time_start`, `time_end`, `frame_count`, `comment`, `audio_url`, `mode` | Every tagged event in the clip (11 in Sim 1). `type` ∈ sign / pedestrian / vehicle. `mode` ∈ demo / assessment. `group` ties clustered hazards that fire together. `comment` is the feedback text; `audio_url` the narration MP3. | Ignored |
| Scored sequence | `timeline[]` — `hazard_id`, `mode`, `group` | The subset that actually counts (9 entries for Sim 1 = `hazard_count`), one representative hazard per group, in play order. | Ignored |

**`frame_count` has no coordinates in the file.** Each hazard states how many
bounding-box keyframes exist (13, 19, 14 …) — the data to draw a *moving* outline — but
the geometry itself is not in the JSON. This is why the moving box is out of scope now;
the build uses a single static highlighted region per hazard.

**Data-quality quirks to expect — log, do not fail the import:**

- **Counts disagree.** Sim 1 has `hazard_count: 9` but 11 `hazards[]`;
  `demo_hazard_count: 3` but only 2 rows with `mode: "demo"` in the timeline. Trust
  `count(timeline)` for the scored total and `mode` per row; surface the mismatch as a
  warning for staff — the same posture the existing importer takes with junk section
  titles.
- **Pool ≠ timeline.** `hazards[]` ids 7 and 56 are not in `timeline[]`. Import the whole
  pool, flag which rows are `in_timeline`.
- **Groups mix modes.** Group 1 contains a `demo` (id 5) and an `assessment` (id 7)
  hazard; the timeline lists the group once via its representative id.

---

## 4. What already exists — reuse, don't rebuild

| Area | Existing artifact | Reuse as |
|---|---|---|
| Catalog row | `videos` table · `Video` model | Stays the catalog + teaser entity. Simulator rows already imported with `section = "Defensive Driving Hazard Simulators"`, `external_url` = Vimeo embed, real thumbnail via oEmbed, `is_premium = true`. |
| Import | `Actions/Content/ImportSimulatorsFromCrawl.php` | Extend it — it already upserts the `Video` and defers the interactive layer. |
| Import command | `Console/Commands/ImportContent.php` | `--only=simulators` already routes `simulators.json`; only add an optional `--skip-hazards`. |
| Gating | `VideoPolicy` · `Feature::Videos` · `EntitlementResolver` | Model `HazardSimulatorPolicy` on it 1:1 (`view` = active, `attempt` = active && (!premium || hasFeature(Videos))). |
| Locked teaser | `Public\VideoResource` · `VideoShowResponse` · `PremiumDialog` | Same `locked` boolean + teaser-only fields; same upsell dialog. |
| Attempts | `quiz_attempts` · `quiz_attempt_answers` · `GradeQuizAttempt` · `guest_token` claim-on-register | Template for `hazard_simulator_attempts` + `…_attempt_events` + `GradeHazardAttempt`. Persist `passed` at grade time, never derive on read. |
| Attempt history | `GET /v1/attempts` · `DELETE /v1/attempts` (reset all) · `QuizAttemptController` | Add hazard attempts to both. |
| Admin CRUD | `Admin\VideoController` + `app/admin/videos/*` · `QuizQuestionController` nested routes | Pattern for `Admin\HazardSimulatorController` + nested `hazards` CRUD/reorder. |
| Web entry point | `components/state/DrivingVideosSection.tsx` (in `DrivingTestContent.tsx` + `motorcycle/DrivingTestContent.tsx`) | Currently opens a Vimeo iframe dialog. Re-point cards that have a simulator to a full-screen player route. |
| Browse page | `app/exam-simulator/page.tsx` | Copy for `app/hazard-simulator/page.tsx`. |
| Card UI | `components/state/StepCard.tsx` (`cardType="hazards"` already exists) | Reuse for simulator cards. |
| Slug | `Actions/Quiz/GenerateUniqueSlug.php` | Reuse for simulator slugs. |
| Duration parse | `Support/DurationParser.php` (`"2:15 min"`) | Reuse. |
| Import summary | `Support/ImportSummary.php` (`increment` / `warn`) | Reuse for data-quality warnings. |
| Media rule | `apps/api/docs/ARCHITECTURE.md` "Media" | Video/audio bypass Spatie Media Library — external URL now, streaming store later. Narration MP3s follow the same rule. |
| Mobile | `app/test/quiz/[id].tsx` · `app/test/results/[id].tsx` · `store/lastAttemptStore.ts` · `store/planStore.ts` | Templates for the mobile player, results, and gating. |

---

## 5. Target data model

Five additive migrations plus two enums. Additive-only policy (post-launch). FKs follow
the repo's `restrictOnDelete` / `cascadeOnDelete` conventions.

### `hazard_simulators` — the interactive layer, 1:1 with a video

| Column | Type | Notes |
|---|---|---|
| `video_id` | FK videos, cascade, unique | Carries title / thumbnail / duration / premium / state / vehicle / section. |
| `sim_id` | uint, nullable, unique | Source `sim_id` — idempotent re-import key + traceability. |
| `page_id` | uint, nullable | Source `page_id`. |
| `provider` | string, default `vimeo` | `vimeo` · `mux` · `cloudflare` · `file` — lets playback swap with no data migration. |
| `provider_video_id` | string | e.g. `475031029`. |
| `test_level`, `test_location`, `test_number` | string, nullable | "Hard" · "Los Angeles, CA" · "1". |
| `hazard_count` | uint | Scored count = `count(timeline)`. |
| `demo_hazard_count` | uint, default 0 | From source; reconciled against actual `mode=demo` rows. |
| `pass_threshold_percent` | utinyint, nullable | Product value (source has none). Nullable = score-only, no pass/fail shown. |
| `scoring_profile` | string, default `standard` | Names a weights/bands set in `config/hazard.php` so tuning isn't a code rewrite. |
| `is_active` | bool, default true | |

### `hazards` — one row per `hazards[]` entry (full pool, not just the timeline)

| Column | Type | Notes |
|---|---|---|
| `hazard_simulator_id` | FK, cascade | |
| `source_hazard_id` | uint | Source `id`. Unique with `hazard_simulator_id`. |
| `type_raw` | string | Verbatim source `type` (`sign`/`pedestrian`/`vehicle`). |
| `type` | enum (HazardType) | Normalized: `sign` · `pedestrian` · `vehicle` · `signal` · `road_mark`. |
| `hazard_group` | uint, nullable | Source `group` — clustered hazards. |
| `mode` | string | `demo` · `assessment`. |
| `in_timeline` | bool | Part of the scored `timeline[]`. |
| `sort_order` | uint, nullable | Position within the timeline; null for pool-only hazards. |
| `time_start`, `time_end` | decimal(7,3) | Seconds. Window for hit detection + reaction scoring. |
| `frame_count` | uint, default 0 | Keyframe count (see `hazard_frames`). |
| `box` | json, nullable | Static highlighted region `{x,y,w,h}` normalized 0–1. This is what the player uses. |
| `comment` | text | Feedback card copy. |
| `audio_url` / `audio_disk` / `audio_path` | string, nullable | Narration MP3 — external now, re-hostable later. |

### `hazard_frames` — per-keyframe polygon, defined but NOT populated in this build

| Column | Type | Notes |
|---|---|---|
| `hazard_id` | FK, cascade | |
| `t` | decimal(7,3) | Keyframe timestamp (seconds). |
| `box` | json | `{x,y,w,h}` or `points:[[x,y]…]`, normalized 0–1. |
| `sort_order` | uint | |

Left empty now. Populated only if a future task locates the per-frame geometry, at which
point the player upgrades from the static `hazards.box` to interpolated keyframes.

### `hazard_simulator_attempts` — mirrors `quiz_attempts`

| Column | Type | Notes |
|---|---|---|
| `user_id` | FK users, nullable, nullOnDelete | |
| `guest_token` | string(64), nullable | Anonymous attempts, claimable on register — same as quizzes. |
| `hazard_simulator_id` | FK, restrictOnDelete | Don't erase history when a sim is deleted. |
| `status` | enum (HazardAttemptStatus) | `in_progress` · `completed` · `abandoned`. |
| `score` | utinyint, nullable | 0–100 composite Hazard Score. |
| `passed` | bool, nullable | Persisted at grade time vs the threshold then in effect. Null = not applicable. |
| `hazards_spotted` / `hazards_total` | uint | `hazards_total` snapshotted at attempt time. |
| `avg_reaction_ms` | uint, nullable | |
| `reaction_band` | string, nullable | `fast` · `average` · `slow` (thresholds in config). |
| `false_clicks` | uint, default 0 | |
| `started_at` / `completed_at` / `duration_seconds` | timestamp / uint | |

### `hazard_simulator_attempt_events` — per click / resolution, mirrors `quiz_attempt_answers`

| Column | Type | Notes |
|---|---|---|
| `hazard_simulator_attempt_id` | FK, cascade | |
| `hazard_id` | FK, nullable, nullOnDelete | Null = a false click that hit no hazard window. |
| `kind` | string | `hit` · `miss` · `false_click`. |
| `clicked_at_video_ms` | uint, nullable | Player `currentTime` at the click. |
| `reaction_ms` | uint, nullable | `clicked − time_start·1000`, clamped to the window. Hits only. |
| `pointer_x` / `pointer_y` | decimal(6,4), nullable | Normalized click coords — QA heatmap + anti-cheat. |

### Enums

- `App\Enums\HazardAttemptStatus` — `InProgress` / `Completed` / `Abandoned` (mirror
  `AttemptStatus`).
- `App\Enums\HazardType` — normalized hazard categories, with a `label()` for the UI chip.

No new `Feature` enum case — `Feature::Videos` already reads as "every instructional video
and hazard simulator" in the live upsell copy. Add `Feature::HazardSimulator` only if
pricing later splits them.

### Models

`HazardSimulator`, `Hazard`, `HazardFrame`, `HazardSimulatorAttempt`,
`HazardSimulatorAttemptEvent`, plus `Video::hazardSimulator()` hasOne. Factories for each.

---

## 6. Scoring model

**Server-authoritative.** The client submits the raw event log; a `GradeHazardAttempt`
action computes the score in a DB transaction. Never trust a client number — same rule as
`GradeQuizAttempt`.

**Components**

- **Detection** — `hazards_spotted / hazards_total` over assessment + `in_timeline`
  hazards. Demo hazards are auto-credited, not scored.
- **Reaction** — per hit, `r = clamp(clicked_ms − start_ms, 0, window_ms)`;
  `reactionScore = mean(1 − r/window_ms)`. Band from `avg_reaction_ms`: `fast < 700`,
  `average < 1500`, else `slow` — seeded from the observed 424 ms = "Fast" / 1497 ms =
  "Average" points.
- **False-click penalty** — `penalty = min(false_clicks · k, cap)`, start `k = 0.02`,
  `cap = 0.30`.
- **Composite** — `score = round(100 · (w1·detection + w2·reactionScore) · (1 − penalty))`,
  start `w1 = 0.7`, `w2 = 0.3`.

**Calibration.** Weights, bands, `k`, `cap` live in `config/hazard.php` keyed by
`scoring_profile`, so staff can tune without a release. Fit them against the two observed
runs plus real early attempts. Our number will not (and need not) match
driving-tests.org's proprietary formula — we define and document our own.

**Anti-cheat guard** (all thresholds config-driven)

- Ignore clicks within ~250 ms of the previous one.
- Cap total counted clicks (e.g. `2 × hazard_count`).
- Detect metronomic spacing → void that hazard's credit.

---

## 7. Playback & overlay approach

**Chosen: Vimeo Player SDK** (`@vimeo/player`, UMD build) over the imported
`external_url`. Gives `getCurrentTime()`, `play()`, `pause()`, `ended`. A transparent
overlay `div`/`canvas` absolutely positioned over the iframe captures clicks and draws
the static highlighted region from `hazards.box`. Pause-on-hazard = call `.pause()` when
`getCurrentTime()` crosses a demo window.

- `timeupdate` fires ~4 Hz — fine for multi-second hazard windows. The highlight is a
  static rectangle for the window, so no frame interpolation is needed in this build.
- The `provider` / `provider_video_id` columns mean a later switch to self-hosted HLS
  (Mux / Cloudflare Stream + native `<video>` + `requestVideoFrameCallback`) is a config
  change, not a schema migration.

Mobile uses `expo-video` (or a Vimeo iframe wrapper) with a `Pressable` overlay and a
Reanimated highlight — same manifest.

---

## 8. API surface

New dedicated resource under `/v1` (cleaner than overloading `/videos`). Guests may
browse and attempt, exactly like quizzes and videos.

**Public**

- `GET /v1/hazard-simulators` — list; filters `state`, `vehicle_type`, `test_track`,
  `test_level`. Teaser fields + `locked`.
- `GET /v1/hazard-simulators/{slug}` — teaser + `locked`. When unlocked, adds a
  **playback manifest**: `provider`, `provider_video_id`, demo hazards *in full* (they're
  taught), and for assessment hazards *only the count* — timings, comments and boxes are
  the answer key and stay server-side (see Decision D1).
- `POST /v1/hazard-simulators/{slug}/attempts/start` — opens an `in_progress` attempt
  (guest or auth), `throttle:60,1`.
- `POST /v1/hazard-simulators/{slug}/attempts/{attempt}` — submit the event log
  `[{video_ms, x, y}]` + `duration_seconds`; server grades and returns the full
  per-hazard breakdown (spotted / missed, your reaction, the ideal window, the `comment`,
  seek offsets for "Review missed hazards"). `throttle:60,1`.

**Authenticated (`verified` group)**

- `GET /v1/hazard-attempts` — my history, mirrors `/attempts`.
- Fold hazard attempts into `DELETE /v1/attempts` ("Reset All Results").

**Admin (`admin` group)**

- `apiResource('hazard-simulators')` + `GET` show — CRUD, mirrors `Admin\VideoController`.
- Nested `hazards` — index / store / update / destroy / reorder, mirrors
  `QuizQuestionController`.
- `GET /v1/admin/hazard-simulator-attempts` — QA + analytics list, mirrors
  `Admin\AttemptController`.

**Resources & policy**

- `Public\HazardSimulatorResource` (teaser + gated manifest) ·
  `Admin\HazardSimulatorResource` (full) · `HazardResource` ·
  `HazardSimulatorAttemptResource`.
- `HazardSimulatorPolicy` — `view` / `attempt`, backed by `EntitlementResolver` +
  `Feature::Videos`.
- `StoreHazardAttemptRequest` — validates the event-log shape.

---

## 9. Import pipeline changes

Extend `ImportSimulatorsFromCrawl` — it keeps creating the `Video`, then:

1. Upsert `HazardSimulator` keyed by `sim_id` (fallback `video_id`).
2. Upsert `hazards` keyed by `(hazard_simulator_id, source_hazard_id)` from
   `row.hazards`; map `type_raw → type`; carry `audio_url`.
3. Set `in_timeline` + `sort_order` from `row.timeline` (match on `hazard_id`).
4. `box`: no source geometry — leave null (player falls back to a centered default marker
   or a generic "somewhere ahead" cue), or let staff set it later in admin. `hazard_frames`
   not touched.
5. Narration MP3s stay as external `audio_url` (Media-Library bypass rule).

**Data-quality warnings** via `ImportSummary::warn()` (log, never fail): `hazard_count ≠
count(timeline)`; `demo_hazard_count ≠ count(mode=demo)`; timeline `hazard_id` not in
`hazards[]`; `time_end ≤ time_start`; cross-group window overlap.

`content:import … --only=simulators` already routes the file. Add `--skip-hazards` as an
escape hatch. CDL stays deferred. Backfill across all states is a rerun, not new code.

---

## 10. Web build

**Before writing any Next.js code:** `apps/web/AGENTS.md` says this is a modified
Next.js — read the relevant guide in `node_modules/next/dist/docs/` first. Applies to
every web piece.

**Routes**

- `app/hazard-simulator/[slug]/page.tsx` — full-screen player.
- `app/hazard-simulator/page.tsx` — browse index, copied from
  `app/exam-simulator/page.tsx`.

**Components — `components/hazard/`**

- `HazardSimulatorIntro` — difficulty/duration chips, category chips, Start, "Sound" +
  "Show first N in tutorial" toggles.
- `HazardPlayer` — Vimeo SDK wrapper, overlay canvas, click capture + hit-test
  (normalized coords ↔ window/box), HUD (progress pill, *N REMAINING*, timer), 3-2-1
  countdown, static highlighted region during a hazard window.
- `HazardFeedbackCard` — pause-and-explain card: type chip, `comment`, narration audio,
  Continue.
- `HazardHandoff` — "Now it's your turn…" transition.
- `HazardResults` — Hazard Score %, three stat tiles, "Review N missed hazards" (seeks
  player per missed window), "Try Again".

**Wiring**

- `DrivingVideosSection.tsx` — add `has_simulator` + `simulator_slug` to `PublicVideo`;
  cards in the "Defensive Driving Hazard Simulators" section route to
  `/hazard-simulator/{slug}` instead of the iframe dialog.
- Reuse `PremiumDialog` on `locked`.
- Shared types: `packages/shared/src/types/hazard-simulators.ts` (+ export in `index.ts`).
- a11y: Space = pause; a "mark hazard" key using last pointer position; captions from
  `comment`; `prefers-reduced-motion` disables the highlight pulse; visible focus rings.

---

## 11. Mobile build

Parity — same API and manifest.

- `apps/mobile/app/hazard-simulator/[id].tsx` + results screen (mirror
  `app/test/results/[id].tsx`).
- `apps/mobile/lib/hazardSimulators.ts` + `store/lastHazardAttemptStore.ts` (mirror
  `lastAttemptStore`).
- `expo-video` (or Vimeo iframe wrapper) + `Pressable` overlay + Reanimated highlight.
- Gate via the existing `planStore` / premium screen.

---

## 12. Stats & analytics

- Extend `GET /v1/me/stats` — hazard attempts, average score, best.
- Extend `Public\StateController@stats` — include hazard attempts in state activity
  figures.
- Admin dashboard tiles — simulators, attempts, average score.
- Per-hazard spot-rate report — which hazards nobody catches (content-QA signal for bad
  windows or mislabeled types).

---

## 13. Testing

- **API**: import (fixture `simulators.json` including the Sim-1 quirks → simulator +
  hazards + timeline flags + data-quality warnings); scoring (table-driven against the two
  observed runs); gating (guest / free / premium); guest attempt then claim-on-register;
  "reset all results" includes hazard attempts.
- **Web**: player state machine (intro → countdown → demo pause → handoff → assessment →
  results); overlay hit-test math (normalized coords ↔ window); locked → `PremiumDialog`.
- **E2E**: full run to results, guest and premium.

---

## 14. Delivery sequence

1. **Data + import** — migrations / models / enums, then extend the importer. Data-only,
   ships dark.
2. **Read API + gating** — teaser + manifest + policy.
3. **Attempts + scoring** — start/submit endpoints + `GradeHazardAttempt` +
   `config/hazard.php` + calibration.
4. **Shared types** — parallel, after step 1.
5. **Web player + results + entry points** — the player, results, wire into
   `DrivingVideosSection`, browse page.
6. **Admin** — simulator CRUD + nested hazards + attempts QA list.
7. **Mobile parity**.
8. **Stats + analytics**.
9. **Calibration + content backfill + E2E** — import all states, tune scoring on real
   data, review per-hazard spot-rates.

---

## 15. Decisions

**Resolved**

- **D2 Playback** → Vimeo Player SDK now; self-hosted streaming later (schema already
  allows the swap).
- **D3 Highlight geometry** → static highlighted region per hazard now; frame-by-frame
  tracking is a later enhancement (`hazard_frames` defined, unused).

**Recommended (confirm before the matching step)**

- **D1 Answer-key integrity** — send demo hazards in full, assessment hazards as a count
  only, grade entirely server-side. *Recommend: yes.*
- **D4 Premium gate** — reuse `Feature::Videos` rather than a new case. *Recommend: reuse.*
- **D5 Scoring formula** — adopt Section 6 as the starting point, calibrate against the
  two observed runs + early real attempts, PM sign-off on the final numbers.
- **D6 Pass/fail** — score only in the UI; keep `passed` computed and stored, hidden, so
  a threshold can surface later without a backfill. *Recommend: score-only.*
- **D7 Guest attempts** — allow, claim on register via `guest_token`. *Recommend: yes.*

---

## 16. Ticket set for the project tool

Plain-language, no code references. One main task, five subtasks. Title / Description /
Acceptance criteria.

### Main task

**Title:** Hazard Perception Simulator

**Description:**
Add an interactive hazard-perception exercise on top of the existing hazard-simulator
video clips. A learner starts a simulator, watches a short guided walkthrough where the
first few hazards are highlighted and explained, then plays the rest of the clip and
taps/clicks each hazard as it develops. At the end they get a Hazard Score with a
breakdown (hazards spotted, reaction speed, false clicks), can replay the ones they
missed, and can try again. Attempts are saved to their history and count toward their
progress. Available on web and the phone app. Staff can manage each simulator's hazards
and review results. Delivered as the five subtasks below.

**Acceptance criteria:**
- A learner can run any hazard-perception simulator end to end on web and on the phone
  app and receive a score.
- Everything the reference exercise does is present: guided intro, countdown, highlighted
  tutorial hazards with narration, "your turn" handoff, live remaining-hazards counter,
  pause/resume, results breakdown, review-missed-hazards, try again.
- Access follows the current premium rule; non-subscribers get the upgrade prompt; guests
  can play and keep their result if they later create an account.
- Attempts appear in the learner's results history and progress figures, and are cleared
  by "reset all results".
- Staff can view and adjust a simulator's hazards and see attempt results.
- All simulators across every state that has this content are loaded with their full
  hazard data.

### Subtask 1 — Load the full hazard data for every simulator

**Description:**
Today only the video clip and its basic details are brought in from the source content.
Extend the import so each simulator also gets its complete hazard list: every hazard's
category, its start and end moment in the clip, the order hazards occur, which ones are
tutorial hazards, the on-screen hint text, the spoken narration, and the feedback message
shown when the learner spots it. The import must be safe to re-run and must cope with the
source data's known inconsistencies — for example a stated hazard count that doesn't
match the actual list, or a tutorial-hazard count that doesn't match the hazards actually
marked as tutorial — by loading what's there and flagging the mismatch for staff rather
than failing.

**Acceptance criteria:**
- After import, every simulator has its ordered list of hazards with category, timing,
  tutorial flag, hint text, narration, and feedback message.
- Hazards that exist in the source but aren't part of the scored sequence are still
  stored, marked as not scored.
- Re-running the import updates existing simulators without creating duplicates and
  without wiping attempt history.
- Source inconsistencies (mismatched counts, an out-of-sequence hazard, a zero-length
  hazard window) are listed in the import report for staff to review; the import still
  completes.
- The import can be run for every state that has this content, not just a sample.

### Subtask 2 — Simulator playback: guided walkthrough then scored round

**Description:**
Build the player screen on web and the phone app. Flow: a start screen showing
difficulty, length, and the hazard categories, with toggles for sound and for whether the
first few hazards are shown with hints; a 3-2-1 countdown; then the clip plays. During
the guided phase, each tutorial hazard is highlighted for its time window; when the
learner acknowledges it (or its window passes) the clip pauses and a card shows the
feedback message with narration, and a Continue button resumes. After the tutorial
hazards, a "Now it's your turn" card appears and the highlights stop. For the rest of the
clip the learner taps/clicks anywhere a hazard is developing; a correct spot briefly
pauses with the same feedback card. Throughout, the screen shows a remaining-hazards
counter, a progress indicator, and elapsed/total time, and the learner can pause and
resume. The player records every click — hit, miss, or false click — with its moment in
the clip, for scoring.

**Acceptance criteria:**
- Start screen shows difficulty, length, and hazard categories, plus a sound toggle and a
  "show first hazards with hints" toggle; a countdown precedes playback.
- Tutorial hazards are visibly highlighted during their window; acknowledging one pauses
  the clip and shows its feedback message with narration and a Continue button.
- A clear "your turn" transition appears, after which no hazards are highlighted.
- In the scored phase, clicking/tapping a developing hazard registers a hit and shows its
  feedback; clicks outside any hazard window are recorded as false clicks.
- The remaining-hazards counter, progress indicator, and timer update live; pause and
  resume work (including a keyboard shortcut on web).
- Every click is captured with its moment in the clip and whether it was a hit, miss, or
  false click.
- The experience works on web and on the phone app.

### Subtask 3 — Scoring, results and missed-hazard review

**Description:**
When the clip ends, produce a single Hazard Score from three inputs: how many hazards
were spotted out of the scored total, how quickly the learner reacted within each
hazard's window, and how many false clicks they made. Show a results screen with the
score, the three figures (hazards spotted, average reaction speed with a Fast / Average /
Slow label, false clicks), a "review missed hazards" action that replays each missed
hazard's moment with its explanation, and a "try again" action. Reaction and false-click
handling must ignore obvious gaming such as rapid repeated clicking. The scoring weights
and the Fast / Average / Slow thresholds must be adjustable by staff without a release,
and should be tuned so results feel consistent with the reference exercise.

**Acceptance criteria:**
- Finishing a run shows a Hazard Score plus hazards spotted (x of y), average reaction
  speed with a Fast / Average / Slow label, and false-click count.
- "Review missed hazards" steps through each hazard the learner didn't catch, replaying
  its moment in the clip with its explanation.
- "Try again" restarts the same simulator cleanly.
- Rapid repeated or evenly-spaced spam clicking does not inflate the score.
- Staff can adjust the scoring weights and the reaction thresholds without a code
  release.
- After tuning, two reference runs land in a sensible range: roughly 3 of 6 spotted with
  fast reactions and some false clicks gives a low score; 5 of 6 spotted with average
  reactions and more false clicks gives a mid score.

### Subtask 4 — Discovery, access, progress and history

**Description:**
Make simulators easy to find and tie results into the rest of the app, on web and phone.
In the Driving Test videos area, a simulator card opens the new player instead of the old
popup. Add a simple browse list of all available simulators. Apply the existing premium
rule: non-subscribers see the simulator and its details but get the upgrade prompt when
they try to start; subscribers can play. A guest with no account can play and, if they
create an account afterwards, their attempt is kept. Each completed attempt is saved to
the learner's results history and shown alongside their quiz history, is included in
their progress figures and the state page's activity stats, and is removed by "reset all
results".

**Acceptance criteria:**
- Opening a simulator from the Driving Test videos area launches the new player; a browse
  list of all simulators is available.
- Non-subscribers get the upgrade prompt on start; subscribers can start.
- A guest can complete an attempt; after signing up, that attempt appears in their
  history.
- Completed attempts appear in the learner's results history with their score and
  breakdown.
- Simulator attempts are reflected in personal progress and state activity figures, and
  are cleared by "reset all results".
- Works on web and the phone app.

### Subtask 5 — Admin management and content QA

**Description:**
Give staff a screen to manage simulators and their hazards. For each simulator: view its
hazards in order; edit a hazard's category, timing window, tutorial flag, hint text,
narration, and feedback message; reorder hazards; add or remove a hazard; set how many
hazards are tutorial hazards; set the pass threshold and choose the scoring behaviour;
and activate or deactivate the whole simulator. Also provide a results view: a list of
attempts for QA, and a summary of which hazards are spotted least often so staff can
catch bad timings or mislabeled hazards.

**Acceptance criteria:**
- Staff can list simulators and open one to see its hazards in play order.
- Staff can edit a hazard's category, timing, tutorial flag, hint, narration, and
  feedback message, and can reorder, add, or remove hazards.
- Staff can set the tutorial-hazard count, the pass threshold, and the scoring behaviour,
  and can activate or deactivate a simulator.
- Staff can view a list of attempts and a "least-spotted hazards" summary per simulator.
- Staff changes take effect for new attempts without a code release.

---

## 17. How to verify end to end

1. Run the content import for a state that has simulator content; confirm each simulator
   now has its ordered hazard list and that any source inconsistencies appear in the
   import report.
2. As a subscriber on web, open a simulator from the Driving Test page: complete the
   guided walkthrough, the scored round, and the results screen; check the score, the
   three figures, review-missed-hazards, and try-again.
3. Repeat on the phone app.
4. As a non-subscriber, confirm the upgrade prompt appears on start. As a guest, finish a
   run, create an account, and confirm the attempt is in history.
5. Confirm the attempt shows in results history and progress figures, then run "reset all
   results" and confirm it is gone.
6. In the staff area, edit a hazard's feedback text and timing, reorder hazards,
   deactivate then reactivate the simulator, and view the attempts list and
   least-spotted-hazards summary.

---

## 18. Reference

Visual version of this plan (same content, formatted):
https://claude.ai/code/artifact/8101b7ac-c8f4-498e-a7a7-ecd0d1309f77
