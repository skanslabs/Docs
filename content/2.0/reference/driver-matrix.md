---
title: Device support matrix
eyebrow: Reference
description: Every device in a Skans enclave, across four capability lanes — manage (cert-deploy, rotate, NAC, SCEP), read (firmware), monitor/ingest (syslog, SNMP, EtherNet/IP, Modbus, config-backup), and notify. The manage table is generated from the pack itself, so it never drifts.
---

Skans covers a device across **four capability lanes** — and cert-deploy is only one of them. The most important devices in an enclave often *can't* hold a certificate at all; for those, the monitor/ingest lane is the entire story.

::: note
**The four lanes.** **Manage** (write to the device): cert-deploy, rotate the admin password, write 802.1X/NAC config, enroll via SCEP. **Read**: firmware version (for CVE-matching), neighbor/LLDP decode. **Monitor / ingest**: syslog → OpenSearch, SNMP poll, SNMP traps, EtherNet/IP, Modbus, config-backup. **Notify**: SMTP, webhook, SIEM-forward. The table below is the manage + read lanes plus config-backup, **generated directly from the signed pack** so it never drifts. The monitor/ingest lane isn't a per-vendor column because it's **per-protocol** — syslog, SNMP, EtherNet/IP, and Modbus work with *any* device that speaks them, not a specific driver — so it's described in its own section after the table, with dedicated pages: **[Syslog ingestion](/2.0/monitoring/syslog/)**, **[SNMP monitoring](/2.0/monitoring/snmp/)**, and **[Industrial protocols (OT/ICS)](/2.0/monitoring/industrial-protocols/)**.
:::

::: warning
**Shipping is not the same as validated.** Eight cert-deploy drivers are proven on **real hardware** — Axis, 2N, Bosch, FS, Hanwha, ONVIF, Redfish, and UniFi. Another eight are proven **end-to-end on emulated devices** (Cisco CML / EVE-NG): the Cisco fleet — Catalyst 9000v switches, ASAv, IOS-XE routers, Nexus 9300v, and the Catalyst 9800-CL wireless controller — plus Aruba CX. The rest were authored from each vendor's official management API and adversarially cross-checked, still **device-pending**. See the [Driver validation status](/2.0/reference/driver-validation/) page for the exact per-driver × per-lane proof; pilot a spec-verified driver on one device first. *(The syslog ingest lane was also validated live on an emulated OPNsense firewall.)*
:::

**122 device drivers** — 120 cert-deploy · 75 credential-rotate · 10 NAC/802.1X · 1 SCEP · 14 firmware-read · 26 config-backup · 1 AP-LSC · 1 config-read (API) · 1 monitor-push.

> **A ✓ means the driver *implements* that lane** — its declared capability, read straight from the signed pack. It is **not** a claim that the lane has been validated on a device. For what's actually been **proven** per driver — hardware, emulation, or still spec-verified — see **[Driver validation status](/2.0/reference/driver-validation/)**, where most cells are honestly still 📋 spec-verified.

