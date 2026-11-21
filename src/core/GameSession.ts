import type {
  DifficultyId, GameSettings, GameState, PuzzleDef, RoomConnection, RoomDef,
  SecretContext, StorageAdapter, Vec2,
} from './types';
import { getDifficulty } from './GameConfig';
import { EventManager } from './EventManager';
import { GameProgress } from './GameProgress';
import { RoomGraph } from '../rooms/RoomGraph';
import { RoomManager } from '../rooms/RoomManager';
import { DoorManager } from '../doors/DoorManager';
import { SecretManager } from '../secrets/SecretManager';
import { PuzzleManager, type AttemptResult } from '../puzzles/PuzzleManager';
import { InventoryManager } from '../inventory/InventoryManager';
import { ITEMS } from '../inventory/items';
import { HintManager, type HintResult } from '../hints/HintManager';
import { SaveManager } from '../save/SaveManager';
import { AchievementsManager } from '../achievements/AchievementsManager';
import { selectEnding, type EndingType } from '../achievements/EndingSelector';
import { HINTS_PER_RUN } from './GameConfig';

export interface GameData {
  rooms: RoomDef[];
  puzzles: PuzzleDef[];
  connections: RoomConnection[];
}

const TOTAL_INSCRIPTIONS = 12;

export class GameSession {
  readonly events = new EventManager();
  readonly saveManager: SaveManager;

  private roomMgr!: RoomManager;
  private doorMgr!: DoorManager;
  private secretMgr!: SecretManager;
  private puzzleMgr!: PuzzleManager;
  private inventoryMgr!: InventoryManager;
  private hintMgr!: HintManager;
  private achievementMgr!: AchievementsManager;
  private progress!: GameProgress;

  private difficulty: DifficultyId = 'explorer';
  private started = false;
  private finished = false;
  private pos: Vec2 = { x: 100, y: 500 };
  private checkpointPos: Vec2 = { x: 100, y: 500 };
  private elapsed = 0;
  private deathCount = 0;
  private notes: string[] = [];
  private zonesReached = new Set<string>();
  private interactedObjects = new Set<string>();
  private settings: GameSettings = { musicVolume: 0.6, sfxVolume: 0.8 };
  private pendingSave: Promise<boolean> | null = null;

  private readonly roomById = new Map<number, RoomDef>();

  constructor(
    private readonly data: GameData,
    storage: StorageAdapter,
  ) {
    this.saveManager = new SaveManager(storage);
    for (const room of data.rooms) this.roomById.set(room.id, room);
    this.buildManagers();
  }

  private buildManagers(): void {
    const doors = this.data.rooms.flatMap((r) => r.doors);
    const secrets = this.data.rooms.flatMap((r) => r.secrets);
    const entries: Record<number, Record<string, Vec2>> = {};
    for (const room of this.data.rooms) entries[room.id] = room.entryPoints;
    this.doorMgr = new DoorManager(doors);
    this.roomMgr = new RoomManager(new RoomGraph(this.data.connections), this.doorMgr, 1, entries);
    this.secretMgr = new SecretManager(secrets);
    this.puzzleMgr = new PuzzleManager(this.data.puzzles);
    this.inventoryMgr = new InventoryManager();
    this.hintMgr = new HintManager(HINTS_PER_RUN);
    this.achievementMgr = new AchievementsManager();
    this.progress = new GameProgress(this.data.rooms.length, getDifficulty(this.difficulty).requiredSecrets);
  }

  get rooms(): RoomManager {
    return this.roomMgr;
  }
  get doors(): DoorManager {
    return this.doorMgr;
  }
  get secrets(): SecretManager {
    return this.secretMgr;
  }
  get puzzles(): PuzzleManager {
    return this.puzzleMgr;
  }
  get inventory(): InventoryManager {
    return this.inventoryMgr;
  }
  get hints(): HintManager {
    return this.hintMgr;
  }
  get achievements(): AchievementsManager {
    return this.achievementMgr;
  }
  get position(): Vec2 {
    return { ...this.pos };
  }
  get currentRoom(): number {
    return this.roomMgr.currentRoom;
  }
  get currentRoomDef(): RoomDef {
    return this.roomById.get(this.currentRoom)!;
  }
  get roomDef(): (id: number) => RoomDef | undefined {
    return (id) => this.roomById.get(id);
  }
  get gameProgress(): GameProgress {
    return this.progress;
  }
  get isStarted(): boolean {
    return this.started;
  }
  get isFinished(): boolean {
    return this.finished;
  }

