import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from './core/GameConfig';
import { GameSession } from './core/GameSession';
import { GAME_DATA } from './rooms/rooms-data';
import { createStorage } from './save/IndexedDBStorage';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { GameScene } from './game/scenes/GameScene';
import { EndingScene } from './game/scenes/EndingScene';
import { UIController } from './ui/UIController';
import './ui/ui.css';

const session = new GameSession(GAME_DATA, createStorage());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0d0812',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravity },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, EndingScene],
});

new UIController(session, game);

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__pyramid = { session, game };
}

window.addEventListener('beforeunload', () => {
  if (session.isStarted) void session.save();
});