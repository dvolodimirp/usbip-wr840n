#!/bin/sh
# Usage: check-size.sh <image.bin> [limit_bytes]
# Default limit = 7808k (TL-WR840N v4 firmware partition per OpenWrt 22.03 device
# definition). VERIFY against target/linux/ramips/image/mt76x8.mk for your revision.
f="$1"; limit="${2:-7995392}"
[ -f "$f" ] || { echo "no image: $f"; exit 2; }
s=$(wc -c < "$f")
echo "image: $f  size: $s bytes  limit: $limit  headroom: $((limit - s))"
[ "$s" -le "$limit" ] || { echo "ERROR: image too large"; exit 1; }
[ $((limit - s)) -ge 524288 ] || echo "WARNING: <512 KiB left for the JFFS2 overlay"
