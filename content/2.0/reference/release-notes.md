---
title: Release notes
eyebrow: Reference
description: An honest, current-release capability summary of Skans 2.0 — what ships today, grouped by domain, with roadmap items called out.
---

This is the current-release summary for **Skans 2.0** — the first shipping release of the appliance, so there is no prior version history to reconcile against. It states what the appliance actually does today, grouped by domain, and calls out anything still on the roadmap explicitly. Where a capability ships with an honest boundary, that boundary is named, not hidden.

::: note
**How to read the tags.** **Shipped** means the capability is built and proven live on the flagship appliance. **Partial** means it ships with a deliberate, stated boundary (a manual step, a hand-off, or hardware still pending). **Preview** means design-stage or roadmap — not something you can turn on today.
:::

## Recent releases

- **2026-07-17 — Agent v0.4.0: security hardening + verified self-update.** An agent's identity is now bound to its **authenticated mTLS certificate** — never to anything the client reports about itself — and signed command sets are bound to the specific target agent, so a command captured from one agent cannot be replayed to another. Self-update verifies every release (SHA-256 + Authenticode) before a staged swap with rollback, and v0.4.0 rolled out fleet-wide through that channel. Alongside it: driver packs **2026.7.16e** (Cisco Catalyst 9200/9300/9500 switches + ASA firewalls) and the **2026.7.17** series (Cisco FTD full lanes — certificate renewal, API config snapshot, and driver-automated telemetry configuration — plus ASA monitor-push, IOS-XR, and Catalyst 9800 AP-LSC).
- **2026-07-16 — Alert Rules & Notifications.** The **`/alerting`** console page: alert-rule management, suppressions with a recorded-justification guardrail on compliance-tagged rules, snooze with expiry, escalation / renotify, and per-channel notification delivery health. See **[Alerts & monitoring](/2.0/monitoring/alerts/)**.

## Platform & runtime — Shipped

The flagship is a **single self-contained Windows Server appliance** (an open-source Linux SKU is the secondary flavor), sized for one site of **up to ~5,000 devices** (SRS PERF-01). Everything runs on the enclave — no runtime internet dependency.

- **Runtime:** .NET 10; an ASP.NET Core + Blazor console bound on **:7328** (HTTPS).
- **Stores:** SQL Server / SQL Express holds control-plane state; OpenSearch holds telemetry, metrics, events, inventory, and vulnerabilities. Volume lives in OpenSearch, which is why the relational DB stays tiny.
- **Run model:** always-on, supervised Windows services — `SkansControlPlane`, `SkansAgentHub`, `SkansCollector`, `SkansAgent` — that start at boot and restart on failure, not scheduled scripts. Periodic jobs (backups, feed sync, drift checks) run **in-process inside the control plane** on internal timers; there is no separate scheduler service.
- **Agent transport:** mutual-TLS REST on **:7326**. The agent hub holds no signing key; the trusted core signs commands over a local pipe.

See **[Ports & endpoints](/2.0/reference/ports/)** for the full list.

## Identity & CA — Shipped

The appliance **becomes the enclave's root of trust**. On the Windows SKU it stands up native **AD DS** (domain controller, DNS, Kerberos, GPO) and an **AD CS Enterprise Root CA** ("Skans Root CA") that auto-publishes its root to Trusted Root and NTAuth and enables GPO auto-enrollment. The Linux SKU delivers the same outcome through step-ca, Samba, and FreeRADIUS behind a provider abstraction.

- Per-device X.509 identity issued from the built-in CA — no shared passwords.
- The CA private key is **TPM-backed by default** (Microsoft Platform Crypto Provider, non-exportable); an HSM / CNG-KSP is overridable.

See **[Device identity](/2.0/concepts/device-identity/)**.

## Network access control — Shipped

**802.1X EAP-TLS** admission via NPS keeps unknown devices off the wire — proven end-to-end (Access-Accept, NPS Security event 6272). RADIUS-assigned VLANs segment camera/IoT gear.

See **[Network access control](/2.0/how-tos/network-access-control/)**.

## Two device lanes & the driver pack — Shipped

Skans manages devices in two lanes, chosen automatically by device type:

- **Agent-managed Windows endpoints** — the Skans agent ships inventory, metrics, Defender health, WUA patching, and log shipping over mTLS. Windows event collection is the always-on **agent** lane.
- **Agentless IoT / OT / network gear** — the collector SNMP-polls and ingests syslog and traps. Rule: **Windows is never SNMP-polled.**

