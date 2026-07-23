---
title: Monitoring & alerts
eyebrow: Monitoring
description: How Skans monitors an enclave — push-first, event-driven collection with an always-on alert engine that produces correlated, per-device findings instead of a raw event firehose.
---

Skans monitoring is **push-first and event-driven**: anything that can announce a change does so the instant it happens, and every finding is **correlated and bounded per device** — never a raw event firehose. The console reads a materialized picture of each device's state, and an always-on alert engine turns occurrences into a small number of meaningful alerts. This page is the model for operators and admins, not a click-by-click how-to.

## The model: push-first, event-driven

Traditional monitoring polls everything on a timer and hopes the interval was short enough. Skans inverts that. **Anything that can push — a Windows event from the agent, a syslog message, an SNMP trap — does so on occurrence.** Each push does two things at once: it **upserts that device's materialized state**, and it **fires the alert engine immediately**. The target is event-to-incident in **seconds**, not at the next poll tick.

Some devices genuinely can't push. A camera or PLC that only speaks SNMP has no way to announce a change, so Skans polls it on a **fast, continuous reconcile** as an honest backstop — not a pretend real-time feed.

::: note
Be straight about the boundary: pull-only sources are *reconciled quickly*, not truly event-driven. Skans doesn't imply everything is real-time push — SNMP-only gear is polled fast because that's the best you can do with a device that can't talk first.
:::

## Two lanes

Skans monitors through the same two lanes it uses to onboard devices, and never mixes them.

**Agent lane — Windows servers and workstations.** The Skans agent runs *on* the endpoint and pushes telemetry over mutual TLS: inventory, metrics, Defender health, patch state, and logs. Because the agent reads the local **Security** channel as SYSTEM, a failed logon (event 4625) reaches Skans the instant it happens — no forwarding tier in between. The agent ships a **full event mirror**: every enabled Admin/Operational channel, unfiltered, sent incrementally and bounded by per-channel bookmarks and hard caps so a chatty box can't run away with ingest. Operators can also tail an application's own log file where a channel doesn't exist. See **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**.

**Agentless lane — cameras, IoT, OT, and network gear.** The Skans collector service is a low-privilege worker that listens and probes: SNMP polling, a **syslog listener**, an **SNMP-trap listener**, and ICMP/TCP/API reachability probes. For PLCs that speak no SNMP, it does **read-only ICS identification** natively — EtherNet/IP *List Identity* and Modbus/TCP — to read run/fault state and identity without writing to the device. Everything is normalized into the on-box store and evaluated by the alert engine.

::: warning
**Never SNMP-poll Windows.** Windows endpoints are always the agent lane; SNMP is only ever used for IoT/OT/network gear. Windows event collection is the always-on agent lane — there is no separate forwarding pipeline to stand up or maintain.
:::

Vendor SNMP support is **drop-in JSON profiles** that auto-load and auto-match to a device by its own `sysObjectID` — there is no hardcoded device-to-profile map to maintain.

## The alert engine

The alert engine is an **always-on** service, and its whole job is to keep you out of the firehose. The rule is **correlation, not raw volume**: findings are correlated and **bounded by device count**, so a site of 200 devices produces alerts on the order of devices affected — not thousands of raw events. A site-wide outage collapses into a handful of correlated alerts instead of one-per-host.

The model is **state-based plus count-growth**:

- **State-based** — an alert reflects a device's *condition* (offline, failing, drifted), and clears when the condition clears, rather than re-firing on every repeat signal.
- **Count-growth** — rules can watch a signal's *rate of increase* (for example, a burst of failed logons) rather than a single occurrence.

**Storm de-duplication.** A site-outage rule coalesces into a single **storm count** rather than one alert per host. Transient or portable machines (laptops, anything that legitimately comes and goes) get a **24-hour offline grace** and are **excluded from the storm count**, so a van full of sleeping laptops doesn't read as an incident.

**Registered-hosts-only, fail-open.** The availability / "device offline" rule fires only for **registered** hosts — an enrolled agent or a known inventory device — so unmanaged noise doesn't page you. If that allowlist is missing or more than 30 minutes stale, the rule **fails open** and watches everything rather than going silent.

**MITRE ATT&CK enrichment.** Alerts are tagged with relevant ATT&CK technique IDs, so a finding arrives with context for triage rather than as a bare event.

**First-party detection packs.** IoT/OT and network rules ship as versioned **content packs** (for example `skans.detection.core` **0.4.0**) under `C:\Skans\detection-packs`. The collector loads the highest pack version, merges into the alert engine, and publishes the **effective** rule set (including pack source) so the console can show what is actually running. Packs are **Skans-authored only** — no third-party SIEM rule libraries. Syslog is **decoded** into stable fields before rules match. Full story: **[Detection content & response](/2.0/monitoring/detection-content/)**.

**Incidents worklist.** Correlated cases land under **Security → Incidents**. From an incident the operator can open **Respond** for fabric/identity actions (isolate port, restore, quarantine VLAN, revoke cert) — always **confirm-gated**, never automatic on rule fire.

