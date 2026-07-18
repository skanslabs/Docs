---
title: Universal search & the command bar
eyebrow: Reference
description: How the command-bar-driven console resolves any identifier — hostname, IP, MAC, serial, certificate, CVE, user — to its entity, and how the /search page fuses lexical and on-box semantic retrieval.
---

The Skans console is **command-bar-driven**. There is no left-hand navigation rail: every page in the console is a destination in a searchable catalog, and you reach anything — a page, a device, a CVE, a user — by typing into the bar. The bar is a fast resolver capped at a handful of suggestions; press **Enter** and the query lands on **`/search`**, the full-page surface that searches every store at once.

## Navigating by typing

The command bar fuzzy-matches a catalog of every console destination, organized into five areas — **Home, Devices, Monitor & Secure, Services, System**. Partial, plural, and singular forms all resolve ("cert" finds Certificate authority; "vulns" finds Vulnerabilities), and each destination carries keywords so absorbed pages stay findable. What you see is filtered by your **capabilities**: a destination your role can't use never appears in the bar, and the target pages' server-side authorization backstops every deep link regardless.

## Resolving identifiers to entities

Type **any identifier** and the bar resolves it to the stable entity that holds it:

- **IP address** (or prefix)
- **MAC address** — any separator style
- **hostname / device name**
- **hardware serial**, **certificate serial or thumbprint** (including an agent's mTLS thumbprint)
- **GUID** (device id or AD object GUID)
- free text — **user**, tag, location, model, vendor, site, notes, firmware
- **CVE id**, **KB id**, and **MITRE ATT&CK technique id** as exact-shape lookups

Entity resolution runs **live against the control-plane database** — there is no separate search index to sync, so results can't drift from inventory. The shape of what you typed routes the query to bounded, indexed lanes with a shared time budget of roughly **800 ms**, cancelled and re-run on every keystroke.

### Identifier hits are honest about time

Skans treats network attributes as **time-bound observations**, not permanent keys (see **[Network identity & correlation](/2.0/concepts/network-identity/)**), and search renders that model instead of hiding it. An identifier hit tells you *which* binding matched and whether it is:

- **current** — the binding is open and recently seen ("current, seen 3 m ago"),
- **last seen** — open but stale ("last seen 4 d ago"), never mislabeled as current, or
- **historical** — closed by an actual reassignment ("held Jun 12 → Jun 30").

Retired devices stay findable (rendered dimmed), and a device that was merged into another follows the link to its survivor — yesterday's MAC still gets you to today's entity. If a full MAC or IP matches **no** inventory entity at all, Skans checks its wire observations before answering "never seen": a hit in the ARP baseline surfaces as *"observed on the wire, unregistered"* with a jump to **[Discover](/2.0/how-tos/scan-and-secure/)**.

### Exact-id answers, correlated

A **CVE id** returns the catalog document (severity, CVSS, description) plus how many of *your* hosts are affected — counted as **distinct hosts**, never raw finding documents, so one host with the CVE in three packages is one affected host. A **KB id** returns how many hosts are missing it and how many have it installed, from agent patch scans. A free-text software name returns "*N* hosts have software matching …" from agent inventory. AD **users, computers, and groups** match from an in-memory directory snapshot (no live directory query runs on a keystroke).

::: note
Search degrades honestly, and each failure mode renders differently. A superseded keystroke returns silently; a query that overran the time budget appends a visible *"timed out"* row; a store outage appends *"store unreachable"*. One store being down never hides another store's results, and an empty answer is never faked from a failed lookup.
:::

## The /search page

Pressing Enter opens `/search?q=…` — linkable and bookmarkable. Results come back in independent, capability-gated sections, each loading and failing on its own:

| Section | Source | Notes |
| --- | --- | --- |
| **Entities** | Control-plane SQL | Devices, sites, identifiers — same lanes as the bar, higher cap |
| **Software** | Agent inventory (last 30 days) | Which hosts have matching software installed |
| **Vulnerabilities** | Matched findings + the CVE catalog | Hybrid retrieval — see below |
| **Logs** | Event/syslog stores | Newest 20, with a jump to the paged **Logs** view |

A down engine renders as an explicit warning in its own section — never as "no results".

## Hybrid CVE retrieval — lexical + on-box semantic

Catalog search over the CVE corpus runs **two retrieval lanes fused together**:

- a **lexical** lane — keyword query over CVE id, title, and description, and
- a **semantic** lane — the query is embedded as a vector and matched by nearest-neighbor search against pre-embedded CVE descriptions.

The two ranked lists are merged with **reciprocal-rank fusion** (RRF), so a document found by both lanes outranks a top hit on either alone. The point of the semantic leg is conceptual reach: a query like *"JNDI lookup remote code execution"* finds Log4Shell even though none of those words is the CVE id.

**The semantic lane runs entirely on-box.** The sentence-transformer embedding model is served by the appliance's own loopback search engine — no cloud API, no external call, so the lane works on an air-gapped site. Identifiers are deliberately never embedded: a MAC or serial wants exact index lookup, not vector similarity, so the semantic lane applies to prose only, and it **ranks** results — the control-plane database remains the only source of truth about what exists.

::: note
If the embedding model is down or not yet backfilled, results silently staying lexical-only would be a lie by omission — so the console shows an explicit **"semantic lane offline — lexical only"** chip, with the specific reason in its tooltip. The lexical lane always works regardless. The one manual step is registering an embedding model with the on-box engine; Skans auto-discovers whatever model is deployed and self-heals a stale model reference after a re-deploy.
:::

## Next

- **[Vulnerability management →](/2.0/monitoring/vulnerability-management/)** — the CVE corpus the hybrid lane searches
- **[Network identity & correlation →](/2.0/concepts/network-identity/)** — why identifier hits carry currency labels
- **[Roles & RBAC →](/2.0/reference/roles-and-rbac/)** — the capabilities that gate search sections
- **[The topology map →](/2.0/reference/topology-map/)** — the other identity-first view of the estate
