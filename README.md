# 🚀 High-Performance Vanilla Vite MPA Template (Custom Automation Pipeline)

Сучасний, мінімалістичний та надзвичайно швидкий шаблон багатосторінкового додатку (MPA) на базі **Vite**, **Vanilla JS/HTML** та **Sass**, повністю позбавлений важких сторонніх плагінів на користь власних високоефективних Node.js скриптів автоматизації та оптимізації активів.

---

## 🛠 Стек технологій

- **Bundler:** Vite
- **Architecture:** Multi-Page Application (MPA) з динамічним скануванням сторінок
- **Markup Injection:** `vite-plugin-html-inject`
- **Styling:** Sass (SCSS) / PostCSS, Browserslist
- **Automation / Tasks:** Кастомні скрипти на базі `chokidar`, `jimp`, `svgo`, `cheerio`, `fontverter`

---

## 💻 Системні вимоги та середовище (Fedora Linux)

Оскільки білд-пайплайн використовує рідні системні утиліти для максимальної швидкості конвертації та оптимізації графіки в продакшні, перед початком роботи на **Fedora Linux** переконайся, що встановлені необхідні пакети:

### 1. Встановлення системних утиліт
```bash
sudo dnf install libwebp-tools libavif-tools pngquant
```

### 2. Встановлення залежностей проєкту
```bash
yarn install
```

---

## 📁 Архітектура проєкту

```text
.
├── package.json
├── postcss.config.js
├── public/
│   └── favicons/         # Автоматично нарізані фавікони та маніфест
├── src/
│   ├── assets/
│   │   ├── fonts/        # Шрифти (woff/woff2) + папка src/ для вихідних ttf/otf
│   │   └── images/       # Глобальні зображення, спрайти та папки src/ / sprite-src/
│   ├── components/       # Модульні компоненти (наприклад, header/ з власними HTML, SCSS, JS та іконками)
│   ├── index.html        # Головна сторінка
│   ├── js/               # Глобальні скрипти (main.js)
│   ├── pages/            # Окремі сторінки MPA (about/, blog/, contacts/)
│   └── scss/             # Глобальні стилі (_fonts.scss, _vars.scss, _reset.scss, _global.scss)
├── vite/
│   └── tasks/            # ⚙️ Кастомна система автоматизації:
│       ├── faviconGeneration.js  # Нарізка іконок (Jimp), маніфест та ін'єкція в HTML
│       ├── fontsGeneration.js    # Конвертація шрифтів (fontverter), генерація @font-face та міксинів
│       ├── imagesConvert.js      # Оптимізація та конвертація растру (WebP, AVIF, pngquant, cwebp, avifenc)
│       └── svgSprite.js          # Оптимізація (SVGO), нормалізація (Cheerio), SHA-256 кешування та спрайти
├── vite.config.js        # Головний конфіг Vite з динамічним мапінгом ентріпоінтів та сплющуванням dist
└── yarn.lock
```

---

## 🚀 Швидкий старт

1. **Запуск у режимі розробки (Dev Server з ворчерами):**
   ```bash
   yarn dev
   ```
   *Сервер підніметься на `http://localhost:8080` з автоматичним відстеженням змін у шрифтах, зображеннях, іконках та фавіконах.*

2. **Збірка для продакшну (Production Build):**
   ```bash
   yarn build
   ```
   *Скрипти автоматично сконвертують графіку, скомпілюють шрифти, зберуть спрайти, оновлять HTML та вирівняють структуру фінальної папки `dist/`.*

---

## ⚙️ Архітектура кастомного білд-пайплайну

Замість важких плагінів проєкту використовує чотири незалежні модулі автоматизації у `vite/tasks/`:

1. **SVG Pipeline (`svgSprite.js`)**
   - Кешує стан файлів за допомогою **SHA-256** (`.svg-cache.json`), пропускаючи незмінені іконки.
   - Оптимізує вектор через **SVGO** без ризику пошкодити геометрію з Figma.
   - Нормалізує кольори через **Cheerio**, автоматично перетворюючи `fill`/`stroke` на `currentColor` для гнучкого стилізування через CSS.
   - Збирає глобальні та компонентні іконки у єдиний `sprite.svg`.

2. **Image Pipeline (`imagesConvert.js`)**
   - **Dev-режим:** швидке, надійне копіювання та синхронізація активів під час розробки.
   - **Build-режим:** задіює системні утиліти (`pngquant` для стиснення PNG, `cwebp` для WebP, `avifenc` для надсучасного AVIF-формату).
   - Підтримує структуру папок як у корені `src/assets/images/src`, так і всередині компонентів (`src/components/*/images/src`).

3. **Fonts Pipeline (`fontsGeneration.js`)**
   - Сканує вихідні `.ttf` / `.otf` файли у `src/assets/fonts/src`.
   - Конвертує їх у **WOFF** та **WOFF2** за допомогою `fontverter`.
   - Автоматично розпізнає вагу (Weight), стилі (Italic) та Variable Fonts.
   - Автоматично оновлює глобальні стилі `_fonts.scss` та генерує зручні SCSS-міксини у `_vars.scss`.

4. **Favicon Pipeline (`faviconGeneration.js`)**
   - Працює з єдиним вихідним файлом (PNG, JPG або SVG) у `public/favicons/src`.
   - За допомогою **Jimp** нарізає повний набір растрових іконок необхідних розмірів (16x16, 32x32, Apple Touch, 192x192, 512x512).
   - Генерує `manifest.json` та автоматично ін'єктує відповідні `<link>` теги у секцію `<head>` усіх `index.html` файлів проєкту.