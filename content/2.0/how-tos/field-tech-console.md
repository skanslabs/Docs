---
title: Field tech console
eyebrow: How-tos
description: The short path for panel-van technicians — four jobs, Isolate and Attempt fix, without a SOC tour.
---

Skans is built so a **panel-van technician** can finish a ticket without learning the whole product. This page is the only field how-to you need for day-to-day work.

::: tip
**One ticket → one screen → one primary button → one clear outcome.**  
If you need more, type the page name in the command bar or open **All views**.
:::

## Field home (four jobs)

When the console is in **Field** mode (automatic for field roles, or set `ui.mode` to `tech` on the appliance), home shows four tiles:

| Tile | Use for |
| --- | --- |
| **Needs attention** | Open problems — Respond (isolate / open port) or open the device |
| **Devices** | Find a camera or host by name — **Isolate** / **Open port** on the device |
| **Fixes** | CVE findings — **Attempt fix** when the host has a Skans agent |
| **Status** | Is the appliance healthy? Green / yellow / red |

## Isolate a camera (or other agentless device)

1. Open **Devices** (or search the device name).  
2. Open the device.  
3. Under network protection, click **Isolate** → read the confirm dialog → **Confirm isolate**.  
4. When the job is done, click **Open port** to restore access.

::: warning
Only isolate on the **correct access port** (ticket host). Do **not** isolate domain controllers, uplinks, or agent hosts.
:::

**Respond** on **Needs attention** does the same isolate/open actions for a case tied to that device.

## Attempt fix (Windows / Linux agent)

1. Open **Fixes**.  
2. Find the host/CVE.  
3. **Attempt fix** → confirm → the console queues a **signed** command.  
4. Nothing runs until the agent checks in. Expand the row for job results when available.

If **Attempt fix** is unavailable: the host has **no enrolled agent**. For agentless gear, use **Isolate** on the switch port instead.

## Status

**Status** answers “is the box OK?” — open incidents, control plane / collector, detection pack. Use **Full system** only if L2 asks you to.

## What field techs can skip

- Detection pack versions and signing details  
- MITRE ATT&CK / charts on Vulnerabilities  
- Alerting rule editing, compliance evidence, network hub tabs  
- CLI verbs (those are for L2 / lab)

## Related

- [Detection content & response](/2.0/monitoring/detection-content/)  
- [802.1X access control](/2.0/how-tos/network-access-control/) (includes Isolate / Open)  
- [Vulnerability management](/2.0/monitoring/vulnerability-management/)  
