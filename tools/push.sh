#!/usr/bin/env bash
# Bump the pack patch version, build dist/foodcraft-vX.Y.Z.mcaddon and serve it on the LAN (macOS).
# On the tablet: open the printed URL, download, "Open with Minecraft". Ctrl-C stops the server.
# Usage: tools/push.sh [--no-bump] [port]
set -euo pipefail
cd "$(dirname "$0")/.."

bump=1
if [[ "${1:-}" == "--no-bump" ]]; then bump=0; shift; fi
port="${1:-8000}"

# bump_version.mjs keeps pack names, module versions and the BP->RP dependency in step.
if (( bump )); then node tools/bump_version.mjs patch; fi
version=$(node -p 'require("./packs/foodcraft_bp/manifest.json").header.version.join(".")')
file="foodcraft-v$version.mcaddon"

mkdir -p dist
rm -f "dist/$file"
(cd packs && find foodcraft_bp foodcraft_rp -type f ! -name .DS_Store | zip -X -q "../dist/$file" -@)
echo "Built dist/$file"

ip=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo localhost)
url="http://$ip:$port/"
echo "Tablet URL: $url"
echo "Or:         http://$(scutil --get LocalHostName).local:$port/"
if command -v qrencode >/dev/null; then qrencode -t ansiutf8 "$url"; fi

exec node tools/serve_mcaddon.mjs "$port"
