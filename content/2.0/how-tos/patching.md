---
title: Patching & firmware updates
eyebrow: How-tos
description: Keep the enclave patched and its device firmware current without the cloud or WSUS — the appliance pulls updates, GPO rings stage them, an offline scan reports missing KBs, and a hash-verified repository covers firmware.
---

Skans keeps an isolated enclave current **without any endpoint reaching the internet**. The appliance's own Windows Update Agent (WUA) pulls updates from Microsoft Update, caches them, and stages a rollout by ring; an offline scan reports what's missing; and a vetted, hash-verified firmware repository covers your cameras and IoT/OT gear. This page is honest about what's fully shipped versus what's still being hardened.

## Why not WSUS

WSUS is a **dead end on Windows Server 2025** and Skans does not use it. On a fully-patched retail build, the initial catalog sync floods `invalid update identity in XML` errors and never completes — it behaves like an open Microsoft-side defect, not a misconfiguration. So Skans took a different, air-gap-native path: the appliance itself is the update source, and the agent does the installing.

```text
Microsoft Update ──▶ appliance WUA (ServerSelection=2, verified)
                        │  caches approved updates
                        ▼
                     enclave endpoints  (no endpoint needs internet)
```

Offline import covers a true air-gap where even the appliance has no outbound path. There is **no `WUServer`, no WSUS role** — the installer builds ring OUs and GPOs only.

## 1. Ring rollout (GPO / OU)

Rings give you change control: you patch a pilot host first, watch it, then let production follow. Skans builds this scaffolding for you at install time.

- A **`Skans-Pilot` OU** — you promote a host into the pilot ring simply by **moving it into this OU** in the console.
- **`Skans-Patch-Pilot`** GPO, linked at the Pilot OU.
- **`Skans-Patch-Production`** GPO, linked at the domain root.

Both GPOs keep Windows Update **quiescent** — no surprise auto-install, no surprise reboot — so nothing patches until the agent drives it on your schedule.

::: note
The ring GPO/OU scaffolding is shipped and verified (`installer/220-patch-rings.ps1`). To stage an update, promote a representative host into `Skans-Pilot`, approve the update there, then roll to production. This maps to NIST **CM-3** (change control).
:::

## 2. Offline compliance scan (missing KBs)

Each managed host is scanned against Microsoft's **offline `wsusscn2.cab`** catalog using the WUA COM API — no internet required — to produce a **missing-KB report**. This runs weekly (**Sunday 3am**) as the `SkansPatchScan` job inside the always-on `SkansScheduler` service.

Open a Windows device's detail page and check its **Updates** tab. It reads the distributed offline catalog and shows which KBs the host is missing, so you can see enclave-wide patch posture without any endpoint calling home.

::: note
This scan is shipped and verified. It maps to NIST **SI-2** (flaw remediation) and **RA-5** (reporting) — it tells you what's missing; approving and installing is the next step.
:::

## How patch delivery works (agent-orchestrated)

Windows servers and workstations are patched by the **[Skans agent](/2.0/how-tos/install-the-agent/)** — a signed native service that connects to the appliance over mutual TLS. Per design, the agent installs a delivered `.msu` locally from the appliance's cache, coordinates the reboot inside your maintenance window, and reports **per-host pass/fail** back to the console. Because the appliance holds the cache, the endpoint never touches Microsoft Update itself.

::: warning
Agent install-orchestration is **partial, not fully proven**. The scheduled-install / maintenance-window / reboot-coordination / per-host pass-fail flow is the *designed* behavior and is still being hardened — treat it as in-progress, not a click-by-click how-to yet. What is solidly shipped and verified is the ring GPO scaffolding, the appliance-as-update-source (WUA → Microsoft Update), and the offline missing-KB scan above.
:::

Payload integrity is enforced before anything is approved: OS-update and Defender payloads are **Authenticode-verified to a Microsoft publisher** first (NIST **SI-7**). Vulnerability findings from [vulnerability management](/2.0/monitoring/vulnerability-management/) **hand off** to this patch-approval flow carrying the fixed-in version — a human approves. There is deliberately **no CVE-to-exact-fix automation**.

## 3. Device firmware repository

Cameras, intercoms, and controllers don't take Windows updates — they take vendor firmware. Skans keeps a **vetted, SHA-256-hashed firmware repository** per vendor and model, populated **offline** from a signed bundle so nothing enters the enclave unverified.

- Images live under `C:\Skans\firmware` with a JSON index; each carries a recorded **SHA-256**.
- The **`FirmwareDiscover`** scheduler job compares each device's live-inventory firmware against the vetted baseline using a numeric-aware compare and **flags STALE** devices (verified on real inventory — e.g. a Lobby Camera at 10.11.0 against a 11.5.0 baseline flags STALE).

::: note
The box **flags** firmware currency; it **cannot patch a device that has no available vendor update**. Flagging is honest visibility, not a promise of automatic device patching.
:::

## Firmware push — hard-gated

::: warning
**A firmware flash can brick a device, so this path is deliberately hard-gated.** A push requires an **explicit confirm**, defaults to **HTTPS**, and **re-hashes the image against the repository's recorded SHA-256 immediately before flashing** — any repo tampering aborts the push. Drive it from the console's firmware card, not a script.

Honest status: the push path has been validated with a pre-flight (no upload) and a confirmed push to a **mock endpoint (HTTP 200)** — **no real hardware has been flashed**. The actual flash sequence is per-vendor and per-model. The firmware repository and STALE flagging are proven on real inventory; the live push is not.
:::

## What's shipped vs. what's being hardened

| Capability | Status |
| --- | --- |
| Ring rollout (Pilot OU + Patch GPOs) | Shipped, verified |
| Appliance as update source (WUA → Microsoft Update) | Shipped, verified |
| Offline `wsusscn2.cab` missing-KB scan + Updates tab | Shipped, verified |
| Payload Authenticode verification (SI-7) | Shipped |
| Firmware repository + STALE flagging | Shipped, verified on real inventory |
| Agent-orchestrated install / reboot / per-host pass-fail | Partial — being hardened |
| Live firmware push to real hardware | Hard-gated; mock-tested only |

## Ports

| Service | Port | Transport |
| --- | --- | --- |
| Console (Blazor) | 5099 | HTTPS |
| Agent hub (`SkansAgentHub`) | 5443 | mTLS REST |

See **[Ports & protocols](/2.0/reference/ports/)** for the full list.

::: note
Patch and firmware currency is an **enabler** for NIST **SI-2 / RA-5 / SI-7** — it is not a certification. Formal attestation is a separate, human process. See **[NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/)**.
:::

## Next

- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — the patch delivery lane for Windows
- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** — the agentless lane for the devices whose firmware you track
- **[Vulnerability management →](/2.0/monitoring/vulnerability-management/)** — where patch findings originate
