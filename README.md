# openwrt-usbip-wr840n

USB/IP **client** + LuCI page for TP-Link TL-WR840N v4 on OpenWrt.

| | |
|---|---|
| Release | `v22.03.7` (pinned) |
| Kernel | `5.10.221` |
| Arch | `mipsel_24kc` (ramips/mt76x8) |

The router has no USB port; it uses the virtual host controller `vhci-hcd`
(`kmod-usbip-client`) to import devices exported by a remote USB/IP server.
Drivers for the imported device (e.g. `kmod-usb-storage`) are added separately.

> OpenWrt 22.03 is end-of-life. This target exists only for USB/IP kmod
> compatibility; it is not a recommendation for a general-purpose router.
> kmods from other kernel versions will not load — do not mix them.

## Contents
- `luci-app-usbip/` — arch-independent package: LuCI view (JS), rpcd ACL,
  `/usr/libexec/usbip-ctl` (validated backend), init script, UCI config `/etc/config/usbip`.
- `scripts/check-size.sh` — firmware size gate.
- `scripts/build-ipk.sh` — builds the arch-independent ipk without the SDK.
- `.github/workflows/build.yml` — builds the ipk, then a full image with ImageBuilder (usbip/kmods come from the official 22.03.7 repo).

## Install on a running router (22.03.7 only)
```sh
opkg update
opkg install kmod-usbip-client usbip-client luci-app-usbip_*.ipk
/etc/init.d/rpcd restart && /etc/init.d/usbip enable
```
## Security
LuCI can only run `/usr/libexec/usbip-ctl` (rpcd ACL). Host, bus ID and port are
validated by regex; no `eval`, no shell interpolation. Note: USB/IP is unencrypted —
use it only on a trusted LAN or via VPN.

## Status
Not yet verified on hardware. Open items: confirm flash/partition limit for your
v4 hardware revision, confirm `usbip-client` deps resolve in the 22.03.7 feed,
and test `usbip port` output parsing against your usbip version.
