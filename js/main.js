// Точка входа: площадка → экран → сцены → игровой цикл.

import { createPlatform } from './platform/index.js';
import { setupScreen } from './core/screen.js';
import { audio } from './core/audio.js';
import { createMenuScene } from './scenes/menu.js';
import { createAquariumScene } from './scenes/aquarium.js';

const SAVE_KEY = 'state';
const INTERSTITIAL_MIN_GAP = 180; // секунд между межстраничной рекламой (Пикабу требует ≥120)
const INTERSTITIAL_FIRST_AFTER = 300; // первая — не раньше чем через 5 минут игры

const canvas = document.getElementById('game');
const screen = setupScreen(canvas);

let paused = false;
function pauseGame() { paused = true; audio.pause(); }
function resumeGame() { paused = false; audio.resume(); }

const game = {
  view: screen.view,
  audio,
  platform: null,
  state: null,
  playTime: 0,
  lastInterstitial: 0,
  scenes: {},
  scene: null,

  go(name) { this.scene = this.scenes[name]; },
  saveState() { this.platform.save(SAVE_KEY, this.state); },

  async maybeShowInterstitial() {
    if (this.playTime < INTERSTITIAL_FIRST_AFTER) return;
    if (this.playTime - this.lastInterstitial < INTERSTITIAL_MIN_GAP) return;
    if (this.state.noAds) return;
    if (!(await this.platform.canShowInterstitial())) return;
    this.lastInterstitial = this.playTime;
    await this.platform.showInterstitial();
  },
};

async function boot() {
  game.platform = await createPlatform({ onPause: pauseGame, onResume: resumeGame });

  // Реклама при загрузке (только телефоны на Пикабу) идёт параллельно подготовке игры.
  const preloader = game.platform.showPreloader ? game.platform.showPreloader() : Promise.resolve();

  const saved = game.platform.load(SAVE_KEY);
  game.state = { coins: 0, muted: false, noAds: false, ...(saved || {}) };
  const owned = await game.platform.getOwnedProducts().catch(() => []);
  if (owned.includes('bez_reklamy')) game.state.noAds = true;
  audio.setMuted(game.state.muted);

  game.scenes.menu = createMenuScene(game);
  game.scenes.aquarium = createAquariumScene(game);
  game.go('menu');

  await preloader;
  document.getElementById('loading').remove();
  game.platform.gameStarted();
  requestAnimationFrame(loop);
}

// Ввод: одно касание = одно нажатие (и мышь, и палец).
canvas.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (paused || !game.scene) return;
  const p = screen.toView(e.clientX, e.clientY);
  game.scene.onTap?.(p.x, p.y);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Автопауза при сворачивании или смене вкладки — требование Пикабу.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseGame(); game.platform?.flush?.(); }
  else resumeGame();
});

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!paused) {
    game.playTime += dt;
    game.scene.update(dt);
  }
  screen.begin();
  game.scene.draw(screen.ctx, game.view);
  requestAnimationFrame(loop);
}

boot();
