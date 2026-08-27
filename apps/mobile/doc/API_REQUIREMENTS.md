# Mobile App — Required Backend APIs

Spec for the APIs the Driving Test mobile app needs, so the current static/mock data in the app can be replaced with real data from the backend.

## Conventions used below

- **Base path:** `/api/v1/...`
- **Auth:** endpoints marked 🔒 require `Authorization: Bearer {token}`. Unmarked endpoints are public.
- **Pagination envelope** (used wherever a `page`/`per_page` query param is listed):
  ```json
  {
    "data": [ /* items */ ],
    "meta": { "current_page": 1, "last_page": 3, "per_page": 20, "total": 52 }
  }
  ```
- **Error envelope:**
  ```json
  { "message": "Human-readable summary", "errors": { "field": ["Specific reason"] } }
  ```
- `vehicle_type` values: `car` | `cdl` | `motorcycle` — superseded from an earlier `car`/`truck`/`motorcycle` draft; `store/userStore.ts`'s `VehicleType` and `app/onboarding/vehicle.tsx` already match the live values.
- `difficulty` was never built as a fixed enum — there's no `easy`/`hard`/`hardest` field anywhere. The backend groups quizzes under open-ended `category` slugs instead (`GET /quiz-categories`, admin-orderable), which can differ per vehicle type. The Today tab's "Tests" section renders one row per category that actually has quizzes for the selected vehicle+state — see `services/api/todayService.ts` — so a new backend category shows up automatically with no app change.

---

## Connection status

Tracks which of the endpoints below are actually wired up in the mobile app (`apps/mobile`) against a live backend, vs. still running on mock/local data. Update this table whenever a screen is switched over.

