// Сцена аквариума. ПОКА ЗАГЛУШКА ДНЯ 2: проверяем касания, сохранение, рекламу и паузу.
// В дни 3–4 здесь появятся сетка, икринки и слияние.

import { drawButton, hit, text, drawWater, makeBubbles, updateBubbles } from './ui.js';

export function createAquariumScene(game) {
  const bubbles = makeBubbles(game.view, 24);
  const pops = []; // всплывающие «+1»
  let t = 0;

  const back = { label: '‹ Меню', x: 20, y: 20, w: 170, h: 70, fontSize: 28, color: '#8ecae6' };
  const bonus = { label: 'Монеты ×2 (реклама)', x: 110, y: 0, w: 500, h: 90, fontSize: 30 };

  return {
    update(dt) {
      t += dt;
      updateBubbles(bubbles, game.view, dt);
      for (const p of pops) { p.y -= 80 * dt; p.life -= dt; }
      while (pops.length && pops[0].life <= 0) pops.shift();
    },
    draw(ctx, view) {
      drawWater(ctx, view, t, bubbles);
      drawButton(ctx, back);
      text(ctx, `Монеты: ${game.state.coins}`, view.w - 30, 55, 36, '#ffe8a3', 'right');
      text(ctx, 'Касайтесь воды — проверка', view.w / 2, view.h * 0.4, 30);
      text(ctx, 'сохранения прогресса', view.w / 2, view.h * 0.4 + 44, 30);
      bonus.y = view.h - 200;
      drawButton(ctx, bonus);
      for (const p of pops) {
        ctx.globalAlpha = Math.max(0, p.life);
        text(ctx, '+1', p.x, p.y, 36, '#ffe8a3');
        ctx.globalAlpha = 1;
      }
    },
    async onTap(x, y) {
      if (hit(back, x, y)) {
        game.go('menu');
        // Межстраничная реклама — только в логической паузе и не чаще, чем разрешено.
        await game.maybeShowInterstitial();
      } else if (hit(bonus, x, y)) {
        bonus.disabled = true;
        const reward = await game.platform.showRewarded();
        if (reward) { game.state.coins *= 2; game.saveState(); game.audio.blip(880, 0.25); }
        bonus.disabled = false;
      } else {
        game.state.coins += 1;
        game.saveState();
        pops.push({ x, y, life: 1 });
        game.audio.blip(400 + Math.random() * 200);
      }
    },
  };
}
