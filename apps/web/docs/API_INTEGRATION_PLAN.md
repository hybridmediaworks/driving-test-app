# API Integration Plan — what's wired, what isn't, and how to close the gap

Living reference for how `apps/web` consumes `apps/api`. Companion to [`apps/api/docs/ARCHITECTURE.md`](../../api/docs/ARCHITECTURE.md) (the backend's own reference) and [`../../../docs/ROADMAP.md`](../../../docs/ROADMAP.md) (product phase sequencing) — this doc is the frontend-side counterpart neither of those covers: which of the 42 `/api/v1/*` routes are actually called from a page today, which aren't, and the exact contract each integration point relies on.

Written after directly verifying the backend (route list, `php artisan test` — 39/39 passing, and a live curl smoke test of every domain) and reading the actual frontend page code (not just the migration log, which turned out to be stale in one place — see the pagination note below).

**Status: all gaps below have since been closed** (verified via `tsc`, `eslint`, `next build`, and a full Playwright pass against the live app — see the bottom of this file for what was actually shipped). Kept the "before" framing in this section since it's the fastest way to understand *why* each piece is built the way it is — the endpoint inventory reflects current (post-fix) status.

## Endpoint inventory

| Domain | Routes | Frontend status |
|---|---|---|
| Auth | `POST /register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `/confirm-password`, `GET /me` | ✅ Wired — `lib/auth-context.tsx`, `app/{login,register,forgot-password,reset-password/[token],confirm-password}` |
| EmailVerification | `GET /email/verify/{id}/{hash}`, `POST /email/verification-notification` | ✅ Wired — `app/verify-email/**`, resend button in `app/settings/profile/page.tsx` |
| Profile | `PATCH /profile`, `DELETE /profile`, `PUT /password` | ✅ Wired — `app/settings/profile/page.tsx`, `app/settings/security/page.tsx`, `components/settings/DeleteUser.tsx` |
| State | `GET /states` | ✅ Wired — admin quiz filters/dropdowns, public `/quizzes` browse filter |
| VehicleType | `GET /vehicle-types` | ✅ Wired — same as above |
| QuizCategory (admin) | full CRUD under `/admin/quiz-categories` | ✅ Wired, pagination bug fixed |
| Quiz (admin) | full CRUD under `/admin/quizzes` | ✅ Wired, pagination + field-casing bugs fixed |
| QuizQuestion (admin) | full CRUD + `reorder`/`move` under `/admin/quizzes/{quiz}/questions` | ✅ Wired, pagination + field-casing bugs fixed |
| Stats | `GET /admin/stats` | ✅ Wired — `app/dashboard/page.tsx` (was a static placeholder) |
| User (admin) | full CRUD under `/admin/users` | ✅ Wired — `app/admin/user-management/{page,create,[id]/edit}.tsx` (was 100% hardcoded mock data) |
| Quiz (public) | `GET /quizzes`, `GET /quizzes/{quiz}`, `POST /quizzes/{quiz}/attempts` | ✅ Wired — `app/quizzes/{page,[id]/page}.tsx` (was no frontend at all) |
| QuizAttempt | `GET /attempts` | ✅ Wired — `app/dashboard/attempts/page.tsx` (was no frontend at all) |

## The pagination contract (read this before building any list page)

Every paginated endpoint returns Laravel's standard API Resource collection envelope — documented in `apps/api/docs/ARCHITECTURE.md` and confirmed live via curl:

```json
{
  "data": [ /* items */ ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": {
    "current_page": 1, "from": 1, "last_page": 3, "path": "...",
    "per_page": 15, "to": 15, "total": 42,
    "links": [ { "url": "...", "label": "1", "active": true }, ... ]
  }
}
```

**`packages/shared`'s `PaginatedResponse<T>` previously modeled a different, flat shape** (`current_page`/`total`/`links` as a top-level array) — the shape you get from a bare `LengthAwarePaginator`, not from `Resource::collection()`. Every admin list page read `x.total`, `x.from`, `x.last_page`, `x.links` directly, all of which are `undefined` against the real response. Effect: count badges always showed "(0)", and `Paginator` never rendered its page links (silent, not a crash — invisible with seed data because everything fit on one page). **Fixed** — see `packages/shared/src/types/quiz.ts`'s `PaginatedResponse<T>`. Any new paginated list must read `response.meta.*`, never flat top-level fields.

`Paginator` itself moved from `components/admin/Paginator.tsx` to `components/ui/Paginator.tsx` as part of this fix — it's generic pagination UI, not admin-specific, and the public `/quizzes` and `/dashboard/attempts` pages now use it too. Import it from `components/ui`, not `components/admin`.

Lookup/dropdown lists (`categories`, `quiz_types`, `states`, `vehicle_types` inside `Admin\QuizController::index`'s response) are a deliberate exception — plain arrays, not paginated, by design (see `ARCHITECTURE.md`).

## A second bug found while fixing the first: `quiz_type`/`vehicle_type` key casing

Separate from the pagination envelope, `Admin\QuizResource` and `Admin\QuizController::index()`'s side-lists always used snake_case (`quiz_type`, `vehicle_type`, `quiz_types`, `vehicle_types` — confirmed by reading the resource/controller source directly), but the shared `Quiz` type and four admin pages (`admin/quizzes/{page,create/page,[id]/edit/page,[id]/questions/page}.tsx`) read them as camelCase (`quizType`, `vehicleType`, `quizTypes`, `vehicleTypes`). Effect: the quiz create/edit forms' "Quiz Type" and "Vehicle Type" dropdowns were always empty, and the list/questions pages never displayed those two fields. Invisible to manual QA because it silently rendered nothing rather than erroring. Fixed by renaming the fields in `packages/shared/src/types/quiz.ts`'s `Quiz` type and all four pages to match the real snake_case keys.

## What to integrate, and how

### Stats → Admin Dashboard

- **Backend**: `GET /admin/stats` → `{ users: {total,admins,verified,new_last_7_days}, quizzes: {total,active,categories,questions}, attempts: {total,completed,in_progress,average_score,last_7_days} }`. Admin-only (403 otherwise).
- **Frontend**: `app/dashboard/page.tsx`. Fetch only when `user.is_admin` (the same check `components/admin/AdminGuard.tsx` uses) — regular users hit this page too. Render as stat cards using the existing `Card` primitives.
- **Types**: `packages/shared/src/types/admin.ts` → `AdminStats`.

### User → Admin User Management

- **Backend**: `GET/POST /admin/users`, `GET/PUT/DELETE /admin/users/{user}`. `index` supports `search` (name/email), `is_admin`/`verified` filters, `per_page`, paginated per the envelope above. Two server-enforced guardrails to surface as plain error messages (not reimplemented client-side): can't revoke your own `is_admin`, can't delete your own account (both 422).
- **Frontend**: rewrite `app/admin/user-management/page.tsx` off its `MockUser[]` array entirely, following the same list/search/filter/paginate/delete shape already proven in `app/admin/quiz-categories/page.tsx`. New `app/admin/user-management/create/page.tsx` and `[id]/edit/page.tsx`, mirroring `app/admin/quiz-categories/create` and `[id]/edit`.
- **Types**: `User` (already in `packages/shared/src/types/user.ts`) needs `created_at`/`updated_at` added — present in `UserResource` but missing from the type.

### Quiz (public) + QuizAttempt → the quiz-taking flow

The core product mechanic, and the biggest gap — "backend-complete" since the Phase 5 restructure (see root `docs/ROADMAP.md` Phase 2) but zero frontend exists.

- **Types**: the public `QuizResource`/`QuizQuestionResource`/`QuizAnswerOptionResource` are deliberately leaner than the admin ones (no `is_active`/`order_no`/`*_id` foreign keys, nested relations are plain `{id,name,title}` not full resources) — reusing the admin `Quiz` type here would silently type fields that don't exist in the response. Modeled separately as `PublicQuiz`, `PublicQuizQuestion`, `PublicAnswerOption` in `packages/shared/src/types/quiz.ts`; use these (not `Quiz`) for anything under `app/quizzes/**` or `app/dashboard/attempts/**`.
- **Browse** — `GET /quizzes?state=&vehicle_type=&category=` (all optional, exact-match, combinable) → paginated `QuizResource`. New `app/quizzes/page.tsx`.
- **Detail** — `GET /quizzes/{quiz}` → `{ quiz, questions }`. Each question's answers deliberately omit `is_correct`/`explanation` — the client cannot know the right answer before submitting. New `app/quizzes/[id]/page.tsx`.
  - **Note**: the route binds by numeric `id`, not `slug`, despite the resource exposing a `slug` field — `Quiz` has no `getRouteKeyName()` override, and existing tests (`QuizBrowsingTest`, `QuizAttemptGradingTest`) hardcode `$quiz->id` in the URL for this exact route. Rebinding to `{quiz:slug}` on the public routes only (leaving admin's `{quiz}` id-based) is possible with Laravel's inline `{param:column}` syntax, but it means updating ~11 existing test assertions too — real backend work, deliberately left out of this integration pass. URLs are `/quizzes/2` for now, not `/quizzes/some-slug`; `slug` is still shown as a display field. Flagged as a follow-up, not done silently.
- **Submit** — `POST /quizzes/{quiz}/attempts` with `{ answers: [{question_id, answer_id}], duration_seconds? }`, throttled 20/min. Works identically for guests and authenticated users on the same route — send a Bearer token to attach `user_id`, or omit it entirely; no client-side branching needed. Response reveals what `show` withheld: `is_correct`, `correct_answer_id`, `explanation` per answer, plus `score`/`correct_count`.
- **Frontend**: new `components/quiz/{QuizPlayer,QuestionCard,QuizResults}.tsx`. **Do not confuse with `components/state/quiz/*`** — that's the pre-existing, intentionally-static mock player behind `/[state]/dmv-written-test` (hardcoded questions, zero API calls), left untouched per `docs/ROADMAP.md` Phase 3 (waiting on the real question-bank import). Different folder, same conventional names — check which one you're in before editing.
- **History** — `GET /attempts` (auth-only, paginated `QuizAttemptResource`). New `app/dashboard/attempts/page.tsx`. There's no show-by-id endpoint, so per-attempt review is an inline expand on the list row (the attempt's own score/answers are already in memory from the list fetch — no extra call needed for that part), fetching `GET /quizzes/{attempt.quiz_id}` only to resolve full answer-option text (the list response has selected/correct answer *IDs* but not every option's text), then reusing `QuizResults`/`QuestionCard`. Degrades gracefully if that quiz is no longer active (policy-gated 403) — shows the score without the option-text detail.
  - **Backend change made during this pass**: `QuizAttemptController::index()` previously eager-loaded only `quiz.category`/`quiz.quizType` — `answers` wasn't loaded, so `QuizAttemptResource`'s `answers` field (via `whenLoaded`) was always empty. Fixed by adding `answers.question.answers` to the `with()` call — one line, `php artisan test` still 39/39 after. This is the one backend change in an otherwise frontend-only pass; done because the alternative was silently dropping the review feature.

## A third bug, found while manually testing logout: unauthenticated requests without `Accept: application/json` returned 500, not 401

Not logout-specific — a global gap, found by testing logout's token revocation (`login` → `logout` → hit `/me` with the now-dead token). `bootstrap/app.php`'s `shouldRenderJsonWhen(fn ($request) => $request->is('api/*'))` only controls how an exception is *rendered*; it doesn't stop Laravel's default `Authenticate` middleware from first trying `redirectTo()`, which calls `route('login')` for any request that doesn't set `Accept: application/json`. This app has no web-based login route (pure JSON API), so that call threw `RouteNotFoundException` — an unrelated 500, with a full stack trace leaked (`APP_DEBUG=true` locally), instead of a clean 401. The actual frontend (`packages/shared/src/api-client.ts`) always sends `Accept: application/json`, so this never affected the built frontend — but it's a real gap for anything else hitting the API (curl, Postman without headers set, a future mobile client, uptime monitors). Fixed with Laravel's documented hook for exactly this "API-only app" scenario: `bootstrap/app.php` → `$middleware->redirectGuestsTo(fn () => null)`. Verified via curl (both a missing token and an invalid one now return clean 401) and `php artisan test` (39/39 still passing).
- **Types**: `packages/shared/src/types/quiz.ts` → add `QuizAttempt`, `QuizAttemptAnswer`.

## Shared conventions to keep using

- **API client**: `apps/web/lib/api.ts` (thin wrapper over `packages/shared`'s `createApiClient`) — `api.get/post/put/patch/delete`, throws `ApiError` with `.status`/`.errors` on failure. Don't hand-roll `fetch` calls.
- **Auth state**: `lib/auth-context.tsx`'s `useAuth()` — `user`, `loading`, `login/register/logout`.
- **Admin gating**: `components/admin/AdminGuard.tsx` for page-level gating; `user.is_admin` for conditional sections within a shared page (like Dashboard).
- **List pages**: `components/ui/Paginator.tsx` + `apps/web/hooks/use-paginated-list.ts`'s two hooks — `usePaginatedList<T>(path)` (fetch/refetch a bare `{data,links,meta}` response) and `useDeleteConfirm<T>(deleteFn, onDeleted, fallbackMessage)` (the target/open/error state behind `ConfirmDeleteDialog`, reusable even on composite responses like `admin/quizzes` where the list isn't the top-level shape). Don't duplicate that boilerplate a sixth time — six list pages (`admin/quiz-categories`, `admin/quizzes`, `admin/quizzes/[id]/questions`, `admin/user-management`, `quizzes`, `dashboard/attempts`) already share it.
- **Delete confirmation**: `components/admin/ConfirmDeleteDialog.tsx`.
- **Forms**: `Input`/`Label`/`PasswordInput`/`InputError` from `components/ui/`, errors surfaced from `ApiError.errors` (Laravel's per-field validation shape).
- **Nav**: `components/app/AppSidebar.tsx`'s `mainNavItems` now includes "Browse Quizzes" (`/quizzes`) and "My Results" (`/dashboard/attempts`) alongside the existing admin links — add new top-level app-shell pages here.
