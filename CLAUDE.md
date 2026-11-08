# Foodcraft

Minecraft Bedrock add-on: `packs/foodcraft_bp` (behavior pack) and `packs/foodcraft_rp` (resource pack).

Skills in `.claude/skills/`: `bedrock-addon-dev` (Bedrock JSON and Script API rules and gotchas) and `foodcraft-workflow` (finishing and shipping a task, generators, subagents, Windows pitfalls). Static check: `node tools/check_packs.cjs`.

## Pack versions

The version number is part of each pack's name, so different installed versions can be told apart in Minecraft.

**Always bump the version when anything in `packs/` changes.** Minecraft clients and Realms cache packs by UUID and version: content shipped under an unchanged version is ignored by anyone who already has that version, so players on the Realm keep the old textures, recipes and scripts.

A pre-commit hook (`.githooks/pre-commit` → `tools/check_version_bump.mjs`) rejects commits that change `packs/` without a higher version, or with different BP/RP versions. Enable it once per clone: `git config core.hooksPath .githooks`.

Versioning rules:

- **Patch** (`0.2.0` → `0.2.1`): bump in every commit that changes pack content (textures, models, recipes, scripts, blocks, items, texts, sounds), unless the version has already been bumped since the last pushed or shared build. Never push or share changed pack content under a version that has already been pushed or shared.
- **Minor** (`0.2.x` → `0.3.0`): bump when a spec under `docs/superpowers/specs/` is finished. Patch resets to 0.
- Don't bump when nothing in `packs/` changed since the last build.

**Every version bump gets an entry in `CHANGELOG.md`**, written in Norwegian for the players (the kids): what is new or different in the game, not how the code changed. `bump_version.mjs` adds an empty section for the new version; fill in the bullets in the same commit. The pre-commit hook rejects a bumped version without a filled-in entry, and the share server shows the changelog.

Use `node tools/bump_version.mjs patch|minor|major`; it does all of the below. If editing by hand, update both manifests (`packs/foodcraft_bp/manifest.json`, `packs/foodcraft_rp/manifest.json`) and keep everything in step:

- `header.name`: `Foodcraft Behavior Pack vX.Y.Z` / `Foodcraft Resource Pack vX.Y.Z`
- `header.version` and every `modules[].version`: `[X, Y, Z]`
- the BP's `dependencies` entry on the RP: `[X, Y, Z]`

Leave the `@minecraft/server` dependency version alone; it is the script API version, not ours.

## Building and sharing

- `powershell -ExecutionPolicy Bypass -File tools/export_mcaddon.ps1` builds `dist/foodcraft-vX.Y.Z.mcaddon`, named after the pack version (`dist/` is git-ignored). Old builds are kept.
- `node tools/serve_mcaddon.mjs` serves the builds on the LAN at `http://<PC LAN IP>:8000` so the tablet can download them: the newest version first, older ones listed below. On macOS, `tools/push.sh` bumps, builds and serves in one go.

**After every finished task where the code is usable** (static checks pass, nothing half-done), bump the patch version (minor if the task finished a spec), rebuild the `.mcaddon` and make sure the share server is running: start it in the background if it isn't, restart it if it has stopped. Then tell the user the address so the latest version is always easy to pull onto the tablet for testing. Skip this when the task left the packs in a broken state, and say so.
- `node tools/make_recipe_book.mjs` builds a printable Norwegian recipe book, `dist/oppskrifter.pdf`, from the recipes and script tables. Rebuild it together with the `.mcaddon` when recipes change; the share server links to it.
- Content generators (re-runnable, keep hand-drawn textures): `node tools/make_content.mjs 12` (items, recipes, lang, icons from `tools/content_v2.mjs`), `node tools/make_models.mjs <name>` (block models), `node tools/make_fish_mobs.mjs` (swimming fish: entities, spawn rules with biome filters checked against `tools/data/biome_tags.json`, models, skins).
- Modellbenk (3D viewer + texture painter for the family): https://claude.ai/code/artifact/eeaa7f09-1b4c-45bf-b452-a19e7af6ca62. Sources in `tools/modellbenk/`; rebuild with `node tools/modellbenk/build.cjs && node tools/modellbenk/assemble.cjs`, then publish `dist/modellbenk/modellbenk.html` with the Artifact tool passing that `url` (no `icon`). Rebuild it when models or textures change. Painted textures are saved in its database, collection `textures` (doc id = repo path with `/` → `~`; fields `path`, `width`, `height`, `png` data URL, `savedBy`, `savedAt`). To bring them into the repo: `read_db` `list` on `textures` with `out_dir`, decode each `png` to its `path`, then ship as a normal task (bump, changelog, build).
- `tools/deploy.ps1` copies the packs into the local Minecraft development pack folders.

## Commits

No co-author lines or other trailers in commit messages.
