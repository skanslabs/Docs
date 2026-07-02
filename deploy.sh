#!/usr/bin/env bash
# Build the docs and publish to docs.skanslabs.com (static files on the .239 reverse proxy).
# Key-based SSH to nginx@192.168.109.239 must be set up (it is, for David's id_ed25519).
set -euo pipefail
cd "$(dirname "$0")"

echo "▸ building…"
npm run build >/dev/null

echo "▸ publishing dist/ → nginx@192.168.109.239:/var/www/docs …"
tar czf - -C dist . | ssh -o StrictHostKeyChecking=accept-new nginx@192.168.109.239 \
  'rm -rf ~/docs.new && mkdir -p ~/docs.new && tar xzf - -C ~/docs.new \
   && find /var/www/docs -mindepth 1 -delete && cp -a ~/docs.new/. /var/www/docs/ \
   && rm -rf ~/docs.new'

echo "▸ publishing dist-blog/ → nginx@192.168.109.239:/var/www/blog …"
tar czf - -C dist-blog . | ssh -o StrictHostKeyChecking=accept-new nginx@192.168.109.239 \
  'rm -rf ~/blog.new && mkdir -p ~/blog.new && tar xzf - -C ~/blog.new \
   && find /var/www/blog -mindepth 1 -delete && cp -a ~/blog.new/. /var/www/blog/ \
   && rm -rf ~/blog.new'

echo "✓ live at https://docs.skanslabs.com/  and  https://blog.skanslabs.com/"
