# Soulbeast browser playtest — 2026-11-03

Current walking game, all 7 dungeon floors, hidden traps, companion medicines, quests, and fusion.
Entry: https://gusgoat.github.io/Soulbeast/

Progress is stored in this browser. Social and camp tests use local simulation, not cross-device multiplayer. Purchases are not enabled for real-money transactions.

This branch contains the optimized static distribution only. Original development files remain on main and in the local workspace.

## Website media

The source copies of images, sound and video are in public Supabase Storage. The Pages build verifies their checksums and publishes the existing URLs for the game. A deployment cache avoids downloading unchanged media on every code update.

For a local static server or a test that reads game images, run `node tools/media-storage.mjs --checkout` after cloning this branch. It restores missing files and preserves local edits. To build a standalone site, use `node tools/prepare-pages.mjs <new-output-directory>`.
