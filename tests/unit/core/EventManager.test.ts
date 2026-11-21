import { describe, it, expect, vi } from 'vitest';
import { EventManager } from '../../../src/core/EventManager';

describe('EventManager', () => {
  it('должен доставлять события подписчикам', () => {
    const bus = new EventManager();
    const handler = vi.fn();
    bus.on('secret-found', handler);
    bus.emit('secret-found', { id: 's1' });
    expect(handler).toHaveBeenCalledWith({ id: 's1' });
  });

  it('должен поддерживать несколько подписчиков', () => {
    const bus = new EventManager();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('door-opened', a);
    bus.on('door-opened', b);
    bus.emit('door-opened', 'd1');
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('должен отписывать обработчик', () => {
    const bus = new EventManager();
    const handler = vi.fn();
    const off = bus.on('hint-used', handler);
    off();
    bus.emit('hint-used', 1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('не должен падать при событии без подписчиков', () => {
    const bus = new EventManager();
    expect(() => bus.emit('player-died')).not.toThrow();
  });
});