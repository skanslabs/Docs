---
title: Enroll a device
eyebrow: How-tos
description: Give a device its own identity and bring it under management.
---

Enrolling a device gives it its own credential from the built-in certificate authority and brings it under policy and monitoring. There are two lanes depending on the device type.

## Agent-managed (Windows)

Deploy the lightweight agent to a Windows endpoint. The agent authenticates, requests a certificate, and checks in — the device then appears in the console as **pending** for you to approve.

```bash
# double-click the signed installer, or deploy via GPO:
msiexec /i SkansAgent.msi /qn ENROLL_TOKEN=<token>
```

::: note
An enrolled, checking-in agent shows up in the console **immediately** as pending — you don't have to wait for a discovery cycle. Approve it on the device's detail page.
:::

## Agentless (camera / IoT / OT)

For devices that can't run an agent, Skans manages them over their native protocol. Add the device (or let discovery find it), select the matching vendor profile from the driver pack, and Skans issues and installs a certificate where the device supports it.

1. Open **Devices → Add device** (or wait for discovery to surface it).
2. Confirm the classification and vendor profile.
3. Provide device credentials **once** — they're stored encrypted in the vault, never in plaintext.
4. Approve enrollment.

::: warning
Device credentials live only in the encrypted vault. Never paste them into config files or scripts — use the console's credential editor so they're never exposed on disk.
:::

## Verify

Open the device's detail page. A healthy enrollment shows:

- **Identity:** a valid certificate issued by the Skans CA
- **State:** online / managed
- **Findings:** correlated and bounded (not a raw event stream)

```bash
skans device show <name-or-ip>
```

That's it — the device now has its own identity, is under access control, and produces compliance evidence as it runs.
