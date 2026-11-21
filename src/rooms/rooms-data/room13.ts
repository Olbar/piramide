import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room13 = defineRoom({
  id: 13,
  name: 'Комната невидимых дверей',
  subtitle: 'Двери, которых нет, открываются тем, кто видит невидимое.',
  width: 2600,
  palette: PALETTES[12],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 700), floor(880, 600), floor(1660, 940),
    plat(300, 540, 160), plat(560, 440, 140), plat(950, 520, 160),
    plat(1200, 420, 160), plat(1500, 520, 120, 'crumble'), plat(1750, 440, 180),
    plat(2050, 340, 160), plat(2350, 440, 160), plat(720, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
  ],
  traps: [
    { id: 't-13-1', kind: 'spikes', x: 700, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-13-2', kind: 'spikes', x: 1480, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-13-3', kind: 'fire', x: 1050, y: 600, w: 40, h: 60, period: 2, damage: 1 },
    { id: 't-13-4', kind: 'falling-rock', x: 1900, y: 80, w: 44, h: 44, period: 2.4, lethal: true },
    { id: 't-13-5', kind: 'pendulum', x: 2250, y: 160, w: 40, h: 200, period: 2.6, range: 120, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'hidden-passage', title: 'Невидимая дверь', desc: 'Проход, видимый только с амулетом.', at: { x: 600, y: 370 }, hidden: true },
    { kind: 'artifact-hunt', title: 'Око хранителя', desc: 'Артефакт, открывающий дверь в комнату хранителей.', at: { x: 1250, y: 380 }, reward: ['artifact-eye'] },
    { kind: 'secret-wall', title: 'Стена-призрак', desc: 'Стена, которой нет.', at: { x: 1000, y: 560 } },
    { kind: 'hidden-passage', title: 'Второй лаз', desc: 'Ещё один скрытый проход.', at: { x: 1800, y: 370 }, hidden: true },
    { kind: 'hidden-chest', title: 'Сундук невидимки', desc: 'Сундук, скрытый от глаз.', at: { x: 2100, y: 300 }, hidden: true, reward: ['inscription-8'] },
    { kind: 'moving-platform', title: 'Призрачная плита', desc: 'Плита над пропастью.', at: { x: 780, y: 510 } },
  ],
  doors: [
    { id: 'd-13-14', roomId: 13, name: 'Дверь в зал маятников', requiresItem: 'moon-key', leadsTo: 14 },
    { id: 'd-13-18', roomId: 13, name: 'Дверь в зал последнего испытания', requiresItem: 'artifact-jackal', leadsTo: 18 },
  ],
  notes: [
    { id: 'note-13', x: 920, y: 620, title: 'Шёпот стен', text: '«Невидимые двери видны лишь амулету. Без него ты пройдёшь мимо десяти тайн и не заметишь их.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});