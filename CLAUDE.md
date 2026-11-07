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
- `node tools/serve_mcaddon.mjs` serves it on the LAN at `http://<PC LAN IP>:8000` so the tablet can download it. The page shows the version and build time.

**After every finished task where the code is usable** (static checks pass, nothing half-done), rebuild the `.mcaddon` and make sure the share server is running: start it in the background if it isn't, restart it if it has stopped. Then tell the user the address so the latest version is always easy to pull onto the tablet for testing. Skip this when the task left the packs in a broken state, and say so.
- `tools/deploy.ps1` copies the packs into the local Minecraft development pack folders.

## Commits

No co-author lines or other trailers in commit messages.
