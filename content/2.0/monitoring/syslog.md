---
title: Syslog ingestion
eyebrow: Monitoring
description: How Skans ingests syslog from firewalls, switches, cameras, and other network gear over udp/514 — parsed, device-tagged, allowlisted, and fed to the always-on alert engine.
---

Syslog is how most non-Windows gear announces what it's doing, and for a lot of that gear it's the **entire** monitoring story — a firewall, switch, camera, or intercom that can't hold a certificate can still tell Skans the instant something happens. Skans runs a syslog listener that accepts those messages, ties each one to the device that sent it, and lands it where the alert engine can act on it. This is push-first monitoring for anything with a syslog target field: point the device at Skans and it announces on occurrence, no polling interval to tune.

## Where the listener runs

The syslog listener is part of the **Skans collector service** — a separate, low-privilege worker Skans calls **Plane B**. It is deliberately isolated from the control plane because syslog is **untrusted network input**: anything on the wire can send a UDP packet to port 514, so the code that parses it runs with the least privilege it can and never sits inside the control plane.

The listener binds **udp/514** and accepts both common wire formats:

| Format | Standard | Notes |
| --- | --- | --- |
| BSD syslog | RFC 3164 | Legacy `<PRI>` + timestamp + tag; still the default on much older gear |
| Structured syslog | RFC 5424 | Modern format with structured data and proper timestamps |

Skans auto-detects which format a message is in — you don't configure it per device.

## What happens to a message

Every accepted message runs the same short path:

1. **Parse** — the raw datagram is decoded as RFC 3164 or RFC 5424.
2. **Tag / correlate** — the message is matched to the **device** that sent it, so the log line is attached to a real entity in the console, not just a source IP.
3. **Decode (first-party)** — a **SyslogDecoder** enriches the document with stable fields when patterns match — for example `auth.result`, `iface` / `iface.state`, `firewall.action`, `config.action`, `port.security`, `stp.event`, `poe.event`, `system.event`, plus best-effort `vendor.guess`. Rules match those fields instead of fragile one-off message substrings.
4. **Land** — written to OpenSearch index **`skans-netlog-*`** with **`Source=syslog`** (promoted decoder keys at top level for queries).
5. **Evaluate** — the always-on alert engine, including **first-party detection packs**, turns occurrences into **correlated, per-device findings** — not a raw log firehose.

This is the same push-first, event-driven model the rest of Skans monitoring uses: the device announces on occurrence, Skans correlates, and you see a bounded number of meaningful alerts rather than every line the device ever emitted.

::: tip
Pack rules cover common IoT/OT and network cases (auth failure, link down, firewall deny, config change, port-security, spanning-tree / BPDU, PoE power deny, device reload, ICS fault). See **[Detection content & response](/2.0/monitoring/detection-content/)**.
:::

## Security: source-IP allowlist

Because the listener takes untrusted input, it does **not** accept syslog from anything on the network. Only **configured device IPs** are accepted; everything else is dropped. This is part of the same untrusted-input isolation that puts the collector on its own plane.

The allowlist lives in **`C:\Skans\collectors.json`** under **`Syslog.AllowedSources`**:

```json
{
  "Syslog": {
    "AllowedSources": [
      "192.168.103.1",
      "192.168.103.254"
    ]
  }
}
```

::: warning
Edits to `collectors.json` are read at startup — **restart the collector service** after changing `Syslog.AllowedSources` for the new list to take effect. An IP that isn't on the allowlist is silently dropped, so if a device's logs never appear, check that its **source IP** is listed here first.
:::

::: note
The allowlist is by **source IP**. udp/514 is unauthenticated by design — the allowlist is the gate. Only add IPs of devices you actually intend to monitor.
:::

## What to point at it

Any syslog-capable device is a candidate — **firewalls, switches, cameras, intercoms, gateways**, and similar network and OT gear. Set the device's syslog/remote-logging target to the Skans host on udp/514, then add its source IP to the allowlist. For gear that can't hold a certificate and can't run an agent, syslog is frequently the **entire** monitoring value Skans provides for it.

::: warning
**Never syslog a Windows box.** Windows endpoints are always the agent lane — they push inventory, metrics, Defender health, patch state, and the full event log over mutual TLS via the Skans agent. Syslog (and SNMP) are only ever for IoT/OT/network gear. See **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**.
:::

## Proven live

This is built and exercised end-to-end, not just wired up: an **OPNsense firewall** configured to send syslog to udp/514 was ingested through the whole path — **RFC 5424-parsed**, **device-tagged** to the firewall, and **searchable in `skans-netlog`** with `Source=syslog`. That's the honest state today: one real device class proven through the full pipeline; other syslog-capable gear uses the identical path.

## Retention

Netlog data lands in **OpenSearch** under a **~365-day** retention posture. Be clear that this is a **policy**, not a physical limit — retention is governed by index lifecycle configuration and the storage you give it, and it can be tuned. The default intent is roughly a year of searchable network log history.

## Next

- [Monitoring & alerts](/2.0/monitoring/alerts/)
- [Detection content & response](/2.0/monitoring/detection-content/)
- [Ports & protocols](/2.0/reference/ports/)
- [Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)
- [Enroll a device](/2.0/how-tos/enroll-a-device/)
