/**
 * GameScene - Scène principale du jeu Wallbreaker
 *
 * Orchestre le GameController et gère le cycle de vie de la scène
 */

import Phaser from 'phaser';
import GameController from '../../controllers/GameController.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.gameController = null;
  }

  /**
   * Initialisation de la scène avec les données
   * @param {Object} data - Données passées (level, score, lives)
   */
  init(data) {
    this.initialData = {
      level: data.level || 1,
      score: data.score || 0,
      lives: data.lives !== undefined ? data.lives : 3
    };
  }

  /**
   * Préchargement des assets
   */
  preload() {
    // Créer le contrôleur et lui déléguer le preload
    this.gameController = new GameController(this, this.initialData);
    this.gameController.preload();
  }

  /**
   * Création de la scène
   */
  create() {
    // Transition avec fondu entrant
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Initialiser le contrôleur
    this.gameController.initialize();
  }

  /**
   * Boucle principale
   */
  update() {
    if (this.gameController) {
      this.gameController.update();
    }
  }

  /**
   * Nettoyage lors de la destruction de la scène
   */
  shutdown() {
    if (this.gameController) {
      this.gameController.destroy();
      this.gameController = null;
    }
  }
}
