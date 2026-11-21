import { test, expect } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 820, height: 1180 } });

test('мобильное управление: экранные кнопки двигают героя', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Исследователь' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.touch-controls')).toHaveClass(/visible/);

  const liveX = (): Promise<number> => page.evaluate(() => {
    const gs = window.__pyramid.game.scene.getScene('Game') as unknown as { player: { x: number } };
    return gs.player.x;
  });
  const x0 = await liveX();
  const right = page.locator('.touch-btn', { hasText: '▶' });
  await right.dispatchEvent('pointerdown');
  await page.waitForTimeout(700);
  await right.dispatchEvent('pointerup');
  const x1 = await liveX();
  expect(x1).toBeGreaterThan(x0 + 40);

  await page.locator('.touch-btn.jump').dispatchEvent('pointerdown');
  await page.waitForTimeout(250);
  const airborne = await page.evaluate(() => {
    const gs = window.__pyramid.game.scene.getScene('Game') as unknown as {
      player: { body: { velocity: { y: number } } };
    };
    return gs.player.body.velocity.y < 0;
  });
  expect(airborne).toBe(true);
});