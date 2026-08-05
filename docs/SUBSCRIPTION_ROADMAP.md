# Subscription / Premium-Access Module — Complete Roadmap

Detailed implementation roadmap for `docs/ROADMAP.md`'s Phase 5 ("Monetization — subscriptions/paywall"). Written after auditing the reference product (driving-tests.org/premium) and the current codebase in full — this fills in the seam that Phase 2's `QuizPolicy` was deliberately built to leave open, rather than inventing new architecture.

## Status: implemented (M1–M9 complete)

Every milestone in §6 is built and backend-verified (157/157 automated tests, including signed Stripe webhook simulation) and frontend-verified (clean typecheck/lint across every new file, plus a real browser walkthrough of the guest → free-user paywall path). See **§8 "Implementation notes"** below for where the real build diverged from this plan, and **§9 "Testing steps"** for exactly how to re-verify it, including the one thing that still needs a human: actually completing a Stripe test-mode checkout in a browser.

Real Stripe **test-mode** price IDs already exist for `weekly`/`monthly`/`lifetime_family` (created via `php artisan billing:sync-plans`, see §8) — checkout works against your real Stripe test account today, not a mock.

## Context

The app currently has no working monetization: `Quiz.is_premium` exists as a column but is never enforced (`QuizPolicy::view()` only checks `is_active`), so every quiz — premium-flagged or not — is fully playable by anyone, including anonymous guests. The frontend already has a fully-built but non-functional `/pricing` page (Learner/Pro/Teams, no working buttons) and several decorative paywall components (`PremiumDialog`, `PremiumBanner`, lock-icon badges) that don't check anything real. No payment package is installed.

The goal is to close that gap completely: implement real subscription plans modeled on driving-tests.org/premium's structure (Free / Weekly / Monthly / Lifetime-Family), enforce access server-side everywhere premium content is gated, and give the product a self-service billing flow (checkout, cancel, invoices) plus the operational workflow needed to run a real money-back "Pass Guarantee."

**Decisions locked in (confirmed with the user):**
1. Replace `/pricing` entirely with **Free / Weekly / Monthly / Lifetime-Family** — drop the existing Learner/Pro/Teams per-seat concept.
2. **Original branding throughout** — no "Challenge Bank™," "DMV Genie," etc. Functional parity with the reference site, not copied names/copy. (This also means fixing `PremiumDialog.tsx`'s current copy, which already has a "Challenge Bank™" reference leaked in from the old design — a live instance of the exact problem `docs/ROADMAP.md` Phase 1 already flagged for the CDL page.)
3. Build the **Pass Guarantee refund workflow for real** (claim submission, server-verified eligibility, admin review, Stripe refund) — not just marketing copy.
4. **Laravel Cashier + Stripe** for billing, as already earmarked in `apps/api/docs/ARCHITECTURE.md`.
5. **Mobile app billing is out of scope.** `apps/mobile` isn't wired to the API at all yet (that's the separate, later Phase 9 in `docs/ROADMAP.md`) — Apple/Google IAP is a distinct compliance/technical topic to scope once mobile is connected. The design below keeps the entitlement system provider-agnostic enough not to block that later.

---

## 1. Access-level matrix

This is the core access-control spec — every tier crossed against every gated capability. All paid tiers unlock identical features (matching the reference site), which is why the matrix collapses into simple "premium vs not."

| Tier | Browse quizzes (incl. premium teaser) | Attempt free quizzes | Attempt premium quizzes | Exam simulator / cheat sheets / flashcards / AI tutor* | Ads shown | Priority support | Pass Guarantee eligible |
|---|---|---|---|---|---|---|---|
| Anonymous guest | Yes | Yes | No | No | Yes | No | No |
| Free registered user | Yes | Yes | No | No | Yes | No | No |
| Weekly subscriber (active) | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Monthly subscriber (active) | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Lifetime-Family owner | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Lifetime-Family member seat | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Subscriber, payment failed, within grace window | Yes | Yes | Yes (grace) | Yes (grace) | No | Yes | Yes |
| Expired / canceled / past-due beyond grace | Yes | Yes | No | No | Yes | No | No† |
| Admin (`is_admin=true`) | Yes | Yes | Yes (QA bypass) | Yes | No | N/A | N/A |

