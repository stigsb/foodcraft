#!/usr/bin/env bash
# Bump the pack patch version, build dist/foodcraft.mcaddon and serve it on the LAN.
# On the tablet: open the printed URL, download, "Open with Minecraft". Ctrl-C stops the server.
# Usage: tools/push.sh [--no-bump] [port]
set -euo pipefail
cd "$(dirname "$0")/.."

bump=1
if [[ "${1:-}" == "--no-bump" ]]; then bump=0; shift; fi
port="${1:-8000}"
manifests=(packs/foodcraft_bp/manifest.json packs/foodcraft_rp/manifest.json)

if (( bump )); then
  # All [x, y, z] arrays in both manifests carry the same pack version (headers, modules, BP->RP dependency).
  old=$(grep -m1 -oE '"version": \[[0-9]+, [0-9]+, [0-9]+\]' packs/foodcraft_rp/manifest.json | grep -oE '[0-9]+, [0-9]+, [0-9]+')
  IFS=', ' read -r major minor patch <<<"$old"
  new="$major, $minor, $((patch + 1))"
  sed -i '' "s/\[$old\]/[$new]/g" "${manifests[@]}"
  echo "Version [$old] -> [$new]"
fi

mkdir -p dist
rm -f dist/foodcraft.mcaddon
(cd packs && find foodcraft_bp foodcraft_rp -type f ! -name .DS_Store | zip -X -q ../dist/foodcraft.mcaddon -@)
echo "Built dist/foodcraft.mcaddon"

ip=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo localhost)
url="http://$ip:$port/foodcraft.mcaddon"
echo "Tablet URL: $url"
echo "Or:         http://$(scutil --get LocalHostName).local:$port/foodcraft.mcaddon"
if command -v qrencode >/dev/null; then qrencode -t ansiutf8 "$url"; fi

exec python3 -m http.server "$port" --bind 0.0.0.0 --directory dist
