# Driving Test App — Roadmap

Forward-looking plan from current state to a production-ready app. See [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) for the page-by-page migration log of what's already built (auth, admin CRUD for quiz content, Home/CDL/Dashboard/Settings pages).

This plan intentionally goes beyond a bare-bones quiz app — the reference product in this space (driving-tests.org) has real depth (video content, an AI assistant, a real cheat-sheet library, adaptive testing) and this roadmap accounts for all of it, using original features and names throughout rather than borrowing anything from that site.

Nothing below is implemented yet. Each phase gets its own focused implementation plan when it's picked up — this file tracks sequencing and status only.

## Where things stand today

- Monorepo (pnpm + Turborepo), Laravel 13 API with Sanctum auth, Next.js 16 web app.
- API is versioned (`/api/v1`), layered (thin controllers → Actions → API Resources), and documented in [`apps/api/docs/ARCHITECTURE.md`](../apps/api/docs/ARCHITECTURE.md). Images go through Spatie Media Library rather than hand-rolled path columns.
- Admin CRUD exists for `QuizCategory` / `Quiz` / `QuizQuestion` / `QuizAnswer`, plus `State` / `VehicleType` / `QuizType` models. The public quiz-taking engine (Phase 2) is **backend-complete** — browse, take, and get a guest or authenticated attempt graded server-side all work end-to-end — but there's no frontend for it yet.
- Dev seed data exists: 50 states + DC, 3 vehicle types, 2 quiz types, 4 categories, and two real sample quizzes (CA traffic laws + road signs, 8 and 6 questions) so the API is exercisable without the real dataset.
- ~5GB of the user's own driving-test question data (JSON + images, per state) sits on another machine, not yet imported.
- No CI/CD or deployment configuration yet.

## Phase 1 — Content cleanup

- [ ] `apps/web/app/[state]/cdl/page.tsx` carries over content that appears copied from driving-tests.org (a company credit and a named reviewer bio from the old Vue app) — replace with original copy/reviewers before this page is public.
- [ ] Same page hardcodes a "Active learners today: 33" live-activity counter — decide deliberately whether to wire this to a real count (even if modest early on) or remove it; shipping a fabricated engagement number by default is a dark-pattern risk worth a conscious call, not an accident.

## Phase 2 — Public quiz-taking engine

The core product mechanic: browse a quiz, take it, get scored, review answers. Everything else depends on this existing.

