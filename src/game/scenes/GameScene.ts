import Phaser from 'phaser';
import type { GameSession } from '../../core/GameSession';
import type { ChestDef, DoorDef, LeverDef, NoteDef, PlatformDef, SecretDef, Vec2 } from '../../core/types';
import { getDifficulty, type DifficultyConfig } from '../../core/GameConfig';
import { ITEMS } from '../../inventory/items';
import { Player, type InputState } from '../Player';
import { createTrap, type Trap } from '../traps';
import { touchInput } from '../input';
import { audio } from '../AudioManager';
import { RoomGraph } from '../../rooms/RoomGraph';
import { CONNECTIONS } from '../../rooms/rooms-data';

interface Interactable {
  x: number;
  y: number;
  radius: number;
  label: string;
  action: () => void;
}

interface MovingPlatform {
  sprite: Phaser.GameObjects.Image;
  body: Phaser.Physics.Arcade.StaticBody;
  base: Vec2;
  dx: number;
  dy: number;
  period: number;
  prev: Vec2;
}

interface CrumblePlatform {
  sprite: Phaser.GameObjects.Image;
  body: Phaser.Physics.Arcade.StaticBody;
  state: 'idle' | 'shaking' | 'fallen';
  timer: number;
  baseY: number;
}

export class GameScene extends Phaser.Scene {
  private session!: GameSession;
  private player!: Player;
  private traps: Trap[] = [];
  private movingPlatforms: MovingPlatform[] = [];
  private crumbles: CrumblePlatform[] = [];
  private interactables: Interactable[] = [];
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private graph = new RoomGraph(CONNECTIONS);
  private respawnScheduled = false;
  private transitioning = false;
  private interactCooldown = 0;
  private promptText!: Phaser.GameObjects.Text;
  private zoneMarkers: { rect: Phaser.Geom.Rectangle; zoneId: string; secretId: string; marker: Phaser.GameObjects.Rectangle }[] = [];
  private chestSprites = new Map<string, Phaser.GameObjects.Image>();
  private wallSprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private leverSprites = new Map<string, Phaser.GameObjects.Image>();
  private noteSprites = new Map<string, Phaser.GameObjects.Image>();
  private checkpointTorches: { pos: Vec2; sprite: Phaser.GameObjects.Image; lit: boolean }[] = [];
  private difficulty!: DifficultyConfig;
  private elapsedAccum = 0;
  private portalGraceUntil = 0;
  private jumpQueued = false;
  private pauseQueued = false;

  constructor() {
    super('Game');
  }

  init(data: { session: GameSession }): void {
    this.session = data.session;
    this.traps = [];
    this.movingPlatforms = [];
    this.crumbles = [];
    this.interactables = [];
    this.zoneMarkers = [];
    this.chestSprites.clear();
    this.wallSprites.clear();
    this.leverSprites.clear();
    this.noteSprites.clear();
    this.checkpointTorches = [];
    this.respawnScheduled = false;
    this.transitioning = false;
  }

