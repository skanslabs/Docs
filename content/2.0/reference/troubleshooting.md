---
title: Troubleshooting
eyebrow: Reference
description: Plain-language fixes for the everyday snags — the console won't load, a device won't secure, an agent won't approve — plus the one Support Bundle that helps even when the app is down.
---

Most problems in Skans are shown to you in plain language, with the fix attached — a wizard step reads "Couldn't reach Camera 3 — check the cable, then Retry," not a stack trace. This page is the reference for the handful of snags an operator or admin runs into, framed as **symptom → likely cause → fix**.

## Start here: grab the Support Bundle

When you're not sure what's wrong — or the console itself won't open — get the **Support Bundle** first. It's the one thing to send us, and it works **even when the app, SQL, or OpenSearch is down**.

- Double-click **Get Skans Support Bundle** on the appliance desktop, or use the button in the console.
- It writes **one sanitized `.zip`** to `C:\Skans\support\` (and to a plugged-in USB, if there is one).
- Passwords, keys, and SNMP community strings are **redacted** — it's safe to email.

Inside are the answers to "is it running and what broke": a system/version snapshot, whether the Skans services and jobs are up, recent Windows App/System errors, OpenSearch cluster health and indices, database reachability and row counts, redacted config, and the app + installer logs.

::: tip
The bundle is built by a **standalone diagnostics script** with no dependency on the Skans .NET app, SQL, or OpenSearch — which is exactly why it still runs when those are the problem.
:::

**Sending it to Skans:**

- **Online** — the bundle can upload itself over HTTPS to the Skans support collector.
- **Air-gapped** — copy the `.zip` to the USB it was written to and mail it. Connectivity only speeds this up; it never gates it.

## Where to look before you file anything

| Surface | What it tells you |
| --- | --- |
| **`/system/services`** (console) | Services, recurring-job health, and the agent fleet — in one pane |
| **On-box alerts** | Recent findings, newest first, from an always-available index — no SMTP needed |
| **Self-health** | Every 15 min, samples the box's own disk, RAM, CPU, the SQL Express 10 GB per-DB cap, OpenSearch health, and core-service liveness |
| **App log** | `C:\Skans\logs\controlplane-<date>.log` (rolling, Information and up) |

::: note
Self-health raises an alert for the "killers" that quietly take the box down: disk nearly full, SQL near its per-database cap, OpenSearch red, or a core service down. Those show up on the alerts list before they become an outage.
:::

## The console won't load

**Likely cause** — the console is served by the **SkansCP** (Skans Control Plane) Windows service on **port 7328 (HTTPS)**. If the page won't open, that service is stopped or restarting.

**Fix** — open **services.msc** and confirm **SkansCP** is *Running*. Every Skans service is set to **Automatic** with restart-on-failure, so a transient crash self-recovers; if it stays down, **grab the Support Bundle** (it runs without the app) and send it. Reaching the box on 7328 but nothing else? Check the [ports reference](/2.0/reference/ports/).

## The setup wizard rebooted and seems stuck

**Likely cause** — nothing's wrong. Standing up a domain controller and certificate authority **requires reboots**, so the installer restarts the box mid-setup and comes back to finish.

**Fix** — let the reboot complete and log back in. The wizard **self-resumes**: a single one-shot startup task picks up exactly where it left off and **removes itself when setup is done**. Every step is idempotent, so re-running the wizard is safe — it detects prior state, repairs or continues, and heals between visits.

::: note
Don't go hunting in Task Scheduler. That one-shot resume task is the **only** scheduled task Skans uses; all recurring jobs run on internal service timers, not Windows tasks.
:::

## A device shows "needs attention" or "unreachable"

Every discovered device shows one of three plain states:

- **✓ secured** — proven, not assumed
- **⚠ needs attention** — with a plain reason
- **✗ unreachable** — with a plain fix

**Likely cause** — Skans holds a **"verify, go green"** invariant: a checkmark means the device *actually* completed the step (for a cert, it's serving it on the wire). So a device stuck at **needs attention genuinely did not finish** — the state is honest, not cosmetic.

**Fix** — read the reason on the row, do the thing it names (reconnect the cable, correct the credential, set the vendor), and press **Retry**. If it stays unreachable, it's a reachability problem — cabling, power, IP, or firewall — not a Skans state you can click past.

## A device didn't get — or isn't serving — its certificate

There are two very different reasons, and the fix differs.

**Cause 1 — the vendor isn't set.** The right driver and certificate template **cannot resolve without a vendor** on the device.

**Fix** — set or correct the vendor with the **vendor picker** on the **Onboard** wizard or the **Device detail** page. Once saved, the correct driver and CA template resolve and enrollment can complete. See **[Enroll a device](/2.0/how-tos/enroll-a-device/)**.

**Cause 2 — the device class can't take a certificate.** Some devices — legacy PLCs, proprietary panels, cloud-only kit — have no certificate API.

**Fix** — this is expected, and Skans is honest about it: the driver returns a **clear error and never fakes success**. The right remedy is to **secure the conduit** (put identity and access control on the switch or firewall in front of the device) and monitor it, rather than retry forever. More in the [driver pack](/2.0/concepts/driver-pack/) concept.

**Cause 3 — it was secured before, but now shows a "Mismatch."** The device is serving a **different certificate** than the one Skans issued. Skans checks the *actual* certificate on the wire on every health sweep, so it flags this honestly instead of trusting an old success. Two situations:

- **The device was factory-reset or replaced.** A certificate lives **on the device**, in its own NVRAM or configuration. A factory reset, a swapped-in replacement unit, or a device that came back on its own self-signed certificate loses the Skans-issued one. **Fix** — **re-enroll** it (the **Secure** / **Enroll** action on the device, or `--enroll <device>`); Skans redeploys the certificate and re-verifies it on the wire. Because Skans still holds the device credential, this is one click.
- **The platform has no API to *bind* a pushed certificate (e.g., OPNsense).** A few platforms accept the certificate into their trust store but expose **no API to select it** for their web service — so they keep serving their built-in self-signed certificate. Skans imports the cert and reports the mismatch honestly; the final selection is a **one-time manual step**. For **OPNsense**: **System → Settings → Administration → SSL Certificate**, choose the Skans-issued certificate, and **Save**. After that first bind, automatic renewals reuse the selection — you won't touch it again.

::: note
A certificate mismatch is **not** a silent failure — it means Skans looked, saw the wrong cert on the wire, and told you. That's the same "verify, go green" honesty that makes a checkmark trustworthy.
:::

### A client says the certificate isn't trusted

**Likely cause** — cameras serve a **leaf-only** certificate, so a client that only has the root can't build the chain.

**Fix** — the client needs **both** the root and the intermediate:

- **Domain members** get both automatically via GPO auto-enrollment (root → Trusted Root, intermediate → Intermediate CA) — nothing to install.
- **Everything else** installs the **two-certificate bundle** the OSS build ships, once, by hand.
- **Restart the browser** after trust is added — browsers read the trust store at startup.
- **Firefox / Thunderbird** keep their own trust store (they don't read the system one).
- **Linux snap browsers** ignore the system store too — trust has to go in the snap.

## A device I just added shows "offline" (but it's reachable)

**Likely cause** — **"online" and "secured" are two different signals.** *Online* is set by a periodic **reachability** health check; a **certificate** is deployed by an **active push** Skans makes *to* the device. Enrollment doesn't require the device to already read "online" — Skans reaches out, authenticates, and installs the certificate regardless. So a device can be **fully certificate-managed and still read "offline"** for a moment right after you add it, simply because the reachability probe hadn't run yet.

**Fix** — usually nothing. A freshly added or discovered device is **probed immediately** on creation, so it reports its true reachability within a second or two, and the next scheduled sweep re-confirms it. If a device *stays* offline while you can otherwise reach it, the appliance genuinely can't — check the **management VLAN, IP, and firewall** between the appliance and the device, not the display. (Removing a device clears it from the state view immediately as well — no lingering "ghost" row.)

## The agent isn't appearing — or won't approve

An authenticated agent that has installed and checked in should appear **immediately as pending** — you shouldn't have to wait for a discovery cycle. Skans correlates it to the right device row automatically (by directory GUID, then IP, then hostname) and re-reconciles every cycle, so IP-named or pre-existing rows self-link.

If it genuinely isn't showing up, the causes are on the **device side** — and they're honest, named gates, not bugs:

1. **Code-signing (cause #1).** The agent binary **must be Authenticode-signed** or the appliance's Defender ASR ransomware rule **blocks it from running**. Skans signs the agent before rollout and excludes its path from ASR — a hand-modified or unsigned agent simply won't start.
2. **Domain-join.** Joining the box needs a **reboot and credentials on the machine**.
3. **Machine-certificate bootstrap.** On its first domain policy cycle the box auto-enrolls its machine certificate — that cert is the mutual-TLS trust anchor the agent connects with.

::: warning
There is **no shipped double-click MSI installer** for the Windows agent. It's deployed by the appliance over GPO/SYSVOL and installs on the next policy refresh or reboot — see **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**. If you're looking for a hand-carried installer wizard, that's roadmap.
:::

**Approval is manual by default.** If auto-approve is on (`agent.autoApproveAdJoined`, **off and fail-closed** out of the box) but an agent still won't clear, it's because auto-approve requires **both** a client certificate that chains to the Skans root **and** a hostname that's a **known, enabled** directory computer. A stuck auto-approve almost always means one of those two isn't true.

## A vendor was detected wrong (or a device is mis-classified)

**Likely cause (vendor)** — auto-detect reads the device's **ONVIF device information** and its **MAC/OUI** at discovery. A relabeled or generic device can guess wrong.

**Fix** — override it with the **vendor picker** on the **Onboard** wizard or **Device detail**; the correction persists. Getting the vendor right is what lets the certificate and driver resolve.

**Likely cause (classification)** — classification is **OS-authoritative** (it reads the directory OS attribute, with reverse-DNS as fallback) — *not* by open port — so a Server-2025 box with only RDP open still lands as a **Server**. Rows are named from the DNS/AD short name, never a bare IP.

**Fix** — if you see phantom or IP-named cruft (a stray "File Server 01" that never really existed), an admin can remove it with the `--purge-test-devices` CLI verb, which validates the address, revokes the cert, and audits the removal.

## A device-offline alarm you didn't expect

**Likely cause** — the device-offline alarm is **fail-open** and fires **only for registered hosts** — an enrolled agent or an inventory device. It was deliberately narrowed to that set to end phantom-incident noise from stray metrics.

**Fix** — if something unregistered or decommissioned is throwing an offline alarm, the answer is to **register it** (so it's genuinely monitored) or **purge the stray row** (`--purge-test-devices`) — **not** to silence monitoring. See **[Alerts & monitoring](/2.0/monitoring/alerts/)**.

## A Skans service isn't running

**Likely cause** — a core daemon stopped. Every Skans component runs as a Windows service, all **Automatic** with restart-on-failure, so most crashes recover on their own.

**Fix** — check **`/system/services`** first (services, job health, and the agent fleet in one pane), or **services.msc** on the box. The core services:

| Service | Role | Port |
| --- | --- | --- |
| **SkansCP** | Console + control plane | 7328 (HTTPS) |
| **SkansAgentHub** | Agent gateway (mTLS) | 7326 |
| **SkansCollector** | SNMP/syslog, ICS collect, alert engine | — |
| **SkansOpenSearch** | Data store | — |
| **SkansVault** | Secrets store | — |
| **SkansDashboards** | Dashboards | — |

Periodic jobs (backups, scans, feed syncs) run **in-process inside SkansCP** on internal timers — there is no separate scheduler service to look for.

::: note
**SkansAgent** runs on your managed Windows endpoints — **not** on the appliance — so you won't see it in the appliance's service list. Full port list: **[Ports](/2.0/reference/ports/)**.
:::

## Admin power-user fallback

Everything above is doable from the console and wizard. When an admin wants to drive the appliance directly, these verbs mirror the console actions:

```powershell
# From an elevated prompt on the appliance
Skans.ControlPlane.exe --support-bundle --upload   # write the sanitized bundle and send it
Skans.ControlPlane.exe --alerts                     # recent on-box findings, newest first
Skans.ControlPlane.exe --self-health                # sample disk / RAM / CPU / SQL cap / OpenSearch now
Skans.ControlPlane.exe --health                     # quick health check
Skans.ControlPlane.exe --purge-test-devices         # remove phantom / stray device rows (audited)
```

## Next

- **[Alerts & monitoring →](/2.0/monitoring/alerts/)** — what raises a finding, and why it's correlated, not a firehose
- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** and **[Install the agent →](/2.0/how-tos/install-the-agent/)** — the two lanes, in depth
- **[Ports →](/2.0/reference/ports/)** — every port Skans listens on
