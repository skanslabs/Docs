# docs.skanslabs.com + blog.skanslabs.com — hosting

**Canonical host:** Cloudflare **Pages** (Workers edge / global CDN).

| Host | Cloudflare project | GitHub repo | Build | Output |
|------|--------------------|-------------|-------|--------|
| `docs.skanslabs.com` | **skans-docs** | `skanslabs/Docs` (`main`) | `npm run build` | `dist/` |
| `blog.skanslabs.com` | **skans-blog** | same repo | same build | `dist-blog/` |

- Both custom domains are Cloudflare-proxied.
- A CMS commit or `git push` to `skanslabs/Docs` **main** triggers Cloudflare builds (no on-box cron).
- Sveltia CMS at `/admin` on the docs host still commits into `skanslabs/Docs`.

## Deploy (current)

```bash
cd /home/david/skanslabs-docs
npm run build
git add -A && git commit -m "…"
git push origin main   # Cloudflare Pages → docs + blog
```

Write access to `skanslabs/Docs` is required (user PAT or write deploy key).

## Retired (do not use)

| Path | Status |
|------|--------|
| `deploy.sh` → `nginx@192.168.109.239` `/var/www/docs` + `/var/www/blog` | **RETIRED** 2026-07-21 |
| `.239` cron `docs-publish.sh` auto-publish | **RETIRED** (box off / DNS no longer points here) |
| OCI/nginx origin `A 161.153.113.177` for docs/blog | **RETIRED** — DNS is CNAME → `*.pages.dev` (proxied) |

`deploy.sh` is a stub that refuses the old path; see this file.

## Related

- Marketing: `skanslabs.com` → Cloudflare Pages **skans-site** (`skanslabs/site`)
- Portal / SUS: OCI + Cloudflare proxy (not Pages)
