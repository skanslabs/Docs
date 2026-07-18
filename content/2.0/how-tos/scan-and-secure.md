---
title: Scan & secure a subnet
eyebrow: How-tos
description: Point Discover at a CIDR range and let Skans scan, identify, and enroll everything it finds — provisioning every lane each device's driver declares, with one credential per vendor.
---

**Discover** (`/discover`) is the van-tech path: enter a subnet, press one button, and every device Skans can identify and authenticate to gets fully enrolled — identity read, certificate issued, topology swept, config backed up, telemetry pointed at the appliance — in one pass. No per-device data entry, no CLI, no vendor knowledge required.

The rule behind it: **enrolling must provision everything the device's driver declares, in one go**. A driver that can do six things does all six at enroll time — an operator never has to know which follow-up steps exist, and a lane can't be silently forgotten.

## 1. Store each vendor's credential — once

Skans asks for credentials **once per vendor, not once per device**. A site has one switch password and one camera password, not two hundred; store each through the console's credential editor and it is vault-encrypted from that moment (see **[Manage credentials](/2.0/how-tos/manage-credentials/)**). A device-level credential already in the vault works just as well — the scan never skips a device whose password Skans already holds.

## 2. Scan the range

Discover keeps a list of **monitored networks** — the enclave can span several subnets (the appliance subnet, a controller's management net, an OT/camera VLAN), and you can sweep them all with one click or scan an ad-hoc CIDR/range (`10.0.10.0/24` or `10.0.10.1-254`). Results show each host's address, name, open ports, an ONVIF flag for cameras, a suggested type, and whether it is already in inventory. **Import** alone just creates inventory rows — the securing happens next.

## 3. Press "Scan & secure everything"

The one button runs scan → identify → secure across the range:

**Identification is proof, not guesswork.** A MAC OUI or ONVIF string is only a *hint* that orders which driver to try first — the actual answer comes from a driver connecting on the device's own management protocol. If the Juniper driver opens a session and the box answers with a Junos version, that box *is* a Juniper. Devices whose vendor can't be confirmed, or whose vendor has no stored credential, are **reported and skipped — never guessed at, and never silently dropped**; the result table says exactly why each skip happened.

**Enrollment provisions every declared lane.** For each confirmed device, Skans runs exactly the lanes that device's driver declares (see **[the driver pack](/2.0/concepts/driver-pack/)**):

| Lane | What happens |
| --- | --- |
| **Identity** | Read the device's identity and firmware version over its management API |
| **Certificate** | Issue from the built-in CA and deploy — pushed by the driver, or via SCEP where the device enrolls itself |
| **Topology** | Sweep fabric gear for VLANs, attached endpoints, and neighbors (feeds the **[topology map](/2.0/reference/topology-map/)**) |
| **Config backup** | Capture the running config — over the driver's CLI recipe or its config-read API — for golden-baseline drift detection |
| **Firewall state** | For firewalls: read interfaces, policies, routes, and HA state onto the device page |
| **Monitoring** | The **driver configures the device itself** to send its telemetry — syslog and SNMP/traps — to the Skans collector, over the device's native API or via its controller |

A lane that fails is reported and the rest continue — onboarding never aborts halfway and leaves a device half-provisioned with no record of what ran. Each device finishes with a lane scoreboard ("5/5 lanes ok", or the failing lane named).

::: note
Monitoring here means the device is configured **to push** — its syslog and traps aimed at the collector by the driver, per the agentless model in **[Monitoring & alerts](/2.0/monitoring/alerts/)**. The lane also requires an SNMP community to be configured in settings first: an SNMP community is a credential, so with none set the lane is skipped *and says so* rather than pushing a guessable default onto every switch.
:::

## What deliberately does NOT run

::: warning
Two lanes change **access**, not just observability, and are explicit opt-ins that the Scan & secure button never applies:

- **802.1X/NAC enforcement** can black out a camera fleet the instant it lands on live ports. It stays a separate, deliberate act — see **[802.1X access control](/2.0/how-tos/network-access-control/)**.
- **Credential rotation** changes the device's password.

Everything the automatic pass runs either only reads from the device or only adds an outbound telemetry destination — it cannot take a device off the network.
:::

## Verify

Open a secured device's page: a certificate issued by the Skans CA, firmware recorded, config captured, and events flowing. The per-device view of a healthy enrollment is the same as in **[Enroll a device](/2.0/how-tos/enroll-a-device/)** — Discover is the fleet-scale version of that flow, not a different mechanism.

## Next

- **[Enroll a device →](/2.0/how-tos/enroll-a-device/)** — the single-device flow, including devices that can't take a certificate
- **[The topology map →](/2.0/reference/topology-map/)** — where the topology sweep lands
- **[Device support matrix →](/2.0/reference/driver-matrix/)** — which vendors and lanes each driver supports
- **[Manage credentials →](/2.0/how-tos/manage-credentials/)** — the vault behind the once-per-vendor question
