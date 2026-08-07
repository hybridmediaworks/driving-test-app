# Driving Test App — Roadmap

Forward-looking plan from current state to a production-ready app. See [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) for the page-by-page migration log of what's already built (auth, admin CRUD for quiz content, Home/CDL/Dashboard/Settings pages).

This plan intentionally goes beyond a bare-bones quiz app — the reference product in this space (driving-tests.org) has real depth (video content, an AI assistant, a real cheat-sheet library, adaptive testing) and this roadmap accounts for all of it, using original features and names throughout rather than borrowing anything from that site.

Nothing below is implemented yet. Each phase gets its own focused implementation plan when it's picked up — this file tracks sequencing and status only.

## Where things stand today

- Monorepo (pnpm + Turborepo), Laravel 13 API with Sanctum auth, Next.js 16 web app.
- API is versioned (`/api/v1`), layered (thin controllers → Actions → API Resources), and documented in [`apps/api/docs/ARCHITECTURE.md`](../apps/api/docs/ARCHITECTURE.md). Images go through Spatie Media Library rather than hand-rolled path columns.
- Admin CRUD exists for `QuizCategory` / `Quiz` / `QuizQuestion` / `QuizAnswer`, plus `State` / `VehicleType` / `QuizType` models. The public quiz-taking engine (Phase 2) is **backend- and frontend-complete** — browse, take, and get a guest or authenticated attempt graded server-side, at both `/quizzes/[id]` and the polished `/[state]/[test-slug]/quiz` player, all work end-to-end.
- Real seed data: 52 states, 3 vehicle types, 2 quiz types, categories driven by real imported content. Alabama + Alaska (car + motorcycle, both test tracks) are fully populated from the real crawled dataset — 320 quizzes, 4,663 questions, 110 videos/hazard-simulators (real thumbnails included — see below), 4 handbooks (with PDFs), 11 cheat sheets — see [`PHASE_3_CONTENT_PLATFORM.md`](./PHASE_3_CONTENT_PLATFORM.md). Motorcycle Driving Test has no question bank in the source data for either state (real DMV motorcycle road tests are in-person skills tests, not written) — that combination is genuinely video/simulator-only, not a gap.
- ~40GB of the user's own driving-test content (structured JSON per state/vehicle-type/test-type, mostly external media links plus some downloaded images/video) sits on another machine. The import pipeline is built and verified against 2 real states; the remaining ~50 states are a rerun of the same command, not new code.
- No CI/CD or deployment configuration yet.

## Phase 1 — Content cleanup

See [`PHASE_3_CONTENT_PLATFORM.md`](./PHASE_3_CONTENT_PLATFORM.md) — the car/motorcycle live-stats
item below is resolved: real `states/{code}/stats` endpoint, no fabricated numbers, live on the
`/[state]` hero and live-data sections for car and motorcycle. CDL is explicitly deferred to a
later pass and still has both items below outstanding.

- [ ] `apps/web/app/[state]/cdl/page.tsx` carries over content that appears copied from driving-tests.org (a company credit and a named reviewer bio from the old Vue app) — replace with original copy/reviewers before this page is public.
- [ ] Same page hardcodes a "Active learners today: 33" live-activity counter — the real endpoint (`GET /states/{code}/stats`) now exists and is already used by the car/motorcycle pages; wiring the CDL page to it is the same one-line change, just not done yet since CDL is out of scope for this pass.

## Phase 2 — Public quiz-taking engine

The core product mechanic: browse a quiz, take it, get scored, review answers. Everything else depends on this existing.

