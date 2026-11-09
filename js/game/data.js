// Данные игры: аквариумы, существа, экономика. Все числа баланса — здесь, в одном месте.

export const GRID_COLS = 4;
export const GRID_ROWS = 4;

// Три аквариума по 10 уровней. Следующий открывается, когда в предыдущем
// появилось существо его последнего уровня.
export const AQUARIUMS = [
  { name: 'Риф', from: 1, to: 10, water: ['#2bb3d6', '#0b3a5c'], floor: '#e9c46a', deco: null },
  { name: 'Глубина', from: 11, to: 20, water: ['#1d4e89', '#060f24'], floor: '#4a4e69', deco: 'glow' },
  { name: 'Ледяное море', from: 21, to: 30, water: ['#a9d6f5', '#2c5d8f'], floor: '#f1faee', deco: 'ice' },
];
export const MAX_LEVEL = 30;

export function aquariumOf(level) {
  return AQUARIUMS.findIndex((a) => level >= a.from && level <= a.to);
}

// Существа. shape — какой рисунок использовать (1–10), у каждого аквариума свои цвета и имена.
const NAMES = [
  ['Капелька', 'Пузырёк', 'Креветик', 'Рыбка-ириска', 'Морская звёздочка',
    'Ёжик-колючка', 'Конёк-скакунок', 'Медузка-фонарик', 'Осьминожка', 'Черепаша'],
  ['Искорка', 'Пузырь-светлячок', 'Креветка-неонка', 'Рыба-удильщик', 'Звезда-полночь',
    'Ёж-светоносец', 'Конёк-призрак', 'Медуза-сияние', 'Осьминог-глубинник', 'Черепаха-старейшина'],
  ['Снежинка', 'Ледяной пузырь', 'Криль-морозик', 'Рыбка-сосулька', 'Звезда-иней',
    'Ёжик-льдинка', 'Конёк-вьюжка', 'Медуза-полярка', 'Осьминог-снежок', 'Черепаха-айсберг'],
];
const COLORS = [
  [['#8ecae6', '#219ebc'], ['#a8dadc', '#457b9d'], ['#ffb4a2', '#e5989b'], ['#ffd166', '#f4a261'], ['#f28482', '#e63946'],
    ['#b5838d', '#6d6875'], ['#90be6d', '#43aa8b'], ['#cdb4db', '#a2d2ff'], ['#ff8fab', '#fb6f92'], ['#52b788', '#2d6a4f']],
  [['#72efdd', '#06d6a0'], ['#b8f2e6', '#5390d9'], ['#ff70a6', '#ff3d8b'], ['#fca311', '#7b2cbf'], ['#9d4edd', '#5a189a'],
    ['#4cc9f0', '#3a0ca3'], ['#e0aaff', '#7b2cbf'], ['#80ffdb', '#48bfe3'], ['#f72585', '#b5179e'], ['#e9c46a', '#9c6644', '#f4e3b2']],
  [['#e0fbfc', '#98c1d9'], ['#caf0f8', '#48cae4'], ['#ffccd5', '#ff8fa3'], ['#d8f3dc', '#74c69d'], ['#bde0fe', '#4895ef'],
    ['#e9ecef', '#6c757d'], ['#cddafd', '#7b8cde'], ['#d0f4de', '#a9def9'], ['#e2ece9', '#8eaebd'], ['#a2d2ff', '#3a86ff', '#e0fbfc']],
];
export const CREATURES = [null];
for (let a = 0; a < 3; a++) {
  for (let i = 0; i < 10; i++) {
    const [body, fin, skin] = COLORS[a][i];
    CREATURES.push({ name: NAMES[a][i], body, fin, skin, shape: i + 1, deco: AQUARIUMS[a].deco });
  }
}

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

// Уровень икринки растёт вместе с лучшим существом аквариума: max(первый, лучший − 4)
export function eggLevel(aq, aqMax) {
  return Math.max(aq.from, aqMax - EGG_LAG);
}

// Цена икринки k-го уровня аквариума: 10 × 2,3^(первый−1) × 5^(k−1) × 1,15^n,
// n — сколько таких уже куплено. Каждый аквариум — это Риф «в масштабе»:
// цены и доход в нём выше в одинаковое число раз.
// Баланс по симуляции: Риф (ур. 10) примерно за 12 минут активной игры.
export function eggCost(level, boughtMap, aq) {
  const n = boughtMap[level] || 0;
  const k = level - aq.from + 1;
  return Math.floor(10 * Math.pow(2.3, aq.from - 1) * Math.pow(5, k - 1) * Math.pow(1.15, n));
}

// Награды: подарок дня и задания растут вместе с доходом игрока.
export function giftReward(perSec, day) { return Math.floor(Math.max(50, perSec * 120) * (1 + (day - 1) * 0.5)); }
export function taskReward(perSec) { return Math.floor(Math.max(100, perSec * 180)); }

// Набор ежедневных заданий: выбираются 3 разных типа, цели слегка меняются день ото дня.
export const TASK_TYPES = {
  merge: { label: (g) => `Слить существ ${g} раз`, goals: [15, 20, 25] },
  egg: { label: (g) => `Купить ${g} икринок`, goals: [8, 10, 12] },
  play: { label: (g) => `Играть ${g / 60} минут`, goals: [300, 600] },
  shiny: { label: () => 'Получить сияющее существо', goals: [1] },
};

// 1234 → «1,2 тыс.», 5600000 → «5,6 млн»
export function fmt(n) {
  n = Math.floor(n);
  const units = [[1e18, 'квинтлн'], [1e15, 'квадрлн'], [1e12, 'трлн'], [1e9, 'млрд'], [1e6, 'млн'], [1e3, 'тыс.']];
  for (const [v, u] of units) {
    if (n >= v * 10) return `${Math.floor(n / v)} ${u}`;
    if (n >= v) return `${(n / v).toFixed(1).replace('.', ',')} ${u}`;
  }
  return String(n);
}
