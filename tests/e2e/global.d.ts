import type { GameSession } from '../../src/core/GameSession';
import type Phaser from 'phaser';

declare global {
  interface Window {
    __pyramid: {
      session: GameSession;
      game: Phaser.Game;
    };
  }
}

export {};