// Простые элементы интерфейса на холсте: кнопки и текст.

export function drawButton(ctx, b) {
  ctx.save();
  ctx.fillStyle = b.disabled ? '#5b7183' : (b.color || '#ffb703');
  roundRect(ctx, b.x, b.y, b.w, b.h, 22);
  ctx.fill();
  ctx.fillStyle = b.disabled ? '#c9d3db' : '#16324f';
  ctx.font = `700 ${b.fontSize || 34}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
  ctx.restore();
}

export function hit(b, x, y) {
  return !b.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function text(ctx, str, x, y, size = 32, color = '#e6f7ff', align = 'center', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Фон-аквариум: вода, лучи света, пузырьки. Общий для всех сцен.
export function drawWater(ctx, view, t, bubbles) {
  const g = ctx.createLinearGradient(0, 0, 0, view.h);
  g.addColorStop(0, '#2bb3d6');
  g.addColorStop(1, '#0b3a5c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const x = 120 + i * 170 + Math.sin(t * 0.4 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x - 40, view.h); ctx.lineTo(x - 100, view.h);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x + Math.sin(t * 2 + b.x) * 6, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // песок
  ctx.fillStyle = '#e9c46a';
  ctx.beginPath();
  ctx.moveTo(0, view.h - 60);
  for (let x = 0; x <= view.w; x += 40) ctx.lineTo(x, view.h - 60 + Math.sin(x * 0.03) * 10);
  ctx.lineTo(view.w, view.h); ctx.lineTo(0, view.h);
  ctx.fill();
}

export function makeBubbles(view, n = 18) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * view.w, y: Math.random() * view.h, r: 4 + Math.random() * 10, v: 30 + Math.random() * 60,
  }));
}

export function updateBubbles(bubbles, view, dt) {
  for (const b of bubbles) {
    b.y -= b.v * dt;
    if (b.y < -20) { b.y = view.h + 20; b.x = Math.random() * view.w; }
  }
}
