---
title: Device support matrix
eyebrow: Reference
description: Every device in a Skans enclave, across four capability lanes — manage (cert-deploy, rotate, NAC, SCEP), read (firmware), monitor/ingest (syslog, SNMP, EtherNet/IP, Modbus, config-backup), and notify. The manage table is generated from the pack itself, so it never drifts.
---

Skans covers a device across **four capability lanes** — and cert-deploy is only one of them. The most important devices in an enclave often *can't* hold a certificate at all; for those, the monitor/ingest lane is the entire story.

::: note
**The four lanes.** **Manage** (write to the device): cert-deploy, rotate the admin password, write 802.1X/NAC config, enroll via SCEP. **Read**: firmware version (for CVE-matching), neighbor/LLDP decode. **Monitor / ingest**: syslog → OpenSearch, SNMP poll, SNMP traps, EtherNet/IP, Modbus, config-backup. **Notify**: SMTP, webhook, SIEM-forward. The table below is the manage + read lanes plus config-backup, **generated directly from the signed pack** so it never drifts; the monitor/ingest lane is described in its own section after the table.
:::

::: warning
**Shipping is not the same as hardware-validated.** Eight cert-deploy drivers are proven end-to-end on lab hardware — Axis, 2N, Bosch, FS, Hanwha, ONVIF, Redfish, and UniFi. The rest were authored from each vendor's official management API and adversarially cross-checked, with hardware validation pending. Pilot an unvalidated driver on one device first. *(The syslog ingest lane was validated live on an emulated OPNsense firewall — device syslog → OpenSearch, correctly parsed and tagged.)*
:::

**118 device drivers** — 116 cert-deploy · 69 credential-rotate · 1 NAC/802.1X · 1 SCEP · 5 firmware-read · 21 config-backup.

