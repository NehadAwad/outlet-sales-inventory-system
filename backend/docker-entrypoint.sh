#!/usr/bin/env sh
set -e
echo "Running database migrations..."
npm run migration:run
exec node dist/server.js
