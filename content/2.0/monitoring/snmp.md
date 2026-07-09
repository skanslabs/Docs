---
title: SNMP monitoring
eyebrow: Monitoring
description: How Skans polls SNMP-capable devices and receives their pushed traps to monitor the IoT/OT and network gear that can't run an agent.
---

Skans watches the devices that can't watch themselves. A camera, PLC, UPS, or managed switch has no agent and often no way to announce a change — but almost all of them speak SNMP. The collector **polls** those devices on a continuous reconcile loop and lands the results in OpenSearch, and it **listens** for the events they push. Together that gives you health, interface counters, and alarm-grade events for the whole IoT/OT and network-gear fabric, with zero software installed on the device.

## Polling: the honest backstop

The collector polls every SNMP-capable target (both **SNMPv2c** and **SNMPv3**) and writes each reading into the `skans-metrics` index. Polling is a fast, continuous reconcile — not a pretend real-time feed. A device that only speaks SNMP has no mechanism to announce "my interface just went down," so Skans asks, on a tight cadence, and records what changed. That's the honest framing: **poll is the backstop for anything that can't push.** Where a device *can* push, Skans prefers the push path (see traps below, and the [alerts](/2.0/monitoring/alerts/) page).

| What | Value |
|------|-------|
| Protocol | SNMP v2c and v3 |
| Metrics index | `skans-metrics` |
| Trap listener | udp/162 |
| Access mode | Read-only (never writes to a device) |

::: note
Proven live: continuous SNMP polling has produced **hundreds of thousands of metric documents** in `skans-metrics` — interface counters and system health across real gear, not a synthetic sample.
:::

## Vendor profiles auto-match themselves

Skans ships roughly **484 drop-in JSON SNMP profiles**, compiled from about **7,598 MIBs**. They **auto-load** and **auto-match** to a device by its own `sysObjectID` — there is no hardcoded device-to-profile table for an operator to maintain. Plug in a device, and if its identity matches a profile, the right OIDs come along with it.

Any SNMP device — matched or not — also gets a **generic floor**: system group, IF-MIB (interfaces), and HOST-RESOURCES. So even an unrecognized target still reports uptime, interfaces, and basic resource health out of the box.

## Traps: the push side of SNMP

A **trap listener on udp/162** receives events the device *pushes on its own* — tamper, link up/down, disk failure, reboot — and lands them in the event store the instant they arrive. This is the push half of SNMP monitoring, complementing the poll half: polling tells you the steady-state numbers, traps tell you the moment something changed. Both feed the same correlated, per-device findings pipeline.

## OT-safe by construction

Industrial and building-automation gear is fragile and unforgiving of chatty management traffic. SNMP monitoring in Skans is read-only and rate-aware by design:

- **Read-only probing** — the collector never writes to a device.
- **Per-target maintenance windows** — pause polling for a target on a schedule.
- **Poll rate-limiting** — configurable poll spacing so a target is never hammered.
- **Source-IP allowlist** — the device only accepts probes from the collector it expects.

::: warning
**Never SNMP-poll a Windows box.** Windows endpoints are always the **agent lane** — logs, metrics, and patch state come through the Skans agent. SNMP (and syslog) are only for IoT/OT and network gear that can't run an agent. Pointing SNMP at Windows is always the wrong lane.
:::

## Monitor lane vs manage lane

This is where SNMP earns its keep. The large majority of the ~484 profiled vendors have **no cert-deploy driver at all** — power and UPS (Vertiv, Eltek), environmental (Stulz, Carel, AKCP), industrial (Moxa, Hirschmann, ABB, Schneider), plus optical, wireless, storage, VoIP, and time/GPS gear. Skans can't push a certificate to most of them, and it doesn't pretend to.

For those devices, **SNMP plus syslog is the entire Skans coverage — and it's largely zero-touch.** That's the boundary between the two lanes: the **manage lane** (cert deploy, config, NAC) covers what the driver matrix supports, while the **monitor lane** (SNMP + syslog) covers everything else that can announce or answer. A device with no driver is not invisible; it's fully monitored.

::: tip
If a device shows up in monitoring but not in the [driver matrix](/2.0/reference/driver-matrix/), that's expected and correct — it's a monitor-lane device. Coverage there is health, interfaces, and events, not certificate management.
:::

## Next

- [Monitoring & alerts](/2.0/monitoring/alerts/) — how polled metrics and pushed traps become correlated, per-device findings
- [Syslog monitoring](/2.0/monitoring/syslog/) — the other half of the monitor lane for IoT/OT and network gear
- [Ports & protocols](/2.0/reference/ports/) — udp/162 traps, SNMP, and the rest of the collector's footprint
- [Driver matrix](/2.0/reference/driver-matrix/) — what the manage lane covers, and where the monitor lane takes over
