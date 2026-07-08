---
title: Device support matrix
eyebrow: Reference
description: Every driver in the Skans driver pack and exactly what it can do — deploy a certificate, rotate the admin password, write 802.1X/NAC config, enroll via SCEP, or read firmware. Generated from the pack itself, so it never drifts.
---

Skans manages devices through **vendor drivers** in the signed [driver pack](/2.0/concepts/driver-pack/). This page lists every driver and which capabilities it carries. It is **generated directly from the pack** — each row is the driver's own declared capability set, so the table never drifts from what actually ships.

::: note
**What the capabilities mean.** *Cert-deploy* — issue, install, and bind a TLS certificate. *Rotate creds* — change the device admin password on a schedule ("LAPS for cameras"). *NAC* — write RADIUS + 802.1X/MAB configuration to the fabric. *SCEP* — on-device certificate enrollment, where the private key never leaves the device. *Firmware* — read the running firmware version for inventory and CVE-matching.
:::

::: warning
**Shipping is not the same as hardware-validated.** Eight drivers are proven end-to-end on lab hardware — Axis, 2N, Bosch, Uniview/FS, Hanwha, ONVIF, Redfish, and UniFi. The rest were authored from each vendor's official management API and adversarially cross-checked, with hardware validation pending. Pilot an unvalidated driver on one device first.
:::

**118 device drivers** — 116 cert-deploy · 69 credential-rotate · 1 NAC / 802.1X write · 1 SCEP enrol · 5 firmware-read.

