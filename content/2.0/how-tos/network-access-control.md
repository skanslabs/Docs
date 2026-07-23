---
title: Set up 802.1X access control
eyebrow: How-tos
description: Turn on RADIUS 802.1X EAP-TLS so only devices holding a Skans-issued certificate get on the wire, with a fallback path for devices that can't do 802.1X.
---

Network access control decides what is allowed onto the wire. Turn it on and a device that holds a **Skans-issued certificate** is admitted to its port; a device without one is rejected at the switch and never reaches the segment. This is the AC-3 / IA-3 enabler for the enclave — identity-gated network admission, driven from the console.

The admission engine is the appliance's native **Windows NPS (RADIUS)** role. The installer stands it up alongside **AD CS** (which issues the certificates) and **AD DS / GPO** (which distributes the trust), and hides all three behind the console. The EAP-TLS flow below is the proven Windows path.

## Before you start

Two things have to be true.

**Your devices already have certificates.** 802.1X EAP-TLS admits a device by the certificate Skans issued it — so enroll them first:

- Windows servers/workstations get a machine certificate when the agent bootstraps — see **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**.
- Cameras, IoT, and OT get a pushed certificate over their vendor driver — see **[Enroll a device](/2.0/how-tos/enroll-a-device/)**.
- Background on what that identity is: **[Device identity](/2.0/concepts/device-identity/)**.

**Your switch or access point supports the right features.** The switch (the "authenticator") is what actually opens or closes the port, so it must be able to:

| The switch / AP must support | Used for |
| --- | --- |
| **802.1X / EAP** wired port authentication | EAP-TLS admission (Part 1) |
| **MAC-Auth-Bypass (MAB)** | Devices with no 802.1X supplicant (Part 2) |
| **RADIUS-assigned dynamic VLAN** — `Tunnel-Type`, `Tunnel-Medium-Type`, `Tunnel-Private-Group-ID` | Placing an admitted device on the right segment |

::: note
The lab-validated authenticator is **UniFi** (Cloud Key Gen2+ controller). Skans reads each client's VLAN and 802.1X-authenticated state back from the controller. Any switch that speaks standard 802.1X, MAB, and RADIUS dynamic VLAN works the same way.
:::

## Part 1 — Turn on 802.1X EAP-TLS wired admission

This is the shipped, proven path. A device that presents a valid Skans-issued certificate is admitted; anything else is turned away.

### How admission works

The trust chain is set up for you at install. The **Skans Root CA** sits in NPS's trusted store; a client presents a Skans-issued certificate (Client-Auth EKU, mapped to its directory identity); NPS runs EAP-TLS and returns the verdict.

```text
Skans-issued cert  →  NPS EAP-TLS  →  chain valid to Skans Root CA  →  Access-Accept  (event 6272)
missing / untrusted cert   →  Access-Reject  (event 6273)  →  port stays closed
```

You don't hand-author the EAP-TLS policy. The **Setup Wizard** turns on network admission from golden-config defaults, binding NPS to the appliance's own server certificate and its RADIUS shared secret (held in the credential vault). There is no operator CLI for this step and none is needed.

### 1. Register each switch or AP as a RADIUS client

A switch can't ask NPS to authenticate a device until NPS knows the switch. On the console **Network** page, add each authenticator as a RADIUS client — its **name**, **IP address**, and the **shared secret** it will use. Do this for every site-specific switch after the base install.

### 2. Confirm admissions in the console

The **Network** page surfaces live admission decisions so you can watch devices come on:

- **Accept** — NPS Security **event 6272** (EAP-TLS succeeded)
- **Reject** — NPS Security **event 6273**

Recent admissions show the accept/reject counts, the EAP type, the account, and which client (switch/AP) sent them — enough to confirm a segment is authenticating and to spot a device being turned away.

::: note
**Proven live.** A Skans-issued client certificate returns **Access-Accept** over EAP-TLS, confirmed by NPS event **6272** matching the golden **"Secure Wired (Ethernet) Connections"** policy. This is the canonical go-green for wired admission.
:::

### What happens to a device that fails

A device that fails admission gets an **Access-Reject** (event 6273) and simply does not get on the wire — no port, no VLAN. The proven reject reasons are a **missing certificate** or an **untrusted chain** — a certificate that doesn't chain to the Skans Root CA. There is no partial or fail-open state; a device either proves a trusted identity or it stays off.

