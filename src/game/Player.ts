import Phaser from 'phaser';
import { PHYSICS } from '../core/GameConfig';
import type { RopeDef } from '../core/types';
import { audio } from './AudioManager';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  run: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  hp = 3;
  dead = false;
  onRope: RopeDef | null = null;
  facing = 1;
  private coyote = 0;
  private jumpBuffer = 0;
  private wasOnFloor = false;
  private invulnUntil = 0;
  private landUntil = 0;
  private interactUntil = 0;
  private keyUntil = 0;
  private stepTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 'idle-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(PHYSICS.playerWidth, PHYSICS.playerHeight);
    this.body.setOffset((FW_OFF - PHYSICS.playerWidth) / 2, FH_OFF - PHYSICS.playerHeight);
    this.body.setMaxVelocity(600, PHYSICS.maxFallSpeed);
    this.setDepth(50);
    this.play('hero-idle');
  }

  get invulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  hurt(now: number): boolean {
    if (this.dead || now < this.invulnUntil) return false;
    this.hp -= 1;
    this.invulnUntil = now + 1200;
    this.play('hero-hurt', true);
    audio.play('death');
    if (this.hp <= 0) {
      this.kill();
      return true;
    }
    this.setTint(0xff8866);
    this.scene.time.delayedCall(300, () => this.clearTint());
    return false;
  }

  kill(): void {
    if (this.dead) return;
    this.dead = true;
    this.onRope = null;
    this.body.setVelocity(0, -200);
    this.play('hero-dead', true);
    audio.play('death');
  }

  revive(x: number, y: number): void {
    this.dead = false;
    this.hp = 3;
    this.onRope = null;
    this.clearTint();
    this.setPosition(x, y);
    this.body.setVelocity(0, 0);
    this.play('hero-idle', true);
  }

  playInteract(): void {
    this.interactUntil = this.scene.time.now + 350;
  }

  playKey(): void {
    this.keyUntil = this.scene.time.now + 600;
  }

  update(input: InputState, delta: number, ropes: RopeDef[]): void {
    if (this.dead) return;
    const now = this.scene.time.now;
    const onFloor = this.body.blocked.down || this.body.touching.down;

    if (onFloor) this.coyote = PHYSICS.coyoteMs;
    else this.coyote = Math.max(0, this.coyote - delta);

    if (input.jump) this.jumpBuffer = PHYSICS.jumpBufferMs;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);

    if (this.onRope) {
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      let vy = 0;
      if (input.up) vy = -PHYSICS.ropeClimbSpeed;
      if (input.down) vy = PHYSICS.ropeClimbSpeed;
      this.body.setVelocityY(vy);
      this.y = Phaser.Math.Clamp(this.y, this.onRope.yTop + 20, this.onRope.yBottom);
      if (input.left || input.right) {
        this.detachRope();
        this.body.setVelocityX(input.left ? -PHYSICS.walkSpeed : PHYSICS.walkSpeed);
      } else if (this.jumpBuffer > 0) {
        this.detachRope();
        this.body.setVelocityY(PHYSICS.jumpVelocity);
        this.jumpBuffer = 0;
        audio.play('jump');
      } else {
        this.play('hero-rope', true);
        return;
      }
    } else {
      this.body.setAllowGravity(true);
      for (const rope of ropes) {
        const nearX = Math.abs(this.x - rope.x) < 18;
        const inY = this.y > rope.yTop && this.y < rope.yBottom;
        if (nearX && inY && (input.up || input.down)) {
          this.onRope = rope;
          this.x = rope.x;
          this.body.setVelocity(0, 0);
          break;
        }
      }
    }

    if (!this.onRope) {
      const speed = input.run ? PHYSICS.runSpeed : PHYSICS.walkSpeed;
      if (input.left) {
        this.body.setVelocityX(-speed);
        this.facing = -1;
        this.setFlipX(true);
      } else if (input.right) {
        this.body.setVelocityX(speed);
        this.facing = 1;
        this.setFlipX(false);
      } else {
        this.body.setVelocityX(0);
      }

      if (this.jumpBuffer > 0 && this.coyote > 0) {
        this.body.setVelocityY(PHYSICS.jumpVelocity);
        this.jumpBuffer = 0;
        this.coyote = 0;
        audio.play('jump');
      }

      if (!onFloor && this.body.velocity.y > 60) {
        this.play('hero-fall', true);
      } else if (!onFloor && this.body.velocity.y < -60) {
        this.play('hero-jump', true);
      } else if (now < this.keyUntil) {
        this.play('hero-key', true);
      } else if (now < this.interactUntil) {
        this.play('hero-interact', true);
      } else if (now < this.landUntil) {
        this.play('hero-land', true);
      } else if (Math.abs(this.body.velocity.x) > 10) {
        this.play(input.run ? 'hero-run' : 'hero-walk', true);
        this.stepTimer += delta;
        if (this.stepTimer > (input.run ? 220 : 320)) {
          this.stepTimer = 0;
          audio.play('step');
        }
      } else {
        this.play('hero-idle', true);
      }

      if (onFloor && !this.wasOnFloor && this.body.velocity.y >= 0) {
        this.landUntil = now + 140;
        audio.play('land');
      }
    }

    this.wasOnFloor = onFloor;
    if (this.invulnerable) {
      this.setAlpha(Math.sin(now / 60) > 0 ? 0.4 : 0.9);
    } else {
      this.setAlpha(1);
    }
  }

  private detachRope(): void {
    this.onRope = null;
    this.body.setAllowGravity(true);
    this.coyote = PHYSICS.coyoteMs;
  }
}

const FW_OFF = 48;
const FH_OFF = 64;