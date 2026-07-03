---
title: Smart-card (PIV) console login
eyebrow: How-tos
description: Use a PIV hardware token for strong MFA login to the Skans console from the physical console session on Windows.
---

Bind an admin's **PIV hardware token** to their directory identity and let them sign in to the console with the card plus a PIN — strong, phishing-resistant MFA instead of a password. This is proven today as a **Windows** operator flow: the card's certificate is mapped to the AD user by a strong issuer + serial binding, the reader driver is deployed for you, and login happens at the **physical console session**.

::: note
This page covers the **shipped Windows path**. Other platforms are caveated below under [Platform support](#platform-support), and the driver-free FIDO2/WebAuthn lane is **coming soon** — built, but not yet hardware-tested.
:::

## What you need

| Requirement | Detail |
| --- | --- |
| **Token** | Identiv / Hirsch uTrust (dual FIDO2 + PIV); the PIV login certificate lives in slot 9A |
| **Reader driver** | The vendor uTrust minidriver (`utrustmd.dll`) — the Skans agent auto-deploys it |
| **Session** | The **physical console session** (the reader is invisible over RDP) |
| **Identity** | An AD user with the card bound in the console PIV tab |

## 1. Bind the card to an admin identity

Open the console's **/access → PIV** tab and step through issuance there: pick the AD user, run the on-card request, then Skans signs the certificate from the built-in **Skans Root CA**, registers it, and **binds** it to that user.

The binding is what makes this strong. Skans sets the AD user's `altSecurityIdentities` to the certificate's **issuer + serial** (KB5014754 strong mapping). At login the console resolves that strong binding **first**, and only falls back to the certificate's UPN if no strong binding exists.

| Order | Binding | Source |
| --- | --- | --- |
| 1 — authoritative | Issuer + serial | `altSecurityIdentities` (strong mapping) |
| 2 — fallback | UPN | Certificate SAN |

::: tip
The strong binding is authoritative, not advisory. In testing, a card whose UPN *said* `david` but whose serial was bound to a **different** user signed in as the **bound** user — the self-asserted UPN did not win. Identity comes from what the CA bound, not from what the card claims.
:::

::: note
The certificate carries the target user's name because the **SmartcardLogon** template is configured **supply-in-request**. Issuing a card to a new user starts from this same PIV tab, and the management key needed to write the card is held in the credential vault, not by the operator. Issuing a brand-new card is still a **multi-step expert task** for an admin today — full one-click, field-supervisor self-service issuance is **roadmap**.
:::

## 2. The reader driver is deployed for you

On Windows the in-box Microsoft CCID/PIV driver enumerates the reader but never registers this token's ATR, so Windows can't actually read the card. The vendor **uTrust minidriver (`utrustmd.dll`) is required**.

You don't install it by hand. The Skans agent handles it (`EnsureUTrustMinidriver`): it pulls a hash-pinned vendor installer from `NETLOGON\SkansAgent\drivers`, runs it silently as SYSTEM into the Windows driver store, and Windows binds it on the first card insert.

```text
Agent  →  pull hash-pinned minidriver from NETLOGON\SkansAgent\drivers
       →  install /S as SYSTEM into the driver store
       →  Windows binds utrustmd.dll on first card insert   (no field-user install)
```

## 3. Log in from the console session

Insert the card at the appliance's **physical console** and go to **`/login/cert`**. The endpoint does mutual-TLS client-certificate authentication together with the card **PIN**. On success you're signed in as the mapped AD user, with the authentication method recorded as `smartcard`.

```text
Card inserted  →  /login/cert  (mTLS client cert + card PIN)
               →  strong issuer + serial match to the AD user
               →  signed in as that user   (method = smartcard)
```

Proven end to end: the card signs in as AD user `david`, `method=smartcard`, with the **Admin** role.

### Why it must be the console session

The PIV reader is **invisible to RDP and other non-console sessions**. Establishing a smart-card context succeeds as SYSTEM (session 0) but fails as an RDP user with `SCARD_E_NO_SERVICE` ("Smart Card Resource Manager not running"):

```text
SCardEstablishContext  as SYSTEM (session 0)  →  OK
SCardEstablishContext  as RDP user            →  SCARD_E_NO_SERVICE
```

::: warning
Do smart-card login from the **physical console session**. Over a remote session the reader won't be visible unless you explicitly redirect the token from your RDP client. If the card "isn't detected," this is almost always the cause.
:::

## Platform support

::: warning
PIV console login is an **operator-proven flow on Windows only.** The other platforms below are caveated — plan around them.
:::

- **Windows — supported.** Proven from the physical console session with the auto-deployed minidriver, as above.
- **Linux — manual, not an operator flow.** PIV was proven on Linux only via a manual per-machine setup (loading the OpenSC PKCS#11 module into the browser's NSS database). Browser login does **not** work until that module is loaded, and there is no auto-config agent for Linux. Don't hand this to a field user.
- **iPhone / iOS — not supported for PIV.** iOS has no PC/SC stack, so the PIV side doesn't work. The realistic iOS path is the token's **FIDO2** side — which is itself not yet hardware-tested (see below).
- **macOS — untested.**

## Coming soon: driver-free FIDO2 / WebAuthn

::: note
A **FIDO2 / WebAuthn** login lane is designed and built, reusing the same certificate → AD → RBAC resolver re-keyed on the credential ID (`Fido2NetLib`, `attestation=none`, `UserVerification=required`). Its appeal is **no driver install** and cross-platform reach.

It is **not yet hardware-tested** — the FIPS YubiKey we'd validate it against (the honest 140-3 fallback) hasn't arrived. Treat FIDO2 as **planned / available-soon**, not shipped-and-tested. Note also that WebAuthn requires a stable DNS FQDN as the RP-ID (it can't be an IP), with the Skans Root CA TLS certificate trusted on the client.
:::

## FIPS posture — be precise

::: warning
The uTrust token's FIPS level is **vendor-stated, CMVP certificate pending.** Skans deliberately does **not** print a FIPS 140 level or CMVP certificate number for the token until an exact SKU + firmware is matched to a certificate. More broadly, Skans is **FIPS approved-mode capable, not CMVP-validated** — the CA signing key is software-backed, and the console keeps a visible **FIPS-gap banner**. Don't describe smart-card login as "FIPS validated."
:::

## Next

- **[Roles & RBAC →](/2.0/reference/roles-and-rbac/)** — the role the card's identity lands in
- **[Manage credentials →](/2.0/how-tos/manage-credentials/)** — the vault that holds the card's management key
- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — the agent that auto-deploys the reader minidriver
- **[Troubleshooting →](/2.0/reference/troubleshooting/)** — reader not detected, and the RDP-vs-console gotcha
