// LocalAdapter — работа без площадки: при разработке, на GitHub Pages напрямую.
// Сохранение в браузере, реклама и покупки — заглушки.

const KEY = 'akvarium-save';

export function createLocalAdapter() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { data = {}; }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* приватный режим — игра всё равно работает */ }
  }

  // Имитация рекламы: тёмный экран на 1,5 с, чтобы проверять паузу игры.
  function fakeAd(label) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.textContent = `[тестовая реклама: ${label}]`;
      el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
        'background:rgba(0,0,0,.85);color:#fff;font:600 18px system-ui;z-index:10';
      document.body.append(el);
      setTimeout(() => { el.remove(); resolve(); }, 1500);
    });
  }

  return {
    name: 'local',
    player: { id: 'local', name: 'Игрок', isAuthorized: false },
    gameStarted() {},

    load(key) { return data[key]; },
    save(key, value) { data[key] = value; persist(); },
    async flush() { persist(); return true; },

    canShowInterstitial: async () => true,
    async showInterstitial() { await fakeAd('межстраничная'); return true; },
    canShowRewarded: async () => true,
    async showRewarded() { await fakeAd('за награду'); return true; }, // true = награду выдать

    async getOwnedProducts() { return data.__owned || []; },
    async getPrice() { return null; },
    async buy(productId) {
      const ok = confirm(`Тест: купить «${productId}»?`);
      if (ok) { data.__owned = [...new Set([...(data.__owned || []), productId])]; persist(); }
      return ok;
    },
  };
}
