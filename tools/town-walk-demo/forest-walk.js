// World forest presentation. The menu's original runtime owns player state, combat and saves.
const ForestWalk = (() => {
  const assets = new URL("../../assets/forest-walk/", document.currentScript.src);
  const maps = {beast: "footprints", bandit: "bandit", stranger: "stranger", shrine: "shrine",
    spring: "spring", revival: "revival", cleanse: "cleanse", village: "village", hospital: "hospital",
    exit: "exit", bush: "bush", mist: "mist", ruins: "ruins"};
  const searches = ["bush", "mist", "ruins"];
  const services = ["village", "hospital"];
  let modules, current;
  const sceneCatalog = zone => zone?.id === 6 ? DemonForestScenes : zone?.id === 5 ? HeavenForestScenes : zone?.id === 4 ? DragonForestScenes : zone?.id === 3 ? DesertForestScenes : zone?.id === 1 ? MoonlightForestScenes : TrainingForestScenes;
  let trainingFocusInstalled = false;
  const soundMix=()=>({enabled:Sound.enabled,context:Sound.ctx,destination:typeof audioBus==="function"?audioBus("effects"):Sound.master});

  function questContext(zone){const p=new URLSearchParams(location.search),place=p.get('city')||S.P.country+'-capital';return {place,country:p.get('country')||window.WalkQuestEngine.countryOf(place)||S.P.country,zone:zone.id,depth:zone.depth};}

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

  function rememberPlace(walk) {
    if (current?.walk === walk && current.scene) walk.position = current.scene.position();
    walk.menuOrigin ||= {map: walk.map, scene: walk.scene,
      position: walk.position?.slice()};
    if (!walk.showStory && walk.position) walk.menuOrigin.position = walk.position.slice();
  }

  function returnToPlace(walk) {
    const origin = walk.menuOrigin;
    if (origin) {
      walk.map = origin.map;
      walk.scene = origin.scene;
      walk.position = origin.position?.slice() || walk.position;
      if (current?.walk === walk && current.sceneId === origin.scene?.id) {
        current.scene?.restorePosition?.(walk.position);
      }
    }
    walk.phase = "cleared";
    walk.showStory = false;
    walk.storySession = false;
    walk.message = "จบเหตุการณ์แล้ว เดินต่อไปยังทางแยก";
    delete walk.menuOrigin;
  }

  function view(legacy) {
    const zone = S.zone, walk = zone?.walk;
    if (walk?.storySession && !nativeEvent(zone)) returnToPlace(walk);
    if ([1,3,4,5,6,7].includes(zone?.id) && walk && !walk.showService) {
      const story = sceneCatalog(zone).session(zone);
      if (story) {
        rememberPlace(walk);
        walk.scene = story;
        walk.storySession = true;
        walk.map = "training";
        // Existing session actions retain their tokens, validation and rewards.
        // The map stays mounted but hidden while the full-page menu is open.
        return mountHTML(walk.showStory ? storyMarkup(legacy()) : "");
      }
      if (walk.map === "boss") return mountHTML(walk.showStory ? storyMarkup(legacy(), true) : "");
    }
    if (!walk || walk.showService || nativeEvent(zone)) return legacy();
    if (walk.map === "legacy") {
      if (!zone.fork || zone.ev || zone.depth >= ZDEPTH) return legacy();
      if (walk.menuOrigin) returnToPlace(walk);
      else zone.walk = initialMap();
    }
    return mountHTML();
  }

  function mountHTML(story = "") {
    return '<section class="forest-walk-layout"><section id="forest-walk-mount" class="forest-walk-mount" aria-label="เดินสำรวจป่า"></section>'
      + (story ? '<aside class="forest-walk-story" aria-label="เหตุการณ์ในฉาก">' + story + '</aside>' : '') + '</section>';
  }

  function storyMarkup(html, boss = false) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const section = boss ? template.content.querySelector('[data-a="boss"]')?.closest(".card")
      : template.content.querySelector(".secret-location, #forestSpecial, #forestRiddle, #worldTales");
    for (const button of section?.querySelectorAll(".secret-choice-grid > button") || []) {
      const art = button.querySelector(":scope > .secret-panel, :scope > .tale-panel");
      if (!art) continue;
      const caption = art.querySelector("figcaption");
      const title = caption?.textContent || art.getAttribute("aria-label") || "";
      caption?.remove();
      const frame = document.createElement("span");
      frame.className = "forest-choice-art";
      art.replaceWith(frame);
      frame.append(art);
      if (!button.querySelector(":scope > strong")) {
        const label = document.createElement("strong");
        label.textContent = title;
        button.append(label);
      }
      button.classList.add("forest-event-choice");
    }
    return section?.outerHTML || html;
  }

  function forkSignature(zone, walk) {
    const {walk: ignoredWalk, fork: ignoredFork, ...context} = zone;
    const {gsAt: ignoredTimestamp, ...player} = S.P || {};
    return JSON.stringify({context, phase: walk.phase, player});
  }

  function nextForkPreview(zone, walk) {
    if (zone.fork) return {fork: zone.fork, zone};
    const signature = forkSignature(zone, walk);
    if (walk.routePreview?.signature === signature) return walk.routePreview;
    // Run the existing generator on a copy: previews must not consume a step,
    // clear a service, charge an effect, or write a save before the player exits.
    const originalState = S, originalSave = save, random = Math.random, rolls = [];
    let result;
    try {
      S = structuredClone(S);
      delete S.zone.walk.routePreview;
      save = () => {};
      Math.random = () => { const value = random(); rolls.push(value); return value; };
      const preview = S.zone;
      if (walk.phase === "pending") {
        preview.depth++;
        zlog(`ก้าวที่ ${preview.depth}: เดินผ่าน ${(EV[walk.fork[walk.side].k]?.n || "เหตุการณ์ในป่า")}`);
      }
      preview.ev = null;
      newFork();
      result = {signature, rolls, fork: preview.fork, zone: {
        id: preview.id, boss: preview.boss, secretRun: preview.secretRun,
        riddleRun: preview.riddleRun, storyRun: preview.storyRun
      }};
    } finally {
      S = originalState;
      save = originalSave;
      Math.random = random;
    }
    walk.routePreview = result;
    return result;
  }

  function nextPlaceDestination(zone, walk, side) {
    if (walk.map === "boss" || nativeEvent(zone) || walk.phase === "resolving"
      || walk.phase === "pending" && ["training", "bandit"].includes(walk.map)) return "";
    const plan = nextForkPreview(zone, walk), door = plan.fork?.[side === "left" ? 0 : 1];
    if (!door) return "ประตูบอส · " + (zone.boss || ZN[zone.id - 1].boss).n;
    if (door.h) return "ทางมืด · ยังไม่ทราบสถานที่";
    if ([1,3,4,5,6,7].includes(zone.id) && !maps[door.k]) return sceneCatalog(zone).selected(plan.zone, door).title;
    return EV[door.k]?.n || "เหตุการณ์ในป่า";
  }

  function nextDestination(zone,walk,side){
    const label=nextPlaceDestination(zone,walk,side);
    if(zone.id!==6||!label)return label;
    const prediction=nextForkPreview(zone,walk),door=prediction.fork?.[side==='left'?0:1];
    if(door?.h)return label;
    const step=(walk.castleStep??DemonCastleRooms.stepFor(zone.depth,walk))+1;
    const map=door?(maps[door.k]||'training'):'boss',scene=door&&!maps[door.k]?sceneCatalog(zone).selected(prediction.zone,door):null;
    const room=DemonCastleRooms.roomFor(map,scene,step);
    return room?DemonCastleRooms.names[room]+' · '+label:'นอกปราสาท · '+label;
  }

  function generateNextFork(preview) {
    if (!preview) return newFork();
    // Replay the already sampled rolls through the real generator at the exit.
    // Its original state changes and save logic still run exactly here.
    const random = Math.random;
    let index = 0;
    try {
      Math.random = () => index < preview.rolls.length ? preview.rolls[index++] : random();
      return newFork();
    } finally { Math.random = random; }
  }

  function next(zone, walk, side) {
    if (!active(zone, walk) || nativeEvent(zone) || walk.showStory || walk.phase === "resolving" || (walk.phase === "pending" && ["bandit", "training"].includes(walk.map))) return;
    const preview = walk.routePreview?.signature === forkSignature(zone, walk) ? walk.routePreview : null;
    if (walk.phase === "pending") {
      zone.depth++;
      zlog(`ก้าวที่ ${zone.depth}: เดินผ่าน ${(EV[walk.fork[walk.side].k]?.n || "เหตุการณ์ในป่า")}`);
    }
    zone.ev = null;
    if (!zone.fork) generateNextFork(preview);
    const slot = side === "left" ? 0 : 1;
    const door = zone.fork?.[slot];
    if (!door) {
      zone.walk = {map: "boss", phase: "pending"};
      if ([1,3,4,5,6,7].includes(zone.id)) zone.walk.scene = sceneCatalog(zone).describe("boss");
    } else {
      const selected = {map: maps[door.k] || "landmark", phase: "pending", fork: zone.fork, side: slot};
      if ([1,3,4,5,6,7].includes(zone.id) && selected.map === "landmark") {
        selected.map = "training";
        selected.scene = sceneCatalog(zone).selected(zone, door);
      }
      // Roll the original 14% trap once, so its scenery can be seen before contact.
      // Native stories do not use chooseFork's ordinary trap roll.
      if ([1,3,4,5,6,7].includes(zone.id) && maps[door.k] && !SAFE.includes(door.k)) {
        selected.trapIndex = Math.random() < .14 ? TRAPS.indexOf(pick(TRAPS)) : -1;
      }
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
    if (current?.walk === walk && current.scene) walk.position = current.scene.position();
    if ([1,3,4,5,6,7].includes(zone.id) && (nativeEvent(zone) || walk.map === "boss")) {
      rememberPlace(walk);
      walk.showStory = true;
      render();
      return "clear";
    }
    if (walk.phase === "cleared" && services.includes(walk.map) && zone.ev?.type === walk.map) {
      walk.showService = true;
      render();
      return;
    }
    if (walk.phase !== "pending") return;
    if (walk.map === "boss") {
      walk.map = "legacy";
      walk.phase = "cleared";
      render();
      return "clear";
    }
    walk.phase = "resolving";
    if (walk.map === "training") {
      rememberPlace(walk);
      walk.showStory = true;
    }
    if (groupSize) walk.groupSize = groupSize;
    zone.fork = walk.fork;
    const originalDepth = zone.depth;
    chooseFork(walk.side);
    if (!S.battle && zone.depth === originalDepth && !nativeEvent(zone)) {
      walk.phase = "pending";
      walk.showStory = false;
      delete walk.menuOrigin;
      zone.fork = null;
      sync();
      return false;
    }
    walk.phase = "cleared";
    delete walk.fork;
    delete walk.groupSize;
    if ([1,3,4,5,6,7].includes(zone.id) && nativeEvent(zone)) {
      rememberPlace(walk);
      walk.showStory = true;
      walk.storySession = true;
      walk.map = "training";
      walk.scene = sceneCatalog(zone).session(zone) || walk.scene;
    } else if (walk.map === "landmark" || nativeEvent(zone) || (zone.ev && !["chest", walk.map].includes(zone.ev.type))) {
      rememberPlace(walk);
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

  function createNode(zone, walk) {
    const node = document.createElement("div");
    node.className = "forest-walk-scene";
    node.innerHTML = '<canvas class="forest-walk-canvas" tabindex="0" aria-label="แผนที่เดินป่า"></canvas>'
      + '<div class="forest-walk-note"><b></b><p role="status"></p><p class="forest-walk-destination" aria-live="polite" hidden></p></div>'
      + '<canvas class="forest-walk-map" width="160" height="160" aria-label="แผนที่ทางแยกตัว Y"></canvas>'
      + '<button type="button" class="forest-walk-stick" aria-label="จอยเดินทาง ลากน้อยเดิน ลากไกลวิ่ง ปล่อยหยุด"><span></span></button>'
      + '<div class="forest-walk-actions" role="group" aria-label="การกระทำกับสถานที่">'
      + '<button type="button" class="btn forest-walk-quest-guide" aria-label="สลับจุดเควสที่ติดตาม" title="กดเพื่อดูจุดเควสถัดไป" hidden></button>'
      + '<button type="button" class="btn forest-walk-chest" hidden>เปิดหีบ</button>'
      + '<button type="button" class="btn forest-walk-fallback" hidden>กลับไปสำรวจแบบเดิม</button></div>';
    const state = {node, zone, walk, scene: null, water: null};
    const stick = node.querySelector(".forest-walk-stick"), knob = stick.firstElementChild;
    const note = node.querySelector(".forest-walk-note");
    const status = note.querySelector("p");
    const destination = note.querySelector(".forest-walk-destination");
    const chest = node.querySelector(".forest-walk-chest");
    const questGuide=node.querySelector('.forest-walk-quest-guide');
    let guideIndex=0;
    questGuide.onclick=()=>{if(state.questSites?.length)guideIndex=(guideIndex+1)%state.questSites.length;};
    const route = walk.fork?.[walk.side];
    note.querySelector("b").textContent = walk.scene?.title || (walk.map === "boss" ? "ประตูบอส"
      : route?.h ? ZN[zone.id - 1].n : EV[route?.k || walk.map]?.n || ZN[zone.id - 1].n);
    status.textContent = "กำลังโหลดแผนที่…";
    let pointer = null;
    const move = event => {
      if (pointer !== event.pointerId) return;
      const rect = stick.getBoundingClientRect(), radius = rect.width * .33;
      const dx = (event.clientX - rect.left - rect.width / 2) / radius;
      const dy = (event.clientY - rect.top - rect.height / 2) / radius;
      const length = Math.max(1, Math.hypot(dx, dy));
      knob.style.transform = `translate(${dx / length * radius}px,${dy / length * radius}px)`;
      state.scene?.setStick(dx / length, -dy / length);
      event.preventDefault();
    };
    state.release = () => {
      const captured = pointer;
      pointer = null;
      if (captured !== null && stick.hasPointerCapture(captured)) stick.releasePointerCapture(captured);
      knob.style.transform = "";
      stick.classList.remove("active");
      state.scene?.setStick(0, 0);
    };
    stick.addEventListener("pointerdown", event => {
      if (!state.scene || pointer !== null || event.button !== 0) return;
      event.preventDefault();
      pointer = event.pointerId;
      stick.classList.add("active");
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
      const instruction = walk.trapIndex >= 0 && walk.phase === "pending" ? "ระวังกับดักบนทางข้างหน้า"
        : {boss: "เดินไปที่ประตูห้องบอส", training: "เดินเข้าไปสำรวจสถานที่และพูดคุย", landmark: "เดินเข้าใกล้เพื่อสำรวจ"}[walk.map];
      const site=state.questSites?.[guideIndex%state.questSites.length];
      questGuide.hidden=!site;
      if(site){const dx=site.position[0]-x,dz=site.position[1]-z;const horizontal=Math.abs(dx)>3?(dx<0?'ซ้าย':'ขวา'):'';const vertical=Math.abs(dz)>3?(dz>0?'ขึ้น':'ลง'):'';questGuide.textContent='ภารกิจ '+(guideIndex%state.questSites.length+1)+'/'+state.questSites.length+' · '+site.label+' · '+(vertical+horizontal||'อยู่ใกล้แล้ว')+' '+Math.round(Math.hypot(dx,dz))+' ม.';}
      const message = cue || walk.message || instruction || "ลากจอยเพื่อเดินหรือวิ่ง แล้วเลือกทางแยก";
      if (status.textContent !== message) status.textContent = message;
      const side = ["Fernstone Trail", "Fernstone Clearing"].includes(area) ? "left"
        : ["Sunbloom Trail", "Sunbloom Clearing"].includes(area) ? "right" : null;
      const name = side ? nextDestination(zone, walk, side) : "";
      const upcoming = name ? `${side === "left" ? "ทางซ้าย" : "ทางขวา"} → ${name}` : "";
      if (destination.textContent !== upcoming) destination.textContent = upcoming;
      destination.hidden = !upcoming;
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
    modules ||= Promise.all(["forest-25d.js", "wells.js", "well-effects.js", "footstep-audio.js"].map(file => import(new URL(file + "?v=demon-castle-release-1", assets).href)));
    try {
      const [{openForest}, {WELLS}, {createWellEffects, startWellAudio}, {createFootstepAudio}] = await modules;
      if (current !== state) return;
      const map = walk.map;
      const well = WELLS[map];
      state.avatar = window.sealerSprites?.create({preloadDirections:true});
      state.avatar?.sync(S.P);
      if (state.avatar?.whenReady) {
        node.querySelector("[role=status]").textContent = "กำลังโหลดตัวละคร 3D…";
        await state.avatar.whenReady();
        if (current !== state) { state.avatar.release(); return; }
      }
      if (state.encounterAvatar?.whenReady) {
        await state.encounterAvatar.whenReady();
        if (current !== state) { state.encounterAvatar.release(); return; }
      }
      if (well) {
        try { state.water = startWellAudio(); state.water.setMuted(!Sound.enabled); } catch {}
      }
      state.drySteps=createFootstepAudio(soundMix);
      const resolve = groupSize => encounter(zone, walk, groupSize);
      const hostile = map === "stranger" && walk.disposition < .6;
      const scene = await openForest(canvas, () => {}, report, {
        minimap: node.querySelector(".forest-walk-map"),
        playerAvatar: state.avatar,
        encounterAvatar: state.encounterAvatar,
        entrance: map === "entrance" && zone.depth === 0,
        landmark: walk.scene?.landmark || (map === "boss" ? "gate" : map === "landmark" ? landmarkArt(walk.fork[walk.side]) : null),
        trainingScene: zone.id === 7 ? walk.scene : null,
        zoneTheme: zone.id === 6 ? 'demon' : zone.id === 5 ? 'heaven' : zone.id === 4 ? 'dragon' : zone.id === 3 ? 'desert' : zone.id === 1 ? 'moonlight' : 'training',
        moonlightScene: [1,3,4,5,6].includes(zone.id) ? walk.scene : null, placeMap: map,
        castleStep:walk.castleStep, castleRoom:zone.id===6?(['localhost','127.0.0.1'].includes(location.hostname)?walk.roomPreview||walk.castleRoom:walk.castleRoom):null,
        storyActorURL: null,
        trapIndex: walk.trapIndex,
        onTrap: walk.trapIndex >= 0 ? resolve : null,
        onLandmark: ["boss", "landmark", "training"].includes(map) ? () => resolve() : null,
        resume: {position: walk.position, retreat: walk.retreat, completed: map === "training" && nativeEvent(zone) ? Boolean(walk.showStory) : walk.phase !== "pending",
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
        soundMix,
        onUseWell: well ? () => { resolve(); state.water?.playActivation(map); } : null,
        onPray: map === "shrine" ? resolve : null,
        onVisitVillage: map === "village" ? resolve : null,
        onVisitHealer: map === "hospital" ? resolve : null,
        onTownExit: map === "exit" ? () => { resolve(); if (active(zone, walk) && zone.ev?.type === "exit") handlers.exitzone(); } : null,
        onExit: map === "boss" ? null : side => next(zone, walk, side),
        onStep: (...args)=>state.drySteps.step(...args),
        questSites: state.questSites,
        onQuest: state.hasSearch ? siteId => {
          if (!active(zone, walk) || nativeEvent(zone)) return;
          walk.position = state.scene.position();
          walk.showSearch = true;
          walk.questSite = siteId;
          render();
        } : null
      });
      if (current !== state) { scene.dispose(); return; }
      state.scene = scene;
      if(canvas.dataset.castleInterior==='true'){
        const roomName=canvas.dataset.castleRoomName;
        node.querySelector('.forest-walk-note b').textContent=roomName+(canvas.dataset.castleServiceLabel?' · '+canvas.dataset.castleServiceLabel:'')+(walk.scene?.title?' · '+walk.scene.title:'');
      }
      state.report(...scene.position(), 0, "", false, "clear");
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
    current?.drySteps?.close();
    current?.avatar?.release();
    current?.encounterAvatar?.release();
    current = null;
  }

  function sync() {
    const zone = S.zone, walk = zone?.walk;
    if(zone?.id===6&&walk){
      walk.castleStep??=DemonCastleRooms.stepFor(zone.depth,walk);
      if(walk.castleStep>=4)walk.castleRoom??=DemonCastleRooms.roomFor(walk.map,walk.scene,walk.castleStep);
    }
    const host = document.getElementById("forest-walk-mount");
    const questSites=[1,3,4,5,6,7].includes(zone?.id)&&!nativeEvent(zone)?ForestQuestSites.available(S.P,window.WorldQuestData.quests,questContext(zone)):[];
    const hasSearch=questSites.length>0,questSignature=JSON.stringify(questSites);
    if (walk && !hasSearch) walk.showSearch = false;
    if (current && (current.zone !== zone || current.walk !== walk || walk.map === "legacy" || current.sceneId !== walk.scene?.id || current.questSignature !== questSignature)) clear();
    if (!host || !walk) {
      current?.release();
      current?.scene?.setPaused(true);
      return;
    }
    // Native story focus must scroll its own panel, never move the walking viewport.
    const main = host.closest("main");
    if (main) main.scrollTop = 0;
    if (!current) {
      current = createNode(zone, walk);
      current.sceneId = walk.scene?.id;
      current.hasSearch = hasSearch;
      current.questSites = questSites;
      current.questSignature = questSignature;
      loadScene(current);
    }
    if (current.node.parentNode !== host) host.appendChild(current.node);
    current.avatar?.sync(S.P);
    current.water?.setMuted(!Sound.enabled);
    if (!active(zone, walk)) current.release();
    current.scene?.setPaused(!active(zone, walk) || Boolean(walk.showStory || walk.showSearch));
    current.scene?.resize();
  }

  function landmarkArt(door) {
    if (door.k === "secret") return "gate";
    if (door.k.startsWith("riddle") || door.k === "specialEvent") return "shrine";
    if (door.k === "chest") return "chest";
    return "sign";
  }

  function presentSearch(box) {
    const zone = S.zone, layout = document.querySelector(".forest-walk-layout");
    if (![1,3,4,5,6,7].includes(zone?.id) || !layout || nativeEvent(zone)) return false;
    const panel = document.createElement("aside");
    panel.className = "forest-walk-story forest-walk-search-panel";
    panel.hidden = !zone.walk.showSearch;
    panel.setAttribute("aria-label", "สำรวจร่องรอยภารกิจ");
    const close = document.createElement("button");
    close.type = "button"; close.className = "btn full";
    close.textContent = "กลับไปเดินสำรวจ";
    close.onclick = () => { zone.walk.showSearch = false; render(); };
    for(const card of box.children)if(card.dataset.forestQuestSite)card.hidden=card.dataset.forestQuestSite!==zone.walk.questSite;
    const site=ForestQuestSites.available(S.P,window.WorldQuestData.quests,questContext(zone)).find(s=>s.id===zone.walk.questSite);
    const heading=document.createElement('h2');heading.textContent=site?.label||'สำรวจภารกิจ';
    if(zone.walk.showSearch&&![...box.children].some(c=>!c.hidden)){const done=document.createElement('p');done.textContent='ตรวจเบาะแสจุดนี้แล้ว กลับไปเดินต่อหรือรายงานผู้มอบหมาย';box.append(done);}
    panel.append(heading,box,close);
    layout.append(panel);
    return true;
  }

  function mount(zone) {
    if (!zone || ![7, 1, 3, 4, 5, 6].includes(zone.id)) return;
    // Preserve a saved scene/session, including rolled trap identity and position.
    zone.walk ||= zone.depth >= ZDEPTH ? {map: "boss", phase: "pending"} : initialMap();
    if ([1,3,4,5,6,7].includes(zone.id) && zone.walk.map === "boss") zone.walk.scene = sceneCatalog(zone).describe("boss");
    if (!trainingFocusInstalled) {
      trainingFocusInstalled = true;
      for (const owner of [Secret, ForestSpecial, ForestRiddle, WorldTales]) {
        const previous = owner.focus;
        owner.focus = function(...args) {
          const panel = [1,3,4,5,6,7].includes(S.zone?.id) && document.querySelector(".forest-walk-story:not([hidden])");
          if (!panel) return previous?.apply(this, args);
          panel.scrollTop = 0;
          const heading = panel.querySelector("h2,h3");
          heading?.setAttribute("tabindex", "-1");
          heading?.focus({preventScroll: true});
        };
      }
    }
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

  return {mount, finishBattle, presentSearch};
})();
