---
title: Device identity & the CA
eyebrow: Concepts
description: How Skans's built-in certificate authority gives every device an X.509 identity — one CA per enclave, four enrollment lanes, and TPM-backed key protection.
---

Every device on a Skans enclave gets its own **X.509 identity** — a real certificate issued by a certificate authority that lives on the appliance. There is exactly **one CA per enclave**, it's the root of trust everything else hangs off, and how a given device gets its certificate depends only on what that device is capable of. This page is the admin-level model of that CA and the four ways identity reaches a device.

::: note
Operators don't touch any of this directly — you press **Secure** and Skans picks the right lane. If you just want to enroll a device, see **[Enroll a device](/2.0/how-tos/enroll-a-device/)**. Read on for the architecture underneath.
:::

## One CA per enclave — the root of trust

Skans stands up **one certificate authority per enclave**. That's a deliberate architecture decision: a single authority means one chain to trust, one CRL to publish, and one place identity is minted. Every device certificate — camera, controller, Windows endpoint, agent — traces back to that one root.

The CA hierarchy is modelled as **root → intermediate → leaf**: a long-lived root anchors trust, an issuing intermediate signs day-to-day, and each device holds a short-lived leaf.

::: note
**Honest state of the hierarchy.** The proven lab appliance runs a single **AD CS Enterprise Root CA** named `Skans Root CA` that issues leaf certificates **directly**. The three-tier root → intermediate → leaf hierarchy is the documented design model; a separately stood-up issuing intermediate is not part of the shipped lab build today. Plan around the model; don't assume a distinct intermediate CA is running yet.
:::

### Why the chain has to reach the client

Cameras serve a **leaf-only** certificate — verified on all five hardware-tested units, where OpenSSL reports `Verify return code 21` (unable to get local issuer). That's expected: the device presents its leaf and nothing else, so the **client** validating the connection must already hold the rest of the chain. On the Windows SKU, GPO pushes the root (and intermediate, per the model) into every domain member. The OSS SKU ships the same trust as a **two-certificate bundle** you install on validators.

## One provider, two backends

The CA sits behind a single provider abstraction, `ICertificateAuthority`, with two interchangeable backends:

| SKU | Backend | Implementation |
| --- | --- | --- |
| Windows (primary) | AD CS Enterprise Root CA (`Skans Root CA`) | `AdcsAuthority` |
| OSS / Linux | step-ca | `StepCaAuthority` |

The point of the abstraction is that **drivers are CA-agnostic** — the code that talks to an Axis camera or a BACnet controller does not change when the backend does. Same console, same drivers, same workflow, whichever engine issues the certificate.

## The four ways a device gets identity

Skans routes each device to one of four enrollment lanes by capability. It picks automatically; the table is the decision tree.

| If the device… | It gets identity by… | Status |
| --- | --- | --- |
| Is a **Windows domain member** | auto-enroll + auto-trust via AD CS + GPO | Shipped, proven |
| **Speaks SCEP** but isn't domain-joined | self-enrolling through NDES with a one-time challenge | Shipped, hardware-validated |
| **Can't self-enroll** (most cameras / IoT) | a vendor driver issuing + pushing the cert, verified on the wire | Shipped for 5 cameras; rest hardware-pending |
| Is **industrial** (OPC UA / BACnet/SC) | protocol-native issuance | Built |
| **Genuinely can't take a cert** | no cert — secure the conduit and monitor instead | By design |

### 1. Domain member — auto-enroll + auto-trust

For Windows machines joined to the enclave directory (`skans.lan`, NetBIOS `SKANS`), identity is fully automatic. In AD CS Enterprise mode the CA **auto-publishes the root** into every domain member's **Trusted Root** store and **NTAuth**, and **GPO drives auto-enrollment** — the machine requests and installs its own certificate with zero operator steps.

This is proven end to end: domain member **SKANS-CLIENT1** auto-installed `Skans Root CA` over GPO with no manual action and then validated a camera's TLS certificate **with no trust warning** — the whole point of pushing the chain to clients.

::: note
The **Windows agent** gets its mTLS identity from the same CA. Agent transport is **mutual-TLS REST on port 5443**; the ControlPlane signs agent check-ins from AD CS. See **[Install the agent](/2.0/how-tos/install-the-agent/)** and **[Ports](/2.0/reference/ports/)**.
:::

### 2. SCEP-capable device — self-enroll through NDES

Devices that can't domain-join but do speak **SCEP** (RFC 8894) enroll themselves through the native AD CS **NDES** role, stood up unattended by installer step `25-ndes-scep.ps1` (hardware-validated, idempotent). The console shows you the **SCEP URL, the CA fingerprint, and a one-time challenge** to paste into the device.

```text
SCEP URL   https://<dc>/certsrv/mscep/mscep.dll
GetCACaps  POSTPKIOperation, Renewal, SHA-256
GetCACert  RA-signing + RA-encryption, chaining to Skans Root
```

Design details worth knowing:

- **No static SCEP secret.** The challenge is a **dynamic one-time password** (`EnforcePassword=1`, `UseSinglePassword=0`) — nothing shared or stored. The operator must be in the **`Skans NDES Admins`** group to mint one.
- **Template `SkansSCEPDevice`** — enrollee supplies subject + SAN, EKU ServerAuth + ClientAuth.
- The NDES RA app pool runs as the **auto-rotating gMSA `skans-svc`** — no service-account password to manage.
- **Self-enrolled certs are reconciled back into inventory** by `ScepReconcileSvc`, which reads the AD CS issued-certs database and upserts each device by CN/IP — so **revoke, renew, and health all work on SCEP devices** just like driver-enrolled ones.

