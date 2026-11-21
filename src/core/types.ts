export type DifficultyId = 'explorer' | 'seeker' | 'archaeologist' | 'pharaoh';

export type SecretTier = 1 | 2 | 3 | 4;

export type ItemCategory = 'key' | 'golden-key' | 'artifact' | 'inscription' | 'magic' | 'crystal';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
}

export type SecretKind =
  | 'lava-jump'
  | 'rope-climb'
  | 'secret-wall'
  | 'lever-sequence'
  | 'spikes-key'
  | 'hidden-chest'
  | 'symbol-decode'
  | 'light-mirror'
  | 'timed-jump'
  | 'moving-platform'
  | 'hidden-passage'
  | 'artifact-hunt';

export type Condition =
  | { type: 'always' }
  | { type: 'item'; item: string }
  | { type: 'zone'; zone: string }
  | { type: 'puzzle'; puzzle: string }
  | { type: 'interact'; object: string }
  | { type: 'secret'; secret: string }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] };

export interface SecretContext {
  items: string[];
  solvedPuzzles: string[];
  reachedZones: string[];
  interacted: string[];
  completedSecrets: string[];
}

export interface SecretDef {
  id: string;
  roomId: number;
  tier: SecretTier;
  kind: SecretKind;
  title: string;
  description: string;
  discover: Condition;
  complete: Condition;
  rewardItems?: string[];
  opensDoor?: string;
  revealsNote?: string;
  hints: [string, string, string];
}

export interface DoorDef {
  id: string;
  roomId: number;
  name: string;
  requiresItem?: string;
  requiresPuzzle?: string;
  requiresSecret?: string;
  leadsTo: number;
}

export interface RoomConnection {
  from: number;
  to: number;
  doorId?: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'solid' | 'crumble' | 'moving';
  move?: { dx: number; dy: number; period: number };
}

export type TrapKind =
  | 'lava'
  | 'spikes'
  | 'falling-rock'
  | 'pendulum'
  | 'fire'
  | 'moving-wall'
  | 'falling-ceiling';

export interface TrapDef {
  id: string;
  kind: TrapKind;
  x: number;
  y: number;
  w: number;
  h: number;
  period?: number;
  phase?: number;
  range?: number;
  damage?: number;
  lethal?: boolean;
}

export interface RopeDef {
  x: number;
  yTop: number;
  yBottom: number;
}

export interface LeverDef {
  id: string;
  x: number;
  y: number;
  puzzleId: string;
}

export interface ChestDef {
  id: string;
  x: number;
  y: number;
  secretId: string;
  hidden?: boolean;
  kind?: 'chest' | 'artifact';
}

export interface SecretWallDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  secretId: string;
}

export interface ZoneDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NoteDef {
  id: string;
  x: number;
  y: number;
  title: string;
  text: string;
}

export interface RoomPalette {
  bg: string;
  bgFar: string;
  wall: string;
  wallDark: string;
  platform: string;
  platformTop: string;
  accent: string;
  glow: string;
}

export interface RoomDef {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  palette: RoomPalette;
  spawn: Vec2;
  checkpoints: Vec2[];
  entryPoints: Record<string, Vec2>;
  platforms: PlatformDef[];
  traps: TrapDef[];
  ropes: RopeDef[];
  levers: LeverDef[];
  chests: ChestDef[];
  secretWalls: SecretWallDef[];
  zones: ZoneDef[];
  notes: NoteDef[];
  doors: DoorDef[];
  secrets: SecretDef[];
  exitZone?: ZoneDef;
}

export type PuzzleKind = 'lever-sequence' | 'symbol-decode' | 'light-mirror';

export interface PuzzleDef {
  id: string;
  roomId: number;
  kind: PuzzleKind;
  title: string;
  steps: string[];
  stepLabels?: Record<string, string>;
  hints: [string, string, string];
}

export interface HintRecord {
  contextId: string;
  stage: number;
  text: string;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
}

export interface GameState {
  version: number;
  difficulty: DifficultyId;
  currentRoom: number;
  checkpoint: Vec2;
  visitedRooms: number[];
  completedRooms: number[];
  discoveredSecrets: string[];
  completedSecrets: string[];
  items: string[];
  openedDoors: string[];
  solvedPuzzles: string[];
  hintsUsed: number;
  hintJournal: HintRecord[];
  notesFound: string[];
  elapsedMs: number;
  deaths: number;
  achievements: string[];
  settings: GameSettings;
  finished: boolean;
}

export interface StorageAdapter {
  load(): Promise<string | null>;
  save(data: string): Promise<void>;
  clear(): Promise<void>;
}