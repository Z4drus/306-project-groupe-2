/**
 * InputController - Contrôleur des entrées utilisateur
 *
 * Gère les entrées clavier et les transmet au contrôleur Pacman
 */

import Phaser from 'phaser';

export default class InputController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Créer les curseurs
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Touche ESC
    this.escKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Callbacks
    this.onEscape = null;
  }

  /**
   * Définit le callback pour la touche ESC
   * @param {Function} callback
   */
  setEscapeCallback(callback) {
    this.onEscape = callback;
    this.escKey.on('down', () => {
      if (this.onEscape) {
        this.onEscape();
      }
    });
  }

  /**
   * Retourne la direction demandée par l'utilisateur
   * @returns {number} Direction Phaser ou NONE
   */
  getRequestedDirection() {
    if (this.cursors.left.isDown) {
      return Phaser.LEFT;
    }
    if (this.cursors.right.isDown) {
      return Phaser.RIGHT;
    }
    if (this.cursors.up.isDown) {
      return Phaser.UP;
    }
    if (this.cursors.down.isDown) {
      return Phaser.DOWN;
    }
    return Phaser.NONE;
  }

  /**
   * Vérifie si une direction est pressée
   * @param {number} direction - Direction à vérifier
   * @returns {boolean}
   */
  isDirectionPressed(direction) {
    switch (direction) {
      case Phaser.LEFT:
        return this.cursors.left.isDown;
      case Phaser.RIGHT:
        return this.cursors.right.isDown;
      case Phaser.UP:
        return this.cursors.up.isDown;
      case Phaser.DOWN:
        return this.cursors.down.isDown;
      default:
        return false;
    }
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.escKey.removeAllListeners();
  }
}
