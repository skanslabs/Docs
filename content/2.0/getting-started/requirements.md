---
title: Requirements
eyebrow: Getting Started
description: The platform, hardware, and network a site needs before installing Skans.
---

Skans runs entirely inside the isolated network — you do **not** need internet access on the enclave. The most important thing to know up front: Skans **provides its own directory, certificate authority, and network services**. You do not pre-install Active Directory, a CA, or RADIUS. The appliance stands all of that up for you.

## Platform

Skans ships in two engine flavors. They present the same console, drivers, and workflow — the difference is the backend.

- **Windows Server appliance (primary SKU).** Skans's installer stands up and configures the native Windows roles it needs — **AD DS** (directory), **AD CS in Enterprise mode** (the certificate authority), **NPS** (RADIUS / 802.1X), DNS, GPO, and Windows Update relay — and hides them behind one console. Proven on **Windows Server 2025**. Requires a Windows Server license.
- **Open-source Linux SKU (secondary).** Fully open substitutes — step-ca, Samba, FreeRADIUS, dnsmasq, chrony — on Ubuntu Server via Docker Compose. Same control plane and UX, no Windows license, for maximally-auditable or no-Windows sites.

::: note
The appliance OS is sealed — the operator never touches Windows or Linux directly. Everything is driven from the Skans console and the setup wizard.
:::

## Hardware

Skans is designed to run a whole enclave from **one modest box**. A single appliance targets **up to ~5,000 devices/certificates**.

| Resource | Guidance |
| --- | --- |
| Memory | Plan for **~16 GB RAM** |
| Storage | SSD; size for how much telemetry you retain (default retention is 365 days) |
| CPU | Modern x86-64 server class |
| Network | At least one NIC on the enclave segment; a second for management is convenient |

::: tip
Sizing scales with device count and retention, not raw traffic — findings are correlated and bounded per device. The relational database stays tiny (it uses SQL Express, and real deployments sit far under its cap); the bulk of data lives in the on-box search store, which is why disk is the thing to plan around.
:::

## Network

- **An isolated enclave.** Skans is air-gap-capable and expects to run without a runtime internet or cloud dependency.
- **Static device addressing** is assumed for the managed devices.
- **Reachability to device management APIs** on the enclave (ONVIF, SNMP, vendor APIs) so Skans can discover and secure them.
- **Switch support for 802.1X** and RADIUS-assigned VLANs if you want network access control (recommended for camera/IoT segments).
- Skans auto-detects the enclave NIC and subnet during setup — you confirm rather than configure.

::: warning
Keep it air-gapped. Where a feature needs external data (patches, CVE feeds, new drivers), it comes in as a **signed bundle** that the appliance verifies before use — never by opening the enclave to the internet.
:::

## What the appliance provides for you

You don't bring these — Skans installs and configures them:

- **Directory** — AD DS (the appliance becomes the domain: DNS, Kerberos, LDAP, GPO)
- **Certificate authority** — AD CS Enterprise, so trust and machine/user certs auto-enroll for domain members
- **Network access control** — NPS 802.1X EAP-TLS
- **Hardened baseline** — FIPS mode, a CIS/STIG GPO baseline, TLS everywhere, and no default credentials, applied by default at install

::: note
If the site *already* has a healthy Active Directory, Skans detects it and runs in a **guest mode** that integrates with it (publishing trust and certs through the existing directory) instead of becoming a competing domain controller.
:::

## Access you'll need on site

- Physical / console access to the appliance for first boot.
- The ability to reach the console from a browser on the enclave.
- For Windows endpoints: the appliance deploys the agent for you over GPO — no per-machine installer to carry.

## Two device lanes

Skans manages devices in two lanes, chosen automatically by device type:

1. **Agentless** — cameras, IoT, OT, and network gear, over their native protocols, with a certificate pushed by a vendor driver.
2. **Agent-managed** — Windows servers and workstations, via the lightweight Skans agent.

Vendor coverage comes from a signed, versioned **[driver pack](/2.0/getting-started/how-skans-works/)** that loads at runtime, so new device support ships without upgrading the whole platform.
