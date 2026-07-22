#!/usr/bin/env bash
# RETIRED 2026-07-21 — docs + blog are on Cloudflare Pages, not .239 nginx.
#
# Old path: tar-over-ssh to nginx@192.168.109.239:/var/www/{docs,blog}
# Current path: git push origin main → Cloudflare Pages
#   skans-docs  → docs.skanslabs.com  (output dist/)
#   skans-blog  → blog.skanslabs.com  (output dist-blog/)
#
# See HOSTING.md
set -euo pipefail
echo "error: deploy.sh is retired."
echo "docs.skanslabs.com and blog.skanslabs.com are on Cloudflare Pages."
echo "Build:  npm run build"
echo "Publish: git push origin main   # write access to skanslabs/Docs required"
echo "Details: $(dirname "$0")/HOSTING.md"
exit 1
