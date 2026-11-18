import {forestAssetURL} from "./storage-assets.js";

const effects = {
  spring: {
    surface: [.50, .55, .35, .19], source: [.57, .38], color: "195,255,245",
    rings: 5, period: 1.65, spread: .33
  },
  revival: {
    surface: [.50, .49, .34, .155], source: [.50, .50], color: "255,226,149",
    rings: 3, period: 2.7, spread: .31,
    rim: {rise: .064, crest: [.50, .528, .391, .210], base: [.50, .563, .451, .313]}
  },
  cleanse: {
    surface: [.50, .475, .35, .157], source: [.51, .47], color: "224,213,255",
    rings: 4, period: 3.9, spread: .32,
    rim: {rise: .055, crest: [.50, .508, .391, .205], base: [.50, .543, .448, .285]},
    lotus: [.51, .473, .077, .060]
  }
};

// Petal outline in the cleansing well artwork. The reflection belongs to the water layer.
const lotusOutline = `
  M 309.5 154
  Q 317.8 161 317.2 168.3
  Q 323.3 162.2 330.8 159.8
  Q 331.7 166 327.1 174.1
  Q 334.3 171 342.2 170.9
  Q 336.6 181.5 321.8 185.2
  Q 328.4 186 331 189.4
  Q 317.4 194.4 304.6 185.9
  Q 290.7 194.1 271.8 184.1
  Q 278.5 180.6 287 180.6
  Q 280.7 176.9 276.5 169.8
  Q 282.4 169.4 288.6 172.4
  Q 284.8 166.5 286.9 158.4
  Q 295.5 159.7 300.5 166
  Q 303.7 158.7 309.5 154 Z`;

export function createWellEffects(kind) {
  const style = effects[kind];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const petals = style.lotus ? new Path2D(lotusOutline) : null;
  let activation;

  return {
    surface: style.surface,
    rim: style.rim,
    lotus: style.lotus,
    paintLotus(ctx, art, left, top, width, height) {
      if (!petals) return;
      ctx.save();
      ctx.translate(left, top);
      ctx.scale(width / art.width, height / art.height);
      ctx.clip(petals);
      ctx.drawImage(art, 270, 153, 74, 41, 270, 153, 74, 41);
      ctx.restore();
    },
    activate(now, x, y) { activation = {now, x, y}; },
    paint(ctx, left, top, width, height, now, bather) {
      if (reducedMotion.matches) return;
      const [cx, cy, rx, ry] = style.surface;
      const [sx, sy] = style.source;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(left + cx * width, top + cy * height, rx * width, ry * height, 0, 0, 2 * Math.PI);
      ctx.clip();
      ctx.lineWidth = Math.max(.7, width * .003);

      for (let index = 0; index < style.rings; index++) {
        const progress = (now / (1000 * style.period) + index / style.rings) % 1;
        ring(progress, .52);
      }
      if (activation && now - activation.now < 1080) {
        const x = left + (cx + activation.x * rx) * width;
        const y = top + (cy + activation.y * ry) * height;
        paintActivationRings(ctx, x, y, width, now - activation.now);
      }
      if (bather) {
        const {x, y, depth, moving} = bather;
        const phase = (now / (moving ? 550 : 1450)) % 1;
        const radius = 9 + 17 * depth + 14 * phase;
        ctx.strokeStyle = `rgba(${style.color},${Math.min(1, depth * 8) * Math.sin(phase * Math.PI) * .64})`;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * .26, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      if (kind === "spring") {
        // Thin glints follow the cascade painted into the spring artwork.
        ctx.save();
        ctx.lineWidth = Math.max(.65, width * .003);
        for (let index = 0; index < 6; index++) {
          const phase = (now / 340 + index * .37) % 1;
          const x = left + width * (.61 - index * .011 - phase * .018);
          const y = top + height * (.297 + phase * .071);
          ctx.strokeStyle = `rgba(${style.color},${Math.sin(phase * Math.PI) * .75})`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - width * .005, y + height * .025);
          ctx.stroke();
        }
        ctx.restore();
      }

      function ring(progress, opacity) {
        const radius = .072 + progress * style.spread;
        ctx.strokeStyle = `rgba(${style.color},${Math.sin(progress * Math.PI) * opacity})`;
        ctx.beginPath();
        ctx.ellipse(left + sx * width, top + sy * height, radius * width, radius * height * .49,
          0, kind === "spring" ? .09 : 0, kind === "spring" ? Math.PI - .09 : 2 * Math.PI);
        ctx.stroke();
      }
    }
  };
}

