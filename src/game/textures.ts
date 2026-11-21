import Phaser from 'phaser';

const FW = 48;
const FH = 64;

interface HeroPose {
  legPhase?: number;
  lean?: number;
  crouch?: number;
  rope?: boolean;
  hurt?: boolean;
  dead?: boolean;
  victory?: boolean;
  armUp?: boolean;
  breathe?: number;
}

function drawHero(g: CanvasRenderingContext2D, ox: number, oy: number, pose: HeroPose): void {
  const cx = ox + FW / 2;
  const baseY = oy + FH - 4;
  const crouch = pose.crouch ?? 0;
  const lean = pose.lean ?? 0;
  const breathe = pose.breathe ?? 0;

  g.save();
  g.translate(cx, baseY);
  if (pose.dead) {
    g.rotate(Math.PI / 2);
    g.translate(0, 10);
  } else {
    g.transform(1, 0, lean * 0.12, 1, 0, 0);
  }

  const skin = '#e8b088';
  const jacket = pose.hurt ? '#cc5544' : '#8a5a30';
  const pants = '#5a4028';
  const hat = '#c4a05a';

  const legPhase = pose.legPhase ?? 0;
  const legSwing = Math.sin(legPhase) * 7;

  if (pose.rope) {
    g.fillStyle = pants;
    g.fillRect(-8, -22, 7, 16);
    g.fillRect(2, -26, 7, 20);
    g.fillStyle = '#3a2a18';
    g.fillRect(-9, -8, 9, 6);
    g.fillRect(1, -8, 9, 6);
  } else {
    g.fillStyle = pants;
    g.fillRect(-9 + legSwing * 0.4, -24 + crouch, 8, 20 - crouch);
    g.fillRect(1 - legSwing * 0.4, -24 + crouch, 8, 20 - crouch);
    g.fillStyle = '#3a2a18';
    g.fillRect(-11 + legSwing, -6, 11, 6);
    g.fillRect(0 - legSwing, -6, 11, 6);
  }

  g.fillStyle = jacket;
  g.fillRect(-11, -44 + crouch + breathe, 22, 22 - crouch);
  g.fillStyle = '#6a4420';
  g.fillRect(-11, -44 + crouch + breathe, 5, 22 - crouch);
  g.fillStyle = '#d4b088';
  g.fillRect(-11, -32 + crouch + breathe, 22, 3);

  g.fillStyle = '#7a4a24';
  g.fillRect(-16, -42 + crouch + breathe, 6, 16);

  if (pose.rope || pose.armUp || pose.victory) {
    g.fillStyle = jacket;
    g.fillRect(6, -56 + crouch, 6, 16);
    g.fillStyle = skin;
    g.fillRect(6, -60 + crouch, 6, 6);
    g.fillRect(-13, -56 + crouch, 6, 16);
    g.fillStyle = skin;
    g.fillRect(-13, -60 + crouch, 6, 6);
  } else {
    const armSwing = Math.sin(legPhase + Math.PI) * 5;
    g.fillStyle = jacket;
    g.fillRect(8, -42 + crouch + breathe + armSwing * 0.3, 6, 14);
    g.fillStyle = skin;
    g.fillRect(8, -30 + crouch + breathe + armSwing * 0.3, 6, 5);
  }

  g.fillStyle = skin;
  g.fillRect(-8, -56 + crouch + breathe, 16, 13);
  g.fillStyle = '#2a1a10';
  g.fillRect(2, -52 + crouch + breathe, 3, 3);
  g.fillStyle = hat;
  g.fillRect(-12, -60 + crouch + breathe, 24, 5);
  g.fillRect(-8, -66 + crouch + breathe, 16, 7);
  g.fillStyle = '#8a6a30';
  g.fillRect(-8, -61 + crouch + breathe, 16, 2);

  if (pose.hurt) {
    g.fillStyle = 'rgba(255,60,40,0.35)';
    g.fillRect(-16, -66, 32, 66);
  }
  g.restore();
}

