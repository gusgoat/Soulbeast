import {forestAssetURL} from "./storage-assets.js";
import {trainingScenery} from "./training-scenery.js?v=desert-release-1";
import {layerOpacity} from "./training-layers.js?v=layers-v1";
import {moonlightScenery,moonlightThicket} from './moonlight-scenery.js?v=boss-room-1';
import {createPropEffects,propEffectSpec} from './prop-effects.js?v=dragon-city-release-1';
import {bossRoomScenery} from './boss-rooms.js?v=dragon-city-release-1';
import {desertScenery,desertThicket} from './desert-scenery.js?v=desert-release-1';
import {dragonScenery,dragonThicket} from './dragon-scenery.js?v=dragon-city-release-1';
import {questScenery} from './quest-scenery.js?v=dragon-city-release-1';
import {reachedTrailEnd} from './trail-exit.js?v=dragon-city-release-1';

const FLATTEN = .64;
// Player walking and running are 1.5 times the original forest pace.
const RUN_SPEED = 6.5 * 1.5;
const WALK_SPEED = RUN_SPEED * 220 / 360;
const SHADOW_CHASE_SPEED = 6.8 * 1.7;
// Match Country Walk's Blender actor at its fixed .72 zoom.
const COUNTRY_PLAYER_SIZE = 154 * .72;
const COUNTRY_SHADOW_SIZE = 144 * .72;
const COUNTRY_BANDIT_SIZE = 164 * .72;
const TRAVELER_WALK_FRAMES = [1, 2, 3, 2];
const RUN_TILT = .72, KEEP_RUNNING_TILT = .62;
const MAP_SCALE = .7;
const atMapScale = ([x, z]) => [x * MAP_SCALE, z * MAP_SCALE];
const WIDTH = 140 * MAP_SCALE, LENGTH = 152 * MAP_SCALE, NORTH = 78 * MAP_SCALE, SOUTH = NORTH - LENGTH;
const [SPAWN, FORK, WEST, EAST] = [[0, -61.5], [0, -2.5], [-49, 54], [51, 56.5]].map(atMapScale);
const tracks = [
  [[0, -68], [0, -61.5], [-1, -51], [1, -39.5], [2.5, -29], [1.5, -17], [0, -2.5]],
  [[0, -2.5], [-8, 10], [-19.5, 21], [-28.5, 30.5], [-34.5, 43], [-49, 54]],
  [[0, -2.5], [8.5, 10], [20, 18.5], [32, 31.5], [38.5, 44.5], [51, 56.5]]
].map(path => smooth(path.map(atMapScale)));
const clearings = [[SPAWN, 5], [FORK, 5], [WEST, 9], [EAST, 9]];
const GLADE_CENTER = atMapScale([1.5, -17]), GLADE_RADIUS = 11.5;
const LANDMARKS = {
  gate: {file: "gate.webp", width: 16, reach: 4.4},
  shrine: {file: "forest-shrine.webp", width: 11, reach: 4.3},
  chest: {file: "forest-bush-chest.webp", width: 4.1, reach: 2.8},
  sign: {file: "direction-sign.webp", width: 5.6, reach: 3.2}
};
const TRAIL_FILL_WIDTH = 10.1;
const TRAIL_STROKE_SCALE = .82 * FLATTEN;
const WALK_PHASE_RATE = 7.8;
const FOOTSTEP_PHASE_INTERVAL = 4;
const WALK_FOOTSTEP_INTERVAL_MS = FOOTSTEP_PHASE_INTERVAL / WALK_PHASE_RATE * 1000;
const TRAIL_RUN_AUDIO_SCALE = .65;
const BUSH_RADIUS = 8.6, GLADE_SEARCH_RADIUS = 1.65;
const MIST_RADIUS = 14.5;
const MIST_APPROACH = Math.hypot(SPAWN[0] - GLADE_CENTER[0], SPAWN[1] - GLADE_CENTER[1]);
const mistBanks = [
  [-8, 6, 23, 15, .66], [8, 7, 28, 17, .63], [-11, 1, 24, 16, .59],
  [2, 4, 31, 15, .76], [10, -1, 23, 15, .61], [-4, -3, 31, 16, .69],
  [5, -7, 27, 14, .63], [-8, -8, 23, 14, .54], [1, -11, 25, 11, .49],
  [-5, -18, 25, 13, .37], [4, -23, 26, 12, .32], [-4, -31, 24, 13, .28]
];
const GLADE_CHEST = {kind: "glade-chest", art: "glade-chest", x: GLADE_CENTER[0] + 2.7, z: GLADE_CENTER[1] - .5, width: 4.1};
const RUINS = {kind: "ruins", art: "ruins", x: GLADE_CENTER[0], z: GLADE_CENTER[1] + .8, width: 17.4};
const RUINS_ENTRY = [RUINS.x, RUINS.z + 1];
const RUINS_CHEST = {...GLADE_CHEST, x: GLADE_CENTER[0] + 2.6, z: GLADE_CENTER[1] - .8};
// Crop the transparent vertical margins so each canopy has a consistent in-game height.
const thicketCanopies = [
  {top: 89, bottom: 276, scale: .48},
  {top: 14, bottom: 216, scale: .53},
  {top: 116, bottom: 312, scale: .51},
  {top: 29, bottom: 210, scale: .47}
];
const thicketLayout = [
  [-5.5, 4.3, 5.6, 4], [-1.6, 5.7, 5.5, 2], [3.3, 5, 5.5, 1], [6, 3.2, 4.8, 2],
  [-6.3, .3, 6, 2], [-3.2, 2.7, 4.9, 1], [.1, 3.4, 4.9, 4], [2.6, 3, 4.8, 1], [4.7, 1.8, 5.2, 4],
  [-3.7, .4, 5.1, 3], [-1, 1.3, 4.9, 4], [1.6, 1.4, 5.2, 2], [4.3, -.1, 4.4, 1], [6.2, -1.6, 5.5, 2],
  [-6, -3.6, 5.2, 1], [-3.3, -1.8, 4.8, 3], [-.8, -.9, 5, 2], [1.9, -.9, 4.6, 4],
  [-3.2, -5.5, 5.4, 4], [-1.4, -3.5, 5, 4], [1.1, -3.1, 4.4, 1], [3.9, -2.6, 4.6, 1],
  [.5, -5.6, 4.7, 1], [4.1, -4.2, 4.8, 4]
];
const TOWN_EXIT = [44, -15];
const townTrail = smooth([GLADE_CENTER, [10, -13], [20, -17], [31, -19], TOWN_EXIT, [WIDTH / 2, -13]]);
const townTrails = [townTrail];
const VILLAGE = {kind: "village", art: "village", x: GLADE_CENTER[0], z: GLADE_CENTER[1], width: 20.5, radius: 4.6};
const VILLAGE_ENTRANCE = [VILLAGE.x, VILLAGE.z - 5.1];
const BANDIT_CAMP = {kind: "bandit-camp", art: "bandit-camp", x: GLADE_CENTER[0], z: GLADE_CENTER[1], width: 18};
const BANDIT_LOOT = {...GLADE_CHEST, x: BANDIT_CAMP.x, z: BANDIT_CAMP.z - 4};
const HEALER = {kind: "healer", art: "healer", x: GLADE_CENTER[0], z: GLADE_CENTER[1], width: 15.4, radius: 2.2};
const HEALER_ENTRANCE = [HEALER.x + 1, HEALER.z - .9];
const WELL_WIDTH = 23.2, WELL_PIVOT = .48;
const groundClearings = [...clearings, [GLADE_CENTER, GLADE_RADIUS]];
const SHADOW_FORMATIONS = [
  [[0, 0]],
  [[-2.7, 0], [2.7, 1.3]],
  [[0, -1.1], [-4.4, 1.7], [4.4, 1.7]],
  [[-2.6, -1], [2.6, -.5], [-5, 2.9], [5, 3.3]]
];

