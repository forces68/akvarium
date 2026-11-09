// Сцена аквариума: сетка 4×4, икринки, перетаскивание и слияние, доход.

import { drawButton, hit, text, drawWater, makeBubbles, updateBubbles, roundRect } from './ui.js';
import {
  GRID_COLS, GRID_ROWS, MAX_LEVEL_REEF, CREATURES, SHINY_CHANCE, REWARD_EGG_BONUS,
  REWARD_EGG_COOLDOWN, incomeOf, eggCost, eggLevel, fmt,
} from '../game/data.js';
import { drawCreature } from '../game/creature.js';

export function createAquariumScene(game) {
  const s = game.state;
  const bubbles = makeBubbles(game.view, 24);
  const pops = [];          // всплывающие надписи
  let t = 0;
  let drag = null;          // { from, x, y }
  let modal = null;         // { title, lines, buttons }
  let toast = null;         // { text, life }
  let rewardEggReadyAt = 0; // время игры, когда снова доступна икринка за рекламу
  let rewardBusy = false;
  let saveTimer = 0;
  let layout = null;

  const back = { label: '‹ Меню', x: 20, y: 20, w: 170, h: 66, fontSize: 28, color: '#8ecae6' };
  const eggBtn = { label: '', x: 42, y: 0, w: 636, h: 100, fontSize: 34 };
  const rewardBtn = { label: '', x: 42, y: 0, w: 636, h: 72, fontSize: 26, color: '#8ecae6' };

  function computeLayout(view) {
    const top = 150;
    const bottomUi = 230;
    const gap = 12;
    const cell = Math.min(150, (view.h - top - bottomUi - gap * (GRID_ROWS - 1)) / GRID_ROWS);
    const gridW = cell * GRID_COLS + gap * (GRID_COLS - 1);
    const x0 = (view.w - gridW) / 2;
    // на высоких экранах (телефоны) поле и кнопки — по центру по вертикали
    const blockH = gridW + 24 + 100 + 14 + 72;
    const y0 = Math.max(top, (view.h - blockH) / 2);
    const gridBottom = y0 + cell * GRID_ROWS + gap * (GRID_ROWS - 1);
    eggBtn.y = gridBottom + 24;
    rewardBtn.y = eggBtn.y + eggBtn.h + 14;
    return { cell, gap, x0, y0 };
  }

  function cellRect(i) {
    const col = i % GRID_COLS, row = Math.floor(i / GRID_COLS);
    const { cell, gap, x0, y0 } = layout;
    return { x: x0 + col * (cell + gap), y: y0 + row * (cell + gap), size: cell };
  }

  function cellAt(x, y) {
    for (let i = 0; i < s.grid.length; i++) {
      const r = cellRect(i);
      if (x >= r.x && x <= r.x + r.size && y >= r.y && y <= r.y + r.size) return i;
    }
    return -1;
  }

  function totalIncome() { return s.grid.reduce((sum, c) => sum + incomeOf(c), 0); }

  function showToast(str) { toast = { text: str, life: 2.2 }; }

  function pop(str, x, y, color = '#ffe8a3') { pops.push({ str, x, y, life: 1.2, color }); }

  function spawn(level) {
    const empty = s.grid.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (!empty.length) { showToast('Нет места — слейте одинаковых существ'); return false; }
    const i = empty[Math.floor(Math.random() * empty.length)];
    s.grid[i] = { lvl: level, shiny: false };
    discover(level, false);
    const r = cellRect(i);
    pop('Новенький!', r.x + r.size / 2, r.y + 10, '#ffffff');
    game.audio.blip(330);
    return true;
  }

  function discover(level, withModal = true) {
    if (s.discovered.includes(level)) return;
    s.discovered.push(level);
    if (level > s.maxLevel) s.maxLevel = level;
    if (withModal && level > 1) {
      modal = {
        title: 'Новое существо!',
        lines: [CREATURES[level].name, `Уровень ${level} · ${fmt(incomeOf({ lvl: level }))} монет/сек`],
        creature: { lvl: level, shiny: false },
        buttons: [{ label: 'Отлично!', action: async () => { modal = null; await game.maybeShowInterstitial(); } }],
      };
      game.audio.blip(660, 0.3);
    }
  }

  function buyEgg() {
    const lvl = eggLevel(s.maxLevel);
    const cost = eggCost(lvl, s.eggsBought);
    if (s.coins < cost) { showToast(`Нужно ${fmt(cost)} монет`); return; }
    if (spawn(lvl)) { s.coins -= cost; s.eggsBought[lvl] = (s.eggsBought[lvl] || 0) + 1; game.saveState(); }
  }

  async function rewardEgg() {
    if (game.playTime < rewardEggReadyAt) return;
    if (!s.grid.includes(null)) { showToast('Нет места — слейте одинаковых существ'); return; }
    rewardBusy = true;
    const ok = await game.platform.showRewarded();
    rewardBusy = false;
    const lvl = Math.min(MAX_LEVEL_REEF - 1, eggLevel(s.maxLevel) + REWARD_EGG_BONUS);
    if (ok && spawn(lvl)) {
      discover(lvl);
      rewardEggReadyAt = game.playTime + REWARD_EGG_COOLDOWN;
      game.saveState();
    }
  }

  function drop(from, to) {
    if (to < 0 || to === from) return;
    const a = s.grid[from], b = s.grid[to];
    if (b && a.lvl === b.lvl) {
      if (a.lvl >= MAX_LEVEL_REEF) { showToast('Максимум Рифа. Скоро — Глубина!'); return; }
      const lvl = a.lvl + 1;
      const shiny = Math.random() < SHINY_CHANCE;
      s.grid[to] = { lvl, shiny };
      s.grid[from] = null;
      const r = cellRect(to);
      pop(shiny ? 'Сияющее!' : `Ур. ${lvl}`, r.x + r.size / 2, r.y + 10, shiny ? '#fff3a3' : '#ffffff');
      game.audio.blip(300 + lvl * 60, 0.18);
      discover(lvl);
    } else {
      s.grid[to] = a;
      s.grid[from] = b; // обмен или перенос в пустую клетку
    }
    game.saveState();
  }

  function offerOffline() {
    const amount = game.pendingOffline;
    game.pendingOffline = 0;
    if (amount < 1) return;
    const take = (mult) => { s.coins += amount * mult; game.saveState(); pop(`+${fmt(amount * mult)}`, 360, 120); };
    modal = {
      title: 'Пока вас не было',
      lines: ['Ваши существа заработали', `${fmt(amount)} монет`],
      buttons: [
        { label: 'Забрать ×2 (реклама)', color: '#ffb703', action: async () => {
          modal = null;
          const ok = await game.platform.showRewarded();
          take(ok ? 2 : 1);
        } },
        { label: 'Забрать', color: '#8ecae6', action: () => { modal = null; take(1); } },
      ],
    };
  }

  function drawModal(ctx, view) {
    ctx.fillStyle = 'rgba(4,20,35,0.7)';
    ctx.fillRect(0, 0, view.w, view.h);
    const w = 600, h = modal.creature ? 560 : 440;
    const x = (view.w - w) / 2, y = (view.h - h) / 2;
    ctx.fillStyle = '#e6f7ff';
    roundRect(ctx, x, y, w, h, 30); ctx.fill();
    text(ctx, modal.title, view.w / 2, y + 60, 40, '#16324f');
    let ly = y + 120;
    if (modal.creature) { drawCreature(ctx, view.w / 2, y + 190, 200, modal.creature, t); ly = y + 320; }
    for (const line of modal.lines) { text(ctx, line, view.w / 2, ly, 30, '#16324f', 'center', 600); ly += 44; }
    let by = y + h - 30 - modal.buttons.length * 96 + 10;
    for (const b of modal.buttons) {
      Object.assign(b, { x: x + 50, y: by, w: w - 100, h: 80, fontSize: 30 });
      drawButton(ctx, b);
      by += 96;
    }
  }

  return {
    enter() { offerOffline(); },

    update(dt) {
      t += dt;
      updateBubbles(bubbles, game.view, dt);
      if (!modal) s.coins += totalIncome() * dt;
      for (const p of pops) { p.y -= 70 * dt; p.life -= dt; }
      for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life <= 0) pops.splice(i, 1);
      if (toast) { toast.life -= dt; if (toast.life <= 0) toast = null; }
      saveTimer += dt;
      if (saveTimer > 3) { saveTimer = 0; game.saveState(); }
    },

    draw(ctx, view) {
      layout = computeLayout(view);
      drawWater(ctx, view, t, bubbles);
      drawButton(ctx, back);
      text(ctx, `${fmt(s.coins)}`, view.w - 30, 45, 40, '#ffe8a3', 'right');
      text(ctx, `+${fmt(totalIncome())}/сек`, view.w - 30, 92, 26, '#e6f7ff', 'right', 600);

      for (let i = 0; i < s.grid.length; i++) {
        const r = cellRect(i);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        roundRect(ctx, r.x, r.y, r.size, r.size, 22); ctx.fill();
        const c = s.grid[i];
        if (c && !(drag && drag.from === i)) drawCreature(ctx, r.x + r.size / 2, r.y + r.size / 2, r.size, c, t);
      }

      const elvl = eggLevel(s.maxLevel);
      const cost = eggCost(elvl, s.eggsBought);
      eggBtn.label = `Икринка ур. ${elvl} — ${fmt(cost)}`;
      eggBtn.color = s.coins >= cost ? '#ffb703' : '#c9a24a';
      drawButton(ctx, eggBtn);
      const wait = Math.ceil(rewardEggReadyAt - game.playTime);
      const rlvl = Math.min(MAX_LEVEL_REEF - 1, elvl + REWARD_EGG_BONUS);
      rewardBtn.label = wait > 0 ? `Икринка ур. ${rlvl} — через ${wait} с` : `Икринка ур. ${rlvl} за рекламу`;
      rewardBtn.disabled = rewardBusy || wait > 0;
      drawButton(ctx, rewardBtn);

      if (s.discovered.length < 2 && !modal) {
        text(ctx, 'Купите две икринки и перетащите', view.w / 2, layout.y0 - 28, 26, '#ffffff', 'center', 600);
      }

      if (drag) {
        const c = s.grid[drag.from];
        if (c) drawCreature(ctx, drag.x, drag.y, layout.cell * 1.1, c, 0);
      }

      for (const p of pops) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        text(ctx, p.str, p.x, p.y, 30, p.color);
        ctx.globalAlpha = 1;
      }
      if (toast) {
        ctx.fillStyle = 'rgba(4,20,35,0.85)';
        roundRect(ctx, 40, layout.y0 + 200, view.w - 80, 80, 20); ctx.fill();
        text(ctx, toast.text, view.w / 2, layout.y0 + 240, 28, '#ffffff', 'center', 600);
      }
      if (modal) drawModal(ctx, view);
    },

    async onDown(x, y) {
      if (modal) {
        const b = modal.buttons.find((btn) => hit(btn, x, y));
        if (b) await b.action();
        return;
      }
      if (hit(back, x, y)) { game.saveState(); game.go('menu'); await game.maybeShowInterstitial(); return; }
      if (hit(eggBtn, x, y)) { buyEgg(); return; }
      if (hit(rewardBtn, x, y)) { await rewardEgg(); return; }
      const i = cellAt(x, y);
      if (i >= 0 && s.grid[i]) drag = { from: i, x, y };
    },
    onMove(x, y) { if (drag) { drag.x = x; drag.y = y; } },
    onUp(x, y) {
      if (!drag) return;
      const from = drag.from;
      drag = null;
      drop(from, cellAt(x, y));
    },
  };
}
