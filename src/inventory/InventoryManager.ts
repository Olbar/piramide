import type { ItemCategory, ItemDef } from '../core/types';
import { ITEMS } from './items';

export class InventoryManager {
  private owned: string[] = [];

  get items(): string[] {
    return [...this.owned];
  }

  get count(): number {
    return this.owned.length;
  }

  hasItem(id: string): boolean {
    return this.owned.includes(id);
  }

  addItem(id: string): boolean {
    if (!ITEMS[id] || this.hasItem(id)) return false;
    this.owned.push(id);
    return true;
  }

  removeItem(id: string): boolean {
    const index = this.owned.indexOf(id);
    if (index === -1) return false;
    this.owned.splice(index, 1);
    return true;
  }

  byCategory(): Record<ItemCategory, ItemDef[]> {
    const result: Record<ItemCategory, ItemDef[]> = {
      key: [], 'golden-key': [], artifact: [], inscription: [], magic: [], crystal: [],
    };
    for (const id of this.owned) {
      const def = ITEMS[id];
      result[def.category].push(def);
    }
    return result;
  }

  serialize(): string[] {
    return [...this.owned];
  }

  restore(ids: string[]): void {
    this.owned = [];
    for (const id of ids) this.addItem(id);
  }
}