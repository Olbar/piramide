import { test, expect } from '@playwright/test';

test('автосохранение и продолжение после перезагрузки', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Искатель' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();
  await page.waitForTimeout(800);

  await page.keyboard.press('e');
  await expect(page.locator('.note-paper')).toBeVisible();
  await page.getByRole('button', { name: 'Запомнить' }).click();
  await page.keyboard.press('h');
  await expect(page.locator('.hud-hints')).toContainText('2/3');

  await page.keyboard.down('d');
  await page.waitForTimeout(4500);
  await page.keyboard.up('d');
  await page.waitForTimeout(1200);
  await expect(page.locator('.hud-rooms')).toContainText('2/20');
  await page.waitForTimeout(600);

  await page.reload();
  await expect(page.getByRole('button', { name: /Продолжить/ })).toBeEnabled();
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await expect(page.locator('.hud-rooms')).toContainText('2/20');
  await expect(page.locator('.hud-hints')).toContainText('2/3');
  await expect(page.locator('.hud-room-name')).toHaveText('Зал песочных часов');

  await page.keyboard.press('j');
  await page.locator('.tab-btn', { hasText: 'Записки' }).click();
  await expect(page.locator('.journal-entry')).toContainText('Записка исследователя');
});

test('возврат в посещённую комнату через карту', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Новая игра/ }).click();
  await page.locator('.diff-card', { hasText: 'Искатель' }).click();
  await page.getByRole('button', { name: /Начать приключение/ }).click();
  await expect(page.locator('.hud')).toBeVisible();

  await page.keyboard.down('d');
  await page.waitForTimeout(4500);
  await page.keyboard.up('d');
  await page.waitForTimeout(1200);
  await expect(page.locator('.hud-rooms')).toContainText('2/20');

  await page.keyboard.press('m');
  await expect(page.locator('.map-wrap svg')).toBeVisible();
  await page.locator('.map-node.visited').first().click();
  await expect(page.locator('.hud-rooms')).toContainText('1/20');
  await expect(page.locator('.hud-room-name')).toHaveText('Сердце пирамиды');
  await page.waitForTimeout(1500);
  await expect(page.locator('.hud-rooms')).toContainText('1/20');
});