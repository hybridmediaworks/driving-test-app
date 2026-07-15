# Driving Test App

Monorepo for the Driving Test App — a decoupled rebuild of the original Laravel + Inertia + Vue app, split into a separate API backend, a Next.js web frontend, and a React Native mobile app, sharing common code through a shared package.

## Why this exists

The original app (`Driving-Test-Web`, a separate repo) was a Laravel + Inertia.js + Vue 3 monolith with no working SEO (client-side rendered, no per-page meta tags). This repo splits that into:

- An **API-only Laravel backend** (`apps/api`) — no Inertia, pure JSON over Sanctum token auth.
- A **Next.js frontend** (`apps/web`) — full SSR/SEO support, matching the original design pixel-for-pixel.
- The existing **React Native mobile app** (`apps/mobile`), moved in unmodified so it can eventually share types and an API client with the web app.
- A **shared package** (`packages/shared`) — TypeScript types and an API client shared between `apps/web` and (eventually) `apps/mobile`.

See [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) for the full page-by-page migration log, decisions made, and known gaps.

## Structure

```
apps/
  api/      Laravel 13 API (PHP 8.3, Sanctum auth, SQLite for local dev)
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
touch database/database.sqlite
php artisan migrate

# Set up the web app
cd ../web
cp .env.example .env.local
```

## Running locally

Run each app in its own terminal:

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

## Notes

- No CI/CD or deployment config yet — this is local-development-only for now.
- Two-factor authentication from the original app was intentionally not ported (see `MIGRATION_PLAN.md`).
- Admin pages (quiz categories/questions/quizzes management) are not yet migrated to the web frontend; the API endpoints for them already exist.
