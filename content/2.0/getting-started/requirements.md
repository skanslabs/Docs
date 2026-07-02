---
title: Requirements
eyebrow: Getting Started
description: Hardware, network, and access requirements before installing Skans.
---

Before you install, make sure the site meets these baseline requirements. Skans is designed to run on modest hardware inside an isolated network — you do **not** need internet access on the enclave.

## Appliance hardware

| Component | Minimum | Recommended |
| --- | --- | --- |
| CPU | 4 cores (x86-64) | 8+ cores |
| Memory | 8 GB | 16–32 GB |
| Storage | 128 GB SSD | 512 GB+ NVMe |
| Network | 1 × 1GbE | 2 × 1GbE (mgmt + data) |

::: note
Sizing scales with device count and how much telemetry you retain. For multi-site or thousands of devices, add **Edges** per site rather than growing one box — see the architecture overview in the [Introduction](/2.0/getting-started/introduction/).
:::

## Network

- A management subnet the appliance can own (DHCP/DNS can be delegated to Skans or run alongside).
- Switch support for **802.1X** and **RADIUS-assigned VLANs** if you want network access control (recommended for camera/IoT segments).
- Span/mirror or inline visibility for the segments you want monitored.

::: warning
Skans is **air-gap-first**. It does not require outbound internet, and for isolated enclaves you should keep it that way. Where a feature needs external data (e.g. CVE feeds), bring it in through a controlled, signed update — never by opening the enclave to the internet.
:::

## Access you'll need

- Physical or console access to the appliance for first boot.
- An administrator credential for the initial console login.
- For Windows endpoint management: rights to deploy the agent (GPO or a signed installer).

## Supported devices

Skans manages two lanes:

1. **Agent-managed** — Windows workstations and servers run the lightweight agent.
2. **Agentless** — cameras, IoT, OT, and network gear are managed over their native protocols (ONVIF, SNMP, vendor APIs, syslog).

Vendor coverage is provided by a signed, versioned **driver pack** that loads at runtime, so new device support ships without upgrading the whole platform.
