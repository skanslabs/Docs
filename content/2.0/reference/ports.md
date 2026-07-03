---
title: Ports & network reference
eyebrow: Reference
description: The ports and protocols each Skans service uses on the enclave, and which listeners are inbound, outbound, or loopback-only relative to the appliance.
---

Skans runs a whole enclave from one box, so most of its traffic is between the appliance and the devices it manages. This page maps each service to its port, protocol, and direction **relative to the Skans appliance** — what an operator browser reaches, what managed devices connect into, and what never leaves the box at all.

::: note
Direction is stated from the appliance's point of view. The Windows agent, for example, holds no inbound listener of its own — it connects **up** to the appliance — so its port shows as an **inbound** listener *on the appliance*.
:::

Two tiers below separate what the Skans spec pins down from what follows each protocol's well-known default. Treat the first table as authoritative and the second as "confirm against your installer config."

## Documented in the Skans spec

These ports are named explicitly in the Skans service and architecture docs. They are what you plan firewall rules around for a single self-contained appliance.

| Service | Port | Protocol | Direction (vs. appliance) | Purpose | Owning service |
| --- | --- | --- | --- | --- | --- |
| Console / control plane | **7328** | TCP / HTTPS | Inbound (operator browser → appliance) | Blazor-Server console + REST; also reverse-proxies the embedded search dashboards | `SkansCP` |
| Agent hub | **7326** | TCP / mTLS | Inbound (endpoint agents → appliance) | Windows-agent telemetry + command channel, authenticated with a per-agent AD CS certificate | `SkansAgentHub` |
| Syslog | **514** | UDP | Inbound (devices → appliance) | Agentless log ingest from IoT / OT / network gear | `SkansCollector` |
| SNMP trap | **162** | UDP | Inbound (devices → appliance) | Agentless trap ingest from devices | `SkansCollector` |
| Internal core API | *loopback* | mTLS over named pipe / loopback | On-box only | Least-privileged workers ↔ the trusted core; no TCP port is exposed | core |

::: note
Skans binds its own services in one reserved, adjacent block — **7326** agent hub, **7327** Edge↔Core, **7328** console — chosen off collision-prone defaults and adjacent so a single firewall rule (`allow 7326-7328`) covers the appliance. This is confirmed live on the flagship appliance, not just spec-quoted. If a firewall rule or bookmark still points at a legacy port, update it to the block above.
:::

::: note
The agent transport on **7326** is **mTLS REST**, not gRPC, and the agent stores nothing in SQLite — telemetry streams to the appliance. Control-plane state lives in SQL Server (SQL Express); telemetry and logs live in the on-box search store.
:::

## Standard defaults (not enumerated in the Skans spec)

These services are shipped and named in the docs, but the source files give the **service, not a port number**. The numbers below are each protocol's IANA / well-known default — correct in practice, but you should confirm them against the running installer configuration rather than treat them as spec-quoted.

| Service | Port | Protocol | Direction (vs. appliance) | Purpose | Owning service |
| --- | --- | --- | --- | --- | --- |
| SNMP poll | 161 | UDP | Outbound (appliance → device) | Agentless polling of IoT / OT / network devices | `SkansCollector` |
| RADIUS (auth) | 1812 | UDP | Inbound (switch authenticators → appliance) | 802.1X EAP-TLS admission | NPS |
| RADIUS (accounting) | 1813 | UDP | Inbound (switch authenticators → appliance) | 802.1X session accounting | NPS |
| SCEP / NDES | 80 / 443 (IIS) | HTTP / HTTPS | Inbound (SCEP-native devices → appliance) | Certificate enrollment at path `/certsrv/mscep` | AD CS / NDES |
| DNS | 53 | UDP + TCP | Inbound (enclave → appliance) | AD DS–integrated DNS with a forwarder | AD DS |
| Search store (OpenSearch 3.7) | 9200 | TCP / HTTPS | **Loopback only (127.0.0.1)** | On-box telemetry / log store; never network-exposed | `SkansOpenSearch` |

::: warning
The numbers in this second table are protocol defaults, **not values pinned by the Skans spec**. The spec names each service — SNMP poll, RADIUS/802.1X, SCEP at `/certsrv/mscep`, AD DS DNS, and the OpenSearch store — but does not state a port for them. Verify against your installer config before writing firewall rules.
:::

## Two monitoring lanes

The split between the agent lane and the agentless lane is an architectural invariant, and it maps directly onto the ports above:

- **Agent-managed (Windows endpoints)** push over the **7326** mTLS hub. Windows event collection rides this lane end to end.
- **Agentless (IoT / OT / network devices)** flow through the `SkansCollector` lanes — **syslog 514**, **SNMP trap 162**, and outbound **SNMP poll**.

Windows endpoints are never SNMP-polled; SNMP is only ever used for IoT / OT and network gear. See **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)** and **[Enroll a device](/2.0/how-tos/enroll-a-device/)** for the two paths.

## Loopback and never-exposed services

The on-box search store and its dashboards are **loopback-only by design**. The browser never talks to OpenSearch directly — the console on **7328** reverse-proxies the dashboards, so **7328** is the only web port an operator's browser ever reaches. The internal core API between the low-privilege workers and the trusted core likewise rides a named pipe / loopback mTLS channel with no TCP port.

::: note
**Retired:** the old WEF → WEC → Fluent Bit Windows-event log-shipper is gone. There is no separate log-shipper port — Windows events now flow over the agent's **7326** lane into the on-box search store.
:::

## Next

- **[Requirements](/2.0/getting-started/requirements/)** — the network and platform a site needs before install
- **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)** — the 7326 agent lane
- **[Troubleshooting](/2.0/reference/troubleshooting/)** — when a service or listener isn't reachable
