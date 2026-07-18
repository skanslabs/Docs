---
title: The network topology map
eyebrow: Reference
description: The live fabric map at /topology — switches nested under their uplinks, endpoints attached by stable identity, and the per-switch VLAN, endpoint, and neighbor views it draws from.
---

**Topology map** (`/topology`) draws the enclave as a live, drill-down fabric tree: the appliance at the core, network controllers beside it, the switch/AP fabric **nested under its uplinks**, and endpoints attached to the switch they are actually plugged into. Counts and identity-coverage roll up at every level, so the map stays navigable whether a site has ten devices or hundreds.

Nothing on the map is synthetic. Devices come from live inventory, the switch-under-switch hierarchy comes from each fabric device's observed uplink, endpoint attachment comes from what the switches themselves report, and an endpoint whose attachment no source reports is shown honestly in an **"unattached, by type"** bucket — never guessed onto a switch.

## Correlated by identity, not by IP

Skans treats everything on a network as **ephemeral**: no IP, MAC, or hostname is a permanent key, and the map is assembled on **stable device identity** rather than on addresses (see **[Network identity & correlation](/2.0/concepts/network-identity/)**). Concretely:

- An endpoint is joined to its switch by the **switch's chassis MAC** — a stable hardware identity — never by matching display names, which drift and collide.
- A fabric device parents under the switch its **uplink** connects through; with no in-fabric uplink it parents under its managing controller, and only then under the core.
- **IP addresses are display-only.** They label nodes; they never decide where anything sits in the tree.
- Each node carries its cryptographic-identity state, so the map doubles as a coverage view: which parts of the fabric hold a Skans-issued identity and which don't yet.

## Where the data comes from

Two observation sources feed the same ingestion:

**LLDP over SNMP.** Skans walks a switch's standard **LLDP-MIB** neighbor table (IEEE 802.1AB), which is vendor-neutral — the same walk works across Juniper, Aruba, Cisco, and anything else that speaks the standard MIB. This is read-only SNMP (GET/WALK), not packet capture: it reads the switch's own view of the whole segment — every host on every port — which no endpoint agent could see. Each neighbor becomes an attachment observation: *this device, on this switch, on this port*.

**The vendor driver's fabric read.** For managed switches, the driver reads the switch's own tables on each sweep — the VLANs it carries, the endpoints learned per port (the forwarding table joined against the **L3 switch's ARP table**, so each MAC comes back with its resolved IP), and its LLDP/CDP neighbor records — and persists them as a fabric facet on the switch's device page.

::: note
An incomplete SNMP walk is reported as **PARTIAL**, never as a clean success — silently dropping half a neighbor table would quietly erase devices from the map. Likewise, a switch that isn't linked to a managed device shows its reachability as *unknown* ("not SNMP-monitored") rather than a guessed status.
:::

## Blast radius and root cause

The same fabric model answers the two questions a NOC actually asks about a switch, surfaced on the site and switch detail pages:

- **Blast radius** — "if this switch fails, these devices (and these downstream switches) go dark," counted over the whole subtree, not just directly-cabled ports.
- **Root cause** — an outage storm collapses to the **fewest true causes** by walking the uplink chain: a known-unreachable switch subsumes everything beneath it into one finding, and a switch whose entire subtree is dark is flagged as the suspect. A switch Skans *can* reach is never blamed for dead devices behind it — that case is labeled a downstream/independent fault, because the path to the switch is provably up.

This is the same correlation-not-volume rule as the **[alert engine](/2.0/monitoring/alerts/)**: one upstream cause, one finding.

## The per-switch view

Open a switch's device page to see what the map summarizes:

- **VLANs** the switch carries, with the read timestamp.
- **Attached endpoints** — MAC, resolved IP, port, VLAN (id and name), and 802.1X state per endpoint.
- **Neighbors (LLDP/CDP)** — system name, remote port, management IP, and platform for everything the switch is physically wired to.
- **Config history** — captured configuration versions over time, with a **golden baseline** you can pin and drift detection against it.

::: warning
The topology map and the fabric views are **observational**. They show what is connected where; they do not enforce anything, quarantine anything, or change port state. Network access control (802.1X/MAB) is a separate, deliberate, capability-gated act — see **[802.1X access control](/2.0/how-tos/network-access-control/)**.
:::

## Next

- **[Network identity & correlation →](/2.0/concepts/network-identity/)** — the identity model the map is built on
- **[Scan & secure a subnet →](/2.0/how-tos/scan-and-secure/)** — how fabric gear gets enrolled and swept in the first place
- **[SNMP monitoring →](/2.0/monitoring/snmp/)** — the agentless lane the LLDP walk belongs to
- **[Universal search →](/2.0/reference/universal-search/)** — resolve any identifier the map shows you
