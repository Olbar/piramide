import type { RoomConnection } from '../../core/types';
import type { GameData } from '../../core/GameSession';
import { RoomGraph } from '../RoomGraph';
import { room01 } from './room01';
import { room02 } from './room02';
import { room03 } from './room03';
import { room04 } from './room04';
import { room05 } from './room05';
import { room06 } from './room06';
import { room07 } from './room07';
import { room08 } from './room08';
import { room09 } from './room09';
import { room10 } from './room10';
import { room11 } from './room11';
import { room12 } from './room12';
import { room13 } from './room13';
import { room14 } from './room14';
import { room15 } from './room15';
import { room16 } from './room16';
import { room17 } from './room17';
import { room18 } from './room18';
import { room19 } from './room19';
import { room20 } from './room20';

const built = [
  room01, room02, room03, room04, room05, room06, room07, room08, room09, room10,
  room11, room12, room13, room14, room15, room16, room17, room18, room19, room20,
];

export const ROOMS = built.map((b) => b.room);
export const ALL_SECRETS = ROOMS.flatMap((r) => r.secrets);
export const ALL_DOORS = ROOMS.flatMap((r) => r.doors);

export const CONNECTIONS: RoomConnection[] = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4, doorId: 'd-3-4' },
  { from: 4, to: 5 },
  { from: 5, to: 6, doorId: 'd-5-6' },
  { from: 6, to: 7 },
  { from: 7, to: 8, doorId: 'd-7-8' },
  { from: 8, to: 9 },
  { from: 9, to: 10, doorId: 'd-9-10' },
  { from: 10, to: 11 },
  { from: 11, to: 12, doorId: 'd-11-12' },
  { from: 12, to: 13 },
  { from: 13, to: 14, doorId: 'd-13-14' },
  { from: 14, to: 15 },
  { from: 15, to: 16, doorId: 'd-15-16' },
  { from: 16, to: 17 },
  { from: 17, to: 18, doorId: 'd-17-18' },
  { from: 18, to: 19 },
  { from: 19, to: 20, doorId: 'd-19-20' },
  { from: 1, to: 5, doorId: 'd-1-5' },
  { from: 3, to: 8, doorId: 'd-3-8' },
  { from: 6, to: 11, doorId: 'd-6-11' },
  { from: 9, to: 14, doorId: 'd-9-14' },
  { from: 12, to: 17, doorId: 'd-12-17' },
  { from: 15, to: 20, doorId: 'd-15-20' },
  { from: 2, to: 7, doorId: 'd-2-7' },
  { from: 4, to: 9, doorId: 'd-4-9' },
  { from: 10, to: 16, doorId: 'd-10-16' },
  { from: 13, to: 18, doorId: 'd-13-18' },
];

const graph = new RoomGraph(CONNECTIONS);
for (const room of ROOMS) {
  for (const neighbor of graph.neighbors(room.id)) {
    room.entryPoints[String(neighbor)] =
      neighbor < room.id ? { x: 150, y: 560 } : { x: room.width - 150, y: 560 };
  }
}

export const GAME_DATA: GameData = {
  rooms: ROOMS,
  puzzles: built.flatMap((b) => b.puzzles),
  connections: CONNECTIONS,
};