  newGame(difficulty: DifficultyId): void {
    this.difficulty = difficulty;
    this.buildManagers();
    this.started = true;
    this.finished = false;
    this.elapsed = 0;
    this.deathCount = 0;
    this.notes = [];
    this.zonesReached.clear();
    this.interactedObjects.clear();
    this.settings = { musicVolume: 0.6, sfxVolume: 0.8 };
    this.inventoryMgr.addItem('main-crystal');
    this.roomMgr.enterRoom(1);
    const spawn = this.roomById.get(1)?.spawn ?? { x: 100, y: 500 };
    this.pos = { ...spawn };
    this.checkpointPos = { ...spawn };
    this.events.emit('game-started', difficulty);
    this.scheduleSave();
  }

  async load(): Promise<boolean> {
    const state = await this.saveManager.load();
    if (!state) return false;
    this.applyState(state);
    this.started = true;
    this.events.emit('game-loaded', state);
    return true;
  }

  async save(): Promise<boolean> {
    if (!this.started) return false;
    return this.saveManager.save(this.state);
  }

  async flush(): Promise<void> {
    await this.pendingSave;
    await this.save();
  }

  private scheduleSave(): void {
    if (!this.started) return;
    this.pendingSave = this.save();
  }

  get state(): GameState {
    const secretState = this.secretMgr.serialize();
    return {
      version: 1,
      difficulty: this.difficulty,
      currentRoom: this.currentRoom,
      checkpoint: { ...this.checkpointPos },
      visitedRooms: this.roomMgr.visitedRooms,
      completedRooms: this.roomMgr.completedRooms,
      discoveredSecrets: secretState.discovered,
      completedSecrets: secretState.completed,
      items: this.inventoryMgr.serialize(),
      openedDoors: this.doorMgr.serialize(),
      solvedPuzzles: this.puzzleMgr.serialize(),
      hintsUsed: this.hintMgr.usedCount,
      hintJournal: this.hintMgr.journal,
      notesFound: [...this.notes],
      elapsedMs: this.elapsed,
      deaths: this.deathCount,
      achievements: this.achievementMgr.serialize(),
      settings: { ...this.settings },
      finished: this.finished,
    };
  }

  private applyState(state: GameState): void {
    this.difficulty = state.difficulty;
    this.buildManagers();
    this.roomMgr.restore({
      currentRoom: state.currentRoom,
      visited: state.visitedRooms,
      completed: state.completedRooms,
    });
    this.doorMgr.restore(state.openedDoors);
    this.secretMgr.restore({ discovered: state.discoveredSecrets, completed: state.completedSecrets });
    this.puzzleMgr.restore(state.solvedPuzzles);
    this.inventoryMgr.restore(state.items);
    this.hintMgr.restore(state.hintsUsed, state.hintJournal);
    this.achievementMgr.restore(state.achievements);
    for (const id of state.completedSecrets) this.progress.completeSecret(id);
    for (const id of state.completedRooms) this.progress.completeRoom(id);
    this.notes = [...state.notesFound];
    this.elapsed = state.elapsedMs;
    this.deathCount = state.deaths;
    this.checkpointPos = { ...state.checkpoint };
    this.pos = { ...state.checkpoint };
    this.settings = { ...state.settings };
    this.finished = state.finished;
  }

  private context(): SecretContext {
    return {
      items: this.inventoryMgr.items,
      solvedPuzzles: this.puzzleMgr.solvedPuzzles,
      reachedZones: [...this.zonesReached],
      interacted: [...this.interactedObjects],
      completedSecrets: this.secretMgr.serialize().completed,
    };
  }

  enterRoom(id: number): boolean {
    const from = this.currentRoom;
    const ok = this.roomMgr.enterRoom(id);
    if (!ok) return false;
    const def = this.roomById.get(id);
    const entry = this.roomMgr.entryPointFor(id, from) ?? def?.spawn ?? { x: 100, y: 500 };
    this.pos = { ...entry };
    this.checkpointPos = { ...entry };
    this.hintMgr.onRoomChange();
    this.events.emit('room-entered', { id, from });
    this.scheduleSave();
    return true;
  }

  reachZone(zoneId: string): void {
    this.zonesReached.add(zoneId);
  }

