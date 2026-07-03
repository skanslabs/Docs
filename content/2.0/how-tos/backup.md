---
title: Backup & recovery
eyebrow: How-tos
description: Get every store on the appliance — database, telemetry, directory system-state, device configs, and endpoint backups — encrypted and off the box, with a documented manual restore.
---

Skans's job is to get your data **off the source and off the appliance, encrypted** — so nothing irreplaceable lives in only one place. This is a built, drilled-live capability, not a roadmap item. Restore, by design, is a **manual break-glass procedure an admin runs**, not a one-click button.

::: warning
The requirement Skans satisfies is **getting data off the source**. Automated **restore is out of scope** — restore is a documented procedure an admin runs by hand. The database and telemetry restore paths are drilled and proven; directory recovery follows the standard AD restore-from-media procedure. Don't expect push-button recovery.
:::

## What Skans backs up

Six lanes run on their own schedule inside the always-on scheduler service. Each captures a different store, ships it off-box, and encrypts it before it leaves the appliance.

| Lane | What it captures | Off-box | Encrypted |
| --- | --- | --- | --- |
| **Control-plane database** (SQL) | Devices, config, RBAC, agent/edge registry, credential-vault refs, audit | Daily full `.bak`, keep-last-N | AES-256 |
| **Telemetry store** (OpenSearch) | Events, Windows logs, metrics, network logs, inventory, CVEs, device-state | Daily filesystem-repo snapshot | Repo on ACL-locked disk, shipped off-box |
| **Directory system-state** (AD) | `NTDS.dit` (via `ntdsutil ifm`), all GPOs (`Backup-GPO`), SYSVOL | Daily, off-box | AES-256 |
| **Appliance config + baselines** | Operator config tree (`*.json`), DC/device golden baselines, best-effort vault snapshot, an OpenSearch data snapshot | Daily backup set | AES-256 |
| **Network-device configs** | Each supported device's running-config, pulled over its native SSH CLI, **versioned on change** + golden-config drift | Daily, off-box | AES-256 |
| **Endpoint backups** (agent) | Full + differential of config files and MS SQL databases on servers/workstations | Off the source host over the mTLS agent channel | AES-256 + DPAPI |

### Two stores, two mechanisms

The database and the telemetry store are deliberately handled differently because they are not alike:

- **The SQL control plane is small but irreplaceable** — roughly **8 MB** of live relational state against SQL Express's 10 GB cap (over a thousandfold headroom). It gets a **daily full `.bak`**, encrypted and shipped off-box. This is *not* continuous log-shipping: a day's RPO is the deliberate trade for a few megabytes of state.
- **The telemetry store is large but partly re-derivable** — a few hundred MB, append-only. After an outage, agents resume shipping, so only the outage gap is lost. It gets a **daily whole-cluster snapshot** to a filesystem repo, shipped off-box. Snapshots are incremental and deduplicated (a nine-snapshot chain measured at ~927 MB on disk, each new day adding tens of MB), and complete in seconds.

### Network-device config: version-on-change + golden drift

For agentless devices (cameras, controllers, network gear), Skans pulls the **running-config over the device's native SSH CLI**, encrypts it, and **saves a new version only when the config actually changed** — so history is signal, not daily noise. You can **bless a golden baseline**; Skans then audits every device against that baseline and logs **config drift** when anything diverges from golden. In the console this lives on **Network → Config drift** (golden baseline vs. current).

The same baseline-then-diff pattern guards the **appliance's own domain controller**: a daily job snapshots six config surfaces (local security policy, critical services, audit policy, GPO inventory, TLS/FIPS keys, AD CS config) and flags out-of-band change. An operator re-blesses the baseline after an intended change.

### The appliance backs itself up

The **directory system-state** is the crown jewel — `NTDS.dit`, every GPO, and SYSVOL, encrypted and shipped off-box daily as its own job. This is what makes the sole DC **rebuildable from media rather than from nothing**. Alongside it, the daily **backup set** ships the operator config tree, the DC and device golden baselines, a **best-effort** vault snapshot, and an OpenSearch data snapshot.

### Endpoint (server/workstation) backups