| Vendor | Driver | Cert-deploy | Rotate creds | NAC (802.1X) | SCEP | Firmware | Config-backup | AP-LSC | Config-read (API) | Monitor-push |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `a10` | A10 | ✓ | ✓ |   |   |   |   |   |   |   |
| `acti` | ACTi | ✓ | ✓ |   |   |   |   |   |   |   |
| `advantech` | Advantech | ✓ |   |   |   |   |   |   |   |   |
| `apc` | APC | ✓ | ✓ |   |   |   |   |   |   |   |
| `arista` | Arista | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `arubacx` | Aruba CX | ✓ | ✓ | ✓ |   |   | ✓ |   |   |   |
| `audiocodes` | AudioCodes | ✓ |   |   |   |   |   |   |   |   |
| `avaya` | Avaya | ✓ | ✓ |   |   |   |   |   |   |   |
| `avigilon` | Avigilon | ✓ |   |   |   |   |   |   |   |   |
| `avigilonacm` | Avigilon ACM | ✓ |   |   |   |   |   |   |   |   |
| `axis` | Axis | ✓ | ✓ |   |   | ✓ |   |   |   |   |
| `barracuda` | Barracuda | ✓ |   |   |   |   |   |   |   |   |
| `beckhofftwincat` | Beckhoff TwinCAT | ✓ |   |   |   |   |   |   |   |   |
| `belimo` | Belimo | ✓ |   |   |   |   |   |   |   |   |
| `bosch` | Bosch | ✓ | ✓ |   |   | ✓ |   |   |   |   |
| `boschintrusion` | Bosch Intrusion | ✓ |   |   |   |   |   |   |   |   |
| `brocadeicx` | Brocade ICX | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `brother` | Brother | ✓ |   |   |   |   |   |   |   |   |
| `cambium` | Cambium | ✓ | ✓ |   |   |   |   |   |   |   |
| `canon` | Canon | ✓ |   |   |   |   |   |   |   |   |
| `checkpoint` | Check Point | ✓ |   |   |   |   |   |   |   |   |
| `cisco9200` | Cisco Catalyst 9200 | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `cisco9300` | Cisco Catalyst 9300 | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `cisco9500` | Cisco Catalyst 9500 | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `ciscoasa` | Cisco ASA | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `ciscoftd` | Cisco FTD | ✓ |   |   |   | ✓ |   |   | ✓ | ✓ |
| `ciscoios` | Cisco IOS (classic) |   |   |   | ✓ |   |   |   |   |   |
| `ciscoiosxe` | Cisco IOS-XE | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `ciscoiosxr` | Cisco IOS-XR | ✓ |   |   |   |   | ✓ |   |   |   |
| `cisconxos` | Cisco NX-OS | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `ciscowlc` | Cisco WLC | ✓ | ✓ |   |   |   | ✓ | ✓ |   |   |
| `citrixadc` | Citrix ADC | ✓ | ✓ |   |   |   |   |   |   |   |
| `comware` | Comware | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `cradlepoint` | Cradlepoint | ✓ |   |   |   |   |   |   |   |   |
| `crestron` | Crestron | ✓ | ✓ |   |   |   |   |   |   |   |
| `cyberpower` | CyberPower | ✓ | ✓ |   |   |   |   |   |   |   |
| `dahua` | Dahua | ✓ | ✓ |   |   |   |   |   |   |   |
| `dellome` | Dell OpenManage | ✓ | ✓ |   |   |   |   |   |   |   |
| `dellos10` | Dell OS10 | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `dellpowerstore` | Dell PowerStore | ✓ | ✓ |   |   |   |   |   |   |   |
| `dellunity` | Dell Unity | ✓ | ✓ |   |   |   |   |   |   |   |
| `distech` | Distech Controls | ✓ | ✓ |   |   |   |   |   |   |   |
| `draytek` | DrayTek | ✓ |   |   |   |   |   |   |   |   |
| `eaton` | Eaton | ✓ |   |   |   |   |   |   |   |   |
| `edgeos` | EdgeOS | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `emersondeltav` | Emerson DeltaV | ✓ |   |   |   |   |   |   |   |   |
| `emersonpac` | Emerson PACSystems | ✓ |   |   |   |   |   |   |   |   |
| `extreme` | Extreme | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `f5` | F5 | ✓ | ✓ |   |   |   |   |   |   |   |
| `fortinet` | Fortinet | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `fs` | FS | ✓ | ✓ |   |   | ✓ |   |   |   |   |
| `geovision` | GeoVision | ✓ |   |   |   |   |   |   |   |   |
| `grandstream` | Grandstream | ✓ | ✓ |   |   |   |   |   |   |   |
| `hanwha` | Hanwha | ✓ | ✓ |   |   | ✓ |   |   |   |   |
| `hikvision` | Hikvision | ✓ | ✓ |   |   |   |   |   |   |   |
| `hirschmann` | Hirschmann | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `hitachivsp` | Hitachi VSP | ✓ | ✓ |   |   |   |   |   |   |   |
| `honeywell` | Honeywell | ✓ |   |   |   |   |   |   |   |   |
| `hpealletra` | HPE Alletra 5000/6000 & Nimble (NimbleOS) | ✓ | ✓ |   |   |   |   |   |   |   |
| `hpeoneview` | HPE OneView | ✓ | ✓ |   |   |   |   |   |   |   |
| `hpeprimera` | HPE Primera | ✓ |   |   |   |   |   |   |   |   |
| `hpprinter` | HP Printer | ✓ |   |   |   |   |   |   |   |   |
| `huawei` | Huawei | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `ibmstorage` | IBM Storage | ✓ | ✓ |   |   |   |   |   |   |   |
| `ifm` | ifm | ✓ | ✓ |   |   |   |   |   |   |   |
| `infinidat` | Infinidat | ✓ | ✓ |   |   |   |   |   |   |   |
| `ipro` | i-PRO | ✓ | ✓ |   |   |   |   |   |   |   |
| `jcimetasys` | JCI Metasys | ✓ |   |   |   |   |   |   |   |   |
| `juniper` | Juniper | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `kemp` | Kemp | ✓ | ✓ |   |   |   |   |   |   |   |
| `konica` | Konica Minolta | ✓ |   |   |   |   |   |   |   |   |
| `lenels2netbox` | LenelS2 NetBox | ✓ |   |   |   |   |   |   |   |   |
| `mercury` | Mercury Security | ✓ |   |   |   |   |   |   |   |   |
| `mikrotik` | MikroTik | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `mitsubishimelsec` | Mitsubishi MELSEC | ✓ |   |   |   |   |   |   |   |   |
| `moxa` | Moxa | ✓ | ✓ |   |   |   |   |   |   |   |
| `netapp` | NetApp | ✓ | ✓ |   |   |   |   |   |   |   |
| `netgear` | Netgear | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| `nutanix` | Nutanix | ✓ |   |   |   |   |   |   |   |   |
| `omronnx` | Omron NX | ✓ |   |   |   |   |   |   |   |   |
| `onvif` | ONVIF | ✓ | ✓ |   |   |   |   |   |   |   |
| `opengear` | Opengear | ✓ | ✓ |   |   |   |   |   |   |   |
| `opnsense` | OPNsense | ✓ |   |   |   |   |   |   |   |   |
| `opto22` | Opto 22 | ✓ |   |   |   |   |   |   |   |   |
| `paloalto` | Palo Alto | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   |   |
| `peplink` | Peplink | ✓ |   |   |   |   |   |   |   |   |
| `pfsense` | pfSense | ✓ | ✓ |   |   |   |   |   |   |   |
| `phoenixplcnext` | Phoenix PLCnext | ✓ | ✓ |   |   |   |   |   |   |   |
| `poly` | Poly | ✓ |   |   |   |   |   |   |   |   |
| `powerscale` | Dell PowerScale | ✓ | ✓ |   |   |   |   |   |   |   |
| `proxmox` | Proxmox | ✓ | ✓ |   |   |   |   |   |   |   |
| `purestorage` | Pure Storage | ✓ | ✓ |   |   |   |   |   |   |   |
| `qnap` | QNAP | ✓ |   |   |   |   |   |   |   |   |
| `radware` | Radware | ✓ | ✓ |   |   |   |   |   |   |   |
| `raritan` | Raritan | ✓ | ✓ |   |   |   |   |   |   |   |
| `redfish` | Redfish (iDRAC/iLO) | ✓ | ✓ |   |   |   |   |   |   |   |
| `ricoh` | Ricoh | ✓ |   |   |   |   |   |   |   |   |
| `rockwellstratix` | Rockwell Stratix | ✓ | ✓ |   |   |   |   |   |   |   |
| `ruckus` | Ruckus | ✓ |   |   |   |   | ✓ |   |   |   |
| `servertech` | Server Technology | ✓ | ✓ |   |   |   |   |   |   |   |
| `siemensdesigo` | Siemens Desigo | ✓ |   |   |   |   |   |   |   |   |
| `siemenss7` | Siemens S7 | ✓ | ✓ |   |   |   |   |   |   |   |
| `siemenss71200` | Siemens S7-1200 | ✓ | ✓ |   |   |   |   |   |   |   |
| `sonicwall` | SonicWall | ✓ |   |   |   |   | ✓ |   |   |   |
| `sophos` | Sophos | ✓ |   |   |   |   |   |   |   |   |
| `synology` | Synology | ✓ | ✓ |   |   |   |   |   |   |   |
| `tridium` | Tridium Niagara | ✓ |   |   |   |   |   |   |   |   |
| `tripplite` | Tripp Lite | ✓ | ✓ |   |   |   |   |   |   |   |
| `truenas` | TrueNAS | ✓ | ✓ |   |   |   |   |   |   |   |
| `twon` | 2N | ✓ |   |   |   | ✓ |   |   |   |   |
| `unifi` | UniFi | ✓ |   | ✓ |   |   | ✓ |   |   |   |
| `uniview` | Uniview | ✓ | ✓ |   |   |   |   |   |   |   |
| `vertiv` | Vertiv | ✓ | ✓ |   |   |   |   |   |   |   |
| `vivotek` | Vivotek |   | ✓ |   |   |   |   |   |   |   |
| `vmwareesxi` | VMware ESXi | ✓ | ✓ |   |   |   |   |   |   |   |
| `vmwarensx` | VMware NSX | ✓ | ✓ |   |   |   |   |   |   |   |
| `vmwarevcenter` | VMware vCenter | ✓ |   |   |   |   |   |   |   |   |
| `wago` | WAGO | ✓ | ✓ |   |   |   |   |   |   |   |
| `watchguard` | WatchGuard | ✓ |   |   |   |   |   |   |   |   |
| `xerox` | Xerox | ✓ |   |   |   |   |   |   |   |   |
| `yealink` | Yealink | ✓ |   |   |   |   |   |   |   |   |
| `zyxel` | Zyxel | ✓ | ✓ |   |   |   | ✓ |   |   |   |