  interact(objectId: string): void {
    this.interactedObjects.add(objectId);
    this.events.emit('interacted', objectId);
  }

  discoverSecret(id: string): boolean {
    const ok = this.secretMgr.discover(id, this.context());
    if (ok) {
      this.events.emit('secret-discovered', id);
      this.scheduleSave();
    }
    return ok;
  }

  completeSecret(id: string): boolean {
    const ok = this.secretMgr.complete(id, this.context());
    if (!ok) return false;
    const def = this.secretMgr.get(id)!;
    for (const item of def.rewardItems ?? []) this.inventoryMgr.addItem(item);
    if (def.opensDoor) this.doorMgr.openDoor(def.opensDoor);
    if (def.revealsNote && !this.notes.includes(def.revealsNote)) this.notes.push(def.revealsNote);
    this.progress.completeSecret(id);
    this.evaluateAchievements();
    this.events.emit('secret-completed', def);
    this.scheduleSave();
    return true;
  }

  attemptPuzzle(id: string, step: string): AttemptResult {
    const result = this.puzzleMgr.attempt(id, step);
    if (result === 'solved') {
      this.events.emit('puzzle-solved', id);
      this.evaluateAchievements();
      this.scheduleSave();
    }
    return result;
  }

  tryOpenDoor(id: string): boolean {
    const ok = this.doorMgr.tryOpen(id, {
      items: this.inventoryMgr.items,
      solvedPuzzles: this.puzzleMgr.solvedPuzzles,
      completedSecrets: this.secretMgr.serialize().completed,
    });
    if (ok) {
      this.events.emit('door-opened', id);
      this.scheduleSave();
    }
    return ok;
  }

  requestHint(contextId: string, texts: [string, string, string]): HintResult {
    const result = this.hintMgr.requestHint(contextId, texts);
    if (result.ok) {
      this.events.emit('hint-used', result);
      this.scheduleSave();
    }
    return result;
  }

  collectNote(noteId: string): boolean {
    if (this.notes.includes(noteId)) return false;
    this.notes.push(noteId);
    this.events.emit('note-found', noteId);
    this.scheduleSave();
    return true;
  }

  setCheckpoint(pos: Vec2): void {
    this.checkpointPos = { ...pos };
  }

  die(): void {
    if (!this.started) return;
    this.deathCount += 1;
    this.pos = { ...this.checkpointPos };
    this.events.emit('player-died', this.deathCount);
    this.scheduleSave();
  }

  completeRoom(id: number): void {
    this.roomMgr.markRoomCompleted(id);
    this.progress.completeRoom(id);
    this.evaluateAchievements();
    this.events.emit('room-completed', id);
    this.scheduleSave();
  }

  tick(ms: number): void {
    if (this.started && !this.finished) this.elapsed += ms;
  }

  updateSettings(patch: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...patch };
    this.scheduleSave();
  }

  get gameSettings(): GameSettings {
    return { ...this.settings };
  }

  private inscriptionCount(): number {
    return this.inventoryMgr.items.filter((id) => ITEMS[id]?.category === 'inscription').length;
  }

  private evaluateAchievements(): void {
    const fresh = this.achievementMgr.evaluate({
      completedSecrets: this.secretMgr.completedCount,
      totalSecrets: this.secretMgr.all.length,
      hintsUsed: this.hintMgr.usedCount,
      deaths: this.deathCount,
      elapsedMs: this.elapsed,
      visitedRooms: this.roomMgr.visitedRooms.length,
      inscriptions: this.inscriptionCount(),
      finished: this.finished,
    });
    for (const id of fresh) this.events.emit('achievement-unlocked', id);
  }

  isCompleted(): boolean {
    if (!this.started) return false;
    const allRooms = this.data.rooms.every((r) => this.roomMgr.completedRooms.includes(r.id));
    return allRooms && this.secretMgr.allRequiredCompleted(this.difficulty);
  }

  finish(): void {
    if (!this.isCompleted()) return;
    this.finished = true;
    this.evaluateAchievements();
    this.events.emit('game-finished', this.endingType());
    this.scheduleSave();
  }

  endingType(): EndingType {
    return selectEnding({
      completedSecrets: this.secretMgr.completedCount,
      totalSecrets: this.secretMgr.all.length,
      inscriptions: this.inscriptionCount(),
      totalInscriptions: TOTAL_INSCRIPTIONS,
    });
  }
}