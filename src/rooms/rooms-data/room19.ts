import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room19 = defineRoom({
  id: 19,
  name: 'Преддверие выхода',
  subtitle: 'Последние загадки перед свободой.',
  width: 2400,
  palette: PALETTES[18],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1200, y: 560 }],
  platforms: [
    floor(0, 650), floor(830, 650), floor(1660, 740),
    plat(300, 540, 160), plat(560, 440, 140), plat(900, 520, 160),
    plat(1150, 420, 160), plat(1450, 520, 120, 'crumble'), plat(1750, 440, 180),
    plat(2050, 340, 160), plat(670, 580, 120, 'moving', { dx: 120, dy: 0, period: 2.8 }),
  ],
  traps: [
    { id: 't-19-1', kind: 'spikes', x: 650, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-19-2', kind: 'spikes', x: 1480, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-19-3', kind: 'fire', x: 1000, y: 600, w: 40, h: 60, period: 1.8, damage: 1 },
    { id: 't-19-4', kind: 'pendulum', x: 1900, y: 160, w: 40, h: 200, period: 2.2, range: 130, lethal: true },
    { id: 't-19-5', kind: 'falling-ceiling', x: 350, y: 60, w: 200, h: 40, period: 3.2, lethal: true },
  ],
  ropes: [{ x: 2250, yTop: 200, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Предпоследний прыжок', desc: 'Прыжок под падающим потолком.', at: { x: 600, y: 370 } },
    { kind: 'moving-platform', title: 'Плита преддверия', desc: 'Плита над пропастью.', at: { x: 730, y: 510 } },
    {
      kind: 'symbol-decode', title: 'Последнее послание', desc: 'Финальная загадка: Скарабей → Солнце → Луна → Звезда.',
      at: { x: 950, y: 620 }, puzzleId: 'p-19-1',
    },
    { kind: 'hidden-chest', title: 'Сундук у выхода', desc: 'Сундук в верхней нише.', at: { x: 2100, y: 300 } },
    { kind: 'rope-climb', title: 'Канат свободы', desc: 'Подъём к последней нише.', at: { x: 2220, y: 240 }, reward: ['inscription-12'] },
    { kind: 'secret-wall', title: 'Последняя стена', desc: 'Стена перед вратами.', at: { x: 2340, y: 560 } },
  ],
  puzzles: [
    {
      id: 'p-19-1', roomId: 19, kind: 'symbol-decode', title: 'Последнее послание',
      steps: ['scarab', 'sun', 'moon', 'star'], stepLabels: { scarab: 'Скарабей', sun: 'Солнце', moon: 'Луна', star: 'Звезда' },
      hints: ['Послание рассказывает о пути души.', 'Скарабей возрождается, Солнце ведёт, Луна хранит, Звезда указывает.', 'Активируй символы: Скарабей → Солнце → Луна → Звезда.'],
    },
  ],
  doors: [
    { id: 'd-19-20', roomId: 19, name: 'Дверь к вратам свободы', requiresItem: 'pharaoh-key', leadsTo: 20 },
  ],
  notes: [
    { id: 'note-19', x: 860, y: 620, title: 'Путь души', text: '«Скарабей возрождается, Солнце ведёт, Луна хранит, Звезда указывает путь. Таков порядок выхода из вечности.»' },
  ],
  exitZone: { x: 2340, y: 560, w: 60, h: 100 },
});