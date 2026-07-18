---
title: Roles & access control (RBAC)
eyebrow: Reference
description: The capability-based RBAC model behind the console — six roles on a single-tenant appliance, per-route capability gating, shipped access controls, and optional OIDC SSO that stays AD-authoritative.
---

Skans enforces **least privilege** in the console with a **capability-based RBAC** model: six roles resolve to six lenses on one appliance, the model gates each route and action by a capability claim, and the whole thing sits behind shipped access controls — login rate-limiting, idle lock, and audited actions attributed to the real person. This page is the admin reference for how those pieces fit together.

## The model: capabilities, not hard-coded roles

Access is expressed as **capability claims** (`cap:*`), not a fixed enum of what each role may do. The backend owns capability roles and a role API; the console maps a signed-in user's capability claims to **both** what appears in the navigation **and** which actions are available. The model defines **18 fine-grained capabilities** — from `dashboard.view` and `device.deploy` through `vault.reveal` to the break-glass `dr.restore` — so a role is a small, auditable bundle of exactly what the job needs, never all-or-nothing.

This is the FR-U02 requirement — *enforce role-based access / least privilege* — and it maps to **NIST AC-6** (least privilege). Least privilege is the governing principle here: a role gets exactly the capabilities its job needs and nothing else.

::: note
The appliance is **single-tenant** — it *is* the customer's directory and CA for one enclave. There is no separate provider portal or provider tenant. Instead there are six roles on one console; two of them (Admin and Technician) are **cross-cutting** and may be held by Skans field staff **or** the customer's own people, while the other four are customer-organization roles.
:::

## Six roles, one console

Each role resolves to a distinct **lens** — the same console, scoped to what that person should see and do.

| Role | Held by | What the lens gives them |
| --- | --- | --- |
| **Admin** | Skans field staff or customer IT | Everything — including the **break-glass `dr.restore`** capability for destructive in-place restore, which only Admin holds. All actions audited. |
| **Technician** | Skans field staff or customer staff | Guided install / replace / diagnose and support-bundle capture; may **reveal stored device credentials** (`vault.reveal`, every reveal audited) — reading back a device password on site is the job. **No** PKI, AD, roles, or hardening changes. |
| **Manager** | Customer org | Enclave-at-a-glance plus **approvals** — patch-ring promotion, maintenance windows, firmware push, org user provisioning (gated by `patch.approve`). |
| **Supervisor** | Customer org | Scoped to an assigned area / segment; acknowledge alerts **in scope**. |
| **Operator** | Customer org | Day-to-day view of the estate; acknowledge alerts. Self-service **report / flag** creates a request, not a change. |
| **Auditor** | Customer org | Read-only NIST posture and evidence; review / attest; export signed evidence. **No** mutating action. |

In the design spec each role's access to a surface reads as one of three states: **full**, **partial (scoped read)**, or **hidden**. Manage roles and assignments from the console under **System → Access (Identity & RBAC)** — capability grants live with the role, so adding a person to a role gives them exactly that role's claims.

## Per-route capability gating

The intended enforcement model (FR-UI-02) gates access at three layers so that visibility and enforcement never depend on the same check:

