# Waterfall and footstep release

Only D: project files were changed. Publication was authorized on 2026-11-19. Media upload and SHA-256 verification completed before release; deployment evidence is in `D:/GameDev/soulbeast/tmp/heaven-waterfall-publish-20261119/`.

The supplied `C:/Users/User/Downloads/eisenkern1982-waterfall-176958.mp3` was copied unchanged to `assets/forest-walk/audio/eisenkern1982-waterfall-176958.mp3`. The binary is ignored by Git under the existing media policy. The release streams the immutable `audio/waterfall` object from `published-scene-assets.js`; no MP3 or generated PNG is added to the Git release.

Existing waterfall pixels now flow downhill with a short crossfade and a shoreline mask: the base spring, desert spout, dragon spout, and Heaven cascade. Ordinary pool ripples remain unchanged. The falling stream uses both colored water and white foam, stays inside the artwork, and honors reduced motion.

One loop plays from the nearest actual waterfall in the current scene, using the supplied recording. Gain is strongest within 5 world units and smoothly reaches zero at 34; a short gain ramp avoids abrupt changes. The recording's quiet level is compensated by a fixed gain of 4 before the distance envelope. The sound connects to the original effects bus, so master volume, effects volume and mute apply. Full-screen menus silence it; hidden tabs pause it. Scene disposal releases the audio element and nodes without closing the game's shared AudioContext. Scenes without a waterfall create no waterfall loop.

The missing trail footsteps came from replaying only the first .21 seconds of the original concrete recording. Its first impact begins around .4 seconds. The fix selects eight actual impacts (.38 to 5.12 seconds), alternates them without gameplay RNG, and balances their peaks against the original forest step. Existing walking/running cadence and trail classification are retained. Footsteps now use the same master/effects bus, have a short click-free envelope, retry failed loading, and release voices on scene exit. Original audio files are preserved.

`tools/test-forest-prop-effects-browser.mjs` verifies animated pixels, bounded water masks, cache and reduced-motion behavior across all five walking zones. `tools/test-forest-waterfalls-browser.mjs` plays the supplied MP3 through Web Audio and measures actual output at near/far distance, silence, volume zero and mute. It also checks real recorded footstep output and all fifteen well scenes. Evidence: `D:/GameDev/soulbeast/tmp/forest-waterfall-qa/`.

Preview: http://127.0.0.1:8836/?v=waterfall-preview-2&scene=map%3Arevival&tour=1

The dedicated launcher has an **เปิดเสียงทดลอง** button. It enables the original game's audio on a real user gesture; no production sound preference is changed.
