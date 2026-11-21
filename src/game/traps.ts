import Phaser from 'phaser';
import type { TrapDef } from '../core/types';
import type { DifficultyConfig } from '../core/GameConfig';
import { audio } from './AudioManager';

export interface Trap {
  def: TrapDef;
  update(time: number, delta: number): void;
  hazard(playerRect: Phaser.Geom.Rectangle): 'lethal' | 'damage' | null;
  destroy(): void;
}

function overlap(rect: Phaser.Geom.Rectangle, x: number, y: number, w: number, h: number): boolean {
  return Phaser.Geom.Intersects.RectangleToRectangle(rect, new Phaser.Geom.Rectangle(x, y, w, h));
}

class LavaTrap implements Trap {
  private sprites: Phaser.GameObjects.TileSprite[] = [];
  private frame = 0;
  private timer = 0;

  constructor(readonly def: TrapDef, scene: Phaser.Scene) {
    const tile = scene.add.tileSprite(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h, 'lava-0');
    tile.setDepth(5);
    this.sprites.push(tile);
    const glow = scene.add.rectangle(def.x + def.w / 2, def.y - 6, def.w, 14, 0xff6600, 0.25);
    glow.setDepth(4);
    this.sprites.push(glow as unknown as Phaser.GameObjects.TileSprite);
  }

  update(_time: number, delta: number): void {
    this.timer += delta;
    if (this.timer > 260) {
      this.timer = 0;
      this.frame = 1 - this.frame;
      this.sprites[0].setTexture(`lava-${this.frame}`);
    }
  }

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    return overlap(rect, this.def.x, this.def.y + 6, this.def.w, this.def.h) ? 'lethal' : null;
  }

  destroy(): void {
    for (const s of this.sprites) s.destroy();
  }
}

class SpikesTrap implements Trap {
  private sprite: Phaser.GameObjects.TileSprite;

  constructor(readonly def: TrapDef, scene: Phaser.Scene) {
    this.sprite = scene.add.tileSprite(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h, 'spikes');
    this.sprite.setDepth(5);
  }

  update(): void {}

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    return overlap(rect, this.def.x + 4, this.def.y + 12, this.def.w - 8, this.def.h - 12) ? 'lethal' : null;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

class FallingRockTrap implements Trap {
  private sprite: Phaser.GameObjects.Image;
  private state: 'wait' | 'fall' | 'broken' = 'wait';
  private timer = 0;
  private vy = 0;
  private readonly interval: number;

  constructor(readonly def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig) {
    this.sprite = scene.add.image(def.x + def.w / 2, def.y + def.h / 2, 'rock');
    this.sprite.setDepth(20);
    this.interval = ((def.period ?? 3) / difficulty.trapSpeed) * 1000 * difficulty.trapInterval;
    const warning = scene.add.rectangle(def.x + def.w / 2, 668, def.w + 10, 6, 0xff4444, 0.3);
    warning.setDepth(4);
  }

  update(_time: number, delta: number): void {
    this.timer += delta;
    if (this.state === 'wait') {
      this.sprite.setVisible(this.timer > this.interval - 600);
      if (this.timer > this.interval - 600) {
        this.sprite.setAlpha(Math.sin(this.timer / 80) > 0 ? 1 : 0.5);
      }
      if (this.timer >= this.interval) {
        this.state = 'fall';
        this.timer = 0;
        this.vy = 0;
        this.sprite.setAlpha(1);
        audio.play('rock');
      }
    } else if (this.state === 'fall') {
      this.vy += 1.6 * delta;
      this.sprite.y += (this.vy * delta) / 16;
      this.sprite.rotation += delta * 0.004;
      if (this.sprite.y >= 650) {
        this.state = 'broken';
        this.timer = 0;
        this.sprite.setVisible(false);
      }
    } else if (this.timer > 700) {
      this.state = 'wait';
      this.timer = 0;
      this.sprite.setPosition(this.def.x + this.def.w / 2, this.def.y + this.def.h / 2);
      this.sprite.rotation = 0;
      this.sprite.setVisible(false);
    }
  }

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    if (this.state !== 'fall') return null;
    return overlap(rect, this.sprite.x - 18, this.sprite.y - 18, 36, 36) ? 'lethal' : null;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

class PendulumTrap implements Trap {
  private blade: Phaser.GameObjects.Image;
  private chain: Phaser.GameObjects.Graphics;
  private readonly speed: number;
  private readonly maxAngle: number;
  private readonly length: number;

  constructor(readonly def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig) {
    this.length = def.h;
    this.maxAngle = Math.asin(Math.min((def.range ?? 120) / this.length, 0.95));
    this.speed = ((Math.PI * 2) / ((def.period ?? 3) * 1000)) * difficulty.trapSpeed;
    this.blade = scene.add.image(def.x, def.y + this.length, 'blade');
    this.blade.setDepth(20);
    this.chain = scene.add.graphics();
    this.chain.setDepth(19);
    const anchor = scene.add.circle(def.x, def.y, 7, 0x666677);
    anchor.setDepth(21);
  }