| Area | Endpoint(s) | Backend ready | Mobile connected | Notes |
| --- | --- | --- | --- | --- |
| Auth — login | `POST /login` | ✅ | ✅ | `store/authStore.ts` |
| Auth — register | `POST /register` | ✅ | ✅ | `store/authStore.ts` |
| Auth — logout | `POST /logout` | ✅ | ✅ | `store/authStore.ts` |
| Auth — current user | `GET /me` | ✅ | ✅ | `store/authStore.ts` (hydrate) |
| Auth — forgot/reset password | `POST /forgot-password`, `POST /reset-password` | ✅ | ✅ | `app/auth/forgot-password.tsx`, `app/auth/reset-password.tsx` |
| Auth — confirm password | `POST /confirm-password` | ✅ | ✅ | `app/auth/confirm-password.tsx` |
| Auth — resend verification | `POST /email/verification-notification` | ✅ | ✅ | `app/auth/verify-email.tsx` |
| States | `GET /states` | ✅ | ✅ | `store/referenceDataStore.ts`, used by `app/onboarding/states.tsx` + `app/(tabs)/settings.tsx` |
| Vehicle types | `GET /vehicle-types` | ✅ | ✅ | `store/referenceDataStore.ts`, used by `app/onboarding/vehicle.tsx` |
| Tests (list/detail) | `GET /tests`, `GET /tests/{id}` | 🟡 renamed → `GET /quizzes`, `GET /quizzes/{quiz}` | ✅ | Today tab (`app/(tabs)/index.tsx`), `app/test/see-all.tsx`, and test intro (`app/test/[id].tsx`, via `services/api/todayService.ts`) all read live quizzes for a numeric id. The intro/detail screen itself is no longer linked to from anywhere in the tap flow (see note below) but still works if reached directly; falls back to `data/mockTests.ts` for the older string mock ids still used by the Progress tab. |
| Tests — hero card | `GET /tests/hero` | ❌ not built | ✅ (client-derived) | No dedicated endpoint — Today's hero card picks the first unlocked, not-yet-completed practice quiz from `GET /quizzes` (`todayService.pickHeroTest`), in category-then-list order. |
| Quiz questions | `GET /tests/{id}/questions` | 🟡 merged into `GET /quizzes/{quiz}` | ✅ | `app/test/quiz/[id].tsx`'s `ApiQuizScreen` fetches real questions/answers for a numeric id via `services/api/quizApi.ts#fetchQuiz`. Tapping a test anywhere in the app now skips the intro/detail screen and opens the quiz directly. |
| Quiz answer check | `POST /tests/{id}/questions/{qId}/check` (not in this doc's original draft) | ✅ `POST /quizzes/{quiz}/questions/{question}/check` | ✅ | Called on each answer tap (`quizApi.ts#checkAnswer`) for the instant correct/incorrect + explanation reveal — the `show` endpoint deliberately withholds this until now. |
| Quiz attempts — submit | `POST /tests/{id}/attempts` | 🟡 renamed → `POST /quizzes/{quiz}/attempts` | ✅ | `quizApi.ts#submitAttempt`, called on "Finish". Real `score`/`passed`/`correct_count` flow straight into `app/test/results/[id].tsx`; "Continue to the next test" fetches the next quiz in the same category (`todayService.fetchNextTest`) and also skips the intro screen. |
| Quiz attempts — fetch one | `GET /tests/{id}/attempts/{attemptId}` | 🟡 no single-attempt show; `GET /attempts` (list, 🔒) covers review | 🟡 partial | `app/test/review/[id].tsx` shows the just-submitted attempt's per-question detail from an in-memory hand-off (`store/lastAttemptStore.ts`) — no extra request needed right after finishing. There's no fetch-one-attempt endpoint to fall back on, so Review shows a "only available right after finishing" message if that in-memory attempt is missing (e.g. app restarted) instead of guessing at content. |
| Exam simulator | `GET /exams/config`, `POST /exams/{id}/simulations` | ❌ not built | ✅ (client-derived) | No dedicated endpoint — Today's Exam card is the first `GET /quizzes?quiz_type=final` result, including its real `locked` state (`services/api/todayService.ts`). Tapping it now opens the same real quiz-taking flow as any other test (no separate "simulation" concept server-side to start/track). |
| Challenge bank | `GET /challenge-bank`, `DELETE /challenge-bank/{questionId}` | ❌ not built | ❌ | Mobile uses local `store/challengeBankStore.ts` only; its own quiz-taking path (`id === "challenge-bank"`) is still 100% local/mock, unrelated to the real-quiz flow above |
| Theory / study material | `GET /theory`, `GET /theory/{id}/download` | 🟡 replaced by `handbooks`, `cheat-sheets` (+download), `flashcards`, `videos` | 🟡 partial | Today tab's Theory section and `app/theory/see-all.tsx` both list live `GET /cheat-sheets` (`services/api/todayService.ts#fetchTheoryList`). Download/detail and `handbooks`/`flashcards`/`videos` aren't wired up yet. |
| Progress summary | `GET /progress`, `POST /progress/manual-read` | 🟡 no matching shape; closest is `GET /me/stats` 🔒 | ❌ | Mobile uses local `store/progressStore.ts` only |
| Plans / pricing | `GET /plans` | ✅ | ✅ | `store/planStore.ts`; `components/premium/trial-sheet.tsx` derives the trial timeline/price from the weekly plan's real `price_cents`/`trial_days` |
| Billing checkout | `POST /billing/checkout` | ✅ | ❌ | |
| AI chat (exam coach) | `POST /ai/chat` | 🟡 no generic endpoint; closest are `POST quizzes/{quiz}/questions/{question}/assist` and `POST quizzes/{quiz}/results-insight` | ❌ | `hooks/use-ai-chat.ts` fakes a canned reply |

Legend: ✅ done · 🟡 backend exists but under a different route/shape than this doc describes · ❌ not connected / not built.

---

## 1. Tests (practice tests)

### `GET /tests`
List tests, filterable by vehicle and difficulty.

**Query params:** `vehicle_type`, `difficulty`, `page`, `per_page`

**Response `200`** (paginated):
```json
{
  "data": [
    {
      "id": "car-e1",
      "title": "Car Practice Test 1",
      "subtitle": "Questions 1–30",
      "image_url": "https://.../cover.jpg",
      "difficulty": "easy",
      "vehicle_type": "car",
      "questions_count": 30,
      "passing_score": 80,
      "locked": false,
      "description": "Start your journey to a driver's license..."
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 20, "total": 8 }
}
```
`locked` must be computed server-side from the caller's entitlement (guest/free vs premium) — the app should never decide this locally.

### `GET /tests/{id}`
Single test detail. Same object shape as the list item above.

### `GET /tests/hero`
"Next up" recommended test for a vehicle — the one card the home screen always leads with.

**Query params:** `vehicle_type` 🔒 (uses the caller's completed attempts to pick the next incomplete test; falls back to the first test if used without auth)

**Response `200`:**
```json
{
  "vehicle_type": "car",
  "test_id": "car-e2",
  "title": "Car Practice Test 2",
  "description": "Use this card to proceed. It'll always point to the next test you need to take.",
  "image_url": "https://.../cover.jpg"
}
```

---

## 2. Quiz questions & attempts

### `GET /tests/{id}/questions`
Questions for a test, **without** the correct answer or explanation (those are only revealed after submitting).

**Response `200`:**
```json
{
  "test_id": "car-e1",
  "questions": [
    {
      "id": "car-e1-q1",
      "text": "What are the four steps in making a proper turn?",
      "image_url": null,
      "options": ["Look, press, roll, slow", "Slow, look, press, roll", "Press, look, slow, roll", "Slow, press, look, roll"]
    }
  ]
}
```

### `POST /tests/{id}/attempts`
Submit answers and get them graded.

**Request:**
```json
{
  "duration_seconds": 340,
  "answers": [
    { "question_id": "car-e1-q1", "selected_index": 1 },
    { "question_id": "car-e1-q2", "selected_index": 0 }
  ]
}
```

**Response `201`:**
```json
{
  "attempt_id": "att_9f2a",
  "score_percent": 90,
  "passed": true,
  "total_questions": 30,
  "correct_count": 27,
  "missed_question_ids": ["car-e1-q7", "car-e1-q14"],
  "results": [
    {
      "question_id": "car-e1-q1",
      "selected_index": 1,
      "correct_index": 1,
      "is_correct": true,
      "explanation": "The correct sequence is Slow, Look, Press, Roll..."
    }
  ]
}
```
`missed_question_ids` feeds the Challenge Bank directly (see §4).

### `GET /tests/{id}/attempts/{attemptId}` 🔒
Fetch a previously graded attempt (used by the results/review screens on revisit). Same shape as the `POST` response above.

---

## 3. Exam simulator

### `GET /exams/config`
**Query params:** `vehicle_type`

**Response `200`:**
```json
{
  "id": "exam-car",
  "vehicle_type": "car",
  "title": "DMV Exam Simulator",
  "subtitle": "46 random questions",
  "image_url": "https://.../cover.jpg",
  "total_simulations": 3,
  "description": "Simulate the actual DMV written exam..."
}
```

### `POST /exams/{id}/simulations` 🔒
Starts one simulation run — server randomly draws the question set server-side (so it can't be inspected/cached client-side) and returns a `test_id`-shaped payload the app feeds into the same `/tests/{id}/questions` + `/tests/{id}/attempts` flow used for regular tests.

**Response `201`:**
```json
{ "test_id": "exam-car-sim-3f9c", "questions_count": 46, "simulations_used": 1, "simulations_remaining": 2 }
```

---

## 4. Challenge Bank (missed questions)

### `GET /challenge-bank` 🔒
Full list of questions the user has ever missed, across all attempts.

**Response `200`:**
```json
{
  "count": 2,
  "questions": [
    {
      "id": "car-e1-q7",
      "test_id": "car-e1",
      "text": "...",
      "image_url": null,
      "options": ["...", "...", "...", "..."],
      "correct_index": 2,
      "explanation": "..."
    }
  ]
}
```
(Full detail including answer/explanation is fine here — these are review-only, not a live quiz.)

### `DELETE /challenge-bank/{questionId}` 🔒
Removes one question from the bank once the user has mastered it.

**Response `204`**

---

## 5. Theory / study material

### `GET /theory`
**Query params:** `vehicle_type`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "car-theory-1",
      "title": "Driver's Manual",
      "icon": "cloud-download",
      "action": "get",
      "description": "Printable PDF e-book. View them inside the app or send to your printer.",
      "file_info": "PDF, 80 pages, 26.0 MB",
      "locked": false
    },
    {
      "id": "car-theory-2",
      "title": "Car Test Questions",
      "icon": "lock",
      "action": "unlock",
      "description": "50 Most Common Questions",
      "file_info": "PDF, 8 pages, 2.1 MB",
      "locked": true
    }
  ]
}
```

### `GET /theory/{id}/download` 🔒 (only for unlocked items)
**Response `200`:**
```json
{ "url": "https://cdn.../signed-download-link.pdf", "expires_at": "2026-08-18T12:30:00Z" }
```

---

## 6. Progress summary

### `GET /progress` 🔒
Backs the Progress tab's four rows.

**Response `200`:**
```json
{
  "manual": { "read": false },
  "practice_tests": { "completed": 4, "total": 7 },
  "challenge_bank": { "remaining": 2 },
  "marathon": { "completed": 0, "total": 309 },
  "exam_simulator": { "passed": 0, "total": 3 }
}
```

### `POST /progress/manual-read` 🔒
Marks the manual as read (checkbox action on that row).

**Response `204`**

---

## 7. States

### `GET /states`
Only states the app actually has content for — not a hardcoded 50-state list, so onboarding and settings never show a state with nothing behind it.

**Response `200`:**
```json
{ "data": [ { "code": "CA", "name": "California" }, { "code": "NY", "name": "New York" } ] }
```

---

## 8. Vehicle types

### `GET /vehicle-types`
**Response `200`:**
```json
{
  "data": [
    { "id": "car", "title": "Car", "description": "Learner's permit or driver's license" },
    { "id": "truck", "title": "Truck (CDL)", "description": "Commercial driver's license or learner's permit (CLP)" },
    { "id": "motorcycle", "title": "Motorcycle", "description": "Motorcycle rider's license or learner's permit" }
  ]
}
```
(Emoji icon can stay hardcoded client-side by `id` — no need to serve an icon asset for three fixed values.)

---

## 9. Plans / pricing

### `GET /plans`
Actual response shape (differs from an earlier draft of this doc — matches `App\Http\Resources\Api\V1\Public\PlanResource` and the shared `Plan` type in `packages/shared/src/types/billing.ts`). No `features`/`is_popular` — those are curated client-side per `key` (see `apps/web/app/pricing/page.tsx`'s `FEATURES_BY_KEY`).

**Response `200`:**
```json
{
  "data": [
    {
      "id": 2,
      "key": "monthly",
      "name": "Monthly",
      "type": "recurring",
      "billing_interval": "month",
      "price_cents": 7500,
      "trial_days": null,
      "max_seats": 1,
      "sort_order": 2
    }
  ]
}
```

### `POST /billing/checkout` 🔒
**Request:** `{ "plan_id": "plan_monthly" }`

**Response `200`:** `{ "checkout_url": "https://checkout.stripe.com/..." }`

---

## 10. AI chat (exam coach)

Currently the app fakes this with a canned reply — needs a real endpoint.

### `POST /ai/chat` 🔒
**Request:**
```json
{
  "conversation_id": "conv_88f1",
  "message": "Give me a hint",
  "context": { "question_id": "car-e1-q7" }
}
```
`conversation_id` omitted on the first message of a session; server creates and returns one.

**Response `200`:**
```json
{
  "conversation_id": "conv_88f1",
  "reply": "Think about what happens to your stopping distance in the rain — that's the key to this one."
}
```