**Done, backend and frontend.** See [`apps/api/docs/PHASE_2_QUIZ_ENGINE.md`](../apps/api/docs/PHASE_2_QUIZ_ENGINE.md) for the API reference (endpoints, request/response shapes, verification), or [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md#phase-5--backend-quiz-taking-engine--architecture-restructure) for the narrative log of how it was built.

- [x] `quiz_attempts` + `quiz_attempt_answers` tables (`user_id` nullable so guests can take tests too, matching a "no registration required" free tier; `guest_token` added so a guest's history can be claimed on registration later)
- [x] Public `Api\V1\Public\QuizController` (`index` / `show` / `storeAttempt`) — `show` hides correct answers pre-submission, `storeAttempt` grades server-side
- [x] `Api\V1\QuizAttemptController` for logged-in users' attempt history
- [x] Web quiz-taking flow: `/quizzes/[id]` (browse-all) and `/[state]/[test-slug]/quiz` (per-state, resolves by slug) — both real: fetch real questions (never leak `is_correct` pre-submission), submit to `POST /quizzes/{id}/attempts`, render the real graded result
- [x] Dev seed data — real content for Alabama/Alaska (see Phase 3), generic stopgap content elsewhere pending the full import

## Phase 3 — Question bank ingestion (the 40GB dataset) & content library

Detailed implementation plan: [`PHASE_3_CONTENT_PLATFORM.md`](./PHASE_3_CONTENT_PLATFORM.md) —
schema (`quiz_question_assets`, `videos`, `states` marketing fields), the crawled-data import
pipeline, storage/dedup strategy, and the car/motorcycle `/[state]` frontend wiring that consumes
it. CDL is deferred to a later pass.

Three distinct content types, not just "images" — each has different storage/delivery needs:

- [x] **Question data**: idempotent `content:import` Artisan command (5 focused Actions), verified against the real crawled dataset for Alabama + Alaska, car + motorcycle, both test tracks — upserts into the existing relational schema, handles both the nested (Permit Test) and flat (Driving Test) JSON shapes the source actually uses, hash-caches fetched question images per URL, and produces a full summary/warning log. Remaining ~50 states are a rerun, not new code.
- [ ] **Images**: question images currently stay as real external URLs re-fetched and attached via Spatie Media Library on `local` disk in dev; S3-compatible object storage (Cloudflare R2) for production, plus the planned dedup-by-hash pass at full 40GB scale, is still an ops/scale task, not done
- [ ] **Video/audio**: real video/hazard-simulator metadata + external (YouTube/Vimeo) URLs are imported into a `videos` table, including real thumbnails (YouTube's deterministic CDN URL; Vimeo's own oEmbed endpoint — no fabricated images) — self-hosting/streaming infrastructure for the subset of real downloaded media is still not built
- [ ] **Road-sign / rules study mode**: still not built — the real Alabama/Alaska sample's `extra_support` data didn't include a discrete sign-by-sign dataset, so this is unblocked but unstarted
- [x] Real car + motorcycle `/[state]` pages, both Permit Test and Driving Test tracks: real phase ladder (`quiz_categories` → `quizzes`), real live stats, real per-test landing pages (copy now branches on the resolved quiz's actual `test_track` instead of always reading as a permit written test), real quiz player, real handbook cards, real video/simulator section for Driving Test (the only real practice content where a state/vehicle has no question bank, e.g. Motorcycle) — all sourced from the imported Alabama/Alaska data, verified end-to-end. See [`PHASE_3_CONTENT_PLATFORM.md`](./PHASE_3_CONTENT_PLATFORM.md).
- [ ] CDL equivalent — explicitly deferred; `apps/web/app/[state]/cdl/page.tsx` still uses its own hardcoded mock data

## Phase 4 — Progress tracking & "missed questions" review

- [ ] Dashboard view of attempt history / per-category scores over time
- [ ] "Review what you got wrong" flow, querying Phase 2's attempt-answer data for `is_correct = false` rows
- [ ] **Later enhancement, separate from the above**: real-time adaptive question selection *during* a test (picking harder/easier next questions based on live performance, not just reviewing after the fact) — meaningfully more complex than retrospective review, sequence after the basic version has shipped and been used for a while

## Phase 5 — Monetization (subscriptions/paywall)

**Done.** Weekly/Monthly/Lifetime-Family subscription system (the Free plan card was later removed — free access is still the fallback `EntitlementTier::Free` for any registered user with no subscription, it's just not a purchasable plan row anymore), real Stripe Checkout + webhooks, self-service billing, a 7-day card-required free trial on Weekly, Lifetime-Family seat invites, and a real Pass Guarantee refund workflow. See [`docs/SUBSCRIPTION_ROADMAP.md`](./SUBSCRIPTION_ROADMAP.md) for the full design, what shipped vs. the original plan (§8 "Implementation notes"), and how to test it end-to-end (§9 "Testing steps").

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
