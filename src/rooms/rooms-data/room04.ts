import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room04 = defineRoom({
  id: 4,
  name: 'Зал шипов',
  subtitle: 'Каждый неверный шаг оплачивается кровью.',
  width: 2600,
  palette: PALETTES[3],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 450), floor(630, 300), floor(1110, 300), floor(1590, 300), floor(2070, 530),
    plat(470, 560, 120), plat(700, 500, 120), plat(950, 560, 120, 'moving', { dx: 140, dy: 0, period: 3 }),
    plat(1200, 480, 140), plat(1430, 560, 120, 'crumble'), plat(1650, 500, 140),
    plat(1900, 560, 120, 'moving', { dx: 0, dy: 120, period: 3.2 }), plat(2150, 460, 160),
    plat(2350, 360, 140),
  ],
  traps: [
    { id: 't-4-1', kind: 'spikes', x: 450, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-4-2', kind: 'spikes', x: 930, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-4-3', kind: 'spikes', x: 1410, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-4-4', kind: 'spikes', x: 1890, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-4-5', kind: 'pendulum', x: 1250, y: 200, w: 40, h: 220, period: 2.8, range: 130, lethal: true },
    { id: 't-4-6', kind: 'falling-rock', x: 2200, y: 80, w: 44, h: 44, period: 2.4, lethal: true },
  ],
  ropes: [{ x: 2420, yTop: 240, yBottom: 640 }],
  secrets: [
    { kind: 'spikes-key', title: 'Ключ над шипами', desc: 'Движущаяся платформа над шипами.', at: { x: 990, y: 490 } },
    { kind: 'moving-platform', title: 'Шипастый перекат', desc: 'Подъёмник над четвёртой пропастью.', at: { x: 1930, y: 420 }, reward: ['silver-key'] },
    { kind: 'timed-jump', title: 'Ритм шипов', desc: 'Прыжок под маятником.', at: { x: 1240, y: 410 } },
    { kind: 'hidden-chest', title: 'Сундук под шипами', desc: 'Сундук в безопасной нише у стены.', at: { x: 2450, y: 620 } },
    { kind: 'rope-climb', title: 'Канат над шипами', desc: 'Верхняя площадка у каната.', at: { x: 2390, y: 290 }, reward: ['inscription-3'] },
    { kind: 'secret-wall', title: 'Шипастая стена', desc: 'Ложная стена в конце зала.', at: { x: 2540, y: 560 } },
  ],
  doors: [
    { id: 'd-4-9', roomId: 4, name: 'Дверь в затопленный зал', requiresItem: 'magic-amulet', leadsTo: 9 },
  ],
  notes: [
    { id: 'note-4', x: 660, y: 620, title: 'Предупреждение', text: '«Шипы пьют кровь неосторожных. Плиты, что шатаются под ногой, не держат долго. Беги, пока камень не осыпался.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});