**Manage/read key** — *Cert-deploy*: issue + install + bind a TLS cert. *Rotate*: change the device admin password on a
schedule ("LAPS for cameras"). *NAC*: write RADIUS + 802.1X/MAB to the fabric. *SCEP*: on-device CSR enrolment. *Firmware*:
read the running version for CVE-matching. *Config-backup*: pull the running-config over SSH, versioned + change-detected.
*AP-LSC*: provision locally-significant certs onto wireless APs through the controller. *Config-read (API)*: config snapshot
over the management API (API-managed gear with no SSH show-run). *Monitor-push*: at enrol the driver configures the device
itself to send syslog + SNMP at the Skans collector. Some drivers carry additional lanes gated behind per-vendor env flags
(off by default); each cell reflects the capability set advertised by the running build.

A few platforms accept a certificate but expose **no API to bind it** to their web service — **OPNsense** is the notable one
(upstream limitation). Skans imports the cert and reports the mismatch honestly; the one-time selection is manual (System →
Settings → Administration → SSL Certificate). See [Troubleshooting → certificate mismatch](/2.0/reference/troubleshooting/).
Certificates live **on the device**, so a factory-reset or replaced unit shows a mismatch until you **re-enroll** it.

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

Each has its own page: **[Syslog ingestion](/2.0/monitoring/syslog/)**, **[SNMP monitoring](/2.0/monitoring/snmp/)** (poll + traps), and **[Industrial protocols (OT/ICS)](/2.0/monitoring/industrial-protocols/)** (EtherNet/IP + Modbus). Config-backup and off-box archiving are in **[Backup & recovery](/2.0/how-tos/backup/)**.

**Coverage reality:** the SNMP profile pack carries **~484 vendor enterprise profiles**; the large majority of them —
power/UPS (Vertiv, Eltek), environmental (Stulz, Carel, AKCP), industrial/OT (Moxa, Hirschmann, ABB, Schneider), optical,
wireless, storage, VoIP, time/GPS — have **no cert driver at all**. For them, SNMP + syslog is the entire Skans coverage,
and it is largely zero-touch (auto-matched by `sysObjectID`, with a generic floor for any SNMP device).

**Honest built-vs-designed:** syslog, SNMP poll/trap, EtherNet/IP, Modbus, config-backup, LLDP topology, and the notify
lane (SMTP/webhook/SIEM-forward) are **built**. **BACnet telemetry, OPC-UA telemetry, and ICMP-as-a-collector are
designed-not-built** — BACnet/SC and OPC-UA exist today only as *manage-lane* certificate issuance, not monitoring.

*Neighbor-discovery decode (LLDP/CDP/EDP/FDP/NDP/UBNT) is a pack-level READ capability (a shared decoder), not per-driver.*
