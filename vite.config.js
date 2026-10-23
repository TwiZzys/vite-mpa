import {defineConfig} from 'vite';
import {resolve} from 'path';
import fontPlugin from "./vite/tasks/fontsGeneration.js";
import runSvgSprite from './vite/tasks/svgSprite.js';
import {runImageConvert, startImageWatcher} from './vite/tasks/imagesConvert.js';
import {runFaviconConvert, startFaviconWatcher} from './vite/tasks/faviconGeneration.js';
import htmlInject from 'vite-plugin-html-inject';
import browserslistToEsbuild from 'browserslist-to-esbuild'
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

// Функція для автоматичного збору всіх index.html у єдиному форматі ключів (index, home, about-us)
function getHtmlEntries() {
  const srcDir = path.resolve(import.meta.dirname, 'src');
  const entries = {};

  function scanDir(currentDir, relativePath = '') {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir, {withFileTypes: true});

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        scanDir(fullPath, path.join(relativePath, item.name));
      } else if (item.isFile() && item.name === 'index.html') {
        const key = relativePath === '' ? 'index' : relativePath.split(path.sep).join('-');
        entries[key] = fullPath;
      }
    }
  }

  scanDir(srcDir);
  console.log('Ключі: ', entries);
  return entries;
}

export default defineConfig(async ({command}) => {
  const isProd = command === 'build';

  return {
    root: import.meta.dirname + '/src',
    publicDir: import.meta.dirname + '/public',
    plugins: [
      htmlInject(),
      {
        name: 'assets-automation-plugin',
        async closeBundle() {
          if (isProd) {
            await runImageConvert();
            await runFaviconConvert();

            // Копіюємо згенерований SVG-спрайт у фінальну папку dist/images/
            const srcSprite = path.resolve(import.meta.dirname, 'src/assets/images/sprite.svg');
            const distSprite = path.resolve(import.meta.dirname, 'dist/images/sprite.svg');
            if (fs.existsSync(srcSprite)) {
              await fsp.mkdir(path.dirname(distSprite), {recursive: true});
              await fsp.copyFile(srcSprite, distSprite);
              console.log('[SpriteCopy] sprite.svg успішно скопійовано у dist/images/');
            }

            // Переносимо скомпільовані HTML з dist/pages у корінь dist/ за єдиним форматом імен
            const distPagesDir = path.resolve(import.meta.dirname, 'dist/pages');
            const distRoot = path.resolve(import.meta.dirname, 'dist');

            if (fs.existsSync(distPagesDir)) {
              const moveHtmlFiles = async (currentDir, currentRelPath = '') => {
                const items = await fsp.readdir(currentDir, {withFileTypes: true});
                for (const item of items) {
                  const fullPath = path.join(currentDir, item.name);
                  const relPath = path.join(currentRelPath, item.name);

                  if (item.isDirectory()) {
                    await moveHtmlFiles(fullPath, relPath);
                  } else if (item.isFile() && item.name === 'index.html') {
                    const fileName = currentRelPath === '' ? 'index.html' : `${currentRelPath.split(path.sep).join('-')}.html`;
                    const targetPath = path.join(distRoot, fileName);

                    await fsp.rename(fullPath, targetPath);
                  }
                }
              };

              await moveHtmlFiles(distPagesDir);
              await fsp.rm(distPagesDir, {recursive: true, force: true});
              console.log('[FlattenDist] Усі сторінки успішно перенесено в корінь dist/');
            }
          }
        },
        configureServer(server) {
          runImageConvert(server);
          startImageWatcher(server);

          runFaviconConvert();
          startFaviconWatcher(server);
        },
      },
      fontPlugin({
        inDir: "src/assets/fonts/src",
        outDir: "src/assets/fonts",
        outScss: "src/scss/_fonts.scss",
        varsScss: "src/scss/_vars.scss",
      }),
      runSvgSprite(),
    ],
    resolve: {
      alias: {
        '@': import.meta.dirname + '/src',
        '@pages': import.meta.dirname + '/src/pages',
        '@components': import.meta.dirname + '/src/components',
        '@scss': import.meta.dirname + '/src/scss',
        '@images': import.meta.dirname + '/src/assets/images',
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@scss/vars" as * with (
              $isProd: ${isProd},
              $env: "${isProd ? 'production' : 'development'}"
            );
          `,
        },
      },
    },
    server: {
      port: 8080,
      open: true,
    },
    build: {
      outDir: import.meta.dirname + '/dist',
      emptyOutDir: true,
      // Додаємо сюди конвертер для esbuild:
      target: browserslistToEsbuild(),
      rollupOptions: {
        input: getHtmlEntries(),
        output: {
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            const ext = name.split('.').pop() || '';

            if (/css/i.test(ext)) {
              return 'css/[name].[hash][extname]';
            }
            if (/woff2?|ttf|eot/i.test(ext)) {
              return 'fonts/[name][extname]';
            }
            return 'assets/[name].[hash][extname]';
          },
        },
      },
    },
  };
});
