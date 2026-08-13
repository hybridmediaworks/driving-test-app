# Driving Test App

Monorepo for the Driving Test App — a decoupled rebuild of the original Laravel + Inertia + Vue app, split into a separate API backend, a Next.js web frontend, and a React Native mobile app, sharing common code through a shared package.

## Why this exists

The original app (`Driving-Test-Web`, a separate repo) was a Laravel + Inertia.js + Vue 3 monolith with no working SEO (client-side rendered, no per-page meta tags). This repo splits that into:

- An **API-only Laravel backend** (`apps/api`) — no Inertia, pure JSON over Sanctum token auth.
- A **Next.js frontend** (`apps/web`) — full SSR/SEO support, matching the original design pixel-for-pixel.
- The existing **React Native mobile app** (`apps/mobile`), moved in unmodified so it can eventually share types and an API client with the web app.
- A **shared package** (`packages/shared`) — TypeScript types and an API client shared between `apps/web` and (eventually) `apps/mobile`.

See [`docs/MIGRATION_PLAN.md`](./docs/MIGRATION_PLAN.md) for the full page-by-page migration log, decisions made, and known gaps, and [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the forward-looking plan to a production-ready app.

## Structure

```
apps/
  api/      Laravel 13 API (PHP 8.3, Sanctum auth, MySQL for local dev)
  web/      Next.js 16 frontend (App Router, Tailwind v4, shadcn/ui)
  mobile/   Expo / React Native app (currently static — not yet wired to the API)
packages/
  shared/   Shared TypeScript types + API client (used by apps/web today)
```

## Prerequisites

- Node.js 22+, [pnpm](https://pnpm.io) 10+
- PHP 8.3+, [Composer](https://getcomposer.org)

## Setup

```bash
# Install JS dependencies for the whole workspace
pnpm install

# Set up the API
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Set up the web app
cd ../web
cp .env.example .env.local
```

## Running locally

Fastest way — one command from the repo root runs both API and web together (color-coded, prefixed logs; `Ctrl+C` stops both):

```bash
pnpm dev:local
```

- API — http://127.0.0.1:8001
- Web — http://localhost:3000

Or run each app in its own terminal if you want separate log output:

```bash
# API — http://127.0.0.1:8001
cd apps/api
php artisan serve --port=8001

# Web — http://localhost:3000
cd apps/web
pnpm dev

# Mobile (optional, not yet connected to the API)
cd apps/mobile
pnpm start
```

Email verification and password reset links are logged to `apps/api/storage/logs/laravel.log` (`MAIL_MAILER=log`) rather than actually sent — check that file for links during local testing.

## API documentation

Interactive Swagger/OpenAPI docs (via [Scramble](https://scramble.dedoc.co)) are auto-generated from the API's actual Form Requests and Resources, so they can't drift out of sync with the code:

- **Docs UI:** http://127.0.0.1:8001/docs/api
- **Raw OpenAPI spec:** http://127.0.0.1:8001/docs/api.json

Open with no login required while `APP_ENV=local` (the default for local dev). To call an authenticated endpoint from the "Try it" panel, run `POST /v1/login` first, then paste the returned token into the docs UI's auth field. Once deployed anywhere other than local, access is restricted to admins and requires a REST client that can attach a Bearer header (plain browser navigation can't) — see [`apps/api/docs/ARCHITECTURE.md`](./apps/api/docs/ARCHITECTURE.md#api-docs-openapi--swagger) for the full explanation.

## Deploying (AWS)

Previously deployed on Render's free/starter tier; now runs on AWS:

- **Compute**: single EC2 instance (Amazon Linux 2023, Elastic IP), running the same `Dockerfile` as before — Laravel + Next.js behind nginx via supervisor (see `docker/`).
- **Database**: RDS MySQL, private (only reachable from the EC2 instance's security group).
- **File storage**: S3 (`FILESYSTEM_DISK=s3`), requires the `league/flysystem-aws-s3-v3` composer package. The EC2 instance reaches S3 via an attached IAM instance role — no static AWS keys in `.env`.
- **CI/CD**: `.github/workflows/deploy.yml` — every push to `staging` copies the repo to the instance, rebuilds the Docker image, and restarts the container. Requires the `EC2_HOST` and `EC2_SSH_KEY` repo secrets.
- **Secrets**: `production.env` lives only on the instance (`/home/ec2-user/driving-test-app/production.env`), never committed — holds `APP_KEY`, RDS credentials, etc. The deploy workflow doesn't touch it.

`docker/entrypoint.sh` only ever runs `php artisan migrate --force` on boot — it does **not** seed or reset the database on every restart, so real data survives redeploys.

Gotcha for a fresh database import: Spatie Media Library records store their own `disk`/`conversions_disk` columns per row. An import from an environment that used local/`public` storage will have those set to `public`, which breaks all media URLs in production — they need to be `s3`:

```sql
UPDATE media SET disk = 's3', conversions_disk = 's3' WHERE disk = 'public';
```

`render.yaml`/`docker-compose.yml` remain in the repo for local Docker smoke-testing but are no longer the deployment path.

## Notes

- CI/CD deploys `staging` to AWS on push (see above) — no automated tests/lint on PRs yet.
- Two-factor authentication from the original app was intentionally not ported (see `MIGRATION_PLAN.md`).
- The API uses MySQL for local dev and production alike (`apps/api/.env`); automated tests run against an in-memory SQLite database instead (`phpunit.xml`), not the dev/production database.
