import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room15 = defineRoom({
  id: 15,
  name: 'Комната песчаной бури',
  subtitle: 'Песок меняет всё каждую секунду — доверяй только памяти.',
  width: 2800,
  palette: PALETTES[14],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1400, y: 560 }],
  platforms: [
    floor(0, 450), floor(630, 300), floor(1110, 300), floor(1590, 300), floor(2070, 730),
    plat(470, 560, 120, 'crumble'), plat(700, 480, 120), plat(930, 560, 120, 'moving', { dx: 140, dy: 0, period: 2.8 }),
    plat(1150, 480, 140, 'crumble'), plat(1390, 560, 120, 'moving', { dx: 0, dy: 120, period: 3 }),
    plat(1620, 480, 140), plat(1850, 560, 120, 'crumble'), plat(2100, 460, 160),
    plat(2350, 360, 140), plat(2550, 460, 140),
  ],
  traps: [
    { id: 't-15-1', kind: 'spikes', x: 450, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-15-2', kind: 'spikes', x: 930, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-15-3', kind: 'spikes', x: 1410, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-15-4', kind: 'spikes', x: 1890, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-15-5', kind: 'falling-rock', x: 1200, y: 80, w: 44, h: 44, period: 2.2, lethal: true },
    { id: 't-15-6', kind: 'falling-rock', x: 2200, y: 80, w: 44, h: 44, period: 2, lethal: true },
    { id: 't-15-7', kind: 'moving-wall', x: 2400, y: 440, w: 40, h: 220, period: 2.6, range: 150, lethal: true },
  ],
  ropes: [{ x: 2700, yTop: 200, yBottom: 640 }],
  secrets: [
    { kind: 'moving-platform', title: 'Плита в буре', desc: 'Плита, курсирующая сквозь песок.', at: { x: 990, y: 490 } },
    { kind: 'timed-jump', title: 'Сквозь бурю', desc: 'Прыжок под падающими камнями.', at: { x: 1660, y: 410 } },
    { kind: 'hidden-chest', title: 'Сундук в песке', desc: 'Сундук с золотым анкхом.', at: { x: 2400, y: 320 }, reward: ['artifact-ankh'] },
    { kind: 'spikes-key', title: 'Награда в буре', desc: 'Награда над шипами.', at: { x: 1890, y: 420 } },
    { kind: 'rope-climb', title: 'Канат в песке', desc: 'Подъём к верхней нише.', at: { x: 2670, y: 240 }, reward: ['inscription-9'] },
    { kind: 'secret-wall', title: 'Песчаная стена', desc: 'Стена, занесённая песком.', at: { x: 2740, y: 560 } },
  ],
  doors: [
    { id: 'd-15-16', roomId: 15, name: 'Дверь в зал механизмов', requiresItem: 'serpent-key', leadsTo: 16 },
    { id: 'd-15-20', roomId: 15, name: 'Тайный ход к вратам свободы', requiresItem: 'artifact-falcon', leadsTo: 20 },
  ],
  notes: [
    { id: 'note-15', x: 660, y: 620, title: 'Записка в песке', text: '«Буря заметает следы, но не память. Плиты, что тонут в песке, держат лишь мгновение. Беги.»' },
  ],
  exitZone: { x: 2740, y: 560, w: 60, h: 100 },
});