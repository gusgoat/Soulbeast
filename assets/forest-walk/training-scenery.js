// Generated PNG scenery only. Event rolls, rewards and contacts stay in the game runtime.
import {placeLayers} from './training-layers.js?v=fire-water-1';
const storage = 'https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/';
const prefix = 'forest-training-png-v2--';
const localRoot = new URL('./generated/', import.meta.url);
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const cache = new Map();

// World widths differ deliberately: a satchel must not be cottage-sized.
export const TRAINING_PNG = Object.freeze({
  firstpact: {width: 20, pivot: .90},
  training: {width: 17, pivot: .90},
  'training-bells': {width: 18, pivot: .94},
  'training-footprints': {width: 18, pivot: .92},
  'training-thorns': {width: 15, pivot: .92},
  'training-poison': {width: 12, pivot: .88},
  'training-0': {width: 11, pivot: .91},
  'training-1': {width: 5.5, pivot: .88},
  'training-2': {width: 7, pivot: .91},
  'training-3': {width: 24, pivot: .92},
  'encounter-7': {width: 5.5, pivot: .88},
  'after-training': {width: 14, pivot: .90},
  villager: {width: 18, pivot: .92},
  boss: {width: 24, pivot: .91},
  'trap-quicksand': {width: 11, pivot: .70, ground: true},
  'trap-leeches': {width: 10, pivot: .70, ground: true},
  'trap-fire': {width: 11, pivot: .85},
  'trap-spikes': {width: 10, pivot: .70, ground: true},
  'trap-rocks': {width: 12, pivot: .86},
  'trap-vines': {width: 11, pivot: .83}
});
export const TRAP_PNG = Object.freeze(['trap-quicksand', 'trap-leeches', 'trap-fire', 'trap-spikes', 'trap-rocks', 'trap-vines']);

function imageAt(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('PNG scenery failed: ' + url));
    image.src = url;
  });
}
function load(id, layered = false) {
  const cacheKey = (layered ? 'layers/' : '') + id;
  if (cache.has(cacheKey)) {
    const ready = cache.get(cacheKey);
    cache.delete(cacheKey); cache.set(cacheKey, ready);
    return ready;
  }
  if (!cache.has(cacheKey)) {
    const published = storage + (layered ? 'forest-training-layers-v1--' : prefix) + id + '.png';
    const workspace = new URL(cacheKey + '.png', localRoot).href;
    const urls = local ? [workspace, published] : [published, workspace];
    const ready = imageAt(urls[0]).catch(() => imageAt(urls[1]));
    cache.set(cacheKey, ready);
    ready.catch(() => { if (cache.get(cacheKey) === ready) cache.delete(cacheKey); });
    while (cache.size > 6) cache.delete(cache.keys().next().value);
  }
  return cache.get(cacheKey);
}

export async function trainingScenery(scene, trapIndex) {
  const tiles = {}, props = [];
  async function add(id, x, z) {
    const spec = TRAINING_PNG[id];
    if (!spec) throw new Error('Unknown training scenery: ' + id);
    const key = 'training-png-' + id;
    const layers = placeLayers(id, key, x, z, spec.width);
    tiles[key] = await load(id, !!layers);
    if (layers) props.push(...layers);
    else props.push({kind: 'training-prop', art: key, effectId:id, x, z, ...spec});
  }
  const work = [];
  if (scene) work.push(add(scene.id, 1.05, -11.9));
  if (Number.isInteger(trapIndex) && TRAP_PNG[trapIndex]) work.push(add(TRAP_PNG[trapIndex], 0, -29));
  await Promise.all(work);
  return {tiles, props};
}
