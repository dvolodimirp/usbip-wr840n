#!/bin/sh
# Build luci-app-usbip as an architecture-independent .ipk without the OpenWrt SDK.
# Usage: scripts/build-ipk.sh [outdir]
set -e
VER="${PKG_VERSION:-0.1.0}"; REL="${PKG_RELEASE:-1}"
NAME=luci-app-usbip
SRC="$(cd "$(dirname "$0")/.." && pwd)/$NAME"
OUT="${1:-dist}"; mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
mkdir -p "$W/data" "$W/control" "$OUT"

cp -a "$SRC/root/." "$W/data/"
mkdir -p "$W/data/www"
cp -a "$SRC/htdocs/." "$W/data/www/"

# Exec bits can be lost when files are uploaded via the GitHub web UI: set them explicitly.
for f in usr/libexec/usbip-ctl etc/init.d/usbip etc/uci-defaults/90-luci-usbip; do
	[ -f "$W/data/$f" ] || { echo "missing: $f" >&2; exit 1; }
	chmod 755 "$W/data/$f"
done

SIZE=$(du -sk "$W/data" | cut -f1)
cat > "$W/control/control" <<CTL
Package: $NAME
Version: $VER-$REL
Depends: libc, luci-base, rpcd, usbip-client, kmod-usbip-client
Section: luci
Architecture: all
Installed-Size: $((SIZE*1024))
Description: LuCI support for USB/IP client
CTL
echo /etc/config/usbip > "$W/control/conffiles"
cat > "$W/control/postinst" <<'PI'
#!/bin/sh
[ "${IPKG_NO_SCRIPT}" = "1" ] && exit 0
[ -s "${IPKG_INSTROOT}/lib/functions.sh" ] || exit 0
. "${IPKG_INSTROOT}/lib/functions.sh"
default_postinst "$0" "$@"
PI
cat > "$W/control/prerm" <<'PR'
#!/bin/sh
[ -s "${IPKG_INSTROOT}/lib/functions.sh" ] || exit 0
. "${IPKG_INSTROOT}/lib/functions.sh"
default_prerm "$0" "$@"
PR
chmod 755 "$W/control/postinst" "$W/control/prerm"

T="tar --owner=0 --group=0 --numeric-owner"
(cd "$W/control" && $T -czf "$W/control.tar.gz" ./*)
(cd "$W/data"    && $T -czf "$W/data.tar.gz" .)
echo 2.0 > "$W/debian-binary"
IPK="$OUT/${NAME}_${VER}-${REL}_all.ipk"
(cd "$W" && $T -czf "$IPK" ./debian-binary ./data.tar.gz ./control.tar.gz)
echo "built: $IPK"