### 3. Device that can't self-enroll — vendor-driver push

Most cameras, intercoms, and IoT gear can't enroll themselves at all. For these, a **vendor driver** reaches into the device's native management API, has the CA issue a leaf, **pushes and binds** it, and then **verifies on the wire** — it confirms the device is actually serving the **new certificate serial**, not "should work." The driver library is **CA-agnostic** and spans **117 vendors**.

::: warning
**Honest coverage.** Only **5 cameras are hardware-verified end to end** in the cert-push lane today — Axis, Hanwha, Bosch, 2N, and FS/Uniview. The rest of the 117 are authored from each vendor's official API and are **hardware-pending**. (A broader eight-device validation spans other driver types — see **[The driver pack](/2.0/concepts/driver-pack/)**.) Don't treat all 117 as proven.
:::

Real hierarchy and algorithm constraints show up here and are handled honestly — for example, a **Bosch** RSA-2048 leaf overflows that device's URL-payload transport, so it needs an **EC template or a POST-body** rather than being forced through.

### 4. Industrial protocols — OPC UA & BACnet/SC

Industrial devices get identity through their own protocols rather than a generic push:

- **`OpcUaCertSvc`** issues OPC UA application-instance certificates (URI-SAN, Part 6) and delivers them over a real **GDS Push** session (Part 12 `UpdateCertificate` + `ApplyChanges`), including the trust-list update.
- **`BacnetScCertSvc`** issues BACnet/SC operational certificates.

::: note
These OT certificates are **signed by the Skans Root**, not an external PKI. That's the honest scope — Skans is the enclave's authority, not a bridge to a corporate or vendor CA.
:::

### When a device genuinely can't take a certificate

Some Tier-C OT, legacy, and cloud-only devices have **no certificate API at all** (ONVIF certificate management is absent on real cameras, for instance). Skans **never fakes it**: the driver returns a clear error, and the platform secures the **conduit** instead — segment the device and monitor it natively, read-only (design decision AD-10). Identity you can't honestly issue, you don't pretend to.

## CA key protection

The CA's private signing key is protected by hardware **by default**. Installer step `20` sets the key provider to **`Auto`**: where a TPM is present it uses the **Microsoft Platform Crypto Provider** — a **non-exportable**, hardware-protected key — and falls back to a software KSP only where no TPM exists. An explicit **CNG-KSP override** points the CA at a **FIPS-140-3 HSM** (design ref AD-46; NIST **SC-12**).

::: warning
**This is not end-to-end CMVP FIPS.** A TPM Platform Crypto Provider is **not** a CMVP-validated HSM. The shipped default is TPM/software-backed; the **HSM path is a configuration override, not a lab-proven default**. Overall FIPS posture is **approved-mode capable**, not CMVP-validated — present the HSM as an option, not something running today.
:::

::: note
The same CA also issues **operator PIV certificates** for smart-card console login. That's a separate *people*-identity story — PIV login is Windows-proven only today and the FIDO2/YubiKey lane is built but not yet hardware-tested. See **[Smart-card login](/2.0/how-tos/smartcard-login/)**. It's mentioned here only because it shares the CA.
:::

## Renewal

- **Domain members** auto-renew through AD CS + GPO — no operator action.
- **SCEP devices** renew via SCEP renewal (`GetCACaps` advertises `Renewal`).
- **Appliance-owned certificates** are watched by **`PkiHealthSvc`** (the daily `SkansPkiHealth` task), which monitors every certificate and CRL Skans owns and **self-remediates**: it republishes the CRL weekly, **rebinds NPS** after a DC-certificate renewal (so EAP-TLS keeps working — see **[Network access control](/2.0/how-tos/network-access-control/)**), and renews the console certificate.

## Revocation

Revocation is **CRL-based**. `RevokeSvc.RevokeSerial` revokes a specific serial; decommissioning a device revokes its issued certificate **first**, and re-enrolling a device **supersedes** the old serial. The CRL is **republished weekly** so validators see revocations.

::: note
OCSP is listed among the CA's capabilities but is **not** separately stood up in the shipped build — **CRL is the working revocation mechanism** today. Don't assume a live OCSP responder.
:::

## Planned / not yet

Called out plainly so you always know what's real:

- **EST on the Windows SKU** — deferred (POA&M); AD CS has no native EST and every fleet device uses SCEP. On the **OSS SKU**, EST (alongside SCEP and ACME) comes natively from step-ca by enabling provisioners — no shim.
- **HSM-backed CA key** — a supported configuration override, not the lab-proven default.
- **Cross-OS PIV issuance** for operators — not yet an operator-ready path.
- **Live OCSP responder** — CRL is the shipped mechanism.
- **DR escrow of the CA-backup secret** — an off-box, escrowed backup path is described but treated as a deferred/partial capability, not a fully proven recovery path.

## Next

- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** — the operator flow for the agentless lanes
- **[The driver pack →](/2.0/concepts/driver-pack/)** — how the 117 vendor drivers are signed, versioned, and sandboxed
- **[How Skans works →](/2.0/getting-started/how-skans-works/)** — where the CA fits in the whole appliance
- **[NIST 800-171 / CMMC evidence →](/2.0/compliance/nist-cmmc-evidence/)** — the IA / SC controls this identity model supports (IA-5, SC-12, SC-13, SC-17)
