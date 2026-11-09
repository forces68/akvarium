// Существа, нарисованные кодом (без картинок): у каждого уровня своя форма.
// drawCreature(ctx, x, y, size, cell, t) — центр (x, y), size — размер клетки.

import { CREATURES } from './data.js';

const INK = '#1d3557';

// Глаза-«бусинки» с бликом: общий стиль для всех существ.
function eye(ctx, x, y, s) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x + s * 0.15, y + s * 0.1, s * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + s * 0.32, y - s * 0.15, s * 0.2, 0, Math.PI * 2); ctx.fill();
}
function eyes(ctx, x, y, gap, s) { eye(ctx, x - gap, y, s); eye(ctx, x + gap, y, s); }

function smile(ctx, x, y, w) {
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, w * 0.25); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
}

function cheeks(ctx, x, y, gap, s) {
  ctx.fillStyle = 'rgba(255,120,150,0.45)';
  ctx.beginPath(); ctx.ellipse(x - gap, y, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + gap, y, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
}

function shine(ctx, x, y, rx, ry) {
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2); ctx.fill();
}

// Снежинка-украшение для существ Ледяного моря.
function snowflake(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(t * 0.5);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, s * 0.18); ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
  }
  ctx.restore();
}

const DRAW = [
  null,
  // 1. Капелька
  (ctx, r, t, c) => {
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.bezierCurveTo(r * 0.55, -r * 0.4, r * 0.85, r * 0.05, r * 0.85, r * 0.3);
    ctx.arc(0, r * 0.3, r * 0.85, 0, Math.PI);
    ctx.bezierCurveTo(-r * 0.85, r * 0.05, -r * 0.55, -r * 0.4, 0, -r * 1.05);
    ctx.fill();
    shine(ctx, -r * 0.35, -r * 0.05, r * 0.14, r * 0.28);
    eyes(ctx, 0, r * 0.25, r * 0.3, r * 0.17);
    smile(ctx, 0, r * 0.62, r * 0.14);
  },
  // 2. Пузырёк
  (ctx, r, t, c) => {
    ctx.fillStyle = c.body + 'cc';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.fin; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.stroke();
    shine(ctx, -r * 0.42, -r * 0.42, r * 0.22, r * 0.12);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.62, r * 0.12, 0, Math.PI * 2); ctx.fill();
    eyes(ctx, 0, -r * 0.05, r * 0.3, r * 0.18);
    cheeks(ctx, 0, r * 0.25, r * 0.5, r * 0.12);
    smile(ctx, 0, r * 0.42, r * 0.16);
  },
  // 3. Креветик
  (ctx, r, t, c) => {
    ctx.strokeStyle = c.fin; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { // усики
      ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.35);
      ctx.quadraticCurveTo(r * 1.0, -r * (0.9 + s * 0.15), r * 0.35, -r * (1.05 + s * 0.1)); ctx.stroke();
    }
    ctx.fillStyle = c.fin; // хвост-веер
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.35);
    ctx.lineTo(-r * 1.15, r * 0.05); ctx.lineTo(-r * 1.05, r * 0.6); ctx.lineTo(-r * 1.2, r * 0.85); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.body; // изогнутое тело из сегментов
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (0.95 - i * 0.22);
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.25 + r * 0.05, r * (0.3 + i * 0.05), 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 0.1, r * 0.48, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.fin; ctx.lineWidth = r * 0.05;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-r * 0.15 + i * r * 0.22, r * 0.12, r * 0.28, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke(); }
    eye(ctx, r * 0.6, -r * 0.2, r * 0.17);
    smile(ctx, r * 0.62, r * 0.12, r * 0.1);
  },
  // 4. Рыбка-ириска (полосатая)
  (ctx, r, t, c) => {
    const w = Math.sin(t * 6) * r * 0.08;
    ctx.fillStyle = c.fin;
    ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 1.3, -r * 0.55 + w); ctx.lineTo(-r * 1.3, r * 0.55 + w); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.7); ctx.quadraticCurveTo(r * 0.1, -r * 1.2, r * 0.4, -r * 0.65); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0, 0, Math.PI * 2); ctx.fillStyle = c.body; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#fff8e7';
    for (const x of [-r * 0.45, r * 0.05]) ctx.fillRect(x, -r, r * 0.18, r * 2);
    ctx.restore();
    eye(ctx, r * 0.45, -r * 0.15, r * 0.2);
    smile(ctx, r * 0.55, r * 0.25, r * 0.12);
  },
  // 5. Морская звёздочка
  (ctx, r, t, c) => {
    ctx.save(); ctx.rotate(Math.sin(t) * 0.08);
    ctx.fillStyle = c.body;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r * 1.05;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = r * 0.18; ctx.strokeStyle = c.body; ctx.stroke(); ctx.fill();
    ctx.fillStyle = c.fin;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65, r * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    eyes(ctx, 0, -r * 0.05, r * 0.22, r * 0.15);
    smile(ctx, 0, r * 0.28, r * 0.12);
  },
  // 6. Ёжик-колючка
  (ctx, r, t, c) => {
    ctx.fillStyle = c.fin;
    const n = 14;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = i * Math.PI / n + t * 0.3;
      const rr = i % 2 ? r * 0.8 : r * 1.1;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.fill();
    eyes(ctx, 0, -r * 0.08, r * 0.28, r * 0.18);
    cheeks(ctx, 0, r * 0.2, r * 0.45, r * 0.11);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.12, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  },
  // 7. Конёк-скакунок
  (ctx, r, t, c) => {
    ctx.strokeStyle = c.body; ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.42; // туловище
    ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.35); ctx.quadraticCurveTo(-r * 0.35, r * 0.15, r * 0.05, r * 0.55); ctx.stroke();
    ctx.lineWidth = r * 0.2; // хвост-завиток
    ctx.beginPath(); ctx.moveTo(r * 0.05, r * 0.55); ctx.quadraticCurveTo(r * 0.45, r * 0.95, r * 0.3, r * 1.0);
    ctx.arc(r * 0.18, r * 0.88, r * 0.14, 0.2 * Math.PI, 1.7 * Math.PI, true); ctx.stroke();
    ctx.fillStyle = c.fin; // спинной плавник
    ctx.beginPath(); ctx.moveTo(-r * 0.25, -r * 0.05);
    ctx.quadraticCurveTo(-r * 0.75 + Math.sin(t * 8) * r * 0.05, r * 0.1, -r * 0.25, r * 0.35); ctx.fill();
    ctx.fillStyle = c.body; // голова и мордочка
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.55, r * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.45, r * 0.3, r * 0.12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.fin; // гребешок
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-r * 0.12 + i * r * 0.15, -r * 0.92, r * 0.08, 0, Math.PI * 2); ctx.fill(); }
    eye(ctx, r * 0.18, -r * 0.62, r * 0.15);
  },
  // 8. Медузка-фонарик
  (ctx, r, t, c) => {
    const glow = ctx.createRadialGradient(0, -r * 0.2, r * 0.2, 0, -r * 0.2, r * 1.2);
    glow.addColorStop(0, 'rgba(255,255,255,0.35)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.fin; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = -r * 0.6 + i * r * 0.3;
      ctx.beginPath(); ctx.moveTo(x, r * 0.1);
      for (let k = 1; k <= 4; k++) ctx.lineTo(x + Math.sin(t * 4 + i + k) * r * 0.1, r * 0.1 + k * r * 0.22);
      ctx.stroke();
    }
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.85, Math.PI, 0);
    for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(r * 0.85 - (i + 0.5) * r * 0.283, r * 0.28, r * 0.85 - (i + 1) * r * 0.283, r * 0.1);
    ctx.fill();
    shine(ctx, -r * 0.4, -r * 0.4, r * 0.18, r * 0.1);
    eyes(ctx, 0, -r * 0.2, r * 0.28, r * 0.16);
    smile(ctx, 0, r * 0.05, r * 0.12);
  },
  // 9. Осьминожка
  (ctx, r, t, c) => {
    ctx.fillStyle = c.fin;
    for (let i = 0; i < 4; i++) { // щупальца с завитками
      const x = -r * 0.6 + i * r * 0.4;
      const sway = Math.sin(t * 3 + i) * r * 0.1;
      ctx.beginPath(); ctx.ellipse(x + sway, r * 0.55, r * 0.16, r * 0.42, sway / r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + sway + (i < 2 ? -1 : 1) * r * 0.1, r * 0.95, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.15, r * 0.85, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.fin;
    for (const [x, y] of [[-r * 0.45, -r * 0.6], [r * 0.5, -r * 0.5], [r * 0.1, -r * 0.75]]) {
      ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    eyes(ctx, 0, -r * 0.1, r * 0.3, r * 0.2);
    cheeks(ctx, 0, r * 0.2, r * 0.52, r * 0.12);
    smile(ctx, 0, r * 0.35, r * 0.14);
  },
  // 10. Черепаша
  (ctx, r, t, c) => {
    const f = Math.sin(t * 3) * 0.25;
    ctx.fillStyle = c.skin || '#95d5b2'; // лапы и голова
    for (const [x, y, a] of [[-r * 0.55, -r * 0.45, -0.6 - f], [r * 0.45, -r * 0.5, 0.6 + f], [-r * 0.55, r * 0.5, 0.6 + f], [r * 0.45, r * 0.5, -0.6 - f]]) {
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.35, r * 0.15, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(r * 0.85, 0, r * 0.32, 0, Math.PI * 2); ctx.fill(); // голова
    ctx.fillStyle = c.body; // панцирь
    ctx.beginPath(); ctx.ellipse(-r * 0.05, 0, r * 0.75, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.fin; ctx.lineWidth = r * 0.06;
    ctx.beginPath(); // узор-соты
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(-r * 0.05 + Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); }
    ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath(); ctx.moveTo(-r * 0.05 + Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
      ctx.lineTo(-r * 0.05 + Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.48); ctx.stroke();
    }
    eye(ctx, r * 0.95, -r * 0.08, r * 0.13);
    smile(ctx, r * 0.95, r * 0.18, r * 0.09);
  },
];

export function drawCreature(ctx, x, y, size, cell, t = 0) {
  const c = CREATURES[cell.lvl];
  const r = size * 0.33;
  const bob = Math.sin(t * 2 + x * 0.05) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  if (cell.shiny) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.5);
    glow.addColorStop(0, 'rgba(255,240,150,0.75)');
    glow.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  if (c.deco === 'glow') { // Глубина: существа светятся
    const g = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.35);
    g.addColorStop(0, c.fin + '88');
    g.addColorStop(1, c.fin + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2); ctx.fill();
  }
  (DRAW[c.shape] || DRAW[1])(ctx, r, t, c);
  if (c.deco === 'glow') { // мерцающие огоньки вокруг
    for (let i = 0; i < 3; i++) {
      const a = t * 1.5 + i * 2.1;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i);
      ctx.fillStyle = '#fffbd6';
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, r * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (c.deco === 'ice') snowflake(ctx, -r * 0.7, -r * 0.75, r * 0.28, t);
  ctx.restore();

  if (cell.noBadge) return; // для рекламных картинок
  // номер уровня
  ctx.fillStyle = 'rgba(22,50,79,0.85)';
  ctx.beginPath(); ctx.arc(x + size * 0.34, y + size * 0.34, size * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(size * 0.14)}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(cell.lvl), x + size * 0.34, y + size * 0.35);
}
