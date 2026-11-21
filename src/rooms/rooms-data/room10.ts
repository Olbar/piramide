import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room10 = defineRoom({
  id: 10,
  name: 'Комната древних символов',
  subtitle: 'Стены говорят на языке, который нужно вспомнить.',
  width: 2400,
  palette: PALETTES[9],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1200, y: 560 }],
  platforms: [
    floor(0, 650), floor(830, 650), floor(1660, 740),
    plat(300, 540, 160), plat(560, 440, 140), plat(900, 520, 160),
    plat(1150, 420, 160), plat(1450, 520, 120, 'crumble'), plat(1750, 440, 180),
    plat(2050, 340, 160), plat(670, 580, 120, 'moving', { dx: 120, dy: 0, period: 3 }),
  ],
  traps: [
    { id: 't-10-1', kind: 'spikes', x: 650, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-10-2', kind: 'spikes', x: 1480, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-10-3', kind: 'fire', x: 1000, y: 600, w: 40, h: 60, period: 2.2, damage: 1 },
    { id: 't-10-4', kind: 'falling-ceiling', x: 1850, y: 60, w: 200, h: 40, period: 4, lethal: true },
  ],
  ropes: [{ x: 2250, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'hidden-chest', title: 'Сундук писца', desc: 'Сундук с солнечным ключом.', at: { x: 350, y: 500 }, reward: ['sun-key'] },
    { kind: 'symbol-decode', title: 'Послание на стене', desc: 'Расшифруй послание: Солнце → Око → Анкх.', at: { x: 950, y: 620 }, puzzleId: 'p-10-1' },
    { kind: 'timed-jump', title: 'Символ и пламя', desc: 'Прыжок сквозь огненную струю.', at: { x: 1190, y: 350 } },
    { kind: 'moving-platform', title: 'Плита символов', desc: 'Плита над пропастью.', at: { x: 730, y: 510 } },
    { kind: 'artifact-hunt', title: 'Перо писца', desc: 'Артефакт в верхней нише.', at: { x: 2100, y: 300 } },
    { kind: 'secret-wall', title: 'Стена иероглифов', desc: 'Стена, покрытая ложными символами.', at: { x: 2340, y: 560 } },
  ],
  puzzles: [
    {
      id: 'p-10-1', roomId: 10, kind: 'symbol-decode', title: 'Послание на стене',
      steps: ['sun', 'eye', 'ankh'], stepLabels: { sun: 'Солнце', eye: 'Око', ankh: 'Анкх' },
      hints: ['Надпись читается слева направо.', 'Первый символ — Солнце.', 'Активируй символы: Солнце → Око → Анкх.'],
    },
  ],
  doors: [
    { id: 'd-10-16', roomId: 10, name: 'Дверь в зал механизмов', requiresItem: 'artifact-ankh', leadsTo: 16 },
  ],
  notes: [
    { id: 'note-10', x: 860, y: 620, title: 'Послание жрецов', text: '«Солнце рождает Око, Око хранит Анкх, Анкх открывает жизнь. Повтори порядок — и стена ответит.»' },
  ],
  exitZone: { x: 2340, y: 560, w: 60, h: 100 },
});