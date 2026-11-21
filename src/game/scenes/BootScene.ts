import Phaser from 'phaser';
import { createTextures, createHeroAnimations } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createTextures(this);
    createHeroAnimations(this);
    this.scene.start('Menu');
  }
}