\* These four feature areas have no backend models yet (Phases 3/6/7 of the existing roadmap) — the entitlement system is built generically so wiring each one in later is a one-line check, not a redesign.
† A claim already submitted/approved before access lapses is unaffected; this only blocks *opening a new* claim post-expiry.

Owner vs. member seats on a Lifetime-Family plan are functionally identical on this matrix — they differ only in who can manage seats (invite/revoke is owner-only).

---

## 2. Database schema

### 2a. Cashier's own migration (published via `artisan vendor:publish`, never hand-edited)
Adds `stripe_id`, `pm_type`, `pm_last_four`, `trial_ends_at` to `users`; creates `subscriptions` and `subscription_items` tables. `User` gets `use Laravel\Cashier\Billable;` alongside its existing `HasApiTokens, HasFactory, Notifiable`. `is_admin` is untouched — subscription status and admin status stay on separate axes, per the principle already written into `docs/ROADMAP.md` Phase 5.

### 2b. New app-owned tables (additive migrations, following the existing dated-migration convention in `apps/api/database/migrations/`)

**`plans`** — decouples plan copy/price from Stripe so they can't silently drift apart.
`id, key (unique: free|weekly|monthly|lifetime_family), name, type (recurring|one_time), billing_interval (week|month|null), price_cents, stripe_price_id (nullable), stripe_product_id (nullable), max_seats (default 1, 3 for lifetime_family), is_active, sort_order, timestamps`

**`family_groups`** — the Lifetime-Family household.
`id, owner_user_id (FK users, restrictOnDelete), plan_id (FK plans), stripe_payment_intent_id (unique, nullable), max_seats (snapshot at purchase time), status (active|refunded), purchased_at, timestamps`

**`family_members`** — seats, including the owner as an explicit row.
`id, family_group_id (FK, cascadeOnDelete), user_id (FK users, nullable, unique — null until claimed), role (owner|member), invited_email, invite_token (unique), invite_status (pending|claimed|revoked), invited_at, claimed_at, timestamps`

**`pass_guarantee_claims`** — the refund workflow.
`id, user_id (FK users, restrictOnDelete), plan_id (nullable FK), family_group_id (nullable FK), status (submitted|under_review|approved|denied|refunded), completed_practice_at (server-computed, never client input), exam_date (nullable), proof_notes (text), admin_user_id (nullable), admin_notes, decided_at, refunded_at, stripe_refund_id, refund_amount_cents, timestamps`
Proof-of-failure uploads go through **Spatie Media Library** (already used for `Quiz`/`QuizQuestion` images) as a `PassGuaranteeClaim::MEDIA_COLLECTION_PROOF` collection, not a raw path column.

**`processed_stripe_events`** — webhook idempotency guard.
`id, stripe_event_id (unique), processed_at`

### 2c. One additive migration against Cashier's own table
Adds a nullable `past_due_since` timestamp to Cashier's `subscriptions` table — stamped/cleared by webhook handlers, drives the grace-period window.

### 2d. New Enums (`apps/api/app/Enums/`, matching the existing native-PHP-enum style of `AttemptStatus`/`TestTrack`)
`PlanType`, `BillingInterval`, `PassGuaranteeClaimStatus`, `EntitlementTier` (guest, free, weekly_subscriber, monthly_subscriber, lifetime_family_owner, lifetime_family_member), `EntitlementStatus` (active, grace_period, expired), `Feature` (premium_quiz, exam_simulator, cheat_sheets, flashcards, ai_tutor, ad_free, priority_support, pass_guarantee).

---

## 3. Backend architecture

### Entitlement resolver — the single source of truth
New `app/Services/Entitlement/EntitlementResolver.php` (constructor-injected, matching the existing DI pattern like `GradeQuizAttempt`) turns `?User` into an `Entitlement` readonly DTO (`tier`, `status`, `accessUntil`, `familyGroupId`) with an `isPremium()` and `hasFeature(Feature)` method. Resolution order: null user → guest; `is_admin` → QA bypass (treated as premium); active claimed `family_members` row → family tier; Cashier `subscription('default')` valid → weekly/monthly by matching `stripe_price` to `plans.stripe_price_id`; `past_due` within `past_due_since + grace_days` → still premium but `grace_period` status; else → free/expired.

`hasFeature()` checks per-feature (not one blanket boolean) specifically so that if plans ever diverge in what they unlock, only this method's mapping changes — no call site needs touching.

