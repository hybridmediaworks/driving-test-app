# Backend Architecture

Live reference for how `apps/api` (Laravel 13 + Sanctum) is structured. Versioning, the layering pattern, and Phase 2 (the public quiz-taking engine) are already implemented as described below — new work should extend this shape rather than diverge from it. See [`../../../docs/ROADMAP.md`](../../../docs/ROADMAP.md) for phase sequencing and product scope.

Reference: driving-tests.org's product surface (practice tests by license type × state, cheat sheets, hazard-perception/simulated-driving video, an AI assistant, progress tracking, premium tier) maps directly onto Phases 2–7 — nothing here invents new scope, it's a shape for what the roadmap already calls for.

## API versioning

All routes live under `/api/v1` (`routes/api.php`). Done specifically so a breaking change never has to land across multiple clients at once — mobile (Phase 9) and any future AI-assistant integration (Phase 7) will both consume this same contract.

```
routes/api.php
  Route::prefix('v1')->group(function () {
      // Public — guest-allowed, throttled
      Route::get('quizzes', ...);
      Route::get('quizzes/{quiz}', ...);
      Route::post('quizzes/{quiz}/attempts', ...);   // guests can take tests
      Route::get('cheat-sheets', ...);               // Phase 6, not yet built

      Route::middleware('auth:sanctum')->group(function () {
          Route::get('attempts', ...);                // "my history"
          Route::prefix('admin')->middleware('admin')->group(function () {
              Route::get('attempts', ...);             // every user's history, filterable
              // admin CRUD
          });
      });
  });
```

## Layering

Thin controllers, single-purpose Action classes for logic, API Resources for every response.

```
app/
  Actions/
    Quiz/
      GenerateUniqueSlug.php
      SyncQuizQuestionAnswers.php
      CreateQuizQuestion.php
      UpdateQuizQuestion.php
      GradeQuizAttempt.php        // pure grading logic — no HTTP, unit-testable
  Http/
    Controllers/Api/V1/{Admin,Auth,Public}/...
    Requests/Api/V1/{Admin,Public}/...
    Resources/Api/V1/
      Public/
        QuizResource.php
        QuizQuestionResource.php   // never leaks is_correct/explanation pre-submission
        QuizAnswerOptionResource.php
      Admin/
        QuizResource.php           // full detail — admins see is_correct/explanation
        QuizCategoryResource.php
        QuizQuestionResource.php
        QuizAnswerResource.php
        QuizTypeResource.php        // shared by QuizResource's nested quiz_type and the standalone endpoint
        StateResource.php
        VehicleTypeResource.php
      UserResource.php             // shared by Auth\{Auth,Profile}Controller
      QuizAttemptResource.php      // post-submission — correctness/explanation revealed here
      QuizAttemptAnswerResource.php
  Models/                          // stays flat — DDD folders are overhead at this scale
  Policies/
    QuizPolicy.php                 // Phase 5 added attempt() here for is_premium gating — view() stays untouched (teaser visibility)
  Enums/
    QuestionDifficulty.php
    TestTrack.php
    AttemptStatus.php
```

Controllers call one Action, wrap the result in a Resource, return. Keeping grading logic in `GradeQuizAttempt` rather than the controller is what lets Phase 4 ("review what you got wrong") and the later adaptive-testing enhancement reuse the same scoring rules instead of duplicating them.

