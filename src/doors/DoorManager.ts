import type { DoorDef } from '../core/types';

export interface DoorContext {
  items: string[];
  solvedPuzzles: string[];
  completedSecrets: string[];
}

export class DoorManager {
  private defs = new Map<string, DoorDef>();
  private opened = new Set<string>();

  constructor(doors: DoorDef[]) {
    for (const door of doors) this.defs.set(door.id, door);
  }

  get(id: string): DoorDef | undefined {
    return this.defs.get(id);
  }

  isOpen(id: string): boolean {
    return this.opened.has(id);
  }

  canOpen(id: string, ctx: DoorContext): boolean {
    const door = this.defs.get(id);
    if (!door) return false;
    if (door.requiresItem && !ctx.items.includes(door.requiresItem)) return false;
    if (door.requiresPuzzle && !ctx.solvedPuzzles.includes(door.requiresPuzzle)) return false;
    if (door.requiresSecret && !ctx.completedSecrets.includes(door.requiresSecret)) return false;
    return true;
  }

  tryOpen(id: string, ctx: DoorContext): boolean {
    if (this.isOpen(id)) return true;
    if (!this.canOpen(id, ctx)) return false;
    this.opened.add(id);
    return true;
  }

  openDoor(id: string): void {
    if (this.defs.has(id)) this.opened.add(id);
  }

  get openedDoors(): string[] {
    return [...this.opened];
  }

  serialize(): string[] {
    return this.openedDoors;
  }

  restore(ids: string[]): void {
    this.opened.clear();
    for (const id of ids) this.openDoor(id);
  }
}