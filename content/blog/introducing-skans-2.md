---
title: "Introducing Skans 2.0"
date: 2026-07-01
author: Skans Labs
category: Announcement
excerpt: "A root of trust for isolated networks — device identity, access control, monitoring, and compliance evidence, set up by the technician who installs the cameras."
---

Today we're announcing **Skans 2.0** — the release that turns an isolated camera, IoT, OT, or building-automation network into a fully governed enclave, without a security team and without ever phoning home to a cloud.

## What's new

- **Distributed by design.** A central Core plus lightweight Edges per site scale to thousands of devices across multiple locations, with store-and-forward so nothing is lost when a link drops.
- **Every device gets an identity.** Cameras, controllers, and Windows endpoints each receive their own certificate from the built-in CA — no shared passwords anywhere.
- **Bounded, correlated findings.** You see a meaningful list of issues per device, never a raw firehose of events.
- **Compliance evidence, automatically.** Controls map to NIST families and produce audit-ready records as the system runs.

## Everything inside, nothing out

Skans is air-gap-first. The whole root of trust — identity, certificates, access control, monitoring, patching, and audit — runs on the local network itself. When a feature needs outside data, it comes in through a controlled, signed update, never by opening the enclave to the internet.

Ready to try it? Start with the **[Installation guide](/2.0/getting-started/installation/)**, then **[enroll your first device](/2.0/how-tos/enroll-a-device/)**.
