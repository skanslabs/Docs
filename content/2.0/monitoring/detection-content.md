---
title: Detection content & response
eyebrow: Monitoring
description: How Skans detects IoT/OT and enclave signals with first-party content packs, and how operators respond — isolate a port, revoke a cert, or attempt a host fix — without automatic active response.
---

Skans detection is **first-party and appliance-native**: rules and decoders are authored for the enclave / IoT / OT void, versioned as **content packs**, and evaluated by the always-on **AlertEngine** on the collector. Findings fan into the console worklist. **Response actions are operator-gated only** — packs and the alert engine never isolate a port or patch a host by themselves.

This page is the product story for detection content and response. For the general monitoring model, see **[Monitoring & alerts](/2.0/monitoring/alerts/)**.

## What detects what

| Engine | Where it runs | Typical signal |
| --- | --- | --- |
| **AlertEngine** + **detection packs** | Collector | Syslog / netlog / metrics rules (auth fail, link down, firewall deny, port-security, STP/PoE, ICS fault, …) |
| **Control-plane detectors** | Control plane | Self-health, PKI, backup/DR, fabric, Critical CVE match fan-in |
| **Agent security frames** | Windows / Linux agent | Endpoint signals that ride the agent lane (not a second SIEM agent) |

OpenSearch is the **store and search bus**, not the SIEM brain. OpenSearch Security Analytics plugins may be on disk with the bundle; they are **not** the product detection path.

::: warning
Skans is **not** a Wazuh / generic XDR replacement and **does not** ship third-party SIEM rule libraries (Wazuh, Elastic detection-rules, OSSEC, etc.). Content is **Skans-authored** so there is no third-party decoder/rules license surface on the appliance.
:::

## Detection content packs

Packs live under **`C:\Skans\detection-packs\`**, versioned by pack id (for example `skans.detection.core`). The collector **loads the highest version** of each pack id and merges rules into the alert engine (same rule **name** replaces a built-in; new names append).

| Pack | Focus (current shipping core) |
| --- | --- |
| **`skans.detection.core` 0.4.0** | Network auth failure, syslog auth, link down, firewall deny, config change, port-security, **STP/BPDU**, **PoE power deny**, **device reload**, ICS major fault / EtherNet/IP fault observation |

Each rule is designed with a **content profile** (signal, severity, cooldown, host field, false positives, operator action) and **fire / no-fire fixtures** before it ships. You do not hand-edit Lucene on every site to get baseline IoT/OT coverage.

**Decode-then-rule:** syslog lines are enriched by a first-party **SyslogDecoder** into stable fields (`auth.result`, `iface.state`, `firewall.action`, `stp.event`, `poe.event`, …) so pack queries match structure, not one-off message substrings. See **[Syslog ingestion](/2.0/monitoring/syslog/)**.

::: note
**Signed packs.** Detection packs can ride the same CMS-signed `.skb` path as other content when published that way. Directory packs staged by the installer / collector deploy are the lab-default load path; operators still see which pack version is **effective** on the Alerting / packs surfaces.
:::

## Incidents worklist

Correlated findings and control-plane cases land on **Security → Incidents** (and related alerting views). That is the **one worklist** for fabric and identity response — not a second SIEM console.

## Operator-gated response (not automatic AR)

Nothing in the alert engine auto-isolates a switch port or auto-patches a host. The operator chooses an action after reading the incident or vulnerability finding.

| Action | Where | What it does | Cap |
| --- | --- | --- | --- |
| **Isolate port** | Device detail · Incidents → **Respond** | Force-unauthorized / shut the **wired attachment** only (NAC / controller path) | `nac.manage` |
| **Open port / restore** | Same | Force-authorized on that port (undo isolate) | `nac.manage` |
| **Quarantine VLAN** | Respond (when configured) | MAB + quarantine VLAN on that port | `nac.manage` |
| **Revoke cert** | Respond | AD CS revoke + CRL publish | `ca.manage` |
| **Attempt fix** | **Security → Vulnerabilities** | Queue signed host remediation for an **enrolled** agent | `device.manage` |

::: warning
**OT safety.** Tier-C / ICS targets need an explicit OT confirm (second click / CLI `--confirm-ot`). Prefer sacrificial lab ports for practice. **Never** isolate DC, uplink, or agent hosts as a casual test.
:::

**Agentless cameras and PLCs** use fabric/identity actions (isolate, revoke). **Host package/KB scripts** only run on enrolled Windows or Linux agents — see **[Vulnerability management](/2.0/monitoring/vulnerability-management/)**.

## Honest boundaries

- **Not** automatic active response (no Wazuh-style AR library on rule fire).  
- **Not** a full IDS/EDR — pair with one if you need deep host or network intrusion analysis.  
- **Not** “import every public Sigma rule as product detection” — Sigma on SUS indexes as **reference intel** (`skans-sigma`); first-party pack rules are what the AlertEngine evaluates for enclave IoT/OT.  
- Isolate requires a working fabric write path (controller credentials + configurator) already proven for Protect-style operations.

## Next

- **[Monitoring & alerts →](/2.0/monitoring/alerts/)** — engine model, suppressions, delivery  
- **[Syslog ingestion →](/2.0/monitoring/syslog/)** — agentless push path  
- **[802.1X access control →](/2.0/how-tos/network-access-control/)** — admission + operator isolate  
- **[Vulnerability management →](/2.0/monitoring/vulnerability-management/)** — Attempt fix  
- **[Skans Update Service →](/2.0/how-tos/skans-update-service/)** — signed feeds and packs  
