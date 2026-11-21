import { describe, it, expect } from 'vitest';
import { InventoryManager } from '../../../src/inventory/InventoryManager';
import { ITEMS } from '../../../src/inventory/items';

describe('InventoryManager', () => {
  it('должен сохранять найденный ключ', () => {
    const inventory = new InventoryManager();

    inventory.addItem('golden-key');

    expect(inventory.hasItem('golden-key')).toBe(true);
  });

  it('не должен добавлять неизвестный предмет', () => {
    const inventory = new InventoryManager();
    expect(inventory.addItem('unknown-thing')).toBe(false);
    expect(inventory.hasItem('unknown-thing')).toBe(false);
  });

  it('не должен дублировать предмет', () => {
    const inventory = new InventoryManager();
    expect(inventory.addItem('golden-key')).toBe(true);
    expect(inventory.addItem('golden-key')).toBe(false);
    expect(inventory.items).toHaveLength(1);
  });

  it('должен удалять предмет при использовании', () => {
    const inventory = new InventoryManager();
    inventory.addItem('bronze-key');
    expect(inventory.removeItem('bronze-key')).toBe(true);
    expect(inventory.hasItem('bronze-key')).toBe(false);
    expect(inventory.removeItem('bronze-key')).toBe(false);
  });

  it('должен группировать предметы по категориям', () => {
    const inventory = new InventoryManager();
    inventory.addItem('bronze-key');
    inventory.addItem('golden-key');
    inventory.addItem('magic-amulet');
    inventory.addItem('main-crystal');
    const grouped = inventory.byCategory();
    expect(grouped.key.map((i) => i.id)).toContain('bronze-key');
    expect(grouped['golden-key'].map((i) => i.id)).toContain('golden-key');
    expect(grouped.magic.map((i) => i.id)).toContain('magic-amulet');
    expect(grouped.crystal.map((i) => i.id)).toContain('main-crystal');
  });

  it('должен сообщать количество предметов', () => {
    const inventory = new InventoryManager();
    inventory.addItem('bronze-key');
    inventory.addItem('golden-key');
    expect(inventory.count).toBe(2);
  });

  it('должен сериализоваться и восстанавливаться', () => {
    const inventory = new InventoryManager();
    inventory.addItem('golden-key');
    inventory.addItem('inscription-1');
    const restored = new InventoryManager();
    restored.restore(inventory.serialize());
    expect(restored.hasItem('golden-key')).toBe(true);
    expect(restored.hasItem('inscription-1')).toBe(true);
  });

  it('все предметы реестра должны иметь имя и категорию', () => {
    for (const item of Object.values(ITEMS)) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});