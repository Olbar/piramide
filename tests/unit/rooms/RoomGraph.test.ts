import { describe, it, expect } from 'vitest';
import { RoomGraph } from '../../../src/rooms/RoomGraph';
import type { RoomConnection } from '../../../src/core/types';

const connections: RoomConnection[] = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4, doorId: 'door-3-4' },
  { from: 2, to: 5 },
  { from: 5, to: 1, doorId: 'door-5-1' },
];

describe('RoomGraph', () => {
  it('должен строить двунаправленные связи', () => {
    const graph = new RoomGraph(connections);
    expect(graph.areConnected(1, 2)).toBe(true);
    expect(graph.areConnected(2, 1)).toBe(true);
    expect(graph.areConnected(1, 3)).toBe(false);
  });

  it('должен возвращать соседей комнаты', () => {
    const graph = new RoomGraph(connections);
    expect(graph.neighbors(2).sort()).toEqual([1, 3, 5]);
  });

  it('должен хранить дверь на связи', () => {
    const graph = new RoomGraph(connections);
    expect(graph.connection(3, 4)?.doorId).toBe('door-3-4');
    expect(graph.connection(4, 3)?.doorId).toBe('door-3-4');
    expect(graph.connection(1, 2)?.doorId).toBeUndefined();
  });

  it('должен поддерживать несколько связей между комнатами (граф, не цепочка)', () => {
    const graph = new RoomGraph(connections);
    expect(graph.neighbors(1).length).toBeGreaterThanOrEqual(2);
    expect(graph.neighbors(5).length).toBeGreaterThanOrEqual(2);
  });

  it('должен возвращать пустой список для изолированной комнаты', () => {
    const graph = new RoomGraph(connections);
    expect(graph.neighbors(99)).toEqual([]);
  });
});