import { test, expect } from '@playwright/test';

test('главное меню: новая игра, сложность, HUD', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ПРОКЛЯТИЕ ПИРАМИДЫ' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Продолжить/ })).toBeDisabled();

  await page.getByRole('button', { name: /Новая игра/ }).click();
  await expect(page.getByRole('heading', { name: 'Выберите сложность' })).toBeVisible();
  await expect(page.locator('.diff-card')).toHaveCount(4);
  await expect(page.locator('.diff-card', { hasText: 'Проклятие фараона' })).toContainText('120 секретов');

  await page.locator('.diff-card', { hasText: 'Исследователь' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();

  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.hud-rooms')).toContainText('1/20');
  await expect(page.locator('.hud-secrets')).toContainText('0/120');
  await expect(page.locator('.hud-secrets')).toContainText('0/30');
  await expect(page.locator('.hud-hints')).toContainText('3/3');
  await expect(page.locator('.hud-room-name')).toHaveText('Сердце пирамиды');
});

test('управление, настройки и авторы из меню', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Управление/ }).click();
  await expect(page.locator('.controls-table')).toBeVisible();
  await expect(page.locator('.modal')).toContainText('coyote time');
  await page.getByRole('button', { name: '← В меню' }).click();

  await page.getByRole('button', { name: /Настройки/ }).click();
  const slider = page.locator('input[type="range"]').first();
  await slider.fill('20');
  await expect(page.locator('.setting-row .val').first()).toHaveText('20%');
  await page.getByRole('button', { name: '← В меню' }).click();

  await page.getByRole('button', { name: /Авторы/ }).click();
  await expect(page.locator('.modal')).toContainText('Phaser 3');
});