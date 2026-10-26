# Character and equipment motion

Integrated on top of `0b542cf9a8bf1c4eaad4ec95c3848bc77390cb51` (latest origin/main at integration).

325 authored identities use 1,975 pose/effect images. Only active battle participants load their portraits. `motionCatalog.js` is generated from the reviewed manifests with `node tools/build-motion-catalog.cjs`; `motionController.js` uses the same controller as the approved previews. The client build checks windup, melee and VFX asset hashes against normalized anchors before emitting any bundle.

`characterMotion.js` decorates the current battle renderer and item icon renderer. It retains current frames, commands, HP/MP, elements and status strips. No combat catalog, turn timing, account/save schema or server engine is replaced. Visual state is separate from units and survives card rerenders; leaving a battle cancels it.

- Normal attacks and melee skills use a portrait round trip with edge contact, retaining visibility of the target.
- Ranged attacks use the approved windup followed immediately by linear power (.75 seconds; original dragon .7), with the existing skill projectile emitted from the calibrated portrait anchor.
- Non-damaging skills use threat when authored, otherwise windup only.
- Hurt poses require landed hit packets. Local hits fully absorbed by shields do not recoil. Miss/block/immune packets never request hurt poses.
- Existing particle eligibility remains final-form only; sealer particles remain white/gold.
- Legendary equipment has aura; Eclipse legendary equipment adds motes. Equipment does not breathe.
- Reduced-motion preferences disable character movement and retain static equipment glow.

Validation: `npm test`, `npm run test:accounts`, `npm run test:production`, `npm run test:motion`. Local browser fixtures: `node tools/build-motion-game-preview.cjs`, existing PvP/world layout builders. Never publish fixture pages or test controls.

Publish root hashed assets and canonical index/refactor shells from `tools/client-build.cjs`, then generate the account entry with **`node tools/prepare-account-stage.cjs`**. Do not replace the account entry with the generic staging shell. This release is web-only.