Vendor knowledge lives in the **Skans Driver Pack** — a signed, separately versioned artifact loaded at runtime, out-of-process in `Skans.DriverHost`, with hot-reload proven (no console restart).

::: warning
**122 vendor drivers ship. 8 are validated on real hardware** — Axis, 2N, Bosch, Uniview/FS, Hanwha, ONVIF, Redfish, and UniFi — **and another 8 end-to-end on emulated devices** in Cisco CML / EVE-NG: the Cisco fleet (Catalyst 9000v switches, ASAv, IOS-XE routers, Nexus 9300v, and the Catalyst 9800-CL wireless controller) plus Aruba CX. The rest are authored from each vendor's official management API and **device-pending** — do not assume all 122 are proven on real devices. When a device genuinely can't take a certificate, the driver returns a **clear error rather than faking success**; you secure the conduit and monitor the device instead. OT PLCs are handled by read-only EtherNet/IP and Modbus monitoring.

**Wireless AP certificates (Cisco Catalyst 9800) — new.** An opt-in capability provisions the controller's CAPWAP access points with enclave-CA identity certificates (**AP-LSC** via SCEP), so wireless APs carry the same enclave identity as everything else — not a factory certificate. The disruptive MIC→LSC join cutover is **gated off by default**, so it is safe to stage on a live controller. The controller-to-CA SCEP transport and CA trust are proven against the appliance's built-in NDES responder; full per-AP enrollment validates with the site's own access points.
:::

See **[The driver pack](/2.0/concepts/driver-pack/)** and **[Enroll a device](/2.0/how-tos/enroll-a-device/)**.

## Patching & firmware — Shipped (Partial)

The appliance pulls Microsoft Update itself via WUA (`ServerSelection=2`); the agent then installs to endpoints in **rings, maintenance windows, and reboots** — the endpoints never touch the internet. The WSUS role is **deliberately not used** (a confirmed dead-end on Server 2025).

- **Firmware is flagged, not auto-patched.** It can be pushed on demand and is SHA-256 re-verified over HTTPS before it lands.

See **[Patching](/2.0/how-tos/patching/)**.

## Backup & DR — Shipped (restore is manual)

The backup requirement is **get data off the source**. That ships:

- **Directory** — AD system-state IFM (NTDS.dit, GPOs, SYSVOL).
- **Whole set shipped off-box** — the full backup set leaves the appliance.
- **Database** — Tier-1 encrypted FULL + LOG on SQL Express (default **30-minute RPO**, restore-tested); Tier-2 SQL Always On is an operator-provided scaffold.
- **OpenSearch** — scheduled filesystem-repository snapshots; restore proven in ~1–2 minutes.

::: warning
**Automated restore is out of scope.** The shipped scope is getting data off the source; recovery is a manual procedure — do not expect one-click restore.
:::

See **[Backup](/2.0/how-tos/backup/)**.

## Credential vault — Shipped

Device and service credentials live only in an encrypted vault — never plaintext JSON. It uses **envelope encryption**: a per-secret **AES-256-GCM** data key wrapped by a **TPM-held KEK** (CNG Platform Crypto Provider, non-exportable), bound to additional authenticated data, with **online KEK rotation**, migration re-encrypt, and decrypt-auditing. This replaces DPAPI null-entropy storage. Device secrets stay reversibly encrypted because they must be replayed to the device.

::: note
**Vault DR escrow ships and is drilled.** `--vault-escrow` wraps every key-encryption key to an operator-held **RSA-4096 recovery key** and ships the escrow document with the off-box backup set; `--vault-recover` re-seals those keys under a rebuilt box's own TPM — drilled live across two appliances with different TPMs. The open item is narrower: **hardware (PIV/FIDO2) custody of the recovery key** — today the operator keeps the recovery private key off-box themselves.
:::

See **[Manage credentials](/2.0/how-tos/manage-credentials/)**.

## Monitoring — Shipped (Partial)

Monitoring is **push-first and correlated** — collect-once / serve-many into a materialized device-state index, with findings bounded per device rather than a raw event firehose. The AlertEngine fires in seconds. **Self-health** watches the box's own vitals every 15 minutes: C: disk, RAM, CPU, the SQL Express 10 GB cap, OpenSearch health, and core-service liveness.

