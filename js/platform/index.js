// Слой Platform: игра обращается только сюда, а не к SDK конкретной площадки.
// Новая площадка (ВКонтакте, Яндекс) = новый файл-адаптер + одна строка ниже.

import { createLocalAdapter } from './local.js';
import { tryCreatePikabuAdapter } from './pikabu.js';

export async function createPlatform(hooks) {
  // На Пикабу игра всегда открывается внутри рамки (iframe); вне рамки SDK не ждём.
  const inFrame = window.self !== window.top;
  const pikabu = inFrame ? await tryCreatePikabuAdapter(hooks) : null;
  return pikabu || createLocalAdapter();
}
