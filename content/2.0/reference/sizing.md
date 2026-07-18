---
title: Sizing & storage
eyebrow: Reference
description: How to size the appliance — RAM, CPU, and disk — for your device count and how long you keep telemetry.
---

Skans runs a whole enclave from **one box**, so that box has to carry everything at once: the directory and certificate authority, the relational database, the on-box search store where telemetry lives, and the control plane. Sizing is mostly about two questions — **how many devices** you manage and **how long you keep their data** — because those, not raw network traffic, decide how much disk and memory you need.

::: tip
Skans correlates and bounds findings per device, so data volume scales with **device count and retention**, not with how busy the network is. The relational database stays tiny; the thing to plan around is the **search store on disk**.
:::

## At a glance

| Resource | Minimum (small site) | Recommended |
| --- | --- | --- |
| **CPU** | 4 cores, x86-64 server class | 8+ cores |
| **RAM** | 16 GB | **32 GB+** — scales with device count and retention |
| **Disk** | 128 GB SSD | **256 GB–1 TB SSD** — sized to your retention window (see below) |
| **Network** | 1 NIC on the enclave | + a second NIC for management |

A single appliance targets **up to ~5,000 devices/certificates**.

## Why RAM is higher than a single service needs

This is an **all-in-one appliance** — one box simultaneously runs Active Directory, the AD CS certificate authority, SQL Server, the OpenSearch search store (including on-box ML for vulnerability search), the control plane, and the collector. Each needs its own slice of memory, so plan RAM for the **sum**, not for any one component:

- **16 GB** is the floor — fine for a small OT/IoT site with a short retention window.
- **32 GB** gives the search store enough working memory to stay healthy under vulnerability search and reporting while AD and SQL keep their share.
- **Larger sites** (thousands of devices, months of retention) want **64 GB** so the search store's heap can grow with the data.

::: warning
Undersizing RAM shows up as the search store struggling under load, not as an obvious error. When in doubt, buy up on memory — it is the hardest thing to add later on a sealed appliance.
:::

## How storage works

Telemetry — Windows event logs, device metrics, and syslog — lands in the on-box search store, written into **one index per day** per data type. You choose a **retention window**; older days are aged out so the store doesn't grow forever. Disk is therefore:

> **disk ≈ (daily data rate × retention days) + reference data + headroom**

- **Reference data** (the CVE database, EPSS scores, the vulnerability-search model, device identity) is a **fixed baseline of a few GB** that stays regardless of retention.
- **Headroom** matters because the same disk also holds the relational database, backup staging, and the operating system — don't fill it to the brim.

### What drives the daily rate

| Source | Scales with | Notes |
| --- | --- | --- |
| **Device metrics** (SNMP/telemetry) | device count × poll frequency | usually the **largest** source; can spike during heavy discovery or polling |
| **Syslog** (network/OT gear) | number of syslog sources | steady, moderate |
| **Windows event logs** (agents) | number of Windows servers/workstations | **light on OT/IoT sites**, which have few of them; heavier in IT-heavy environments |

On an **OT/IoT** enclave the mix is dominated by device metrics and syslog, because those networks have few servers and workstations. On an IT-heavy site, Windows logs become a larger share.

### Picking a disk size

The practical approach: pick your retention window, watch the daily rate the appliance reports for your actual device mix over the first week, and size disk for `rate × days` plus a comfortable margin. As rough starting points:

- **Small OT site, ~weeks of retention** → **256 GB SSD** is generous.
- **Hundreds of devices, ~1–3 months** → **512 GB SSD**.
- **Large site or long retention** → **1 TB SSD** and re-check against the measured rate.

::: note
Use **SSD/NVMe**, not spinning disk — the search store is latency-sensitive. Keep retention aligned to what you actually investigate; longer retention is mostly about keeping historical **metric trends**, which cost far less than full-resolution recent data.
:::

## When one box isn't enough

The single appliance is ideal for a bounded enclave. If you outgrow it — very high device counts, or long retention on a metrics-heavy fleet — the answer is a **bigger box** (more RAM and disk) or a **distributed deployment** where sites keep short local retention and forward summaries to a central Skans. Talk to us about the crossover point for your device count and retention target.

## Related

- [Requirements](/2.0/getting-started/requirements/) — platform, network, and what the appliance provides for you.
- [How Skans works](/2.0/getting-started/how-skans-works/) — the two device lanes and the driver pack.
