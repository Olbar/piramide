import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room14 = defineRoom({
  id: 14,
  name: 'Зал маятников',
  subtitle: 'Лезвия маятников отсчитывают время твоей жизни.',
  width: 2800,
  palette: PALETTES[13],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1400, y: 560 }],
  platforms: [
    floor(0, 500), floor(680, 400), floor(1260, 400), floor(1840, 400), floor(2420, 380),
    plat(250, 540, 140), plat(520, 460, 120), plat(750, 520, 140),
    plat(1000, 440, 140), plat(1300, 520, 140), plat(1550, 440, 140),
    plat(1900, 520, 140), plat(2150, 440, 140), plat(2450, 340, 160),
    plat(1100, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
  ],
  traps: [
    { id: 't-14-1', kind: 'spikes', x: 500, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-14-2', kind: 'spikes', x: 1080, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-14-3', kind: 'spikes', x: 1660, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-14-4', kind: 'spikes', x: 2240, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-14-5', kind: 'pendulum', x: 800, y: 140, w: 40, h: 240, period: 2.6, range: 140, lethal: true },
    { id: 't-14-6', kind: 'pendulum', x: 1400, y: 140, w: 40, h: 240, period: 2.2, range: 150, lethal: true },
    { id: 't-14-7', kind: 'pendulum', x: 2000, y: 140, w: 40, h: 240, period: 1.9, range: 160, lethal: true },
  ],
  ropes: [{ x: 2650, yTop: 200, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Первый маятник', desc: 'Прыжок под первым маятником.', at: { x: 790, y: 450 }, reward: ['serpent-key'] },
    { kind: 'timed-jump', title: 'Второй маятник', desc: 'Прыжок под вторым маятником.', at: { x: 1340, y: 450 } },
    { kind: 'timed-jump', title: 'Третий маятник', desc: 'Прыжок под третьим маятником.', at: { x: 1940, y: 450 } },
    { kind: 'moving-platform', title: 'Плита под лезвием', desc: 'Плита над пропастью.', at: { x: 1160, y: 510 } },
    { kind: 'spikes-key', title: 'Ключ над шипами', desc: 'Награда над шипами.', at: { x: 1710, y: 560 } },
    { kind: 'rope-climb', title: 'Канат у выхода', desc: 'Подъём к верхней площадке.', at: { x: 2620, y: 260 } },
  ],
  doors: [],
  notes: [
    { id: 'note-14', x: 720, y: 620, title: 'Расчёт времени', text: '«Маятник идёт туда и обратно. Прыгай, когда лезвие уходит от тебя, — и не задерживайся под ним.»' },
  ],
  exitZone: { x: 2740, y: 560, w: 60, h: 100 },
});