::: note
A **failed-logon (4625)** signal rides the agent lane today. Packaged count-growth / brute-force *rules* continue to expand with the data plane; treat deep host XDR parity as out of scope — pair with a dedicated EDR if you need it.
:::

## Alert rules & notifications: the /alerting console

The engine above ships with an operator console over it — **Alerting** (`/alerting`), gated by the **`alert.manage`** capability:

- **Rule management** — enable, disable, and tune the packaged rules from the console. A save goes live on the engine's next evaluation cycle; no service restart.
- **Pack inventory** — which detection pack versions loaded (for example `skans.detection.core@0.4.0`) and effective rule source (builtin vs pack).
- **Suppressions with a compliance guardrail** — a suppression silences a rule for a host pattern for a bounded window. If the rule is **compliance-tagged** (for example a rule that evidences **NIST AU-6**), the console **requires a written justification** before it accepts the suppression. The record — who, why, until when — is written to the audit log as an explicit **risk acceptance** and surfaced to the compliance view, so a silenced control is never an invisible gap.
- **Snooze with expiry** — a snooze always carries an expiry; nothing gets silenced indefinitely by accident.
- **Escalation / renotify** — an unacknowledged alert can re-notify on a configured interval instead of being sent once and forgotten.
- **Delivery health** — per-channel notification delivery health (did the SMTP relay or webhook actually accept the last dispatch), so you learn about a broken channel from the console, not from a missed incident.

## The console reads the cache, not the device

In the current data-plane design, opening a device page does **not** run a live query against the device. The console reads a **materialized store** — a compact, grid-queryable core row plus one rich rollup document per device — in a single fast query, and shows you **"updated Xs ago"** with a **stale badge** and a bounded **Refresh now** that recollects just that one host on demand. This is what lets Device Detail load quickly without hanging on an unreachable box, and it removes the last on-demand-PowerShell holdout.

::: note
The full materialized device-state plane — the one-query cache read, the "updated Xs ago" UX, and the fast reconcile cadences (roughly **~30s** liveness and **~30–60s** performance counters) — is the **current data-plane design**, partly pending sign-off. What is unambiguously shipped today is syslog/trap ingestion, continuous SNMP polling, the always-on alert engine, agent heartbeats, and the agent full-event-mirror lane. Treat the cache-read UX and the exact cadences as near-term design, not settled long-shipped behavior.
:::

## Self-monitoring

Skans watches itself. A self-health service samples the appliance's **own** vitals on a short cycle — system-disk space, RAM, CPU, the per-database size against SQL Express's limit, OpenSearch cluster status, and core-service liveness — and raises immediate **Critical** alerts when something is wrong. The same detection-to-destination path carries the crown-jewel detectors — domain-controller drift, DR / AD-backup failure, PKI expiry, self-health, and Critical CVE matches — as structured alerts that the collector's rules then dispatch outward.

## Delivery and storage

The on-box **OpenSearch** store is the primary home for logs, events, and metrics; the control-plane database holds device state. Key indices include the agent Windows-event mirror, per-device state rollups, metrics, and alerts, with a default **365-day** retention policy on the Windows-event data.

Notifications dispatch through the notifier with **severity routing** and **quiet-hours**:

| Channel | Use |
| --- | --- |
| **SMTP relay** | Email to operators / distribution lists |
| **Webhook** | Chat, ticketing, or custom automation |
| **SIEM forward** | Optional offload to a customer SIEM for scale |

Forwarding to a customer SIEM is **optional** — on-box OpenSearch is the system of record, and the forward exists for scale or central correlation. On an air-gapped site with no outbound channel, delivery **degrades gracefully to console-only**: you still see everything in the console, nothing is silently dropped.

Common listeners:

| Listener | Port |
| --- | --- |
| Syslog | 514 |
| SNMP traps | 162 |
| Agent hub (mTLS REST) | 7326 |
| Console (HTTPS) | 7328 |

The full list is in **[Ports & protocols](/2.0/reference/ports/)**.

## What Skans monitoring is NOT

::: warning
Skans monitoring is **push-first collection plus correlation — not a full IDS/EDR.** It records, correlates, and alerts on what devices and endpoints report; it does not do deep host behavioral detection or network intrusion analysis. **Pair Skans with a dedicated IDS/EDR** for complete NIST *Detect* coverage. Skans is also explicitly **not a SIEM, not an NVR, and not an NMS** — those are out of scope by design. **Detection never auto-runs active response** — isolate / revoke / host attempt-fix are operator-gated only.
:::

## Next

- **[Detection content & response →](/2.0/monitoring/detection-content/)** — packs, Incidents Respond, honest non-AR stance
- **[Vulnerability management →](/2.0/monitoring/vulnerability-management/)** — CVE + MITRE ATT&CK matched to live inventory
- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — the Windows push lane
- **[NIST 800-171 / CMMC evidence →](/2.0/compliance/nist-cmmc-evidence/)** — where monitoring fits the *Detect* function
- **[Ports & protocols →](/2.0/reference/ports/)** — every listener and where it's used
