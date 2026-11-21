import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room03 = defineRoom({
  id: 3,
  name: 'Комната огня',
  subtitle: 'Лава дышит жаром древнего проклятия.',
  width: 2400,
  palette: PALETTES[2],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1250, y: 560 }],
  platforms: [
    floor(0, 500), floor(680, 300), floor(1160, 300), floor(1640, 760),
    plat(520, 560, 120), plat(860, 520, 120), plat(1020, 440, 120),
    plat(1300, 540, 140), plat(1500, 460, 120), plat(1800, 540, 160),
    plat(2000, 440, 140), plat(2180, 340, 140),
  ],
  traps: [
    { id: 't-3-1', kind: 'lava', x: 500, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-3-2', kind: 'lava', x: 980, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-3-3', kind: 'lava', x: 1460, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-3-4', kind: 'fire', x: 760, y: 600, w: 40, h: 60, period: 2.5, damage: 1 },
    { id: 't-3-5', kind: 'fire', x: 1750, y: 600, w: 40, h: 60, period: 2, damage: 1 },
    { id: 't-3-6', kind: 'falling-rock', x: 1900, y: 80, w: 44, h: 44, period: 2.6, lethal: true },
  ],
  ropes: [
    { x: 1500, yTop: 240, yBottom: 440 },
    { x: 2300, yTop: 220, yBottom: 640 },
  ],
  secrets: [
    { kind: 'lava-jump', title: 'Ключ над лавой', desc: 'Платформы над лавой ведут к награде.', at: { x: 880, y: 450 } },
    { kind: 'rope-climb', title: 'Канат над огнём', desc: 'Подъём по канату над огненной пропастью.', at: { x: 1470, y: 200 }, reward: ['golden-key'] },
    { kind: 'lava-jump', title: 'Огненный мост', desc: 'Цепочка платформ над третьей пропастью.', at: { x: 1530, y: 390 } },
    { kind: 'hidden-chest', title: 'Сундук в огне', desc: 'Обугленный сундук у дальней стены.', at: { x: 2230, y: 300 }, revealsNote: 'note-3' },
    { kind: 'spikes-key', title: 'Испытание пламенем', desc: 'Награда над огненной ловушкой.', at: { x: 2040, y: 370 } },
    { kind: 'timed-jump', title: 'Сердце огня', desc: 'Прыжок сквозь ритм огненных струй.', at: { x: 600, y: 480 } },
  ],
  doors: [
    { id: 'd-3-4', roomId: 3, name: 'Дверь в зал шипов', requiresItem: 'bronze-key', leadsTo: 4 },
    { id: 'd-3-8', roomId: 3, name: 'Дверь в зеркальную комнату', requiresItem: 'golden-key-2', leadsTo: 8 },
  ],
  notes: [
    { id: 'note-3', x: 1200, y: 620, title: 'Обугленная записка', text: '«Золотой ключ спрятан там, где канат касается неба. Ищи его в комнате огня — он откроет тайную дверь в сердце пирамиды.»' },
  ],
  exitZone: { x: 2340, y: 560, w: 60, h: 100 },
});