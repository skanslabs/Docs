---
title: "How to give a camera its own identity in 5 minutes"
date: 2026-06-24
author: Skans Labs
category: How-to
excerpt: "Walk through enrolling an agentless camera — classification, vendor profile, a vault-stored credential, and a certificate issued by your own CA."
---

One of the fastest ways to see what Skans does is to take a single camera and give it a real identity. Here's the whole flow.

## 1. Let discovery find it (or add it)

Open **Devices** in the console. Skans classifies each device by what it actually is — so a camera is a camera, not "unknown on port 80." If it hasn't surfaced yet, use **Add device** and point it at the IP.

## 2. Pick the vendor profile

Skans ships a signed, versioned driver pack covering hundreds of camera and IoT vendors. Confirm the matched profile so Skans knows how to talk to the device over its native protocol.

## 3. Store the credential once

Provide the device's login **once** — it's encrypted into the vault and never written to disk in plaintext. From then on, Skans uses it without ever exposing it again.

::: warning
Never paste device credentials into config files or scripts. Use the console's credential editor so they stay in the vault.
:::

## 4. Approve enrollment

Approve the device. Skans issues a certificate from the built-in CA and installs it where the camera supports it. On the device's detail page you'll now see a valid identity, an online/managed state, and correlated findings.

That's it — the camera now has its own identity, sits behind access control, and produces compliance evidence as it runs. Full details are in **[Enroll a device](/2.0/how-tos/enroll-a-device/)**.
