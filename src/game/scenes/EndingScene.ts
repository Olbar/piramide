import Phaser from 'phaser';
import type { GameSession } from '../../core/GameSession';
import type { EndingType } from '../../achievements/EndingSelector';
import { audio } from '../AudioManager';

const ENDING_TEXTS: Record<EndingType, { title: string; text: string; color: number }> = {
  normal: {
    title: 'ТЫ ВЫБРАЛСЯ! Проклятие снято!',
    text: 'Врата рухнули за спиной. Пирамида погрузилась в песок, унеся свои тайны с собой. Ты свободен — но сколько ещё тайн осталось во тьме?',
    color: 0xffcc44,
  },
  good: {
    title: 'ТЫ ВЫБРАЛСЯ! Проклятие снято!',
    text: 'Двенадцать фрагментов древней надписи сложились в истину: пирамида была не гробницей, а хранилищем знаний. Ты вынес свет преданий в мир.',
    color: 0x88ddff,
  },
  true: {
    title: 'ИСТИННОЕ ПРОБУЖДЕНИЕ!',
    text: 'Все 120 тайн раскрыты. Кристалл вспыхнул истинным светом — и пирамида не утонула, а растворилась в рассвете, освободив душу фараона. Легенды о проклятии больше не расскажут.',
    color: 0xffee99,
  },
};

export class EndingScene extends Phaser.Scene {
  private session!: GameSession;
  private ending: EndingType = 'normal';
  private done = false;
  private skipOff: (() => void) | null = null;

  constructor() {
    super('Ending');
  }

  init(data: { session: GameSession; ending: EndingType }): void {
    this.session = data.session;
    this.ending = data.ending;
    this.done = false;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    audio.stopMusic();
    this.cameras.main.setBackgroundColor('#0d0812');

    this.add.rectangle(w / 2, h / 2, w, h, 0x241a30);
    const gateX = w * 0.62;
    const gateY = h * 0.55;
    const gateLeft = this.add.rectangle(gateX - 56, gateY, 110, 300, 0x6b5a3a);
    const gateRight = this.add.rectangle(gateX + 56, gateY, 110, 300, 0x6b5a3a);
    gateLeft.setStrokeStyle(3, 0xffcc44, 0.6);
    gateRight.setStrokeStyle(3, 0xffcc44, 0.6);
    const slot = this.add.circle(gateX, gateY - 60, 14, 0x66ddff, 0.4);
    const hero = this.add.sprite(w * 0.3, h * 0.72, 'hero', 'idle-0');
    hero.play('hero-idle');
    hero.setScale(1.4);
    const crystal = this.add.image(hero.x + 30, hero.y - 20, 'crystal');
    crystal.setScale(0.9);

    const glyphs: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 8; i++) {
      const g = this.add.image(gateX - 200 + i * 58, gateY - 190, 'glyph');
      g.setTint(ENDING_TEXTS[this.ending].color);
      g.setAlpha(0);
      glyphs.push(g);
    }

    this.time.delayedCall(600, () => {
      hero.play('hero-key', true);
      this.tweens.add({
        targets: crystal,
        x: gateX, y: gateY - 60,
        duration: 1400,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          slot.setFillStyle(0x66ddff, 1);
          audio.play('secret');
          this.quake(glyphs, gateLeft, gateRight, hero, crystal);
        },
      });
    });

    this.skipOff = this.session.events.on('ending-skip', () => this.finish());
    this.events.once('shutdown', () => this.skipOff?.());
  }

  private quake(
    glyphs: Phaser.GameObjects.Image[],
    gateLeft: Phaser.GameObjects.Rectangle,
    gateRight: Phaser.GameObjects.Rectangle,
    hero: Phaser.GameObjects.Sprite,
    crystal: Phaser.GameObjects.Image,
  ): void {
    this.cameras.main.shake(1600, 0.008);
    audio.play('rock');
    const dust = this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: 200 },
      lifespan: 1600,
      speedY: { min: 60, max: 180 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 40,
      tint: 0xaa9977,
    });
    glyphs.forEach((g, i) => {
      this.time.delayedCall(200 + i * 160, () => {
        this.tweens.add({ targets: g, alpha: 1, duration: 300 });
        audio.play('lever');
      });
    });
    this.time.delayedCall(1900, () => {
      dust.destroy();
      audio.play('door');
      this.tweens.add({ targets: gateLeft, x: gateLeft.x - 150, duration: 1400, ease: 'Sine.easeIn' });
      this.tweens.add({ targets: gateRight, x: gateRight.x + 150, duration: 1400, ease: 'Sine.easeIn' });
      const light = this.add.circle(gateLeft.x + 112, gateLeft.y, 10, ENDING_TEXTS[this.ending].color, 0.9);
      this.tweens.add({ targets: light, scale: 60, alpha: 0.85, duration: 1600 });
      crystal.destroy();
      this.time.delayedCall(1700, () => this.desert(hero, light));
    });
  }

  private desert(hero: Phaser.GameObjects.Sprite, light: Phaser.GameObjects.Arc): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.tweens.add({ targets: light, alpha: 0, duration: 800, onComplete: () => light.destroy() });
    this.cameras.main.setBackgroundColor('#2a1a3a');
    const sky = this.add.rectangle(w / 2, h / 2, w, h, 0x3a2a4a);
    sky.setDepth(-1);
    const sun = this.add.image(w * 0.72, h + 80, 'sun');
    sun.setDepth(0);
    const pyramid = this.add.image(w * 0.42, h * 0.72, 'pyramid');
    pyramid.setDisplaySize(640, 380);
    pyramid.setTint(0x9a7f5a);
    pyramid.setDepth(1);
    const sand = this.add.rectangle(w / 2, h - 30, w, 140, 0xc2a26b);
    sand.setDepth(2);
    hero.setDepth(3);
    hero.setPosition(w * 0.42, h - 90);
    hero.setScale(1.2);
    hero.play('hero-run');
    hero.setFlipX(false);
    audio.startMusic();
    audio.play('victory');
    this.tweens.add({ targets: sun, y: h * 0.3, duration: 4000, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: sky,
      fillColor: 0xd88a5a,
      duration: 4000,
    });
    this.tweens.add({
      targets: hero,
      x: w + 80,
      duration: 4200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        hero.play('hero-victory');
        this.sinkPyramid(pyramid, sand);
      },
    });
  }

  private sinkPyramid(pyramid: Phaser.GameObjects.Image, sand: Phaser.GameObjects.Rectangle): void {
    const dust = this.add.particles(pyramid.x, sand.y - 40, 'dust', {
      x: { min: -300, max: 300 },
      lifespan: 2500,
      speedY: { min: -40, max: -10 },
      speedX: { min: -30, max: 30 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 30,
      tint: 0xd8b878,
    });
    dust.setDepth(4);
    audio.play('rock');
    this.cameras.main.shake(2600, 0.003);
    this.tweens.add({
      targets: pyramid,
      y: pyramid.y + 400,
      duration: 3200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        dust.destroy();
        this.time.delayedCall(700, () => this.finish());
      },
    });
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.session.events.emit('ending-complete', {
      ending: this.ending,
      texts: ENDING_TEXTS[this.ending],
    });
  }
}