Every response goes through an API Resource — never a raw Eloquent model, admin included. This is both the mechanism that hides `is_correct`/`explanation` before submission on public routes and the single place to reshape the contract per client later without touching business logic. Converting the Admin/Auth controllers off raw models (they briefly weren't, as an initial scoping call to limit risk while doing several other changes at once) also fixed a real bug it surfaced: `Quiz`/`QuizQuestion` serialization was leaking a raw `media` array — Spatie Media Library's internal model data (disk name, uuid, conversions, custom properties) — as an incidental side effect of `cover_image_url`/`image_urls` lazily loading and caching the `media` relation. Resources whitelist fields explicitly, so that leak is now structurally impossible, not just fixed once.

## Conventions (applied uniformly — no admin/public exceptions)

- **Pagination envelope**: every paginated endpoint returns Laravel's standard Resource-collection shape — `{"data": [...], "links": {first,last,prev,next}, "meta": {current_page,...}}`. Admin's list endpoints originally returned the raw `LengthAwarePaginator`'s flat shape instead (`current_page`/`data`/`links`-as-array at the top level, no `meta` wrapper) — a real inconsistency with the Public endpoints, not a deliberate design choice, fixed by switching to `XResource::collection($paginator)`. When a paginated collection needs to sit alongside sibling keys in a larger response (e.g. `QuizController::index`'s `quizzes` next to `categories`/`filters`), force the full envelope with `->response()->getData(true)` rather than embedding the paginator directly — embedding it bare only yields the item array, silently dropping `links`/`meta`.
- **Key casing**: snake_case everywhere in JSON, matching the DB columns (`quiz_category_id`, `cover_image_url`, etc.). `Admin\QuizController::index()` originally mixed conventions (`quizTypes`, `vehicleTypes` camelCase, inherited from the pre-decoupling Vue/Inertia frontend's JS-native naming) alongside otherwise-consistent snake_case — renamed to `quiz_types`/`vehicle_types`.
- **Lookup/dropdown lists stay plain arrays, not Resources, by design**: `Admin\QuizController::index()`'s `categories`/`quiz_types`/`states`/`vehicle_types` side-lists are deliberately lean, column-selected queries (`id`/`name`/`title` only), not the full `Admin\QuizCategoryResource` etc. used for the nested relation objects on a `Quiz`. This is not an inconsistency to fix — a dropdown has no use for a category's `created_at`/`description`, so keeping it a minimal projection is the more disciplined choice, not a shortcut. The full Resources exist and are reused for every context that actually needs full detail (the nested `category`/`quiz_type`/`state`/`vehicle_type` on a `Quiz`, and the standalone `/admin/quiz-categories` endpoint).

## Media

Images (`Quiz` cover, `QuizQuestion` images) go through **Spatie Media Library**, not raw path columns — `Quiz::MEDIA_COLLECTION_COVER` (single-file, auto-replaces on re-upload) and `QuizQuestion::MEDIA_COLLECTION_IMAGES`. Deleting a model auto-deletes its attached files; no manual `Storage::delete()` bookkeeping. `cover_image_url` / `image_urls` stay as computed attributes on the models so the JSON shape didn't change for existing consumers — only how they're derived did.

Video/audio (hazard-perception clips, simulated-driving footage — Phase 3) should **not** go through Media Library's default disk the same way: give them their own table (e.g. `quiz_question_assets` with a `type` enum) backed by a streaming-oriented store (Cloudflare Stream, or R2 + HLS), since they need adaptive bitrate/seeking rather than a single static download.

## Migration policy

**Additive only, once any environment has run `migrate`.** Laravel tracks completed migrations by filename in the `migrations` table — editing an already-applied migration file doesn't retroactively update environments that ran the old version, so an edit silently drifts out of sync with anyone else's schema (a teammate's machine, CI, staging, prod).

The one exception was a one-time pre-launch cleanup, not a standing practice: while this project had zero data and a single local environment, the original incremental migrations (`add_images_to_quiz_questions_table`, `add_cover_image_path_to_quizzes_table`, `add_is_admin_to_users_table`, etc.) were squashed into their base `create_*` migrations for a clean history. That move is only safe pre-launch.

From here on, every new column — including ones added by packages — gets a new migration. This isn't optional even in principle: Laravel Cashier (Phase 5, now implemented) added its own `stripe_id`/`pm_type`/etc. columns to `users` via its own published migration, exactly as predicted — it couldn't and didn't edit `create_users_table`. Never edit a migration that's already shipped.

## Phase 2 schema (implemented)

Full API reference (endpoints, request/response shapes, verification) lives in [`PHASE_2_QUIZ_ENGINE.md`](./PHASE_2_QUIZ_ENGINE.md) — this section is just the schema/routing shape as it fits into the overall layering.

- **`quiz_attempts`**: `id, user_id nullable, guest_token nullable, quiz_id, status enum(in_progress|completed), score, correct_count, total_questions, started_at, completed_at, duration_seconds, timestamps`. `quiz_id` is `restrictOnDelete()` — deleting a quiz must not silently erase attempt/progress history.
  `guest_token` lets an anonymous attempt be claimed on registration later, matching driving-tests.org's no-registration-required free tier without losing that history if the guest signs up.
- **`quiz_attempt_answers`**: `id, quiz_attempt_id, quiz_question_id, quiz_answer_id nullable, is_correct, answered_at`, unique on `(quiz_attempt_id, quiz_question_id)`.

`Api\V1\Public\QuizController`:
- `index` — filtered (`state`, `vehicle_type`, `category`), paginated, `QuizResource`.
- `show` — quiz + questions + answer options, `is_correct`/`explanation` withheld.
- `storeAttempt` — accepts `{question_id, answer_id}[]`, delegates to `GradeQuizAttempt`, persists attempt + attempt_answers in one transaction, returns score + per-question correctness + explanation now revealed. Throttled (`20,1`) since it's guest-writable.

`Api\V1\QuizAttemptController::index` — auth-only "my history," paginated `QuizAttemptResource`.

`Api\V1\Admin\AttemptController::index` — admin-only, every user's attempts (filterable by `user_id`, `quiz_id`, `status`), same `QuizAttemptResource` (now also carries a `user` field, `null` for guest attempts). Shares `QuizAttempt::scopeWithReviewDetails()` — the `quiz.category`/`quiz.quizType`/`answers.question.answers` eager-load — with the self-service endpoint above, so the two list queries can't drift apart; the only difference between them is the base query (`$request->user()->quizAttempts()` vs. `QuizAttempt::query()`). Verified via a seeded query-count test: 15 attempts × 60 questions each stays at 9 SQL queries total (no N+1), though the response payload itself isn't capped — every attempt's full per-question answer breakdown ships inline regardless of whether its review is ever opened (~190KB for that same page), same tradeoff the self-service endpoint already made.

## Hooks for later phases (cost ~nothing now, expensive to retrofit)

- **Phase 3 (media)**: video/audio get their own asset table + streaming store — see [Media](#media) above.
- **Phase 5 (premium) — done**: `QuizPolicy::attempt()` (a new method, sitting alongside the unchanged `view()`) is the real hard gate, backed by `App\Services\Entitlement\EntitlementResolver`. See `docs/SUBSCRIPTION_ROADMAP.md` for the full design.
- **Phase 7 (AI assistant)**: retrieval layer should read through the same Resources/Actions as the rest of the API rather than querying models directly, so it can't drift from what a human-facing endpoint would return.
- **Phase 9 (mobile)**: consumes `/api/v1` directly — this is the entire reason for versioning now.

## Packages worth adding

- `spatie/laravel-query-builder` — standardizes filtering (`/quizzes?state=CA&vehicle_type=motorcycle`), a shape you'll need repeatedly across quizzes, cheat sheets, and attempt history.
- `laravel/cashier` — installed for Phase 5 (subscriptions/billing), now implemented.

## API docs (OpenAPI / Swagger)

`dedoc/scramble` — infers the OpenAPI 3.1 spec directly from Form Request rules, Resource `toArray()` return types, and Enums, so the docs can't drift out of sync with hand-written annotations the way `l5-swagger`-style docs can. Chosen over that for exactly this project's history of schema/validation disagreeing with each other (see [Migration policy](#migration-policy) and the `state_id`/`vehicle_type_id` fix) — inferred docs remove one more place for that class of bug to hide.

- Interactive UI: `/docs/api` (Stoplight Elements, includes a "Try it" panel). Raw spec: `/docs/api.json`.
- Auth detection is automatic via `security_strategy` (`MiddlewareAuthSecurityStrategy`, enabled in `config/scramble.php`) — routes behind `auth:sanctum` are marked as requiring bearer auth, everything else (browsing, guest attempts) is marked public. Verified against a live server: public routes show `security: []`, protected ones inherit the global bearer requirement — matches actual route middleware exactly, not just what the config claims.
- Docs are open in `local` env only by default (`RestrictedDocsAccess` middleware); everywhere else, `viewApiDocs` (`AppServiceProvider::boot()`) restricts access to admins. It checks the `sanctum` guard explicitly — this app has no session/cookie login, so a Gate closure relying on the default guard's auto-injected user never gets an authenticated user to check (confirmed by testing: even a valid admin Bearer token returned 403 until the closure was rewritten to call `Auth::guard('sanctum')->user()` directly with a nullable `?User $user` signature, since Gate silently skips non-nullable-typed callbacks when the default guard has no user).
- **Real limitation to know about**: a Bearer token can only be attached to a request made by *code* (fetch/XHR, curl, Postman, a browser extension) — a plain browser tab navigating straight to `/docs/api` has no way to attach one, so an admin cannot just click the link and log in through the page. In practice this means either use a REST client that supports Bearer auth, or add a browser extension that injects the header, when accessing the docs UI live as an admin. `/docs/api.json` has the same constraint.
- A few routes (`storeAttempt`'s guest-or-authenticated dual mode, `keep_media_ids` being a JSON-encoded string inside a multipart field) are unusual enough that Scramble's inference may need a manual PHPDoc override to describe precisely — not yet done, works correctly by inference for now.

## Social login

Sign in with Google or Facebook (web), via `laravel/socialite` (both drivers are built in). Code: `SocialAuthController` (HTTP flow), `App\Actions\Auth\ResolveSocialUser` (which local user an identity signs in as), `App\Enums\SocialProvider` (per-provider rules), `social_accounts` table (`SocialAccount` model).

**Flow.** This API is token-only with no session, so the redirect flow is run statelessly and finishes by handing the web app a code, not a token:

1. The web app navigates the browser to `GET /api/v1/auth/{provider}/redirect`. That sets an encrypted, HttpOnly `oauth_state_{provider}` cookie holding a random `state` and redirects to the provider with the same `state`.
2. The provider returns the browser to `GET /api/v1/auth/{provider}/callback`. The `state` it echoes back must match the cookie, which ties the flow to the browser that started it (RFC 9700 §2.1, blocks login CSRF).
3. The callback redirects to the web app's `/auth/callback?code=…`. The code is random, single-use, valid for 60 seconds, and stored only as a hash in the cache. On failure it sends `?error=<SocialAuthError>` instead.
4. That page calls `POST /api/v1/auth/social/exchange {code}` and gets `{user, token}`, the same response as `/login`. Guest data is claimed from `X-Guest-Token` the same way.

The Sanctum token is never put in a URL, so it can't end up in browser history, logs, or `Referer` headers.

**Which account an identity signs in as** (`ResolveSocialUser`):

- If the identity is already linked (`provider` + `provider_user_id`), it signs in as that user, even if the email has changed since.
- If not, it is matched by email, **but only when the provider has verified that email** (`SocialProvider::verifiesEmail`). Google sends an `email_verified` claim. Facebook sends none and doesn't document that the email it returns is confirmed, so it's treated as unverified. If a Facebook email matches an existing account, the login is refused with `email_in_use` instead of being linked.
- If a verified email matches an account whose email was **never verified**, the verified owner takes the account over. Its password, tokens, and other linked identities are wiped, because whoever registered it may not own the address (this is called account pre-hijacking).
- If nothing matches, a new account is created with no password (`users.password` is nullable). It is marked verified if the provider verified the email. Otherwise it gets the normal verification email.

Accounts without a password (`has_password: false` on `UserResource`) can set one with `PUT /password` (no `current_password` needed), or with forgot-password. They can delete their account without entering a password.

**Setup.** Credentials go in `.env` (see `.env.example` and `config/services.php`). A provider with no credentials returns `error=unavailable` instead of breaking. Callback URL to register with each provider: `{APP_URL}/api/v1/auth/{provider}/callback`. Facebook asks only for `email` (plus the default public profile), so it needs no Facebook App Review.

**Adding a provider** (e.g. GitHub, Apple):

1. API: add a case to `App\Enums\SocialProvider` and fill in its `match` arm. PHP's `match` throws `UnhandledMatchError` on a missing arm, so a forgotten one fails loudly. In particular, decide whether the provider really verifies emails. If you're unsure, return `false`.
2. API: add a `config/services.php` block. For a driver Socialite doesn't ship, `composer require socialiteproviders/<name>` and register it with an `Event::listen(SocialiteWasCalled …)` in `AppServiceProvider`, as described in the package's README.
   - A provider that returns with a cross-site form POST (Sign in with Apple) also needs the callback route to accept POST, and needs its state cookie to be `SameSite=None; Secure` (see `SocialAuthController::stateCookie`).
3. Shared: add it to the `SocialProvider` type in `packages/shared/src/types/auth.ts`.
4. Web: add an entry (id, label, icon) to `SOCIAL_PROVIDERS` in `components/auth/AuthFormParts.tsx`.

## Already installed

- `spatie/laravel-medialibrary` — see [Media](#media).
- `dedoc/scramble` — see [API docs](#api-docs-openapi--swagger).
- `laravel/socialite` — see [Social login](#social-login).
