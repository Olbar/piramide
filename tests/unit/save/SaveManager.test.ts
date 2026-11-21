import { describe, it, expect } from 'vitest';
import { SaveManager, createDefaultState } from '../../../src/save/SaveManager';
import type { StorageAdapter, GameState } from '../../../src/core/types';

class MemoryStorage implements StorageAdapter {
  data: string | null = null;
  failSave = false;
  failLoad = false;

  async load(): Promise<string | null> {
    if (this.failLoad) throw new Error('load failed');
    return this.data;
  }
  async save(data: string): Promise<void> {
    if (this.failSave) throw new Error('save failed');
    this.data = data;
  }
  async clear(): Promise<void> {
    this.data = null;
  }
}

describe('SaveManager', () => {
  it('должен сохранять и восстанавливать прогресс', async () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager(storage);
    const state = createDefaultState('seeker');
    state.currentRoom = 7;
    state.completedSecrets = ['s1', 's2'];
    state.items = ['golden-key'];
    state.elapsedMs = 123456;

    expect(await mgr.save(state)).toBe(true);
    const loaded = await mgr.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.currentRoom).toBe(7);
    expect(loaded!.completedSecrets).toEqual(['s1', 's2']);
    expect(loaded!.items).toEqual(['golden-key']);
    expect(loaded!.elapsedMs).toBe(123456);
    expect(loaded!.difficulty).toBe('seeker');
  });

  it('должен возвращать null при отсутствии сохранения', async () => {
    const mgr = new SaveManager(new MemoryStorage());
    expect(await mgr.load()).toBeNull();
    expect(await mgr.hasSave()).toBe(false);
  });

  it('должен сообщать о наличии сохранения', async () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager(storage);
    await mgr.save(createDefaultState('explorer'));
    expect(await mgr.hasSave()).toBe(true);
  });

  it('должен переживать ошибку записи', async () => {
    const storage = new MemoryStorage();
    storage.failSave = true;
    const mgr = new SaveManager(storage);
    expect(await mgr.save(createDefaultState('explorer'))).toBe(false);
    expect(mgr.lastError).toBeTruthy();
  });

  it('должен переживать ошибку чтения', async () => {
    const storage = new MemoryStorage();
    storage.failLoad = true;
    const mgr = new SaveManager(storage);
    expect(await mgr.load()).toBeNull();
  });

  it('должен отклонять повреждённое сохранение', async () => {
    const storage = new MemoryStorage();
    storage.data = '{broken json';
    const mgr = new SaveManager(storage);
    expect(await mgr.load()).toBeNull();
  });

  it('должен отклонять сохранение с неверной версией', async () => {
    const storage = new MemoryStorage();
    const state = createDefaultState('explorer');
    storage.data = JSON.stringify({ ...state, version: 999 });
    const mgr = new SaveManager(storage);
    expect(await mgr.load()).toBeNull();
  });

  it('должен отклонять сохранение без обязательных полей', async () => {
    const storage = new MemoryStorage();
    storage.data = JSON.stringify({ version: 1, difficulty: 'explorer' });
    const mgr = new SaveManager(storage);
    expect(await mgr.load()).toBeNull();
  });

  it('должен отклонять сохранение с неизвестной сложностью', async () => {
    const storage = new MemoryStorage();
    const state = createDefaultState('explorer');
    storage.data = JSON.stringify({ ...state, difficulty: 'impossible' });
    const mgr = new SaveManager(storage);
    expect(await mgr.load()).toBeNull();
  });

  it('должен очищать сохранение', async () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager(storage);
    await mgr.save(createDefaultState('explorer'));
    expect(await mgr.clear()).toBe(true);
    expect(await mgr.hasSave()).toBe(false);
  });

  it('состояние по умолчанию должно содержать 3 подсказки и стартовую комнату', () => {
    const state: GameState = createDefaultState('pharaoh');
    expect(state.hintsUsed).toBe(0);
    expect(state.currentRoom).toBe(1);
    expect(state.difficulty).toBe('pharaoh');
    expect(state.visitedRooms).toEqual([1]);
    expect(state.items).toContain('main-crystal');
    expect(state.finished).toBe(false);
  });
});