import type { Vec2 } from '../core/types';
import type { DoorManager } from '../doors/DoorManager';
import type { RoomGraph } from './RoomGraph';

export interface RoomManagerState {
  currentRoom: number;
  visited: number[];
  completed: number[];
}

export class RoomManager {
  private visited = new Set<number>();
  private completed = new Set<number>();
  private current: number;

  constructor(
    private readonly graph: RoomGraph,
    private readonly doors: DoorManager,
    startRoom: number,
    private readonly entries: Record<number, Record<string, Vec2>> = {},
  ) {
    this.current = startRoom;
  }

  get currentRoom(): number {
    return this.current;
  }

  get visitedRooms(): number[] {
    return [...this.visited];
  }

  get completedRooms(): number[] {
    return [...this.completed];
  }

  isVisited(id: number): boolean {
    return this.visited.has(id);
  }

  enterRoom(id: number): boolean {
    if (id === this.current) {
      this.visited.add(id);
      return true;
    }
    if (this.visited.has(id)) {
      this.current = id;
      return true;
    }
    if (!this.graph.areConnected(this.current, id)) return false;
    const connection = this.graph.connection(this.current, id);
    if (connection?.doorId && !this.doors.isOpen(connection.doorId)) return false;
    this.visited.add(id);
    this.current = id;
    return true;
  }

  entryPointFor(roomId: number, fromRoom: number): Vec2 | null {
    const roomEntries = this.entries[roomId];
    if (!roomEntries) return null;
    return roomEntries[String(fromRoom)] ?? roomEntries['default'] ?? null;
  }

  markRoomCompleted(id: number): void {
    this.completed.add(id);
  }

  serialize(): RoomManagerState {
    return { currentRoom: this.current, visited: this.visitedRooms, completed: this.completedRooms };
  }

  restore(state: RoomManagerState): void {
    this.current = state.currentRoom;
    this.visited = new Set(state.visited);
    this.completed = new Set(state.completed);
  }
}