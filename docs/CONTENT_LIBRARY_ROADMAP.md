# Content-Library Features — Cheat Sheets, Flashcards, Exam Simulator, AI Tutor

Companion to `docs/SUBSCRIPTION_ROADMAP.md`, which deliberately deferred these four feature areas as "separate content-library work" it only needs to be ready to *gate*, not build. This fills in what they actually are and how to build them, mapped against `docs/ROADMAP.md` Phases 3/4/6/7.

## Context

All four already exist today as pure marketing copy with no working functionality behind them: `apps/web/components/cdl/HandbookBanner.tsx` (fake "PDF 112 pages / MP3 2h04m / 13MB" stats, dead "Open Handbook" button), `apps/web/components/cdl/ChallangeBankBanner.tsx` (branded "Challenge Bank™" — a direct copy of the reference site's trademarked terminology, needs renaming per the already-locked original-branding rule), and `apps/web/components/features-overview/TheToolkitSection.tsx` / the home page's `ToolkitSection.tsx` (marketing cards for "Flashcards," "AI Tutor," "DMV Simulations" with no `href`).

The good news: the existing quiz engine (`Quiz`, `QuizQuestion`, `QuizAnswer`, `QuizAttempt` — backend-complete per `docs/ROADMAP.md` Phase 2) already carries most of what's needed. `QuizType` already has a `final` ("Final Exam Simulation") row; `Quiz.duration_seconds` already exists; `QuizQuestion.explanation` and `QuizAnswer.explanation` already exist and are populated. This roadmap is mostly about wiring real functionality onto infrastructure that's already there, plus two genuinely new small content models (cheat sheets, flashcards).

**Decisions this roadmap makes (consistent with prior locked decisions — original branding, `is_admin`/subscription as separate axes):**
1. Each feature gates through its own `is_premium`-style boolean today, structured so the gate becomes a one-line swap to `EntitlementResolver::hasFeature(Feature::X)` the moment that service lands (per `docs/SUBSCRIPTION_ROADMAP.md`) — never hard-blocked on it.
2. "Challenge Bank™" → renamed **"Weak Spots"**; "DMV Genie™" → the already-used plain term **"AI Tutor"** is fine as-is (generic descriptive names don't violate the original-branding rule — only copying stylized/trademarked coined terms does).
3. AI Tutor v1 ships as two modes: a **contextual answer explainer** (no dependency on new content — ships first) and an **open-ended chat tutor** (needs real cheat-sheet content to ground answers in — ships after).
4. Exam Simulator is treated as a UX variant of the existing quiz-taking flow, not a new content model.

---

## 1. Cheat Sheets

**What it is:** condensed, high-yield study guides (right-of-way quick reference, road-sign meanings, "trickiest questions" summaries), scoped by state/category, downloadable as PDF — the functional replacement for `HandbookBanner.tsx`'s single fake "handbook."

### Data model
Two tables — a sheet header plus ordered sections — because Phase 6 of the existing roadmap frames this as sheet-level granularity ("multiple sheets per endorsement/category"), and a study guide reads better as headed sections than one markdown blob.

- **`cheat_sheets`**: `quiz_category_id` (nullable FK, restrictOnDelete), `state_id` (nullable — null for federal/universal content), `vehicle_type_id` (nullable), `title`, `slug` (unique), `summary` (teaser, always visible), `is_premium` (default true), `is_active`, `order_no`.
- **`cheat_sheet_sections`**: `cheat_sheet_id` (FK, cascadeOnDelete), `heading`, `body_markdown` (text), `sort_order`.
- `app/Models/CheatSheet.php` — `HasMedia`, two Spatie collections: `MEDIA_COLLECTION_COVER` (single-file, same pattern as `Quiz`) and `MEDIA_COLLECTION_PDF` (the cached rendered PDF).

### PDF generation
**Recommend `barryvdh/laravel-dompdf`** (pure PHP, Composer-only — no Chromium/Node runtime dependency) over `spatie/browsershot` (needs headless Chrome present on the server, real ops burden given no deployment target is chosen yet per `docs/ROADMAP.md` Phase 10). Dompdf's limited CSS support is a non-issue here — cheat-sheet content is headings/paragraphs/bullet lists, not a marketing page. **Lazy-generate-and-cache**: first `GET /cheat-sheets/{id}/download` renders via a Blade view (sections → markdown via `league/commonmark` → HTML → dompdf) and stores the result into `MEDIA_COLLECTION_PDF`; subsequent downloads stream the cached file. Any section edit clears that media collection so the next download regenerates.

### Backend (mirrors the existing `Quiz`/`QuizQuestion` admin-CRUD convention exactly)
- `app/Policies/CheatSheetPolicy.php` — `view()` (teaser always visible, matches `QuizPolicy::view()`) + `readFull()` (the premium gate — today: `is_premium ? ($user?->is_admin) : true`; swap to `EntitlementResolver::hasFeature(Feature::CheatSheets)` later, one line).
- `Actions/CheatSheet/{CreateCheatSheet,UpdateCheatSheet,SyncCheatSheetSections,GenerateCheatSheetPdf}.php`.
- `Http/Controllers/Api/V1/Admin/{CheatSheetController,CheatSheetSectionController}.php` (CRUD + `reorder`, reusing `QuizQuestionController::reorder`'s transaction shape) and `Http/Controllers/Api/V1/Public/CheatSheetController.php` (`index`/`show`/`download` — `show` omits sections and returns `locked: true` when `readFull` fails, same locked-teaser shape planned for premium quizzes).
- Routes follow the existing flat + admin-group convention in `apps/api/routes/api.php`.

### Frontend
- `packages/shared/src/types/cheat-sheets.ts` (admin/public split, matching `types/quiz.ts`).
- `apps/web/app/cheat-sheets/page.tsx` (browse, cloned structurally from `app/quizzes/page.tsx`) and `[id]/page.tsx` (sections rendered via `react-markdown` — a new, small frontend dependency; locked-preview + `PremiumDialog` reuse; "Download PDF" button).
- **Replace `HandbookBanner.tsx`** with `CheatSheetsBanner.tsx`: drop the fabricated PDF/MP3/download stats entirely (the MP3/audio stat over-promises a feature that isn't in scope), show a real sheet count from the API and a working link to `/cheat-sheets`.
- Admin pages under `apps/web/app/admin/cheat-sheets/` mirroring the existing `admin/quizzes/` structure.

---

## 2. Flashcards

**What it is:** quick-recall study cards (front/back), scoped the same way as quizzes (category/state/vehicle_type — no new "deck" concept needed, a deck is just a filtered query).

### Data model
- **`flashcards`**: `quiz_category_id`/`state_id`/`vehicle_type_id` (nullable FKs), `front_text`, `back_text` (text), `topic`, `is_premium`, `is_active`, `sort_order`. `app/Models/Flashcard.php` — single-file `MEDIA_COLLECTION_IMAGE` (one image per card, e.g. a road sign).
- **`flashcard_reviews`**: `user_id` (FK, **not** nullable — guests get an ephemeral client-only shuffle, no persistence), `flashcard_id`, `status` enum(`new`|`known`|`unknown`), `reviewed_at`. Unique on `(user_id, flashcard_id)`.

### Scope decision: no real spaced-repetition algorithm for v1
A shuffle-deck + self-report known/unknown + "review what I marked unknown" loop delivers the reference site's actual value (quick recall practice) without the complexity of SM-2/Leitner interval scheduling (per-card ease factors, due dates). This is a deliberate v1 cut — real spaced repetition is a plausible v2 upgrade once usage data justifies it, not a missing requirement.

### "Weak Spots" (replaces "Challenge Bank™")
The reference feature — auto-retest on missed quiz questions — operates on `QuizAttemptAnswer.is_correct = false`, a different data source than curated flashcard content, so it's **not** stored in the `flashcards` table. It's the *same flip-card UI component reused against quiz-attempt history*, via an API adapter: a new auth-only `GET /v1/weak-spots` endpoint (`Http/Controllers/Api/V1/WeakSpotsController.php`, alongside `QuizAttemptController` in the existing flat auth-only namespace) queries the user's incorrect `QuizAttemptAnswer` rows and responds in the **same JSON shape as a public Flashcard**, so the frontend's `FlashcardDeck` component needs zero awareness the source differs. Surfaced via `apps/web/components/dashboard/WeakSpotsBanner.tsx` on `/dashboard` (not the CDL marketing page) — replaces and deletes `ChallangeBankBanner.tsx`. Gated as a whole premium feature, always requires auth (needs `user_id`-scoped history regardless of tier).

### Backend / Frontend
Same admin-CRUD and public-read pattern as Cheat Sheets: `FlashcardPolicy`, `Actions/Flashcard/*`, `Admin/FlashcardController` + `Public/FlashcardController` (`index` for browsing, `study` for an unpaginated study-session set, capped e.g. at 300 cards), `POST /flashcards/{id}/review` to record known/unknown. Frontend: `app/flashcards/page.tsx` (deck browse), `app/flashcards/study/page.tsx` (flip-card session), `components/flashcards/{FlashcardDeck,Flashcard}.tsx`. Fix the existing dead links in `TheToolkitSection.tsx`/home `ToolkitSection.tsx` to point at `/flashcards`.

---

## 3. Exam Simulator

**Primarily a frontend/UX feature reusing the existing quiz engine — not a new content model.** Evidence: `QuizType` already seeds a `final` ("Final Exam Simulation") row; `Quiz.duration_seconds` already exists; and — confirmed by reading `QuestionCard.tsx`/`QuizPlayer.tsx` directly — **regular practice quizzes already show zero per-question feedback during play** (feedback only ever appears in `QuizResults`, after full submission). So "no feedback until the end" needs no new work at all.

### The one real backend gap: no pass/fail concept exists anywhere
Two small additive migrations:
- `quizzes.passing_score_percent` (nullable unsigned tinyint) — meaningful only when `quiz_type = final`.
- `quiz_attempts.passed` (nullable boolean) — **persisted at grading time**, not computed at read time, so an admin later editing `passing_score_percent` can't retroactively flip a student's already-shown result. `null` means "not applicable" (practice quiz), distinct from `false`.

`Actions/Quiz/GradeQuizAttempt.php` gets one addition: if the quiz has a `passing_score_percent`, set `passed = score >= passing_score_percent`. `QuizResource`/`QuizAttemptResource` expose both new fields. `PublicQuizController::index()` gets one additive `quiz_type` filter param (matching the existing filter pattern) so an exam-simulator browse view can query only `quiz_type=final`.

### Frontend: a variant inside the existing flow, not a fork
Branch inside `apps/web/app/quizzes/[id]/page.tsx` on `quiz.quiz_type?.name === "final"` — **not** a parallel route tree, and not the legacy static `/[state]/dmv-written-test` mock flow. New components: `components/exam/ExamPlayer.tsx` (reuses `QuestionCard` unmodified, adds a countdown `ExamTimer` bound to `duration_seconds` that auto-submits at zero, and disables backward navigation — flagging that last part as a product decision to confirm, since today's `QuizPlayer` allows free Previous/Next), `components/exam/ExamResults.tsx` (a clear PASS/FAIL hero driven by `attempt.passed`, reusing the same per-question review list as `QuizResults`). An optional `app/exam-simulator/page.tsx` landing page (just `/quizzes?quiz_type=final` with exam-specific framing) gives `TheToolkitSection.tsx`'s "Mock Exams"/"DMV Simulations" cards a real destination.

### Pass Guarantee tie-in
A completed `quiz_attempts` row where `quiz_type = final` is exactly the queryable evidence `docs/SUBSCRIPTION_ROADMAP.md`'s planned `SubmitClaim` action (M8) needs for `completed_practice_at` — this doesn't need building now, just needs these two new columns to exist by the time that milestone is built.

---

## 4. AI Tutor

### Two modes — (a) ships first, has zero new-content dependency
**(a) Contextual answer explainer** — "why is this right/wrong," seeded with the specific question/chosen-answer/correct-answer/**already-existing** `explanation` text from `QuizQuestion`/`QuizAnswer`. The value-add isn't displaying that text (already partly shown via `QuestionCard`'s feedback) — it's letting the student ask interactive follow-ups ("explain more simply," "in Spanish"). This corrects `docs/ROADMAP.md` Phase 7's original framing: only mode (b), not the whole AI Tutor, was ever actually blocked on the 5GB dataset import.

**(b) Open-ended chat tutor** — freeform driving-law Q&A. Ships after Cheat Sheets has real (even modestly-sized, hand-authored) content to ground answers in, per Phase 7's own stated risk of confidently-wrong legal answers without real grounding.

### Data model
- **`ai_tutor_conversations`**: `user_id` (FK, **not nullable** — auth required, both for cost control and because this is a paid feature), `mode` enum(`contextual`|`open_chat`), `quiz_question_id`/`quiz_attempt_id` (nullable, `nullOnDelete` — a conversation has independent value as chat history even if the triggering question is later edited), `language` (default `en`), `last_message_at`.
- **`ai_tutor_messages`**: `ai_tutor_conversation_id` (cascadeOnDelete), `role` enum(`user`|`assistant`), `content`, `input_tokens`/`output_tokens`/`model` (nullable, for cost tracking).

### Retrieval for mode (b): MySQL FULLTEXT, not a vector DB
A `FULLTEXT` index on `cheat_sheet_sections.heading`/`body_markdown`, queried via `MATCH...AGAINST`, scoped by the user's state/category where possible. This matches the actual dataset size (a cheat-sheet library, not millions of documents) and the existing stack (MySQL, no vector DB provisioned) — semantic/embedding search is a real future upgrade path, not a v1 requirement.

### Backend
- `config/services.php` → `anthropic.api_key`/`anthropic.model` (env-driven, default `claude-opus-4-8` — never silently downgraded to a cheaper model for cost reasons; that's the user's call, exposed as a config value, not a default this plan picks).
- `app/Services/AiTutor/ClaudeClient.php` — thin wrapper around the official `anthropic-ai/sdk` PHP package (`composer require anthropic-ai/sdk`), so Actions never touch the SDK directly. Exact SDK method/class syntax should be re-verified against the current Anthropic PHP SDK docs at build time rather than assumed now.
- `Actions/AiTutor/{BuildSystemPrompt,ExplainAnswer,AskTutorQuestion,SearchCheatSheetContent}.php`. The system prompt: scope-restricts to driving/DMV topics, includes a mandatory "study aid, not official DMV guidance" instruction (**backed by a persistent UI disclaimer too** — not relying on the model alone), and a `"Respond in {language}."` instruction for multi-language support (no separate translation pipeline needed).
- **Cost controls** (this is the one feature area with a real per-request dollar cost, unlike everything else in the app): route-level burst throttle (`throttle:20,1`, matching the existing `storeAttempt` precedent) **plus** an Action-level daily message cap per user; `max_tokens` capped per mode. **Recommend zero free-tier usage** — no trial messages — given the real cost per call; non-premium entry points show a static example instead of hitting the live API.
- Routes (auth-only, never guest-accessible): `POST /ai-tutor/explain`, `POST /ai-tutor/conversations`, `POST /ai-tutor/conversations/{id}/messages`, `GET /ai-tutor/conversations[/{id}]`, `DELETE /ai-tutor/conversations/{id}`.

### Frontend
`components/ai-tutor/{TutorChatWindow,ExplainAnswerButton}.tsx` — the explain button wires into `QuestionCard`/`QuizResults`/`ExamResults` (only shown post-submission, when feedback is already visible). `app/ai-tutor/page.tsx` for the open-chat mode (conversation list + chat window + language picker). Gated by auth + the same interim premium-check pattern as the other three features.

---

## 5. Cross-cutting

### Access-level matrix (extends `docs/SUBSCRIPTION_ROADMAP.md` §1's categorical guest/free = No)

| Feature | Guest/Free: pre-paywall visibility | Guest/Free: real use | Premium | Admin |
|---|---|---|---|---|
| Cheat Sheets | Title/summary/cover for all; full sections+PDF only for the ~1-per-state/category kept free as a teaser | No for premium-flagged sheets | Full access | Full + CRUD |
| Flashcards | Deck list + counts; card fronts for a small free-flagged subset (~10%); backs withheld | Can't flip/study premium cards | Full study, progress tracked | Full + CRUD |
| Weak Spots | N/A — gated as a whole, always requires auth | No | Full access | Full access |
| Exam Simulator | Title/count/duration/cover visible (unchanged `QuizPolicy::view()`) | Can't start the timed attempt | Full attempt + pass/fail | Full + CRUD |
| AI Tutor | Static example only, zero live API calls | No | Full access, subject to daily cap | Full access, still subject to the cost cap (no exemption, unlike content access) |

### Phased build sequence
Cheat Sheets, core Flashcards, Exam Simulator, and AI Tutor mode (a) are all independent of each other and of the 5GB dataset import — all four can start now with hand-seeded placeholder content.

1. **W0 (parallel, no dependencies)**: Exam Simulator's two-column backend gap; Cheat Sheets backend + a few hand-seeded sheets; Flashcards backend + a few dozen hand-seeded cards; AI Tutor mode (a) backend (needs an `ANTHROPIC_API_KEY` + model choice decided first).
2. **W1**: Frontend for all four W0 items.
3. **W2**: Weak Spots (needs `docs/ROADMAP.md` Phase 4's basic missed-question query + the Flashcards UI component from W1).
4. **W3**: AI Tutor mode (b) (needs Cheat Sheets' content from W0/W1 to ground on).
5. **Ongoing, independent of the above**: swap each feature's interim `is_premium` policy gate for `EntitlementResolver::hasFeature(Feature::X)` whenever `docs/SUBSCRIPTION_ROADMAP.md` M1–M2 lands — a one-line change per policy, not a redesign.

Optional but recommended: build a minimal `EntitlementResolver`/`Feature` enum stub (resolving everyone to guest/free/admin only) *before* writing these four policies, since its shape is already fully specified in the subscription roadmap — removes the need for the interim fallback pattern everywhere. Not a blocker either way.

---

## Verification plan
- **Backend**: Pest/PHPUnit tests per policy (`CheatSheetPolicy`, `FlashcardPolicy`, `AiTutorPolicy` — teaser-visible vs. locked-full for guest/free/premium/admin), a `GradeQuizAttempt` test asserting `passed` is computed and persisted correctly (including the `null`-when-no-threshold case), a `WeakSpotsController` test confirming its response matches the public Flashcard JSON shape exactly.
- **PDF**: generate a cheat sheet with 2–3 sections, hit `/download`, confirm the PDF renders and that editing a section clears the cached media so the next download regenerates.
- **AI Tutor**: manually verify mode (a) against a real quiz question (confirm it grounds on the stored `explanation` text and respects the daily cap), verify the safety disclaimer appears in both the system prompt behavior and the UI, verify a non-English `language` value changes the response language.
- **Exam Simulator**: manually take a `quiz_type=final` quiz to timeout, confirm auto-submit fires and the pass/fail result matches `passing_score_percent`.
- **Frontend**: browser walkthrough of each new page as a guest, a free user, and a premium user (once the subscription module exists) to confirm the teaser/locked boundaries in the access matrix above actually hold.
