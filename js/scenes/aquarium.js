// Сцена аквариума: сетка 4×4, икринки, перетаскивание и слияние, доход,
// переключение аквариумов, подарок дня и ежедневные задания.

import { drawButton, hit, text, drawWater, makeBubbles, updateBubbles, roundRect } from './ui.js';
import {
  GRID_COLS, GRID_ROWS, AQUARIUMS, CREATURES, SHINY_CHANCE, REWARD_EGG_BONUS,
  REWARD_EGG_COOLDOWN, TASK_TYPES, incomeOf, eggCost, eggLevel, giftReward, taskReward, fmt,
} from '../game/data.js';
import {
  emptyAquarium, totalIncome, today, yesterday, refreshTasks, addProgress, claimableTasks,
} from '../game/state.js';
import { drawCreature } from '../game/creature.js';

export function createAquariumScene(game) {
  const s = game.state;
  const bubbles = makeBubbles(game.view, 24);
  const pops = [];          // всплывающие надписи
  const modals = [];        // очередь окон: показывается первое
  let t = 0;
  let drag = null;          // { from, x, y }
  let toast = null;         // { text, life }
  let rewardEggReadyAt = 0; // время игры, когда снова доступна икринка за рекламу
  let rewardBusy = false;
  let saveTimer = 0;
  let layout = null;

  const back = { label: '‹ Меню', x: 20, y: 20, w: 170, h: 66, fontSize: 28, color: '#8ecae6' };
  const prevBtn = { label: '‹', x: 20, y: 115, w: 70, h: 62, fontSize: 40, color: '#8ecae6' };
  const nextBtn = { label: '›', x: 370, y: 115, w: 70, h: 62, fontSize: 40, color: '#8ecae6' };
  const tasksBtn = { label: 'Задания', x: 460, y: 115, w: 240, h: 62, fontSize: 28, color: '#bde0fe' };
  const eggBtn = { label: '', x: 42, y: 0, w: 636, h: 100, fontSize: 34 };
  const rewardBtn = { label: '', x: 42, y: 0, w: 636, h: 72, fontSize: 26, color: '#8ecae6' };

  const aq = () => s.aq[s.current];
  const info = () => AQUARIUMS[s.current];

  function computeLayout(view) {
    const top = 215;
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
    for (let i = 0; i < aq().grid.length; i++) {
      const r = cellRect(i);
      if (x >= r.x && x <= r.x + r.size && y >= r.y && y <= r.y + r.size) return i;
    }
    return -1;
  }

  function showToast(str) { toast = { text: str, life: 2.4 }; }
  function pop(str, x, y, color = '#ffe8a3') { pops.push({ str, x, y, life: 1.2, color }); }
  function closeModal() { modals.shift(); }

  function spawn(level) {
    const grid = aq().grid;
    const empty = grid.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (!empty.length) { showToast('Нет места — слейте одинаковых существ'); return false; }
    const i = empty[Math.floor(Math.random() * empty.length)];
    grid[i] = { lvl: level, shiny: false };
    discover(level, false);
    const r = cellRect(i);
    pop('Новенький!', r.x + r.size / 2, r.y + 10, '#ffffff');
    game.audio.blip(330);
    return true;
  }

  function discover(level, withModal = true) {
    if (level > aq().maxLevel) aq().maxLevel = level;
    if (s.discovered.includes(level)) return;
    s.discovered.push(level);
    if (withModal && level > 1) {
      modals.push({
        title: 'Новое существо!',
        lines: [CREATURES[level].name, `Уровень ${level} · ${fmt(incomeOf({ lvl: level }))} монет/сек`],
        creature: { lvl: level, shiny: false },
        buttons: [{ label: 'Отлично!', action: async () => { closeModal(); await game.maybeShowInterstitial(); } }],
      });
      game.audio.blip(660, 0.3);
    }
    if (level === info().to) unlockNext(s.current);
  }

  // Существо последнего уровня открывает следующий аквариум.
  function unlockNext(fromIdx) {
    const idx = fromIdx + 1;
    if (idx >= AQUARIUMS.length || s.aq.length > idx) return;
    const next = AQUARIUMS[idx];
    s.aq.push(emptyAquarium());
    s.aq[idx].grid[5] = { lvl: next.from, shiny: false }; // две стартовые икринки в подарок
    s.aq[idx].grid[6] = { lvl: next.from, shiny: false };
    s.aq[idx].maxLevel = next.from;
    if (!s.discovered.includes(next.from)) s.discovered.push(next.from);
    modals.push({
      title: 'Новый аквариум!',
      lines: [`Открыт аквариум «${next.name}»`, 'Там уже ждут две икринки'],
      creature: { lvl: next.from, shiny: false },
      buttons: [
        { label: 'Поплыли!', action: () => { closeModal(); switchTo(idx); } },
        { label: 'Позже', color: '#8ecae6', action: closeModal },
      ],
    });
    game.saveState();
  }

  function switchTo(idx) {
    if (idx < 0 || idx >= s.aq.length) return;
    s.current = idx;
    drag = null;
    game.audio.blip(440);
    game.saveState();
  }

  function buyEgg() {
    const lvl = eggLevel(info(), aq().maxLevel);
    const cost = eggCost(lvl, aq().eggsBought, info());
    if (s.coins < cost) { showToast(`Нужно ${fmt(cost)} монет`); return; }
    if (spawn(lvl)) {
      s.coins -= cost;
      aq().eggsBought[lvl] = (aq().eggsBought[lvl] || 0) + 1;
      addProgress(s, 'egg');
      game.saveState();
    }
  }

  function rewardEggLevel() {
    return Math.min(info().to - 1, eggLevel(info(), aq().maxLevel) + REWARD_EGG_BONUS);
  }

  async function rewardEgg() {
    if (game.playTime < rewardEggReadyAt) return;
    if (!aq().grid.includes(null)) { showToast('Нет места — слейте одинаковых существ'); return; }
    rewardBusy = true;
    const ok = await game.platform.showRewarded();
    rewardBusy = false;
    const lvl = rewardEggLevel();
    if (ok && spawn(lvl)) {
      discover(lvl);
      rewardEggReadyAt = game.playTime + REWARD_EGG_COOLDOWN;
      game.saveState();
    }
  }

  function drop(from, to) {
    const grid = aq().grid;
    if (to < 0 || to === from) return;
    const a = grid[from], b = grid[to];
    if (b && a.lvl === b.lvl) {
      if (a.lvl >= info().to) {
        const next = AQUARIUMS[s.current + 1];
        showToast(next ? `Максимум! Дальше — «${next.name}» (кнопка ›)` : 'Это самое редкое существо!');
        return;
      }
      const lvl = a.lvl + 1;
      const shiny = Math.random() < SHINY_CHANCE;
      grid[to] = { lvl, shiny };
      grid[from] = null;
      const r = cellRect(to);
      pop(shiny ? 'Сияющее!' : `Ур. ${lvl}`, r.x + r.size / 2, r.y + 10, shiny ? '#fff3a3' : '#ffffff');
      game.audio.blip(300 + (lvl % 10) * 60, 0.18);
      addProgress(s, 'merge');
      if (shiny) addProgress(s, 'shiny');
      discover(lvl);
    } else {
      grid[to] = a;
      grid[from] = b; // обмен или перенос в пустую клетку
    }
    game.saveState();
  }

  function offerOffline() {
    const amount = game.pendingOffline;
    game.pendingOffline = 0;
    if (amount < 1) return;
    const take = (mult) => { s.coins += amount * mult; game.saveState(); pop(`+${fmt(amount * mult)}`, 360, 120); };
    modals.push({
      title: 'Пока вас не было',
      lines: ['Ваши существа заработали', `${fmt(amount)} монет`],
      buttons: [
        { label: 'Забрать ×2 (реклама)', color: '#ffb703', action: async () => {
          closeModal();
          const ok = await game.platform.showRewarded();
          take(ok ? 2 : 1);
        } },
        { label: 'Забрать', color: '#8ecae6', action: () => { closeModal(); take(1); } },
      ],
    });
  }

  // Подарок дня: 7 дней подряд — подарок всё больше; пропуск дня начинает серию заново.
  // Новичку не показываем, пока он не освоился (меньше 3 открытых существ).
  function offerDailyGift() {
    const d = today();
    if (s.daily.last === d || s.discovered.length < 3) return;
    const streak = s.daily.last === yesterday() ? s.daily.streak + 1 : 1;
    const day = ((streak - 1) % 7) + 1;
    const amount = giftReward(totalIncome(s), day);
    modals.push({
      title: 'Подарок дня',
      lines: [`День ${day} из 7`, `${fmt(amount)} монет`, day < 7 ? 'Завтра подарок будет больше' : 'Самый большой подарок!'],
      buttons: [{ label: 'Забрать', action: () => {
        closeModal();
        s.daily = { last: d, streak };
        s.coins += amount;
        pop(`+${fmt(amount)}`, 360, 120);
        game.audio.blip(780, 0.25);
        game.saveState();
      } }],
    });
  }

  function openTasks() {
    refreshTasks(s);
    modals.push({ kind: 'tasks', title: 'Задания на сегодня', buttons: [] });
  }

  function claimTask(task) {
    const amount = taskReward(totalIncome(s));
    task.claimed = true;
    s.coins += amount;
    pop(`+${fmt(amount)}`, 360, 120);
    game.audio.blip(700, 0.2);
    game.saveState();
  }

  function taskLabel(task) {
    const p = Math.floor(task.progress);
    const shown = task.type === 'play' ? `${Math.floor(p / 60)}/${task.goal / 60} мин` : `${p}/${task.goal}`;
    return { title: TASK_TYPES[task.type].label(task.goal), shown };
  }

  function drawTasks(ctx, view, m) {
    const w = 640, h = 690;
    const x = (view.w - w) / 2, y = (view.h - h) / 2;
    ctx.fillStyle = '#e6f7ff';
    roundRect(ctx, x, y, w, h, 30); ctx.fill();
    text(ctx, m.title, view.w / 2, y + 55, 38, '#16324f');
    text(ctx, `Награда за каждое: ${fmt(taskReward(totalIncome(s)))} монет`, view.w / 2, y + 100, 24, '#3d5a80', 'center', 600);
    m.buttons = [];
    s.tasks.list.forEach((task, i) => {
      const ry = y + 140 + i * 130;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x + 24, ry, w - 48, 112, 20); ctx.fill();
      const { title, shown } = taskLabel(task);
      text(ctx, title, x + 48, ry + 36, 26, '#16324f', 'left', 700);
      // полоска прогресса
      const bw = 300, frac = Math.min(1, task.progress / task.goal);
      ctx.fillStyle = '#d0e4f0'; roundRect(ctx, x + 48, ry + 66, bw, 22, 11); ctx.fill();
      if (frac > 0) { ctx.fillStyle = '#52b788'; roundRect(ctx, x + 48, ry + 66, Math.max(22, bw * frac), 22, 11); ctx.fill(); }
      text(ctx, shown, x + 48 + bw + 14, ry + 78, 22, '#3d5a80', 'left', 600);
      const btn = { x: x + w - 200, y: ry + 52, w: 160, h: 50, fontSize: 24 };
      if (task.claimed) { btn.label = 'Готово'; btn.disabled = true; } else if (task.progress >= task.goal) {
        btn.label = 'Забрать'; btn.action = () => claimTask(task);
      } else { btn.label = 'В пути'; btn.disabled = true; }
      drawButton(ctx, btn);
      m.buttons.push(btn);
    });
    const close = { label: 'Закрыть', x: x + 50, y: y + h - 100, w: w - 100, h: 76, fontSize: 30, color: '#8ecae6', action: closeModal };
    drawButton(ctx, close);
    m.buttons.push(close);
    text(ctx, 'Новые задания — завтра', view.w / 2, y + h - 128, 22, '#3d5a80', 'center', 600);
  }

  function drawModal(ctx, view, m) {
    ctx.fillStyle = 'rgba(4,20,35,0.7)';
    ctx.fillRect(0, 0, view.w, view.h);
    if (m.kind === 'tasks') { drawTasks(ctx, view, m); return; }
    const w = 600;
    const h = (m.creature ? 400 : 200) + m.lines.length * 44 + m.buttons.length * 96;
    const x = (view.w - w) / 2, y = (view.h - h) / 2;
    ctx.fillStyle = '#e6f7ff';
    roundRect(ctx, x, y, w, h, 30); ctx.fill();
    text(ctx, m.title, view.w / 2, y + 60, 40, '#16324f');
    let ly = y + 120;
    if (m.creature) { drawCreature(ctx, view.w / 2, y + 190, 200, m.creature, t); ly = y + 320; }
    for (const line of m.lines) { text(ctx, line, view.w / 2, ly, 30, '#16324f', 'center', 600); ly += 44; }
    let by = y + h - 30 - m.buttons.length * 96 + 10;
    for (const b of m.buttons) {
      Object.assign(b, { x: x + 50, y: by, w: w - 100, h: 80, fontSize: 30 });
      drawButton(ctx, b);
      by += 96;
    }
  }

  return {
    enter() {
      refreshTasks(s);
      offerOffline();
      // на случай старого сохранения, где последний уровень уже получен
      s.aq.forEach((a, i) => { if (a.maxLevel >= AQUARIUMS[i].to) unlockNext(i); });
      offerDailyGift();
    },

    update(dt) {
      t += dt;
      updateBubbles(bubbles, game.view, dt);
      if (!modals.length) {
        s.coins += totalIncome(s) * dt;
        addProgress(s, 'play', dt);
      }
      for (const p of pops) { p.y -= 70 * dt; p.life -= dt; }
      for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life <= 0) pops.splice(i, 1);
      if (toast) { toast.life -= dt; if (toast.life <= 0) toast = null; }
      saveTimer += dt;
      if (saveTimer > 3) { saveTimer = 0; game.saveState(); }
    },

    draw(ctx, view) {
      layout = computeLayout(view);
      const a = aq(), inf = info();
      drawWater(ctx, view, t, bubbles, inf);
      drawButton(ctx, back);
      text(ctx, `${fmt(s.coins)}`, view.w - 30, 45, 40, '#ffe8a3', 'right');
      text(ctx, `+${fmt(totalIncome(s))}/сек`, view.w - 30, 92, 26, '#e6f7ff', 'right', 600);

      // переключатель аквариумов
      prevBtn.disabled = s.current === 0;
      nextBtn.disabled = s.current >= s.aq.length - 1;
      drawButton(ctx, prevBtn);
      drawButton(ctx, nextBtn);
      text(ctx, inf.name, 230, 140, inf.name.length > 8 ? 26 : 32, '#ffffff');
      text(ctx, `${s.current + 1} из ${s.aq.length}`, 230, 168, 18, '#e6f7ff', 'center', 600);
      const ready = claimableTasks(s);
      tasksBtn.label = ready ? `Задания (${ready})` : 'Задания';
      tasksBtn.color = ready ? '#ffb703' : '#bde0fe';
      drawButton(ctx, tasksBtn);

      for (let i = 0; i < a.grid.length; i++) {
        const r = cellRect(i);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        roundRect(ctx, r.x, r.y, r.size, r.size, 22); ctx.fill();
        const c = a.grid[i];
        if (c && !(drag && drag.from === i)) drawCreature(ctx, r.x + r.size / 2, r.y + r.size / 2, r.size, c, t);
      }

      const elvl = eggLevel(inf, a.maxLevel);
      const cost = eggCost(elvl, a.eggsBought, inf);
      eggBtn.label = `Икринка ур. ${elvl} — ${fmt(cost)}`;
      eggBtn.color = s.coins >= cost ? '#ffb703' : '#c9a24a';
      drawButton(ctx, eggBtn);
      const wait = Math.ceil(rewardEggReadyAt - game.playTime);
      const rlvl = rewardEggLevel();
      rewardBtn.label = wait > 0 ? `Икринка ур. ${rlvl} — через ${wait} с` : `Икринка ур. ${rlvl} за рекламу`;
      rewardBtn.disabled = rewardBusy || wait > 0;
      drawButton(ctx, rewardBtn);

      if (s.discovered.length < 2 && !modals.length) {
        text(ctx, 'Купите две икринки и перетащите', view.w / 2, layout.y0 - 20, 26, '#ffffff', 'center', 600);
      }

      if (drag) {
        const c = a.grid[drag.from];
        if (c) drawCreature(ctx, drag.x, drag.y, layout.cell * 1.1, c, 0);
      }

      for (const p of pops) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        text(ctx, p.str, p.x, p.y, 30, p.color);
        ctx.globalAlpha = 1;
      }
      if (toast) {
        ctx.fillStyle = 'rgba(4,20,35,0.85)';
        roundRect(ctx, 30, layout.y0 + 200, view.w - 60, 80, 20); ctx.fill();
        text(ctx, toast.text, view.w / 2, layout.y0 + 240, 26, '#ffffff', 'center', 600);
      }
      if (modals.length) drawModal(ctx, view, modals[0]);
    },

    async onDown(x, y) {
      if (modals.length) {
        const b = modals[0].buttons.find((btn) => btn.action && hit(btn, x, y));
        if (b) await b.action();
        return;
      }
      if (hit(back, x, y)) { game.saveState(); game.go('menu'); await game.maybeShowInterstitial(); return; }
      if (hit(prevBtn, x, y)) { switchTo(s.current - 1); return; }
      if (hit(nextBtn, x, y)) { switchTo(s.current + 1); return; }
      if (hit(tasksBtn, x, y)) { openTasks(); return; }
      if (hit(eggBtn, x, y)) { buyEgg(); return; }
      if (hit(rewardBtn, x, y)) { await rewardEgg(); return; }
      const i = cellAt(x, y);
      if (i >= 0 && aq().grid[i]) drag = { from: i, x, y };
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
