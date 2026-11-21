import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room01 = defineRoom({
  id: 1,
  name: 'Сердце пирамиды',
  subtitle: 'Здесь был найден кристалл. Двери запечатались.',
  width: 2000,
  palette: PALETTES[0],
  spawn: { x: 1000, y: 560 },
  checkpoints: [{ x: 1000, y: 560 }],
  platforms: [
    floor(0, 700), floor(840, 1160),
    plat(250, 550, 160), plat(520, 450, 160), plat(730, 560, 80),
    plat(900, 550, 180), plat(1250, 450, 160), plat(1550, 550, 180),
    plat(1500, 380, 120, 'moving', { dx: 180, dy: 0, period: 4 }),
  ],
  traps: [
    { id: 't-1-1', kind: 'spikes', x: 700, y: 680, w: 140, h: 40, lethal: true },
    { id: 't-1-2', kind: 'pendulum', x: 770, y: 240, w: 40, h: 200, period: 3, range: 120, lethal: true },
  ],
  ropes: [{ x: 1850, yTop: 260, yBottom: 640 }],
  secrets: [
    { kind: 'hidden-chest', title: 'Тайник у подножия', desc: 'Сундук, спрятанный жрецами у подножия колонны.', at: { x: 300, y: 510 }, reward: ['artifact-scarab'] },
    { kind: 'artifact-hunt', title: 'Око в нише', desc: 'Древнее око, наблюдающее за сердцем пирамиды.', at: { x: 1300, y: 410 }, reward: ['sand-compass'] },
    { kind: 'secret-wall', title: 'Трещина в стене', desc: 'За треснувшей стеной скрыт тайный проход.', at: { x: 60, y: 560 }, revealsNote: 'note-1' },
    { kind: 'timed-jump', title: 'Маятник сердца', desc: 'Платформа под маятником хранит награду.', at: { x: 735, y: 490 } },
    { kind: 'moving-platform', title: 'Парящая плита', desc: 'Движущаяся плита поднимает к верхней нише.', at: { x: 1700, y: 300 }, reward: ['flame-ward'] },
    { kind: 'hidden-chest', title: 'Дар хранителя', desc: 'Сундук, видимый только владельцу магического амулета.', at: { x: 570, y: 410 }, hidden: true, reward: ['inscription-1'] },
  ],
  doors: [
    { id: 'd-1-5', roomId: 1, name: 'Тайная дверь в забытый коридор', requiresItem: 'golden-key', leadsTo: 5 },
  ],
  notes: [
    { id: 'note-1', x: 1050, y: 620, title: 'Записка исследователя', text: '«Кристалл пульсирует, как живое сердце. Как только я коснулся его, двери запечатались. Древняя защита проснулась…»' },
  ],
  exitZone: { x: 1940, y: 560, w: 60, h: 100 },
});