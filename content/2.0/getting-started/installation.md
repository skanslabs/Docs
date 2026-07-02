---
title: Installation
eyebrow: Getting Started
description: Bring a Skans appliance online and reach the console for the first time.
---

This guide takes a fresh appliance to a working console you can log into. It mirrors a real first-run: boot, set identity, reach the console, and verify services.

::: note
These are representative steps for the v2.0 appliance image. Exact screens may differ slightly by build — the console guides you through anything not shown here.
:::

## 1. Boot the appliance

Connect the appliance to your management switch and power it on. On first boot it provisions its internal services (directory, certificate authority, policy, console) — this takes a few minutes.

## 2. Set the hostname and network

From the first-boot console, set the appliance identity and management address. You can let Skans run DHCP/DNS for the enclave, or give it a static address alongside your existing services.

```bash
# example: set a static management address (first-boot shell)
skans net set --interface mgmt0 \
  --address 192.168.50.10/24 \
  --gateway 192.168.50.1 \
  --hostname skans-core-01
```

## 3. Reach the console

Point a browser on the management network at the appliance over HTTPS:

```text
https://skans-core-01.local     (or the IP you set)
```

The appliance presents its own certificate from the built-in CA. Sign in with the administrator credential from first boot.

::: tip
Can't reach it? Confirm you're on the management subnet and that the appliance finished provisioning (the front-panel/console shows **READY**). Skans never depends on the internet to bring up its own console.
:::

## 4. Verify core services

In the console, open **System → Services**. You should see the identity, certificate, policy, monitoring, and scheduler services all running (green). This confirms the root of trust is live.

```bash
# or from the appliance shell
skans status --services
```

Expected output (abridged):

```text
SERVICE            STATE     DETAIL
directory          running   AD DS · 1 domain
certificate-auth   running   AD CS · issuing
policy             running   NPS · RADIUS ready
monitoring         running   collector + correlation
scheduler          running   0 jobs due
```

## 5. Next: enroll your first device

The appliance is now a working root of trust. Give a real device an identity and watch it appear in the console:

- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)**

::: warning
Change the initial administrator password immediately, and store recovery material (CA recovery key, admin credentials) **off the appliance** in your password manager. Losing them means re-provisioning.
:::
