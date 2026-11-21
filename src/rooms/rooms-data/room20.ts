import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room20 = defineRoom({
  id: 20,
  name: 'Врата свободы',
  subtitle: 'Огромные врата и гнездо для кристалла. Последний шаг.',
  width: 2200,
  palette: PALETTES[19],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1100, y: 560 }],
  platforms: [
    floor(0, 500), floor(680, 400), floor(1260, 940),
    plat(250, 540, 140), plat(520, 460, 120), plat(750, 520, 140),
    plat(1000, 440, 140), plat(1300, 520, 140), plat(1550, 420, 160),
    plat(1800, 320, 180), plat(1100, 580, 120, 'moving', { dx: 120, dy: 0, period: 2.6 }),
  ],
  traps: [
    { id: 't-20-1', kind: 'spikes', x: 500, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-20-2', kind: 'spikes', x: 1080, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-20-3', kind: 'pendulum', x: 900, y: 140, w: 40, h: 240, period: 2, range: 150, lethal: true },
    { id: 't-20-4', kind: 'fire', x: 1400, y: 600, w: 40, h: 60, period: 1.8, damage: 1 },
    { id: 't-20-5', kind: 'falling-rock', x: 1700, y: 80, w: 44, h: 44, period: 2, lethal: true },
  ],
  ropes: [{ x: 1950, yTop: 180, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Последний маятник', desc: 'Прыжок под маятником у врат.', at: { x: 790, y: 450 } },
    { kind: 'moving-platform', title: 'Плита у врат', desc: 'Плита над пропастью.', at: { x: 1160, y: 510 } },
    { kind: 'spikes-key', title: 'Ключ у врат', desc: 'Награда над шипами.', at: { x: 1130, y: 560 } },
    { kind: 'rope-climb', title: 'Канат у врат', desc: 'Подъём к верхней площадке.', at: { x: 1920, y: 220 } },
    { kind: 'hidden-chest', title: 'Прощальный дар', desc: 'Сундук у самых врат.', at: { x: 1850, y: 280 } },
    { kind: 'secret-wall', title: 'Стена у врат', desc: 'Последняя ложная стена пирамиды.', at: { x: 2140, y: 560 } },
  ],
  doors: [],
  notes: [
    { id: 'note-20', x: 1300, y: 620, title: 'Надпись на вратах', text: '«Вставь сердце пирамиды в гнездо — и вечность отпустит тебя. Но лишь тот, кто разгадал все тайны, увидит рассвет истинным.»' },
  ],
  exitZone: { x: 2080, y: 460, w: 100, h: 200 },
});