---
title: Distributed deployment (Core + Edge)
eyebrow: Concepts
description: The planned Tier-2 scale-out topology — a central Core plus lightweight per-site Edge relays — for large and multi-site enclaves, and an honest look at where it stands today.
---

The flagship Skans deployment is **one self-contained appliance**. For large or multi-site enclaves, a planned **Core + Edge** tier scales the same platform across sites without giving up a single system of record. This page is the forward-looking architecture — the concepts and the design decisions behind them — not a deployment you can stand up today.

::: warning
**Planned architecture — design-stage.** The Core + Edge distributed tier is an **opt-in, forward-looking design** (SAD decision **AD-62**, refining **AD-32**). What ships and is proven live today is the **single self-contained appliance** — see **[Installation](/2.0/getting-started/installation/)**. Only the foundational layers below (wire protocol, enrollment, store-and-forward) are prototyped and lab-verified on a two-box setup; boundary groups, content prestaging, summarize-at-Edge, and HA edge pools are roadmap. Nothing here is a supported production deployment, and there are no committed per-Edge device numbers.
:::

## Start here: one appliance is the default

Skans is a **tiered** model, and almost every enclave lives in Tier 1.

- **Tier 1 — the single self-contained appliance.** The default and the flagship. Every service on one box: system of record, CA, directory, network services, and console, sized for a single-site enclave of **up to ~5,000 devices** (PERF-01). This is what ships and is proven live. See **[How Skans works](/2.0/getting-started/how-skans-works/)**.
- **Tier 2 — Core + per-site Edge.** The opt-in scale-out path, added *only* when scale or geography demands it: too many devices for one box, or sites across a WAN. Largely design-stage.

By design there are **only two tiers**. A third, CAS-style middle tier is treated as an anti-pattern until a single Core is provably insufficient — the point is to add reach and locality, not org-chart layers.

## The shape: one Core, many Edges

```text
                        ┌──────────────────────────────┐
                        │          SKANS CORE          │   Site A (HQ)
                        │  system of record · console  │
                        │   CA · AD DS · NPS · data    │
                        └───────────────┬──────────────┘
                                        │  mTLS REST :7327
                  ┌─────────────────────┼─────────────────────┐
                  │                     │                     │
           ┌──────┴──────┐       ┌──────┴──────┐       ┌──────┴──────┐
           │  Skans Edge │       │  Skans Edge │       │  Skans Edge │
           │  collector  │       │  collector  │       │  collector  │
           │  agent-hub  │       │  agent-hub  │       │  agent-hub  │
           │ cache · S&F │       │ cache · S&F │       │ cache · S&F │
           └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
            agents :7326          agents :7326          agents :7326
            + agentless           + agentless           + agentless
               Site B                Site C                Site D
```

The **only** link that crosses the WAN is the Edge-to-Core channel on **`:7327`**, and the **Edge is the pull client** — it dials *out* to the Core. The Core never initiates an inbound connection, which keeps the design NAT- and firewall-friendly: a site only needs outbound reach to the Core. Local devices and agents stay on-site, talking to their Edge on `:7326`.

## The Core: brain and system of record

The Core *is* the appliance concept, unchanged: the **system of record**, the **certificate authority**, the directory (AD DS), NPS, DNS/DHCP, and the **console**. Every privileged operation in the fabric is **minted and authorized here** — issuing an identity, pushing a policy, approving an agent.

