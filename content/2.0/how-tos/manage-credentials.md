---
title: Manage device credentials
eyebrow: How-tos
description: Enter each device and service credential once in the console — Skans encrypts it straight into an SQL vault under a platform-sealed key (TPM-protected on Windows), never to a plaintext file.
---

Every device and service credential Skans holds — a camera's management login, a controller's API key, a database password — lives in one place: the **encrypted credential vault** in SQL. You enter each one **once** through the console, it is encrypted on the way in, and it is never written to a plaintext file. This guide covers entering credentials, how the vault protects them, and the admin key-lifecycle actions.

## Enter a credential (zero-exposure)

Open the console **Credentials editor** and add the credential for the target device or service. Two kinds:

- **Device credentials** — the management login Skans uses to reach a device (issue and bind its certificate, read health).
- **API / controller credentials** — a service or controller cred, for example the read-only credential for a UniFi network controller.

When you save, the value is written **straight into the SQL vault, encrypted**, and stored as an `[SKV2]` envelope. It is never echoed back on entry and never staged in a file — that's the zero-exposure path. From then on Skans uses the credential internally; surfacing a stored value again is a separate, **RBAC-gated reveal** action that is itself audited.

::: warning
**The hard rule: credentials live only in the vault.** Never paste a device or service password into a config file, script, or JSON. Enter it through the console Credentials editor so it stays encrypted at rest. The shipped appliance is confirmed free of plaintext credential files.
:::

## How it's protected

Skans uses **envelope encryption**. In plain language: every secret gets its own key, and that key is sealed by a key that never leaves the box.

| Tier | Key | Role |
| --- | --- | --- |
| **Wrapping key** | Platform-bound; sealed to the box (TPM key / DPAPI entropy / keyfile) | Seals the KEK. Never leaves the appliance. |
| **KEK** | 32-byte AES-256 (`kek-1`, `kek-2`, …) | Wraps every DEK. |
| **DEK** | Fresh 32-byte AES-256, **one per secret** | Encrypts the actual password (AES-256-GCM). |

Each secret is encrypted with its own **DEK** (AES-256-GCM). That DEK is itself encrypted ("wrapped") by the **KEK**, and the KEK is sealed by a **wrapping key** that is bound to the appliance and cannot be exported. Because a new DEK is minted per secret, no two credentials share a key.

The ciphertext is also **bound to its exact location** — the specific device (row) and field (device / api / db) it belongs to — using authenticated additional data. Lift a stored blob and drop it onto another device or column and it simply **fails to decrypt**. A copied blob can't be replayed somewhere it doesn't belong.

::: note
On the primary Windows SKU the wrapping key is a **TPM-protected key** (RSA-2048 in the platform crypto provider, non-exportable, sealed on the box; works on a vTPM). That is the hardware-backed provider.
:::

### Which provider protects the KEK

Skans picks the wrapping-key provider **once, at first boot**, then pins it — it is never re-probed once secrets exist.

| Provider | Chosen when | Hardware-backed? |
| --- | --- | --- |
| **TPM** | Windows with a usable TPM (including vTPM) | **Yes** |
| **DPAPI** | Windows with no usable TPM | No — per-install random entropy, honestly reported as not hardware-backed |
| **Keyfile** | OSS / Linux, or anything else | No — file-permission-only (`0600`); optional passphrase unseal |

Only the **TPM** provider is hardware-backed. DPAPI and keyfile are honest software fallbacks — a keyfile with no passphrase is file-permission security, not key-in-hardware security. The choice is recorded in the appliance's pinned vault config; you don't configure it by hand.

::: note
If crypto strength comes up: the appliance runs in **FIPS approved-mode** (capable), which is **not** the same as CMVP-validated.
:::

## Legacy credentials migrate automatically

If you're upgrading, existing secrets keep working with **zero migration**. When Skans reads a secret it checks for the modern `SKV2$` envelope; anything older is decrypted through the previous path, so every stored credential still opens.

An optional one-time sweep re-encrypts every legacy device, API, and database secret to the modern envelope (it skips ones already migrated). It's an optimization, not a prerequisite — see the admin actions below.

## Admin: key lifecycle (online, safe)

Key rotation and status run on the ControlPlane binary. All verbs are **idempotent** and run **online on a live appliance** — new key material is minted before old material is retired, and writes are crash-safe.

```powershell
# Report provider, hardware-backed?, active KEK id, all KEK ids, legacy-blob count
Skans.ControlPlane.exe --vault-status

# Optional: re-encrypt any legacy secrets to the modern SKV2 envelope
Skans.ControlPlane.exe --vault-migrate

# Rotate the KEK: mint the next KEK, re-wrap every DEK, retire the old KEK
Skans.ControlPlane.exe --vault-rotate-kek

# Rotate only the wrapping key (new TPM key / new DPAPI entropy); ciphertexts untouched
Skans.ControlPlane.exe --vault-rewrap
```

Recommended cadence:

- **`--vault-rewrap`** on wrapping-key hygiene events — a TPM clear or replacement, or suspected host compromise. Fast: it re-seals the KEK without touching any ciphertext.
- **`--vault-rotate-kek`** on periodic key-lifecycle policy, or after suspected KEK exposure. It re-wraps every DEK under a fresh KEK.

### Decrypt auditing

Every decrypt is audited. Interactive console actions (reveal, set credentials, rotate) are recorded to the **SQL audit chain** with action `vault-decrypt` and the acting AD principal. Machine and background decrypts (the rotation job, database backup, CLI) append to an OpenSearch index, `skans-vaultaudit-YYYY.MM`, capturing who, when, scope, field, KEK id, provider, job, and host.

::: note
**Planned — credential-access history screen.** Decrypt events are audited and queryable **now** (SQL + OpenSearch), but a console screen to browse credential-access history is not yet shipped.
:::

## Disaster recovery — read this

::: warning
**Deferred — the vault does not yet travel to new hardware.** DR escrow of the vault is a roadmap stub. A standby or rebuilt appliance has a different TPM / DPAPI context and **cannot unwrap the primary's KEK**. If you lose the appliance, treat it as a **re-credential event**: on the rebuilt box, re-enter (or rotate) each device's credential from your credential source. Planned work will escrow the sealed KEK to a PIV/FIPS token or a recovery secret so the vault can be recovered — until then, don't assume the vault survives a box loss.
:::

## What the vault does and doesn't defend

Device and service passwords are **reversible by necessity** — a camera or database password has to be replayed verbatim to work. So live code running as the appliance's service identity can always ask the vault for plaintext, and the vault does not claim to stop that.

What envelope encryption **does** defeat is offline, data-only theft: a stolen SQL dump alone, a stolen disk image alone, or a swapped/copied ciphertext. What it does **not** defend is a live-breach adversary already executing as the service on a running box. Closing that last gap needs an operator-present unwrap (an HSM-with-PIN provider), which is future work.

## Next

- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** — where you first store a device's management credential
- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — the agent lane
- **[Roles & RBAC →](/2.0/reference/roles-and-rbac/)** — who can reveal or rotate credentials
- **[Smart-card login →](/2.0/how-tos/smartcard-login/)** — strong operator identity for console actions
