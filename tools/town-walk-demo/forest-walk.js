// World forest presentation. The menu's original runtime owns player state, combat and saves.
const ForestWalk = (() => {
  const assets = new URL("../../assets/forest-walk/", document.currentScript.src);
  const maps = {beast: "footprints", bandit: "bandit", stranger: "stranger", shrine: "shrine",
    spring: "spring", revival: "revival", cleanse: "cleanse", village: "village", hospital: "hospital",
    exit: "exit", bush: "bush", mist: "mist", ruins: "ruins"};
  const searches = ["bush", "mist", "ruins"];
  const services = ["village", "hospital"];
  let modules, current;
  const footsteps = new Map();

  function initialMap() {
    return {map: "entrance", phase: "cleared"};
  }

  function active(zone, walk) {
    return S.zone === zone && zone.walk === walk && S.screen === "zone" && !S.battle
      && !S.ui.trapNotice && !document.querySelector("#tutorialCoach.tutorial-modal");
  }

  function nativeEvent(zone) {
    return zone.secretSession || zone.specialSession || zone.warpGate || zone.riddleSession || zone.falseBoss || WorldTales.block();
  }

  function view(legacy) {
    const zone = S.zone, walk = zone?.walk;
    if (!walk || walk.showService || nativeEvent(zone)) return legacy();
    if (walk.map === "legacy") {
      if (!zone.fork || zone.ev || zone.depth >= ZDEPTH) return legacy();
      zone.walk = initialMap();
    }
    return '<section id="forest-walk-mount" class="forest-walk-mount" aria-label="เดินสำรวจป่า"></section>';
  }

  function next(zone, walk, side) {
    if (!active(zone, walk) || walk.phase === "resolving" || (walk.phase === "pending" && walk.map === "bandit")) return;
    if (walk.phase === "pending") {
      zone.depth++;
      zlog(`ก้าวที่ ${zone.depth}: เดินผ่าน ${(EV[walk.fork[walk.side].k]?.n || "เหตุการณ์ในป่า")}`);
    }
    zone.ev = null;
    if (!zone.fork) newFork();
    const slot = side === "left" ? 0 : 1;
    const door = zone.fork?.[slot];
    if (!door) {
      zone.walk = {map: "boss", phase: "pending"};
    } else {
      const selected = {map: maps[door.k] || "landmark", phase: "pending", fork: zone.fork, side: slot};
      if (door.k === "stranger") {
        selected.disposition = Math.random();
      }
      prepareHuman(zone, selected);
      zone.fork = null;
      zone.walk = selected;
    }
    save();
    render();
  }

  function text(html) {
    const template = document.createElement("template");
    template.innerHTML = html.replace(/<br\s*\/?\s*>/gi, " · ");
    return template.content.textContent;
  }

  function prepareHuman(zone, walk) {
    if (!["bandit", "stranger"].includes(walk.map) || walk.enemies) return;
    const dwelling = ZN[zone.id - 1];
    walk.enemies = walk.map === "bandit" ? banditGroup(dwelling) : travelerUnits(dwelling);
    const human = walk.enemies[0];
    human.gender = CharacterMotion.resolve(human)?.gender || (FEMALE_CLASS_ART.has(human.cls) ? "female" : "male");
  }

  function encounter(zone, walk, groupSize) {
    if (!active(zone, walk)) return;
    if (walk.phase === "cleared" && services.includes(walk.map) && zone.ev?.type === walk.map) {
      walk.showService = true;
      render();
      return;
    }
    if (walk.phase !== "pending") return;
    if (current?.walk === walk && current.scene) walk.position = current.scene.position();
    if (walk.map === "boss") {
      walk.map = "legacy";
      walk.phase = "cleared";
      render();
      return "clear";
    }
    walk.phase = "resolving";
    if (groupSize) walk.groupSize = groupSize;
    zone.fork = walk.fork;
    const originalDepth = zone.depth;
    chooseFork(walk.side);
    if (!S.battle && zone.depth === originalDepth && !nativeEvent(zone)) {
      walk.phase = "pending";
      zone.fork = null;
      return;
    }
    walk.phase = "cleared";
    delete walk.fork;
    delete walk.groupSize;
    if (walk.map === "landmark" || nativeEvent(zone) || (zone.ev && !["chest", walk.map].includes(zone.ev.type))) {
      walk.map = "legacy";
    } else if (services.includes(walk.map) && zone.ev?.type === walk.map) {
      walk.showService = true;
    } else if (zone.ev?.msg) {
      walk.message = text(zone.ev.msg);
    }
    save();
    render();
    if (S.battle) return "battle";
    return zone.ev?.type === "chest" ? "chest" : "clear";
  }

  function finishBattle(battle, zone) {
    const walk = zone.walk;
    if (!walk) return;
    const outcome = battle.over.res;
    walk.outcome = outcome;
    walk.phase = "cleared";
    if (outcome === "flee") {
      delete walk.position;
      walk.retreat = true;
    }
    if (battle.kind === "bandit" && outcome === "win") {
      walk.reward = {kind: battle.kind, meta: battle.meta, enemies: battleRewardEnemies(battle),
        allies: [{pas: battle.allies[0].pas}], used: battle.used};
    }
    if (zone.ev?.type === "chest") walk.message = text(zone.ev.msg);
    if (current?.walk === walk && current.scene) {
      current.scene.finishBattle(outcome, Boolean(zone.ev?.type === "chest"));
      walk.position = current.scene.position();
      delete walk.retreat;
    }
  }

  function claim(zone, walk) {
    if (!active(zone, walk) || !walk.reward) return false;
    const reward = walk.reward;
    delete walk.reward;
    const lines = [];
    awardBattleScore(reward.enemies, lines);
    awardVictoryRewards(reward, reward.enemies, lines);
    walk.message = lines.join(" · ");
    Sound.fx("chest");
    save();
    render();
    return true;
  }

  function abandonCanvas() {
    const zone = S.zone, walk = zone?.walk;
    if (!walk || S.battle) return;
    if (walk.phase === "pending" && walk.fork) {
      zone.fork = walk.fork;
      zone.walk = {map: "legacy", phase: "cleared"};
      handlers.fork(String(walk.side));
    } else {
      if (walk.reward) claim(zone, walk);
      delete zone.walk;
      if (!zone.ev && !zone.fork) newFork();
    }
    save();
    render();
  }

  function audioStep(running, onTrail, speed) {
    const context = Sound.ctx;
    if (!Sound.enabled || context?.state !== "running") return;
    const surface = onTrail ? "concrete-footsteps" : "forest-footsteps";
    if (!footsteps.has(surface)) {
      const file = "https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/forest-y-v1--audio--" + surface + ".mp3";
      footsteps.set(surface, null);
      fetch(file).then(response => {
        if (!response.ok) throw Error(`Footstep audio failed: ${response.status}`);
        return response.arrayBuffer();
      }).then(bytes => context.decodeAudioData(bytes)).then(buffer => footsteps.set(surface, buffer)).catch(() => {});
    }
    const buffer = footsteps.get(surface);
    if (!buffer) return;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = running ? speed : 1;
    gain.gain.value = .24;
    source.connect(gain).connect(context.destination);
    source.start(0, 0, Math.min(.21, buffer.duration));
  }

  function createNode(zone, walk) {
    const node = document.createElement("div");
    node.className = "forest-walk-scene";
    node.innerHTML = '<canvas class="forest-walk-canvas" tabindex="0" aria-label="แผนที่เดินป่า"></canvas>'
      + '<div class="forest-walk-note"><b></b><p role="status"></p></div>'
      + '<canvas class="forest-walk-map" width="160" height="160" aria-label="แผนที่ทางแยกตัว Y"></canvas>'
      + '<button type="button" class="forest-walk-stick" aria-label="จอยเดิน ลากสุดเพื่อวิ่ง"><span></span></button>'
      + '<button type="button" class="btn forest-walk-chest" hidden>เปิดหีบ</button>'
      + '<button type="button" class="btn forest-walk-fallback" hidden>กลับไปสำรวจแบบเดิม</button>';
    const state = {node, zone, walk, scene: null, water: null};
    const stick = node.querySelector(".forest-walk-stick"), knob = stick.firstElementChild;
    const note = node.querySelector(".forest-walk-note");
    const status = note.querySelector("p");
    const chest = node.querySelector(".forest-walk-chest");
    const route = walk.fork?.[walk.side];
    note.querySelector("b").textContent = walk.map === "boss" ? "ประตูบอส"
      : route?.h ? ZN[zone.id - 1].n : EV[route?.k || walk.map]?.n || ZN[zone.id - 1].n;
    status.textContent = "กำลังโหลดแผนที่…";
    let pointer = null;
    const move = event => {
      if (pointer !== event.pointerId) return;
      const rect = stick.getBoundingClientRect(), radius = rect.width * .34;
      const dx = (event.clientX - rect.left - rect.width / 2) / radius;
      const dy = (event.clientY - rect.top - rect.height / 2) / radius;
      const length = Math.max(1, Math.hypot(dx, dy));
      knob.style.transform = `translate(${dx / length * radius}px,${dy / length * radius}px)`;
      state.scene?.setStick(dx / length, -dy / length);
    };
    state.release = () => {
      const captured = pointer;
      pointer = null;
      if (captured !== null && stick.hasPointerCapture(captured)) stick.releasePointerCapture(captured);
      knob.style.transform = "";
      state.scene?.setStick(0, 0);
    };
    stick.addEventListener("pointerdown", event => {
      if (!state.scene || pointer !== null || event.button !== 0) return;
      event.preventDefault();
      pointer = event.pointerId;
      stick.setPointerCapture(pointer);
      Sound.unlock();
      move(event);
    });
    stick.addEventListener("pointermove", move);
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) stick.addEventListener(event, state.release);
    chest.onclick = () => {
      if (!active(zone, walk) || zone.ev?.type !== "chest" || zone.ev.opened) return;
      handlers.openchest();
      if (!zone.ev.opened) return;
      state.scene?.finishGladeChest();
      chest.hidden = true;
      walk.message = zone.ev.got.join(" · ");
      save();
    };
    node.querySelector(".forest-walk-fallback").onclick = abandonCanvas;
    const canvas = node.querySelector(".forest-walk-canvas");
    state.report = (x, z, flags, area, running, situation) => {
      if (!active(zone, walk)) return;
      walk.position = [x, z];
      delete walk.retreat;
      chest.hidden = situation !== "near-chest" || Boolean(zone.ev?.opened);
      const cue = {chase: "ศัตรูกำลังเข้ามา!", loot: "เดินไปที่หีบหน้าค่ายเพื่อรับรางวัล",
        "near-chest": "เปิดหีบสมบัติ", waiting: "เดินเข้าใกล้นักเดินทางเพื่อพูดคุย"}[situation];
      const instruction = {boss: "เดินไปถึงประตูบอส", landmark: "เดินเข้าใกล้เพื่อสำรวจ"}[walk.map];
      const message = cue || walk.message || instruction || "ลากจอยเพื่อเดินหรือวิ่ง แล้วเลือกทางแยก";
      if (status.textContent !== message) status.textContent = message;
    };
    state.canvas = canvas;
    return state;
  }

  async function loadScene(state) {
    const {node, zone, walk, canvas, report} = state;
    prepareHuman(zone, walk);
    if (walk.enemies) {
      state.encounterAvatar = window.sealerSprites?.create();
      state.encounterAvatar?.sync(walk.enemies[0]);
    }
    modules ||= Promise.all(["forest-25d.js", "wells.js", "well-effects.js"].map(file => import(new URL(file + "?v=encounter-identity-1", assets).href)));
    try {
      const [{openForest}, {WELLS}, {createWellEffects, startWellAudio}] = await modules;
      if (current !== state) return;
      const map = walk.map;
      const well = WELLS[map];
      state.avatar = window.sealerSprites?.create();
      state.avatar?.sync(S.P);
      if (well) {
        try { state.water = startWellAudio(); state.water.setMuted(!Sound.enabled); } catch {}
      }
      const resolve = groupSize => encounter(zone, walk, groupSize);
      const hostile = map === "stranger" && walk.disposition < .6;
      const scene = await openForest(canvas, () => {}, report, {
        minimap: node.querySelector(".forest-walk-map"),
        playerAvatar: state.avatar,
        encounterAvatar: state.encounterAvatar,
        entrance: map === "entrance" && zone.depth === 0,
        landmark: map === "boss" ? "gate" : map === "landmark" ? landmarkArt(walk.fork[walk.side]) : null,
        onLandmark: ["boss", "landmark"].includes(map) ? () => resolve() : null,
        resume: {position: walk.position, retreat: walk.retreat, completed: walk.phase !== "pending",
          chest: zone.ev?.type === "chest" && !zone.ev.opened,
          banditOutcome: walk.reward ? "loot" : walk.outcome === "flee" ? "escaped" : walk.outcome === "win" ? "claimed" : "",
          travelerOutcome: walk.outcome === "flee" ? "escaped" : walk.outcome === "win" ? "clear" : ""},
        training: Boolean(ZN[zone.id - 1].train),
        traveler: map === "stranger" ? {} : null,
        onContact: ["footprints", "bandit"].includes(map) || hostile ? resolve : null,
        onMeetTraveler: map === "stranger" && !hostile ? resolve : null,
        onBanditLoot: map === "bandit" ? () => claim(zone, walk) : null,
        onSearch: searches.includes(map) ? resolve : null,
        mist: map === "mist", ruins: map === "ruins",
        well, wellEffects: well && createWellEffects(map), wellAudio: state.water,
        onUseWell: well ? () => { resolve(); state.water?.playActivation(map); } : null,
        onPray: map === "shrine" ? resolve : null,
        onVisitVillage: map === "village" ? resolve : null,
        onVisitHealer: map === "hospital" ? resolve : null,
        onTownExit: map === "exit" ? () => { resolve(); if (active(zone, walk) && zone.ev?.type === "exit") handlers.exitzone(); } : null,
        onExit: map === "boss" ? null : side => next(zone, walk, side),
        onStep: audioStep
      });
      if (current !== state) { scene.dispose(); return; }
      state.scene = scene;
      sync();
    } catch (error) {
      modules = null;
      if (current !== state) return;
      console.error(error);
      node.querySelector("[role=status]").textContent = "เปิดแผนที่เดินป่าไม่สำเร็จ";
      node.querySelector(".forest-walk-fallback").hidden = false;
    }
  }

  function clear() {
    current?.release();
    current?.scene?.dispose();
    current?.water?.close();
    current?.avatar?.release();
    current?.encounterAvatar?.release();
    current = null;
  }

  function sync() {
    const zone = S.zone, walk = zone?.walk;
    const host = document.getElementById("forest-walk-mount");
    if (current && (current.zone !== zone || current.walk !== walk || walk.map === "legacy")) clear();
    if (!host || !walk) {
      current?.release();
      current?.scene?.setPaused(true);
      return;
    }
    if (!current) {
      current = createNode(zone, walk);
      loadScene(current);
    }
    if (current.node.parentNode !== host) host.appendChild(current.node);
    current.avatar?.sync(S.P);
    current.water?.setMuted(!Sound.enabled);
    if (!active(zone, walk)) current.release();
    current.scene?.setPaused(!active(zone, walk));
    current.scene?.resize();
  }

  function landmarkArt(door) {
    if (door.k === "secret") return "gate";
    if (door.k.startsWith("riddle") || door.k === "specialEvent") return "shrine";
    if (door.k === "chest") return "chest";
    return "sign";
  }

  function mount(zone) {
    if (!zone || ![7, 1].includes(zone.id)) return;
    zone.walk = initialMap();
    const legacyZone = vZone;
    vZone = function() { return view(legacyZone); };
    const legacyRender = render;
    render = function(...args) {
      const result = legacyRender(...args);
      sync();
      return result;
    };
    const legacyContinue = handlers.cont;
    handlers.cont = function(...args) {
      if (!S.zone?.walk?.showService) return legacyContinue(...args);
      S.zone.walk.showService = false;
      save();
      render();
    };
  }

  return {mount, finishBattle};
})();
