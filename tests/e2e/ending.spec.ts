import { test, expect, type Page } from '@playwright/test';

async function forceCompletion(page: Page, maxTier: number): Promise<void> {
  await page.evaluate((tier) => {
    const s = window.__pyramid.session;
    const defs = s.secrets.all;
    const ctx = {
      items: defs.flatMap((d) => d.rewardItems ?? []),
      solvedPuzzles: defs.flatMap((d) => (d.complete.type === 'puzzle' ? [d.complete.puzzle] : [])),
      reachedZones: defs.flatMap((d) => (d.complete.type === 'zone' ? [d.complete.zone] : [])),
      interacted: defs.flatMap((d) => (d.complete.type === 'interact' ? [d.complete.object] : [])),
      completedSecrets: [] as string[],
    };
    for (let pass = 0; pass < 3; pass++) {
      for (const secret of defs) {
        if (secret.tier > tier) continue;
        ctx.completedSecrets = s.secrets.serialize().completed;
        s.secrets.discover(secret.id, ctx);
        s.secrets.complete(secret.id, ctx);
      }
    }
    for (let id = 1; id <= 20; id++) s.completeRoom(id);
    s.finish();
  }, maxTier);
}

test('финал: кинематограф, пропуск, экран результатов, рестарт', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Искатель' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();

  await forceCompletion(page, 2);

  await expect(page.locator('.skip-btn')).toBeVisible();
  const endingActive = await page.evaluate(() => window.__pyramid.game.scene.isActive('Ending'));
  expect(endingActive).toBe(true);

  await page.locator('.skip-btn').click();
  await expect(page.locator('.results h1')).toContainText('ТЫ ВЫБРАЛСЯ! Проклятие снято!');
  await expect(page.locator('.rating-badge')).toBeVisible();
  await expect(page.locator('.stats-grid')).toContainText('Комнат пройдено');
  await expect(page.locator('.results-buttons')).toContainText('Играть заново');
  await expect(page.locator('.results-buttons')).toContainText('Выбрать другую сложность');
  await expect(page.locator('.results-buttons')).toContainText('Вернуться в главное меню');

  await page.getByRole('button', { name: /Играть заново/ }).click();
  await expect(page.locator('.hud-rooms')).toContainText('1/20');
  await expect(page.locator('.hud-secrets')).toContainText('0/120');
  await expect(page.locator('.hud-hints')).toContainText('3/3');
});

test('кинематограф проигрывается полностью без пропуска', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Исследователь' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();

  await forceCompletion(page, 1);
  await expect(page.locator('.skip-btn')).toBeVisible();
  await expect(page.locator('.results h1')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('.results h1')).toContainText('ТЫ ВЫБРАЛСЯ!');
  await expect(page.locator('.skip-btn')).toHaveCount(0);
});

test('экран результатов: переход в главное меню', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Исследователь' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();

  await forceCompletion(page, 1);
  await page.locator('.skip-btn').click();
  await expect(page.locator('.results h1')).toBeVisible();
  await page.getByRole('button', { name: /Вернуться в главное меню/ }).click();
  await expect(page.getByRole('heading', { name: 'ПРОКЛЯТИЕ ПИРАМИДЫ' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Продолжить/ })).toBeEnabled();
});