  update(time: number): void {
    const angle = Math.sin(time * this.speed + (this.def.phase ?? 0)) * this.maxAngle;
    const bx = this.def.x + Math.sin(angle) * this.length;
    const by = this.def.y + Math.cos(angle) * this.length;
    this.blade.setPosition(bx, by + 20);
    this.blade.setRotation(angle);
    this.chain.clear();
    this.chain.lineStyle(4, 0x888899, 1);
    this.chain.lineBetween(this.def.x, this.def.y, bx, by);
  }

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    const circle = new Phaser.Geom.Circle(this.blade.x, this.blade.y + 10, 26);
    return Phaser.Geom.Intersects.CircleToRectangle(circle, rect) ? 'lethal' : null;
  }

  destroy(): void {
    this.blade.destroy();
    this.chain.destroy();
  }
}

class FireTrap implements Trap {
  private sprites: Phaser.GameObjects.Image[] = [];
  private active = false;
  private readonly cycle: number;
  private frame = 0;
  private frameTimer = 0;

  constructor(readonly def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig) {
    this.cycle = ((def.period ?? 2.5) * 1000 * difficulty.trapInterval) / difficulty.trapSpeed;
    for (let i = 0; i < 2; i++) {
      const s = scene.add.image(def.x + def.w / 2, def.y + def.h / 2 - i * 8, `fire-${i}`);
      s.setDepth(15);
      s.setVisible(false);
      this.sprites.push(s);
    }
    const base = scene.add.rectangle(def.x + def.w / 2, def.y + def.h, def.w + 8, 8, 0x555566);
    base.setDepth(6);
  }

  update(time: number, delta: number): void {
    const phase = (time % this.cycle) / this.cycle;
    const wasActive = this.active;
    this.active = phase < 0.45;
    if (this.active && !wasActive) audio.play('fire');
    this.frameTimer += delta;
    if (this.frameTimer > 120) {
      this.frameTimer = 0;
      this.frame = 1 - this.frame;
    }
    this.sprites[0].setVisible(this.active);
    this.sprites[1].setVisible(this.active && this.frame === 1);
    if (this.active) {
      const scale = 0.8 + Math.sin(time / 90) * 0.2;
      this.sprites[0].setScale(1, scale);
    }
  }

  hazard(rect: Phaser.Geom.Rectangle): 'damage' | null {
    if (!this.active) return null;
    return overlap(rect, this.def.x + 6, this.def.y, this.def.w - 12, this.def.h) ? 'damage' : null;
  }

  destroy(): void {
    for (const s of this.sprites) s.destroy();
  }
}

class MovingWallTrap implements Trap {
  private blocks: Phaser.GameObjects.Image[] = [];
  private readonly speed: number;
  private currentX: number;

  constructor(readonly def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig) {
    this.speed = ((Math.PI * 2) / ((def.period ?? 4) * 1000)) * difficulty.trapSpeed;
    this.currentX = def.x;
    const rows = Math.ceil(def.h / 40);
    for (let i = 0; i < rows; i++) {
      const block = scene.add.image(def.x + def.w / 2, def.y + i * 40 + 20, 'wallblock');
      block.setTint(0x8877aa);
      block.setDepth(18);
      this.blocks.push(block);
    }
  }

  update(time: number): void {
    const offset = Math.sin(time * this.speed + (this.def.phase ?? 0)) * ((this.def.range ?? 160) / 2);
    this.currentX = this.def.x + offset;
    for (const block of this.blocks) block.x = this.currentX + this.def.w / 2;
  }

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    return overlap(rect, this.currentX, this.def.y, this.def.w, this.def.h) ? 'lethal' : null;
  }

  destroy(): void {
    for (const b of this.blocks) b.destroy();
  }
}

class FallingCeilingTrap implements Trap {
  private slab: Phaser.GameObjects.Image;
  private readonly cycle: number;
  private currentY: number;

  constructor(readonly def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig) {
    this.cycle = ((def.period ?? 4) * 1000 * difficulty.trapInterval) / difficulty.trapSpeed;
    this.currentY = def.y;
    this.slab = scene.add.image(def.x + def.w / 2, def.y + def.h / 2, 'slab');
    this.slab.setDisplaySize(def.w, def.h);
    this.slab.setTint(0xaa9988);
    this.slab.setDepth(18);
  }

  update(time: number): void {
    const phase = (time % this.cycle) / this.cycle;
    let offset = 0;
    if (phase < 0.15) offset = (phase / 0.15) * 240;
    else if (phase < 0.45) offset = 240;
    else if (phase < 0.7) offset = 240 * (1 - (phase - 0.45) / 0.25);
    this.currentY = this.def.y + offset;
    this.slab.y = this.currentY + this.def.h / 2;
  }

  hazard(rect: Phaser.Geom.Rectangle): 'lethal' | null {
    return overlap(rect, this.def.x, this.currentY, this.def.w, this.def.h) ? 'lethal' : null;
  }

  destroy(): void {
    this.slab.destroy();
  }
}

export function createTrap(def: TrapDef, scene: Phaser.Scene, difficulty: DifficultyConfig): Trap {
  switch (def.kind) {
    case 'lava':
      return new LavaTrap(def, scene);
    case 'spikes':
      return new SpikesTrap(def, scene);
    case 'falling-rock':
      return new FallingRockTrap(def, scene, difficulty);
    case 'pendulum':
      return new PendulumTrap(def, scene, difficulty);
    case 'fire':
      return new FireTrap(def, scene, difficulty);
    case 'moving-wall':
      return new MovingWallTrap(def, scene, difficulty);
    case 'falling-ceiling':
      return new FallingCeilingTrap(def, scene, difficulty);
  }
}