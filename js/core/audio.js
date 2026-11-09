// Звук без файлов: короткие эффекты генерируются Web Audio API.
// Позже сюда же добавятся файлы музыки и эффектов.

let ctx = null;
let muted = false;
let paused = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export const audio = {
  // Браузеры разрешают звук только после первого касания игрока.
  unlock() { try { ac().resume(); } catch { /* нет звука — не страшно */ } },
  setMuted(v) { muted = v; },
  isMuted() { return muted; },
  pause() { paused = true; if (ctx) ctx.suspend(); },
  resume() { paused = false; if (ctx && !muted) ctx.resume(); },

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
      o.connect(g).connect(a.destination);
      o.start(); o.stop(a.currentTime + dur);
    } catch { /* игнорируем */ }
  },
};