- **High availability** is planned as active/standby with a tested backup and SQL Always-On (**AD-47**) — roadmap.
- **The search tier stays single-node.** OpenSearch runs single-node on every tier; clustering is explicitly **out of scope** (**AD-44**). The Core does not scale by clustering search — it is *designed* to scale by pushing correlation out to the Edge (see [Summarize-at-Edge](#summarize-at-edge), still roadmap).

## The Edge: one least-privilege relay

An **Edge** fuses four jobs into a single deployable role — one or more per site:

- **Collector** — agentless polling of on-site cameras, IoT, OT, and network gear
- **Agent-hub** — the mTLS endpoint local Windows agents check in to
- **Content cache** — a near-endpoint distribution point for patches, feeds, and installers
- **Store-and-forward buffer** — a durable queue that holds site data when the Core is unreachable

Crucially, the Edge is a **least-privilege relay** (**AD-38**). It holds **no CA private key, no fleet secret, and no AD-admin context**. It cannot issue an identity or authorize a privileged action on its own — it asks the Core. **Compromising an Edge yields only that one site's device-polling credentials, never the crown jewels.** And because agents and collection run locally, **a down Edge is not a site outage** — the site keeps operating and the Edge spools until the Core returns.

## Design pillars

### Zero-trust enrollment — AD CS only

An Edge joins with a **one-time bootstrap token**. The Core has **AD CS** issue it a scoped, short-lived identity certificate over SCEP/NDES (template `SkansEdgeIdentity`, dual EKU `clientAuth`+`serverAuth`), auto-renewed. There is **no self-issued fallback** — identity always traces to the Core's CA. Agents enroll to their Edge and receive a per-agent certificate; Core-side approval gates every new agent, the same as **[device identity](/2.0/concepts/device-identity/)** on a single appliance. *Status: prototyped, lab-verified.*

### Versioned wire protocol

The Edge-to-Core channel speaks a **versioned protocol** (WireVersion 1.0) over mTLS REST — five message types: `edge-enroll`, `heartbeat`, `roll-up`, `push-policy`, and `mint-op`. A version mismatch returns **HTTP 426 Upgrade Required** rather than opening a partial session, so mixed-version fleets can be upgraded in a rolling fashion within a bounded skew. It is REST, not gRPC. *Status: prototyped, lab-verified.*

### Durable, bounded store-and-forward

The Edge spool is a **disk-backed, bounded, oldest-first queue**. Delivery is **at-least-once**, and the Core deduplicates by a deterministic `_id`, so replays are idempotent. The queue-full policy is **explicit**: the oldest item is **dropped and counted** — never unbounded, never silently discarded. (Silent drop-on-full is the number-one data-loss anti-pattern; this design refuses it.) *Status: prototyped, cross-box verified* — with the Core down, items enqueue and are retained with zero loss; when the Core returns they replay; a resend deduplicates; and over-cap runs drop the oldest and increment a counter.

### Central boundary groups + ordered failover

Assignment is **authored centrally in the Core console** — never hand-edited per Edge. Each device gets an **ordered list**: primary Edge → neighbor Edge → Core hub, governed by a failure threshold (SCCM-style, e.g. 5 errors in 10 minutes), a fallback timer, and a ~24-hour **failback delay** to prevent flapping. Two Edges at one site round-robin. Coverage is validated for **no gaps or overlaps**. *Status: roadmap.*

### Summarize-at-Edge

The headline scale idea: raw site data — polls, check-ins, events — is **correlated, deduplicated, and summarized at the Edge**, and only **roll-up findings** travel to the Core. Core's indexed volume *would* then be bounded by *findings*, not raw events — the deliberate alternative to clustering the search tier. This is consistent with how Skans monitoring is always correlated and bounded rather than a raw firehose (see **[Alerts](/2.0/monitoring/alerts/)**).

::: warning
**This is design intent, not shipped behavior.** The relay built today forwards **raw telemetry** to the Core; the summarize-at-Edge stage is still outstanding. Do not treat "Core volume stays bounded by findings" as a capability you have yet — it is where the design is going. *Status: roadmap.*
:::

### Content distribution near endpoints

The Edge is meant to double as the site's **distribution point**: a **content-addressed (hash-keyed) dedup cache** for patches, CVE + MITRE ATT&CK feeds, and agent installers, filled by **throttled, scheduled** Core→Edge sync, with **prestage export/import** for fully air-gapped sites. Today only a **pull-through cache** exists. *Status: partial.*

## Maturity at a glance

| Layer | Capability | Status |
| --- | --- | --- |
| Wire protocol | Versioned mTLS messages; 426 on version mismatch | Prototyped, lab-verified |
| Enrollment | AD CS bootstrap → scoped least-privilege Edge identity | Prototyped, lab-verified |
| Store-and-forward | Bounded durable spool; at-least-once; idempotent dedup | Prototyped, cross-box verified |
| Combined Edge role | Collector + agent-hub + cache + spool, one deployable | Prototyped |
| Telemetry relay | Edge → Core forwarding | Built — ships **raw** (summarize pending) |
| Boundary groups / failover | Central assignment, ordered fallback, failback | Roadmap |
| Content distribution | Hash-dedup cache, throttled sync, air-gap prestage | Partial (pull-through cache only) |
| Summarize-at-Edge | Correlate/dedupe at Edge, findings-only to Core | Roadmap |
| HA edge pools + rolling upgrade | Active/standby Edges, mixed-version fleet | Roadmap |

::: note
All verification to date is a **two-box lab** — one Edge and one Core on the bench, no mocks. There is **no production or genuine multi-site deployment** yet. There are also **no committed per-Edge device numbers**: the triggers to add an Edge are a per-Edge **capacity budget** and **WAN locality** (a high-latency or intermittent link), and the real figures are Skans-measured after load testing. As a security/compliance appliance, Skans is deliberately **not sized by SolarWinds, SCCM, or Splunk numbers** — that prior art validates the topology *shape*, not the capacity.
:::

## Ports and standards

| Port | Link | Notes |
| --- | --- | --- |
| `:7327` | Edge ↔ Core, mTLS REST | The only link that crosses the WAN; the Edge dials out |
| `:7326` | Agents ↔ their Edge (or the Core), mTLS REST | Local to each site |
| `:9200` | OpenSearch | Loopback only, single-node — never clustered |

See the **[Ports reference](/2.0/reference/ports/)** for the full list. The design maps to NIST controls including **SC-7** (boundary protection), **CP-10** (recoverable store-and-forward), **SI-4 / AU-6** (monitoring and correlation at the Edge), **AU-9** (audit protection), **IA-5 / SC-12** (identity and key management), **CM-2 / CM-6** (central configuration), and **SR-3 / SR-4** (supply-chain integrity of distributed content).

## Prior art — shape only

The two-tier shape is borrowed from tools admins already know — SCCM (a Primary site with MP/DP Secondary sites), SolarWinds (a poller with Remote Collectors), Splunk (indexers with forwarders), and Milestone XProtect (a Management Server with per-site Recording Servers). Skans borrows the **shape**, not the sizing, and stops at two tiers by design.

## What you can run today

- **[Installation →](/2.0/getting-started/installation/)** — stand up the single self-contained appliance, which is what ships and is proven live
- **[How Skans works →](/2.0/getting-started/how-skans-works/)** — the mental model, including "one box, or many"
- **[Device identity →](/2.0/concepts/device-identity/)** — the CA-issued identity model the Edge extends
- **[Install the Windows agent →](/2.0/how-tos/install-the-agent/)** — the agent lane that an Edge's agent-hub would front
