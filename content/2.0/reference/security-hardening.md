---
title: Security hardening
eyebrow: Reference
description: How the Skans appliance hardens the enclave and protects itself — a RADIUS lane that can't wedge, self-monitoring that catches silent failures, backups verified to actually restore, and device connections pinned against man-in-the-middle.
---

A security appliance has to be hard to knock over and honest about its own health. Skans ships several controls aimed squarely at that: the fabric stays enforced even when a service fails, silent failures raise an alarm instead of hiding, backups are proven restorable rather than merely present, and the connections Skans makes to your devices can't be intercepted. None of these need operator babysitting.

## A RADIUS lane that can't wedge

Cameras, badge readers, and other IoT devices can't run an 802.1X supplicant, so they authenticate to the network by MAC address (MAB). Skans can run its **own MAB RADIUS** for those devices — deliberately simple and resilient, so it can't get into the wedged state a full Windows NPS can. It authenticates each device against the Skans inventory: a known device is admitted onto its assigned segment VLAN; an unknown one is quarantined or denied.

Critically, it **authenticates the request itself** (the RFC 3579 Message-Authenticator), so a forged or spoofed RADIUS request can't coax an admission out of it. And because already-enforced sessions survive a RADIUS outage, a RADIUS problem becomes a "fix it Monday," not a 3 a.m. outage.

::: note
For the full 802.1X / MAB rollout model — monitor first, segment cameras onto their own VLAN, with break-glass and rollback — see **[802.1X access control](/2.0/how-tos/network-access-control/)**.
:::

## Self-monitoring that catches *silent* failures

A service that reports "running" while quietly not working is the worst kind of failure. Skans **functionally probes** its own RADIUS — not just "is the service running," but "is it actually answering on the wire" — every few minutes. If it has silently stopped serving, the console raises a **proactive alert** instead of letting authentications fail unnoticed, and a **one-click repair** brings it back safely (never by the restart-to-reload move that can wedge it further).

The same appliance-role health view shows every role the box runs — directory, certificate authority, DNS, DHCP, RADIUS — each with its **correct recovery path**: the roles you can safely reinstall, and the ones (the directory and the CA) you must *restore* rather than reinstall, because reinstalling them would destroy the domain or invalidate every certificate you've issued.

## Backups proven to *restore*, not just *exist*

"Backup ready" usually means "a recent backup file exists" — which is not the same as "it would actually restore." Skans **restore-verifies** the two things you can never rebuild by hand:

- the **certificate authority** — it opens the latest key backup with its vaulted password (proving the private key is intact and the password matches) and confirms the CA database is present; and
- the **directory** — it decrypts the latest system-state backup and confirms the directory database is a structurally-sound, cleanly-shut database that would mount on a rebuilt controller.

Both run **daily and non-destructively**, and the role-health view then shows **"restore-verified," not just "present."** If a verify ever fails, it raises an alert.

## Device connections pinned against man-in-the-middle

When Skans pushes a certificate to a device — or logs into it to rotate a password — it opens an HTTPS or SSH connection carrying sensitive material: the device's admin password, and the private key being installed. Skans can **pin** each device connection to that device's exact certificate and SSH host key, captured trust-on-first-use. Once pinned, an on-path attacker who tries to impersonate the device presents a different certificate or host key, the connection **fails closed**, and nothing sensitive is handed over. This protects both the network controller and the entire device-driver fleet.

::: note
Pinning is opt-in per device — capture the pin once, and it's enforced from then on — so a fresh appliance is never broken before you've pinned anything.
:::
