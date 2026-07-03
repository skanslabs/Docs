---
title: Installation
eyebrow: Getting Started
description: Bring a Skans appliance online and stand up a secured site with the setup wizard.
---

Installing Skans is deliberately not a systems-administration task. You rack the appliance, answer two or three plain questions in the **setup wizard**, and it stands up the directory, certificate authority, network trust, and time services on its own — resuming across the reboots it needs, with no PowerShell and no PKI knowledge required.

::: note
There is no command line to memorize. Everything below is the wizard's own on-screen flow. Screens may differ slightly by build; the wizard guides you through anything not shown here.
:::

## 1. Plug in and power on

Rack the appliance, patch it into the enclave switch, and power it on. On first boot it prepares its internal services — this takes a few minutes and includes one or more automatic reboots as it promotes the directory and certificate authority. A startup task resumes the process across each reboot and removes itself when setup is complete, so you can leave it running.

## 2. Open the console and let it detect the network

Browse to the appliance from a machine on the enclave. The wizard opens on **Step 1 — Detect** and shows what it found:

```text
Found network: 192.168.102.0/24, gateway .1
No existing directory detected.
3 devices seen.
```

Confirm the detected network (or pick the enclave NIC if the box has more than one). Skans auto-detects the subnet, any existing directory, and nearby devices — you confirm rather than configure.

::: tip
If Skans detects a healthy existing Active Directory, it offers **guest mode** here — it will integrate with that directory instead of becoming a second domain controller. For a greenfield enclave with no directory, it takes the full self-contained path and *becomes* the domain.
:::

## 3. Name the site

This is the only real input. On **Step 2 — Name this site** you provide:

1. **A site name** (for example, `Acme`). Skans derives the domain, hostnames, and certificate organization from it.
2. **An admin password** for the console — or accept a generated one, which is shown once and sealed into the final report.

Press **Set up this site**.

::: warning
The generated admin and recovery credentials are shown **once** and printed on the completion report. Store them — and the CA recovery material — **off the appliance**, in your password manager. Losing them means re-provisioning the site.
:::

## 4. Watch it build

On **Step 3 — Building your site**, a progress bar runs unattended for roughly 5–10 minutes and reports plain checkmarks as each foundation service comes up:

```text
✓ Identity service ready        (directory / AD DS)
✓ Certificate authority ready   (AD CS)
✓ Network trust published       (GPO)
✓ Time & naming ready           (NTP, DNS)
```

This is idempotent and self-healing — if you close the browser or the box reboots, it picks up where it left off. When it finishes, the enclave has a working root of trust: an identity service, a certificate authority whose trust is published to the network, and synchronized time and naming.

## 5. You're on the console

When "Building your site" completes, you land on the Skans console, signed in with the administrator credential from Step 3. The appliance now presents its own certificate from the built-in CA.

The hardened baseline (FIPS mode, a CIS/STIG policy baseline, TLS everywhere, no default credentials) is already applied — you didn't have to do anything for it.

## Next: secure your devices

The site is stood up. The next step of the wizard — **Find & secure devices** — discovers what's on the enclave and gives each device an identity:

- **[Quickstart →](/2.0/getting-started/quickstart/)** — run the whole thing end to end in about 15 minutes
- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** — the agentless (camera / IoT) flow in detail
- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — the Windows server / workstation lane

::: note
Two optional settings live in the wizard and are safe to skip — an **off-box backup target** (disabled until you set a path) and an **outward alert channel** (SMTP/webhook, with a "send a test" button). On-box alerting always records regardless, so an air-gapped site loses nothing by leaving them off.
:::
