import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:4173';
const OUT = fileURLToPath(new URL('../../docs/images/', import.meta.url));

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });

// Скриншоты трёх видов трассировки на середине маршрута
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/#/boot`);
await page.waitForSelector('.react-flow__node');
const next = page.getByRole('button', { name: 'Следующий шаг', exact: true });
for (let index = 0; index < 4; index += 1) await next.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}site-graph.png` });
await page.getByRole('tab', { name: '3D' }).click();
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}site-3d.png` });
await page.getByRole('tab', { name: 'Последовательность' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}site-sequence.png` });
await context.close();

// Демо-ролик: полный прогон сцены Boot на 4×
const videoContext = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const videoPage = await videoContext.newPage();
await videoPage.goto(`${BASE}/#/boot`);
await videoPage.waitForSelector('.react-flow__node');
await videoPage.getByRole('button', { name: '4×', exact: true }).click();
await videoPage.getByRole('button', { name: 'Запустить контейнер', exact: true }).click();
await videoPage.waitForTimeout(4500);
const video = videoPage.video();
await videoContext.close();
await video.saveAs(`${OUT}demo.webm`);

// Мобильная раскладка
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(`${BASE}/#/request`);
await mobilePage.waitForSelector('.react-flow__node');
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: `${OUT}site-mobile.png`, fullPage: true });
await mobileContext.close();

await browser.close();
console.log('captured ->', OUT);
