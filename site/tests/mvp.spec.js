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

test('Lifecycle: init-этап ломает контекст как в реальном модуле', async ({ page }) => {
  await page.goto('/#lifecycle');
  await expect(page.getByRole('heading', { name: 'Жизненный цикл бина.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('switch', { name: 'Ошибка в init-методе' }).click();
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Контекст не поднялся');
  await expect(page.locator('.flow-node.is-error').filter({ hasText: 'Бин готов' })).toBeVisible();
  await page.getByRole('switch', { name: 'Ошибка в init-методе' }).click();
  await page.getByRole('switch', { name: 'Обёртка в прокси' }).click();
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Бин готов');
  await expect(page.locator('.log-entry').filter({ hasText: 'Бин обёрнут в прокси' })).toBeVisible();
});

test('Proxies: самовызов this показывает узел, который минует прокси', async ({ page }) => {
  await page.goto('/#proxies');
  await expect(page.getByRole('heading', { name: 'AOP-прокси и @Transactional.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await page.getByRole('switch', { name: 'Самовызов this.transfer()' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry').filter({ hasText: 'this-вызов миновал прокси' })).toBeVisible();
  await expect(page.locator('.flow-node.is-skipped').filter({ hasText: 'this.transfer()' })).toBeVisible();
  await page.getByRole('switch', { name: 'Самовызов this.transfer()' }).click();
  await page.getByRole('switch', { name: 'Исключение в методе' }).click();
  for (let index = 0; index < 5; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('ROLLBACK');
  await expect(page.locator('.scene-badge')).toContainText('SpringCGLIB');
});

test('Conditions: провал property прячет бин, отчёт считает negative matches', async ({ page }) => {
  await page.goto('/#conditions');
  await expect(page.getByRole('heading', { name: 'Условия создания бинов.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('switch', { name: 'Property включена' }).click();
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry').filter({ hasText: 'Бин не зарегистрирован' })).toBeVisible();
  await expect(page.locator('.log-entry.is-current')).toContainText('positiveMatches: 2 · negativeMatches: 1');
  await page.getByRole('switch', { name: 'Свой FeatureService' }).click();
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry').filter({ hasText: 'Уступает пользовательскому бину' })).toBeVisible();
});

test('Sequence: диаграмма последовательности синхронизирована с журналом', async ({ page }) => {
  await page.goto('/#request');
  await page.getByRole('tab', { name: 'Последовательность' }).click();
  await expect(page.locator('.sequence-empty')).toBeVisible();
  for (let index = 0; index < 4; index += 1) await next(page).click();
  // диаграмма показывает весь маршрут: будущие шаги приглушены
  await expect(page.locator('.sequence-svg .seq-row')).toHaveCount(10);
  await expect(page.locator('.sequence-svg .seq-row').nth(3)).toHaveClass(/is-current/);
  await expect(page.locator('.sequence-svg .seq-row').nth(4)).toHaveCSS('opacity', '0.32');
  await page.locator('.sequence-svg .seq-row').filter({ hasText: 'Цепочка фильтров' }).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Цепочка фильтров');
  await expect(page.locator('.sequence-svg .seq-row.is-current')).toContainText('Цепочка фильтров');
});

test('Inspector: у узла показывается реальный код Java-модуля', async ({ page }) => {
  await page.goto('/#proxies');
  await page.getByTestId('rf__node-target').click();
  await expect(page.locator('.code-snippet')).toContainText('КОД ИЗ МОДУЛЯ');
  await expect(page.locator('.code-snippet pre')).toContainText('перевод');
  await page.getByTestId('rf__node-commit').click();
  await expect(page.locator('.code-snippet pre')).toContainText('doCommit');
});

test('Клавиатура: стрелки ходят по шагам трассировки', async ({ page }) => {
  await page.goto('/#lifecycle');
  await expect(page.getByRole('heading', { name: 'Жизненный цикл бина.' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.log-entry.is-current')).toContainText('Чертёж найден');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.log-entry.is-current')).toContainText('Объект создан');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.log-entry.is-current')).toContainText('Чертёж найден');
});

test('Песочница помнит изменённый граф после перезагрузки страницы', async ({ page }) => {
  await page.goto('/#boot');
  await page.getByRole('button', { name: 'Добавить Condition', exact: true }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  await page.reload();
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Сбросить сцену' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(8);
  await page.reload();
  await expect(page.locator('.react-flow__node')).toHaveCount(8);
});

test('Scan: фильтр исключает внутренний компонент до регистрации', async ({ page }) => {
  await page.goto('/#scan');
  await expect(page.getByRole('heading', { name: 'Поиск компонентов.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('switch', { name: 'InternalComponent в excluded' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('BeanDefinition зарегистрированы');
  await expect(page.locator('.log-entry').filter({ hasText: 'InternalComponent отброшен' })).toBeVisible();
  await page.getByRole('switch', { name: 'Регекс-фильтр excluded.*' }).click();
  for (let index = 0; index < 7; index += 1) await next(page).click();
  await expect(page.locator('.log-entry').filter({ hasText: 'InternalComponent принят' })).toBeVisible();
});

test('Flyway: правка V1 задним числом роняет старт на validate', async ({ page }) => {
  await page.goto('/#flyway');
  await expect(page.getByRole('heading', { name: 'Миграции Flyway.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await page.getByRole('switch', { name: 'Правка V1 задним числом' }).click();
  await expect(page.locator('.scene-badge')).toContainText('validate failed');
  for (let index = 0; index < 5; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Контекст не поднялся');
  await expect(page.locator('.flow-node.is-error').filter({ hasText: 'Flyway#migrate' })).toBeVisible();
  await expect(page.locator('.flow-node.is-skipped').filter({ hasText: 'Таблица users' })).toBeVisible();
  await page.getByRole('switch', { name: 'Правка V1 задним числом' }).click();
  await page.getByRole('switch', { name: 'Новая V3__add_bio' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Приложение готово');
  await expect(page.locator('.log-entry').filter({ hasText: 'Новая миграция V3' })).toBeVisible();
});

test('Lombok: без @Builder компиляция ломается на этапе compile', async ({ page }) => {
  await page.goto('/#lombok');
  await expect(page.getByRole('heading', { name: 'Компиляция с Lombok.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await page.getByRole('switch', { name: '@Builder на классе' }).click();
  for (let index = 0; index < 5; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Компиляция сломана');
  await expect(page.locator('.flow-node.is-error').filter({ hasText: 'Сгенерированное в работе' })).toBeVisible();
  await page.getByRole('switch', { name: '@Builder на классе' }).click();
  await page.getByRole('switch', { name: 'Рукописный эквивалент' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('builder() скомпилирован и работает');
  await expect(page.locator('.log-entry').filter({ hasText: 'Рукописный двойник' })).toBeVisible();
});

test('Validation: испорченные данные собирают 6 нарушений', async ({ page }) => {
  await page.goto('/#validation');
  await expect(page.getByRole('heading', { name: 'Bean Validation.' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(7);
  await page.getByRole('switch', { name: 'Данные валидны' }).click();
  await expect(page.locator('.scene-badge')).toContainText('6 violations');
  for (let index = 0; index < 7; index += 1) await next(page).click();
  await expect(page.locator('.log-entry.is-current')).toContainText('Объект отклонён');
  await expect(page.locator('.log-entry').filter({ hasText: 'address.city, address.zipCode' })).toBeVisible();
  await page.getByRole('switch', { name: '@Valid на address' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await expect(page.locator('.scene-badge')).toContainText('4 violations');
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