| Vendor | Driver | Cert-deploy | Rotate creds | NAC (802.1X) | SCEP | Firmware read |
|---|---|:--:|:--:|:--:|:--:|:--:|
| `a10` | A10 | ✓ | ✓ |   |   |   |
| `acti` | ACTi | ✓ | ✓ |   |   |   |
| `advantech` | Advantech | ✓ |   |   |   |   |
| `apc` | APC | ✓ | ✓ |   |   |   |
| `arista` | Arista | ✓ | ✓ |   |   |   |
| `arubacx` | Aruba CX | ✓ | ✓ |   |   |   |
| `audiocodes` | AudioCodes | ✓ |   |   |   |   |
| `avaya` | Avaya | ✓ | ✓ |   |   |   |
| `avigilon` | Avigilon | ✓ |   |   |   |   |
| `avigilonacm` | Avigilon ACM | ✓ |   |   |   |   |
| `axis` | Axis | ✓ | ✓ |   |   | ✓ |
| `barracuda` | Barracuda | ✓ |   |   |   |   |
| `beckhofftwincat` | Beckhoff TwinCAT | ✓ |   |   |   |   |
| `belimo` | Belimo | ✓ |   |   |   |   |
| `bosch` | Bosch | ✓ | ✓ |   |   | ✓ |
| `boschintrusion` | Bosch Intrusion | ✓ |   |   |   |   |
| `brocadeicx` | Brocade ICX | ✓ | ✓ |   |   |   |
| `brother` | Brother | ✓ |   |   |   |   |
| `cambium` | Cambium | ✓ | ✓ |   |   |   |
| `canon` | Canon | ✓ |   |   |   |   |
| `checkpoint` | Check Point | ✓ |   |   |   |   |
| `ciscoasa` | Cisco ASA | ✓ | ✓ |   |   |   |
| `ciscoftd` | Cisco FTD | ✓ |   |   |   |   |
| `ciscoios` | Cisco IOS (classic) |   |   |   | ✓ |   |
| `ciscoiosxe` | Cisco IOS-XE | ✓ | ✓ |   |   |   |
| `cisconxos` | Cisco NX-OS | ✓ | ✓ |   |   |   |
| `ciscowlc` | Cisco WLC | ✓ | ✓ |   |   |   |
| `citrixadc` | Citrix ADC | ✓ | ✓ |   |   |   |
| `comware` | Comware | ✓ | ✓ |   |   |   |
| `cradlepoint` | Cradlepoint | ✓ |   |   |   |   |
| `crestron` | Crestron | ✓ | ✓ |   |   |   |
| `cyberpower` | CyberPower | ✓ | ✓ |   |   |   |
| `dahua` | Dahua | ✓ | ✓ |   |   |   |
| `dellome` | Dell OpenManage | ✓ | ✓ |   |   |   |
| `dellos10` | Dell OS10 | ✓ | ✓ |   |   |   |
| `dellpowerstore` | Dell PowerStore | ✓ | ✓ |   |   |   |
| `dellunity` | Dell Unity | ✓ | ✓ |   |   |   |
| `distech` | Distech Controls | ✓ | ✓ |   |   |   |
| `draytek` | DrayTek | ✓ |   |   |   |   |
| `eaton` | Eaton | ✓ |   |   |   |   |
| `edgeos` | EdgeOS | ✓ | ✓ |   |   |   |
| `emersondeltav` | Emerson DeltaV | ✓ |   |   |   |   |
| `emersonpac` | Emerson PACSystems | ✓ |   |   |   |   |
| `extreme` | Extreme | ✓ | ✓ |   |   |   |
| `f5` | F5 | ✓ | ✓ |   |   |   |
| `fortinet` | Fortinet | ✓ |   |   |   |   |
| `fs` | FS | ✓ | ✓ |   |   | ✓ |
| `geovision` | GeoVision | ✓ |   |   |   |   |
| `grandstream` | Grandstream | ✓ | ✓ |   |   |   |
| `hanwha` | Hanwha | ✓ | ✓ |   |   | ✓ |
| `hikvision` | Hikvision | ✓ | ✓ |   |   |   |
| `hirschmann` | Hirschmann | ✓ | ✓ |   |   |   |
| `hitachivsp` | Hitachi VSP | ✓ | ✓ |   |   |   |
| `honeywell` | Honeywell | ✓ |   |   |   |   |
| `hpealletra` | HPE Alletra 5000/6000 & Nimble (NimbleOS) | ✓ | ✓ |   |   |   |
| `hpeoneview` | HPE OneView | ✓ | ✓ |   |   |   |
| `hpeprimera` | HPE Primera | ✓ |   |   |   |   |
| `hpprinter` | HP Printer | ✓ |   |   |   |   |
| `huawei` | Huawei | ✓ | ✓ |   |   |   |
| `ibmstorage` | IBM Storage | ✓ | ✓ |   |   |   |
| `ifm` | ifm | ✓ | ✓ |   |   |   |
| `infinidat` | Infinidat | ✓ | ✓ |   |   |   |
| `ipro` | i-PRO | ✓ | ✓ |   |   |   |
| `jcimetasys` | JCI Metasys | ✓ |   |   |   |   |
| `juniper` | Juniper | ✓ |   |   |   |   |
| `kemp` | Kemp | ✓ | ✓ |   |   |   |
| `konica` | Konica Minolta | ✓ |   |   |   |   |
| `lenels2netbox` | LenelS2 NetBox | ✓ |   |   |   |   |
| `mercury` | Mercury Security | ✓ |   |   |   |   |
| `mikrotik` | MikroTik | ✓ | ✓ |   |   |   |
| `mitsubishimelsec` | Mitsubishi MELSEC | ✓ |   |   |   |   |
| `moxa` | Moxa | ✓ | ✓ |   |   |   |
| `netapp` | NetApp | ✓ | ✓ |   |   |   |
| `netgear` | Netgear | ✓ | ✓ |   |   |   |
| `nutanix` | Nutanix | ✓ |   |   |   |   |
| `omronnx` | Omron NX | ✓ |   |   |   |   |
| `onvif` | ONVIF | ✓ | ✓ |   |   |   |
| `opengear` | Opengear | ✓ | ✓ |   |   |   |
| `opnsense` | OPNsense | ✓ |   |   |   |   |
| `opto22` | Opto 22 | ✓ |   |   |   |   |
| `paloalto` | Palo Alto | ✓ |   |   |   |   |
| `peplink` | Peplink | ✓ |   |   |   |   |
| `pfsense` | pfSense | ✓ | ✓ |   |   |   |
| `phoenixplcnext` | Phoenix PLCnext | ✓ | ✓ |   |   |   |
| `poly` | Poly | ✓ |   |   |   |   |
| `powerscale` | Dell PowerScale | ✓ | ✓ |   |   |   |
| `proxmox` | Proxmox | ✓ | ✓ |   |   |   |
| `purestorage` | Pure Storage | ✓ | ✓ |   |   |   |
| `qnap` | QNAP | ✓ |   |   |   |   |
| `radware` | Radware | ✓ | ✓ |   |   |   |
| `raritan` | Raritan | ✓ | ✓ |   |   |   |
| `redfish` | Redfish (iDRAC/iLO) | ✓ | ✓ |   |   |   |
| `ricoh` | Ricoh | ✓ |   |   |   |   |
| `rockwellstratix` | Rockwell Stratix | ✓ | ✓ |   |   |   |
| `ruckus` | Ruckus | ✓ |   |   |   |   |
| `servertech` | Server Technology | ✓ | ✓ |   |   |   |
| `siemensdesigo` | Siemens Desigo | ✓ |   |   |   |   |
| `siemenss7` | Siemens S7 | ✓ | ✓ |   |   |   |
| `siemenss71200` | Siemens S7-1200 | ✓ | ✓ |   |   |   |
| `sonicwall` | SonicWall | ✓ |   |   |   |   |
| `sophos` | Sophos | ✓ |   |   |   |   |
| `synology` | Synology | ✓ | ✓ |   |   |   |
| `tridium` | Tridium Niagara | ✓ |   |   |   |   |
| `tripplite` | Tripp Lite | ✓ | ✓ |   |   |   |
| `truenas` | TrueNAS | ✓ | ✓ |   |   |   |
| `twon` | 2N | ✓ |   |   |   | ✓ |
| `unifi` | UniFi | ✓ |   | ✓ |   |   |
| `uniview` | Uniview | ✓ | ✓ |   |   |   |
| `vertiv` | Vertiv | ✓ | ✓ |   |   |   |
| `vivotek` | Vivotek |   | ✓ |   |   |   |
| `vmwareesxi` | VMware ESXi | ✓ | ✓ |   |   |   |
| `vmwarensx` | VMware NSX | ✓ | ✓ |   |   |   |
| `vmwarevcenter` | VMware vCenter | ✓ |   |   |   |   |
| `wago` | WAGO | ✓ | ✓ |   |   |   |
| `watchguard` | WatchGuard | ✓ |   |   |   |   |
| `xerox` | Xerox | ✓ |   |   |   |   |
| `yealink` | Yealink | ✓ |   |   |   |   |
| `zyxel` | Zyxel | ✓ | ✓ |   |   |   |

**Capability key** — *Cert-deploy*: issue + install + bind a TLS cert (the key-push model). *Rotate creds*: change the
device admin password on a schedule ("LAPS for cameras"). *NAC*: write RADIUS + 802.1X/MAB config to the fabric.
*SCEP*: on-device CSR enrolment (the private key never leaves the device) instead of key-push. *Firmware read*: read the
running firmware version for inventory + CVE-matching.

*Neighbor-discovery decode (LLDP / CDP / EDP / FDP / NDP / UBNT) is a **pack-level** capability — a shared decoder in
the discovery plane, not a per-driver one — so it is not a column above.*
