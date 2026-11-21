import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room06 = defineRoom({
  id: 6,
  name: 'Комната канатов',
  subtitle: 'Верёвки, сплетённые из пальмовых волокон, ведут к небу.',
  width: 2200,
  palette: PALETTES[5],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1100, y: 560 }],
  platforms: [
    floor(0, 500), floor(680, 500), floor(1360, 840),
    plat(250, 540, 140), plat(520, 440, 120), plat(750, 520, 140),
    plat(950, 400, 140), plat(1200, 300, 140), plat(1450, 480, 160),
    plat(1700, 380, 160), plat(1950, 280, 160),
  ],
  traps: [
    { id: 't-6-1', kind: 'spikes', x: 500, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-6-2', kind: 'spikes', x: 1180, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-6-3', kind: 'pendulum', x: 900, y: 160, w: 40, h: 200, period: 3, range: 120, lethal: true },
    { id: 't-6-4', kind: 'falling-rock', x: 1600, y: 60, w: 44, h: 44, period: 2.6, lethal: true },
  ],
  ropes: [
    { x: 560, yTop: 220, yBottom: 640 },
    { x: 1000, yTop: 180, yBottom: 640 },
    { x: 1500, yTop: 200, yBottom: 640 },
    { x: 2000, yTop: 160, yBottom: 640 },
  ],
  secrets: [
    { kind: 'rope-climb', title: 'Первый канат', desc: 'Подъём по канату к верхней площадке.', at: { x: 530, y: 370 }, reward: ['scarab-key'] },
    { kind: 'rope-climb', title: 'Канат под маятником', desc: 'Подъём в паузе между ударами маятника.', at: { x: 970, y: 330 } },
    { kind: 'timed-jump', title: 'Высота и время', desc: 'Прыжок между верхними площадками.', at: { x: 1240, y: 230 } },
    { kind: 'hidden-chest', title: 'Сундук на высоте', desc: 'Сундук на верхней площадке.', at: { x: 1750, y: 340 }, reward: ['inscription-4'] },
    { kind: 'rope-climb', title: 'Последний канат', desc: 'Самый высокий канат комнаты.', at: { x: 1970, y: 210 } },
    { kind: 'spikes-key', title: 'Над шипами', desc: 'Награда над шипастой пропастью.', at: { x: 1230, y: 560 } },
  ],
  doors: [
    { id: 'd-6-11', roomId: 6, name: 'Дверь в лабиринт колонн', requiresItem: 'golden-key-3', leadsTo: 11 },
  ],
  notes: [
    { id: 'note-6', x: 720, y: 620, title: 'Совет канатчика', text: '«На канате ты в безопасности, пока держишься. W — вверх, S — вниз. Прыгай с каната в момент, когда маятник уходит в сторону.»' },
  ],
  exitZone: { x: 2140, y: 560, w: 60, h: 100 },
});