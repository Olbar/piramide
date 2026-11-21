import type {
  ChestDef, Condition, DoorDef, LeverDef, NoteDef, PlatformDef, PuzzleDef, RoomDef, RoomPalette,
  RopeDef, SecretDef, SecretKind, SecretWallDef, TrapDef, Vec2, ZoneDef,
} from '../../core/types';

export const FLOOR_Y = 660;

export interface SecretSpec {
  kind: SecretKind;
  title: string;
  desc: string;
  at: Vec2;
  reward?: string[];
  opensDoor?: string;
  revealsNote?: string;
  hidden?: boolean;
  discover?: Condition;
  complete?: Condition;
  puzzleId?: string;
  zoneSize?: { w: number; h: number };
}

export interface RoomSpec {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  palette: RoomPalette;
  spawn: Vec2;
  checkpoints?: Vec2[];
  platforms: PlatformDef[];
  traps?: TrapDef[];
  ropes?: RopeDef[];
  secrets: SecretSpec[];
  doors?: DoorDef[];
  notes?: NoteDef[];
  puzzles?: PuzzleDef[];
  exitZone?: { x: number; y: number; w: number; h: number };
}

const HINT_TEMPLATES: Record<SecretKind, [string, string, string]> = {
  'lava-jump': [
    'Не всё, что находится над пропастью, недоступно.',
    'Присмотрись к платформам над лавой — среди них есть безопасный путь.',
    'Перепрыгни по платформам над лавой и забери награду на дальней площадке.',
  ],
  'rope-climb': [
    'Канаты ведут не только вниз.',
    'Рядом с целью есть канат — по нему можно подняться клавишей W.',
    'Запрыгни на канат, поднимись до верха (W) и перепрыгни на площадку с наградой.',
  ],
  'secret-wall': [
    'Не все стены в пирамиде настоящие.',
    'Одна из стен слегка отличается оттенком — подойди к ней вплотную.',
    'Подойди к подозрительной стене и нажми E, чтобы открыть тайный проход.',
  ],
  'lever-sequence': [
    'Древние механизмы любят порядок.',
    'Надпись на стене подсказывает последовательность рычагов.',
    'Активируй рычаги в правильном порядке (E рядом с каждым). Ошибка сбрасывает механизм.',
  ],
  'spikes-key': [
    'Шипы не прощают спешки.',
    'Движущаяся платформа может довезти тебя над шипами.',
    'Дождись платформу, прыгни на неё и в нужный момент перепрыгни к награде над шипами.',
  ],
  'hidden-chest': [
    'Пирамида прячет дары в укромных углах.',
    'Осмотри верхние платформы и ниши — где-то там спрятан сундук.',
    'Доберись до сундука и нажми E рядом с ним.',
  ],
  'symbol-decode': [
    'Древние символы — это слова, а не картинки.',
    'Прочитай надпись в комнате: она задаёт порядок символов.',
    'Активируй символы в порядке, указанном в надписи (E рядом с каждым).',
  ],
  'light-mirror': [
    'Свет укажет путь.',
    'Зеркала нужно повернуть так, чтобы луч дошёл до цели.',
    'Поворачивай зеркала (E) в последовательности, пока луч не достигнет кристалла.',
  ],
  'timed-jump': [
    'Время — твой союзник.',
    'Понаблюдай за ритмом ловушки: между её движениями есть пауза.',
    'Дождись, когда ловушка отойдёт, и прыгни к награде в безопасный момент.',
  ],
  'moving-platform': [
    'Платформы движутся не просто так.',
    'Используй движущуюся платформу как мост через опасность.',
    'Запрыгни на движущуюся платформу, дождись нужной точки и перепрыгни к награде.',
  ],
  'hidden-passage': [
    'Невидимое тоже существует.',
    'Магический амулет заставляет скрытые проходы мерцать.',
    'Найди мерцающий проход (с амулетом он виден) и войди в него.',
  ],
  'artifact-hunt': [
    'Артефакты ждут достойных.',
    'Артефакт спрятан в труднодоступной нише комнаты.',
    'Доберись до артефакта и нажми E рядом с ним.',
  ],
};

