---
title: Enroll a device
eyebrow: How-tos
description: Give an agentless camera, IoT, or OT device its own certificate from the built-in CA.
---

This guide covers the **agentless lane** — cameras, intercoms, controllers, and other IoT/OT devices that can't run software of ours. Skans reaches into the device with a vendor driver, issues it a certificate from the built-in CA, pushes and binds that cert, and then confirms the device is actually serving it.

::: note
Managing a **Windows server or workstation** instead? That's the agent lane — see **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**.
:::

## 1. Let discovery find it (or add it)

Open **Devices**. Skans discovers devices on the enclave over multiple protocols (ONVIF, network scan, industrial) and lists each one. It classifies devices by **what they actually are** and names them from the directory / DNS — so you get "Camera 3", not "unknown host on port 80". If a device hasn't surfaced yet, use **Add device** and point it at the IP.

## 2. Confirm the vendor

Skans auto-detects the vendor where it can (ONVIF device info, MAC/OUI). Confirm the matched vendor in the picker — it lists the full driver pack (over 100 vendors). Getting the vendor right is what lets Skans use the device's native management API.

::: tip
The vendor's driver is the piece that knows *how* to write a certificate to that specific device. The driver pack is signed and versioned separately from the appliance, so support for new vendors ships without upgrading Skans.
:::

## 3. Store the device credential once

Provide the device's management login **once**. It's encrypted into the credential vault (per-secret encryption under a hardware-protected key) and is never written to disk in plaintext. From then on, Skans uses it without exposing it again.

::: warning
Never paste device credentials into config files or scripts. Enter them through the console's credential editor so they stay in the vault.
:::

## 4. Secure the device

Approve enrollment (or press **Secure** / **Secure all**). Skans:

1. resolves the right **driver + certificate template** for that vendor,
2. issues a certificate from the built-in CA and **pushes it onto the device**,
3. **verifies the device is serving the issued certificate on the wire** — a real check, not an assumption, and
4. attaches agentless monitoring (SNMP, syslog) so the device's health and events flow into the console.

## Verify

Open the device's detail page. A healthy enrollment shows:

- **Identity** — a valid certificate issued by the Skans CA, with its expiry tracked
- **State** — online / managed
- **Findings** — correlated and bounded per device, never a raw event stream

The device now has its own identity, sits behind access control, and produces compliance evidence as it runs.

## When a device can't take a certificate

Not every device has a certificate API — old PLCs, DCOM-era OPC, proprietary alarm panels, and cloud-only kit genuinely can't be enrolled. Skans is honest about this: the driver returns a clear error instead of faking success. For those devices the right posture is to **secure the conduit** — put a certificate and access control on the switch or firewall in front of them — and **monitor** the device rather than pretend it's hardened.

::: note
This is the difference between device capability tiers. Fully-capable devices get a cert, 802.1X, and full management; limited devices get a cert plus monitoring; incapable legacy devices get segmentation, an allow-list, and monitoring. Skans picks the right treatment automatically.
:::
