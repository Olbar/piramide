import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room09 = defineRoom({
  id: 9,
  name: 'Затопленный зал',
  subtitle: 'Вода скрывает платформы и хранит утопленные тайны.',
  width: 2600,
  palette: PALETTES[8],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 450), floor(630, 280), floor(1090, 280), floor(1550, 280), floor(2010, 590),
    plat(470, 560, 120), plat(700, 480, 120), plat(930, 560, 120, 'moving', { dx: 140, dy: 0, period: 3 }),
    plat(1150, 480, 140), plat(1390, 560, 120, 'crumble'), plat(1620, 480, 140),
    plat(1850, 560, 120, 'moving', { dx: 0, dy: 120, period: 3.2 }), plat(2100, 460, 160),
    plat(2350, 360, 140),
  ],
  traps: [
    { id: 't-9-1', kind: 'lava', x: 450, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-9-2', kind: 'lava', x: 910, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-9-3', kind: 'lava', x: 1370, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-9-4', kind: 'lava', x: 1830, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-9-5', kind: 'falling-rock', x: 1200, y: 80, w: 44, h: 44, period: 2.5, lethal: true },
    { id: 't-9-6', kind: 'pendulum', x: 2200, y: 160, w: 40, h: 200, period: 2.8, range: 120, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'moving-platform', title: 'Плита над водой', desc: 'Курсирующая плита над затопленной пропастью.', at: { x: 990, y: 490 } },
    { kind: 'lava-jump', title: 'Утопленный ключ', desc: 'Платформы над водой ведут к ключу.', at: { x: 1180, y: 410 }, reward: ['golden-key-3'] },
    { kind: 'timed-jump', title: 'Капли и камни', desc: 'Прыжок под падающими камнями.', at: { x: 1660, y: 410 } },
    { kind: 'spikes-key', title: 'Награда на глубине', desc: 'Награда над последней пропастью.', at: { x: 1890, y: 420 } },
    { kind: 'hidden-chest', title: 'Сундук со дна', desc: 'Сундук, поднятый со дна зала.', at: { x: 2400, y: 320 }, reward: ['inscription-6'] },
    { kind: 'rope-climb', title: 'Канат у стены', desc: 'Подъём к верхней нише.', at: { x: 2420, y: 260 } },
  ],
  doors: [
    { id: 'd-9-10', roomId: 9, name: 'Дверь в комнату символов', requiresItem: 'ankh-key', leadsTo: 10 },
    { id: 'd-9-14', roomId: 9, name: 'Дверь в зал маятников', requiresItem: 'ancient-symbol', leadsTo: 14 },
  ],
  notes: [
    { id: 'note-9', x: 660, y: 620, title: 'Мокрая записка', text: '«Вода поднялась, когда кристалл покинул постамент. Плиты, что уходят под воду, всё ещё держат — но недолго.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});