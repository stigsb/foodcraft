---
name: foodcraft-workflow
description: How work gets done and shipped in this repo - finishing a task (checks, version bump, Norwegian changelog, .mcaddon build, recipe book, commit, push, LAN share server), the content generators, parallel subagents, and Windows shell pitfalls. Use at the start of any change to the packs and before reporting a task as done.
---

# Foodcraft workflow

The user is a parent building this add-on with their kids. Answer in Norwegian (bokmål). They test on a tablet and a Realm; there is no Minecraft on this PC, so nothing can be verified in game here. Say plainly what is untested and add test lines to `docs/test-checklist.md`.

## Finishing a task (every time pack content changed)

1. Checks: `node tools/check_packs.cjs` → `ALL OK`, and `node --check` on every file in `packs/foodcraft_bp/scripts/`.
2. Version: `node tools/bump_version.mjs patch` (`minor` when a spec under `docs/superpowers/specs/` is finished). It updates both manifests, the pack names (`Foodcraft Behavior Pack vX.Y.Z`) and adds an empty section to `CHANGELOG.md`.
3. Changelog: fill in that section in Norwegian, for the kids: what changed in the game, not in the code.
4. Test list: add lines for the change to `docs/test-checklist.md`.
5. Build: `powershell -ExecutionPolicy Bypass -File tools/export_mcaddon.ps1` → `dist/foodcraft-vX.Y.Z.mcaddon`. If recipes, items or names changed: `node tools/make_recipe_book.mjs` → `dist/oppskrifter.pdf`.
6. Commit and push. No co-author lines or other trailers. The pre-commit hook rejects pack changes without a higher version or without a filled-in changelog entry; fix the cause, never skip the hook.
7. Share: make sure `node tools/serve_mcaddon.mjs` runs in the background (port 8000) and give the address `http://<LAN IP>:8000`. Check with `curl`. If the harness killed it for low memory, don't restart it on your own; say so and wait to be asked.

Rules behind this:
- Never ship changed content under a version that was already pushed or shared. To undo a shared change, make a new version (the batter rename went v0.2.2 → back in v0.2.3).
- No compatibility with older worlds is needed; say when a change breaks existing worlds (e.g. a removed block).
- "kjør server" / "start serveren" means the LAN download server above, not a Bedrock Dedicated Server.

## Generators (change the table, rerun, don't hand-edit outputs)

- `tools/content_v2.mjs` + `node tools/make_content.mjs 12`: items, recipes, lang lines (en_US and nb_NO), atlas entries, placeholder icons.
- `node tools/make_models.mjs <name>`: block models (box UV) + placeholder texture.
- `node tools/make_fish_mobs.mjs`: fish entities, spawn rules with verified biome filters, loot, client entities, geometry, skins, animations.
- `node tools/art_corn.mjs`: corn pixel art (overwrites the corn textures on purpose).
- Fish species and water zones live in `packs/foodcraft_bp/scripts/fish_data.js` (no `@minecraft` imports, so Node can load it).
- Shared hand helpers are in `scripts/hand.js`; import them, don't copy them.

## Parallel subagents

- Worktree agents can start from an old commit. Put the exact base commit in the brief and have each agent check `git log -1` first.
- Shared files (`main.js`, both `.lang` files, `terrain_texture.json`, `item_texture.json`, `blocks.json`) cause merge conflicts. Create shared helpers and run the generators centrally before fanning out; give each agent its own files.
- Big artifact pages can stall an agent. Tell it to inspect large files with grep/node and to work in small steps.
- `.claude/worktrees/` is git-ignored. `.claude/skills/` is tracked.

## Windows shell pitfalls

- `core.autocrlf=true`: working files are CRLF. Multi-line string replacements in node/sed miss; use the Edit tool or normalise `\r\n` first.
- No Python (the `python` on PATH is a Store stub). Use Node; `tools/png.mjs` writes PNGs.
- `.ps1` files need `powershell -ExecutionPolicy Bypass -File ...`.
- Bash heredocs can mangle regex escapes; avoid `$&` in Perl replacements. Use absolute paths or `cd /c/Users/Ravn/foodcraft && ...`: the Bash cwd resets.
- Git hooks live in `.githooks` (`git config core.hooksPath .githooks`, once per clone).
