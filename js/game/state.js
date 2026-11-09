// Сохранение игры: формат, перенос старых сохранений, общие расчёты.

import { GRID_COLS, GRID_ROWS, START_COINS, TASK_TYPES, incomeOf, incomeMult } from './data.js';

export function emptyAquarium() {
  return { grid: Array(GRID_COLS * GRID_ROWS).fill(null), eggsBought: {}, maxLevel: 0 };
}

export function makeState(saved) {
  const s = {
    coins: START_COINS, muted: false, noAds: false,
    aq: [emptyAquarium()], current: 0,
    discovered: [], lastSeen: Date.now(),
    daily: { last: '', streak: 0 },
    tasks: { day: '', list: [] },
    upg: { income: 0, luck: 0, offline: 0 },
    tutorial: 0, // 0 — купить икринки, 1 — слить, 2 — пояснение, 3 — обучение пройдено
    ...(saved || {}),
  };
  if (saved && saved.tutorial === undefined && (saved.discovered || []).length >= 2) s.tutorial = 3;
  // Сохранения до появления нескольких аквариумов: одна сетка на верхнем уровне.
  if (saved && saved.grid && !saved.aq) {
    s.aq = [{
      grid: saved.grid,
      eggsBought: typeof saved.eggsBought === 'object' ? saved.eggsBought : {},
      maxLevel: saved.maxLevel || 0,
    }];
    s.current = 0;
  }
  delete s.grid; delete s.eggsBought; delete s.maxLevel;
  if (s.current >= s.aq.length) s.current = 0;
  return s;
}

// Доход в секунду со всех аквариумов: существа зарабатывают, даже когда вы смотрите другой.
export function totalIncome(s) {
  let sum = 0;
  for (const a of s.aq) for (const c of a.grid) sum += incomeOf(c);
  return sum * incomeMult(s.upg);
}

// Дата по часам игрока: «2026-11-09». Подарок и задания обновляются в полночь.
export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return today(d);
}

// Три задания на день: разные типы, цели зависят от даты (у всех игроков в один день одинаковые).
export function makeTasks(day) {
  const seed = [...day].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const types = Object.keys(TASK_TYPES);
  const skip = seed % types.length;
  return types.filter((_, i) => i !== skip).map((type, i) => {
    const goals = TASK_TYPES[type].goals;
    return { type, goal: goals[(seed >> (i * 3)) % goals.length], progress: 0, claimed: false };
  });
}

export function refreshTasks(s) {
  const d = today();
  if (s.tasks.day !== d) s.tasks = { day: d, list: makeTasks(d) };
}

export function addProgress(s, type, amount = 1) {
  refreshTasks(s);
  for (const task of s.tasks.list) {
    if (task.type === type && !task.claimed) task.progress = Math.min(task.goal, task.progress + amount);
  }
}

export function claimableTasks(s) {
  return s.tasks.list.filter((task) => task.progress >= task.goal && !task.claimed).length;
}
