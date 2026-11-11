import { test, expect } from '@playwright/test';

const next = (page) => page.getByRole('button', { name: 'Следующий шаг', exact: true });

test('Boot: полный запуск и журнал событий', async ({ page }) => {
  await page.goto('/#boot');
  await expect(page.getByRole('heading', { name: 'Запуск контейнера.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(8);
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Запустить контейнер', exact: true }).click();
  await expect(page.locator('.log-entry')).toHaveCount(8, { timeout: 15_000 });
  await expect(page.locator('.log-entry.is-current')).toContainText('Контекст готов');
  await expect(page.locator('.canvas-title')).toContainText('СЦЕНАРИЙ ЗАВЕРШЁН');
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});

test('Boot: property и пользовательский бин меняют исход', async ({ page }) => {
  await page.goto('/#boot');
  await page.getByRole('switch', { name: 'Автоконфигурация' }).click();
  await expect(page.getByRole('switch', { name: 'Автоконфигурация' })).toHaveAttribute('aria-checked', 'false');
  for (let index = 0; index < 8; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Приложение не запустилось');
  await page.getByRole('switch', { name: 'Автоконфигурация' }).click();
  await page.getByRole('switch', { name: 'Свой GreeterService' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  for (let index = 0; index < 9; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Контекст готов');
  await expect(page.locator('.flow-node.is-skipped')).toHaveCount(2);
});

test('HTTP: /private без credentials возвращает 401 до контроллера', async ({ page }) => {
  await page.goto('/#request');
  await expect(page.getByRole('heading', { name: 'Путь HTTP-запроса.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  await page.getByRole('switch', { name: 'Валидные credentials' }).click();
  for (let index = 0; index < 4; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('401 · запрос остановлен');
  await expect(page.locator('.log-body')).not.toContainText('Контроллер вызван');
  await expect(page.locator('.flow-node.is-error').filter({ hasText: 'Browser' })).toBeVisible();
});

test('HTTP: /public обходит обязательный логин', async ({ page }) => {
  await page.goto('/#request');
  await page.getByRole('button', { name: '/public', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Валидные credentials' })).toBeDisabled();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Отправить запрос', exact: true }).click();
  await expect(page.locator('.log-entry')).toHaveCount(10, { timeout: 15_000 });
  await page.locator('.log-entry').filter({ hasText: 'Доступ разрешён' }).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('permitAll');
  for (let index = 0; index < 7; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('200 OK');
});

test('HTTP: ошибка сервиса выполняет rollback', async ({ page }) => {
  await page.goto('/#request');
  await page.getByRole('switch', { name: 'Ошибка в сервисе' }).click();
  for (let index = 0; index < 11; index += 1) await next(page).click();
  await page.locator('.log-entry').filter({ hasText: 'rollback' }).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('INSERT отменён; count() не изменился');
  await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Данные не сохранены');
});

test('Песочница: добавить, переименовать, соединить и удалить узел', async ({ page }) => {
  await page.goto('/#boot');
  await page.getByRole('button', { name: 'Добавить Component', exact: true }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  await page.getByRole('textbox', { name: 'Название узла' }).fill('AuditService');
  const source = await page.locator('.react-flow__node').filter({ hasText: 'Post-processors' }).locator('.source').boundingBox();
  const target = await page.locator('.react-flow__node').filter({ hasText: 'AuditService' }).locator('.target').boundingBox();
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.canvas-count')).toContainText('8 связей');
  await expect(page.getByRole('group', { name: /Edge from bpp to component-/ })).toBeVisible();
  for (let index = 0; index < 9; index += 1) await next(page).click();
  await expect(page.locator('.log-body')).toContainText('AuditService');
  await page.getByTestId('rf__node-application').click();
  await page.getByRole('button', { name: 'Удалить узел' }).click();
  await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Маршрут не собран');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Сбросить сцену' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(8);
});

test('Мобильная раскладка и справка доступны', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#request');
  await expect(page.getByRole('heading', { name: 'Путь HTTP-запроса.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  const canvasBox = await page.locator('.sandbox-canvas').boundingBox();
  const nodeBox = await page.getByTestId('rf__node-client').boundingBox();
  expect(canvasBox.height).toBeGreaterThan(200);
  expect(nodeBox.width).toBeGreaterThan(40);
  expect(nodeBox.y).toBeGreaterThan(canvasBox.y);
  expect(nodeBox.y).toBeLessThan(canvasBox.y + canvasBox.height);
  const flowHeight = await page.evaluate(() => document.querySelector('.react-flow').getBoundingClientRect().height);
  expect(flowHeight).toBeGreaterThan(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Как это работает' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
