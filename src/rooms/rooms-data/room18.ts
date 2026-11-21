import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room18 = defineRoom({
  id: 18,
  name: 'Зал последнего испытания',
  subtitle: 'Все ловушки пирамиды собраны здесь воедино.',
  width: 3000,
  palette: PALETTES[17],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1500, y: 560 }],
  platforms: [
    floor(0, 450), floor(630, 280), floor(1090, 280), floor(1550, 280), floor(2010, 280), floor(2470, 530),
    plat(470, 560, 120, 'moving', { dx: 140, dy: 0, period: 2.6 }), plat(700, 480, 120),
    plat(930, 560, 120, 'crumble'), plat(1150, 480, 140), plat(1390, 560, 120, 'moving', { dx: 0, dy: 120, period: 2.8 }),
    plat(1620, 480, 140), plat(1850, 560, 120, 'crumble'), plat(2100, 460, 160),
    plat(2350, 560, 120, 'moving', { dx: 120, dy: 0, period: 2.4 }), plat(2550, 440, 160),
    plat(2750, 340, 160),
  ],
  traps: [
    { id: 't-18-1', kind: 'lava', x: 450, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-18-2', kind: 'spikes', x: 910, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-18-3', kind: 'lava', x: 1370, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-18-4', kind: 'spikes', x: 1830, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-18-5', kind: 'lava', x: 2290, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-18-6', kind: 'pendulum', x: 1200, y: 140, w: 40, h: 240, period: 2, range: 150, lethal: true },
    { id: 't-18-7', kind: 'pendulum', x: 2100, y: 140, w: 40, h: 240, period: 1.8, range: 160, lethal: true },
    { id: 't-18-8', kind: 'fire', x: 1700, y: 600, w: 40, h: 60, period: 1.6, damage: 1 },
    { id: 't-18-9', kind: 'falling-rock', x: 2600, y: 80, w: 44, h: 44, period: 1.9, lethal: true },
  ],
  ropes: [{ x: 2900, yTop: 180, yBottom: 640 }],
  secrets: [
    { kind: 'moving-platform', title: 'Первое испытание', desc: 'Плита над лавой.', at: { x: 530, y: 490 }, reward: ['pharaoh-key'] },
    { kind: 'timed-jump', title: 'Второе испытание', desc: 'Прыжок под маятником.', at: { x: 1190, y: 410 } },
    { kind: 'spikes-key', title: 'Третье испытание', desc: 'Награда над шипами.', at: { x: 1890, y: 420 } },
    { kind: 'lava-jump', title: 'Четвёртое испытание', desc: 'Платформы над лавой.', at: { x: 2410, y: 490 } },
    { kind: 'rope-climb', title: 'Пятое испытание', desc: 'Подъём к верхней нише.', at: { x: 2870, y: 220 }, reward: ['inscription-11'] },
    { kind: 'hidden-chest', title: 'Дар испытания', desc: 'Сундук в конце зала.', at: { x: 2800, y: 300 } },
  ],
  doors: [],
  notes: [
    { id: 'note-18', x: 660, y: 620, title: 'Последнее напутствие', text: '«Дальше — только выход. Вставь кристалл в механизм врат, и пирамида отпустит тебя. Но уйдёшь ли ты с пустыми руками?»' },
  ],
  exitZone: { x: 2940, y: 560, w: 60, h: 100 },
});