::: warning
Skans is **not a full IDS/EDR.** It logs, correlates, and self-alerts, but pair it with a dedicated IDS/EDR for complete NIST Detect coverage.
:::

See **[Alerts & monitoring](/2.0/monitoring/alerts/)**.

## Vulnerability management — Shipped (hand-off)

A **CVE + MITRE ATT&CK** feed is matched against live inventory; each finding carries its **fixed-in version** and hands off to the agent's patch-approval flow.

::: note
There is **no automatic CVE-to-exact-fix** automation and firmware is flagged, not auto-patched — remediation is a deliberate hand-off to a human approver.
:::

See **[Vulnerability management](/2.0/monitoring/vulnerability-management/)**.

## Compliance evidence — Shipped (enabler)

Skans maps its **technical** controls to NIST 800-171 / CMMC Level 2, 800-53 Moderate/High, and CIS/STIG at mandated defaults, and generates assessment-ready evidence from live state.

::: warning
Skans is a compliance **enabler, not a certification** — never "CMMC compliant" or "CMMC in a box." Roughly **one-third of the 110 NIST 800-171 controls are organizational** (the customer's), delivered via a **control-responsibility matrix** and **POA&M**. Formal Level 2 status requires a **C3PAO**. The audit ledger is **tamper-evident** (hash-linked + signed), **not WORM / immutable**.
:::

See **[NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/)**.

## RBAC & login — Shipped (MFA partial)

Access control is **capability-based RBAC**, AD-authoritative. Forms login is **rate-limited (5/min/IP → 429)** and audited, with a **15-minute idle lock** and Sign-out. Optional **OIDC federated console SSO** (AD FS / Keycloak) is single-factor (`amr=federated`).

::: warning
**Phishing-resistant MFA does not ship fully tested today.** Smart-card **PIV console login is proven on Windows only** — the Linux path needed manual setup and is not an operator flow. The **FIDO2 / WebAuthn** lane is built, but the FIPS YubiKey has not arrived — treat it as available-soon, not shipped-and-tested.
:::

See **[Roles & RBAC](/2.0/reference/roles-and-rbac/)** and **[Smart-card login](/2.0/how-tos/smartcard-login/)**.

## FIPS & cryptographic posture — Shipped (approved-mode)

The appliance runs in **FIPS approved-mode** (Windows FIPS policy on; Schannel prefers TLS 1.3 with a 1.2 floor). The CA key is TPM-backed and non-exportable by default.

::: warning
**Approved-mode is not CMVP-validated.** Formal validation still requires pinning CMVP-validated module versions per release. The software/TPM key store is not itself a validated HSM, and the **code-signing key is software-backed** (honest: not HSM/TPM-FIPS).
:::

## Preview / Roadmap

Design-stage or in-flight — **not** something you can enable in this release:

| Item | Status |
| --- | --- |
| **Core + Edge distributed multi-site tier** | In-flight. The foundational layers — the versioned mTLS wire protocol, Edge enrollment, and the store-and-forward relay — are built and lab-verified on a two-box setup; summarize-at-Edge, boundary groups, and HA edge pools remain design-stage. The shipped flagship is the single appliance (up to ~5,000 devices); no committed per-Edge device numbers. See **[Distributed design](/2.0/concepts/distributed/)**. |
| **Double-click agent MSI / EXE wizard** | Roadmap. Today the agent ships via GPO / SYSVOL as an Authenticode-signed service. |
| **FIDO2 / YubiKey FIPS MFA** | Built, hardware pending — available-soon. |
| **Vault recovery-key hardware custody** | Roadmap. Vault DR escrow itself is **shipped and drilled cross-box**; the open item is re-wrapping the operator recovery key to a PIV/FIDO2 hardware token. |
| **CMVP-validated FIPS module pinning** | Roadmap; required for formal FIPS validation. |

## Next

- **[How Skans works →](/2.0/getting-started/how-skans-works/)** — the mental model behind these capabilities
- **[NIST 800-171 / CMMC evidence →](/2.0/compliance/nist-cmmc-evidence/)** — the compliance boundary in detail
- **[Ports & endpoints →](/2.0/reference/ports/)** — the full network reference
- **[Troubleshooting →](/2.0/reference/troubleshooting/)** — when something doesn't line up
