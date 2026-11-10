// Звук без файлов: и эффекты, и музыка генерируются Web Audio API прямо в браузере.
// Музыка — спокойная «подводная» мелодия: мягкий аккордовый фон, бас и перезвон
// с эхом. Ноты выбираются случайно из аккорда, поэтому мелодия не надоедает.
// У каждого аквариума своё настроение: Риф — светлый, Глубина — тёмный и медленный,
// Ледяное море — высокий и звонкий.

let ctx = null;
let sfxBus = null, musicBus = null, delayIn = null;
let muted = false;        // эффекты
let musicOn = true;       // музыка
let paused = false;
let started = false;
let timer = null;
let nextTime = 0;         // когда звучит следующая восьмая
let step = 0;             // номер восьмой с начала
let themeIdx = 0;

const MUSIC_VOLUME = 0.16;

// Аккорды — номера нот MIDI. 8 восьмых на аккорд.
const THEMES = [
  { // Риф: до мажор
    bpm: 76, arpOct: 12, arpChance: 0.7, wave: 'triangle',
    chords: [[48, 55, 59, 64, 67], [45, 52, 55, 60, 64], [41, 48, 52, 57, 60], [43, 50, 55, 59, 62]],
  },
  { // Глубина: ля минор, медленнее и ниже
    bpm: 64, arpOct: 12, arpChance: 0.45, wave: 'sine',
    chords: [[45, 52, 55, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 58, 62], [40, 47, 52, 55, 59]],
  },
  { // Ледяное море: ми мажор, высокий перезвон
    bpm: 72, arpOct: 24, arpChance: 0.6, wave: 'triangle',
    chords: [[40, 47, 52, 56, 59], [44, 51, 56, 59, 63], [37, 44, 49, 52, 56], [42, 49, 54, 57, 61]],
  },
];

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    sfxBus = ctx.createGain(); sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOLUME : 0;
    // мягкий фильтр — звук «как под водой»
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    musicBus.connect(lp).connect(ctx.destination);
    // эхо для перезвона
    delayIn = ctx.createGain(); delayIn.gain.value = 0.35;
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.36;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    delayIn.connect(delay); delay.connect(fb).connect(delay); delay.connect(musicBus);
  }
  return ctx;
}

function note(midi, time, dur, vol, type, toDelay = false) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + Math.min(0.04, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g).connect(musicBus);
  if (toDelay) g.connect(delayIn);
  o.start(time); o.stop(time + dur + 0.05);
}

function pad(chord, time, dur) {
  for (const m of chord.slice(0, 3)) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m + 12);
    o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.09, time + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, time + dur * 1.05);
    o.connect(g).connect(musicBus);
    o.start(time); o.stop(time + dur * 1.1);
  }
}

// Планировщик: раз в 0,2 с досыпает ноты на полсекунды вперёд.
// Когда игра на паузе, время звука стоит — ноты не копятся.
function schedule() {
  if (!ctx || ctx.state !== 'running') return;
  const th = THEMES[themeIdx];
  const eighth = 60 / th.bpm / 2;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + 0.5) {
    const chord = th.chords[Math.floor(step / 8) % th.chords.length];
    const pos = step % 8;
    if (pos === 0) { pad(chord, nextTime, eighth * 8); note(chord[0] - 12, nextTime, eighth * 3.5, 0.22, 'sine'); }
    if (pos === 4) note(chord[0] - 12, nextTime, eighth * 3, 0.15, 'sine');
    if (Math.random() < th.arpChance && pos !== 7) {
      const m = chord[1 + Math.floor(Math.random() * 4)] + th.arpOct;
      note(m, nextTime, eighth * 2.2, 0.07, th.wave, true);
    }
    nextTime += eighth;
    step++;
  }
}

function startMusic() {
  if (started) return;
  started = true;
  nextTime = 0; step = 0;
  timer = setInterval(schedule, 200);
}

export const audio = {
  // Браузеры разрешают звук только после первого касания игрока.
  unlock() {
    try {
      ac();
      if (!paused) ctx.resume();
      startMusic();
    } catch { /* нет звука — не страшно */ }
  },
  setMuted(v) { muted = v; },
  isMuted() { return muted; },
  setMusic(on) {
    musicOn = on;
    if (musicBus) musicBus.gain.setTargetAtTime(on ? MUSIC_VOLUME : 0, ctx.currentTime, 0.3);
  },
  isMusicOn() { return musicOn; },
  // Смена настроения музыки при переходе в другой аквариум (с начала аккорда).
  setTheme(i) {
    if (i === themeIdx || !THEMES[i]) return;
    themeIdx = i;
    step = Math.ceil(step / 8) * 8;
  },
  pause() { paused = true; if (ctx) ctx.suspend(); },
  resume() { paused = false; if (ctx) ctx.resume(); },

  // Простой «блюп»: частота растёт с уровнем существа.
  blip(freq = 440, dur = 0.12) {
    if (muted || paused) return;
    try {
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.6, a.currentTime + dur);
      g.gain.setValueAtTime(0.15, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      o.connect(g).connect(sfxBus);
      o.start(); o.stop(a.currentTime + dur);
    } catch { /* игнорируем */ }
  },
};
