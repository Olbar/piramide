import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room07 = defineRoom({
  id: 7,
  name: 'Зал стражей',
  subtitle: 'Каменные стражи движутся по вечному маршруту.',
  width: 2600,
  palette: PALETTES[6],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1300, y: 560 }],
  platforms: [
    floor(0, 600), floor(780, 600), floor(1560, 1040),
    plat(300, 540, 160), plat(620, 460, 120, 'moving', { dx: 140, dy: 0, period: 3 }),
    plat(900, 540, 160), plat(1200, 460, 160), plat(1500, 540, 120, 'crumble'),
    plat(1800, 460, 180), plat(2100, 360, 160), plat(2350, 460, 160),
  ],
  traps: [
    { id: 't-7-1', kind: 'spikes', x: 600, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-7-2', kind: 'spikes', x: 1380, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-7-3', kind: 'moving-wall', x: 1000, y: 440, w: 40, h: 220, period: 3.5, range: 180, lethal: true },
    { id: 't-7-4', kind: 'moving-wall', x: 1900, y: 440, w: 40, h: 220, period: 3, range: 160, lethal: true },
    { id: 't-7-5', kind: 'pendulum', x: 2200, y: 140, w: 40, h: 200, period: 2.6, range: 130, lethal: true },
    { id: 't-7-6', kind: 'falling-rock', x: 450, y: 80, w: 44, h: 44, period: 2.4, lethal: true },
  ],
  ropes: [{ x: 2450, yTop: 220, yBottom: 640 }],
  secrets: [
    { kind: 'moving-platform', title: 'Страж на патруле', desc: 'Платформа-страж курсирует над пропастью.', at: { x: 680, y: 390 } },
    { kind: 'timed-jump', title: 'Между стенами', desc: 'Прыжок в паузе между движущимися стенами.', at: { x: 1240, y: 390 } },
    { kind: 'hidden-chest', title: 'Сундук стражей', desc: 'Сундук, охраняемый маятником.', at: { x: 2150, y: 320 }, reward: ['golden-key-2'] },
    { kind: 'spikes-key', title: 'Дар над шипами', desc: 'Награда над шипастой пропастью.', at: { x: 1430, y: 560 } },
    { kind: 'secret-wall', title: 'Стена стража', desc: 'Ложная стена в конце зала.', at: { x: 2540, y: 560 } },
    { kind: 'rope-climb', title: 'Канат у выхода', desc: 'Подъём к верхней нише.', at: { x: 2420, y: 260 } },
  ],
  doors: [
    { id: 'd-7-8', roomId: 7, name: 'Дверь в зеркальную комнату', requiresItem: 'scarab-key', leadsTo: 8 },
  ],
  notes: [
    { id: 'note-7', x: 820, y: 620, title: 'Указание стража', text: '«Золотой ключ луны хранится в зале стражей, под маятником. Он откроет дверь из комнаты огня в зеркальный зал.»' },
  ],
  exitZone: { x: 2540, y: 560, w: 60, h: 100 },
});