---
title: Restore from backup
eyebrow: How-tos
description: Use the Recovery page to verify restore points, rehearse a SQL restore without touching the live database, and — as a guarded break-glass step — promote the rehearsed copy to live.
---

The **Recovery** page (`/recovery`) lists every restore point on the appliance and puts the safe actions first: a read-only **Verify** that proves a backup actually opens, and a **standby rehearsal** that restores SQL side-by-side without touching the live database. The one destructive action — swapping the rehearsed copy in as the live database — is a separate, capability-gated break-glass tier. Taking the backups themselves is covered in **[Backup & recovery](/2.0/how-tos/backup/)**.

## 1. Review the restore-point catalog

Open **Recovery**. Skans enumerates the restore points already on disk, newest first, with the latest of each asset flagged:

| Asset | What it is |
| --- | --- |
| **SQL full** | Encrypted full backup of the control-plane database. Restoring one automatically replays the entire log chain taken since it, so the individual log artifacts don't clutter the catalog. |
| **AD system state** | The encrypted directory backup — install-from-media set, GPOs, SYSVOL. |
| **CA key + DB** | The certificate authority's key material and database backup. |
| **Config set** | Operator configuration and golden baselines. |

The catalog is a read of what exists — nothing here decrypts or restores anything yet. Viewing and the non-destructive actions use the same capability as the Backup pages (`policy.change`).

## 2. Verify a point (read-only)

**Verify** answers "would this backup actually restore?" without writing anything:

- **SQL full** — the database engine checks the backup end to end (a restore-validity check, not a file-exists check).
- **CA** — Skans opens the latest key backup with the vaulted backup password, proving the private-key material is intact *and* the password matches.
- **AD** — Skans decrypts the latest directory backup, unpacks it, and validates the directory database header — a valid header means it would mount on a rebuilt domain controller.

CA and AD verify always check the **latest** artifact, so only the newest row of each offers the button.

::: tip
You don't have to remember to do this. A scheduled restore-verify already runs daily for the crown-jewel backups, its result surfaces on the appliance roles page, and a failure raises a Critical alert. The button on Recovery is the on-demand version of the same proof.
:::

## 3. Rehearse a standby restore (non-destructive)

Pick any **SQL full** and choose **Standby restore**, then confirm. Skans restores that full — plus every log backup taken since it — into a **side-by-side database named `Skans_standby`**. The live database is never touched; the console stays up throughout. This takes minutes and proves the entire chain restores, end to end, on this exact appliance.

Rehearsal is the intended steady-state drill: a backup you have never restored is a hope, not a plan.

## 4. Promote the standby to live (destructive, break-glass)

::: warning
Everything below this line is **destructive, last-resort recovery**. The promote swaps the live database and restarts the appliance; the CA and AD runbooks overwrite live state. These actions sit behind the **`dr.restore`** capability — a break-glass grant held only by the **Admin** role in the shipped defaults — and they should be used only in a real recovery, not as routine operations.
:::

The **Promote standby to live** panel makes the rehearsed `Skans_standby` the live database. It is guarded three ways:

1. **Pre-flight** — the button stays disabled until a `Skans_standby` exists and is online. You cannot promote a restore you never rehearsed.
2. **Typed confirmation** — you must type `PROMOTE` to arm the action.
3. **Rollback preserved** — the current live database is **renamed and kept, never dropped**. If the promote was wrong, the old database is still there to swap back.

On confirm, the appliance stops the control plane, swaps the standby into place, and restarts — the console drops for roughly half a minute, and the action is audited and raises an operator alert.

## CA and AD restore are guided runbooks, not buttons

Restoring the certificate authority or Active Directory is **not automated** — and deliberately so: an authoritative restore of a sole domain controller is done by hand, in Directory Services Restore Mode, with the operator in control at each step. What Skans provides:

- **Guided runbooks on the Recovery page** — expandable panels showing the exact host-console steps, with the latest backup filename already filled in, plus an ordered checklist for recovering onto a rebuilt appliance (including whether the DR master key is escrowed off-box).
- **The vaulted CA backup password** — revealable in place for the restore command, gated by the separate `vault.reveal` capability.
- **Read-only verify for both** (step 2 above), so you know *before* a crisis that the artifacts restore.

::: note
Be clear about the boundary: SQL restore is rehearsed and promotable from the console; **CA and AD restore remain documented manual procedures with automated verification** — Skans proves those backups are restorable, it does not click through a directory restore for you.
:::

## Next

- **[Backup & recovery →](/2.0/how-tos/backup/)** — how the restore points in the catalog get taken and shipped off-box
- **[Roles & RBAC →](/2.0/reference/roles-and-rbac/)** — capability grants, including break-glass
- **[Troubleshooting →](/2.0/reference/troubleshooting/)** — when a service doesn't come back after a restart
