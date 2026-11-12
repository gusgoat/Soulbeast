(function () {
  'use strict';

  const base = 'https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-videos/';
  const clips = Object.freeze({
    solar_heliotheon: 'heliotheon',
    solar_ferroth: 'ferroth',
    solar_cryostag: 'cryostag',
    solar_aureolith: 'aureolith',
    solar_mortivar: 'mortivar',
    solar_raijaku: 'raijaku',
    solar_thalassyr: 'thalassyr',
    solar_pentadrake: 'pentadrake',
  });
  const label = (th, en, zh) => {
    const lang = document.documentElement.lang.toLowerCase();
    return lang.startsWith('zh') ? zh : lang.startsWith('en') ? en : th;
  };
  let active = false;

  function show(queue, {muted = false, volume = 1, syncMusic}) {
    if (!queue.length || active || typeof HTMLDialogElement === 'undefined') return;
    const dialog = document.createElement('dialog');
    dialog.className = 'game-cinematic';
    dialog.translate = false;
    dialog.setAttribute('aria-labelledby', 'game-cinematic-name');

    const heading = document.createElement('h2');
    heading.id = 'game-cinematic-name';
    const stage = document.createElement('div');
    stage.className = 'game-cinematic-stage';
    const actions = document.createElement('div');
    actions.className = 'game-cinematic-actions';
    const play = document.createElement('button');
    play.type = 'button';
    play.textContent = label('เล่นวิดีโอ', 'Play video', '播放影片');
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.autofocus = true;
    skip.textContent = label('ข้ามวิดีโอ', 'Skip video', '跳过影片');
    actions.append(play, skip);
    dialog.append(heading, stage, actions);
    document.body.append(dialog);

    let index = 0;
    let video;
    let timer;
    let finished = false;
    function unload() {
      clearTimeout(timer);
      const previous = video;
      video = null;
      if (previous) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
        previous.remove();
      }
    }
    function finish() {
      if (finished) return;
      finished = true;
      unload();
      dialog.remove();
      const wasActive = active;
      active = false;
      if (wasActive) syncMusic?.();
      if (document.activeElement === document.body) {
        const next = document.querySelector('[data-a="gachaRevealOne"][aria-pressed="false"], [data-a="gachaRevealAll"]:enabled, .gacha-draw-again:enabled');
        next?.focus({preventScroll: true});
      }
    }
    function advance() {
      if (finished) return;
      if (++index === queue.length) {
        dialog.close();
        finish();
      } else {
        loadClip();
      }
    }
    async function tryPlay(current) {
      play.hidden = true;
      try {
        await current.play();
      } catch {
        if (video !== current) return;
        clearTimeout(timer);
        play.textContent = current.muted || current.volume === 0
          ? label('เล่นวิดีโอ', 'Play video', '播放影片')
          : label('เล่นพร้อมเสียง', 'Play with sound', '有声播放');
        play.hidden = false;
      }
    }
    function loadClip() {
      unload();
      const clip = queue[index];
      heading.textContent = clip.title;
      const current = document.createElement('video');
      video = current;
      current.playsInline = true;
      current.controls = true;
      current.preload = 'auto';
      current.muted = muted;
      current.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
      current.setAttribute('aria-label', heading.textContent);
      current.addEventListener('ended', () => { if (video === current) advance(); });
      current.addEventListener('error', () => { if (video === current) advance(); });
      current.addEventListener('playing', () => {
        if (video !== current) return;
        clearTimeout(timer);
        play.hidden = true;
      });
      stage.append(current);
      timer = setTimeout(() => { if (video === current) advance(); }, 10000);
      current.src = base + clip.path;
      void tryPlay(current);
    }

    skip.addEventListener('click', advance);
    play.addEventListener('click', () => {
      if (!video) return;
      clearTimeout(timer);
      timer = setTimeout(advance, 10000);
      void tryPlay(video);
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); advance(); });
    dialog.addEventListener('close', finish);
    try {
      dialog.showModal();
    } catch {
      finish();
      return;
    }
    active = true;
    syncMusic?.();
    loadClip();
  }

  function gacha(rewards, {nameFor, ...audio}) {
    const queue = rewards
      .filter(reward => reward.type === 'pet' && Object.hasOwn(clips, reward.key))
      .map(reward => ({title: nameFor(reward.key) || reward.key, path: 'gacha-solar/v1/' + clips[reward.key] + '.mp4'}));
    show(queue, audio);
  }

  let inCountryWar = false;
  function countryWar(entered, inBattle, audio) {
    const opening = entered && !inCountryWar;
    inCountryWar = entered;
    if (opening && !inBattle) {
      show([{title: label('สงครามอาณาจักร', 'Kingdom War', '王国战争'), path: 'kingdom-war/v1/intro.mp4'}], audio);
    }
  }

  window.SoulbeastCinematics = {gacha, countryWar, isOpen: () => active};
})();
