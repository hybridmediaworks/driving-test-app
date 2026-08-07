#!/bin/sh
set -e

export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

cd /var/www/apps/api

# DB_DATABASE points at the mounted persistent disk in production (render.yaml); falls back to
# the ephemeral in-container path for local/docker-compose use where no disk is mounted.
DB_PATH="${DB_DATABASE:-database/database.sqlite}"
mkdir -p "$(dirname "$DB_PATH")" storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
[ -f "$DB_PATH" ] || touch "$DB_PATH"

php artisan config:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache

exec supervisord -c /etc/supervisor/supervisord.conf
