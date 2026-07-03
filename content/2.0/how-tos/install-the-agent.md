---
title: Install & approve the Windows agent
eyebrow: How-tos
description: Deploy the Skans agent to a Windows server or workstation over GPO, then approve it in the console.
---

Windows servers and workstations are managed by the **Skans agent** — a lightweight service that runs on the endpoint and handles patching, inventory, Defender health, compliance checks, logs, and metrics, reporting back over mutual TLS. This is the agent lane; cameras and IoT go the **[agentless route](/2.0/how-tos/enroll-a-device/)** instead.

## 1. Deploy the agent

From a Windows device's detail page (or the wizard's **Find & secure devices** step), choose **Deploy agent**. Skans publishes the agent through **GPO / SYSVOL** to its managed-computers OU. The target picks it up and installs it on its next Group Policy refresh or reboot.

```text
Deploy agent  →  published to GPO (Skans computers OU)
              →  installs at next gpupdate / reboot
```

There's no installer to carry from machine to machine — the appliance pushes it. (An opt-in immediate push exists for when you don't want to wait for the next policy cycle; the GPO path is the default.)

::: note
The agent installs as a Windows service (`SkansAgent`, automatic, restart-on-failure) and sends a liveness heartbeat to the appliance over mTLS. On workstations it also installs a small tray status helper.
:::

::: warning
A double-click, hand-carried agent installer is **not** a shipped path yet — today the agent is deployed by the appliance over GPO. If you see a reference to a standalone MSI wizard, treat it as roadmap.
:::

## 2. The two manual gates

Two steps genuinely can't be done purely from the console — the wizard walks you through them:

- **Domain-join** the Windows box (needs a reboot and credentials on the machine).
- **Machine-certificate bootstrap** — on its first domain policy cycle the box auto-enrolls its own machine certificate from the built-in CA. That certificate is the trust anchor the agent's mutual-TLS connection uses.

## 3. Code-signing is required

The agent binary is **Authenticode code-signed before rollout** using a dedicated code-signing identity from the built-in CA. This isn't optional polish: the appliance's own Defender ASR ransomware rule blocks unsigned interactive Skans binaries, so an unsigned agent won't run. Signed agents install cleanly with zero Defender detections — the signature travels with the bytes into SYSVOL, and the publisher refuses to ship a package it can't verify as signed.

## 4. Approve it

An agent that has installed and checked in appears in the console **immediately as pending** — you don't wait for a discovery cycle. Approve it on the device's detail page.

By design, a pending agent **receives no commands until you approve it**. On approval, Skans automatically:

1. **Correlates** the agent to the right device record (by directory GUID, then IP, then hostname), so you get one correctly-typed row instead of duplicates,
2. **seeds the telemetry planes** — inventory, metrics, and Defender health are enabled by default (you can opt out), and
3. unifies the record to the machine's directory object.

::: note
Approval is **manual by default**. An optional setting (`agent.autoApproveAdJoined`) can auto-approve, but it's **off by default and fail-closed** — even when on, it requires *both* a client certificate that chains to the Skans root *and* an enrolling hostname that matches a known, enabled directory computer.
:::

## What an approved agent does

Once approved, the agent delivers the full Windows management set:

- **Patching** — schedules Windows updates and reports per-host pass/fail
- **Inventory** — hardware, software, and configuration
- **Defender health** and **compliance checks** measured on the box itself
- **Logs & metrics** — shipped to the appliance
- **Backup** — configuration/app data off the source machine

## Verify

On the device's detail page you should see the agent **online**, a valid machine certificate, inventory populated, and a per-device compliance readout. Anything the agent hasn't actually measured yet reads as **not verified** rather than being assumed green — only an on-box reading counts.
