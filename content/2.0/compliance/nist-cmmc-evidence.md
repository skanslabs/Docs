---
title: NIST 800-171 / CMMC evidence
eyebrow: Compliance
description: How Skans satisfies the technical controls of NIST 800-171 / CMMC and generates assessment-ready evidence — and, honestly, where the boundaries are.
---

Skans is the enclave's **technical control plane and evidence generator**. It satisfies the hard *technical* controls of NIST 800-171 / CMMC Level 2, produces assessment-ready evidence from live state on one command, and shrinks the boundary an assessor has to look at.

::: warning
Skans is an **enabler, not a certification** — and not "CMMC in a box." No product can make a network "NIST compliant" on its own. Formal standing requires a built and configured instance, collected evidence, FIPS module pinning, MFA layering, and a **third-party assessment** (a C3PAO for CMMC Level 2). Skans does the technical heavy lifting and generates the evidence; it does not replace the assessor.
:::

## What it targets

- **NIST SP 800-171 Rev 2** / **CMMC 2.0 Level 2** (the CUI-enclave headline)
- **NIST SP 800-53 Rev 5** (mapped by control family)
- **NISTIR 8259A** (IoT device baseline), **NIST CSF 2.0**, **NIST SP 800-82** (OT/ICS)
- **FIPS 140-3** — the appliance runs in FIPS approved-mode, but that is *capable*, not automatically *validated*
- A **CIS Benchmark / DISA STIG** hardening baseline, applied by default at install

The same evidence machinery also crosswalks to **ISO/IEC 27001:2022 Annex A** — see **[ISO/IEC 27001 evidence](/2.0/compliance/iso-27001-evidence/)** for that lane and its own honesty boundaries.

## The split: technical vs organizational

Of the **110** requirements in 800-171, roughly **a third are organizational** — physical security, personnel, planning, awareness, and the process portions of assessment, incident response, and media protection. **Those remain the customer's responsibility.** Skans covers the **system and technical** controls a product can actually own, and hands you a **responsibility matrix** that spells out which is which.

| Family | How Skans addresses it |
| --- | --- |
| **AC** — Access Control | RBAC + least privilege; 802.1X EAP-TLS network admission; gated agent enrollment; console login rate-limiting and idle lock |
| **AU** — Audit & Accountability | Central logging; audited console actions; synchronized time; retention (default 365 days); decrypt-auditing on the vault |
| **CA** — Assessment & Monitoring | Continuous monitoring; the **one-command evidence pack** |
| **CM** — Configuration Mgmt | GPO baseline + update rings; directory and network golden-config drift detection; CIS/STIG at install; inventory |
| **CP** — Contingency | Encrypted off-box backups; directory system-state backup; ship-to-standby database recovery |
| **IA** — Identification & Auth | Per-device X.509 identity; directory identity + MFA; optional federated SSO |
| **RA** — Risk Assessment | CVE + MITRE ATT&CK feed matched against live per-host inventory, CVSS-scored |
| **SC** — System & Comms Protection | TLS in transit, encryption at rest, PKI, time; FIPS approved-mode; TPM-backed CA key (HSM-overridable); OT segmentation gateway |
| **SI** — System & Info Integrity | Vuln-to-patch handoff; Defender health; signature-verified updates/firmware/feeds; self-health and alerting |
| **PE / PS / PL / PM** | Out of scope — an appliance can't provide physical, personnel, planning, or program controls |

::: note
Per-device, an agent-measured **compliance scorecard** (BitLocker, host firewall, audit policy, FIPS mode, patch/Defender/cert posture, and more) rolls up on each device's detail page. A control Skans hasn't actually measured reads **Not Verified** — it is never turned green just because a policy *should* have applied it. Only the on-box reading counts.
:::

## The evidence pack

One command produces a timestamped folder and `.zip`, assembled entirely from the appliance's **live state** (no hand-collation), suitable for an air-gapped site:

- **`README.md`** — cover sheet: appliance, controls implemented (N of total), device count, scope note, responsibility statement
- **`ssp-control-status.csv`** — every tracked control → NIST ID → Implemented / Planned → live evidence detail
- **`poam.csv`** — the live gaps (controls not yet implemented) as a Plan of Action & Milestones
- **`responsibility-matrix.csv`** — Skans-technical vs customer-organizational, per control
- **`inventory.csv`** — the asset register, with per-device certificate posture and expiry
- **`audit-log.csv`** — recent security-relevant actions (up to 1,000), timestamps synchronized
- **`manifest.sha256`** + **`manifest.sha256.sig`** — a hash of every file plus a detached signature

## The tamper-evident audit chain

Alongside the pack, Skans keeps an **append-only, hash-linked** audit chain: each entry carries the hash of the previous entry plus the hash of its payload, and is signed. Tampering with any past entry invalidates every hash and signature after it, and a verify step proves the chain intact.

::: warning
This is **tamper-evident, not WORM.** The chain *detects* after-the-fact modification cryptographically; it does not physically prevent overwrite or deletion (there's no write-once media). Describe it as "cryptographically tamper-evident," never as "immutable."
:::

## Where humans and other tools still come in

Being straight about the boundaries is part of the point:

- **It's not a certification and not self-certifying.** Formal CMMC/RMF standing needs third-party assessment (C3PAO / Authorizing Official / CMVP lab).
- **Organizational controls are yours** — physical, personnel, planning, program, awareness, and the process parts of IR/assessment/media protection.
- **FIPS is approved-mode, not validated.** Per-release module pinning to a CMVP-validated module is still open; approved-mode ≠ validated module.
- **Detection is partial.** Skans logs everything and self-alerts, but it is **not a full IDS/EDR** — pair it with one for complete coverage.
- **Vuln remediation is a hand-off.** Findings route into the patch-approval flow for a human to approve; there's no automatic CVE-to-exact-fix.
- **Device firmware:** Skans flags outdated firmware but can't invent an update a vendor hasn't shipped.
- **An independent penetration test is an open gate** — the builder's own review doesn't satisfy it.
- **Restore is manual / out of scope** — the backup requirement is getting data *off* the source; automated restore isn't claimed.

## Honest headline

Skans satisfies the hard *technical* controls of 800-171 / CMMC Level 2 (AC, AU, CM, IA, SC, with CP and IR support), produces assessment-ready evidence on one command, and shrinks the assessment boundary to the enclave. It is an **enabler, not a certification** — organizational controls remain yours, and formal Level 2 status requires a C3PAO.
