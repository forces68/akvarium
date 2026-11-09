// Альбом существ: по вкладке на аквариум, 10 карточек в каждой.
// Открытые существа показаны целиком, остальные — тёмным силуэтом.

import { drawButton, hit, text, drawWater, makeBubbles, updateBubbles, roundRect } from './ui.js';
import { AQUARIUMS, CREATURES, MAX_LEVEL, incomeOf, fmt } from '../game/data.js';
import { drawCreature } from '../game/creature.js';

export function createAlbumScene(game) {
  const bubbles = makeBubbles(game.view, 14);
  let t = 0;
  let tab = 0;

  const back = { label: '‹ Меню', x: 20, y: 20, w: 170, h: 66, fontSize: 28, color: '#8ecae6' };
  const tabs = AQUARIUMS.map((a, i) => ({ label: a.name, x: 20 + i * 230, y: 150, w: 220, h: 60, fontSize: 24, idx: i }));

  const cache = new Map();
  function silhouette(ctx, x, y, size, lvl) {
    // рисуем существо и закрашиваем его тёмным поверх — получается силуэт
    const key = `${lvl}:${Math.round(size)}`;
    if (cache.has(key)) { ctx.drawImage(cache.get(key), x - size / 2, y - size / 2); return; }
    const off = document.createElement('canvas');
    off.width = off.height = Math.ceil(size);
    const o = off.getContext('2d');
    drawCreature(o, size / 2, size / 2, size, { lvl, shiny: false }, 0);
    o.globalCompositeOperation = 'source-in';
    o.fillStyle = 'rgba(10,30,50,0.55)';
    o.fillRect(0, 0, size, size);
    cache.set(key, off);
    ctx.drawImage(off, x - size / 2, y - size / 2);
  }

  return {
    enter() { tab = Math.min(game.state.current, AQUARIUMS.length - 1); },
    update(dt) { t += dt; updateBubbles(bubbles, game.view, dt); },

    draw(ctx, view) {
      const s = game.state;
      const aq = AQUARIUMS[tab];
      drawWater(ctx, view, t, bubbles, aq);
      drawButton(ctx, back);
      text(ctx, 'Альбом', view.w - 30, 45, 40, '#ffffff', 'right');
      text(ctx, `Найдено ${s.discovered.length} из ${MAX_LEVEL}`, view.w - 30, 95, 24, '#ffe8a3', 'right', 600);

      for (const b of tabs) {
        const open = b.idx < s.aq.length;
        b.color = b.idx === tab ? '#ffb703' : '#bde0fe';
        b.label = open ? AQUARIUMS[b.idx].name : 'Закрыто';
        drawButton(ctx, b);
      }

      // 10 карточек: 2 колонки × 5 рядов
      const top = 230, gap = 12;
      const cw = (view.w - 40 - gap) / 2;
      const ch = Math.min(130, (view.h - top - 80 - gap * 4) / 5);
      for (let i = 0; i < 10; i++) {
        const lvl = aq.from + i;
        const x = 20 + (i % 2) * (cw + gap), y = top + Math.floor(i / 2) * (ch + gap);
        const found = s.discovered.includes(lvl);
        ctx.fillStyle = found ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)';
        roundRect(ctx, x, y, cw, ch, 20); ctx.fill();
        const cs = ch * 0.95;
        if (found) drawCreature(ctx, x + cs / 2 + 4, y + ch / 2, cs, { lvl, shiny: false }, t);
        else silhouette(ctx, x + cs / 2 + 4, y + ch / 2, cs, lvl);
        const tx = x + cs + 10;
        if (found) {
          const name = CREATURES[lvl].name;
          text(ctx, name, tx, y + ch * 0.38, name.length > 13 ? 18 : 22, '#16324f', 'left', 700);
          text(ctx, `${fmt(incomeOf({ lvl }))}/сек`, tx, y + ch * 0.68, 20, '#3d5a80', 'left', 600);
        } else {
          text(ctx, '???', tx, y + ch * 0.38, 26, '#e6f7ff', 'left', 700);
          text(ctx, `Уровень ${lvl}`, tx, y + ch * 0.68, 20, '#e6f7ff', 'left', 600);
        }
      }
      text(ctx, 'Сливайте одинаковых, чтобы найти новых', view.w / 2, view.h - 30, 22, tab === 1 ? '#e6f7ff' : '#16324f', 'center', 600);
    },

    onDown(x, y) {
      if (hit(back, x, y)) { game.go('menu'); return; }
      const b = tabs.find((tb) => hit(tb, x, y));
      if (b && b.idx < game.state.aq.length) { tab = b.idx; game.audio.blip(440); }
    },
  };
}
