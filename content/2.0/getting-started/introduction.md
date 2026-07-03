---
title: Introduction
eyebrow: Getting Started
description: What Skans is, who runs it, and what to read next.
---

Skans turns an **isolated network** — the kind of islanded camera, IoT, OT, or building-automation enclave that can't touch the cloud or a corporate directory — into a fully governed environment, without a security team and without ever phoning home.

It's a single appliance that becomes the enclave's **root of trust**: it stands up the directory and certificate authority the network never had, gives **every device its own identity**, and then layers on access control, patching, hardening, backup, monitoring, and audit-ready compliance evidence. Everything runs on the local network itself — the guiding principle is **everything inside, nothing out.**

## Who runs it

Skans is designed to be set up by the **technician who installs the equipment** — the person hanging cameras and pulling cable — not a network engineer or a PKI expert. Setup is two or three plain questions and one button. You see outcomes ("✓ cameras encrypted · 2 certs expiring"), never the directory, CA, or RADIUS internals underneath.

That said, there's real depth for the admins who want it. Getting Started and How-tos are written for the operator; Concepts and Reference go deeper for anyone who wants the architecture, PKI, and control mappings.

## What you get

- **Device identity for everything.** Cameras, controllers, sensors, and Windows endpoints each get their own certificate from a built-in certificate authority — pushed even to devices that can't enroll themselves. No shared passwords.
- **Access control on the wire.** 802.1X (EAP-TLS) admission keeps unknown devices off the network.
- **Monitoring & correlation.** Findings are correlated and deduplicated per device — a bounded, meaningful list, never a raw firehose of events.
- **Patching without the cloud.** A lightweight agent schedules updates locally so isolated Windows machines stay current.
- **Compliance evidence.** A one-command NIST/CMMC evidence pack, generated from live state.

## Where to go next

- **[How Skans works →](/2.0/getting-started/how-skans-works/)** — the mental model (start here)
- **[Requirements →](/2.0/getting-started/requirements/)** — what a site needs
- **[Installation →](/2.0/getting-started/installation/)** — bring an appliance online
- **[Quickstart →](/2.0/getting-started/quickstart/)** — a secured site in about 15 minutes

::: note
These docs describe Skans 2.0. Screens and steps track the shipping appliance; anything still on the roadmap is called out explicitly so you always know what's real today.
:::
