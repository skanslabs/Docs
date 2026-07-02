#!/usr/bin/env bash
# Build the docs and publish to docs.skanslabs.com (static files on the .239 reverse proxy).
# Key-based SSH to nginx@192.168.109.239 must be set up (it is, for David's id_ed25519).
set -euo pipefail
cd "$(dirname "$0")"

echo "▸ building…"
npm run build >/dev/null

echo "▸ publishing dist/ → nginx@192.168.109.239:/var/www/docs …"
tar czf - -C dist . | ssh -o StrictHostKeyChecking=accept-new nginx@192.168.109.239 \
  'rm -rf /var/www/docs.tmp && mkdir -p /var/www/docs.tmp && tar xzf - -C /var/www/docs.tmp \
   && rsync -a --delete /var/www/docs.tmp/ /var/www/docs/ && rm -rf /var/www/docs.tmp'

echo "✓ live at https://docs.skanslabs.com/"
