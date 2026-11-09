// PikabuAdapter — SDK Пикабу Игр (https://games.pikabu.ru/sdk/docs/).
// SDK работает только на странице игры на Пикабу или в тестовом окружении Студии.

const SDK_URL = 'https://games.pikabu.ru/sdk/sdk.js';

function loadScript(src, timeoutMs) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    const t = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    s.onload = () => { clearTimeout(t); resolve(); };
    s.onerror = () => { clearTimeout(t); reject(new Error('load error')); };
    document.head.append(s);
  });
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

// Возвращает адаптер или null, если игра открыта не на Пикабу.
export async function tryCreatePikabuAdapter({ onPause, onResume }) {
  try {
    await loadScript(SDK_URL, 4000);
    if (!window.PkbSDK) return null;
    const sdk = await withTimeout(window.PkbSDK.init(), 4000);

    sdk.on('storageSaveError', (reason) => {
      console.warn('Ошибка облачного сохранения:', reason);
      if (reason === 'REVISION_CONFLICT') alert('Игра открыта в другой вкладке. Перезагрузите страницу, чтобы не потерять прогресс.');
    });

    // Общая обёртка показа рекламы: пауза игры и звука до и после.
    async function show(kind) {
      const ad = sdk.ads[kind];
      if (!ad || !ad.isSupported || !(await ad.canShow())) return { rendered: false };
      onPause();
      try { return await ad.show(); } finally { onResume(); }
    }

    return {
      name: 'pikabu',
      player: sdk.player,
      gameStarted() { sdk.gameStarted(); },

      load(key) { return sdk.storage.get(key); },
      save(key, value) { sdk.storage.set(key, value); },
      async flush() { const r = await sdk.storage.flush(); return r.success; },

      async showPreloader() {
        const ad = sdk.ads.preloader;
        if (ad && ad.isSupported && (await ad.canShow())) await ad.show();
      },
      canShowInterstitial: async () => !!sdk.ads.fullscreen?.isSupported && sdk.ads.fullscreen.canShow(),
      async showInterstitial() { return (await show('fullscreen')).rendered; },
      canShowRewarded: async () => !!sdk.ads.rewarded?.isSupported && sdk.ads.rewarded.canShow(),
      async showRewarded() { return (await show('rewarded')).reward === true; },

      // Только постоянные товары (например «Без рекламы»). Расходуемые требуют сервера
      // для проверки подписи — добавим позже, если понадобятся.
      async getOwnedProducts() {
        const list = await sdk.store.getPurchases();
        return list.filter((p) => !p.isConsumable).map((p) => p.productId);
      },
      // Цена товара в рублях (Пикабу отдаёт её в копейках); null — если узнать не удалось.
      async getPrice(productId) {
        const list = await sdk.store.getProducts();
        const p = list.find((x) => (x.productId || x.id) === productId);
        return p && typeof p.price === 'number' ? Math.round(p.price / 100) : null;
      },
      async buy(productId) {
        onPause();
        try {
          const r = await sdk.store.purchase({ productId });
          return r.success || r.reason === 'NON_CONSUMABLE_ALREADY_OWNED';
        } finally { onResume(); }
      },
    };
  } catch (e) {
    console.info('SDK Пикабу недоступен, работаем локально:', e.message);
    return null;
  }
}
