#!/bin/sh
set -e

export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

cd /var/www/apps/api

mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
touch database/database.sqlite

php artisan config:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache

exec supervisord -c /etc/supervisor/supervisord.conf
