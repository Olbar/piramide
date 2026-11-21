import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room11 = defineRoom({
  id: 11,
  name: 'Лабиринт колонн',
  subtitle: 'Среди колонн легко потеряться — и невозможно найти выход без памяти.',
  width: 2800,
  palette: PALETTES[10],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1400, y: 560 }],
  platforms: [
    floor(0, 500), floor(680, 400), floor(1260, 400), floor(1840, 400), floor(2420, 380),
    plat(250, 540, 140), plat(520, 440, 120), plat(750, 520, 140),
    plat(1000, 420, 140), plat(1300, 520, 140), plat(1550, 420, 140),
    plat(1900, 520, 140), plat(2150, 420, 140), plat(2450, 320, 160),
    plat(1100, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
    plat(2280, 560, 120, 'crumble'),
  ],
  traps: [
    { id: 't-11-1', kind: 'spikes', x: 500, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-11-2', kind: 'spikes', x: 1080, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-11-3', kind: 'spikes', x: 1660, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-11-4', kind: 'spikes', x: 2240, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-11-5', kind: 'moving-wall', x: 1400, y: 440, w: 40, h: 220, period: 3.2, range: 160, lethal: true },
    { id: 't-11-6', kind: 'falling-rock', x: 2000, y: 80, w: 44, h: 44, period: 2.4, lethal: true },
  ],
  ropes: [{ x: 2650, yTop: 200, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Между колонн', desc: 'Прыжок в паузе между стенами.', at: { x: 1340, y: 450 } },
    { kind: 'moving-platform', title: 'Блуждающая плита', desc: 'Плита, курсирующая в лабиринте.', at: { x: 1160, y: 510 } },
    { kind: 'hidden-chest', title: 'Сундук в лабиринте', desc: 'Сундук с древним символом.', at: { x: 1600, y: 380 }, reward: ['ancient-symbol'] },
    { kind: 'spikes-key', title: 'Ключ над пропастью', desc: 'Награда над шипами.', at: { x: 1710, y: 560 } },
    { kind: 'rope-climb', title: 'Канат у выхода', desc: 'Подъём к верхней площадке.', at: { x: 2620, y: 240 }, reward: ['inscription-7'] },
    { kind: 'secret-wall', title: 'Ложная колонна', desc: 'Одна из колонн — фальшивая стена.', at: { x: 2740, y: 560 } },
  ],
  doors: [
    { id: 'd-11-12', roomId: 11, name: 'Дверь в зал движущихся стен', requiresItem: 'sun-key', leadsTo: 12 },
  ],
  notes: [
    { id: 'note-11', x: 720, y: 620, title: 'Правило лабиринта', text: '«Держись правой руки — и лабиринт выпустит тебя. Но тайны прячутся там, где рука не достаёт.»' },
  ],
  exitZone: { x: 2740, y: 560, w: 60, h: 100 },
});