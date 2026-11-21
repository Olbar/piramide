import { test, expect } from '@playwright/test';

async function startGame(page: import('@playwright/test').Page, difficulty = 'Искатель'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: difficulty }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();
  await page.waitForTimeout(800);
}

async function liveX(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const gs = window.__pyramid.game.scene.getScene('Game') as unknown as { player: { x: number } };
    return gs.player.x;
  });
}

test('движение, прыжок, записка, подсказка, карта, инвентарь, пауза', async ({ page }) => {
  await startGame(page);

  await page.keyboard.press('e');
  await expect(page.locator('.note-paper')).toBeVisible();
  await expect(page.locator('.note-paper')).toContainText('Записка исследователя');
  await page.getByRole('button', { name: 'Запомнить' }).click();
  await expect(page.locator('.note-paper')).toHaveCount(0);

  const x0 = await liveX(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  const x1 = await liveX(page);
  expect(x1).toBeGreaterThan(x0 + 50);

  await page.keyboard.down('Space');
  await page.waitForTimeout(120);
  await page.keyboard.up('Space');
  await page.waitForTimeout(200);
  const airborne = await page.evaluate(() => {
    const gs = window.__pyramid.game.scene.getScene('Game') as unknown as {
      player: { body: { velocity: { y: number } } };
    };
    return gs.player.body.velocity.y < 0;
  });
  expect(airborne).toBe(true);
  await page.waitForTimeout(900);

  await page.keyboard.press('h');
  await expect(page.locator('.hud-hints')).toContainText('2/3');
  await expect(page.locator('.toast').first()).toContainText('Подсказка (этап 1/3)');

  await page.keyboard.press('m');
  await expect(page.locator('.map-wrap svg')).toBeVisible();
  await expect(page.locator('.map-node')).toHaveCount(20);
  await page.keyboard.press('Escape');
  await expect(page.locator('.map-wrap')).toHaveCount(0);

  await page.keyboard.press('i');
  await expect(page.locator('.modal')).toContainText('Главный кристалл');
  await page.keyboard.press('Escape');

  await page.keyboard.press('j');
  await expect(page.locator('.tabs')).toBeVisible();
  await page.locator('.tab-btn', { hasText: 'Записки' }).click();
  await expect(page.locator('.journal-entry')).toContainText('Записка исследователя');
  await page.locator('.tab-btn', { hasText: 'Секреты' }).click();
  await expect(page.locator('.secret-room-header')).toHaveCount(20);
  await page.keyboard.press('Escape');

  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toContainText('Пауза');
  const paused = await page.evaluate(() => window.__pyramid.game.scene.isPaused('Game'));
  expect(paused).toBe(true);
  await page.getByRole('button', { name: /Продолжить/ }).click();
  const resumed = await page.evaluate(() => window.__pyramid.game.scene.isActive('Game'));
  expect(resumed).toBe(true);
});

test('смерть от ловушки и возрождение у контрольной точки', async ({ page }) => {
  await startGame(page);
  await page.keyboard.down('a');
  await page.waitForTimeout(1400);
  await page.keyboard.up('a');
  await page.waitForTimeout(2500);
  await expect(page.locator('.toast', { hasText: 'Возрождение у контрольной точки' })).toBeVisible();
  const deaths = await page.evaluate(() => window.__pyramid.session.state.deaths);
  expect(deaths).toBeGreaterThanOrEqual(1);
  await expect(page.locator('.hud-hp')).toContainText('❤️❤️❤️');
  const pos = await page.evaluate(() => window.__pyramid.session.position);
  expect(pos.x).toBe(1000);
});

test('подсказки: лимит 3 и этапы', async ({ page }) => {
  await startGame(page);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('h');
    await page.waitForTimeout(250);
  }
  await expect(page.locator('.hud-hints')).toContainText('0/3');
  await page.keyboard.press('h');
  await expect(page.locator('.toast', { hasText: 'Подсказки закончились' })).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.locator('.journal-entry')).toHaveCount(3);
});