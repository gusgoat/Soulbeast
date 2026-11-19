// Include the entire end clearing and the continuation beyond it. A player
// following either edge of the trail should never have to hit its centre.
export function reachedTrailEnd(x, z, end, approach, radius) {
  const dx = x - end[0], dz = z - end[1];
  if (Math.hypot(dx, dz) <= radius) return true;
  const tx = end[0] - approach[0], tz = end[1] - approach[1];
  const length = Math.hypot(tx, tz);
  return length > 0 && dx * tx + dz * tz >= 0
    && Math.abs(dx * tz - dz * tx) <= radius * length;
}