Windows servers and workstations back up **through the agent**: full and differential backups of config files and MS SQL databases, shipped **off the source host** over the mutual-TLS agent channel, encrypted at rest. App and endpoint databases use the engine-native path (`pg_dump`, `mysqldump --single-transaction`, or SQL `BACKUP DATABASE … COPY_ONLY` so an Always On log chain isn't disturbed). Each device's detail page shows a **backup-history strip** — recent full/differential runs, so you can see recovery posture at a glance.

::: note
Endpoint backup is set up as part of the agent lane — see **[Install & approve the Windows agent](/2.0/how-tos/install-the-agent/)**. As with every lane, the requirement is getting the data off the box; restore is out of scope (manual if ever needed).
:::

## Set an off-box target

Everything above ships to an **off-box target** you provide — until you set one, the daily off-box egress is a **no-op**. This is intentional: an unattended install is safe (nothing tries to write to a share that isn't there), but egress stays inert until an operator points it somewhere.

1. Open the console **Backup hub** at **Services → Backup** (`/services/backup`).
2. Go to the **Off-box target** tab.
3. Enter the destination **UNC path** (e.g. a `\\server\share`) and press **Save & test** — Skans runs a reachability test and shows a success or error result.

That writes a small target file and enables egress; from the next scheduled run, backups land at the share.

::: note
Set this once from the console (or bake it into your golden config). Because the target ships disabled by default, remember to configure it after a fresh install — otherwise backups are being *taken* on the box but not *shipped off* it.
:::

## Retention

- **Database** — keep-last-**N** full `.bak` files off-box (N is configurable; the default posture keeps the last ten). Older backups age out automatically.
- **Telemetry** — snapshot retention on the OpenSearch repo. The single-node, no-clustering model and flat retention are sized for a self-contained appliance, not an unbounded fleet.

You set the schedule and retention from the console's backup settings; you never touch `BACKUP DATABASE` or the snapshot REST API. The operator surface is a **status / last-result tile** plus the **Retention** tab — the mechanics stay under the hood.

## Recovering (break-glass)

Restore is **manual and admin-run**. The database and telemetry paths have been exercised end-to-end and come up green; directory recovery follows the standard AD restore-from-media procedure. None of it is automated — there is no one-click restore button.

- **Database** — decrypt the latest `.bak`, `RESTORE` it, repoint the connection string, restart the control plane. (Proven side-by-side: back up → change a row → restore → the change survived.)
- **Telemetry** — restore the needed indices from a snapshot on demand. (Proven: a real production snapshot restored `skans-device-state` into a renamed index, green, with the doc count intact.)
- **Directory** — rebuild the DC from the encrypted system-state media using the standard AD restore procedure.
- **Encrypted artifacts on a rebuilt box** — the AES-256 master key is DPAPI-sealed to the *original* appliance, so a **standby box must be given the escrowed key before it can decrypt** anything shipped to it.

::: warning
**Vault DR is partial.** Skans escrows specific critical secrets (so a rebuilt box can decrypt without the live vault) and the vault snapshot in the backup set is explicitly **best-effort**. The credential vault itself is fully built, but **full disaster-recovery escrow of the vault/KEK is a deferred, work-in-progress item** — don't assume the entire vault is guaranteed recoverable off-box. See **[Manage credentials](/2.0/how-tos/manage-credentials/)**.
:::

## Optional: ship-to-standby database HA (Tier-2, customer-owned)

If you need **automatic failover with no manual reconfiguration**, that is an **optional, customer-owned** upgrade — not a shipped Skans feature. Skans stays connection-string-agnostic: point the database config at a **SQL Server Always On** availability-group listener (`MultiSubnetFailover=true`) and the app fails over transparently. This requires a **Windows Server Failover Cluster** and **SQL Standard/Enterprise on both nodes** (it cannot run on Express), and the cluster remains yours to build and operate. An optional enablement scaffold exists, but Skans builds and runs nothing here.

::: note
The **shipped default** is the daily off-box `.bak` with manual restore described above — a deliberate day's-RPO trade, **not** continuous log-shipping. Treat automatic ship-to-standby as an add-on you own, not the baseline.
:::

## Under the hood (for admins)

- **Run model** — every recurring backup runs on an internal timer inside the always-on **SkansScheduler** Windows service (the old per-task Windows Task Scheduler jobs were retired): directory system-state ~1:30am, database ~2am, the backup set and network configs ~2:30am, DC drift ~3:45am.
- **Encryption** — each artifact is AES-256-encrypted before it leaves the box; the plaintext staging file is ACL'd and deleted in a `finally`. The `secrets` and backup directories are ACL-locked to SYSTEM + Administrators, and DR operations are serialized by a machine-wide mutex. *Honest caveat:* the backup cipher is currently AES-256-**CBC** (no AEAD); directory ACLs close the practical tamper vector, and a move to AES-GCM is a tracked hardening item.
- **Why encrypt the `.bak` ourselves** — SQL Express does not support `WITH ENCRYPTION` / `WITH COMPRESSION` (it errors with Msg 1844), so Skans encrypts the backup file itself rather than relying on the engine.

## Compliance mapping

Backup and recovery map to the NIST controls Skans **technically supports** — never a certification:

| Control | How Skans supports it |
| --- | --- |
| **CP-9** (Information System Backup) | Encrypted off-box database, telemetry, directory system-state, and endpoint backups |
| **CP-10** (Recovery & Reconstitution) | Documented, tested manual restore procedures per lane |
| **CM-2 / CM-6** (Baseline / Config Settings) | Golden-config baselines and drift detection for network devices and the DC |

Recovery of the *organizational* contingency-plan controls remains yours via the responsibility matrix — see **[NIST 800-171 / CMMC evidence](/2.0/compliance/nist-cmmc-evidence/)**.

## Next

- **[Install & approve the Windows agent →](/2.0/how-tos/install-the-agent/)** — sets up endpoint backup on servers and workstations
- **[Manage credentials →](/2.0/how-tos/manage-credentials/)** — the vault behind the best-effort vault snapshot
- **[NIST 800-171 / CMMC evidence →](/2.0/compliance/nist-cmmc-evidence/)** — where CP-9/CP-10 land in the evidence pack