1. **Per route** — each route declares a **primary capability**. An `AuthorizeRouteView` gates both the nav item and the page itself (`Policy` = the page's primary cap). No capability, no nav entry and no page.
2. **Per control** — each mutating control is wrapped in an `AuthorizeView` keyed on its own **action capability**, so a page you can *read* may still hide the buttons you can't *use*.
3. **Server-side re-check** — the server re-checks the capability when the action runs. The design rule is blunt: **"a hidden button is not a control — hiding is not enforcing."**

For example, `cap:device.manage` gates inline cell editing (Location / Tier / Vendor) in the Devices grid and audits the change, while `patch.approve` gates the Manager approvals surface. Two capabilities deserve a call-out: **`vault.reveal`** gates revealing a stored credential in plaintext (held by Technician — the control is the audit trail on every reveal, not withholding the capability from field staff whose job needs it), and **`dr.restore`** gates destructive in-place restore (SQL / CA / AD) — a **break-glass, Admin-only** grant that sits above `policy.change`.

::: warning
Server-side enforcement is **being rolled out across the console, not uniformly shipped on every page yet.** The backend capability RBAC (role API and access controls) is shipped and green, and the model above is the target for every route — but historically some pages *rendered* the gate without *enforcing* it. Treat per-route server-side enforcement as the intended, in-progress model; capability-gating of the Users / Groups / Roles surfaces is where that gap is being closed first.
:::

::: note
Embedded analytics reached through the console are fronted by the same RBAC: a deny-by-default reverse-proxy passes customer roles only the embedded dashboards, while Explore / Discover-style tooling is reserved for Admin and Auditor.
:::

## Console access controls

These sit under the RBAC model and are **shipped, go-green facts** (FR-OPS10). They support **NIST AC-7 / AC-11 / AC-12** (login attempts, session lock, session termination) and **AU-2** (audited events).

| Control | Behavior |
| --- | --- |
| **Login rate limit** | Forms login is limited to **5 requests / minute / IP**; over the limit returns **HTTP 429** (the `login` policy). |
| **Audited login** | Login is audited on **both success and failure**, with the source IP. |
| **Idle lock** | A **15-minute sliding** idle cookie (`ExpireTimeSpan`) locks an abandoned session. |
| **Sign-out** | `GET` + `POST /logout`, plus a **Sign out** link in the main layout. |
| **Real-actor attribution** | An `AuditContext` middleware stamps the authenticated principal as the ambient actor, so AD and RBAC service-layer writes attribute the **real user** — not a generic "console" account. |

::: note
Audit attribution and the console's audit trail are **tamper-evident** (hash-linked and signed), not immutable / WORM. See **[NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/)** for the audit chain and evidence pack.
:::

## Smart-card MFA

Least privilege pairs with MFA for administrators (NFR-SEC-04; FR-U04, **NIST IA-2(1)**). The phishing-resistant lane is a **smart-card / PIV client certificate** — the RBAC and SSO layers reserve the `smartcard` authentication method (`amr`) for a **real PIV cert** and nothing else.

Set-up, the proven-on-Windows caveat, and the status of the FIDO2 / YubiKey lane live on the dedicated page — see **[Smart-card (PIV) login](/2.0/how-tos/smartcard-login/)**.

## Optional OIDC SSO federation

Skans can **federate** console login to an external identity provider over OIDC (FR-U03, **NIST IA-2 / IA-8**, priority *Should*, implemented via the console SSO installer step). This is optional and **layers over** the existing directory-forms and PIV login schemes plus RBAC — it does not replace them.

- **AD stays the access authority.** The federated identity composes with an **AD-authoritative, fail-closed** decision; SSO does not make Skans the IdP.
- **Honest `amr` passthrough.** Federated logins carry `amr` of `federated` or `federated+mfa` only, and **never** echo `smartcard` — that value is reserved for a real PIV cert.
- **Verified binding.** A bare email from the IdP is bound to an account **only when `email_verified` is true**.
- **Break-glass preserved.** The forms and PIV login doors stay open so you can still get in if the IdP is unreachable.

## NIST controls this supports

Skans's access controls **support** these NIST control families — they are enablers, not a certification or attestation of compliance.

| Control | Supported by |
| --- | --- |
| **AC-6** (least privilege) | Capability-based RBAC; six-role least-privilege model |
| **AC-7 / AC-11 / AC-12** | Login rate-limit (429); 15-min idle lock; `/logout` session termination |
| **AU-2** | Audited login (success + failure, source IP); real-actor `AuditContext` attribution |
| **IA-2 / IA-2(1)** | MFA for admin; smart-card / PIV phishing-resistant lane |
| **IA-8** | Optional OIDC SSO federation (AD-authoritative) |

::: warning
These are controls the RBAC and access-control features **support** — never read this as "compliant" or "certified." Formal standing requires configuration, evidence, and a third-party assessment. See the compliance page for the honest boundary.
:::

## Next

- **[Smart-card (PIV) login →](/2.0/how-tos/smartcard-login/)** — set up the phishing-resistant MFA lane
- **[NIST 800-171 / CMMC evidence →](/2.0/compliance/nist-cmmc-evidence/)** — the audit chain and one-command evidence pack
- **[Manage credentials →](/2.0/how-tos/manage-credentials/)** — the vault behind service and device secrets
