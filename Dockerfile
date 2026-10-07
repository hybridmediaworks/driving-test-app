# syntax=docker/dockerfile:1

# ---- Stage 1: build the Next.js frontend (standalone output) ----
FROM node:22-alpine AS web-build
WORKDIR /repo
RUN corepack enable

# Manifests first, install, THEN the source. Copying the whole repo before `pnpm install` made that
# install part of a layer keyed on every file in the repo, so a one-line PHP change re-ran the whole
# dependency install. Split like this it only re-runs when a manifest or the lockfile actually moves.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN pnpm --filter web build

# ---- Stage 2: runtime image — Laravel (php artisan serve) + Next.js (node) behind Nginx ----
FROM php:8.3-cli-bookworm AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx supervisor gettext-base sqlite3 unzip git ca-certificates curl gnupg \
        libsqlite3-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libicu-dev libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_sqlite pdo_mysql gd zip bcmath intl exif pcntl mbstring \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Laravel API — same split as the node install above: the two composer manifests, then install,
# then the application code, so editing a controller does not re-resolve every package.
WORKDIR /var/www/apps/api
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY apps/api ./
RUN composer dump-autoload --optimize --no-dev && composer run-script post-autoload-dump

# Next.js standalone build (server + hoisted node_modules, static assets, public files)
WORKDIR /var/www
COPY --from=web-build /repo/apps/web/.next/standalone ./
COPY --from=web-build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build /repo/apps/web/public ./apps/web/public

# Raise PHP upload/memory limits — `php artisan serve` uses the CLI ini, whose default 2M upload cap
# made larger designer image uploads fail ("The image failed to upload."). conf.d is scanned by all SAPIs.
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]
