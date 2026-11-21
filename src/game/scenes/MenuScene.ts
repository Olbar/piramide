import Phaser from 'phaser';
import { audio } from '../AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a1026');
    const sky = this.add.rectangle(w / 2, h / 2, w, h, 0x2a1a3a);
    sky.setDepth(0);
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.6),
        Phaser.Math.Between(1, 2), 0xffeecc, Phaser.Math.FloatBetween(0.2, 0.8),
      );
      this.tweens.add({ targets: star, alpha: 0.1, duration: Phaser.Math.Between(800, 2400), yoyo: true, repeat: -1 });
    }
    const moon = this.add.circle(w * 0.78, h * 0.2, 46, 0xf5e6c8, 0.9);
    this.add.circle(w * 0.78, h * 0.2, 70, 0xf5e6c8, 0.12);
    const pyramid = this.add.image(w / 2, h * 0.78, 'pyramid');
    pyramid.setDisplaySize(760, 420);
    pyramid.setTint(0x6b5a8a);
    const sand = this.add.rectangle(w / 2, h - 40, w, 120, 0x8a6f4d);
    sand.setDepth(2);
    const glow = this.add.circle(w / 2, h * 0.52, 20, 0x66ddff, 0.5);
    this.tweens.add({ targets: glow, alpha: 0.15, scale: 1.8, duration: 1400, yoyo: true, repeat: -1 });
    this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: w },
      y: { min: h * 0.5, max: h },
      lifespan: 7000,
      speedX: { min: 10, max: 40 },
      speedY: { min: -6, max: 2 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 300,
      tint: 0xd8b878,
    });
    this.tweens.add({ targets: moon, y: h * 0.18, duration: 6000, yoyo: true, repeat: -1 });
    audio.startMusic();
  }
}