| Vendor | Driver | Cert-deploy | Rotate creds | NAC (802.1X) | SCEP | Firmware | Config-backup |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `a10` | A10 | ✓ | ✓ |   |   |   |   |
| `acti` | ACTi | ✓ | ✓ |   |   |   |   |
| `advantech` | Advantech | ✓ |   |   |   |   |   |
| `apc` | APC | ✓ | ✓ |   |   |   |   |
| `arista` | Arista | ✓ | ✓ |   |   |   | ✓ |
| `arubacx` | Aruba CX | ✓ | ✓ |   |   |   |   |
| `audiocodes` | AudioCodes | ✓ |   |   |   |   |   |
| `avaya` | Avaya | ✓ | ✓ |   |   |   |   |
| `avigilon` | Avigilon | ✓ |   |   |   |   |   |
| `avigilonacm` | Avigilon ACM | ✓ |   |   |   |   |   |
| `axis` | Axis | ✓ | ✓ |   |   | ✓ |   |
| `barracuda` | Barracuda | ✓ |   |   |   |   |   |
| `beckhofftwincat` | Beckhoff TwinCAT | ✓ |   |   |   |   |   |
| `belimo` | Belimo | ✓ |   |   |   |   |   |
| `bosch` | Bosch | ✓ | ✓ |   |   | ✓ |   |
| `boschintrusion` | Bosch Intrusion | ✓ |   |   |   |   |   |
| `brocadeicx` | Brocade ICX | ✓ | ✓ |   |   |   | ✓ |
| `brother` | Brother | ✓ |   |   |   |   |   |
| `cambium` | Cambium | ✓ | ✓ |   |   |   |   |
| `canon` | Canon | ✓ |   |   |   |   |   |
| `checkpoint` | Check Point | ✓ |   |   |   |   |   |
| `ciscoasa` | Cisco ASA | ✓ | ✓ |   |   |   | ✓ |
| `ciscoftd` | Cisco FTD | ✓ |   |   |   |   |   |
| `ciscoios` | Cisco IOS (classic) |   |   |   | ✓ |   |   |
| `ciscoiosxe` | Cisco IOS-XE | ✓ | ✓ |   |   |   | ✓ |
| `cisconxos` | Cisco NX-OS | ✓ | ✓ |   |   |   | ✓ |
| `ciscowlc` | Cisco WLC | ✓ | ✓ |   |   |   | ✓ |
| `citrixadc` | Citrix ADC | ✓ | ✓ |   |   |   |   |
| `comware` | Comware | ✓ | ✓ |   |   |   | ✓ |
| `cradlepoint` | Cradlepoint | ✓ |   |   |   |   |   |
| `crestron` | Crestron | ✓ | ✓ |   |   |   |   |
| `cyberpower` | CyberPower | ✓ | ✓ |   |   |   |   |
| `dahua` | Dahua | ✓ | ✓ |   |   |   |   |
| `dellome` | Dell OpenManage | ✓ | ✓ |   |   |   |   |
| `dellos10` | Dell OS10 | ✓ | ✓ |   |   |   | ✓ |
| `dellpowerstore` | Dell PowerStore | ✓ | ✓ |   |   |   |   |
| `dellunity` | Dell Unity | ✓ | ✓ |   |   |   |   |
| `distech` | Distech Controls | ✓ | ✓ |   |   |   |   |
| `draytek` | DrayTek | ✓ |   |   |   |   |   |
| `eaton` | Eaton | ✓ |   |   |   |   |   |
| `edgeos` | EdgeOS | ✓ | ✓ |   |   |   | ✓ |
| `emersondeltav` | Emerson DeltaV | ✓ |   |   |   |   |   |
| `emersonpac` | Emerson PACSystems | ✓ |   |   |   |   |   |
| `extreme` | Extreme | ✓ | ✓ |   |   |   | ✓ |
| `f5` | F5 | ✓ | ✓ |   |   |   |   |
| `fortinet` | Fortinet | ✓ |   |   |   |   | ✓ |
| `fs` | FS | ✓ | ✓ |   |   | ✓ |   |
| `geovision` | GeoVision | ✓ |   |   |   |   |   |
| `grandstream` | Grandstream | ✓ | ✓ |   |   |   |   |
| `hanwha` | Hanwha | ✓ | ✓ |   |   | ✓ |   |
| `hikvision` | Hikvision | ✓ | ✓ |   |   |   |   |
| `hirschmann` | Hirschmann | ✓ | ✓ |   |   |   | ✓ |
| `hitachivsp` | Hitachi VSP | ✓ | ✓ |   |   |   |   |
| `honeywell` | Honeywell | ✓ |   |   |   |   |   |
| `hpealletra` | HPE Alletra 5000/6000 & Nimble (NimbleOS) | ✓ | ✓ |   |   |   |   |
| `hpeoneview` | HPE OneView | ✓ | ✓ |   |   |   |   |
| `hpeprimera` | HPE Primera | ✓ |   |   |   |   |   |
| `hpprinter` | HP Printer | ✓ |   |   |   |   |   |
| `huawei` | Huawei | ✓ | ✓ |   |   |   | ✓ |
| `ibmstorage` | IBM Storage | ✓ | ✓ |   |   |   |   |
| `ifm` | ifm | ✓ | ✓ |   |   |   |   |
| `infinidat` | Infinidat | ✓ | ✓ |   |   |   |   |
| `ipro` | i-PRO | ✓ | ✓ |   |   |   |   |
| `jcimetasys` | JCI Metasys | ✓ |   |   |   |   |   |
| `juniper` | Juniper | ✓ |   |   |   |   | ✓ |
| `kemp` | Kemp | ✓ | ✓ |   |   |   |   |
| `konica` | Konica Minolta | ✓ |   |   |   |   |   |
| `lenels2netbox` | LenelS2 NetBox | ✓ |   |   |   |   |   |
| `mercury` | Mercury Security | ✓ |   |   |   |   |   |
| `mikrotik` | MikroTik | ✓ | ✓ |   |   |   | ✓ |
| `mitsubishimelsec` | Mitsubishi MELSEC | ✓ |   |   |   |   |   |
| `moxa` | Moxa | ✓ | ✓ |   |   |   |   |
| `netapp` | NetApp | ✓ | ✓ |   |   |   |   |
| `netgear` | Netgear | ✓ | ✓ |   |   |   | ✓ |
| `nutanix` | Nutanix | ✓ |   |   |   |   |   |
| `omronnx` | Omron NX | ✓ |   |   |   |   |   |
| `onvif` | ONVIF | ✓ | ✓ |   |   |   |   |
| `opengear` | Opengear | ✓ | ✓ |   |   |   |   |
| `opnsense` | OPNsense | ✓ |   |   |   |   |   |
| `opto22` | Opto 22 | ✓ |   |   |   |   |   |
| `paloalto` | Palo Alto | ✓ |   |   |   |   | ✓ |
| `peplink` | Peplink | ✓ |   |   |   |   |   |
| `pfsense` | pfSense | ✓ | ✓ |   |   |   |   |
| `phoenixplcnext` | Phoenix PLCnext | ✓ | ✓ |   |   |   |   |
| `poly` | Poly | ✓ |   |   |   |   |   |
| `powerscale` | Dell PowerScale | ✓ | ✓ |   |   |   |   |
| `proxmox` | Proxmox | ✓ | ✓ |   |   |   |   |
| `purestorage` | Pure Storage | ✓ | ✓ |   |   |   |   |
| `qnap` | QNAP | ✓ |   |   |   |   |   |
| `radware` | Radware | ✓ | ✓ |   |   |   |   |
| `raritan` | Raritan | ✓ | ✓ |   |   |   |   |
| `redfish` | Redfish (iDRAC/iLO) | ✓ | ✓ |   |   |   |   |
| `ricoh` | Ricoh | ✓ |   |   |   |   |   |
| `rockwellstratix` | Rockwell Stratix | ✓ | ✓ |   |   |   |   |
| `ruckus` | Ruckus | ✓ |   |   |   |   | ✓ |
| `servertech` | Server Technology | ✓ | ✓ |   |   |   |   |
| `siemensdesigo` | Siemens Desigo | ✓ |   |   |   |   |   |
| `siemenss7` | Siemens S7 | ✓ | ✓ |   |   |   |   |
| `siemenss71200` | Siemens S7-1200 | ✓ | ✓ |   |   |   |   |
| `sonicwall` | SonicWall | ✓ |   |   |   |   | ✓ |
| `sophos` | Sophos | ✓ |   |   |   |   |   |
| `synology` | Synology | ✓ | ✓ |   |   |   |   |
| `tridium` | Tridium Niagara | ✓ |   |   |   |   |   |
| `tripplite` | Tripp Lite | ✓ | ✓ |   |   |   |   |
| `truenas` | TrueNAS | ✓ | ✓ |   |   |   |   |
| `twon` | 2N | ✓ |   |   |   | ✓ |   |
| `unifi` | UniFi | ✓ |   | ✓ |   |   | ✓ |
| `uniview` | Uniview | ✓ | ✓ |   |   |   |   |
| `vertiv` | Vertiv | ✓ | ✓ |   |   |   |   |
| `vivotek` | Vivotek |   | ✓ |   |   |   |   |
| `vmwareesxi` | VMware ESXi | ✓ | ✓ |   |   |   |   |
| `vmwarensx` | VMware NSX | ✓ | ✓ |   |   |   |   |
| `vmwarevcenter` | VMware vCenter | ✓ |   |   |   |   |   |
| `wago` | WAGO | ✓ | ✓ |   |   |   |   |
| `watchguard` | WatchGuard | ✓ |   |   |   |   |   |
| `xerox` | Xerox | ✓ |   |   |   |   |   |
| `yealink` | Yealink | ✓ |   |   |   |   |   |
| `zyxel` | Zyxel | ✓ | ✓ |   |   |   | ✓ |

