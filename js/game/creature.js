// Рисование существа без картинок: тело, хвост, плавник, глаз.
// Временное решение до готовой графики (дни 6–7) — тогда здесь будет drawImage.

import { CREATURES } from './data.js';

export function drawCreature(ctx, x, y, size, cell, t = 0) {
  const c = CREATURES[cell.lvl];
  const r = size * (0.27 + cell.lvl * 0.007);
  const bob = Math.sin(t * 2 + x * 0.05) * 3;
  ctx.save();
  ctx.translate(x, y + bob);

  if (cell.shiny) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(255,240,150,0.7)');
    glow.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2); ctx.fill();
  }

  // хвост
  ctx.fillStyle = c.fin;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(-r * 1.45, -r * 0.6);
  ctx.lineTo(-r * 1.45, r * 0.6);
  ctx.closePath(); ctx.fill();

  // тело
  ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();

  // спинной плавник
  ctx.fillStyle = c.fin;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.7);
  ctx.quadraticCurveTo(0, -r * 1.25, r * 0.35, -r * 0.7);
  ctx.closePath(); ctx.fill();

  // глаз
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(r * 0.42, -r * 0.15, r * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d3557';
  ctx.beginPath(); ctx.arc(r * 0.48, -r * 0.13, r * 0.12, 0, Math.PI * 2); ctx.fill();

  // улыбка
  ctx.strokeStyle = '#1d3557'; ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath(); ctx.arc(r * 0.45, r * 0.18, r * 0.18, 0.2, Math.PI - 0.6); ctx.stroke();

  ctx.restore();

  // номер уровня
  ctx.fillStyle = 'rgba(22,50,79,0.85)';
  ctx.beginPath(); ctx.arc(x + size * 0.32, y + size * 0.32, size * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(size * 0.15)}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(cell.lvl), x + size * 0.32, y + size * 0.33);
}
