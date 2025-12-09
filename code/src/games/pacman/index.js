/**
 * Pacman Game - Entry Point
 *
 * Jeu Pacman classique avec fantômes intelligents et système de score
 */

import Phaser from 'phaser';
import GameScene from './GameScene.js';

/**
 * Démarre le jeu Pacman
 * @param {HTMLElement} container - Container DOM pour le canvas
 * @param {Function} onGameOver - Callback appelé à la fin du jeu avec le score
 * @returns {Phaser.Game} Instance du jeu Phaser
 */
export function startPacman(container = null, onGameOver = null) {
  const config = {
    type: Phaser.AUTO,
    width: 448,
    height: 496,
    parent: container || 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  const game = new Phaser.Game(config);

  // Passer le callback onGameOver à la scène
  if (onGameOver) {
    game.registry.set('onGameOver', onGameOver);
  }

  return game;
}
