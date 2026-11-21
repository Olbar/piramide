import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room08 = defineRoom({
  id: 8,
  name: 'Зеркальная комната',
  subtitle: 'Луч света — ключ к дверям, которые не открываются руками.',
  width: 2400,
  palette: PALETTES[7],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1200, y: 560 }],
  platforms: [
    floor(0, 700), floor(880, 600), floor(1660, 740),
    plat(300, 540, 160), plat(560, 440, 140), plat(950, 520, 160),
    plat(1200, 420, 160), plat(1500, 520, 120, 'crumble'), plat(1750, 440, 180),
    plat(2050, 340, 160), plat(720, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
  ],
  traps: [
    { id: 't-8-1', kind: 'spikes', x: 700, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-8-2', kind: 'spikes', x: 1480, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-8-3', kind: 'fire', x: 1050, y: 600, w: 40, h: 60, period: 2.2, damage: 1 },
    { id: 't-8-4', kind: 'pendulum', x: 1900, y: 160, w: 40, h: 200, period: 2.8, range: 120, lethal: true },
  ],
  ropes: [{ x: 2250, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'light-mirror', title: 'Путь луча', desc: 'Поверни зеркала, чтобы луч достиг кристалла. Порядок: левое → верхнее → правое.', at: { x: 350, y: 620 }, puzzleId: 'p-8-1' },
    { kind: 'hidden-chest', title: 'Сундук отражений', desc: 'Сундук, видимый в отражении.', at: { x: 600, y: 400 }, reward: ['ankh-key'] },
    { kind: 'timed-jump', title: 'Свет и тень', desc: 'Прыжок сквозь огненную струю.', at: { x: 1000, y: 450 } },
    { kind: 'moving-platform', title: 'Зеркальная плита', desc: 'Плита над пропастью.', at: { x: 780, y: 510 } },
    { kind: 'artifact-hunt', title: 'Око в зеркале', desc: 'Артефакт в верхней нише.', at: { x: 2100, y: 300 }, reward: ['inscription-5'] },
    { kind: 'secret-wall', title: 'Зеркальная стена', desc: 'Стена, отражающая не то, что должно.', at: { x: 2340, y: 560 } },
  ],
  puzzles: [
    {
      id: 'p-8-1', roomId: 8, kind: 'light-mirror', title: 'Путь луча',
      steps: ['m1', 'm2', 'm3'], stepLabels: { m1: 'Левое', m2: 'Верхнее', m3: 'Правое' },
      hints: ['Свет должен дойти до кристалла.', 'Начни с левого зеркала.', 'Поверни зеркала: левое → верхнее → правое.'],
    },
  ],
  doors: [],
  notes: [
    { id: 'note-8', x: 920, y: 620, title: 'Подсказка зеркал', text: '«Золотой ключ, что открывает тайную дверь в сердце пирамиды, спрятан в комнате огня — на канате над огненной пропастью. Так гласит надпись на зеркале.»' },
  ],
  exitZone: { x: 2340, y: 560, w: 60, h: 100 },
});