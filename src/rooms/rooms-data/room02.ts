import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room02 = defineRoom({
  id: 2,
  name: 'Зал песочных часов',
  subtitle: 'Время здесь течёт по воле древних механизмов.',
  width: 2400,
  palette: PALETTES[1],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1200, y: 560 }],
  platforms: [
    floor(0, 600), floor(760, 700), floor(1620, 780),
    plat(350, 550, 160), plat(620, 480, 120), plat(950, 540, 160),
    plat(1250, 460, 160), plat(1550, 540, 120), plat(1850, 450, 180),
    plat(2050, 350, 140, 'moving', { dx: 0, dy: 140, period: 3.5 }),
    plat(680, 600, 80, 'crumble'),
  ],
  traps: [
    { id: 't-2-1', kind: 'spikes', x: 600, y: 680, w: 160, h: 40, lethal: true },
    { id: 't-2-2', kind: 'spikes', x: 1460, y: 680, w: 160, h: 40, lethal: true },
    { id: 't-2-3', kind: 'falling-rock', x: 1050, y: 100, w: 44, h: 44, period: 3, lethal: true },
    { id: 't-2-4', kind: 'moving-wall', x: 1750, y: 460, w: 40, h: 200, period: 4, range: 160, lethal: true },
  ],
  ropes: [{ x: 2280, yTop: 240, yBottom: 640 }],
  secrets: [
    { kind: 'hidden-chest', title: 'Сундук песочных часов', desc: 'Сундук, спрятанный под песочными часами.', at: { x: 400, y: 510 }, reward: ['bronze-key'] },
    { kind: 'timed-jump', title: 'Песчаный маятник', desc: 'Награда за прыжок сквозь песчаный поток.', at: { x: 990, y: 470 } },
    {
      kind: 'lever-sequence', title: 'Рычаги времени', desc: 'Три рычага управляют песком. Порядок высечен на стене: II → III → I.',
      at: { x: 1300, y: 620 }, puzzleId: 'p-2-1', reward: ['artifact-ankh'],
    },
    { kind: 'hidden-chest', title: 'Тайная ниша', desc: 'Ниша в стене хранит фрагмент древней надписи.', at: { x: 1900, y: 410 }, reward: ['inscription-2'] },
    { kind: 'moving-platform', title: 'Плита над пропастью', desc: 'Подъёмник доставляет к верхней площадке.', at: { x: 2090, y: 280 } },
    { kind: 'secret-wall', title: 'Стена-обманка', desc: 'Ложная стена скрывает проход в зал стражей.', at: { x: 2340, y: 560 }, opensDoor: 'd-2-7' },
  ],
  puzzles: [
    {
      id: 'p-2-1', roomId: 2, kind: 'lever-sequence', title: 'Рычаги времени',
      steps: ['l2', 'l3', 'l1'], stepLabels: { l1: 'I', l2: 'II', l3: 'III' },
      hints: ['Порядок высечен на стене.', 'Надпись гласит: II → III → I.', 'Потяни рычаги в порядке: II, III, I.'],
    },
  ],
  doors: [
    { id: 'd-2-7', roomId: 2, name: 'Скрытый проход в зал стражей', requiresSecret: 's-2-6', leadsTo: 7 },
  ],
  notes: [
    { id: 'note-2', x: 820, y: 620, title: 'Надпись на стене', text: '«Время — песок в руках богов. Кто повернёт рычаги в верном порядке, тот остановит поток.» Порядок: II → III → I.' },
  ],
  exitZone: { x: 2340, y: 560, w: 60, h: 100 },
});