### `QuizPolicy` extension — the existing, intended seam
```php
// apps/api/app/Policies/QuizPolicy.php
public function view(?User $user, Quiz $quiz): bool
{
    return $quiz->is_active; // unchanged — teaser (title/count/cover) stays visible to everyone
}

public function attempt(?User $user, Quiz $quiz): bool
{
    if (! $quiz->is_active) return false;
    if (! $quiz->is_premium) return true;
    return $this->entitlement->resolve($user)->hasFeature(Feature::PremiumQuiz);
}
```
`apps/api/app/Http/Controllers/Api/V1/Public/QuizController.php`: `storeAttempt()` swaps its `authorize('view', $quiz)` call to `authorize('attempt', $quiz)` — this is the real hard gate. `show()` keeps `authorize('view', ...)` for the teaser, but additionally checks `Gate::allows('attempt', $quiz)`: if premium and not entitled, **omit the `questions` array** (return `locked: true` instead). This closes a real gap found during research — `show()` currently returns full question+answer text (minus correctness) to anyone for *any* quiz, premium or not.

Guests need no special-casing: `resolve(null)` naturally returns guest/expired, so they fail the same check path as an expired user — no separate guest branch to maintain.

### Cashier / Stripe integration
- `composer require laravel/cashier`, publish config + migrations, `.env`: `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`.
- **Weekly/Monthly (recurring)**: `$user->newSubscription('default', $plan->stripe_price_id)->checkout([...])` — Stripe Checkout Session in `subscription` mode. Cashier's own webhook sync handles the `subscriptions` row automatically.
- **Lifetime Family (one-time)**: `$user->checkout([$plan->stripe_price_id => 1], ['mode' => 'payment', ...])` — Checkout Session in `payment` mode; our own `checkout.session.completed` handler creates the `family_groups`/`family_members` rows (Cashier doesn't track one-off purchases).
- New `app/Actions/Billing/` classes following the existing thin-controller → Action convention (e.g. `Actions/Quiz/GradeQuizAttempt.php`): `CreateCheckoutSession`, `HandleCheckoutSessionCompleted`, `MarkSubscriptionPastDue`, `ClearSubscriptionPastDue`, `InviteFamilyMember`, `ClaimFamilyInvite`, `RevokeFamilyMember`. Plus `app/Actions/PassGuarantee/`: `SubmitClaim`, `ReviewClaim`, `IssueRefund`.
- **Webhook**: `POST /v1/stripe/webhook` (outside `auth:sanctum`) → `StripeWebhookController extends Laravel\Cashier\Http\Controllers\WebhookController`, signature-verified automatically by Cashier's middleware once `STRIPE_WEBHOOK_SECRET` is set. Every handler checks/inserts into `processed_stripe_events` first (Stripe delivery is at-least-once, not exactly-once). Side effects (emails) are queued jobs, not inline — handlers must return fast.
- **New routes** (`apps/api/routes/api.php`, following the existing flat `Api\V1\*` convention used by `QuizAttemptController` for "authenticated, not admin, not fully public" endpoints):
  ```
  GET  /v1/plans                                   (public, mirrors states/vehicle-types)
  POST /v1/billing/checkout                         (auth, throttle:10,1)
  GET  /v1/billing/subscription                     (auth — thin wrapper around EntitlementResolver)
  POST /v1/billing/subscription/cancel               (auth)
  GET  /v1/billing/invoices                          (auth)
  GET  /v1/billing/portal                             (auth — Stripe Customer Portal redirect)
  GET  /v1/billing/family, POST .../invite, DELETE .../members/{id}, POST .../claim
  GET  /v1/pass-guarantee/eligibility, POST/GET /v1/pass-guarantee/claims
  admin: GET/approve/deny/refund on pass-guarantee-claims, GET admin/subscriptions
  POST /v1/stripe/webhook                            (no auth, Cashier signature middleware)
  ```
- **`apps/api/app/Http/Resources/Api/V1/Auth/UserResource`** (or wherever `AuthController::me` builds its response): add a nested `entitlement: { tier, status, access_until }` sourced from `EntitlementResolver`, so the existing `/me`-on-mount flow the frontend already uses gets entitlement for free — no extra request.

### Grace period & cancellation behavior
Failed payment doesn't cut access immediately: `invoice.payment_failed` stamps `past_due_since`; `EntitlementResolver` keeps treating the user as premium (`grace_period` status) for `config('billing.past_due_grace_days')` (default 3) days, after which Stripe's own retry/dunning logic eventually cancels the subscription and Cashier's normal sync flips it — no extra code needed past that point. Cancellations use Cashier's `cancel()` (not `cancelNow()`) so access continues until period end, matching "cancel anytime, still works until the period you paid for ends."

### Pass Guarantee claim workflow
`submitted` (user; `SubmitClaim` re-verifies eligibility **server-side** — queries `quiz_attempts.user_id` rows only, never `guest_token` since that's client-controllable and there's no guest-history-claiming flow built yet) → `under_review` → `approved`/`denied` (admin, reusing the existing `admin` middleware) → `refunded` (a deliberately separate step from approval, via Stripe's Refunds API, since the refund call can fail independently and needs its own retry path). One open/approved claim per billing period, enforced in `SubmitClaim`.

---

## 4. Frontend architecture

### Shared types (`packages/shared/src/`)
New `types/billing.ts`: `Plan`, `MySubscription`, `FamilyGroup`, `FamilyMember`, `PassGuaranteeClaim`, exported from `packages/shared/src/index.ts` alongside the existing `quiz`/`user`/`admin` modules. Extend `types/user.ts`'s `User` with a nested `entitlement` object. Billing errors reuse the existing `ApiError` (`.status`/`.errors`); paginated lists (invoices, claims) reuse the existing `PaginatedResponse<T>`.

### Entitlement wiring
`apps/web/lib/auth-context.tsx`: `AuthContextValue` gains `entitlement` (from `user.entitlement`, populated by the `/me` response) and a `useEntitlement()` hook (`{ tier, status, isPremium, hasFeature() }`). New `apps/web/components/billing/PremiumGuard.tsx`, structurally identical to the existing `components/admin/AdminGuard.tsx` (same loading/redirect shape) — gates premium-only routes as they're built.

### Pricing page — full replace
`apps/web/app/pricing/page.tsx`: four cards (Free / Weekly / Monthly "Most popular" / Lifetime Family) sourced from the new `GET /v1/plans` rather than hardcoded, so displayed pricing can never drift from what Stripe actually charges. Reuse the existing card/comparison-table structural pattern already in that file (`rounded-xl`/border/`Check`/`Minus` icons) with new copy — drop the unwired Monthly/Yearly toggle and the Teams per-seat column.

### Checkout flow
Plan buttons call `POST /v1/billing/checkout {plan_key}` → redirect to Stripe's hosted Checkout (confirmed simplest, keeps card data fully out of PCI scope — no Stripe Elements needed). New `app/billing/success/page.tsx` / `app/billing/cancel/page.tsx`; the success page briefly polls `GET /v1/billing/subscription` rather than assuming access is live the instant it renders (webhook delivery can lag the redirect).

### Real quiz flow — primary gating integration point
`apps/web/app/quizzes/[id]/page.tsx` / `components/quiz/QuizPlayer.tsx`: read `quiz.is_premium` + `useEntitlement()`. If premium and not entitled, render the paywall dialog instead of "Start test," and handle the backend's locked-teaser response (no `questions` array) with a locked preview card.

### Paywall components — fix, don't just relocate
`apps/web/components/state/quiz/PremiumDialog.tsx` → move to `apps/web/components/billing/PremiumDialog.tsx`, shared across the real and legacy quiz flows, with two concrete fixes: (1) its current default copy references "Challenge Bank™" — rewrite to original copy per the branding decision; (2) its CTA links to a dead `/premium` route — repoint to `/pricing`. The legacy `/[state]/dmv-written-test` flow's hardcoded `isPremiumUser = useState(false)` (in `components/state/quiz/QuizPlay.tsx`) should read real `useEntitlement()` instead. `components/state/StepCard.tsx`/`StepsFlow.tsx`'s existing `type: "free"|"premium"` + `locked` visual vocabulary (lock icon, badge, blur) is reused as-is once those pages get real data — no component changes needed now.

### Billing self-service settings
`apps/web/components/settings/SettingsLayout.tsx`'s `navItems` gains a "Billing" entry alongside the existing Profile/Security/Appearance. New `apps/web/app/settings/billing/page.tsx`: current plan/status/renewal date, a "Manage payment method & invoices" link to the Stripe Customer Portal (`GET /v1/billing/portal`), cancel button with confirm dialog, invoices table (reusing `components/ui/table.tsx`), and — only for Lifetime-Family owners — a seat roster + invite-by-email form.

### Admin visibility
New `apps/web/app/admin/pass-guarantee-claims/page.tsx`, wrapped in the existing `AdminGuard`, kebab-case matching the existing `admin/user-management`/`admin/quiz-categories` routes.

---

## 5. Security & reliability checklist

- **Webhook signature verification**: Cashier's built-in middleware, driven by `STRIPE_WEBHOOK_SECRET` — never disabled.
- **Idempotency**: `processed_stripe_events` table guards every handler; `family_groups.stripe_payment_intent_id` unique constraint guards the one-time-purchase path specifically.
- **Checkout double-submit**: Stripe idempotency key on Checkout Session creation.
- **Redirect-vs-webhook race**: success page polls `GET /v1/billing/subscription` rather than trusting its own render as proof of access.
- **No client-trust for entitlement**: `EntitlementResolver` runs fresh per request inside `QuizPolicy::attempt()`; Sanctum tokens **never expire** (`config/sanctum.php` → `'expiration' => null`), so subscription lapses cannot piggyback on token expiry — access must be checked live, every request. `useEntitlement()` on the frontend is UX-only, never the actual gate.
- **Rate limiting**: `POST /billing/checkout` throttled (`throttle:10,1`, matching the existing `storeAttempt` precedent). The webhook route itself is *not* throttled — Stripe retries aggressively on non-2xx for up to 3 days, and a false 429 there is lost revenue.
- **Refund-claim fraud**: one open claim per billing period; "completed all practice tests" re-verified server-side against real `quiz_attempts.user_id` rows only, never guest attempts.
- **PCI scope**: Stripe Checkout + Customer Portal only — raw card data never touches this app's server or client code.

---

## 6. Phased build sequencing

| # | Milestone | Status |
|---|---|---|
| M1 | Schema + Cashier install (migrations, seed `plans`, Stripe test-mode products/prices, `config/billing.php`) | ✅ Done |
| M2 | `EntitlementResolver` + `QuizPolicy::attempt()` + `QuizController` changes, unit-tested against active/grace/expired/family/admin fixtures | ✅ Done |
| M3 | Checkout + webhooks end-to-end | ✅ Done — built for all three paid plans directly (see §8, deviation #1), not Monthly-only first |
| M4 | Weekly + Lifetime-Family (one-time checkout, `family_groups`/`family_members` creation) | ✅ Done (folded into M3, same reason) |
| M5 | Frontend: `/plans` endpoint, rebuilt `/pricing`, `useEntitlement()`, `PremiumGuard`, fixed `PremiumDialog`, real gating wired into `/quizzes/[id]`, success/cancel pages | ✅ Done |
| M6 | Billing self-service: cancel, invoices, Customer Portal, `/settings/billing` page | ✅ Done |
| M7 | Lifetime-Family seats: invite/claim flow + emails, seat roster UI | ✅ Done |
| M8 | Pass Guarantee: claim submission + eligibility check, admin review queue + UI, refund issuance | ✅ Done |
| M9 | Admin visibility: extend `StatsController` with subscription/claim counts | ✅ Done |

Real build order was: backend for all of M1–M9 first (one continuous pass, verified with the full automated suite once), then frontend for M5–M9 on top of a confirmed-working API — a stronger safety property than the original per-milestone sequencing, since the entitlement resolver and every backend endpoint were proven correct before any UI was built against them.

---

## 7. Explicitly out of scope (future phases, not this roadmap)

- **Mobile IAP** (Apple/Google in-app purchases, RevenueCat or native) — blocked on `apps/mobile` being wired to the API at all (existing roadmap Phase 9). The entitlement design doesn't preclude adding a mobile receipt-validation path later.
- **Military/veteran discount, gift purchases** — minor marketing extras from the reference site (Stripe Coupons/promotion codes + a manual proof-verification queue for the discount; a redeemable-code flow for gifting). Straightforward to bolt on once M1–M6 are live, not required for a functioning subscription system.
- **Cheat sheets, flashcards, exam simulator, AI tutor content itself** — these are separate content-library features (existing roadmap Phases 3/6/7), already built in a separate pass — see `docs/CONTENT_LIBRARY_ROADMAP.md`. This roadmap only defined the `Feature` enum cases for them and made sure the entitlement system could gate them; `FlashcardPolicy`/`CheatSheetPolicy` were swapped from their interim `is_admin`-only gates to real `EntitlementResolver` checks as part of M2.

---

## 8. Implementation notes (deviations from this plan)

Real, deliberate differences between what's above and what actually shipped — read this before assuming the plan text is ground truth for how something works today.

1. **M3/M4 built together, all three plans at once.** The plan's own reasoning for going Monthly-first was incremental verification safety; since the real implementation was verified with one full automated test pass covering all plan types (not incremental manual testing), there was no benefit to the artificial split — `CreateCheckoutSession` branches on `Plan.type` (recurring vs. one-time) generically, so supporting all three plans cost nothing extra.
2. **Emails are sent synchronously, not queued.** `docs/SUBSCRIPTION_ROADMAP.md`'s original text says "side effects (emails) are queued jobs." Building this surfaced that **no queue worker runs anywhere in this app's deployment** (`docker/supervisord.conf` has no `queue:work` program, and no `app/Jobs` directory existed before this work) — a real job dispatched to the `database` queue would sit in the `jobs` table forever. `App\Mail\FamilyInviteMail` and `App\Mail\PassGuaranteeClaimDecidedMail` are sent with `Mail::to(...)->send(...)` directly inside their triggering Action. **If a queue worker is ever added to the deploy stack, revisit this** — swapping to `->queue()` at that point is a one-line change per call site.
3. **Idempotency is one central guard, not per-handler.** `App\Http\Controllers\Api\V1\StripeWebhookController::handleWebhook()` overrides Cashier's base method and does a single `insertOrIgnore` into `processed_stripe_events` keyed on the Stripe event ID before delegating to `parent::handleWebhook()` — every handler gets the guard for free, rather than each handler checking/inserting itself as the original prose suggested.
4. **`php artisan billing:sync-plans`** (`apps/api/app/Console/Commands/SyncStripePlans.php`) creates the real Stripe Products/Prices for any `plans` row missing a `stripe_price_id`, instead of manual Stripe Dashboard clicking. Idempotent — safe to re-run after adding a new plan row. This is how the real test-mode price IDs referenced in the Status section above were created.
5. **Pass Guarantee eligibility, concretized.** The original text left "completed all practice tests" vague. The real rule (confirmed with the user): eligible once the user has an active/family paid tier **and** at least one completed `quiz_attempts` row where `quiz_type = final` (an Exam Simulator attempt) — not every available exam, and not admin-judged. Enforced server-side in `App\Actions\PassGuarantee\SubmitClaim`, never trusting client-reported completion.
6. **Route/controller split**: `BillingController` (checkout/subscription/cancel/invoices/portal), `FamilyController` (roster/invite/claim/revoke), and `PassGuaranteeClaimController` ended up as three separate flat controllers under `Api\V1\*` rather than one large "billing" controller — matches this codebase's existing preference for narrow, single-domain controllers over grouping by high-level feature area.
7. **A real, pre-existing bug surfaced and got fixed during this work**: `EntitlementResolver::resolve()` crashed with a `TypeError` whenever it ran against a `User` model whose `is_admin` hadn't been explicitly loaded in memory (e.g. immediately after `User::query()->create([...])` in `AuthController::register()`, which never sets `is_admin` — Eloquent doesn't reflect the `users.is_admin` DB-level `default(false)` back onto the in-memory instance that triggered the insert). This meant **registration itself was broken** the moment `EntitlementResolver` got wired into `UserResource`. Fixed with an explicit `(bool)` coercion in `EntitlementResolver::resolve()` — worth remembering if a similar "freshly-created, unrefreshed model" pattern shows up elsewhere.

---

## 9. Testing steps

### Automated (run first, should always be green before manual testing)

```bash
cd apps/api && php artisan test                 # full backend suite, 157+ tests
cd apps/web && pnpm build                        # typecheck, all routes must compile
cd apps/web && pnpm lint                         # new billing files must be clean
                                                  # (pre-existing unrelated lint debt in
                                                  # marketing pages is a separate, known issue)
```

Key automated coverage to know about if something regresses:
- `apps/api/tests/Unit/EntitlementResolverTest.php` — full access-matrix (guest/free/weekly/monthly/family owner+member/past-due grace/expired/admin).
- `apps/api/tests/Feature/Quiz/QuizEntitlementGatingTest.php`, `Flashcard/FlashcardBrowsingTest.php`, `CheatSheet/CheatSheetBrowsingTest.php` — HTTP-level premium gating including a real active-subscriber case, not just admin bypass.
- `apps/api/tests/Feature/Billing/StripeWebhookTest.php` — webhook payloads are **really HMAC-signed** with a test secret and POSTed through Cashier's actual `VerifyWebhookSignature` middleware (see `Tests\Concerns\SignsStripeWebhooks`), not stubbed — covers subscription created/updated/deleted, `past_due_since` stamping/clearing, one-time `checkout.session.completed` → `family_groups` creation, and duplicate-event-id idempotency.
- `apps/api/tests/Feature/Billing/{BillingControllerTest,FamilyControllerTest,PassGuaranteeClaimControllerTest}.php`, `tests/Feature/Admin/PassGuaranteeClaimAdminTest.php`, `tests/Feature/Admin/StatsTest.php`.
- Genuinely untested by the automated suite (real Stripe network calls with no interceptable seam — see Action/controller container-swap pattern used for `CreateCheckoutSession`/`IssueRefund` where one exists): `Subscription::cancel()`'s actual Stripe update, `billingPortalUrl()`'s actual Stripe call. Covered by the manual walkthrough below instead.

### Manual — full golden path in a browser

Prerequisite: `STRIPE_KEY`/`STRIPE_SECRET` set in `apps/api/.env` (already done), plans synced (`php artisan billing:sync-plans`, already done — re-run if you add a new plan row).

1. Start both servers: `cd apps/api && php artisan serve --port=8001`, `cd apps/web && pnpm dev`.
2. **(Recommended)** In a third terminal: `stripe listen --forward-to localhost:8001/api/v1/stripe/webhook`, then copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `apps/api/.env` and restart `artisan serve` — without this, webhooks aren't signature-verified locally (Cashier's `VerifyWebhookSignature` middleware only activates when a secret is configured) and won't reach your local API at all, since Stripe can't call `localhost` directly.
3. As a **guest**: visit `/pricing` — confirm four real plan cards (Free/Weekly/Monthly/Lifetime Family) with live prices, not hardcoded ones. Visit a `is_premium=true` quiz — confirm the locked paywall renders, not the questions.
4. **Register** a free account, verify email (Mailtrap inbox, since `MAIL_MAILER=smtp` points there). Confirm the same premium quiz is still locked for a logged-in free user.
5. From `/pricing`, click **Monthly** — confirm redirect to a real Stripe Checkout page (not a 404/error). Pay with the test card `4242 4242 4242 4242`, any future expiry, any CVC.
6. Confirm redirect to `/billing/success`, which polls until `GET /billing/subscription` reports `is_premium: true`, then shows the confirmation.
7. Revisit the premium quiz — confirm it's now unlocked (full questions returned, not the locked teaser).
8. Visit `/settings/billing` — confirm it shows `Monthly`, `active` status, an invoice row, and a working "Manage payment method & invoices" link (Stripe Customer Portal).
9. Click **Cancel subscription**, confirm — confirm the UI shows access continues until period end, and re-fetching `/settings/billing` reflects `canceled: true` with an `ends_at` date.
10. **Lifetime-Family**: from a second (or the same) account, purchase Lifetime Family. Confirm `/settings/billing` shows a seat roster with yourself as owner. Invite a second email — confirm a Mailtrap email arrives with a `/family/claim/{token}` link. From a **different** logged-in account, open that link and confirm the seat claims successfully and that account now has premium access. As the owner, revoke that seat and confirm the revoked account loses premium access on its next request (no caching — entitlement is resolved fresh every request).
11. **Pass Guarantee**: as a premium user, complete a `quiz_type=final` (Exam Simulator) quiz attempt, then visit `/pass-guarantee` — confirm eligibility flips to true and the claim form appears. Submit a claim. As an **admin**, visit `/admin/pass-guarantee-claims`, approve it, then issue the refund — confirm the status flow (`submitted` → `approved` → `refunded`) and that a real refund appears against the original charge in the Stripe test Dashboard.
12. **Cross-check**: at any point, confirm `GET /v1/billing/subscription` and the `entitlement` block on `GET /v1/me` report the same tier/status — they read the same `EntitlementResolver` call, so a mismatch means a caching bug got introduced somewhere.
