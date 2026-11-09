// Данные игры: существа, экономика. Все числа баланса — здесь, в одном месте.

export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const MAX_LEVEL_REEF = 10;

// Существа Рифа (уровни 1–10). Цвета временные — до готовой графики (дни 6–7).
export const CREATURES = [
  null,
  { name: 'Капелька', body: '#8ecae6', fin: '#219ebc' },
  { name: 'Пузырёк', body: '#a8dadc', fin: '#457b9d' },
  { name: 'Креветик', body: '#ffb4a2', fin: '#e5989b' },
  { name: 'Рыбка-ириска', body: '#ffd166', fin: '#f4a261' },
  { name: 'Морская звёздочка', body: '#f28482', fin: '#e63946' },
  { name: 'Ёжик-колючка', body: '#b5838d', fin: '#6d6875' },
  { name: 'Конёк-скакунок', body: '#90be6d', fin: '#43aa8b' },
  { name: 'Медузка-фонарик', body: '#cdb4db', fin: '#a2d2ff' },
  { name: 'Осьминожка', body: '#ff8fab', fin: '#fb6f92' },
  { name: 'Черепаша', body: '#52b788', fin: '#2d6a4f' },
];

export const START_COINS = 25; // хватает ровно на две первые икринки
export const SHINY_CHANCE = 0.05;      // шанс сияющего существа при слиянии
export const SHINY_BONUS = 1.5;        // сияющее приносит в 1,5 раза больше
export const OFFLINE_MAX_SEC = 2 * 3600; // офлайн-доход копится до 2 часов
export const OFFLINE_RATE = 0.5;       // вне игры — половина дохода (×2 за рекламу)
export const REWARD_EGG_BONUS = 2;     // икринка за рекламу на 2 уровня выше обычной
export const EGG_LAG = 4;              // икринка на 4 уровня ниже лучшего существа
export const REWARD_EGG_COOLDOWN = 90; // секунд между такими икринками

// Доход существа уровня L в секунду: 1 × 2,3^(L−1)
export function incomeOf(cell) {
  if (!cell) return 0;
  return Math.pow(2.3, cell.lvl - 1) * (cell.shiny ? SHINY_BONUS : 1);
}

// Уровень икринки растёт вместе с лучшим существом: max(1, лучший − 4)
export function eggLevel(maxLevel) {
  return Math.max(1, maxLevel - EGG_LAG);
}

// Цена икринки уровня k: 10 × 5^(k−1) × 1,15^n, n — сколько таких уже куплено.
// Баланс по симуляции: Риф (ур. 10) примерно за 12 минут активной игры.
export function eggCost(level, boughtMap) {
  const n = boughtMap[level] || 0;
  return Math.floor(10 * Math.pow(5, level - 1) * Math.pow(1.15, n));
}

// 1234 → «1,2 тыс.», 5600000 → «5,6 млн»
export function fmt(n) {
  n = Math.floor(n);
  const units = [[1e12, 'трлн'], [1e9, 'млрд'], [1e6, 'млн'], [1e3, 'тыс.']];
  for (const [v, u] of units) {
    if (n >= v * 10) return `${Math.floor(n / v)} ${u}`;
    if (n >= v) return `${(n / v).toFixed(1).replace('.', ',')} ${u}`;
  }
  return String(n);
}
