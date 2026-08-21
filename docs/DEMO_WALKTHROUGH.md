# Client Demo Walkthrough — Driving Test App

Quick-reference for today's demo. Suggested flow below goes marketing → core product → monetization → admin power → technical credibility. Skip sections as time runs short; steps 1–6 are the must-show core.

## Before you start

```bash
pnpm dev:local
```
Runs both servers together. Web: **http://localhost:3000** · API: **http://127.0.0.1:8001**

If you also want to show a live Stripe checkout, run `stripe listen --forward-to localhost:8001/api/v1/stripe/webhook` in a third terminal first (optional — checkout works without it, but the "unlock" step needs the webhook to fire).

## Login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@drivingtestapp.test` | `password` |
| Regular user | `test@example.com` | `password` |

Stripe test card: **4242 4242 4242 4242**, any future expiry, any CVC.

**Important:** Only **Alabama** and **Alaska** have full real content (real questions, videos, handbooks, cheat sheets). Demo state pages using one of those two — other states will look thin/generic.

---

## 1. The pitch (30 seconds, say this before clicking anything)

This is a rebuild of an existing Laravel+Vue driving-test practice app, split into three pieces so it can actually rank in search and scale:

- **API backend** (Laravel) — pure JSON, no page rendering
- **Web frontend** (Next.js) — server-rendered, so every state/test page is indexable by Google (the old app was 100% client-rendered with no per-page SEO)
- **Shared package** — so the existing React Native mobile app can plug into the same API later without rebuilding it

## 2. Home page — `/`

Marketing homepage, state + vehicle-type selector, interactive US map. Point out this is fully server-rendered (view source shows real content, not a blank `<div id="app">` like the old Vue version).

## 3. Pick a state — `/alabama`

Click through the state selector to Alabama (or go directly to `/alabama`). Show:
- Real phase ladder (permit test → driving test categories, pulled from the actual imported DMV question bank)
- Live stats section (real numbers from the API, not hardcoded)
- Handbook + video/cheat-sheet cards

## 4. Take a quiz as a guest — no login required

From the state page, start a practice quiz. Emphasize: **anonymous users can take a full quiz and get graded** — no signup wall on the free tier. Answer through it, show the results/review screen (correct answers + explanations only reveal after submit — nothing leaks early).

## 5. Register / log in

Quick signup → show the app knows who you are (dashboard, header avatar). Mention email verification is real (just logged to file locally instead of actually emailed, for dev convenience).

## 6. Dashboard — `/dashboard`

Attempt history — every quiz you've taken, score, date. This is the "am I improving" value prop.

## 7. Monetization — the money slide

1. Click into a **premium** quiz (locked padlock/teaser instead of questions).
2. `/pricing` — three real plans, live from the database, not hardcoded:
   - **Weekly** — $29/week, 7-day free trial (card required)
   - **Monthly** — $75/month
   - **Lifetime Family** — $199 one-time, up to 3 seats
3. Click a plan → real Stripe Checkout page. Pay with the test card.
4. Redirect back → confirmation screen polls until the subscription is confirmed active.
5. Revisit that same quiz — now unlocked.
6. `/settings/billing` — plan, status, invoice, "Manage payment method" (real Stripe Customer Portal link), cancel button.

Optional if there's time: **Lifetime Family** seat invites (owner invites a second email, they claim a seat), and the **Pass Guarantee** claim → admin approval → real Stripe refund flow.

## 8. Admin panel — `/admin` (log in as admin)

This is the "how do you manage 50 states of content" answer:
- Quiz/question CRUD with image uploads
- States, vehicle types, categories, plans
- User attempt history (search any user, see their results)
- Pass Guarantee claim review/refund
- Everything gated by a real `is_admin` check, not just "logged in"

## 9. Technical credibility (if the client is technical, or asks "how do we know this is solid")

- **API docs:** `http://127.0.0.1:8001/docs/api` — auto-generated Swagger from the actual code, can't drift out of date.
- 225+ automated backend tests, typechecked/linted frontend build.
- Mention the mobile app already exists (`apps/mobile`) and shares the same API client package — not a separate rebuild later.

---

## What's real vs. what's still coming

Be upfront if asked — nothing below is a surprise, it's just sequenced:

| Done and demoable | Still on the roadmap |
|---|---|
| Full auth, dashboard, settings | Full 50-state content (currently Alabama + Alaska only; rest use generic placeholder questions) |
| Public quiz-taking engine (guest + logged-in, real grading) | CDL page still uses mock/placeholder data, not real content |
| Subscriptions, Stripe checkout, billing portal, family seats | Video/audio self-hosting (currently links out to YouTube/Vimeo) |
| Pass Guarantee refund workflow | Road-sign study mode (not built yet) |
| Admin CRUD for all content types | AI study assistant (planned, not started) |
| Real SEO (server-rendered pages) | Mobile app not yet wired to the live API (still static/mock data) |
| | CI/CD and production deployment config |

## Quick answers to likely questions

- **"Why rebuild instead of patch the old app?"** — Old app was Laravel+Inertia+Vue, fully client-rendered with no working per-page SEO. That's structural, not a bug fix.
- **"Is the content real or placeholder?"** — Real for Alabama/Alaska (imported from a real ~40GB dataset spanning all states — the import pipeline is built and proven on these two; remaining states are a data-import run, not new engineering).
- **"Is payment actually wired up or a mockup?"** — Real Stripe integration, test mode. Checkout, webhooks, refunds, and the customer portal all work end-to-end today.
- **"What about the mobile app?"** — Exists, built in React Native, currently running on static mock data. Connecting it to the live API is a scoped, later phase — the shared code package it needs already exists.
