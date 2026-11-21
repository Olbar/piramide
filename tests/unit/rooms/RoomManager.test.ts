import { describe, it, expect } from 'vitest';
import { RoomManager } from '../../../src/rooms/RoomManager';
import { RoomGraph } from '../../../src/rooms/RoomGraph';
import { DoorManager } from '../../../src/doors/DoorManager';
import type { DoorDef, RoomConnection } from '../../../src/core/types';

const connections: RoomConnection[] = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4, doorId: 'door-3-4' },
];

const doors: DoorDef[] = [
  { id: 'door-3-4', roomId: 3, name: 'Дверь в зал шипов', requiresItem: 'bronze-key', leadsTo: 4 },
];

function makeManager() {
  return new RoomManager(new RoomGraph(connections), new DoorManager(doors), 1);
}

describe('RoomManager', () => {
  it('должен разрешать возвращение в предыдущую комнату', () => {
    const rooms = makeManager();

    rooms.enterRoom(1);
    rooms.enterRoom(2);
    rooms.enterRoom(3);

    expect(rooms.enterRoom(1)).toBe(true);
    expect(rooms.currentRoom).toBe(1);
  });

  it('должен запрещать вход в непосещённую несмежную комнату', () => {
    const rooms = makeManager();
    rooms.enterRoom(1);
    expect(rooms.enterRoom(3)).toBe(false);
    expect(rooms.currentRoom).toBe(1);
  });

  it('должен запрещать проход через закрытую дверь', () => {
    const rooms = makeManager();
    rooms.enterRoom(1);
    rooms.enterRoom(2);
    rooms.enterRoom(3);
    expect(rooms.enterRoom(4)).toBe(false);
  });

  it('должен пускать через открытую дверь', () => {
    const graph = new RoomGraph(connections);
    const doorMgr = new DoorManager(doors);
    doorMgr.openDoor('door-3-4');
    const rooms = new RoomManager(graph, doorMgr, 1);
    rooms.enterRoom(1);
    rooms.enterRoom(2);
    rooms.enterRoom(3);
    expect(rooms.enterRoom(4)).toBe(true);
    expect(rooms.isVisited(4)).toBe(true);
  });

  it('должен отмечать посещённые комнаты', () => {
    const rooms = makeManager();
    rooms.enterRoom(1);
    rooms.enterRoom(2);
    expect(rooms.visitedRooms.sort()).toEqual([1, 2]);
    expect(rooms.isVisited(3)).toBe(false);
  });

  it('должен возвращать точку входа при возвращении', () => {
    const entries = {
      1: { default: { x: 100, y: 500 }, '2': { x: 900, y: 500 } },
    };
    const rooms = new RoomManager(new RoomGraph(connections), new DoorManager(doors), 1, entries);
    rooms.enterRoom(1);
    rooms.enterRoom(2);
    rooms.enterRoom(1);
    expect(rooms.entryPointFor(1, 2)).toEqual({ x: 900, y: 500 });
    expect(rooms.entryPointFor(1, 99)).toEqual({ x: 100, y: 500 });
  });

  it('должен отслеживать пройденные комнаты', () => {
    const rooms = makeManager();
    rooms.enterRoom(1);
    rooms.markRoomCompleted(1);
    expect(rooms.completedRooms).toEqual([1]);
    rooms.markRoomCompleted(1);
    expect(rooms.completedRooms).toEqual([1]);
  });

  it('должен сериализоваться и восстанавливаться', () => {
    const rooms = makeManager();
    rooms.enterRoom(1);
    rooms.enterRoom(2);
    rooms.markRoomCompleted(1);
    const restored = makeManager();
    restored.restore(rooms.serialize());
    expect(restored.currentRoom).toBe(2);
    expect(restored.visitedRooms.sort()).toEqual([1, 2]);
    expect(restored.completedRooms).toEqual([1]);
    expect(restored.enterRoom(1)).toBe(true);
  });
});