export async function initSvgSprite() {
  if (document.getElementById('svg-sprite-container')) return;

  const STORAGE_KEY = 'cached_svg_sprite';
  const VERSION_KEY = 'cached_svg_sprite_version';
  const CURRENT_VERSION = '1.0';

  let spriteData = null;

  // Якщо це не дев-режим (тобто продакшн), пробуємо взяти з localStorage
  if (!import.meta.env.DEV) {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion === CURRENT_VERSION) {
      spriteData = localStorage.getItem(STORAGE_KEY);
    }
  }

  // Якщо спрайту немає в кеші (або ми в режимі розробки), робимо fetch
  if (!spriteData) {
    try {
      const spritePath = import.meta.env.DEV
        ? '/assets/images/sprite.svg'
        : './images/sprite.svg';

      const response = await fetch(spritePath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      spriteData = await response.text();

      // Зберігаємо в localStorage тільки для продакшну
      if (!import.meta.env.DEV) {
        localStorage.setItem(STORAGE_KEY, spriteData);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      }
    } catch (error) {
      console.error('[SvgSprite] Помилка завантаження спрайту:', error);
      return;
    }
  }

  const div = document.createElement('div');
  div.id = 'svg-sprite-container';
  div.style.display = 'none';
  div.innerHTML = spriteData;

  document.body.appendChild(div);
}
