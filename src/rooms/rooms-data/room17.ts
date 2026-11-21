import { defineRoom, floor, plat } from './build';
import { PALETTES } from './palettes';

export const room17 = defineRoom({
  id: 17,
  name: 'Комната хранителей',
  subtitle: 'Последние хранители пирамиды не спят никогда.',
  width: 2800,
  palette: PALETTES[16],
  spawn: { x: 120, y: 560 },
  checkpoints: [{ x: 1400, y: 560 }],
  platforms: [
    floor(0, 450), floor(630, 300), floor(1110, 300), floor(1590, 300), floor(2070, 730),
    plat(470, 560, 120), plat(700, 480, 120, 'moving', { dx: 140, dy: 0, period: 2.6 }),
    plat(930, 560, 120, 'crumble'), plat(1150, 480, 140), plat(1390, 560, 120, 'moving', { dx: 0, dy: 120, period: 2.8 }),
    plat(1620, 480, 140), plat(1850, 560, 120, 'crumble'), plat(2100, 460, 160),
    plat(2350, 360, 140), plat(2550, 460, 140),
  ],
  traps: [
    { id: 't-17-1', kind: 'lava', x: 450, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-17-2', kind: 'spikes', x: 930, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-17-3', kind: 'lava', x: 1410, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-17-4', kind: 'spikes', x: 1890, y: 680, w: 180, h: 40, lethal: true },
    { id: 't-17-5', kind: 'pendulum', x: 1200, y: 140, w: 40, h: 240, period: 2.2, range: 150, lethal: true },
    { id: 't-17-6', kind: 'fire', x: 1700, y: 600, w: 40, h: 60, period: 1.8, damage: 1 },
    { id: 't-17-7', kind: 'falling-rock', x: 2300, y: 80, w: 44, h: 44, period: 2, lethal: true },
    { id: 't-17-8', kind: 'moving-wall', x: 2500, y: 440, w: 40, h: 220, period: 2.4, range: 150, lethal: true },
  ],
  ropes: [{ x: 2700, yTop: 200, yBottom: 640 }],
  secrets: [
    { kind: 'timed-jump', title: 'Гнев хранителя', desc: 'Прыжок под маятником хранителя.', at: { x: 1190, y: 410 } },
    { kind: 'hidden-chest', title: 'Дар хранителей', desc: 'Сундук с золотым соколом.', at: { x: 2400, y: 320 }, reward: ['artifact-falcon'] },
    { kind: 'moving-platform', title: 'Плита хранителя', desc: 'Плита над лавой.', at: { x: 760, y: 410 } },
    { kind: 'spikes-key', title: 'Ключ над шипами', desc: 'Награда над шипами.', at: { x: 1890, y: 420 } },
    { kind: 'rope-climb', title: 'Канат хранителя', desc: 'Подъём к верхней нише.', at: { x: 2670, y: 240 } },
    { kind: 'secret-wall', title: 'Стена хранителя', desc: 'Ложная стена у выхода.', at: { x: 2740, y: 560 } },
  ],
  doors: [
    { id: 'd-17-18', roomId: 17, name: 'Дверь в зал последнего испытания', requiresItem: 'jackal-key', leadsTo: 18 },
  ],
  notes: [
    { id: 'note-17', x: 660, y: 620, title: 'Клятва хранителей', text: '«Мы охраняем кристалл, даже когда его нет. Пройди дальше — и докажи, что достоин свободы.»' },
  ],
  exitZone: { x: 2740, y: 560, w: 60, h: 100 },
});