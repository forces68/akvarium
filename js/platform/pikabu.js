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
    // Если блокировщик рекламы сломал показ (ошибка или зависание), считаем, что реклама
    // не показалась, и продолжаем игру: через 90 с ожидание прерывается.
    async function show(kind) {
      const ad = sdk.ads[kind];
      try {
        if (!ad || !ad.isSupported || !(await withTimeout(ad.canShow(), 5000))) return { rendered: false };
      } catch (e) { return { rendered: false }; }
      onPause();
      try { return (await withTimeout(ad.show(), 90000)) || { rendered: false }; } catch (e) {
        console.warn('Реклама не показана:', e.message);
        return { rendered: false };
      } finally { onResume(); }
    }

    return {
      name: 'pikabu',
      player: sdk.player,
      gameStarted() { sdk.gameStarted(); },

      load(key) { try { return sdk.storage.get(key); } catch (e) { return null; } },
      save(key, value) { sdk.storage.set(key, value); },
      async flush() { const r = await sdk.storage.flush(); return r.success; },

      async showPreloader() {
        try {
          const ad = sdk.ads.preloader;
          if (ad && ad.isSupported && (await withTimeout(ad.canShow(), 5000))) await withTimeout(ad.show(), 15000);
        } catch (e) { console.warn('Реклама при загрузке не показана:', e.message); }
      },
      canShowInterstitial: async () => { try { return !!sdk.ads.fullscreen?.isSupported && await sdk.ads.fullscreen.canShow(); } catch (e) { return false; } },
      async showInterstitial() { return (await show('fullscreen')).rendered; },
      canShowRewarded: async () => { try { return !!sdk.ads.rewarded?.isSupported && await sdk.ads.rewarded.canShow(); } catch (e) { return false; } },
      async showRewarded() { return (await show('rewarded')).reward === true; },

      // Только постоянные товары (например «Без рекламы»). Расходуемые требуют сервера
      // для проверки подписи — добавим позже, если понадобятся.
      async getOwnedProducts() {
        const list = await withTimeout(sdk.store.getPurchases(), 5000);
        return list.filter((p) => !p.isConsumable).map((p) => p.productId);
      },
      // Цена товара в рублях (Пикабу отдаёт её в копейках); null — если узнать не удалось.
      async getPrice(productId) {
        const list = await withTimeout(sdk.store.getProducts(), 5000);
        const p = list.find((x) => (x.productId || x.id) === productId);
        return p && typeof p.price === 'number' ? Math.round(p.price / 100) : null;
      },
      async buy(productId) {
        onPause();
        try {
          const r = await sdk.store.purchase({ productId });
          return !!r && (r.success || r.reason === 'NON_CONSUMABLE_ALREADY_OWNED');
        } catch (e) {
          console.warn('Покупка не прошла:', e.message);
          return false;
        } finally { onResume(); }
      },
    };
  } catch (e) {
    console.info('SDK Пикабу недоступен, работаем локально:', e.message);
    return null;
  }
}
