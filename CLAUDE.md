# Foodcraft

Minecraft Bedrock add-on: `packs/foodcraft_bp` (behavior pack) and `packs/foodcraft_rp` (resource pack).

## Pack versions

The version number is part of each pack's name, so different installed versions can be told apart in Minecraft.

When you bump the version, update both manifests (`packs/foodcraft_bp/manifest.json`, `packs/foodcraft_rp/manifest.json`) and keep everything in step:

- `header.name`: `Foodcraft Behavior Pack vX.Y.Z` / `Foodcraft Resource Pack vX.Y.Z`
- `header.version` and every `modules[].version`: `[X, Y, Z]`
- the BP's `dependencies` entry on the RP: `[X, Y, Z]`

Leave the `@minecraft/server` dependency version alone; it is the script API version, not ours.

## Building and sharing

- `powershell -ExecutionPolicy Bypass -File tools/export_mcaddon.ps1` builds `dist/foodcraft.mcaddon` (`dist/` is git-ignored).
- To get it onto the tablet, serve `dist/` over HTTP on the LAN (port 8000) and open `http://<PC LAN IP>:8000` on the tablet.
- `tools/deploy.ps1` copies the packs into the local Minecraft development pack folders.

## Commits

No co-author lines or other trailers in commit messages.