export function secretTier(roomId: number, index: number): 1 | 2 | 3 | 4 {
  return (((roomId - 1) * 6 + index) % 4 + 1) as 1 | 2 | 3 | 4;
}

function defaultComplete(spec: SecretSpec, objectId: string): Condition {
  switch (spec.kind) {
    case 'hidden-chest':
    case 'artifact-hunt':
      return { type: 'interact', object: objectId };
    case 'secret-wall':
      return { type: 'interact', object: objectId };
    case 'lever-sequence':
    case 'symbol-decode':
    case 'light-mirror':
      return { type: 'puzzle', puzzle: spec.puzzleId ?? objectId };
    default:
      return { type: 'zone', zone: objectId };
  }
}

export function defineRoom(spec: RoomSpec): { room: RoomDef; puzzles: PuzzleDef[] } {
  const chests: ChestDef[] = [];
  const secretWalls: SecretWallDef[] = [];
  const zones: ZoneDef[] = [];
  const levers: LeverDef[] = [];
  const secrets: SecretDef[] = [];

  spec.secrets.forEach((s, i) => {
    const n = i + 1;
    const id = `s-${spec.id}-${n}`;
    const objectId =
      s.kind === 'hidden-chest' || s.kind === 'artifact-hunt' ? `chest-${spec.id}-${n}`
      : s.kind === 'secret-wall' ? `wall-${spec.id}-${n}`
      : s.kind === 'lever-sequence' || s.kind === 'symbol-decode' || s.kind === 'light-mirror' ? (s.puzzleId ?? `puzzle-${spec.id}-${n}`)
      : `zone-${spec.id}-${n}`;

    if (s.kind === 'hidden-chest' || s.kind === 'artifact-hunt') {
      chests.push({ id: objectId, x: s.at.x, y: s.at.y, secretId: id, hidden: s.hidden, kind: s.kind === 'artifact-hunt' ? 'artifact' as const : 'chest' as const });
    } else if (s.kind === 'secret-wall') {
      secretWalls.push({ id: objectId, x: s.at.x, y: s.at.y, w: 48, h: 96, secretId: id });
    } else if (s.kind === 'lever-sequence' || s.kind === 'symbol-decode' || s.kind === 'light-mirror') {
      const puzzle = spec.puzzles?.find((p) => p.id === objectId);
      if (puzzle) {
        puzzle.steps.forEach((step, li) => {
          levers.push({ id: `${objectId}-${step}`, x: s.at.x + li * 70, y: s.at.y, puzzleId: objectId });
        });
      }
    } else {
      const size = s.zoneSize ?? { w: 70, h: 70 };
      zones.push({ id: objectId, x: s.at.x, y: s.at.y, w: size.w, h: size.h });
    }

    const hints: [string, string, string] = [...HINT_TEMPLATES[s.kind]];
    secrets.push({
      id,
      roomId: spec.id,
      tier: secretTier(spec.id, i),
      kind: s.kind,
      title: s.title,
      description: s.desc,
      discover: s.discover ?? (s.hidden ? { type: 'item', item: 'magic-amulet' } : { type: 'always' }),
      complete: s.complete ?? defaultComplete(s, objectId),
      rewardItems: s.reward,
      opensDoor: s.opensDoor,
      revealsNote: s.revealsNote,
      hints,
    });
  });

  const room: RoomDef = {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle,
    width: spec.width,
    height: 720,
    palette: spec.palette,
    spawn: spec.spawn,
    checkpoints: spec.checkpoints ?? [],
    entryPoints: { default: spec.spawn },
    platforms: spec.platforms,
    traps: spec.traps ?? [],
    ropes: spec.ropes ?? [],
    levers,
    chests,
    secretWalls,
    zones,
    notes: spec.notes ?? [],
    doors: spec.doors ?? [],
    secrets,
    exitZone: spec.exitZone ? { id: `exit-${spec.id}`, ...spec.exitZone } : undefined,
  };
  return { room, puzzles: spec.puzzles ?? [] };
}

export function floor(x: number, w: number): PlatformDef {
  return { x, y: FLOOR_Y, w, h: 60 };
}

export function plat(x: number, y: number, w: number, kind: PlatformDef['kind'] = 'solid', move?: PlatformDef['move']): PlatformDef {
  return { x, y, w, h: 24, kind, move };
}