---
title: ISO/IEC 27001 evidence
eyebrow: Compliance
description: How Skans maps its live technical checks to ISO/IEC 27001:2022 Annex A controls and exports a supporting-evidence pack — and, honestly, why no product can be "ISO 27001 compliant."
---

The Skans console's **Compliance hub** includes an **ISO 27001** tab that maps the appliance's existing technical checks onto the **93 controls of ISO/IEC 27001:2022 Annex A**, and a one-command export that packages the result as a **supporting-evidence pack** for an auditor. It reuses the same live-state evidence machinery as the [NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/) system — same measurements, a different crosswalk.

::: warning
ISO/IEC 27001 certifies an **organization's ISMS** — the management system of clauses 4–10: risk assessment, treatment, internal audit, management review — through an **accredited certification body**. **No product can be "ISO 27001 compliant,"** and Skans never claims to be. Everything on this page is **supporting evidence** toward controls your ISMS selects; the words "compliant," "certified," and "satisfies" do not apply to an appliance and are deliberately absent from the tab and the export.
:::

## What gets mapped

The ISO tab does not invent new checks. It takes the technical checks Skans already runs and crosswalks them to Annex A:

- **10 per-device checks** (agent-measured): patching, Defender, device certificate, config baseline, inventory, 802.1X, BitLocker, host firewall, audit policy, FIPS mode
- **12 appliance-level checks**: AD DS, password/lockout baseline, credential rotation, account lifecycle, certificate renewal, AD CS, NPS 802.1X, backups, DHCP, central logging, secrets vault, patch reporting

The crosswalk is grounded in the **official NIST OLIR #155 mapping** (SP 800-53 Rev 5 → ISO/IEC 27001:2022) rather than an in-house judgment call, so every check→control link traces back to a published reference mapping.

::: note
**Every mapping is *partial* by design.** A passing check is supporting evidence *toward* a control, never the whole control. ISO controls are broader than any single technical measurement — 8.15 (Logging) is not "done" because central logging is healthy — so the tab never flips a control to "met" off a check result.
:::

## Four buckets, one fixed denominator

The tab always reports against **all 93 Annex A controls** — the denominator never shrinks to make the numbers look better, and there is deliberately **no single "readiness %"** (a one-number score over a standard that is mostly organizational would be a lie). Instead, every control lands in exactly one of four buckets:

| Bucket | Meaning |
| --- | --- |
| **Supporting evidence available** | Mapped checks exist *and* are currently passing — partial evidence toward the control |
| **Gaps identified** | Mapped checks exist and at least one is failing — a concrete finding to act on |
| **Mapped, not yet measured** | The crosswalk links the control to Skans capability, but no measurement has run — stays grey, never assumed |
| **Customer responsibility** | Nothing an appliance can evidence — the control belongs to your ISMS |

## The responsibility split

Of the 93 Annex A controls:

- **15 controls** receive **partial Skans technical evidence**: 5.9, 5.16, 5.17, 5.18, 8.1, 8.5, 8.7, 8.8, 8.9, 8.13, 8.15, 8.16, 8.20, 8.22, 8.24
- **23 technological controls** are **customer-implemented** — the rest of Annex A clause 8 (secure development, data protection, and other technological controls), where Skans produces no evidence yet
- **55 organizational, people, and physical controls** are **pure customer responsibility** — policy, HR, supplier, and facility controls no product can own

The exported `responsibility-matrix-iso.csv` spells out this three-way split per control, so the boundary is on paper before an auditor asks.

::: note
Skans ships **control numbers, short titles, and its own descriptions** of what its evidence supports. The full control text of ISO/IEC 27001 and 27002 is **licensed** — obtain the standards from [ISO](https://www.iso.org/) or your national standards body; Skans does not reproduce them.
:::

## Fleet evidence, not wishful evidence

For the per-device checks, the tab computes **compute fleet evidence**: the device compliance scorecard rolls up across the enclave, so a control's evidence line reads like *"4 of 4 measured devices pass"* — a real count over real measurements. The discipline is the same as everywhere else in Skans:

- **Agentless devices are N/A** for agent-measured checks — they don't silently pass
- **Unmeasured controls stay grey** — a control is never turned green because a policy *should* have applied it; only actual readings count

## The ISO evidence pack

**Generate ISO evidence pack** exports a timestamped, air-gap-friendly `.zip`, assembled entirely from live state:

- **`README.md`** — scope, device counts, and the claims discipline (what this pack is and is not)
- **`annex-a-evidence.csv`** — all **93 rows**, one per Annex A control: bucket, mapped checks, live evidence detail
- **`checks-evidence.csv`** — every underlying check result feeding the crosswalk
- **`responsibility-matrix-iso.csv`** — the three-way split (Skans partial evidence / customer technological / customer organizational)
- **`inventory.csv`** — the asset register
- **`audit-log.csv`** — recent security-relevant actions
- **`manifest.sha256`** + a **detached release-key signature** — tamper-evident: any post-export modification breaks verification

## Planned, not built

Two pieces are explicitly **Phase 2** and do not ship today:

- **Statement of Applicability management** — maintaining your SoA (control inclusion/exclusion with justifications) inside the console
- **Persisted evidence history** — point-in-time snapshots of past evidence states for trend and audit-interval review

Until then, the SoA lives in your ISMS tooling, and each evidence pack is a point-in-time export.

## Honest headline

Skans maps its 22 live technical checks to ISO/IEC 27001:2022 Annex A via the NIST OLIR #155 crosswalk, reports four honest buckets over all 93 controls, and exports a signed, air-gap-friendly supporting-evidence pack. It is **supporting evidence for your ISMS, not a certification** — clauses 4–10, the other 78 controls, and the accredited audit remain yours. For the CUI-enclave side of the same evidence system, see [NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/).