**Backend done; frontend is the only thing left.** See [`apps/api/docs/PHASE_2_QUIZ_ENGINE.md`](../apps/api/docs/PHASE_2_QUIZ_ENGINE.md) for the API reference (endpoints, request/response shapes, verification), or [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md#phase-5--backend-quiz-taking-engine--architecture-restructure) for the narrative log of how it was built.

- [x] `quiz_attempts` + `quiz_attempt_answers` tables (`user_id` nullable so guests can take tests too, matching a "no registration required" free tier; `guest_token` added so a guest's history can be claimed on registration later)
- [x] Public `Api\V1\Public\QuizController` (`index` / `show` / `storeAttempt`) — `show` hides correct answers pre-submission, `storeAttempt` grades server-side
- [x] `Api\V1\QuizAttemptController` for logged-in users' attempt history
- [ ] Web quiz-taking flow (`/quizzes`, `/quizzes/[slug]`): stepper → submit → results + review
- [x] Dev seed data (no quiz rows exist in the DB yet)

## Phase 3 — Question bank ingestion (the 5GB dataset) & content library

Three distinct content types, not just "images" — each has different storage/delivery needs:

- [ ] **Question data**: idempotent Artisan import command for the JSON question/answer data, upserted into the existing relational schema
- [ ] **Images**: S3-compatible object storage (Cloudflare R2 suggested) behind a CDN — never into git or the DB. Check for duplication across states before finalizing storage sizing (road-sign images are often federally standardized and may repeat)
- [ ] **Video/audio** (hazard-perception clips, simulated-driving footage, narration): treat as its own asset type, not another file in the image bucket — a streaming-oriented store (e.g. Cloudflare Stream, or R2 + HLS packaging) rather than a plain CDN file, since these need adaptive bitrate/seeking rather than a single static download
- [ ] **Road-sign / rules study mode**: a browse-to-learn flashcard-style feature (sign image + meaning), separate from being tested on signs inside a scored quiz — its own small data model (sign name, image, category, explanation) rather than shoehorned into `quiz_questions`
- [ ] Replace the CDL page's hardcoded `TestSteps` mock data with real quizzes once loaded; build the car/motorcycle equivalent

## Phase 4 — Progress tracking & "missed questions" review

- [ ] Dashboard view of attempt history / per-category scores over time
- [ ] "Review what you got wrong" flow, querying Phase 2's attempt-answer data for `is_correct = false` rows
- [ ] **Later enhancement, separate from the above**: real-time adaptive question selection *during* a test (picking harder/easier next questions based on live performance, not just reviewing after the fact) — meaningfully more complex than retrospective review, sequence after the basic version has shipped and been used for a while

## Phase 5 — Monetization (subscriptions/paywall)

**Done.** Full Free/Weekly/Monthly/Lifetime-Family subscription system, real Stripe Checkout + webhooks, self-service billing, Lifetime-Family seat invites, and a real Pass Guarantee refund workflow. See [`docs/SUBSCRIPTION_ROADMAP.md`](./SUBSCRIPTION_ROADMAP.md) for the full design, what shipped vs. the original plan (§8 "Implementation notes"), and how to test it end-to-end (§9 "Testing steps").

Access control kept its two independent axes as planned — `User.is_admin` (content-management access) and subscription/premium status via `EntitlementResolver` (paid-content access) never merged into one "role" field.

- [x] Laravel Cashier + Stripe integration
- [x] Checkout session + webhook endpoints
- [x] Upgrade/upsell UI wherever `is_premium` gates content (`PremiumGuard`, `PremiumDialog`, locked-teaser paywalls on quizzes/flashcards/cheat sheets)
- [x] Billing self-service (`/settings/billing`: cancel, invoices, Stripe Customer Portal)
- [x] Lifetime-Family seat invites + roster management
- [x] Pass Guarantee claim submission, admin review, and refund issuance
- [x] Admin billing visibility (subscriber/claim counts on the stats dashboard)

## Phase 6 — Cheat sheets, handbook content & full SEO rollout

- [ ] `cheat_sheets` table/pages (state × category) — a proper content library (multiple sheets per endorsement/category, matching the CDL page's existing endorsement breakdown), not just a handful of pages
- [ ] Downloadable PDF export/generation for handbook summaries, not web-only
- [ ] Sitemap generation across states × vehicle types × categories
- [ ] Admin quiz-management pages on the web frontend (API already exists; deferred in original migration)

## Phase 7 — AI study assistant (optional / stretch)

A chat-style Q&A feature grounded in the state handbook/question content loaded in Phase 3. Sequenced after Phase 3 deliberately: an assistant answering driving-law questions needs real content to ground its answers in, or it risks confidently giving wrong legal/safety information — a real risk in this domain, not just a quality issue.

- [ ] Retrieval layer over the imported handbook/cheat-sheet content (Phase 3/6), so answers cite real source material rather than relying on model knowledge alone
- [ ] Chat UI (web first; mobile once Phase 9 exists)
- [ ] Clear disclaimers that answers are study aids, not official DMV guidance

## Phase 8 — Trust content & support

Lighter engineering, mostly content — sequence opportunistically alongside other phases.

- [ ] Testimonials section, populated with real user-submitted testimonials (not fabricated ones)
- [ ] Help Center / FAQ pages

## Phase 9 — Mobile app wiring

- [ ] Connect `apps/mobile` to the public API from Phase 2 via `packages/shared`
- [ ] Port auth flow + quiz-taking screens to mobile

## Phase 10 — Infra, CI/CD, deployment

- [ ] CI (typecheck/lint/tests on PRs)
- [ ] Deployment target for the API and for web
- [ ] Environment/secrets management
- [ ] Backups for the database and the object storage bucket from Phase 3

## Suggested dependency order

Phases 1 → 2 first — almost everything else depends on them. 3 and 4 can run in parallel once 2 is done. 5 and 6 depend on 2 (6 partly on 3 for real content). 7 depends on 3 (needs real content to ground answers in) and is optional — slot it in whenever, or skip it. 8 is independent and light — fit it in opportunistically. 9 depends on 2 being stable (mobile shouldn't be built against a moving API target). 10's CI piece can start anytime; deployment waits until there's something worth deploying.