::: note
NPS can also reject a **revoked** certificate, but that check rides on the CA's revocation list being current on the appliance. In an air-gapped enclave, keeping revocation authoritative is a **PKI-lifecycle task** — treat certificate revocation as a lifecycle action, not an instant network kill-switch. Chain-trust validation is the always-on gate.
:::

::: warning
The EAP-TLS policy is bound to the appliance's **own server certificate** by thumbprint. When that certificate is renewed the binding has to be refreshed; the appliance's PKI-health tooling is meant to re-bind it, but this is a known lifecycle edge — if admissions suddenly start failing across the board after a certificate rotation, check this first. See **[Troubleshooting](/2.0/reference/troubleshooting/)**.
:::

## Part 2 — Devices that can't do 802.1X

Not every device can run an 802.1X supplicant. Skans sorts devices by capability and gives each the strongest treatment it can actually hold, rather than pretending a weak device is admitted.

- **Tier-A — cert-capable and manageable.** Full 802.1X EAP-TLS, as in Part 1.
- **Tier-B — limited.** Can't run a supplicant, but can be identified. Admit by **MAB** and drop onto a **restricted VLAN** with a RADIUS-assigned dynamic VLAN.
- **Tier-C — incapable / legacy.** Can't hold a certificate at all (old PLCs, raw Modbus, BACnet MS/TP). Not admitted by 802.1X — segmented instead.

### Tier-B: MAB + dynamic VLAN

A limited device is admitted by its **MAC address** and placed on a restricted segment using a **RADIUS-assigned dynamic VLAN** — the standard `Tunnel-Type` / `Tunnel-Medium-Type` / `Tunnel-Private-Group-ID` attributes, on a switch that supports them.

::: warning
This is **partial today.** The platform supports it — NPS authorizes the RADIUS clients and the console reads back each device's admitted VLAN and 802.1X state (validated on UniFi). What is still **in progress** is first-class per-device policy authoring: a screen where you assign "this MAC → VLAN X" as a point-and-click rule, and a Skans-authored NPS policy that emits the dynamic-VLAN attributes per device. Treat MAB + dynamic VLAN as supported-by-the-platform and standards-based, not yet a finished click-through operator feature.
:::

### Tier-C: segment, don't admit

A device that fundamentally can't hold a certificate or speak 802.1X is **not** put on the wire by 802.1X. The honest posture is to **segment** it, put a **protective gateway** in front of it, **allow-list** only the flows it genuinely needs, and **monitor** it — compensating controls, not fake admission. The vendor driver returns a clear error rather than claiming success. See the *"When a device can't take a certificate"* section of **[Enroll a device](/2.0/how-tos/enroll-a-device/)**.

## Part 3 — Operator port actions (Protect / Isolate / Open)

Admission (Parts 1–2) decides who gets on the wire. Separately, an operator with **`nac.manage`** can act on a **single wired attachment** from the console when the appliance has a fabric **write** path (network configurator + write credentials for the controller or switch).

| Action | Effect (typical) | Undo |
| --- | --- | --- |
| **Protect** | Apply the site's protect / 802.1X posture on that port (controller-specific) | Site-specific |
| **Isolate** | Force-unauthorized / shut **that port only** so the endpoint loses the wire | **Open port** (ForceAuthorized) |
| **Open port** | Restore authorized state on that port after isolate | — |

**Where:** **Device detail** (NAC card) and **Security → Incidents → Respond** on a case tied to that device. Both paths are **confirm-gated** — the alert engine never isolates automatically.

::: warning
**Lab and production hygiene.** Practice isolate only on a **sacrificial** access port (for example a lab camera). **Do not** isolate domain controllers, uplinks, or agent hosts. OT / Tier-C gear may require an extra OT confirm. Isolate needs a healthy controller write path (for example UniFi with write API credentials already used for Protect).
:::

See **[Detection content & response](/2.0/monitoring/detection-content/)** for the full response menu (including quarantine VLAN and cert revoke) and the no-auto-AR policy.

## Next

- **[Enroll a device](/2.0/how-tos/enroll-a-device/)** — get agentless devices their certificate first
- **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)** — machine certificates for Windows endpoints
- **[Detection content & response](/2.0/monitoring/detection-content/)** — Incidents Respond and isolation boundaries
- **[Device identity](/2.0/concepts/device-identity/)** — what the certificate is and why it's the trust anchor
- **[NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/)** — how network admission maps to AC-3 / IA-3
