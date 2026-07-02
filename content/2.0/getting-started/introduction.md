---
title: Introduction
eyebrow: Getting Started
description: What Skans is, who it's for, and how the pieces fit together.
---

**Skans is NIST security-in-a-box for isolated networks** — the video-surveillance, IoT, OT, and building-automation enclaves that were never designed to defend themselves. It gives every device on the wire its own identity, encryption, access control, and continuous compliance evidence, and it's set up by the same technician who installs the cameras — no security team required.

The guiding principle is simple: **everything inside, nothing out.** Skans is air-gap-first. It brings a full root of trust — identity, certificates, access control, monitoring, patching, and audit — onto the local network itself, so an enclave can meet modern security baselines without ever phoning home to a cloud.

::: note
These docs describe the appliance and its console. If you're evaluating Skans for a site, start here, then work through **Requirements** and **Installation**.
:::

## What you get

- **Device identity for everything.** Cameras, controllers, sensors, and Windows endpoints each get their own credential from a built-in certificate authority — no shared passwords.
- **Access control on the wire.** 802.1X / MAC-based NAC with dynamic VLANs keeps unknown devices off the network and quarantines the rest.
- **Monitoring & correlation.** Findings are correlated and deduplicated per device — you see a bounded, meaningful list, never a raw firehose of events.
- **Patching without the cloud.** Endpoint agents schedule updates locally, so isolated Windows machines stay current.
- **Compliance evidence, automatically.** Controls map to NIST families and produce audit-ready records as the system runs.

## How it's built

Skans runs as a small always-on appliance. Larger or multi-site deployments add lightweight **Edges** that collect and cache locally and report to a central **Core**.

```text
                 ┌─────────────────────────────┐
   isolated      │            CORE             │   identity · policy
   enclave  ───▶ │  AD DS · AD CS · NPS · UI   │   monitoring · audit
                 └──────────────┬──────────────┘
                                │  mTLS, store-and-forward
              ┌─────────────────┼─────────────────┐
          ┌───┴───┐         ┌───┴───┐          ┌───┴───┐
          │ EDGE  │         │ EDGE  │          │ EDGE  │   collect · cache
          │site A │         │site B │          │site C │   per site
          └───────┘         └───────┘          └───────┘
```

Windows endpoints run a **lightweight agent** (patch scheduling, Defender posture, log shipping); cameras, IoT, and OT devices are managed **agentlessly** over their native protocols.

::: tip
New to the platform? The fastest way to see value is to stand up a single appliance, enroll one device, and watch it appear in the console — the **Installation** and **Enroll a device** guides walk through exactly that.
:::

## Where to go next

- **[Requirements](/2.0/getting-started/requirements/)** — what you need before you install.
- **[Installation](/2.0/getting-started/installation/)** — bring the appliance online.
- **[Enroll a device](/2.0/how-tos/enroll-a-device/)** — give your first device an identity.

<!-- e2e-autopublish-1782983839 -->