  create(): void {
    const room = this.session.currentRoomDef;
    this.difficulty = getDifficulty(this.session.state.difficulty);
    const pal = room.palette;

    this.physics.world.setBounds(0, -200, room.width, 920);
    this.cameras.main.setBounds(0, 0, room.width, 720);
    this.cameras.main.setBackgroundColor(pal.bg);

    this.buildBackground(room.width, room.height, pal);
    this.platformGroup = this.physics.add.staticGroup();
    this.buildPlatforms(room.platforms, pal);
    this.buildRopes(room.ropes);
    for (const def of room.traps) this.traps.push(createTrap(def, this, this.difficulty));
    this.buildCheckpoints(room.checkpoints);
    this.buildChests(room.chests);
    this.buildWalls(room.secretWalls);
    this.buildLevers(room.levers);
    this.buildNotes(room.notes);
    this.buildZones();
    this.buildPortals(room.width);
    if (room.id === 1) this.buildPedestal();
    if (room.id === 20) this.buildGate();

    this.player = new Player(this, this.session.position.x, this.session.position.y);
    this.physics.add.collider(this.player, this.platformGroup);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(240, 140);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.keys = this.input.keyboard!.addKeys('A,D,W,S,SPACE,E,H,M,ESC,LEFT,RIGHT,UP,DOWN,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.portalGraceUntil = this.time.now + 700;
    this.keys.E.on('down', () => this.tryInteract());
    this.keys.SPACE.on('down', () => {
      this.jumpQueued = true;
    });
    this.keys.H.on('down', () => this.session.events.emit('hint-request'));
    this.keys.M.on('down', () => this.session.events.emit('map-request'));
    // Deferred to update: Phaser dispatches keydown before the UI's window
    // listener, so emitting here would let the same Escape close the pause modal.
    this.keys.ESC.on('down', () => {
      this.pauseQueued = true;
    });

    this.promptText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffe9b0',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.session.events.emit('room-entered-ui', room);
    if (room.id === 1 && this.session.state.completedSecrets.length === 0) {
      this.session.events.emit('toast', { text: 'Кристалл у вас. Двери запечатались. Найдите путь к выходу!', kind: 'story' });
    }
    audio.startMusic();
  }

  private buildBackground(width: number, height: number, pal: { bg: string; bgFar: string; wall: string; wallDark: string; accent: string; glow: string }): void {
    const far = this.add.rectangle(width / 2, height / 2, width, height, Phaser.Display.Color.HexStringToColor(pal.bgFar).color);
    far.setDepth(0);
    const bricks = this.add.tileSprite(width / 2, height / 2, width, height, 'wallblock');
    bricks.setTint(Phaser.Display.Color.HexStringToColor(pal.wallDark).color);
    bricks.setAlpha(0.22);
    bricks.setDepth(1);
    for (let x = 150; x < width; x += 340) {
      const column = this.add.rectangle(x, height / 2 + 40, 56, height - 120, Phaser.Display.Color.HexStringToColor(pal.wall).color, 0.55);
      column.setDepth(2);
      const cap = this.add.rectangle(x, 130, 80, 22, Phaser.Display.Color.HexStringToColor(pal.wall).color, 0.7);
      cap.setDepth(2);
      const glyph = this.add.image(x, 220 + (x % 3) * 60, 'glyph');
      glyph.setTint(Phaser.Display.Color.HexStringToColor(pal.accent).color);
      glyph.setAlpha(0.25);
      glyph.setDepth(2);
    }
    const glowColor = Phaser.Display.Color.HexStringToColor(pal.glow).color;
    for (let x = 250; x < width; x += 560) {
      const glow = this.add.circle(x, 300, 130, glowColor, 0.05);
      glow.setDepth(3);
    }
    const dust = this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: width },
      y: { min: 100, max: 650 },
      lifespan: 6000,
      speedY: { min: -12, max: -4 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.25, end: 0 },
      frequency: 450,
      tint: Phaser.Display.Color.HexStringToColor(pal.accent).color,
    });
    dust.setDepth(4);
  }

  private buildPlatforms(platforms: PlatformDef[], pal: { platform: string }): void {
    const tint = Phaser.Display.Color.HexStringToColor(pal.platform).color;
    for (const def of platforms) {
      const isFloor = def.y >= 660;
      const scaleW = isFloor || def.kind === 'moving' ? 1 : this.difficulty.platformScale;
      const w = Math.max(def.w * scaleW, 56);
      const texture = isFloor ? 'floor' : 'platform';
      const cx = def.x + w / 2;
      const cy = def.y + def.h / 2;
      const sprite = this.add.image(cx, cy, texture);
      sprite.setDisplaySize(w, def.h);
      sprite.setTint(def.kind === 'crumble' ? 0xbb9977 : tint);
      this.platformGroup.add(sprite);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.updateFromGameObject();

      if (def.kind === 'moving' && def.move) {
        sprite.setDepth(10);
        this.movingPlatforms.push({
          sprite, body,
          base: { x: cx, y: cy },
          dx: def.move.dx, dy: def.move.dy,
          period: def.move.period / this.difficulty.trapSpeed,
          prev: { x: cx, y: cy },
        });
      } else if (def.kind === 'crumble') {
        sprite.setDepth(10);
        this.crumbles.push({ sprite, body, state: 'idle', timer: 0, baseY: cy });
      } else {
        sprite.setVisible(false);
        const tile = this.add.tileSprite(cx, cy, w, def.h, texture);
        tile.setTint(tint);
        tile.setDepth(10);
      }
    }
  }

  private buildRopes(ropes: { x: number; yTop: number; yBottom: number }[]): void {
    for (const rope of ropes) {
      const tile = this.add.tileSprite(rope.x, (rope.yTop + rope.yBottom) / 2, 8, rope.yBottom - rope.yTop, 'rope');
      tile.setDepth(8);
      const anchor = this.add.circle(rope.x, rope.yTop, 6, 0x8a6828);
      anchor.setDepth(8);
    }
  }

  private buildCheckpoints(checkpoints: Vec2[]): void {
    for (const pos of checkpoints) {
      const sprite = this.add.image(pos.x, 612, 'torch-0');
      sprite.setDepth(12);
      this.checkpointTorches.push({ pos, sprite, lit: false });
    }
  }

  private buildChests(chests: ChestDef[]): void {
    const hasAmulet = this.session.inventory.hasItem('magic-amulet');
    for (const chest of chests) {
      const secret = this.session.secrets.get(chest.secretId);
      const completed = secret ? this.session.secrets.isCompleted(secret.id) : false;
      if (chest.hidden && !hasAmulet && !completed) continue;
      const texture = completed ? 'chest-open' : chest.kind === 'artifact' ? 'artifact' : 'chest';
      const sprite = this.add.image(chest.x, chest.y, texture);
      sprite.setDepth(12);
      if (chest.hidden) sprite.setAlpha(0.85);
      this.chestSprites.set(chest.id, sprite);
      if (!completed && secret) {
        const glow = this.add.circle(chest.x, chest.y, 30, 0xffcc44, 0.12);
        glow.setDepth(11);
        this.tweens.add({ targets: glow, alpha: 0.05, scale: 1.3, duration: 900, yoyo: true, repeat: -1 });
        this.interactables.push({
          x: chest.x, y: chest.y, radius: 64,
          label: chest.kind === 'artifact' ? 'E — взять артефакт' : 'E — открыть сундук',
          action: () => this.openChest(chest, secret),
        });
      }
    }
  }

  private openChest(chest: ChestDef, secret: SecretDef): void {
    this.player.playInteract();
    this.session.interact(chest.id);
    this.session.discoverSecret(secret.id);
    const ok = this.session.completeSecret(secret.id);
    if (ok) {
      const sprite = this.chestSprites.get(chest.id);
      if (sprite && chest.kind !== 'artifact') sprite.setTexture('chest-open');
      if (sprite && chest.kind === 'artifact') {
        this.tweens.add({ targets: sprite, y: sprite.y - 40, alpha: 0, duration: 600 });
      }
      audio.play(chest.kind === 'artifact' ? 'key' : 'chest');
      this.rewardFeedback(secret);
    }
  }

  private buildWalls(walls: { id: string; x: number; y: number; w: number; h: number; secretId: string }[]): void {
    for (const wall of walls) {
      const secret = this.session.secrets.get(wall.secretId);
      const completed = secret ? this.session.secrets.isCompleted(secret.id) : false;
      const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x998877, completed ? 0.1 : 0.5);
      rect.setDepth(9);
      rect.setStrokeStyle(2, 0xffcc44, completed ? 0 : 0.3);
      this.wallSprites.set(wall.id, rect);
      if (!completed && secret) {
        this.interactables.push({
          x: wall.x + wall.w / 2, y: wall.y + wall.h / 2, radius: 70,
          label: 'E — осмотреть стену',
          action: () => {
            this.player.playInteract();
            this.session.interact(wall.id);
            this.session.discoverSecret(secret.id);
            if (this.session.completeSecret(secret.id)) {
              this.tweens.add({ targets: rect, alpha: 0.08, duration: 500 });
              audio.play('door');
              this.rewardFeedback(secret);
            }
          },
        });
      }
    }
  }

  private buildLevers(levers: LeverDef[]): void {
    const puzzleIds = new Set(levers.map((l) => l.puzzleId));
    for (const pid of puzzleIds) {
      const puzzle = this.session.puzzles.get(pid);
      if (!puzzle) continue;
      const solved = this.session.puzzles.isSolved(pid);
      if (this.difficulty.extraRoomHints && !solved) {
        const first = levers.find((l) => l.puzzleId === pid)!;
        this.add.text(first.x, first.y - 90, puzzle.hints[0], {
          fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ffe9b0', align: 'center',
          backgroundColor: '#00000088', padding: { x: 6, y: 3 }, wordWrap: { width: 260 },
        }).setOrigin(0.5).setDepth(15);
      }
    }
    for (const lever of levers) {
      const puzzle = this.session.puzzles.get(lever.puzzleId);
      const step = lever.id.slice(lever.puzzleId.length + 1);
      const solved = this.session.puzzles.isSolved(lever.puzzleId);
      const texture = puzzle?.kind === 'light-mirror' ? 'mirror' : puzzle?.kind === 'symbol-decode' ? 'symbol-stone' : solved ? 'lever-1' : 'lever-0';
      const sprite = this.add.image(lever.x, lever.y, texture);
      sprite.setDepth(12);
      this.leverSprites.set(lever.id, sprite);
      const label = puzzle?.stepLabels?.[step] ?? step;
      this.add.text(lever.x, lever.y - 40, label, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ffe9b0',
      }).setOrigin(0.5).setDepth(15);
      if (!solved) {
        this.interactables.push({
          x: lever.x, y: lever.y, radius: 56,
          label: puzzle?.kind === 'light-mirror' ? 'E — повернуть зеркало' : puzzle?.kind === 'symbol-decode' ? 'E — нажать символ' : 'E — потянуть рычаг',
          action: () => this.pullLever(lever),
        });
      }
    }
  }

  private pullLever(lever: LeverDef): void {
    this.player.playInteract();
    const step = lever.id.slice(lever.puzzleId.length + 1);
    const result = this.session.attemptPuzzle(lever.puzzleId, step);
    const sprite = this.leverSprites.get(lever.id);
    const puzzle = this.session.puzzles.get(lever.puzzleId);
    if (result === 'progress') {
      audio.play('lever');
      if (sprite && puzzle?.kind === 'lever-sequence') sprite.setTexture('lever-1');
      if (sprite && puzzle?.kind !== 'lever-sequence') {
        this.tweens.add({ targets: sprite, angle: 30, duration: 200, yoyo: true });
        sprite.setTint(0xffcc44);
      }
    } else if (result === 'wrong') {
      audio.play('crumble');
      this.cameras.main.shake(180, 0.004);
      for (const [id, s] of this.leverSprites) {
        if (id.startsWith(lever.puzzleId)) {
          if (puzzle?.kind === 'lever-sequence') s.setTexture('lever-0');
          s.clearTint();
          s.setAngle(0);
        }
      }
      this.session.events.emit('toast', { text: 'Неверная последовательность — механизм сбросился.', kind: 'warn' });
    } else if (result === 'solved') {
      audio.play('secret');
      for (const [id, s] of this.leverSprites) {
        if (id.startsWith(lever.puzzleId)) s.setTint(0xffee88);
      }
      this.session.events.emit('toast', { text: `Головоломка «${puzzle?.title}» решена!`, kind: 'good' });
      const secret = this.session.secrets.all.find((s) => s.roomId === this.session.currentRoom && s.complete.type === 'puzzle' && s.complete.puzzle === lever.puzzleId);
      if (secret) {
        this.session.discoverSecret(secret.id);
        if (this.session.completeSecret(secret.id)) this.rewardFeedback(secret);
      }
    }
  }

  private buildNotes(notes: NoteDef[]): void {
    for (const note of notes) {
      if (this.session.state.notesFound.includes(note.id)) continue;
      const sprite = this.add.image(note.x, note.y, 'note');
      sprite.setDepth(12);
      this.noteSprites.set(note.id, sprite);
      this.tweens.add({ targets: sprite, y: note.y - 6, duration: 1100, yoyo: true, repeat: -1 });
      this.interactables.push({
        x: note.x, y: note.y, radius: 60,
        label: 'E — прочитать записку',
        action: () => {
          this.player.playInteract();
          if (this.session.collectNote(note.id)) {
            audio.play('note');
            sprite.destroy();
            this.noteSprites.delete(note.id);
            this.session.events.emit('note-open', note);
          }
        },
      });
    }
  }

  private buildZones(): void {
    const room = this.session.currentRoomDef;
    const hasAmulet = this.session.inventory.hasItem('magic-amulet');
    for (const zone of room.zones) {
      const secret = room.secrets.find((s) => s.complete.type === 'zone' && s.complete.zone === zone.id);
      if (!secret) continue;
      const hidden = secret.discover.type === 'item';
      const completed = this.session.secrets.isCompleted(secret.id);
      const rect = new Phaser.Geom.Rectangle(zone.x, zone.y, zone.w, zone.h);
      if (!completed && (!hidden || hasAmulet)) {
        const marker = this.add.rectangle(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w, zone.h, 0xffcc44, hidden ? 0.18 : 0.1);
        marker.setStrokeStyle(1, 0xffcc44, hidden ? 0.6 : 0.3);
        marker.setDepth(7);
        this.tweens.add({ targets: marker, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });
        this.zoneMarkers.push({ rect, zoneId: zone.id, secretId: secret.id, marker });
      } else if (!completed) {
        this.zoneMarkers.push({ rect, zoneId: zone.id, secretId: secret.id, marker: this.add.rectangle(0, 0, 1, 1).setVisible(false) });
      }
    }
  }

  private buildPedestal(): void {
    const pedestal = this.add.image(1000, 630, 'pedestal');
    pedestal.setDepth(11);
    this.add.text(1000, 560, 'Постамент кристалла пуст…', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(15);
  }

  private buildGate(): void {
    const room = this.session.currentRoomDef;
    const zone = room.exitZone!;
    const gate = this.add.image(zone.x + zone.w / 2, zone.y + zone.h / 2 - 30, 'gate');
    gate.setDepth(11);
    const crystalSlot = this.add.circle(zone.x + zone.w / 2, zone.y + 60, 12, 0x66ddff, 0.5);
    crystalSlot.setDepth(12);
    this.tweens.add({ targets: crystalSlot, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.interactables.push({
      x: zone.x + zone.w / 2, y: zone.y + zone.h / 2, radius: 110,
      label: 'E — вставить кристалл в врата',
      action: () => {
        if (this.session.isCompleted()) {
          this.player.playKey();
          audio.play('victory');
          this.session.finish();
        } else {
          const required = this.session.secrets.requiredTotalCount(this.session.state.difficulty);
          const done = this.session.secrets.requiredCompletedCount(this.session.state.difficulty);
          const roomsLeft = 20 - this.session.rooms.completedRooms.length;
          this.session.events.emit('toast', {
            text: `Врата не открываются. Секретов: ${done}/${required}. Не пройдено комнат: ${roomsLeft}.`,
            kind: 'warn',
          });
        }
      },
    });
  }

  private buildPortals(width: number): void {
    const room = this.session.currentRoomDef;
    const neighbors = this.graph.neighbors(room.id);
    const slots = { left: 0, right: 0 };
    for (const n of neighbors) {
      const conn = this.graph.connection(room.id, n)!;
      const side = n > room.id ? 'right' : 'left';
      const slot = slots[side]++;
      const x = side === 'right' ? width - 60 - slot * 100 : 60 + slot * 100;
      const target = this.session.roomDef(n);
      if (conn.doorId) {
        const doorDef = this.session.doors.get(conn.doorId);
        const open = this.session.doors.isOpen(conn.doorId);
        const sprite = this.add.image(x, 605, open ? 'door-open' : 'door');
        sprite.setDepth(11);
        this.add.text(x, 528, `→ ${target?.name ?? n}`, {
          fontFamily: 'Georgia, serif', fontSize: '13px', color: '#ffe9b0', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(15);
        this.interactables.push({
          x, y: 605, radius: 76,
          label: open ? 'E — войти' : `E — открыть (${this.doorRequirementText(doorDef)})`,
          action: () => {
            if (this.session.doors.isOpen(conn.doorId!)) {
              this.travel(n);
            } else if (this.session.tryOpenDoor(conn.doorId!)) {
              sprite.setTexture('door-open');
              audio.play('door');
              this.session.events.emit('toast', { text: `Дверь открыта: ${doorDef?.name}`, kind: 'good' });
              this.travel(n);
            } else {
              audio.play('crumble');
              this.session.events.emit('toast', { text: `Заперто. ${this.doorRequirementText(doorDef)}.`, kind: 'warn' });
            }
          },
        });
      } else {
        const arch = this.add.rectangle(x, 600, 56, 120, Phaser.Display.Color.HexStringToColor(room.palette.glow).color, 0.18);
        arch.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(room.palette.accent).color, 0.5);
        arch.setDepth(11);
        this.add.text(x, 528, `→ ${target?.name ?? n}`, {
          fontFamily: 'Georgia, serif', fontSize: '13px', color: '#ffe9b0', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: arch, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
        const trigger = new Phaser.Geom.Rectangle(x - 28, 540, 56, 120);
        this.zoneMarkers.push({ rect: trigger, zoneId: '', secretId: `portal:${n}`, marker: arch });
      }
    }
  }

  private doorRequirementText(door?: DoorDef): string {
    if (!door) return 'нужен ключ';
    if (door.requiresItem) return `нужен: ${ITEMS[door.requiresItem]?.name ?? door.requiresItem}`;
    if (door.requiresPuzzle) return 'нужно решить головоломку';
    if (door.requiresSecret) return 'нужно выполнить секрет';
    return 'свободный проход';
  }

  private travel(target: number): void {
    if (this.transitioning) return;
    const from = this.session.currentRoom;
    if (!this.session.enterRoom(target)) return;
    this.transitioning = true;
    audio.play('door');
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ session: this.session, fromRoom: from });
    });
  }

  private rewardFeedback(secret: SecretDef): void {
    this.player.playKey();
    const rewards = (secret.rewardItems ?? []).map((id) => ITEMS[id]?.name ?? id).join(', ');
    this.session.events.emit('toast', {
      text: `Секрет «${secret.title}» раскрыт!${rewards ? ` Получено: ${rewards}` : ''}`,
      kind: 'secret',
    });
    audio.play('secret');
    for (const item of secret.rewardItems ?? []) {
      if (ITEMS[item]?.category.includes('key')) {
        const key = this.add.image(this.player.x, this.player.y - 50, 'key');
        key.setDepth(60);
        this.tweens.add({ targets: key, y: key.y - 70, alpha: 0, duration: 1100, onComplete: () => key.destroy() });
        audio.play('key');
      }
    }
    const burst = this.add.particles(this.player.x, this.player.y - 30, 'spark', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      lifespan: 700,
      scale: { start: 1, end: 0 },
      tint: 0xffcc44,
      quantity: 16,
      emitting: false,
    });
    burst.setDepth(60);
    burst.explode();
    this.time.delayedCall(800, () => burst.destroy());
  }

  private tryInteract(): void {
    if (this.player.dead || this.transitioning) return;
    const now = this.time.now;
    if (now < this.interactCooldown) return;
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const it of this.interactables) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
      if (dist < it.radius && dist < bestDist) {
        best = it;
        bestDist = dist;
      }
    }
    if (best) {
      this.interactCooldown = now + 300;
      best.action();
    }
  }

  private readInput(): InputState {
    const k = this.keys;
    return {
      left: k.A.isDown || k.LEFT.isDown || touchInput.left,
      right: k.D.isDown || k.RIGHT.isDown || touchInput.right,
      up: k.W.isDown || k.UP.isDown || touchInput.up,
      down: k.S.isDown || k.DOWN.isDown || touchInput.down,
      jump: this.jumpQueued || touchInput.jump,
      run: k.SHIFT.isDown || touchInput.run,
    };
  }

  update(time: number, delta: number): void {
    if (!this.player) return;
    if (this.pauseQueued) {
      this.pauseQueued = false;
      this.session.events.emit('pause-request');
    }
    this.session.tick(delta);
    this.elapsedAccum += delta;
    if (this.elapsedAccum > 5000) {
      this.elapsedAccum = 0;
      void this.session.save();
    }

    const input = this.readInput();
    this.jumpQueued = false;
    if (touchInput.jump) touchInput.jump = false;
    if (touchInput.interact) {
      touchInput.interact = false;
      this.tryInteract();
    }
    this.player.update(input, delta, this.session.currentRoomDef.ropes);

    for (const trap of this.traps) trap.update(time, delta);
    this.updateMovingPlatforms(time);
    this.updateCrumbles(delta);

    if (!this.player.dead && !this.transitioning) {
      this.checkHazards();
      this.checkZones();
      this.checkCheckpoints();
      this.checkDiscovery();
      this.checkExit();
    }

    if (this.player.dead && !this.respawnScheduled) {
      this.respawnScheduled = true;
      this.cameras.main.shake(250, 0.006);
      this.time.delayedCall(1000, () => {
        this.session.die();
        this.player.revive(this.session.position.x, this.session.position.y);
        this.session.events.emit('player-hurt', this.player.hp);
        this.cameras.main.flash(300, 120, 40, 40);
        this.respawnScheduled = false;
        this.session.events.emit('toast', { text: 'Возрождение у контрольной точки. Ключи и секреты сохранены.', kind: 'warn' });
      });
    }

    this.updatePrompt();
  }

  private updateMovingPlatforms(time: number): void {
    for (const mp of this.movingPlatforms) {
      const phase = (time / 1000 / mp.period) * Math.PI * 2;
      const nx = mp.base.x + (Math.sin(phase) * mp.dx) / 2;
      const ny = mp.base.y + (Math.sin(phase) * mp.dy) / 2;
      const dx = nx - mp.prev.x;
      const dy = ny - mp.prev.y;
      mp.sprite.setPosition(nx, ny);
      mp.body.updateFromGameObject();
      const body = this.player.body;
      const standing =
        (body.blocked.down || body.touching.down) &&
        Math.abs(body.bottom - mp.body.top) < 8 &&
        body.right > mp.body.left && body.left < mp.body.right;
      if (standing && !this.player.dead) {
        this.player.x += dx;
        this.player.y += dy;
      }
      mp.prev = { x: nx, y: ny };
    }
  }

  private updateCrumbles(delta: number): void {
    for (const cr of this.crumbles) {
      const body = this.player.body;
      const standing =
        (body.blocked.down || body.touching.down) &&
        Math.abs(body.bottom - cr.body.top) < 8 &&
        body.right > cr.body.left && body.left < cr.body.right;
      if (cr.state === 'idle' && standing && !this.player.dead) {
        cr.state = 'shaking';
        cr.timer = 0;
        audio.play('crumble');
      } else if (cr.state === 'shaking') {
        cr.timer += delta;
        cr.sprite.x += Math.sin(cr.timer / 25) * 1.5;
        if (cr.timer > 550) {
          cr.state = 'fallen';
          cr.timer = 0;
          cr.body.checkCollision.none = true;
          this.tweens.add({ targets: cr.sprite, y: cr.sprite.y + 320, alpha: 0, duration: 600 });
        }
      } else if (cr.state === 'fallen') {
        cr.timer += delta;
        if (cr.timer > 3000) {
          cr.state = 'idle';
          cr.sprite.setPosition(cr.sprite.x, cr.baseY);
          cr.sprite.setAlpha(1);
          cr.body.checkCollision.none = false;
          cr.body.updateFromGameObject();
        }
      }
    }
  }

  private playerRect(): Phaser.Geom.Rectangle {
    const b = this.player.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  private checkHazards(): void {
    const rect = this.playerRect();
    const hasWard = this.session.inventory.hasItem('flame-ward');
    for (const trap of this.traps) {
      const hit = trap.hazard(rect);
      if (hit === 'lethal') {
        this.player.kill();
        this.session.events.emit('player-hurt', 0);
        return;
      }
      if (hit === 'damage' && !hasWard) {
        const died = this.player.hurt(this.time.now);
        this.session.events.emit('player-hurt', this.player.hp);
        if (died) return;
      }
    }
    if (this.player.y > 820) {
      this.player.kill();
      this.session.events.emit('player-hurt', 0);
    }
  }

  private checkZones(): void {
    const rect = this.playerRect();
    for (const zm of this.zoneMarkers) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, zm.rect)) continue;
      if (zm.secretId.startsWith('portal:')) {
        if (this.time.now < this.portalGraceUntil) continue;
        const target = Number(zm.secretId.split(':')[1]);
        this.travel(target);
        return;
      }
      this.session.reachZone(zm.zoneId);
      const secret = this.session.secrets.get(zm.secretId);
      if (secret && !this.session.secrets.isCompleted(secret.id)) {
        if (this.session.discoverSecret(secret.id) || this.session.secrets.isDiscovered(secret.id)) {
          if (this.session.completeSecret(secret.id)) {
            zm.marker.destroy();
            this.rewardFeedback(secret);
          }
        }
      }
    }
  }

  private checkCheckpoints(): void {
    for (const cp of this.checkpointTorches) {
      if (cp.lit) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, cp.pos.x, 620) < 50) {
        cp.lit = true;
        cp.sprite.setTexture('torch-1');
        this.session.setCheckpoint({ x: cp.pos.x, y: 600 });
        audio.play('note');
        this.session.events.emit('toast', { text: 'Контрольная точка активирована.', kind: 'good' });
        const glow = this.add.circle(cp.pos.x, 590, 40, 0xffaa33, 0.15);
        glow.setDepth(11);
        this.tweens.add({ targets: glow, alpha: 0.05, scale: 1.4, duration: 1000, yoyo: true, repeat: -1 });
      }
    }
  }

  private checkDiscovery(): void {
    const room = this.session.currentRoomDef;
    for (const secret of room.secrets) {
      if (this.session.secrets.isDiscovered(secret.id) || this.session.secrets.isCompleted(secret.id)) continue;
      if (secret.kind === 'hidden-chest' || secret.kind === 'artifact-hunt' || secret.kind === 'secret-wall') {
        const obj = room.chests.find((c) => c.secretId === secret.id) ?? room.secretWalls.find((w) => w.secretId === secret.id);
        if (!obj) continue;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y) < 150) {
          if (this.session.discoverSecret(secret.id)) {
            this.session.events.emit('toast', { text: `Обнаружен секрет: «${secret.title}»`, kind: 'info' });
            audio.play('hint');
          }
        }
      }
    }
  }

  private checkExit(): void {
    const room = this.session.currentRoomDef;
    if (!room.exitZone || room.id === 20) return;
    const rect = this.playerRect();
    const ez = new Phaser.Geom.Rectangle(room.exitZone.x, room.exitZone.y, room.exitZone.w, room.exitZone.h);
    if (Phaser.Geom.Intersects.RectangleToRectangle(rect, ez)) {
      if (!this.session.rooms.completedRooms.includes(room.id)) {
        this.session.completeRoom(room.id);
        this.session.events.emit('toast', { text: `Комната «${room.name}» пройдена!`, kind: 'good' });
      }
    }
  }

  private updatePrompt(): void {
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const it of this.interactables) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
      if (dist < it.radius && dist < bestDist) {
        best = it;
        bestDist = dist;
      }
    }
    if (best && !this.player.dead) {
      this.promptText.setText(best.label);
      this.promptText.setPosition(best.x, best.y - 64);
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }
}