function spawnShadows(training) {
  const roll = Math.random();
  const size = training ? (roll < .65 ? 1 : roll < .95 ? 2 : 3)
    : (roll < 33 / 55 ? 2 : roll < 47 / 55 ? 3 : 4);
  const formation = SHADOW_FORMATIONS[size - 1];
  return formation.map(([flank, depth], index) => ({
    x: GLADE_CENTER[0] + flank, z: GLADE_CENTER[1] + depth,
    flank, wait: 1.25 + index * .09, phase: index * 1.25, facing: 1
  }));
}
const groups = { tree: 5, rock: 8, grass: 6, shrub: 4, wildflower: 4 };
const filenames = Object.fromEntries(["ground", "trail", "direction-sign", "idle", "walk", "run"]
  .map(id => [id, id + ".webp"]));
for (const [kind, count] of Object.entries(groups)) {
  for (let i = 1; i <= count; i++) {
    const id = kind + "-" + i;
    filenames[id] = (kind === "tree" || kind === "rock" ? "green-" : "") + id + ".webp";
  }
}

function smooth(guide) {
  const points = [];
  for (let i = 0; i < guide.length - 1; i++) {
    const a = guide[Math.max(0, i - 1)], b = guide[i], c = guide[i + 1], d = guide[Math.min(guide.length - 1, i + 2)];
    for (let j = 0; j < 6; j++) {
      const t = j / 6;
      points.push(b.map((v, axis) => .5 * (2 * v + (c[axis] - a[axis]) * t
        + (2 * a[axis] - 5 * v + 4 * c[axis] - d[axis]) * t ** 2
        + (-a[axis] + 3 * v - 3 * c[axis] + d[axis]) * t ** 3)));
    }
  }
  return [...points, guide.at(-1)];
}

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const distance = (x, z, point) => Math.hypot(x - point[0], z - point[1]);
const ellipseRadius = (x, z, ellipse) => Math.hypot((x - ellipse.x) / ellipse.radiusX, (z - ellipse.z) / ellipse.radiusZ);
const smoothstep = t => t * t * (3 - 2 * t);

function trailDistance(x, z, paths, zScale = 1) {
  let best = Infinity;
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1], [bx, bz] = path[i];
      const dx = bx - ax, dz = (bz - az) * zScale, fromZ = (z - az) * zScale;
      const t = clamp(((x - ax) * dx + fromZ * dz) / (dx * dx + dz * dz), 0, 1);
      best = Math.min(best, (x - ax - dx * t) ** 2 + (fromZ - dz * t) ** 2);
    }
  }
  return Math.sqrt(best);
}

function outsideTrail(x, z, trailGap) {
  return trailGap > 5 && clearings.every(([p, radius]) => distance(x, z, p) > radius + 1.1);
}

function makeScenery(showEntranceGate, paths) {
  let seed = 9618;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const range = (a, b) => a + (b - a) * random();
  const props = [];
  const add = (kind, x, z, width, radius = 0, variant = 0) => props.push({
    art: groups[kind] ? kind + "-" + (variant || 1 + Math.floor(random() * groups[kind])) : kind,
    kind, x, z, width, radius
  });
  for (let z = SOUTH + 2; z < NORTH; z += 6.2) {
    for (let x = -WIDTH / 2 + 2; x < WIDTH / 2; x += 6.8) {
      const a = x + range(-2.3, 2.3), b = z + range(-2.3, 2.3);
      const trailGap = trailDistance(a, b, paths);
      if (trailGap > 8 && outsideTrail(a, b, trailGap) && random() > .19)
        add("tree", a, b, range(7.3, 13.7), .75);
    }
  }
  for (let z = SOUTH; z < NORTH; z += 4.2) {
    for (let x = -WIDTH / 2; x < WIDTH / 2; x += 4.5) {
      const a = x + range(-2, 2), b = z + range(-2, 2);
      if (!outsideTrail(a, b, trailDistance(a, b, paths)) || random() < .30) continue;
      const r = random();
      if (r < .54) add("grass", a, b, range(1.45, 3.2));
      else if (r < (a > 0 ? .77 : .68)) add("wildflower", a, b, range(1.8, 3.4));
      else if (r < .87) add("shrub", a, b, range(2.5, 4.5));
      else add("rock", a, b, range(1.65, 3.0), .45);
    }
  }
  if (showEntranceGate) add("gate", ...atMapScale([0, -68]), 16);
  add("direction-sign", ...atMapScale([0, 7]), 4, .3);
  add("tree", ...atMapScale([.8, 11]), 8.5, .75, 3);
  add("rock", ...atMapScale([-2.1, 8]), 2.15, .35, 4);
  add("wildflower", ...atMapScale([2.3, 8.2]), 2.15, 0, 2);
  for (let i = 0; i < 7; i++) {
    const x = WEST[0] + (i - 3) * 2.1;
    const z = WEST[1] + 5.5 + Math.sin(i * 1.7) * 1.8;
    add("rock", x, z, 3.1 + (3 - Math.abs(i - 3)) * .85, .65, i + 1);
    add("shrub", x + .8, z + 2.2, 3.5);
  }
  add("tree", EAST[0] + 1, EAST[1] + 7, 12.6, .85, 1);
  for (let i = 0; i < 22; i++) {
    const angle = i * 2.3999, radius = range(3.8, 8);
    add("wildflower", EAST[0] + Math.cos(angle) * radius,
      EAST[1] + 5 + Math.sin(angle) * radius, range(2.2, 3.9));
  }
  return props.filter(prop => {
    const canopyReach = prop.kind === "tree" ? prop.width * .35 : 0;
    return distance(prop.x, prop.z, GLADE_CENTER) > GLADE_RADIUS + canopyReach;
  }).sort((a, b) => b.z - a.z);
}

function smoothStroke(ctx, path, x, y) {
  ctx.moveTo(x(path[0][0]), y(path[0][1]));
  for (let i = 1; i < path.length; i++) ctx.lineTo(x(path[i][0]), y(path[i][1]));
}