**Manage/read key** — *Cert-deploy*: issue + install + bind a TLS cert. *Rotate*: change the device admin password on a
schedule ("LAPS for cameras"). *NAC*: write RADIUS + 802.1X/MAB to the fabric. *SCEP*: on-device CSR enrolment. *Firmware*:
read the running version for CVE-matching. *Config-backup*: pull the running-config over SSH, versioned + change-detected.

---

## Monitor / ingest lane — the OT/IoT coverage the table above can't show

The devices that matter most in an enclave — PLCs, UPS/PDUs, sensors, meters, controllers, cameras — often **can never
hold a certificate**, so they are blank in the manage table. That is not a gap: it is the boundary between the manage lane
and the **monitor/ingest lane**, which is a separate collector process (`Skans.Collector`). These collectors are **built**:

| Collector | What it ingests | Landing place |
|---|---|:--|
| **Syslog** (RFC 3164/5424) | any syslog-capable device — firewalls, switches, cameras, gateways | `skans-netlog-*` in OpenSearch |
| **SNMP poll** (v2c + v3) | system/IF-MIB/HOST-RESOURCES + vendor enterprise OIDs, auto-matched by `sysObjectID` | `skans-metrics` |
| **SNMP traps** (udp/162) | device-pushed events (tamper, link, disk-fail, reboot) | `skans-netlog-*` |
| **EtherNet/IP** (CIP List-Identity) | PLC vendor/product/firmware + run/fault state (read-only) | `skans-metrics` + `skans-inventory` |
| **Modbus/TCP** (Read Device ID) | Modbus device reach + vendor/product (read-only, never writes) | `skans-metrics` |
| **Config-backup** (SSH show-run) | running-config, versioned + change-detected (the column above) | encrypted store + drift report |

Every active collector is OT-safe: per-target maintenance windows, poll rate-limiting, source-IP allowlists, read-only probing.

**Coverage reality:** the SNMP profile pack carries **~484 vendor enterprise profiles**; the large majority of them —
power/UPS (Vertiv, Eltek), environmental (Stulz, Carel, AKCP), industrial/OT (Moxa, Hirschmann, ABB, Schneider), optical,
wireless, storage, VoIP, time/GPS — have **no cert driver at all**. For them, SNMP + syslog is the entire Skans coverage,
and it is largely zero-touch (auto-matched by `sysObjectID`, with a generic floor for any SNMP device).

**Honest built-vs-designed:** syslog, SNMP poll/trap, EtherNet/IP, Modbus, config-backup, LLDP topology, and the notify
lane (SMTP/webhook/SIEM-forward) are **built**. **BACnet telemetry, OPC-UA telemetry, and ICMP-as-a-collector are
designed-not-built** — BACnet/SC and OPC-UA exist today only as *manage-lane* certificate issuance, not monitoring.

*Neighbor-discovery decode (LLDP/CDP/EDP/FDP/NDP/UBNT) is a pack-level READ capability (a shared decoder), not per-driver.*