// The route picker used three cyan rings that grew and faded over 0.9 seconds.
function paintActivationRings(ctx, x, y, width, elapsed) {
  ctx.save();
  ctx.strokeStyle = "#7cdef3";
  ctx.shadowColor = "#70cfdd55";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  for (let ring = 0; ring < 3; ring++) {
    const time = (elapsed - ring * 90) / 900;
    if (time < 0 || time >= 1) continue;
    const growth = 1 - (1 - time) ** 2;
    const radius = width * (.038 + .61 * growth);
    ctx.globalAlpha = .8 * (1 - growth);
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 55 / 120, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

// Four splashes from the supplied recording, with starting times and lengths in seconds.
const waterSteps = [[.29, .76], [1.56, .66], [2.80, .71], [3.97, .69]];

export function startWellAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const recording = new Audio(forestAssetURL("audio/freesound_community-lake-wavelet-27909.mp3"));
  recording.loop = true;
  const volume = context.createGain();
  volume.gain.value = 0;
  context.createMediaElementSource(recording).connect(volume);
  volume.connect(context.destination);
  async function loadClip(name) {
    try {
      const response = await fetch(forestAssetURL(`audio/${name}.mp3`));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await context.decodeAudioData(await response.arrayBuffer());
    } catch (error) {
      console.warn(`Well audio unavailable: ${name}`, error);
      return null;
    }
  }
  let steps;
  loadClip("water-footsteps").then(buffer => { steps = buffer; });
  const waterCue = loadClip("well-activation-water");
  const revivalCue = loadClip("well-activation-revival");

  let muted = false;
  let distance = Infinity;
  let lastVolume = 0;
  let stepIndex = 0;
  let nextStep = 0;

  function resume() {
    if (context.state !== "running") context.resume().catch(() => {});
    if (recording.paused) recording.play().catch(() => {});
  }
  resume();

  function update() {
    const proximity = Math.max(0, Math.min(1, (24 - distance) / 17));
    const target = muted || document.hidden ? 0 : proximity ** 2 * 1.4;
    if (target !== lastVolume) {
      lastVolume = target;
      volume.gain.setTargetAtTime(target, context.currentTime, .17);
    }
  }

  document.addEventListener("visibilitychange", update);
  return {
    updateDistance(value) {
      distance = value;
      update();
    },
    async playActivation(kind) {
      if (muted || document.hidden || context.state !== "running") return;
      const requestedAt = context.currentTime;
      const clip = await (kind === "revival" || kind === "shrine" ? revivalCue : waterCue);
      if (!clip || muted || document.hidden || context.state !== "running" || context.currentTime - requestedAt > .7) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = clip;
      gain.gain.value = kind === "shrine" ? .55 : .39;
      source.connect(gain);
      gain.connect(kind === "shrine" ? context.destination : volume);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start(Math.max(context.currentTime, requestedAt + .15));
    },
    playStep() {
      if (!steps || muted || document.hidden || context.state !== "running") return;
      const now = context.currentTime;
      if (now < nextStep) return;
      nextStep = now + .47;
      const [offset, duration] = waterSteps[stepIndex++ % waterSteps.length];
      const splash = context.createBufferSource();
      const envelope = context.createGain();
      splash.buffer = steps;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(.78, now + .025);
      envelope.gain.setValueAtTime(.78, now + duration - .10);
      envelope.gain.linearRampToValueAtTime(0, now + duration);
      splash.connect(envelope);
      envelope.connect(volume);
      splash.onended = () => { splash.disconnect(); envelope.disconnect(); };
      splash.start(now, offset, duration);
    },
    setMuted(value) {
      muted = value;
      if (!muted) resume();
      update();
    },
    close() {
      document.removeEventListener("visibilitychange", update);
      recording.pause();
      recording.removeAttribute("src");
      recording.load();
      context.close().catch(() => {});
    }
  };
}
