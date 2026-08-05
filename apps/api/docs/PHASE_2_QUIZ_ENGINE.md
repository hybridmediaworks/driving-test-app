# Phase 2 — Public Quiz-Taking Engine

**Status: backend complete and verified.** Frontend (`/quizzes`, `/quizzes/[slug]` in `apps/web`) is the only remaining piece — see [`../../../docs/ROADMAP.md`](../../../docs/ROADMAP.md).

Browse a quiz, take it as a guest or a logged-in user, get scored server-side, see correct answers and explanations only after submitting. This is the core product mechanic — everything in later phases (progress tracking, premium gating, the AI assistant) builds on top of it.

## Endpoints (all under `/api/v1`)

### `GET /quizzes`
Public, paginated. Filterable by `state` (state code), `vehicle_type` (name), `category` (name).
Returns paginated `QuizResource[]`: `id, title, slug, test_track, total_questions, duration_seconds, is_premium, cover_image_url, category{}, quiz_type{}, state{}, vehicle_type{}`.

### `GET /quizzes/{quiz}`
Public. Blocked by `QuizPolicy::view()` if `is_active` is false (currently the only gate — Phase 5 will extend this same method for `is_premium`, no controller changes needed).
Returns `{ quiz: QuizResource, questions: QuizQuestionResource[] }`. Each question: `id, question_text, topic, difficulty, image_urls, answers[]` — answers expose only `id` + `answer_text`. **No `is_correct` or `explanation` anywhere in this response** — verified by inspecting every question/answer in a live response, not just spot-checked.

### `POST /quizzes/{quiz}/attempts`
Public but throttled (`20,1`). Works identically for guests and authenticated users on the same route — the caller is resolved via `$request->user('sanctum')`, which asks the Sanctum guard directly regardless of route middleware, so no separate guest/auth endpoint split was needed.

Request: `{ answers: [{ question_id, answer_id: number|null }], duration_seconds?: number, guest_token?: string }`

- Authenticated caller → `attempt.user_id` set, no `guest_token`.
- Guest → `attempt.guest_token` set to whatever the client sent, or a server-generated UUID if omitted (returned in the response so the client can persist it — this is the hook for a future "claim my guest history on signup" flow, not yet built).

Response `201`: `QuizAttemptResource` — `score` (0–100), `correct_count`, `total_questions`, and a per-answer breakdown that **now reveals** `is_correct`, `correct_answer_id`, and `explanation`. Missing/unanswered questions count as incorrect, not as errors — skipping a question is a valid submission.

### `GET /attempts` (auth required)
Paginated attempt history for the logged-in user, most recently completed first. Each entry includes a quiz summary (`id, title, slug, category`).

## Grading

`App\Actions\Quiz\GradeQuizAttempt` does the actual scoring — pure PHP, no HTTP dependency, wrapped in a DB transaction. It's the only place scoring logic lives, deliberately: Phase 4's "review what you got wrong" and the later adaptive-testing enhancement should call the same action rather than re-implementing the rules.

## Schema

- **`quiz_attempts`**: `user_id` nullable, `guest_token` nullable, `quiz_id` (`restrictOnDelete` — deleting a quiz must not silently erase attempt history), `status` (`AttemptStatus` enum), `score`, `correct_count`, `total_questions`, `started_at`, `completed_at`, `duration_seconds`.
- **`quiz_attempt_answers`**: `quiz_attempt_id`, `quiz_question_id`, `quiz_answer_id` nullable, `is_correct`, `answered_at`; unique on `(quiz_attempt_id, quiz_question_id)`.

## Seed data for testing

`php artisan migrate:fresh --seed` gives a clean copy: 51 states, 3 vehicle types, 2 quiz types, 4 categories, an admin (`admin@drivingtestapp.test` / `password`) and a test user, and **two real hand-written quizzes** (not Lorem Ipsum) — "California Traffic Laws Practice Test" (8 questions) and "California Road Signs Practice Test" (6 questions).

## Verified

Re-confirmed in one pass immediately before writing this doc:
- `php artisan test` — passing
- `./vendor/bin/pint --test` — passing
- `php artisan migrate:fresh --seed` — clean rebuild
- Live curl round-trip against a running server: `index` (200, 2 quizzes), `show` (200, zero `is_correct`/`explanation` leak across all 8 questions), guest attempt (201, graded 4/8 correct → `score: 50`), authenticated attempt (201, attached to `user_id`), history (200, shows the attempt with its quiz title attached)

## Known gaps

- No frontend yet — this is purely an API-layer confirmation.
- The guest-token "claim history on registration" flow has the column but no claiming endpoint.
- Only 2 quizzes exist in seed data; the real ~5GB dataset import is Phase 3.
- Throttle limits (`20,1` on `storeAttempt`) are a reasonable default, not load-tested.
