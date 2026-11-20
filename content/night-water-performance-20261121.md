# Lighter river/lake effects during country night lighting

Only country water drawFlow receives nightEffects while the same light.night > .005 threshold that enables the night atmosphere is active. Daylight and callers that omit the new flag retain pixel-identical water rendering.

At night, use one moving surface texture layer; reduce river streak density by approximately half at medium effects and three quarters at full effects. Lake ripple counts change from 5 to 2 at medium effects and from 9 to 3 at full effects. The water remains animated. Sea waves, moonlight/aurora/fireflies/lava atmosphere, sounds, shadows, water depth, movement speed and encounter rules are unchanged.

Test fixture: medium effects strokes 18→9 and full effects strokes 42→12. Daytime image comparison is pixel-identical for both levels and legacy callers. These are drawing-operation counts, not a physical phone FPS benchmark. Normal country scenes test 3 countries × 2 orientations × day/night with a local clock fixture.

Artifacts: D:/GameDev/soulbeast/outputs/night-water-performance-20261121. No APK rebuild or server changes.
