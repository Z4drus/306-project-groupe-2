/**
 * GameScene - Scène principale du jeu
 *
 * Gère la boucle de jeu via le GameController
 */

import Phaser from 'phaser';
import GameController from '../../controllers/GameController.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.gameController = null;
    this.initialData = null;
  }

  /**
   * Initialise la scène avec les données de départ
   * @param {Object} data - Données initiales (score, lives, level)
   */
  init(data) {
    this.initialData = data || {
      score: 0,
      lives: 3,
      level: 1
    };

    // Écouter les événements de nettoyage
    this.events.on('shutdown', this.shutdown, this);
    this.events.on('destroy', this.shutdown, this);
  }

  /**
   * Précharge les assets (déjà fait dans MenuScene)
   */
  preload() {
    // Créer le contrôleur pour le preload
    this.gameController = new GameController(this, this.initialData);
    this.gameController.preload();
  }

  /**
   * Crée la scène
   */
  create() {
    // Fondu depuis le noir
    this.cameras.main.fadeIn(500);

    // Initialiser le contrôleur de jeu
    this.gameController.initialize();
  }

  /**
   * Boucle de mise à jour
   * @param {number} time - Temps total écoulé
   * @param {number} delta - Delta depuis la dernière frame
   */
  update(time, delta) {
    if (this.gameController) {
      this.gameController.update(time, delta);
    }
  }

  /**
   * Nettoyage lors de l'arrêt de la scène
   */
  shutdown() {
    // Nettoyer le contrôleur de jeu
    if (this.gameController) {
      this.gameController.destroy();
      this.gameController = null;
    }

    // Retirer les listeners d'événements
    this.events.off('shutdown', this.shutdown, this);
    this.events.off('destroy', this.shutdown, this);
  }
}