function makeMistPuff() {
  const cloud = document.createElement("canvas");
  cloud.width = 160;
  cloud.height = 80;
  const ctx = cloud.getContext("2d");
  ctx.scale(1, .5);
  for (const [x, y, radius, opacity] of [[78, 81, 66, .56], [43, 78, 40, .37], [116, 86, 42, .40], [88, 57, 43, .34]]) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(218,233,224,${opacity})`);
    gradient.addColorStop(.44, `rgba(214,229,221,${opacity * .57})`);
    gradient.addColorStop(1, "rgba(203,222,214,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return cloud;
}

function paintFootprints(ctx, x, y, scale) {
  const trail = tracks[0];
  for (let i = 9; i < trail.length - 5; i += 2) {
    const [px, pz] = trail[i];
    const [nx, nz] = trail[i + 1];
    const heading = Math.atan2(y(nz) - y(pz), x(nx) - x(px)) + Math.PI / 2;
    const side = i % 4 < 2 ? 1 : -1;
    ctx.save();
    ctx.translate(x(px) + side * scale * .85, y(pz));
    ctx.rotate(heading + side * .14);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#51432dc2";
    ctx.beginPath();
    ctx.ellipse(0, .17, .52, .35, 0, 0, Math.PI * 2);
    for (const [toeX, toeY, angle] of [[-.48, -.26, -.34], [0, -.45, 0], [.48, -.26, .34]]) {
      ctx.moveTo(toeX + .18, toeY);
      ctx.ellipse(toeX, toeY, .18, .3, angle, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}

function makeGround(images, props, paths, openAreas, footprints, moonlight = false, desert = false, dragon = false) {
  const ground = document.createElement("canvas"), scale = 6;
  ground.width = WIDTH * scale;
  ground.height = Math.ceil(LENGTH * FLATTEN * scale);
  const ctx = ground.getContext("2d");
  const x = n => (n + WIDTH / 2) * scale, y = n => (NORTH - n) * FLATTEN * scale;
  const pattern = ctx.createPattern(images.ground, "repeat");
  pattern.setTransform(new DOMMatrix().scale(.225));
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ground.width, ground.height);
  ctx.fillStyle = dragon ? '#53637118' : desert ? "#ca9a4818" : moonlight ? "#233b6350" : "#29452630";
  ctx.fillRect(0, 0, ground.width, ground.height);
  for (const [thickness, color] of dragon ? [[15.6,'#a4a8a330'],[13.3,'#969c9850'],[11.8,'#a4a9a180'],[TRAIL_FILL_WIDTH,'#a3a69b80']] : desert ? [[15.6,'#dec29230'],[13.3,'#c2a16c30'],[11.8,'#c4a06b55'],[TRAIL_FILL_WIDTH,'#c9a66d70']] : moonlight ? [[15.6,"#99a9b446"],[13.3,"#8b9ca346"],[11.8,"#8c9b9f88"],[TRAIL_FILL_WIDTH,"#859393"]] : [[15.6, "#a4a06a46"], [13.3, "#ad9c6246"], [11.8, "#a5966388"], [TRAIL_FILL_WIDTH, "#9e8e60"]]) {
    ctx.beginPath();
    paths.forEach(path => smoothStroke(ctx, path, x, y));
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * TRAIL_STROKE_SCALE * scale;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [point, radius] of openAreas) {
      const rx = radius * scale * thickness / 13, ry = rx * FLATTEN;
      ctx.moveTo(x(point[0]) + rx, y(point[1]));
      ctx.ellipse(x(point[0]), y(point[1]), rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  const grit = ctx.createPattern(images.trail, "repeat");
  grit.setTransform(new DOMMatrix().scale(.40));
  ctx.globalAlpha = .22;
  ctx.beginPath();
  paths.forEach(path => smoothStroke(ctx, path, x, y));
  ctx.strokeStyle = grit;
  ctx.lineWidth = 7.9 * FLATTEN * scale;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (footprints) paintFootprints(ctx, x, y, scale);
  for (const p of props) {
    if (p.kind !== "tree" && p.kind !== "rock") continue;
    const shift = p.kind === "tree" ? p.width * 1.9 : 0;
    const radius = p.kind === "tree" ? p.width * 2.3 : p.width * 1.1;
    const shadow = ctx.createRadialGradient(x(p.x) + shift, y(p.z) + shift * .36, 0,
      x(p.x) + shift, y(p.z) + shift * .36, radius);
    shadow.addColorStop(0, desert ? '#62482a45' : "#18311e53");
    shadow.addColorStop(1, desert ? '#62482a00' : "#18311e00");
    ctx.fillStyle = shadow;
    ctx.fillRect(x(p.x) + shift - radius, y(p.z) + shift * .36 - radius, radius * 2, radius * 2);
  }
  return ground;
}

export async function openForest(canvas, progress, report, {minimap, entrance = false, landmark, onLandmark, playerAvatar, encounterAvatar, resume = {}, onContact, onBanditLoot, traveler, onMeetTraveler, onExit, onTownExit, onPray, onSearch, onVisitVillage, onVisitHealer, onStep, mist = false, ruins = false, training = true, well, onUseWell, wellEffects, wellAudio, trainingScene, storyActorURL, trapIndex = -1, onTrap, onQuest, questSites = [], zoneTheme, moonlightScene, placeMap} = {}) {
  const moonlight = zoneTheme === 'moonlight';
  const desert = zoneTheme === 'desert',dragon=zoneTheme==='dragon',layeredBiome=moonlight||desert||dragon;
  const bossRoom = placeMap === 'boss';
  const banditCamp = Boolean(onBanditLoot);
  const humanPursuit = banditCamp || Boolean(traveler);
  const village = Boolean(onVisitVillage);
  const visitService = onVisitVillage || onVisitHealer;
  const serviceEntrance = village ? VILLAGE_ENTRANCE : HEALER_ENTRANCE;
  const files = {...filenames};
  if (playerAvatar) for (const pose of ["idle", "walk", "run"]) delete files[pose];
  const feature = LANDMARKS[landmark];
  if (feature && !trainingScene && !layeredBiome) files.landmark = feature.file;
  const showEntranceGate = entrance;
  if (showEntranceGate) files.gate = "gate.webp";
  if (banditCamp) {
    if (!encounterAvatar) files.bandit = "forest-bandit-walk.webp";
    files["bandit-camp"] = "forest-bandit-camp.webp";
  } else if (traveler && !encounterAvatar) files.traveler = "forest-traveler-" + traveler.sprite + ".webp";
  else if (onContact && !traveler) files.shadow = "shadow-walk.webp";
  if (well) files.well = well.image;
  if (onPray) files.shrine = "forest-shrine.webp";
  if (village) files.village = "forest-village.webp";
  if (onSearch || banditCamp) files["glade-chest"] = "forest-bush-chest.webp";
  if (ruins) files.ruins = "forest-ruins.webp";
  if (onVisitHealer) files.healer = "forest-healer.webp";
  if (storyActorURL) files["story-actor"] = storyActorURL;
  const total = Object.keys(files).length;
  let loaded = 0;
  const images = Object.fromEntries(await Promise.all(Object.entries(files).map(([id, file]) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => { progress(++loaded / total); resolve([id, image]); };
      image.onerror = () => reject(new Error("Asset failed to load: " + file));
      image.src = id === "story-actor" ? file : forestAssetURL("art/" + file);
    }))));
  const paths = onTownExit ? [...tracks, townTrail] : bossRoom ? [tracks[0].filter(p=>p[1]<=GLADE_CENTER[1]+2)] : tracks;
  const openAreas = bossRoom ? [[SPAWN,5],[GLADE_CENTER,11.5]] : [...groundClearings];
  let props = makeScenery(showEntranceGate, paths);
  const scenery = await trainingScenery(bossRoom?null:trainingScene, desert||dragon?-1:trapIndex);
  if(layeredBiome){
    const themed=dragon?await dragonScenery(placeMap,moonlightScene,props,trapIndex):desert?await desertScenery(placeMap,moonlightScene,props,trapIndex):await moonlightScenery(placeMap,moonlightScene,props);
    props=themed.props;Object.assign(images,themed.tiles);
    canvas.dataset.forestTheme=zoneTheme;
    canvas.dataset[zoneTheme+'Scenery']=moonlightScene?.id||placeMap;
    canvas.dataset[zoneTheme+'Kit']=themed.kit;
    canvas.dataset.treeRenderer=dragon?'mountain-pine-png':desert?'sparse-cactus-png':'blender-png';
  }
  if(bossRoom){
    const room=await bossRoomScenery(dragon?'dragon':desert?'desert':moonlight?'moonlight':'training');
    // Keep foreground canopies out of the door and guardian sightline.
    props=props.filter(p=>!['tree','shrub','thicket'].includes(p.kind)||p.z>GLADE_CENTER[1]+3||p.z<GLADE_CENTER[1]-30||Math.abs(p.x-GLADE_CENTER[0])-p.width/2>14);
    Object.assign(images,room.tiles);props.push(...room.props);
    canvas.dataset.bossRoom=dragon?'dragon':desert?'desert':moonlight?'moonlight':'training';
    canvas.dataset.bossDoor='closed';
    canvas.dataset.bossStatues=String(room.props.filter(p=>p.bossStatue).length);
  }
  canvas.dataset.sceneryRenderer = "png";
  canvas.dataset.trainingScenery = bossRoom&&trainingScene?'boss':[...new Set(scenery.props.map(p => p.art.slice("training-png-".length)))].join(",");
  canvas.dataset.sceneryLayers = String((layeredBiome||bossRoom?props:scenery.props).filter(p => p.layered).length);
  canvas.dataset.cameraMode = "layered-orthographic";
  Object.assign(images, scenery.tiles);
  props.push(...scenery.props);
  if (trainingScene) openAreas.push([GLADE_CENTER, 16]);
  if (storyActorURL) props.push({kind: "training-prop", art: "story-actor", x: 0, z: -9.5, width: 7.5});
  if (questSites.length) {
    const questArt=await questScenery(questSites);
    Object.assign(images,questArt.tiles);
    props=props.filter(p=>!['tree','shrub','grass','rock','wildflower'].includes(p.kind)||!questSites.some(s=>distance(p.x,p.z,s.position)<10+p.width*.5));
    props.push(...questArt.props);
    for(const site of questSites)openAreas.push([site.position,5.5]);
  }
  canvas.dataset.questSites=JSON.stringify(questSites.map(s=>({id:s.id,label:s.label,position:s.position})));
  const thicket = onSearch && !mist && !ruins ? thicketLayout.map(([x, z, width, variant]) => ({
    kind: "thicket", art: "shrub-" + variant, x: x + GLADE_CENTER[0], z: z + GLADE_CENTER[1],
    width, canopy: thicketCanopies[variant - 1], swayX: 0, swayY: 0, revealX: 0
  })).map(p=>dragon?dragonThicket(p):desert?desertThicket(p):moonlight?moonlightThicket(p):p) : [];
  props.push(...thicket);
  if (feature && !trainingScene && !layeredBiome) {
    const [x, z] = GLADE_CENTER;
    props.push({kind: "landmark", art: "landmark", x, z, width: feature.width});
  }
  if (banditCamp && !layeredBiome) props.push(BANDIT_CAMP);
  if (ruins && !layeredBiome) props.push(RUINS);
  let pool, rim, lotus;
  if (well) {
    const [x, z] = GLADE_CENTER;
    const height = WELL_WIDTH * images.well.height / images.well.width;
    // Place the painted water, rim and lotus on the same projected ground plane.
    const projectEllipse = ([cx, cy, rx, ry]) => ({
      x: x + (cx - .5) * WELL_WIDTH,
      z: z - (cy - WELL_PIVOT) * height / FLATTEN,
      radiusX: rx * WELL_WIDTH,
      radiusZ: ry * height / FLATTEN
    });
    pool = projectEllipse(wellEffects.surface);
    if (wellEffects.rim) {
      const {rise, crest, base} = wellEffects.rim;
      rim = {height: rise * height, crest: projectEllipse(crest), base: projectEllipse(base)};
    }
    if (wellEffects.lotus) lotus = projectEllipse(wellEffects.lotus);
    props.push({kind: "well", art: "well", x, z, width: WELL_WIDTH});
  }
  if (onPray) {
    const [x, z] = GLADE_CENTER;
    props.push({kind: "shrine", art: "shrine", x, z, width: 12.3, radius: 3.6, renderHidden:layeredBiome});
  }
  if (village) {
    props.push({...VILLAGE,renderHidden:layeredBiome});
  }
  if (onTownExit) {
    openAreas.push([TOWN_EXIT, 7]);
    props = props.filter(prop => prop.kind !== "tree"
      || trailDistance(prop.x, prop.z, townTrails) > 12 + prop.width * .25);
    props.push({kind: "direction-sign", art: "direction-sign", x: 8.8, z: -7.3, width: 5.6, radius: .35, label: "กลับเมือง →"});
  }
  if (onVisitHealer) props.push({...HEALER,renderHidden:layeredBiome});
  // Moonlight kits append individual parts after the already-sorted woodland.
  // Sort those parts too before interleaving them with waiting/moving actors.
  if (layeredBiome || well || onPray || visitService || onTownExit || onSearch || banditCamp || feature || scenery.props.length || onQuest) {
    props.sort((a, b) => b.z - a.z);
  }
  const obstacles = props.filter(p => p.radius);
  for(const prop of props)if(!prop.renderHidden)prop.effects=createPropEffects(images[prop.art],prop.source,propEffectSpec(prop));
  canvas.dataset.animatedFireProps=String(props.filter(p=>p.effects?.kinds.includes('fire')).length);
  canvas.dataset.animatedWaterProps=String(props.filter(p=>p.effects?.kinds.includes('water')).length);
  const travelerActor = traveler ? {
    x: GLADE_CENTER[0], z: GLADE_CENTER[1], radius: .72, flank: 0, wait: 0, phase: 0, facing: 1
  } : null;
  if (travelerActor && !onContact) obstacles.push(travelerActor);
  if (banditCamp) {
    for (const side of [-1, 1]) obstacles.push({x: BANDIT_CAMP.x + side * 4.1, z: BANDIT_CAMP.z, radius: 2.6});
    obstacles.push({x: BANDIT_CAMP.x, z: BANDIT_CAMP.z + 2.4, radius: 2.65});
  }
  if (village) {
    for (const side of [-1, 1]) obstacles.push({x: VILLAGE.x + side * 5.9, z: VILLAGE.z - 1, radius: 2.9});
  }
  if (onVisitHealer) {
    for (const side of [-1, 1]) obstacles.push({x: HEALER.x + side * 4.1, z: HEALER.z + 1.1, radius: 2.35});
  }
  if (ruins) {
    for (const side of [-1, 1]) obstacles.push({x: RUINS.x + side * 4.3, z: RUINS.z + 2.5, radius: 2.65});
  }
  const gladeChest = ruins ? RUINS_CHEST : GLADE_CHEST;
  const searchPoint = ruins ? RUINS_ENTRY : GLADE_CENTER;
  const ground = makeGround(images, props, paths, openAreas, Boolean(onContact && !humanPursuit),moonlight,desert,dragon), ctx = canvas.getContext("2d", { alpha: false });
  const mini = minimap, map = mini.getContext("2d");
  const start = resume.retreat ? FORK
    : Array.isArray(resume.position) && resume.position.length === 2 && resume.position.every(Number.isFinite) ? resume.position : SPAWN;
  const player = { x: start[0], z: start[1], direction: 4, phase: 0, moving: false, running: false, depth: 0, rim: 0 };
  const mistPuff = mist ? makeMistPuff() : null;
  let mistStrength = 1;
  const camera = { x: player.x, z: player.z };
  let pursuers = resume.completed ? [] : banditCamp ? [{x: BANDIT_CAMP.x, z: BANDIT_CAMP.z - 1.5, flank: 0, wait: 0, phase: 0, facing: 1}]
    : onContact ? (travelerActor ? [travelerActor] : spawnShadows(training)) : [];
  let battle = false, wellUsed = Boolean(resume.completed), paused = false;
  let searchOutcome = resume.chest ? "chest" : resume.completed ? "clear" : "";
  let landmarkReached = Boolean(resume.completed);
  let trapReached = Boolean(resume.completed);
  let questReached = null;
  let banditOutcome = resume.banditOutcome || "";
  let travelerOutcome = travelerActor && !onContact ? (resume.completed ? "met" : "waiting") : resume.travelerOutcome || "";
  let atServiceEntrance = false;
  let lastDryStep = -Infinity, lastDryStepAt = -Infinity;
  let prayedAt = resume.completed ? -Infinity : undefined;
  const reduceMotion = onPray && matchMedia("(prefers-reduced-motion: reduce)");
  const keys = new Set();
  const input = new AbortController();
  const listenerOptions = {signal: input.signal};
  let axes = [0, 0], visited = 0, width, height, zoom, baseZoom, dpr, prior = 0, nextUI = 0;
  let animation;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    baseZoom = zoom = clamp(width / 29, 10.8, 15.5);
    // Resizing a canvas clears it, even while a native conversation pauses walking.
    if (paused) { paint(); paintMap(); }
  }

  function walkable(x, z) {
    if (x < -WIDTH / 2 + .48 || x > WIDTH / 2 - .48 || z < SOUTH + .48 || z > NORTH - .48) return false;
    if (lotus && ellipseRadius(x, z, lotus) < 1) return false;
    return !obstacles.some(p => Math.abs(p.x - x) < p.radius + .36
      && Math.abs(p.z - z) < p.radius + .36 && distance(x, z, [p.x, p.z]) < p.radius + .36);
  }

  function updateWellPosition() {
    if (!pool) return;
    const {x, z} = player;
    const waterRadius = ellipseRadius(x, z, pool);
    player.depth = smoothstep(Math.max(0, 1 - waterRadius));
    player.rim = 0;
    if (!rim || waterRadius <= 1) return;
    const outerRadius = ellipseRadius(x, z, rim.base);
    if (outerRadius >= 1) return;
    const crestRadius = ellipseRadius(x, z, rim.crest);
    const progress = crestRadius <= 1
      ? (waterRadius - 1) / (waterRadius - crestRadius)
      : (1 - outerRadius) / (crestRadius - outerRadius);
    player.rim = smoothstep(clamp(progress, 0, 1));
  }

  function area() {
    const {x, z} = player;
    if (player.depth > 0) return "In the Well";
    if (distance(x, z, WEST) < 5) { visited |= 1; return "Fernstone Clearing"; }
    if (distance(x, z, EAST) < 5) { visited |= 2; return "Sunbloom Clearing"; }
    if (thicket.length && distance(x, z, GLADE_CENTER) < BUSH_RADIUS) return "The Thicket";
    if (mist && distance(x, z, GLADE_CENTER) < MIST_RADIUS) return "The Mist";
    if (ruins && distance(x, z, GLADE_CENTER) < GLADE_RADIUS) return "The Ruins";
    if (banditCamp && distance(x, z, GLADE_CENTER) < GLADE_RADIUS) return "Bandit Camp";
    if (traveler && distance(x, z, GLADE_CENTER) < GLADE_RADIUS) return "Traveler Glade";
    if (distance(x, z, FORK) < 6.3) return "The Fork";
    if (well && distance(x, z, GLADE_CENTER) < GLADE_RADIUS) return "The Well";
    if (onPray && distance(x, z, GLADE_CENTER) < GLADE_RADIUS) return "The Shrine";
    if (onVisitHealer && distance(x, z, HEALER_ENTRANCE) < 7) return "Healer Pavilion";
    if (village && distance(x, z, VILLAGE_ENTRANCE) <= 4.5) return "Village Entrance";
    if (onTownExit && x > 6 && trailDistance(x, z, townTrails) < 6) return "Town Trail";
    if (distance(x, z, SPAWN) < 5.6) return "South Entrance";
    if (z > FORK[1] + 3.5 && Math.abs(x) > 3.5) return x < 0 ? "Fernstone Trail" : "Sunbloom Trail";
    return "Woodland Trail";
  }

  function step(dt) {
    if (battle) return;
    const previousX = player.x, previousZ = player.z;
    const has = (...names) => Number(names.some(name => keys.has(name)));
    const keyX = has("d", "arrowright") - has("a", "arrowleft");
    const keyZ = has("w", "arrowup") - has("s", "arrowdown");
    const keyboard = keyX !== 0 || keyZ !== 0;
    const [vx, vz] = keyboard ? [keyX, keyZ] : axes;
    const strength = Math.min(Math.hypot(vx, vz), 1);
    player.moving = false;
    player.running = strength > .12 && (keys.has("shift") ||
      (!keyboard && strength > (player.running ? KEEP_RUNNING_TILT : RUN_TILT)));
    if (strength > .12) {
      player.direction = (-Math.atan2(vx, -vz) / (Math.PI / 4) + 8) % 8;
      const length = Math.hypot(vx, vz);
      const landSpeed = keyboard ? (player.running ? RUN_SPEED : WALK_SPEED)
        : WALK_SPEED * Math.min(1, strength / RUN_TILT)
          + (RUN_SPEED - WALK_SPEED) * Math.max(0, (strength - RUN_TILT) / (1 - RUN_TILT));
      const slowdown = Math.min(1, player.depth * 2.5);
      const waterSpeed = Math.min(landSpeed, WALK_SPEED) * .55;
      const brush = thicket.length ? smoothstep(clamp((BUSH_RADIUS - distance(player.x, player.z, GLADE_CENTER)) / 3, 0, 1)) : 0;
      const speed = (landSpeed + (waterSpeed - landSpeed) * slowdown) * (1 - .24 * player.rim) * (1 - .47 * brush);
      const dx = vx / length * speed * dt;
      const dz = vz / length * speed * dt / FLATTEN;
      if (walkable(player.x + dx, player.z)) player.x += dx;
      if (walkable(player.x, player.z + dz)) player.z += dz;
      player.moving = Math.hypot(player.x - previousX, player.z - previousZ) > .0001;
      if (player.moving) player.phase += dt * (speed / WALK_SPEED) * WALK_PHASE_RATE;
    }
    if (thicket.length) bendThicket(dt, player.x - previousX, (previousZ - player.z) * FLATTEN);
    const follow = 1 - Math.exp(-9 * dt);
    // Open the framing gently near a layered place so its raised roof fits above
    // the player. This affects projection only; movement and event ranges stay put.
    const placeFocus = trainingScene || layeredBiome ? 1-smoothstep(clamp((distance(player.x,player.z,GLADE_CENTER)-7)/12,0,1)) : 0;
    zoom += (baseZoom*(1-.06*placeFocus)-zoom)*follow;
    camera.x += (player.x - camera.x) * follow;
    camera.z += (player.z + 3*placeFocus - camera.z) * follow;
  }

  function bendThicket(dt, dx, dy) {
    const length = Math.hypot(dx, dy);
    const ease = 1 - Math.exp(-11 * dt);
    for (const shrub of thicket) {
      const reach = shrub.width * .72;
      const gap = Math.hypot(player.x - shrub.x, (player.z - shrub.z) * FLATTEN);
      const push = length > .0001 ? smoothstep(clamp(1 - gap / reach, 0, 1)) / length : 0;
      shrub.swayX += (dx * push - shrub.swayX) * ease;
      shrub.swayY += (dy * push - shrub.swayY) * ease;
      let revealX = 0;
      if (searchOutcome === "chest" && shrub.z < GLADE_CHEST.z) {
        const side = shrub.x - GLADE_CHEST.x;
        const chestGap = Math.hypot(side, (shrub.z - GLADE_CHEST.z) * FLATTEN);
        revealX = (side < 0 ? -1 : 1) * smoothstep(clamp((3.5 - chestGap) / 2, 0, 1));
      }
      shrub.revealX += (revealX - shrub.revealX) * ease;
    }
  }

  function chase(dt) {
    if (battle) return;
    for (const pursuer of pursuers) {
      pursuer.wait -= dt;
      if (pursuer.wait > 0) continue;
      const dx = player.x - pursuer.x, dz = (player.z - pursuer.z) * FLATTEN;
      const gap = Math.hypot(dx, dz);
      if (gap <= 2.25) {
        battle = true;
        axes = [0, 0];
        keys.clear();
        player.moving = player.running = false;
        onContact(pursuers.length);
        return;
      }
      // Keep the pack spread out on the approach, then converge near the player.
      const approachX = dx + pursuer.flank * Math.min(1, gap / 9);
      const length = Math.hypot(approachX, dz);
      if (length === 0) continue;
      const speed = humanPursuit ? 8.3 * 1.7 : SHADOW_CHASE_SPEED;
      const stride = speed * dt / length;
      const nextX = pursuer.x + approachX * stride, nextZ = pursuer.z + dz * stride / FLATTEN;
      if (walkable(nextX, pursuer.z)) pursuer.x = nextX;
      if (walkable(pursuer.x, nextZ)) pursuer.z = nextZ;
      pursuer.phase += dt * 16;
      pursuer.heading = (-Math.atan2(approachX, -dz) / (Math.PI / 4) + 8) % 8;
      if (Math.abs(approachX) > .2) pursuer.facing = approachX < 0 ? -1 : 1;
    }
  }

  const viewCenter = (center, low, high, before, after) =>
    low + before <= high - after ? clamp(center, low + before, high - after) : (low + high) / 2;
  let centerX, centerZ;
  const screenX = x => width * .5 + (x - centerX) * zoom;
  const screenY = z => height * .56 - (z - centerZ) * zoom * FLATTEN;
  const sceneryMotion = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)');

  function paintProp(prop) {
    if(prop.renderHidden)return;
    const x = screenX(prop.x), y = screenY(prop.z) - (prop.elevation || 0) * zoom;
    const art = images[prop.art], w = prop.width * zoom;
    const {canopy} = prop;
    const source = prop.source || [0, 0, art.width, art.height];
    const h = canopy ? COUNTRY_PLAYER_SIZE * canopy.scale : w * source[3] / source[2];
    const pivot = {tree: .89, gate: .93, grass: .79, rock: .79, wildflower: .78, shrub: .84, thicket: .96, "glade-chest": .94, well: WELL_PIVOT, shrine: .96, ruins: .91, village: .77, healer: .98, "bandit-camp": .94, "direction-sign": .91, landmark: .94, "training-prop": .94};
    const left = x - w / 2, top = y - h * (prop.pivot ?? pivot[prop.kind]);
    if (left + w < 0 || left > width || top + h < 0 || top > height) return;
    const targetAlpha = layerOpacity(prop, player, {left,top,right:left+w,bottom:top+h}, {
      left:screenX(player.x)-COUNTRY_PLAYER_SIZE*.23, right:screenX(player.x)+COUNTRY_PLAYER_SIZE*.23,
      top:screenY(player.z)-COUNTRY_PLAYER_SIZE*.92, bottom:screenY(player.z)-8
    });
    const now = performance.now(), elapsed = Math.min(.1,(now-(prop.paintedAt ?? now))/1000);
    prop.paintedAt = now;
    prop.opacity = sceneryMotion.matches ? targetAlpha
      : (prop.opacity ?? targetAlpha) + (targetAlpha-(prop.opacity ?? targetAlpha))*(1-Math.exp(-elapsed*12));
    ctx.save();
    ctx.globalAlpha *= prop.opacity;
    if (canopy) {
      ctx.save();
      ctx.translate(x + (prop.swayX * .12 + prop.revealX * .5) * w, y + prop.swayY * w * .16);
      ctx.rotate(prop.swayX * .32);
      const crop=prop.source||[0,canopy.top,art.width,canopy.bottom-canopy.top];
      ctx.drawImage(art, ...crop, -w / 2, top - y, w, h);
      ctx.restore();
    } else {
      if(prop.effects&&!sceneryMotion.matches)ctx.drawImage(prop.effects.base,left,top,w,h);
      else ctx.drawImage(art, ...source, left, top, w, h);
    }
    prop.effects?.paint(ctx,left,top,w,h,prior,sceneryMotion.matches);
    ctx.restore();
    if (prop.label) {
      ctx.save();
      ctx.font = "700 13px system-ui";
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#24301a";
      ctx.lineWidth = 4;
      ctx.strokeText(prop.label, x, top - 5);
      ctx.fillStyle = "#ffebbb";
      ctx.fillText(prop.label, x, top - 5);
      ctx.restore();
    }
    if (prop.kind === "well") {
      const bather = player.depth > 0 ? {
        x: screenX(player.x), y: screenY(player.z), depth: player.depth, moving: player.moving
      } : null;
      wellEffects.paint(ctx, left, top, w, h, prior, bather);
    }
    if (prop.kind === "shrine" && prayedAt !== undefined && !reduceMotion.matches) {
      paintBlessing(x, y, w, h);
    }
  }

  function paintBlessing(x, y, w, h) {
    const elapsed = (prior - prayedAt) / 1000;
    if (elapsed >= 1.35) return;
    ctx.save();
    ctx.fillStyle = "#ffe7a1";
    ctx.shadowColor = "#ffc86a";
    ctx.shadowBlur = 12;
    ctx.textAlign = "center";
    for (let i = 0; i < 7; i++) {
      const time = clamp((elapsed - i * .044) / 1.05, 0, 1);
      ctx.globalAlpha = Math.sin(time * Math.PI);
      ctx.font = `${16 + 9 * time}px Georgia, serif`;
      ctx.fillText("✧", x + Math.sin(i * 2.4) * w * (.28 + .14 * time),
        y - h * (.22 + i % 3 * .12 + time * .42));
    }
    ctx.restore();
  }

  function paintPlayer() {
    const lift = rim ? player.rim * rim.height * zoom : 0;
    const x = screenX(player.x), y = screenY(player.z) - lift, cell = 160;
    const size = COUNTRY_PLAYER_SIZE;
    const {depth} = player;
    if (depth < .14) {
      ctx.fillStyle = `rgba(21,42,28,${.4 * (1 - depth / .14)})`;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, size * .27, size * .079, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (playerAvatar) {
      canvas.dataset.avatarRenderer = playerAvatar.renderer;
      canvas.dataset.avatarIdentity = playerAvatar.current?.key || "";
      const submerged = depth * size * .36;
      ctx.save();
      if (submerged > 0) {
        ctx.beginPath();
        ctx.rect(x - size, y - size, size * 2, size);
        ctx.clip();
      }
      playerAvatar.draw(ctx, x, y + submerged, size, player.direction, player.phase,
        player.moving, player.running && !depth && player.rim < .2);
      ctx.restore();
      return;
    }
    const art = images[player.moving ? (player.running && !depth && player.rim < .2 ? "run" : "walk") : "idle"];
    const direction = Math.round(player.direction) % 8;
    const column = player.moving ? Math.floor(player.phase) % 12 : direction % 4;
    const row = player.moving ? direction : Math.floor(direction / 4);
    const fraction = 1 - .67 * depth;
    const top = y - size * .9083 + size * .5783 * depth;
    ctx.drawImage(art, column * cell, row * cell, cell, cell * fraction, x - size * .5, top, size, size * fraction);
  }

  function paintLotus() {
    const art = images.well, w = WELL_WIDTH * zoom, h = w * art.height / art.width;
    const left = screenX(GLADE_CENTER[0]) - w / 2;
    const top = screenY(GLADE_CENTER[1]) - h * WELL_PIVOT;
    if (left + w < 0 || left > width || top + h < 0 || top > height) return;
    wellEffects.paintLotus(ctx, art, left, top, w, h);
  }

  function paintEncounterActor(actor, walking = true) {
    const {x, z, facing, phase} = actor;
    const size = humanPursuit ? COUNTRY_BANDIT_SIZE : COUNTRY_SHADOW_SIZE;
    if (encounterAvatar) {
      encounterAvatar.draw(ctx, screenX(x), screenY(z), size, actor.heading ?? 0, phase, walking, walking);
      return;
    }
    const cell = traveler ? 192 : 256;
    const frame = traveler
      ? (walking ? TRAVELER_WALK_FRAMES[Math.floor(phase * .57) % TRAVELER_WALK_FRAMES.length] : 0)
      : Math.floor(phase) % 8;
    ctx.save();
    ctx.translate(screenX(x), screenY(z));
    ctx.scale(facing, 1);
    ctx.fillStyle = "#13201b66";
    ctx.beginPath();
    ctx.ellipse(0, 0, size * .32, size * .085, 0, 0, Math.PI * 2);
    ctx.fill();
    const art = traveler ? images.traveler : banditCamp ? images.bandit : images.shadow;
    ctx.drawImage(art, frame % 4 * cell, Math.floor(frame / 4) * cell, cell, cell,
      -size / 2, -size * (traveler ? 185 / 192 : .923), size, size);
    ctx.restore();
  }

  function paintMist() {
    const [centerX, centerZ] = GLADE_CENTER;
    const time = prior / 1000;
    ctx.save();
    for (const [index, [dx, dz, spanX, spanZ, opacity]] of mistBanks.entries()) {
      const drift = Math.sin(time * .54 + index * 1.8) * 1.4;
      const w = spanX * zoom, h = spanZ * zoom * FLATTEN;
      ctx.globalAlpha = opacity * mistStrength;
      ctx.drawImage(mistPuff, screenX(centerX + dx + drift) - w / 2, screenY(centerZ + dz + drift * .3) - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    const gap = distance(player.x, player.z, GLADE_CENTER);
    const approach = clamp((MIST_APPROACH - gap) / (MIST_APPROACH - GLADE_SEARCH_RADIUS), 0, 1);
    const density = (.23 + .77 * smoothstep(approach)) * mistStrength;
    const x = screenX(player.x), y = screenY(player.z) - 40;
    const haze = ctx.createRadialGradient(x, y, 12, x, y, 185 - density * 130);
    const dust=desert?'209,177,120':'205,222,215';
    haze.addColorStop(0, `rgba(${dust},0)`);
    haze.addColorStop(.43, `rgba(${dust},${density * .27})`);
    haze.addColorStop(1, `rgba(${desert?'201,169,112':'198,216,208'},${density * .98})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function paint() {
    const horizontal = width / (2 * zoom), vertical = height / (zoom * FLATTEN);
    centerX = viewCenter(camera.x, -WIDTH / 2, WIDTH / 2, horizontal, horizontal);
    centerZ = viewCenter(camera.z, SOUTH, NORTH, vertical * .44, vertical * .56);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = dragon ? '#68717a' : desert ? '#c9a771' : "#2b5034";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(ground, screenX(-WIDTH / 2), screenY(NORTH), WIDTH * zoom, LENGTH * FLATTEN * zoom);
    const north = centerZ + (height * .56 + 34) / (zoom * FLATTEN);
    const south = centerZ - (height * .44 + 245) / (zoom * FLATTEN);
    // Draw the player above the well artwork while on the rim or in the water.
    const wellSupportsPlayer = player.depth > 0 || player.rim > 0;
    // Mud, puddles and pit openings are ground art beneath standing actors.
    for (const prop of props) if (prop.ground) paintProp(prop);
    const actors = [{z: wellSupportsPlayer ? GLADE_CENTER[1] : player.z, paint: paintPlayer}];
    if (lotus) {
      // Both sprites sit above the basin. Their true ground positions decide who is in front.
      actors.splice(player.z >= lotus.z ? 1 : 0, 0, {z: GLADE_CENTER[1], paint: paintLotus});
    }
    for (const pursuer of pursuers) actors.push({z: pursuer.z, paint: () => paintEncounterActor(pursuer)});
    if (travelerActor && !onContact) actors.push({z: travelerActor.z, paint: () => paintEncounterActor(travelerActor, false)});
    if (searchOutcome === "chest") actors.push({z: gladeChest.z, paint: () => paintProp(gladeChest)});
    if (banditOutcome === "loot") actors.push({z: BANDIT_LOOT.z, paint: () => paintProp(BANDIT_LOOT)});
    actors.sort((a, b) => b.z - a.z);
    let actor = 0;
    for (const prop of props) {
      if (prop.ground) continue;
      if (!prop.layered && prop.kind !== "well" && (prop.z > north || prop.z < south)) continue;
      while (actor < actors.length && prop.z < actors[actor].z) actors[actor++].paint();
      paintProp(prop);
    }
    while (actor < actors.length) actors[actor++].paint();
    canvas.dataset.fadedLayers = String(props.filter(p => p.layered && p.opacity < .9).length);
    if (mist) paintMist();
  }

  function paintMap() {
    const w = mini.width, h = mini.height;
    const x = n => (n + WIDTH / 2) / WIDTH * w, y = n => (NORTH - n) / LENGTH * h;
    map.drawImage(ground, 0, 0, w, h);
    map.fillStyle = "#1530208f";
    map.fillRect(0, 0, w, h);
    map.beginPath();
    (bossRoom?paths:tracks).forEach(path => smoothStroke(map, path, x, y));
    map.strokeStyle = "#dac190";
    map.lineWidth = 3.5;
    map.lineJoin = map.lineCap = "round";
    map.stroke();
    if (onTownExit) {
      map.beginPath();
      smoothStroke(map, townTrail, x, y);
      map.strokeStyle = "#ffc773";
      map.stroke();
    }
    const markers = bossRoom ? [] : [
      [WEST, 4, visited & 1 ? "#baf196" : "#dac190"],
      [EAST, 4, visited & 2 ? "#baf196" : "#dac190"]
    ];
    if (well) markers.push([GLADE_CENTER, 5, well.color]);
    if (onPray) markers.push([GLADE_CENTER, 5, "#f2cd85"]);
    if (village) markers.push([VILLAGE_ENTRANCE, 5, "#f2cd85"]);
    if (onVisitHealer) markers.push([HEALER_ENTRANCE, 5, "#a5e0a8"]);
    if (banditCamp) markers.push([[BANDIT_LOOT.x, BANDIT_LOOT.z], 5, banditOutcome === "loot" ? "#ffd572" : "#dc8a60"]);
    if (travelerOutcome === "waiting") markers.push([GLADE_CENTER, 5, "#f2cd85"]);
    if (traveler && pursuers.length) markers.push([[travelerActor.x, travelerActor.z], 5, "#eb9e84"]);
    if (onTownExit) markers.push([TOWN_EXIT, 5, "#ffc773"]);
    if (onSearch) markers.push([searchPoint, 5, mist ? "#b7e2de" : ruins ? "#ead3a4" : "#a6d686"]);
    if (feature) markers.push([GLADE_CENTER, 5, "#f2cd85"]);
    if (trapIndex >= 0) markers.push([[0, -29], 5, "#efaa86"]);
    for(const site of questSites)markers.push([site.position, 5, "#9fdce2"]);
    markers.push([[player.x, player.z], 5, "#faffd1"]);
    for (const [point, radius, color] of markers) {
      map.beginPath();
      map.fillStyle = color;
      map.arc(x(point[0]), y(point[1]), radius, 0, Math.PI * 2);
      map.fill();
    }
  }

  const reset = () => {
    if (battle) return;
    if (onContact && !humanPursuit && !resume.completed) pursuers = spawnShadows(training);
    returnToEntrance();
  };
  const returnToEntrance = (position = SPAWN) => {
    [player.x, player.z] = position;
    Object.assign(camera, {x: player.x, z: player.z});
    player.direction = 4;
    player.running = false;
    player.depth = 0;
    player.rim = 0;
    lastDryStep = -Infinity;
    lastDryStepAt = -Infinity;
    axes = [0, 0];
  };
  const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"];
  window.addEventListener("keydown", event => {
    if (paused) return;
    const key = event.key.toLowerCase();
    if (movementKeys.includes(key)) { keys.add(key); event.preventDefault(); }
    if (key === "r") reset();
  }, listenerOptions);
  window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()), listenerOptions);
  window.addEventListener("blur", () => { keys.clear(); axes = [0, 0]; }, listenerOptions);
  window.addEventListener("resize", resize, listenerOptions);
  resize();

  function loop(now) {
    animation = requestAnimationFrame(loop);
    if (paused) return;
    const dt = prior ? Math.min(.05, (now - prior) / 1000) : 0;
    prior = now;
    step(dt);
    chase(dt);
    updateWellPosition();
    if (player.moving) {
      if (player.depth > 0) {
        wellAudio?.playStep();
      } else if (player.phase - lastDryStep >= FOOTSTEP_PHASE_INTERVAL) {
        const {x, z, running} = player;
        const onTrail = trailDistance(x, z, paths, FLATTEN) <= TRAIL_FILL_WIDTH * TRAIL_STROKE_SCALE / 2
          || openAreas.some(([point, radius]) => distance(x, z, point) <= radius * TRAIL_FILL_WIDTH / 13);
        const audioScale = onTrail && running ? TRAIL_RUN_AUDIO_SCALE : 1;
        const stepDue = running && !onTrail
          ? now - lastDryStepAt >= WALK_FOOTSTEP_INTERVAL_MS
          : player.phase - lastDryStep >= FOOTSTEP_PHASE_INTERVAL / audioScale;
        if (stepDue) {
          lastDryStep = player.phase;
          lastDryStepAt = now;
          onStep?.(running, onTrail, audioScale);
        }
      }
    }
    if (onQuest) {
      const near = questSites.find(site=>distance(player.x,player.z,site.position)<=3.5);
      if (!near) questReached = null;
      else if (questReached!==near.id && player.moving) { questReached = near.id; onQuest(near.id); return; }
    }
    if (onTrap && !trapReached && player.moving && distance(player.x, player.z, [0, -29]) <= 3.2) {
      trapReached = true;
      const outcome = onTrap();
      battle = outcome === "battle";
      if (onSearch && !battle) searchOutcome = outcome || "clear";
      // The native trap dialog may open combat. Stop this frame before another contact.
      return;
    }
    const wellDistance = well ? distance(player.x, player.z, GLADE_CENTER) : Infinity;
    if (!wellUsed && player.depth >= .08) {
      wellUsed = true;
      wellEffects.activate(now, (player.x - pool.x) / pool.radiusX, (pool.z - player.z) / pool.radiusZ);
      onUseWell();
    }
    if (onPray && prayedAt === undefined && distance(player.x, player.z, GLADE_CENTER) <= 5.2) {
      prayedAt = now;
      onPray();
    }
    if (visitService) {
      const entered = distance(player.x, player.z, serviceEntrance) < 2;
      if (!entered) atServiceEntrance = false;
      else if (player.moving && !atServiceEntrance) {
        atServiceEntrance = true;
        visitService();
      }
    }
    if (onSearch && !searchOutcome && player.moving && distance(player.x, player.z, searchPoint) <= GLADE_SEARCH_RADIUS) {
      searchOutcome = onSearch() || "clear";
      battle = searchOutcome === "battle";
    }
    if (banditOutcome === "loot" && player.moving && distance(player.x, player.z, [BANDIT_LOOT.x, BANDIT_LOOT.z]) <= 2.25) {
      if (onBanditLoot()) banditOutcome = "claimed";
    }
    if (travelerOutcome === "waiting" && player.moving && distance(player.x, player.z, GLADE_CENTER) <= 2.25) {
      if (onMeetTraveler()) travelerOutcome = "met";
    }
    if (feature && !landmarkReached && player.moving && distance(player.x, player.z, GLADE_CENTER) <= feature.reach) {
      landmarkReached = Boolean(onLandmark());
    }
    if (mist && (searchOutcome === "chest" || searchOutcome === "opened")) {
      mistStrength += (.33 - mistStrength) * (1 - Math.exp(-3.3 * dt));
    }
    paint();
    const label = area();
    if (now >= nextUI) {
      nextUI = now + 100;
      canvas.dataset.moving = String(player.moving);
      canvas.dataset.running = String(player.running && player.moving);
      wellAudio?.updateDistance(wellDistance);
      paintMap();
      const searchStatus = searchOutcome === "chest" && distance(player.x, player.z, [gladeChest.x, gladeChest.z]) <= 4.2
        ? "near-chest" : searchOutcome;
      const pursuitStatus = pursuers.length ? (pursuers[0].wait > 0 ? "tracks" : "chase") : "clear";
      const encounter = battle ? "battle" : banditOutcome || travelerOutcome || (onContact ? pursuitStatus : searchStatus);
      report(player.x, player.z, visited, label, player.running && player.moving && !player.depth && player.rim < .2,
        encounter, pursuers.length);
    }
    if (!battle && player.moving) {
      if (onTownExit && distance(player.x, player.z, TOWN_EXIT) <= 2.8) onTownExit();
      else if (!onExit) return;
      else if (reachedTrailEnd(player.x, player.z, WEST, tracks[1].at(-2), clearings[2][1])) onExit("left");
      else if (reachedTrailEnd(player.x, player.z, EAST, tracks[2].at(-2), clearings[3][1])) onExit("right");
    }
  }
  animation = requestAnimationFrame(loop);
  return {
    position: () => [player.x, player.z],
    restorePosition(position) {
      if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isFinite)) return;
      [player.x, player.z] = position;
      Object.assign(camera, {x: player.x, z: player.z});
      player.moving = player.running = false;
      axes = [0, 0];
      keys.clear();
    },
    setStick: (x, z) => { if (!battle) axes = [x, z]; },
    setPaused(value) {
      if (paused === value) return;
      paused = value;
      prior = 0;
      nextUI = 0;
      axes = [0, 0];
      keys.clear();
      if (paused) wellAudio?.updateDistance(Infinity);
    },
    resize,
    reset,
    finishGladeChest() { if (searchOutcome === "chest") searchOutcome = "opened"; },
    dispose() {
      cancelAnimationFrame(animation);
      input.abort();
    },
    finishBattle: (outcome, chestFound) => {
      if (!battle) return;
      pursuers = [];
      battle = false;
      if (banditCamp) banditOutcome = outcome === "win" ? "loot" : "escaped";
      if (traveler) travelerOutcome = outcome === "win" ? "clear" : "escaped";
      if (onSearch) searchOutcome = chestFound ? "chest" : ruins && outcome === "flee" ? "escaped" : "clear";
      if (outcome === "flee") returnToEntrance(FORK);
    }
  };
}
