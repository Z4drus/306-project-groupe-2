/**
 * InputController - Contrôleur des entrées utilisateur
 *
 * Gère les entrées clavier ET manette pour Pacman
 */

import Phaser from 'phaser';
import gamepadManager, { GamepadButton } from '../../../core/GamepadManager.js';

export default class InputController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {number} playerIndex - Index du joueur (0 ou 1)
   */
  constructor(scene, playerIndex = 0) {
    this.scene = scene;
    this.playerIndex = playerIndex;

    // Créer les curseurs clavier
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Touche ESC
    this.escKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Callbacks
    this.onEscape = null;

    // Dernière direction de la manette (pour éviter les répétitions)
    this.lastGamepadDirection = null;
  }

  /**
   * Définit le callback pour la touche ESC / bouton B
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
   * Retourne la direction demandée par l'utilisateur (clavier OU manette)
   * @returns {number} Direction Phaser ou NONE
   */
  getRequestedDirection() {
    // Priorité au clavier
    const keyboardDir = this.getKeyboardDirection();
    if (keyboardDir !== Phaser.NONE) {
      return keyboardDir;
    }

    // Sinon manette
    return this.getGamepadDirection();
  }

  /**
   * Retourne la direction du clavier
   * @returns {number} Direction Phaser ou NONE
   */
  getKeyboardDirection() {
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
   * Retourne la direction de la manette
   * @returns {number} Direction Phaser ou NONE
   */
  getGamepadDirection() {
    const direction = gamepadManager.getDirection(this.playerIndex);

    if (!direction) {
      this.lastGamepadDirection = null;
      return Phaser.NONE;
    }

    // Convertir en direction Phaser
    let phaserDir = Phaser.NONE;
    switch (direction) {
      case 'left':
        phaserDir = Phaser.LEFT;
        break;
      case 'right':
        phaserDir = Phaser.RIGHT;
        break;
      case 'up':
        phaserDir = Phaser.UP;
        break;
      case 'down':
        phaserDir = Phaser.DOWN;
        break;
    }

    this.lastGamepadDirection = phaserDir;
    return phaserDir;
  }

  /**
   * Vérifie si une direction est pressée (clavier OU manette)
   * @param {number} direction - Direction à vérifier
   * @returns {boolean}
   */
  isDirectionPressed(direction) {
    // Clavier
    if (this.isKeyboardDirectionPressed(direction)) {
      return true;
    }

    // Manette
    return this.getGamepadDirection() === direction;
  }

  /**
   * Vérifie si une direction clavier est pressée
   * @param {number} direction - Direction à vérifier
   * @returns {boolean}
   */
  isKeyboardDirectionPressed(direction) {
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
   * Vérifie si le bouton A (confirmer) est pressé
   * @returns {boolean}
   */
  isConfirmPressed() {
    return gamepadManager.isButtonPressed(GamepadButton.A, this.playerIndex);
  }

  /**
   * Vérifie si le bouton B (retour) est pressé
   * @returns {boolean}
   */
  isCancelPressed() {
    return gamepadManager.isButtonPressed(GamepadButton.B, this.playerIndex);
  }

  /**
   * Vérifie si le bouton Start est pressé
   * @returns {boolean}
   */
  isStartPressed() {
    return gamepadManager.isButtonPressed(GamepadButton.START, this.playerIndex);
  }

  /**
   * Vérifie si le bouton Select est pressé
   * @returns {boolean}
   */
  isSelectPressed() {
    return gamepadManager.isButtonPressed(GamepadButton.SELECT, this.playerIndex);
  }

  /**
   * Vérifie les boutons de la manette pour les actions de menu
   * À appeler dans update() pour détecter les pressions
   */
  checkGamepadButtons() {
    // Bouton B = ESC (retour)
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, this.playerIndex)) {
      if (this.onEscape) {
        this.onEscape();
      }
    }

    // Bouton Start = Pause (à implémenter si besoin)
    if (gamepadManager.isButtonJustPressed(GamepadButton.START, this.playerIndex)) {
      // Pause non implémentée pour l'instant
    }
  }

  /**
   * Met à jour le contrôleur (à appeler chaque frame)
   */
  update() {
    this.checkGamepadButtons();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.escKey.removeAllListeners();
  }
}
