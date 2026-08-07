# Phase 3 — Content Platform: Real Per-State/Vehicle/Test-Track Content

Detailed implementation doc for `docs/ROADMAP.md` **Phase 3** ("Question bank ingestion & content
library") and the two `/[state]` items in **Phase 1** ("Content cleanup") — the same role
`PHASE_2_QUIZ_ENGINE.md`, `SUBSCRIPTION_ROADMAP.md`, and `CONTENT_LIBRARY_ROADMAP.md` already play
for their phases. See those docs, plus `apps/api/docs/ARCHITECTURE.md`, for conventions this one
extends rather than replaces.

## Context

The `/[state]` marketing pages (hero, live-activity stats, the phase ladder of practice tests, the
individual test landing page, and its quiz player) currently render from static mock files that
are identical for every state — several literally hardcode `"AK"`/`"West Virginia"` in the copy
regardless of which state is selected:

- `data/stepsMockData.ts` + `.json` (car/`permit_test` phase ladder)
- `data/motorcycleStepsMockData.ts` (re-exports the same types, same bleed-through)
- `data/drivingTestMockData.ts` + `data/motorcycleDrivingTestMockData.ts` — a second, distinct
  mocked shape (`cardType`/`total`/`duration`) for hazard/road-skill/video cards
- Every `LiveDataSection.tsx` variant — hardcoded numbers, only the state *name* is interpolated
- `WrittenTestContent.tsx` — hardcoded pass rates/vote counts/topic breakdown; its own `testSlug`
  prop is never actually used to look anything up
- `lib/mockQuizQuestions.ts` — backs a second, polished, fully-mocked quiz player at
  `/[state]/[test-slug]/quiz`, parallel to the real backend-graded one at `/quizzes/[id]`

Meanwhile the backend already has a real, working data model for almost all of this — `states`,
`vehicle_types`, `quiz_categories`, `quizzes`, `quiz_questions`, `quiz_attempts`, `cheat_sheets`,
`flashcards`, all with public filtered endpoints and full admin CRUD UI already built at
`apps/web/app/admin/**` — it has simply never been wired to these pages. A real, backend-graded
quiz player already exists (`/quizzes/[id]`, `components/quiz/QuizPlayer.tsx`).

**Database check confirmed only `car` × `permit_test` has any seeded content today** (263 quizzes /
1,584 questions across all 52 states). `driving_test` and all of `motorcycle` are empty. A ~40GB
real crawled dataset (structured files, one per state/vehicle-type/test-type, mostly external
media links with some real downloaded files) exists on another machine, not yet imported — this is
the actual Phase 3 dataset. So this phase is genuinely an ingestion task, not pure wiring.

**A real 2-state sample (Alabama + Alaska, all vehicle types) was inspected directly** (see
"Ingestion pipeline" below for the confirmed shape) — the schema and importer design in this doc
are verified against actual files, not guessed.

## Scope

All 52 seeded states × `car` and `motorcycle` vehicle types × `permit_test` and `driving_test`
tracks. **CDL is explicitly deferred to a later pass** — every piece of new infrastructure below
is vehicle-type-agnostic (nullable `vehicle_type_id` FKs, filter params, not vehicle-specific
tables), so picking CDL up later means pointing the same importer/components at `vehicle_type=cdl`,
not rebuilding anything.

**Zero fabricated data anywhere in this scope.** Every number, title, and content item must trace
to a real DB row. Live "social-proof" stats are computed live from real `quiz_attempts` (small
today, grows honestly as usage grows) — no baseline/seeded vanity numbers, and no nationwide-rank
chip (noise at current volume, revisit once there's real traffic).

## Backend architecture (extends `apps/api/docs/ARCHITECTURE.md`, no new patterns invented)

**Reused as-is, no changes**: `quizzes` / `quiz_questions` / `quiz_answers` / `quiz_categories` /
`quiz_attempts` schema and the existing Action → Resource layering. `QuestionDifficulty` and
`TestTrack` enums already fit. `QuizQuestion` already has a `MEDIA_COLLECTION_IMAGES` Spatie
collection — per-question images need zero new schema.

**New, minimal additions** — each reuses an existing convention rather than inventing one. The
first draft of this doc proposed these before a real sample existed; items 1 and 6 changed shape
after inspecting actual Alabama/Alaska files (noted inline):

1. **`states` table** — additive migration: nullable `agency_name` (e.g. Arizona's is "MVD," not
   "DMV" — currently hardcoded as "DMV" everywhere) and `dmv_website_url`. **No `handbook_url` on
   `states`** — the real data has a *distinct handbook per vehicle type* (Car/CDL/Motorcycle each
   have their own manual, own PDF, own page), so a single per-state field was the wrong shape; see
   the new `handbooks` table (item 6). Update `App\Models\State::$fillable`,
   `Store/UpdateStateRequest`, both `StateResource` classes, `packages/shared/src/types/quiz.ts`'s
   `State` type, and the admin states forms. Leave values null until an admin (or the importer)
   fills them.

2. **`quizzes` table** — one additive column, nullable `source_url` (the driving-tests.org page the
   quiz was crawled from, e.g. `https://driving-tests.org/alabama/alabama-permit-practice-test/`)
   — pure traceability, lets anyone spot-check imported content against its origin without a DB
   query. Cheap to add now, useful for QA'ing 40GB of imported content later.

3. **Categories are imported as real data, not mapped through a fixed vocabulary.** The original
   plan assumed a `taxonomy_map.php` translating source category labels into our 4 existing
   `quiz_categories` (`the-essentials` etc.). The real data doesn't need that: each vehicle type's
   `questions.json` already groups quizzes under real section titles — Car's are `The essentials` /
   `The more complicated stuff` / `The things that could get you in trouble` / `The exam simulator`
   (the first three match existing seeded categories exactly), but Motorcycle's are differently
   worded (`Practice Essential Topics` / `Practice Lanes and Group Riding` / `Practice Fines &
   Limits and Pass the Marathon`) — forcing motorcycle content under car's category names would be
   less faithful, not more consistent. **The importer upserts a `quiz_categories` row per distinct
   section title it encounters** (by title → slug, `order_no` = first-seen order within that
   state/vehicle/track's `sections` array), and `quiz_type=final` is set when the section title is
   literally `The exam simulator` (or vehicle-specific equivalent) rather than needing its own
   category. **Known data-quality artifact**: at least one section per state/vehicle so far is
   titled `Your membership plan does not include Premium access to this type of transport.` — a
   scraper-captured paywall message, not a real section name, but the quizzes underneath it (e.g.
   CDL/Motorcycle "flashcard set" quizzes) are real. The importer keeps the content and imports the
   junk title verbatim rather than guessing a replacement — flagged loudly in the import summary
   log for an admin to rename via the existing category admin UI, not silently patched.

4. **`quiz_question_assets`** — unchanged from the original plan (per-question video/audio hook,
   deliberately not through Spatie Media Library — see `ARCHITECTURE.md`'s Media section). **Not
   populated by this import pass** — see item 5, hazard-perception content in the real data lives
   at a coarser level than a single question.

5. **`videos` table** — two additive columns beyond the original plan: nullable `section` (the
   source's own grouping label, e.g. `Learn to Drive Videos`, `Defensive Driving Hazard Simulators`
   — free text, not forced through `quiz_category_id`, for the same reason as item 3) and nullable
   `source_url`. Otherwise unchanged (see the already-implemented model/policy/controllers).
   **Both of the real data's video-shaped content types import here**: instructional/road-test-
   commentary videos (`videos.json`, YouTube-embedded) map directly — `external_url` = the YouTube
   embed URL, `description` assembled from the source's structured `content_sections`
   (heading + do's/don'ts items) rendered as Markdown-ish text. Hazard-perception **simulators**
   (`simulators.json`, Vimeo-embedded, Driving Test track only) also import as `Video` rows for
   this pass — `external_url` = the Vimeo embed URL, `duration_seconds` parsed from `test_length`
   (e.g. `"2:15 min"`). The real data is much richer than a flat video: each simulator has a
   timestamped `hazards` array (per-hazard start/end time, a text comment, and its own narrated
   `audio_url`) sequenced by a `timeline` — a real interactive hazard-perception exercise, not just
   a clip. Building the timestamped/narrated playback UI is real, separate frontend work; **this
   pass imports the real simulator metadata and video as a watchable `Video`, and intentionally
   defers the per-hazard interactive layer** rather than half-building it. Nothing about this is
   modeled as fake — it's a smaller real feature (watch the video) shipped now, with a clear,
   already-captured path (the hazards/timeline data will already exist in the source once the
   richer player is built later; nothing needs re-crawling).

   **Extended after driving-test parity work on the AL/AK sample** (two follow-ups — a schema gap
   and a rendering gap, both found by actually browsing the imported pages, not guessed):
   - **`subsection` column** — additive, nullable, same free-text convention as `section`. Some
     real sections are two levels deep (`Motorcycle Skills Videos` → `Master Your Brakes`,
     `Mistakes That Can Kill You`, etc. — 5 subsections, 3 videos each). Both crawl-importers
     (`ImportVideosFromCrawl`, `ImportSimulatorsFromCrawl`) read an optional `subsection` key per
     row; `DrivingVideosSection.tsx` (new — see Frontend consumption) only groups by it when at
     least one video in that section actually has one, so the still-common flat case renders
     exactly as before, no extra heading level for nothing.
   - **Real thumbnails, sourced not fabricated.** `thumbnail_url` existed on the Resource/model
     from the start but was never populated — no thumbnail field exists anywhere in the crawl
     JSON. Rather than a placeholder image, both real sources actually expose a genuine thumbnail:
     YouTube serves one at a deterministic per-video URL (`img.youtube.com/vi/{id}/hqdefault.jpg`
     — no API call, always real). Vimeo has no such static pattern, so its real thumbnail is
     fetched via Vimeo's own public oEmbed endpoint (`vimeo.com/api/oembed.json`) at import time —
     a genuine network call, not invented. Both importers attach the result to the video's
     existing (until now unused) `MEDIA_COLLECTION_THUMBNAIL` Spatie collection, only if one isn't
     already attached — idempotent, so a repeat `content:import` backfills existing rows too, not
     only newly-created ones. A handful of videos end up with no thumbnail (Vimeo's own oEmbed
     genuinely omits `thumbnail_url` for them, e.g. every state's "Simulator 9") — logged via
     `ImportSummary::warn()` and left null, not faked.
   - **`DurationParser`** extended to parse both real duration formats the site actually uses —
     `"8:23 min"` (M:SS) and `"19m 21s"` (Xm Ys) — rather than normalizing one format's source text
     to fit the other's pattern.

6. **`handbooks` / `handbook_chapters` / `handbook_sections`** — new, replacing the originally
   planned single `states.handbook_url` field once the real per-vehicle-type shape was confirmed.
   `handbooks`: `state_id`, `vehicle_type_id` (both FK, restrictOnDelete), `language` (default
   `english`), `title`, `source_url`, `total_words` (nullable, informational). `HasMedia` via
   Spatie for the real handbook PDF (`MEDIA_COLLECTION_PDF`, single-file — a static download, same
   category as a cheat-sheet PDF, unlike video/audio). `handbook_chapters`: `handbook_id`
   (cascadeOnDelete), `title`, `sort_order`. `handbook_sections`: `handbook_chapter_id`
   (cascadeOnDelete), `heading` (nullable — the real data has sections with no heading), `content`
   (longText — real handbook prose, sometimes substantial), `sort_order`. Storing real chapter text
   (not just a PDF link) is deliberate: `CONTENT_LIBRARY_ROADMAP.md`'s AI Tutor mode (b) already
   plans a `FULLTEXT` search over `cheat_sheet_sections`; `handbook_sections` is the same shape and
   a natural second target for that same search once real handbook content exists.

   **Correction (found during the AL/AK zero-fake-data audit)**: `content` never actually holds
   real handbook prose — the crawl only ever captured the source site's landing-page copy about
   its own PDF download page ("Enter the password to open this PDF file," "our AI assistant,"
   etc.), plus a "More from {State}" nav-junk section (now filtered out at import,
   `ImportHandbookFromCrawl.php`). The real handbook text only exists inside the PDF itself.
   `apps/web/app/handbook/[id]/page.tsx` was rebuilt to embed that PDF directly (native browser
   viewer) instead of rendering `handbook_sections.content` as if it were the handbook — the
   FULLTEXT-search plan above doesn't apply to handbooks until real chapter text is actually
   sourced (e.g. PDF text extraction), which hasn't been built.

7. **Road-sign study content — no new table**, unchanged from the original plan: imported into the
   already-built `flashcards` table (`topic='road-sign-*'`, `state_id = null` — signs are federally
   standardized). The real data's `extra_support` folder (see item 8) doesn't include a discrete
   road-sign dataset yet in the Alabama/Alaska sample (its "120 Most Common US Road Signs" item is
   a locked/un-downloaded premium PDF, not structured sign-by-sign data) — this stays a placeholder
   until a source for individual sign images + meanings is confirmed; not blocking the rest of this
   phase.

8. **`extra_support` → `cheat_sheets`, no schema change needed.** Each state/vehicle/track's
   `extra_support/*/index.json` lists real downloadable study guides (title, a real local PDF file
   with its actual size, a real cover image) — this is exactly the existing `cheat_sheets` shape
   (`title`, `summary` synthesized since the source has none, PDF via
   `CheatSheet::MEDIA_COLLECTION_PDF`, cover via `MEDIA_COLLECTION_COVER`). Some listed resources
   have `status: error` (the crawler couldn't fetch them, e.g. a premium download link that
   returned nothing) — those are skipped on import (logged, not created as broken rows) rather than
   creating a cheat sheet with no actual file.

9. **No changes** to `quiz_attempts`, `flashcard_reviews` — already correctly shaped for this.

## Storage

`FILESYSTEM_DISK`/`AWS_*` env vars are already scaffolded in `apps/api/.env.example` for exactly
this (Cloudflare R2 recommended, S3-compatible), and Laravel's default `config/filesystems.php`
already ships an `s3` disk definition — no new config code needed, only real credentials in a
non-local env when ready to go live with real media (an ops task, out of engineering scope here).
Local dev keeps `FILESYSTEM_DISK=local`; the import command works against either.

**Dedup, given 40GB scale**: real (non-link) files only exist under each state/vehicle/track's
`handbook/` and `extra_support/*/` folders (handbook PDFs, cheat-sheet/guide PDFs, cover images) —
confirmed directly: every question image, simulator video, and instructional video in the sample is
an external URL (driving-tests.org's own CDN, Vimeo, or YouTube), never a locally downloaded file.
So the "40GB, mostly links" description holds, and dedup only matters for that PDF/cover subset —
confirmed necessary by inspection, not just theoretical: Alabama's Car and Motorcycle
`extra_support` folders contain **byte-identical PDFs** (same file, same size, crawled twice under
each vehicle type's folder). Before uploading any local file, hash it (`sha256`) and use the hash
as the object key (e.g. `cheat-sheets/{sha256}.pdf`); skip the upload if that key already exists,
still create the DB row (and its own `Media` record) pointing at it — Spatie Media Library
attaches per-model, so this is "skip the disk write, still register the attachment," not a shared
file reference.

## Ingestion pipeline

**Confirmed directly against a real 2-state sample** (Alabama + Alaska, all vehicle types,
user-supplied at `D:\Files&images\driving test\<state>\<VehicleType>\<TestType>\...`, structure
identical across both states):

```
<state>/
  Car/
    Permit Test/
      questions.json       # sections[] -> subcategories[] (=quizzes) -> questions[]
      handbook/
        handbook.json       # chapters[] -> sections[] (heading + content)
        <State> Drivers Handbook Download PDF, English.pdf
      extra_support/
        <State> The Extra Support/
          index.json         # resources[]: title, PDF path (or a dead "status: error" source url), cover image path
          <Resource Title>/<pdf>, cover.jpg
    Driving Test/
      questions.json
      simulators.json        # Vimeo-embedded hazard-perception exercises, timestamped hazards+narration
      videos.json             # YouTube-embedded instructional/road-test-commentary videos
  CDL/
    Permit Test/  (same shape as Car; CDL import deferred — see Scope)
  Motorcycle/
    Permit Test/   (same shape as Car)
    Driving Test/
      simulators.json         # real hazard simulators — present for every state
      videos.json             # instructional videos — ABSENT from the original 40GB crawl for
                               # every state's Motorcycle/Driving Test folder. For Alabama/Alaska
                               # specifically this file was sourced separately (see "Supplementary
                               # video sourcing" below) and dropped into this same folder — the
                               # importer doesn't care which method produced a videos.json, only
                               # that its shape matches
```

`questions.json` top level: `state`, `category` (vehicle type name), `test_type`, `source_url`,
`total_questions`, `sections: [{ title, subcategories: [{ title, url, tier ("PREMIUM"|"FREE"),
question_count, questions: [{ question_number, question, question_images: [url], options: [4
strings], option_images: [4 strings, confirmed always empty in the sample — not imported this
pass], answer, answer_index, explanation, category, subcategory, answer_verified }] }] }]`. Maps
onto our schema directly: `sections[].title` → `quiz_categories` (see item 3 above);
`subcategories[]` → one `Quiz` each (`title`, `slug` from title, `test_track` from `test_type`,
`is_premium` from `tier === 'PREMIUM'`, `total_questions` from `question_count`, `source_url` from
`url`); `questions[]` → one `QuizQuestion` each (`question_text`, `explanation`, `topic` = the
question's own `subcategory` field — narrower and more useful than `category`, and matches the
single-string `topic` convention `StateCoverageSeeder` already uses); `question_images[]` →
`QuizQuestion::MEDIA_COLLECTION_IMAGES` via `addMediaFromUrl()`, deduped by storing the source URL
as a media custom property and reusing the existing attachment if the same URL is seen again (image
URLs repeat heavily across states — many are the source's own shared stock imagery, exactly the
duplication `docs/ROADMAP.md` Phase 3 anticipated); `options[]`/`answer_index` → `QuizAnswer` rows,
`is_correct` set on the option at `answer_index` (cross-checked against the `answer` text at import
time; a mismatch is logged, not silently trusted). **No source signal for question difficulty** —
every imported question defaults to `medium`; a known, disclosed gap, not a guess dressed up as
data.

1. **Landing zone**: the importer takes a root path as an argument — no fixed on-disk convention
   required beyond "one folder per state, `<VehicleType>/<TestType>/...` beneath it," matching
   where the real data already lives. Not copied into the repo or committed; the user points the
   command at wherever the synced data sits (e.g. the `D:\Files&images\driving test` sample, or
   wherever the full batch lands later).

2. **`php artisan content:import {path}`** (`Actions/Content/ImportCrawledState.php` +
   `Console/Commands/ImportContent.php`, following the existing Action-per-operation convention):
   - `--vehicle-type=car|motorcycle` (repeatable/comma-separated; CDL deliberately excluded by
     default per Scope), `--only=questions|handbook|extra-support|videos|simulators`, `--dry-run`.
   - **Idempotent upsert** — `Quiz` by `slug`; `QuizQuestion` by a hash of
     `quiz_id + question_number` (stable across re-imports of the same source, unlike hashing the
     question text, which would create a duplicate if a typo gets fixed upstream);
     `QuizCategory`/`Video`/`Handbook`/`CheatSheet` by slug.
   - **Streamed one JSON file at a time** — `questions.json` files run up to ~1.3MB in the sample
     (which will scale with 52 states but stays JSON-decodable in memory per-file; the 40GB total is
     spread across thousands of small-to-medium files, not one giant blob) — no need for a
     streaming JSON parser, just "don't hold multiple states in memory at once."
   - Media: real local files (handbook PDFs, extra_support PDFs/covers) → hash-dedup-upload per
     Storage above; every other media reference (question images, simulator/instructional videos,
     hazard audio) → stored as the real external URL, not downloaded.
   - Ends with a written summary (imported/updated/skipped counts per content type, every
     `status: error` extra_support resource skipped, every non-`PREMIUM`/`FREE` tier value or
     suspicious/artifact section title) — logged loudly, not swallowed.
   - **Run by/with the user, not autonomously for the full 40GB batch** — but safe and expected to
     be run directly against the Alabama/Alaska sample now to verify end-to-end before scaling up.

4. **New/extended public endpoints** (same filter conventions as `Public\QuizController`):
   - `Public\QuizController::index` — add an optional exact-match `slug` filter (one clause, same
     shape as the existing `state`/`vehicle_type` filters) so the frontend can resolve
     `state + vehicle_type + test_track + slug → quiz id` without a new route.
   - `Public\VideoController` (`index`/`show`) — same filter/locked-teaser shape as
     `Public\CheatSheetController`.
   - `Public\HandbookController` (`index`/`show`) — filter by `state`/`vehicle_type`; `show`
     includes `chapters.sections` and the PDF download URL (handbooks aren't premium-gated in the
     source data, so no locked-teaser split needed here, unlike cheat sheets/videos).
   - `Public\StateController` — new `stats(string $code)` action,
     `GET /v1/states/{code}/stats?vehicle_type=`, computed live (no new tables) via the same
     `groupBy`/`selectRaw` pattern `Admin\StatsController::dailyCounts` already uses, scoped by
     joining `quiz_attempts` → `quizzes` on `state_id`+`vehicle_type_id`: `active_today`,
     `students_practiced_30d` (distinct `user_id`/`guest_token`), `questions_answered_total`,
     `avg_session_seconds`, `peak_hour`. No nationwide-rank field (see Scope above).

### Supplementary video sourcing (the Alabama/Alaska motorcycle gap)

The original 40GB crawl's `Motorcycle/Driving Test/` folder never included a `videos.json` for any
state — only `simulators.json`. The live site itself, though, does have real instructional content
there (`https://driving-tests.org/{state}/motorcycle/`, Driving Test tab: "Learn to Ride" + "Motorcycle
Skills Videos" sections) — it just wasn't captured by whatever produced the original 40GB handoff.
Rather than leave motorcycle driving-test pages showing nothing but hazard simulators, Alabama and
Alaska's gap was closed directly:

1. `curl -A "Mozilla/5.0 ..." <page-url>` — the video data (title, real duration, real
   `data-yt="<id>"` YouTube id) is in the page's own static HTML, no JS execution needed.
2. **A real pitfall worth flagging**: this HTML arrives as a handful of gigantic single lines. A
   `grep -o 'pattern.\{0,9000\}'` with a bounded quantifier over one of those lines hung for
   several minutes (looks like near-catastrophic backtracking) — use `grep -b -o "pattern"` to get
   a byte offset instead, then `tail -c +OFFSET file | head -c LENGTH` to slice out a chunk.
   Instant and reliable.
3. **Genuineness check, not assumed**: the same overview page also lists the hazard simulators with
   `data-pid="<id>"` attributes — cross-checked against the `page_id` values already in the
   existing (already-imported) `simulators.json` for that state, confirming the fetched page is
   really the same dataset before trusting anything newly parsed from it.
4. Hand-built a `videos.json` matching the existing file's exact shape (see `questions.json`
   parallel above) — real titles/ids/durations copied verbatim, `subsection` set from the page's
   own subsection headings, `url` pointed at the overview page itself (there's no per-video article
   page for these, unlike Car's `videos.json` entries). Verified valid JSON, dry-run imported,
   then imported for real, then spot-checked in the DB (parsed `duration_seconds`, `external_url`,
   `is_premium=false`) before trusting it.
5. Alaska's set turned out byte-for-byte identical to Alabama's (same MCrider-sourced curated
   videos, reused across states) — confirmed by actually fetching and diffing Alaska's own page,
   not assumed from Alabama's.

**Not done**: the other 50 states' `Motorcycle/Driving Test/` folders still lack a `videos.json` —
either the same manual per-state extraction, or an updated bulk crawl that captures this section,
would need to happen before this phase's full 52-state rerun (see Implementation sequence below)
covers it.

## Frontend consumption (`apps/web`) — car + motorcycle × permit + driving, all 52 states

**Collapse the duplicated component trees.** Today car-permit/car-driving/motorcycle-permit/
motorcycle-driving are four independently hand-maintained trees, each with its own mock file and
its own near-identical `HeroSection`/`LiveDataSection`. Replace with one parameterized
implementation keyed off `{ vehicleType, testTrack }` from `useWebLayout()`, calling the real
filtered endpoints (`/quizzes?state=&vehicle_type=&test_track=&category=`, `/videos?...`,
`/flashcards?...&topic=road-sign-*`). `StateTestTypeContent.tsx` and
`motorcycle/MotorcycleTestTypeContent.tsx` collapse into one router component.

**Real phase/steps data.** One hook replaces `usePhaseCompletion` + `useMotorcyclePhaseCompletion`
+ both mock JSON files, built from real queries per phase: essentials/complex/trouble phases from
`quizzes` filtered by category; the exam-simulator phase from `quiz_type=final`; an "extra support"
phase from the road-sign flashcards + `cheat_sheets`; for `driving_test` specifically, questions
carrying `quiz_question_assets` surface real hazard-perception media instead of being a relabeled
copy of the permit-test phases. `StepCard` already supports `state`+`slug` linking
(`TestSteps.tsx`/`StatePhase.tsx` are pure presentational, unchanged) — it just needs to actually
receive those props now, wiring "Next"/completed steps to real `/${state}/${slug}` pages for the
first time.

**`justCompleted` animation gap** (flagged as deferred/blocked in
`docs/STATE_PROGRESS_ANIMATION.md` — "nothing yet clears `justCompleted`... follow-up for whenever
this page gets a real API"): resolved client-side, not with a new persisted-ack endpoint. Right
after a real attempt submission succeeds, stash the completed quiz id in `sessionStorage`; the
phase hook reads it once (marks that step `justCompleted` for this render only), then clears it.
Avoids a migration/endpoint for what's genuinely a one-time UI trigger — the underlying `completed`
state is still 100% real, sourced from `quiz_attempts`/locally-tracked guest completions.

**Real live stats.** `LiveDataSection` (one shared component now) calls
`/states/{code}/stats?vehicle_type=`; `StudentChart` plots a real recent-activity series from the
same response instead of a fixed array.

**Real per-test landing page.** `WrittenTestContent.tsx` currently ignores its `testSlug` prop
entirely. Rewired to resolve the quiz via the new `slug` filter, render real `QuizResource` fields
(question count, passing score, category) and a real topic breakdown from that quiz's
`quiz_questions.topic` grouping.

**Real quiz player.** `/[state]/[test-slug]/quiz/page.tsx` rewired to the slug-resolved quiz id,
fetching via `GET /quizzes/{id}` and submitting via `POST /quizzes/{id}/attempts` — reusing
`components/quiz/QuizPlayer.tsx`'s existing grading logic rather than re-implementing it.
`lib/mockQuizQuestions.ts` deleted once nothing imports it. Non-backed cosmetic controls (ambient
music, voice-over, the AI hint box) stay but read as inert/"coming soon," not silently fake.

**Handbook section** becomes a real card sourced from `GET /handbooks?state=&vehicle_type=` (new
public endpoint, same filter/teaser pattern as cheat sheets) — real title, real chapter/section
count, a working PDF download, and a link to `source_url`. Falls back to `state.dmv_website_url`
if no handbook row exists yet for that state/vehicle combination, omitted entirely if neither
exists. No fake interactive reader (audio narration, in-app chat) — that's real future scope, not
simulated now.

**"Quiz Vault"** stays out of the phase ladder until `CONTENT_LIBRARY_ROADMAP.md`'s already-planned
"Weak Spots" feature (§2 of that doc) ships — never rendered with placeholder data.

**Driving Test / Permit Test parity, car + motorcycle (AL/AK).** `PermitTestContent.tsx` and
`DrivingTestContent.tsx` (both vehicle types) were built at different times and drifted: only the
permit variant included `<LiveDataSection/>`, and several Driving Test surfaces still read as if
every quiz were a permit written test regardless of the resolved quiz's real `test_track`:
- `driving-test/HeroSection.tsx` (both vehicle types) had its CTA button literally reading "Start
  Permit Practice Test" — copy bug, not a data bug. Fixed, and its link now filters
  `test_track=driving_test`.
- `permit-test/PremiumCTA.tsx` (shared by both tracks via `PhaseLadderSection`) said "the core of
  the {state} written exam" under Driving Test too. Now branches on `selectedTestType`.
- `WrittenTestContent.tsx` — the individual quiz landing page used by both tracks — hardcoded
  "permit"/"written knowledge test" copy throughout regardless of the resolved quiz's `test_track`.
  Now branches on it (`isDrivingTest = quiz?.test_track === "driving_test"`). Its primary CTA also
  used to unconditionally claim "Start free..." even for a quiz that's actually `is_premium` —
  fixed to check the resolved quiz's real `locked` field and say "Unlock..." instead when true.
- Added `<LiveDataSection/>` to both Driving Test variants for parity (the component was already
  fully track-agnostic — zero code changes needed in it).
- New `DrivingVideosSection.tsx` — real videos/simulators for the current state/vehicle,
  `test_track=driving_test`, grouped by `section`/`subsection` (see the `videos` table extension
  above) matching how driving-tests.org itself organizes this content. Each card reuses `StepCard`
  — the exact same component the quiz/simulator phase-ladder cards already use — so a video card
  and a quiz card look identical (thumbnail, Free/Premium badge, title, duration); clicking opens
  a watch dialog (unlocked) or the existing `PremiumDialog` (locked) instead of navigating to a
  quiz page. This is the only real practice content on Motorcycle Driving Test pages where no
  question bank exists (see Scope/gaps above) — without it those pages would show an empty phase
  ladder and nothing else.

## Implementation sequence

1. This doc. ✅
2. Migrations + model/Resource/shared-type updates: `states` (`agency_name`/`dmv_website_url`),
   `quizzes.source_url`, `quiz_question_assets`, `videos` (+`section`/`source_url`), `handbooks` /
   `handbook_chapters` / `handbook_sections` — additive only, per `ARCHITECTURE.md`'s migration
   policy. ✅
3. `content:import` command, built and verified against the real Alabama/Alaska sample. ✅
4. New/extended public endpoints (`slug` filter, `Public\VideoController`,
   `Public\HandbookController`, `StateController::stats`). ✅
5. Run the import for the full 52-state batch once staged (with the user) — the Alabama/Alaska
   sample proves the pipeline; scaling up is a rerun with a bigger input, not new code.
6. Frontend consolidation and real wiring, retiring every in-scope `*MockData.ts` file and
   `mockQuizQuestions.ts`.
7. Update `ROADMAP.md` checkboxes.

## Verification

- Backend: feature tests for the new `slug` filter, `VideoPolicy`/`Public\VideoController`
  locked-teaser behavior (mirrors existing `CheatSheetPolicy` tests), the `states/{code}/stats`
  endpoint shape — all done. Import-command tests run it against the real Alabama/Alaska sample
  (not a synthetic fixture, since the real shape is now known) in dry-run and real mode, asserting
  idempotency on a second run and that the known "membership plan" artifact section is imported
  (not silently dropped) with a warning logged.
- Frontend: browse `/alabama`, `/alaska`, switch state/vehicle/test-type in the header, confirm
  phase titles/counts/live-stats genuinely differ per combination and match the DB (including that
  motorcycle's phase names read differently from car's, per the real source data — not forced into
  car's wording); confirm a step card leads to a real per-test page whose quiz is fully playable
  and graded; watch the phase-completion animation fire once (real attempt) and not replay on
  reload; confirm no car/motorcycle code path still imports from a `*MockData` file.
