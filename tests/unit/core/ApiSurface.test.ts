import { describe, it, expect, vi } from 'vitest';
import { EventManager } from '../../../src/core/EventManager';
import { GameProgress } from '../../../src/core/GameProgress';
import { GameSession } from '../../../src/core/GameSession';
import { DoorManager } from '../../../src/doors/DoorManager';
import { SecretManager } from '../../../src/secrets/SecretManager';
import { GAME_DATA } from '../../../src/rooms/rooms-data';
import type { StorageAdapter } from '../../../src/core/types';

class MemoryStorage implements StorageAdapter {
  private data: string | null = null;
  async save(data: string): Promise<void> {
    this.data = data;
  }
  async load(): Promise<string | null> {
    return this.data;
  }
  async clear(): Promise<void> {
    this.data = null;
  }
}

describe('EventManager.clear', () => {
  it('удаляет всех подписчиков', () => {
    const bus = new EventManager();
    const handler = vi.fn();
    bus.on('x', handler);
    bus.clear();
    bus.emit('x');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('GameProgress: счётчики', () => {
  it('возвращает количество завершённых комнат и секретов', () => {
    const progress = new GameProgress(20, 30);
    expect(progress.completedRoomsCount).toBe(0);
    expect(progress.completedSecretsCount).toBe(0);
    progress.completeRoom(1);
    progress.completeRoom(2);
    progress.completeSecret('s-1-1');
    expect(progress.completedRoomsCount).toBe(2);
    expect(progress.completedSecretsCount).toBe(1);
  });
});

describe('DoorManager.get', () => {
  it('возвращает определение двери и undefined для неизвестной', () => {
    const doors = new DoorManager([
      { id: 'd-1', roomId: 1, name: 'Дверь', leadsTo: 2 },
    ]);
    expect(doors.get('d-1')?.name).toBe('Дверь');
    expect(doors.get('nope')).toBeUndefined();
  });
});

describe('SecretManager.discoveredCount', () => {
  it('считает раскрытые секреты', () => {
    const secrets = new SecretManager(GAME_DATA.rooms.flatMap((r) => r.secrets));
    expect(secrets.discoveredCount).toBe(0);
    secrets.discover('s-1-1', {
      items: [], solvedPuzzles: [], reachedZones: [], interacted: [], completedSecrets: [],
    });
    expect(secrets.discoveredCount).toBe(1);
  });
});

describe('GameSession: настройки и тип концовки', () => {
  it('updateSettings меняет громкость, gameSettings возвращает копию', async () => {
    const session = new GameSession(GAME_DATA, new MemoryStorage());
    session.newGame('explorer');
    session.updateSettings({ musicVolume: 0.2 });
    expect(session.gameSettings.musicVolume).toBe(0.2);
    expect(session.gameSettings.sfxVolume).toBe(0.8);
    const copy = session.gameSettings;
    copy.musicVolume = 1;
    expect(session.gameSettings.musicVolume).toBe(0.2);
    await session.flush();
  });

  it('endingType: normal без надписей, good со всеми надписями, true со всеми секретами', () => {
    const session = new GameSession(GAME_DATA, new MemoryStorage());
    session.newGame('pharaoh');
    expect(session.endingType()).toBe('normal');
    for (let i = 1; i <= 12; i++) session.inventory.addItem(`inscription-${i}`);
    expect(session.endingType()).toBe('good');
    const defs = session.secrets.all;
    const ctx = {
      items: [...session.inventory.items, ...defs.flatMap((d) => d.rewardItems ?? [])],
      solvedPuzzles: defs.flatMap((d) => (d.complete.type === 'puzzle' ? [d.complete.puzzle] : [])),
      reachedZones: defs.flatMap((d) => (d.complete.type === 'zone' ? [d.complete.zone] : [])),
      interacted: defs.flatMap((d) => (d.complete.type === 'interact' ? [d.complete.object] : [])),
      completedSecrets: [] as string[],
    };
    for (let pass = 0; pass < 3; pass++) {
      for (const secret of defs) {
        ctx.completedSecrets = session.secrets.serialize().completed;
        session.secrets.discover(secret.id, ctx);
        session.secrets.complete(secret.id, ctx);
      }
    }
    expect(session.secrets.completedCount).toBe(120);
    expect(session.endingType()).toBe('true');
  });
});