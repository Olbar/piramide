import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room16 = defineRoom({
  id: 16,
  name: 'Зал древних механизмов',
  subtitle: 'Шестерни и рычаги, работающие тысячу лет без смазки.',
  width: 2600,
  palette: PALETTES[15],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 600), floor(780, 600), floor(1560, 1040),
    plat(300, 540, 160), plat(620, 460, 120, 'moving', { dx: 140, dy: 0, period: 3 }),
    plat(900, 540, 160), plat(1200, 460, 160), plat(1500, 540, 120, 'crumble'),
    plat(1800, 460, 180), plat(2100, 360, 160), plat(2350, 460, 160),
  ],
  traps: [
    { id: 't-16-1', kind: 'spikes', x: 600, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-16-2', kind: 'spikes', x: 1380, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-16-3', kind: 'moving-wall', x: 1000, y: 440, w: 40, h: 220, period: 3, range: 180, lethal: true },
    { id: 't-16-4', kind: 'fire', x: 1700, y: 600, w: 40, h: 60, period: 2, damage: 1 },
    { id: 't-16-5', kind: 'falling-ceiling', x: 2000, y: 60, w: 200, h: 40, period: 3.4, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'moving-platform', title: 'Шестерня-плита', desc: 'Плита, движимая шестернями.', at: { x: 680, y: 390 } },
    { kind: 'hidden-chest', title: 'Сундук механика', desc: 'Сундук с ключом шакала.', at: { x: 1850, y: 420 }, reward: ['jackal-key'] },
    {
      kind: 'lever-sequence', title: 'Главный механизм', desc: 'Четыре рычага запускают механизм. Порядок: III → I → IV → II.',
      at: { x: 950, y: 620 }, puzzleId: 'p-16-1',
    },
    { kind: 'timed-jump', title: 'Такт шестерён', desc: 'Прыжок в такт механизму.', at: { x: 1240, y: 390 } },
    { kind: 'artifact-hunt', title: 'Шакал-проводник', desc: 'Статуэтка Анубиса в нише.', at: { x: 2150, y: 320 }, reward: ['artifact-jackal'] },
    { kind: 'hidden-chest', title: 'Тайник механика', desc: 'Сундук с фрагментом надписи.', at: { x: 2400, y: 420 }, reward: ['inscription-10'] },
  ],
  puzzles: [
    {
      id: 'p-16-1', roomId: 16, kind: 'lever-sequence', title: 'Главный механизм',
      steps: ['l3', 'l1', 'l4', 'l2'], stepLabels: { l1: 'I', l2: 'II', l3: 'III', l4: 'IV' },
      hints: ['Механизм требует порядка.', 'Схема высечена на корпусе.', 'Потяни рычаги: III → I → IV → II.'],
    },
  ],
  doors: [],
  notes: [
    { id: 'note-16', x: 820, y: 620, title: 'Схема механизма', text: '«Главный механизм запускается рычагами: III → I → IV → II. Он питает двери всего верхнего яруса.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});