# syntax=docker/dockerfile:1

# ---- Stage 1: build the Next.js frontend (standalone output) ----
FROM node:22-alpine AS web-build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN pnpm --filter web build

# ---- Stage 2: runtime image — Laravel (php artisan serve) + Next.js (node) behind Nginx ----
FROM php:8.3-cli-bookworm AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx supervisor gettext-base sqlite3 unzip git ca-certificates curl gnupg \
        libsqlite3-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libicu-dev libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_sqlite gd zip bcmath intl exif pcntl mbstring \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Laravel API
COPY apps/api ./apps/api
WORKDIR /var/www/apps/api
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Next.js standalone build (server + hoisted node_modules, static assets, public files)
WORKDIR /var/www
COPY --from=web-build /repo/apps/web/.next/standalone ./
COPY --from=web-build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build /repo/apps/web/public ./apps/web/public

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]
