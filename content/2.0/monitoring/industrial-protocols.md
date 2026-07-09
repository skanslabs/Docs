---
title: Industrial protocol monitoring (OT/ICS)
eyebrow: Monitoring
description: How Skans reads identity and run/fault state from PLCs and controllers using native, read-only industrial protocol probes — the safest possible touch on gear that speaks no SNMP and can never hold a certificate.
---

Most OT/ICS gear — PLCs, drive controllers, process modules — speaks **no SNMP** and can **never hold a certificate**. It can't run an agent and it won't announce a change. Skans still needs to know it's alive and see its run/fault state, so it reaches these devices in the only language they actually speak: their **native industrial protocol**, sent **read-only**. Skans asks "who are you and are you running?" and reads the answer. It never writes a coil, a register, or a config to the device.

## Why this lane exists

A PLC can't push, can't be polled over SNMP, and can't be enrolled. Under Skans' capability-tier model, that legacy gear doesn't get a certificate it can't hold — it gets **segmentation, an allow-list, and this read-only monitoring**. The industrial probes are how an operator gets identity and liveness from a device that has no other way to be seen, without ever changing its state.

## What's built and shipping

Two native industrial probes are built and shipping. Both are **strictly read-only** — they use the identity/discovery request of each protocol, never a write function.

**EtherNet/IP (CIP List Identity).** Skans sends a CIP *List Identity* request over **udp/44818** and reads back the PLC's **vendor, product, firmware, serial, and run/fault state**. Identity lands in `skans-inventory` as `plc.state`; the liveness/state signal lands in `skans-metrics`. This is the same discovery request an EtherNet/IP tool uses to enumerate a device — it does not touch the control program.

**Modbus/TCP (Read Device Identification).** Skans sends a *Read Device Identification* request over **tcp/502** to confirm **reachability** and read **vendor/product** where the device exposes it. Reachability lands in `skans-metrics` as `modbus.up`. It **never writes a coil or a register** — no `modbus.up` reading ever comes from a write.

| Protocol | Request | Port | Reads | Lands in |
| --- | --- | --- | --- | --- |
| EtherNet/IP | CIP *List Identity* | udp/44818 | vendor, product, firmware, serial, run/fault | `skans-inventory` (`plc.state`), `skans-metrics` |
| Modbus/TCP | *Read Device Identification* | tcp/502 | reachability, vendor, product | `skans-metrics` (`modbus.up`) |

## OT-safe by construction

These probes are authored to be the **safest possible touch on a production PLC**. Safety isn't a setting you remember to turn on — it's how the lane is built:

- **Read-only, always.** Only identity/discovery requests are ever sent. There is no write path in this lane.
- **Per-target maintenance windows.** A target can be probed only inside its allowed window, so nothing hits a controller during a sensitive process phase.
- **Poll rate-limiting.** Probes are paced so a device is never flooded — one gentle question, not a storm.
- **Source-IP allowlist.** Only the Skans collector's declared source address is used, so the probe is predictable and traceable on the OT segment.

::: warning
**Never SNMP-poll Windows, and never treat a PLC like a server.** OT gear is the agentless, read-only lane by design. Skans reaches it with its native protocol's *identity* request only — it does not scan, does not brute-force, and does not write. If a device can't tolerate even a read-only identity request inside its maintenance window, keep it behind segmentation and the allow-list and monitor its liveness at the network edge instead.
:::

## Honest status: built-vs-designed

::: note
**BACnet and OPC-UA are not telemetry collectors yet.** Today BACnet/SC and OPC-UA exist in Skans **only as MANAGE-lane certificate issuance** — not as monitoring or telemetry ingest. The BACnet and OPC-UA *telemetry* collectors are **designed, not built**. Do not assume Skans is reading points or tags from those protocols; it isn't yet.

The **EtherNet/IP and Modbus/TCP probes are authored to spec and shipping, but hardware-validation-pending** — they're awaiting a real PLC bench to go green against physical controllers. Treat them as built-and-ready, not yet bench-proven.
:::

## Where it fits the tiers

This lane is the concrete answer to "what do we do with gear that can't be enrolled?" Incapable legacy OT gets the tiered treatment: **segment it, allow-list it, and monitor it read-only** with the native probe above — instead of forcing a certificate onto a device that can't hold one. The identity and run/fault state flow into the same on-box stores and the same correlated, per-device findings as every other Skans signal.

## Next

- **[Monitoring & alerts](/2.0/monitoring/alerts/)** — the push-first model these probes feed into
- **[Ports & protocols](/2.0/reference/ports/)** — every listener and probe, including udp/44818 and tcp/502
- **[Driver matrix](/2.0/reference/driver-matrix/)** — per-device capability across all four lanes
- **[Enroll a device](/2.0/how-tos/enroll-a-device/)** — the capability-tier decision for each device
