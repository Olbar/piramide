import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room05 = defineRoom({
  id: 5,
  name: 'Забытый коридор',
  subtitle: 'Стены здесь помнят больше, чем кажется.',
  width: 2600,
  palette: PALETTES[4],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 800), floor(960, 700), floor(1820, 780),
    plat(300, 540, 160), plat(600, 440, 160), plat(1000, 540, 160),
    plat(1300, 440, 160), plat(1600, 540, 120, 'crumble'), plat(1900, 460, 180),
    plat(2200, 360, 160), plat(820, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
  ],
  traps: [
    { id: 't-5-1', kind: 'spikes', x: 800, y: 680, w: 160, h: 40, lethal: true },
    { id: 't-5-2', kind: 'spikes', x: 1660, y: 680, w: 160, h: 40, lethal: true },
    { id: 't-5-3', kind: 'falling-ceiling', x: 1150, y: 60, w: 200, h: 40, period: 4, lethal: true },
    { id: 't-5-4', kind: 'falling-rock', x: 2100, y: 80, w: 44, h: 44, period: 2.8, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 240, yBottom: 640 }],
  secrets: [
    { kind: 'hidden-chest', title: 'Дар забытых жрецов', desc: 'Сундук с магическим амулетом, открывающим скрытые проходы.', at: { x: 350, y: 500 }, reward: ['magic-amulet'] },
    { kind: 'hidden-passage', title: 'Мерцающий проход', desc: 'Проход, видимый только с амулетом.', at: { x: 650, y: 370 }, hidden: true },
    { kind: 'secret-wall', title: 'Стена с трещиной', desc: 'Треснувшая стена скрывает нишу.', at: { x: 1050, y: 560 } },
    { kind: 'hidden-passage', title: 'Тайный лаз', desc: 'Скрытый лаз под потолком.', at: { x: 1350, y: 370 }, hidden: true },
    { kind: 'moving-platform', title: 'Забытая плита', desc: 'Плита, курсирующая над пропастью.', at: { x: 880, y: 510 } },
    { kind: 'artifact-hunt', title: 'Реликвия коридора', desc: 'Артефакт в дальней нише.', at: { x: 2250, y: 320 }, reward: ['artifact-lotus'] },
  ],
  doors: [
    { id: 'd-5-6', roomId: 5, name: 'Дверь в комнату канатов', requiresItem: 'silver-key', leadsTo: 6 },
  ],
  notes: [
    { id: 'note-5', x: 1000, y: 620, title: 'Записка хранителя', text: '«Амулет в этом коридоре показывает то, что скрыто от глаз. Без него половина пирамиды останется невидимой.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});