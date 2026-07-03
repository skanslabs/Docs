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

# IndexNow — tell Bing/Yandex/etc. to recrawl the changed URLs immediately.
# Key file is emitted by build.mjs at /<key>.txt on both hosts (public, not a secret).
# NOTE: the .239 auto-publish cron (~nginx/docs-publish.sh) does NOT run this — if you
# want cron-published CMS edits to auto-ping too, add the same loop there.
echo "▸ pinging IndexNow…"
INDEXNOW_KEY=633776baf62f2edd553d1abced5d7d5f1def6f5c9cebb59643790280ebb3e015
# best-effort — must never fail the deploy (hence the || true guards)
for sm in dist/sitemap.xml dist-blog/sitemap.xml; do
  grep -oE '<loc>[^<]+</loc>' "$sm" | sed -E 's|</?loc>||g' | while read -r u; do
    [ -n "$u" ] || continue
    curl -s -m 10 -o /dev/null "https://api.indexnow.org/indexnow?url=${u}&key=${INDEXNOW_KEY}" && echo "   pinged $u" || echo "   (ping failed: $u)"
  done || true
done

echo "✓ live at https://docs.skanslabs.com/  and  https://blog.skanslabs.com/"
