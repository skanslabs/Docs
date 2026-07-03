---
title: Quickstart
eyebrow: Getting Started
description: From a boxed appliance to a secured site with real device identities — in about 15 minutes.
---

This is the whole happy path in one place: plug in an appliance, stand up the site, and give real devices their own identities. Budget about 15 minutes, most of which is the appliance building itself while you watch a progress bar.

::: note
Prefer the detail? Each step links to its full guide. This page is the skim.
:::

## 1. Plug in and open (1 min)

Rack the appliance, patch it into the enclave switch, power it on, and browse to it from a machine on the network. The setup wizard opens.

## 2. Confirm the network (1 min)

The wizard shows the network it detected — subnet, gateway, whether a directory already exists, and any devices it can see. Confirm it, or pick the enclave NIC if there's more than one.

## 3. Name the site (1 min)

Type a **site name** and set (or accept a generated) **admin password**. Press **Set up this site**.

::: warning
The generated credentials are shown once and printed on the final report — save them off the appliance before you move on.
:::

## 4. Let it build (5–10 min)

The appliance stands itself up, unattended, through a couple of reboots. You'll see the foundations go green:

```text
✓ Identity service ready
✓ Certificate authority ready
✓ Network trust published
✓ Time & naming ready
```

Full detail: **[Installation](/2.0/getting-started/installation/)**.

## 5. Find & secure devices (a few min)

The wizard discovers what's on the enclave and lists each device — name, type, vendor, IP, and status. It classifies by what the device actually **is**, so a Windows server isn't mistaken for a workstation, and it names devices from the directory, never a bare IP.

Two lanes run automatically:

- **Agentless devices (cameras, IoT, OT).** Skans auto-detects the vendor (you confirm it in a picker if needed), pushes a certificate from the built-in CA using that vendor's driver, and **verifies the device is serving it**. Monitoring attaches over the device's native protocol. → **[Enroll a device](/2.0/how-tos/enroll-a-device/)**
- **Windows servers & workstations.** The Monitor step offers **Deploy agent**, which pushes the Skans agent over GPO. You approve the agent when it checks in. → **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**

Press **Secure all**, or work device by device. Each device shows a plain status: ✓ secured, ⚠ needs attention (with a reason), or ✗ unreachable (with a fix).

## 6. Done — see your evidence

The final step shows a **Security Score** (green / amber / red by NIST area) and a printable **"what got secured" report**. From here you can generate the full **[NIST/CMMC evidence pack](/2.0/compliance/nist-cmmc-evidence/)** — an assessment-ready bundle built from the site's live state.

## What you just built

In fifteen minutes the enclave went from unmanaged to a governed site with:

- a directory and certificate authority of its own,
- a real identity on every device it could reach,
- a hardened, access-controlled network,
- and audit-ready evidence that it's all in place.

## Next

- **[How Skans works →](/2.0/getting-started/how-skans-works/)** — the concepts behind what you just did
- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** and **[Install the agent →](/2.0/how-tos/install-the-agent/)** — the two lanes in depth