function buildHeroSheet(scene: Phaser.Scene): void {
  const poses: { name: string; pose: HeroPose }[] = [
    { name: 'idle-0', pose: { breathe: 0 } },
    { name: 'idle-1', pose: { breathe: 1.5 } },
    { name: 'walk-0', pose: { legPhase: 0 } },
    { name: 'walk-1', pose: { legPhase: Math.PI / 2 } },
    { name: 'walk-2', pose: { legPhase: Math.PI } },
    { name: 'walk-3', pose: { legPhase: (3 * Math.PI) / 2 } },
    { name: 'run-0', pose: { legPhase: 0, lean: 1 } },
    { name: 'run-1', pose: { legPhase: Math.PI / 2, lean: 1 } },
    { name: 'run-2', pose: { legPhase: Math.PI, lean: 1 } },
    { name: 'run-3', pose: { legPhase: (3 * Math.PI) / 2, lean: 1 } },
    { name: 'jump', pose: { legPhase: 1.2, armUp: true } },
    { name: 'fall', pose: { legPhase: 2.4, armUp: true } },
    { name: 'land', pose: { crouch: 6 } },
    { name: 'rope-0', pose: { rope: true } },
    { name: 'rope-1', pose: { rope: true, legPhase: Math.PI } },
    { name: 'interact', pose: { armUp: true, lean: 0.5 } },
    { name: 'key', pose: { armUp: true, victory: true } },
    { name: 'hurt', pose: { hurt: true, lean: -0.6 } },
    { name: 'dead', pose: { dead: true } },
    { name: 'victory-0', pose: { victory: true } },
    { name: 'victory-1', pose: { victory: true, breathe: 2 } },
  ];
  const cols = 6;
  const rows = Math.ceil(poses.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * FW;
  canvas.height = rows * FH;
  const g = canvas.getContext('2d')!;
  poses.forEach((p, i) => {
    drawHero(g, (i % cols) * FW, Math.floor(i / cols) * FH, p.pose);
  });
  const texture = scene.textures.addCanvas('hero', canvas);
  if (!texture) return;
  poses.forEach((p, i) => {
    texture.add(p.name, 0, (i % cols) * FW, Math.floor(i / cols) * FH, FW, FH);
  });
}

function gfx(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function createTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('hero')) return;
  buildHeroSheet(scene);

  gfx(scene, 'platform', 48, 24, (g) => {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 48, 24);
    g.fillStyle(0xdddddd, 1).fillRect(0, 0, 48, 6);
    g.fillStyle(0x999999, 1).fillRect(0, 20, 48, 4);
    g.lineStyle(1, 0x777777, 0.6);
    g.strokeRect(0.5, 0.5, 47, 23);
    g.lineBetween(24, 6, 24, 20);
  });

  gfx(scene, 'floor', 48, 60, (g) => {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 48, 60);
    g.fillStyle(0xdddddd, 1).fillRect(0, 0, 48, 8);
    g.fillStyle(0xaaaaaa, 1).fillRect(0, 8, 48, 2);
    g.lineStyle(1, 0x888888, 0.5);
    g.strokeRect(0.5, 0.5, 47, 59);
    g.lineBetween(0, 30, 48, 30);
    g.lineBetween(24, 8, 24, 30);
    g.lineBetween(12, 30, 12, 60);
    g.lineBetween(36, 30, 36, 60);
  });

  gfx(scene, 'spikes', 48, 40, (g) => {
    g.fillStyle(0x888899, 1);
    for (let i = 0; i < 4; i++) {
      g.fillTriangle(i * 12, 40, i * 12 + 6, 4, i * 12 + 12, 40);
    }
    g.fillStyle(0xccccdd, 1);
    for (let i = 0; i < 4; i++) {
      g.fillTriangle(i * 12 + 3, 40, i * 12 + 6, 4, i * 12 + 8, 40);
    }
    g.fillStyle(0x555566, 1).fillRect(0, 36, 48, 4);
  });

  for (let f = 0; f < 2; f++) {
    gfx(scene, `lava-${f}`, 48, 40, (g) => {
      g.fillStyle(0xff4400, 1).fillRect(0, 6, 48, 34);
      g.fillStyle(0xff8800, 1).fillRect(0, 6, 48, 8);
      g.fillStyle(0xffcc00, 1);
      for (let i = 0; i < 4; i++) {
        const bx = i * 12 + ((f * 6) % 12);
        g.fillCircle(bx + 3, 10 + (i % 2) * 3, 3);
      }
      g.fillStyle(0xffee66, 1).fillRect(0, 4, 48, 3);
    });
  }

  gfx(scene, 'rock', 44, 44, (g) => {
    g.fillStyle(0x777788, 1).fillCircle(22, 22, 20);
    g.fillStyle(0x9999aa, 1).fillCircle(16, 16, 8);
    g.fillStyle(0x555566, 1).fillCircle(28, 28, 6);
    g.lineStyle(2, 0x444455, 1).strokeCircle(22, 22, 20);
  });

  gfx(scene, 'blade', 44, 64, (g) => {
    g.fillStyle(0xaaaabb, 1);
    g.fillTriangle(2, 0, 42, 0, 22, 62);
    g.fillStyle(0xddddee, 1);
    g.fillTriangle(12, 0, 32, 0, 22, 50);
    g.fillStyle(0x666677, 1).fillRect(14, 0, 16, 6);
  });

  for (let f = 0; f < 2; f++) {
    gfx(scene, `fire-${f}`, 40, 64, (g) => {
      g.fillStyle(0xff6600, 0.9);
      g.fillTriangle(4, 64, 20, f === 0 ? 2 : 10, 36, 64);
      g.fillStyle(0xffaa00, 0.95);
      g.fillTriangle(10, 64, 20, f === 0 ? 16 : 24, 30, 64);
      g.fillStyle(0xffee66, 1);
      g.fillTriangle(15, 64, 20, f === 0 ? 32 : 40, 25, 64);
    });
  }

  gfx(scene, 'wallblock', 40, 40, (g) => {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 40, 40);
    g.fillStyle(0xcccccc, 1).fillRect(0, 0, 40, 6);
    g.lineStyle(1, 0x888888, 0.7).strokeRect(0.5, 0.5, 39, 39);
    g.lineBetween(0, 20, 40, 20);
    g.lineBetween(20, 0, 20, 20);
    g.lineBetween(10, 20, 10, 40);
    g.lineBetween(30, 20, 30, 40);
  });

  gfx(scene, 'slab', 200, 40, (g) => {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 200, 40);
    g.fillStyle(0xbbbbbb, 1).fillRect(0, 32, 200, 8);
    g.lineStyle(1, 0x888888, 0.6);
    for (let x = 0; x < 200; x += 40) g.lineBetween(x, 0, x, 40);
    g.fillStyle(0x999999, 1);
    for (let x = 10; x < 200; x += 40) g.fillTriangle(x - 6, 40, x, 30, x + 6, 40);
  });

  gfx(scene, 'rope', 8, 32, (g) => {
    g.fillStyle(0xb08840, 1).fillRect(2, 0, 4, 32);
    g.fillStyle(0x8a6828, 1);
    for (let y = 0; y < 32; y += 8) g.fillRect(1, y, 6, 3);
  });

  gfx(scene, 'chest', 44, 36, (g) => {
    g.fillStyle(0x8a5a28, 1).fillRect(2, 10, 40, 24);
    g.fillStyle(0xa06a30, 1).fillRect(2, 4, 40, 10);
    g.fillStyle(0xffcc44, 1).fillRect(18, 8, 8, 20);
    g.fillStyle(0xcc9933, 1).fillRect(2, 13, 40, 3);
    g.lineStyle(1, 0x5a3a18, 1).strokeRect(2, 4, 40, 30);
  });

  gfx(scene, 'chest-open', 44, 36, (g) => {
    g.fillStyle(0x8a5a28, 1).fillRect(2, 14, 40, 20);
    g.fillStyle(0xa06a30, 1).fillRect(2, 0, 40, 8);
    g.fillStyle(0xffee88, 1).fillRect(6, 14, 32, 6);
    g.fillStyle(0x5a3a18, 1).fillRect(6, 20, 32, 10);
  });

  gfx(scene, 'artifact', 32, 36, (g) => {
    g.fillStyle(0xffcc44, 1).fillCircle(16, 14, 10);
    g.fillStyle(0xffee88, 1).fillCircle(13, 11, 4);
    g.fillStyle(0xcc9933, 1).fillRect(10, 24, 12, 8);
    g.fillStyle(0x8a6a20, 1).fillRect(6, 30, 20, 4);
  });

  gfx(scene, 'key', 28, 28, (g) => {
    g.fillStyle(0xffcc44, 1).fillCircle(9, 9, 7);
    g.fillStyle(0x8a6a20, 1).fillCircle(9, 9, 3);
    g.fillStyle(0xffcc44, 1).fillRect(14, 7, 12, 4);
    g.fillRect(22, 11, 3, 5);
    g.fillRect(17, 11, 3, 4);
  });

  gfx(scene, 'door', 64, 110, (g) => {
    g.fillStyle(0x6a5a3a, 1).fillRect(0, 0, 64, 110);
    g.fillStyle(0x8a7a5a, 1).fillRect(6, 6, 52, 104);
    g.fillStyle(0x4a3a2a, 1).fillRect(12, 12, 40, 92);
    g.fillStyle(0xffcc44, 1).fillCircle(32, 40, 8);
    g.fillStyle(0x4a3a2a, 1).fillCircle(32, 40, 4);
    g.fillStyle(0xffcc44, 1);
    g.fillRect(26, 60, 12, 3);
    g.fillRect(26, 70, 12, 3);
    g.fillRect(26, 80, 12, 3);
    g.lineStyle(2, 0x3a2a1a, 1).strokeRect(1, 1, 62, 108);
  });

  gfx(scene, 'door-open', 64, 110, (g) => {
    g.fillStyle(0x6a5a3a, 1).fillRect(0, 0, 64, 110);
    g.fillStyle(0x1a1008, 1).fillRect(8, 6, 48, 104);
    g.fillStyle(0xffcc44, 0.25).fillRect(8, 6, 48, 104);
    g.fillStyle(0x8a7a5a, 1).fillRect(0, 0, 8, 110);
    g.fillRect(56, 0, 8, 110);
  });

  gfx(scene, 'note', 28, 32, (g) => {
    g.fillStyle(0xe8d8a8, 1).fillRect(4, 2, 20, 28);
    g.fillStyle(0xc4b088, 1).fillRect(4, 2, 20, 4);
    g.fillRect(4, 26, 20, 4);
    g.fillStyle(0x6a5a3a, 1);
    for (let y = 10; y < 24; y += 4) g.fillRect(8, y, 12, 1.5);
  });

  for (const state of [0, 1]) {
    gfx(scene, `lever-${state}`, 24, 48, (g) => {
      g.fillStyle(0x666677, 1).fillRect(4, 38, 16, 10);
      g.fillStyle(0x9999aa, 1).fillRect(9, 16, 6, 24);
      g.fillStyle(0xcc4444, 1);
      if (state === 0) {
        g.fillRect(2, 8, 20, 8);
      } else {
        g.fillRect(2, 28, 20, 8);
      }
    });
  }

  gfx(scene, 'mirror', 32, 48, (g) => {
    g.fillStyle(0x8a7a5a, 1).fillRect(12, 36, 8, 12);
    g.fillStyle(0xaaddff, 1).fillCircle(16, 20, 14);
    g.fillStyle(0xffffff, 0.8).fillCircle(11, 15, 5);
    g.lineStyle(2, 0xcc9933, 1).strokeCircle(16, 20, 14);
  });

  gfx(scene, 'symbol-stone', 40, 48, (g) => {
    g.fillStyle(0x8a8a9a, 1).fillRect(2, 4, 36, 40);
    g.fillStyle(0xaaaabb, 1).fillRect(2, 4, 36, 6);
    g.fillStyle(0xffcc44, 1).fillCircle(20, 22, 8);
    g.fillStyle(0x8a8a9a, 1).fillCircle(20, 22, 4);
    g.lineStyle(1, 0x555566, 1).strokeRect(2, 4, 36, 40);
  });

  gfx(scene, 'crystal', 32, 44, (g) => {
    g.fillStyle(0x66ddff, 1).fillTriangle(16, 0, 2, 28, 30, 28);
    g.fillStyle(0xaaeeff, 1).fillTriangle(16, 0, 10, 28, 22, 28);
    g.fillStyle(0x4499cc, 1).fillRect(6, 28, 20, 8);
    g.fillStyle(0xffffff, 0.8).fillTriangle(14, 6, 11, 20, 17, 20);
  });

  gfx(scene, 'pedestal', 60, 40, (g) => {
    g.fillStyle(0x8a8a9a, 1).fillRect(6, 10, 48, 24);
    g.fillStyle(0xaaaabb, 1).fillRect(0, 0, 60, 10);
    g.fillStyle(0x666677, 1).fillRect(0, 34, 60, 6);
    g.fillStyle(0xffcc44, 1).fillRect(24, 16, 12, 3);
  });

  for (const lit of [0, 1]) {
    gfx(scene, `torch-${lit}`, 24, 48, (g) => {
      g.fillStyle(0x6a4a28, 1).fillRect(9, 18, 6, 30);
      g.fillStyle(0x8a6a38, 1).fillRect(5, 14, 14, 6);
      if (lit === 1) {
        g.fillStyle(0xff8800, 1).fillTriangle(6, 14, 12, 0, 18, 14);
        g.fillStyle(0xffcc00, 1).fillTriangle(9, 14, 12, 5, 15, 14);
      }
    });
  }

  gfx(scene, 'gate', 220, 280, (g) => {
    g.fillStyle(0x8a7a5a, 1).fillRect(0, 0, 220, 280);
    g.fillStyle(0x6a5a3a, 1).fillRect(14, 14, 192, 266);
    g.fillStyle(0x4a3a2a, 1).fillRect(28, 28, 76, 252);
    g.fillRect(116, 28, 76, 252);
    g.fillStyle(0xffcc44, 1).fillCircle(110, 120, 16);
    g.fillStyle(0x4a3a2a, 1).fillCircle(110, 120, 9);
    g.fillStyle(0xffcc44, 0.8);
    for (let y = 160; y < 260; y += 24) {
      g.fillRect(44, y, 44, 4);
      g.fillRect(132, y, 44, 4);
    }
    g.lineStyle(3, 0x3a2a1a, 1).strokeRect(2, 2, 216, 276);
  });

  gfx(scene, 'spark', 8, 8, (g) => {
    g.fillStyle(0xffffff, 1).fillCircle(4, 4, 3);
  });

  gfx(scene, 'dust', 10, 10, (g) => {
    g.fillStyle(0xffffff, 0.7).fillCircle(5, 5, 4);
  });

  gfx(scene, 'glyph', 36, 36, (g) => {
    g.fillStyle(0xffcc44, 1);
    g.fillCircle(18, 12, 6);
    g.fillRect(15, 18, 6, 14);
    g.fillRect(8, 22, 20, 4);
  });

  gfx(scene, 'sun', 160, 160, (g) => {
    g.fillStyle(0xffdd66, 0.4).fillCircle(80, 80, 78);
    g.fillStyle(0xffee88, 0.7).fillCircle(80, 80, 58);
    g.fillStyle(0xffffcc, 1).fillCircle(80, 80, 40);
  });

  gfx(scene, 'pyramid', 400, 260, (g) => {
    g.fillStyle(0x3a2a1a, 1).fillTriangle(200, 0, 0, 260, 400, 260);
    g.fillStyle(0x4a3a24, 1).fillTriangle(200, 0, 200, 260, 400, 260);
    g.lineStyle(1, 0x2a1c10, 0.6);
    for (let y = 40; y < 260; y += 30) {
      const half = (y / 260) * 200;
      g.lineBetween(200 - half, y, 200 + half, y);
    }
  });
}

export function createHeroAnimations(scene: Phaser.Scene): void {
  if (scene.anims.exists('hero-idle')) return;
  const anims: [string, string[], number, number][] = [
    ['hero-idle', ['idle-0', 'idle-1'], 3, -1],
    ['hero-walk', ['walk-0', 'walk-1', 'walk-2', 'walk-3'], 8, -1],
    ['hero-run', ['run-0', 'run-1', 'run-2', 'run-3'], 12, -1],
    ['hero-rope', ['rope-0', 'rope-1'], 5, -1],
    ['hero-victory', ['victory-0', 'victory-1'], 4, -1],
  ];
  for (const [key, frames, rate, repeat] of anims) {
    scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: 'hero', frame: f })),
      frameRate: rate,
      repeat,
    });
  }
  for (const single of ['jump', 'fall', 'land', 'interact', 'key', 'hurt', 'dead']) {
    scene.anims.create({ key: `hero-${single}`, frames: [{ key: 'hero', frame: single }], frameRate: 1 });
  }
}