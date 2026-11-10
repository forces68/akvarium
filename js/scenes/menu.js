// Главное меню.

import { drawButton, hit, text, drawWater, makeBubbles, updateBubbles } from './ui.js';

export function createMenuScene(game) {
  const bubbles = makeBubbles(game.view);
  let t = 0;

  const play = { label: 'Играть', x: 160, y: 0, w: 400, h: 110, fontSize: 44 };
  const album = { label: 'Альбом', x: 210, y: 0, w: 300, h: 80, fontSize: 30, color: '#bde0fe' };
  const sound = { label: '', x: 110, y: 0, w: 240, h: 80, fontSize: 26, color: '#8ecae6' };
  const music = { label: '', x: 370, y: 0, w: 240, h: 80, fontSize: 26, color: '#8ecae6' };

  return {
    update(dt) { t += dt; updateBubbles(bubbles, game.view, dt); },
    draw(ctx, view) {
      drawWater(ctx, view, t, bubbles);
      text(ctx, 'Чудо-Аквариум', view.w / 2, view.h * 0.28, 72);
      text(ctx, 'Слияние', view.w / 2, view.h * 0.28 + 80, 48, '#ffe8a3');
      play.y = view.h * 0.5;
      album.y = play.y + 140;
      sound.y = music.y = album.y + 100;
      sound.label = game.audio.isMuted() ? 'Звук: выкл' : 'Звук: вкл';
      music.label = game.audio.isMusicOn() ? 'Музыка: вкл' : 'Музыка: выкл';
      drawButton(ctx, play);
      drawButton(ctx, album);
      drawButton(ctx, sound);
      drawButton(ctx, music);
      text(ctx, `площадка: ${game.platform.name}`, view.w / 2, view.h - 30, 20, '#16324f', 'center', 500);
    },
    onDown(x, y) {
      if (hit(play, x, y)) { game.audio.blip(520); game.go('aquarium'); }
      else if (hit(album, x, y)) { game.audio.blip(440); game.go('album'); }
      else if (hit(sound, x, y)) {
        game.audio.setMuted(!game.audio.isMuted());
        game.state.muted = game.audio.isMuted();
        game.saveState();
      } else if (hit(music, x, y)) {
        game.audio.setMusic(!game.audio.isMusicOn());
        game.state.music = game.audio.isMusicOn();
        game.saveState();
      }
    },
  };
}
