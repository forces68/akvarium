// Холст под любой экран: телефон вертикально, планшет, ПК.
// Игра рисует в «логических» координатах: ширина всегда 720, высота — по пропорциям экрана.

export const VIEW_W = 720;

export function setupScreen(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { w: VIEW_W, h: 1280, scale: 1, offX: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    // На широких экранах (ПК) игровое поле ограничено пропорцией 3:4, по бокам — фон.
    const fieldW = Math.min(cw, ch * 0.75);
    view.scale = (fieldW / VIEW_W) * dpr;
    view.h = (ch * dpr) / view.scale;
    view.offX = ((cw - fieldW) / 2) * dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  // Перевод координат касания в логические.
  function toView(clientX, clientY) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { x: (clientX * dpr - view.offX) / view.scale, y: (clientY * dpr) / view.scale };
  }

  function begin() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#082a44';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offX, 0);
  }

  return { ctx, view, toView, begin };
}
