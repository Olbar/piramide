import type { RoomConnection } from '../core/types';

export class RoomGraph {
  private adjacency = new Map<number, { to: number; doorId?: string }[]>();

  constructor(connections: RoomConnection[]) {
    for (const { from, to, doorId } of connections) {
      this.link(from, to, doorId);
      this.link(to, from, doorId);
    }
  }

  private link(from: number, to: number, doorId?: string): void {
    let list = this.adjacency.get(from);
    if (!list) {
      list = [];
      this.adjacency.set(from, list);
    }
    if (!list.some((e) => e.to === to)) list.push({ to, doorId });
  }

  neighbors(id: number): number[] {
    return (this.adjacency.get(id) ?? []).map((e) => e.to);
  }

  areConnected(a: number, b: number): boolean {
    return this.neighbors(a).includes(b);
  }

  connection(from: number, to: number): RoomConnection | undefined {
    const entry = (this.adjacency.get(from) ?? []).find((e) => e.to === to);
    return entry ? { from, to, doorId: entry.doorId } : undefined;
  }
}