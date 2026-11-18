# Fire and water on PNG props

`prop-effects.js` animates the original artwork pixels; no replacement media is required. Effect masks and source rectangles are cached per image/cutout. Frames update at most once per 60 ms and reuse their canvases. Off-screen props do not animate. The existing forest render loop owns timing, pause and disposal; there is no extra RAF, timer or gameplay RNG.

Fire uses isolated bright flame pixels, an anchored upward flicker, restrained local glow and the original PNG colors. Water uses bounded water-color masks, small moving texture bands and a shoreline clip. Stonework, foliage and the actor keep their normal depth ordering. Reduced-motion mode keeps the original static art.

Coverage:

- Both forests: original fire-trap PNG.
- Training/shared legacy props: bandit camp fire/torches and shrine candles.
- Moonlight: travel lantern and surveyor lantern; crystal-lantern light; Yggdrasil stream, moon-reflection pond, ditch and water-channel outflow.
- Existing spring/revival/cleanse basins retain their calibrated water/rim/lotus effects; the new effects do not double them.

No encounter contact, damage, probability, reward, combat or save code is changed by the animation module. Both local preview pages accept `scene` and `tour=1` parameters so a prop can be inspected without resolving its encounter. Production has not been updated with this preview work.

Verification: real Chrome pixel comparisons verify changing frames, nonempty flame/water masks, exact water-mask containment, cache reuse, reduced-motion stills and no RNG reads. Real forest scenes verify the effects attach in zones 7 and 1 while the completed preview remains outside combat.
