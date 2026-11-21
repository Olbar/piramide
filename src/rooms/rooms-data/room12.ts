import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room12 = defineRoom({
  id: 12,
  name: 'Зал движущихся стен',
  subtitle: 'Стены сжимаются и расступаются по воле механизма.',
  width: 2600,
  palette: PALETTES[11],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 600), floor(780, 600), floor(1560, 1040),
    plat(300, 540, 160), plat(620, 460, 120, 'moving', { dx: 140, dy: 0, period: 3 }),
    plat(900, 540, 160), plat(1200, 460, 160), plat(1500, 540, 120, 'crumble'),
    plat(1800, 460, 180), plat(2100, 360, 160), plat(2350, 460, 160),
  ],
  traps: [
    { id: 't-12-1', kind: 'spikes', x: 600, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-12-2', kind: 'spikes', x: 1380, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-12-3', kind: 'moving-wall', x: 950, y: 440, w: 40, h: 220, period: 3, range: 180, lethal: true },
    { id: 't-12-4', kind: 'moving-wall', x: 1700, y: 440, w: 40, h: 220, period: 2.6, range: 160, lethal: true },
    { id: 't-12-5', kind: 'moving-wall', x: 2200, y: 440, w: 40, h: 220, period: 2.2, range: 140, lethal: true },
    { id: 't-12-6', kind: 'falling-ceiling', x: 400, y: 60, w: 200, h: 40, period: 3.6, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Между стенами', desc: 'Прыжок в такт движущимся стенам.', at: { x: 1240, y: 390 } },
    { kind: 'hidden-chest', title: 'Сундук под стеной', desc: 'Сундук с лунным ключом.', at: { x: 2150, y: 320 }, reward: ['moon-key'] },
    { kind: 'moving-platform', title: 'Плита в тисках', desc: 'Плита над пропастью.', at: { x: 680, y: 390 } },
    {
      kind: 'lever-sequence', title: 'Механизм стен', desc: 'Четыре рычага управляют стенами. Порядок: I → IV → II → III.',
      at: { x: 1850, y: 620 }, puzzleId: 'p-12-1',
    },
    { kind: 'spikes-key', title: 'Награда в тисках', desc: 'Награда над шипами.', at: { x: 1430, y: 560 } },
    { kind: 'secret-wall', title: 'Движущаяся стена-обманка', desc: 'Стена, которая не движется, — фальшивая.', at: { x: 2540, y: 560 } },
  ],
  puzzles: [
    {
      id: 'p-12-1', roomId: 12, kind: 'lever-sequence', title: 'Механизм стен',
      steps: ['l1', 'l4', 'l2', 'l3'], stepLabels: { l1: 'I', l2: 'II', l3: 'III', l4: 'IV' },
      hints: ['Стены подчиняются рычагам.', 'Порядок высечен у механизма.', 'Потяни рычаги: I → IV → II → III.'],
    },
  ],
  doors: [
    { id: 'd-12-17', roomId: 12, name: 'Дверь в комнату хранителей', requiresItem: 'artifact-eye', leadsTo: 17 },
  ],
  notes: [
    { id: 'note-12', x: 820, y: 620, title: 'Инструкция механизма', text: '«Стены слушаются рычагов: I → IV → II → III. Ошибёшься — и стены сожмутся вновь.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});