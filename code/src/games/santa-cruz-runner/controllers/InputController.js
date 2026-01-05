/**
 * InputController - Gestion des entrées utilisateur
 *
 * Gère le clavier, la souris et la manette via GamepadManager
 */

import Phaser from 'phaser';
import { gamepadManager, GamepadButton } from '../../../core/GamepadManager.js';

export default class InputController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Touches
    this.cursors = null;
    this.spaceKey = null;
    this.escKey = null;

    // État des boutons
    this.jumpPressed = false;
    this.jumpJustPressed = false;
    this.previousJumpState = false;

    // Callbacks
    this.onJump = null;
    this.onEscape = null;

    // Touch/Click
    this.pointerDown = false;
    this.previousPointerState = false;

    // État manette pour détection "just pressed"
    this.previousGamepadJumpState = false;
  }

  /**
   * Initialise les contrôles
   */
  initialize() {
    // Curseurs
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // Espace
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Échap
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Événement d'échappement
    this.escKey.on('down', () => {
      if (this.onEscape) {
        this.onEscape();
      }
    });

    // Événements de clic/touch
    this.scene.input.on('pointerdown', () => {
      this.pointerDown = true;
    });

    this.scene.input.on('pointerup', () => {
      this.pointerDown = false;
    });
  }

  /**
   * Met à jour l'état des inputs
   */
  update() {
    // Sauvegarder l'état précédent
    this.previousJumpState = this.jumpPressed;
    this.previousPointerState = this.pointerDown;

    // Calculer l'état actuel du saut
    this.jumpPressed = this.isJumpKeyDown();

    // Détecter si le saut vient d'être pressé
    this.jumpJustPressed = this.jumpPressed && !this.previousJumpState;

    // Vérifier aussi le clic/touch
    if (this.pointerDown && !this.previousPointerState) {
      this.jumpJustPressed = true;
    }

    // Vérifier le saut manette avec détection "just pressed"
    const gamepadJumpPressed = this.isGamepadJumpPressed();
    if (gamepadJumpPressed && !this.previousGamepadJumpState) {
      this.jumpJustPressed = true;
    }
    this.previousGamepadJumpState = gamepadJumpPressed;

    // Vérifier bouton B pour escape
    this.checkGamepadEscape();
  }

  /**
   * Vérifie si une touche de saut est enfoncée (clavier uniquement)
   * @returns {boolean}
   */
  isJumpKeyDown() {
    return this.spaceKey?.isDown || this.cursors?.up?.isDown;
  }

  /**
   * Vérifie si le saut vient d'être pressé
   * @returns {boolean}
   */
  isJumpJustPressed() {
    return this.jumpJustPressed;
  }

  /**
   * Vérifie si un bouton de saut est pressé sur la manette
   * @returns {boolean}
   */
  isGamepadJumpPressed() {
    // Bouton A, X, ou D-pad haut pour sauter
    return gamepadManager.isButtonPressed(GamepadButton.A, 0) ||
           gamepadManager.isButtonPressed(GamepadButton.X, 0) ||
           gamepadManager.getDirection(0) === 'up';
  }

  /**
   * Vérifie le bouton B pour escape/retour
   */
  checkGamepadEscape() {
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      if (this.onEscape) {
        this.onEscape();
      }
    }
  }

  /**
   * Définit le callback de saut
   * @param {Function} callback
   */
  setJumpCallback(callback) {
    this.onJump = callback;
  }

  /**
   * Définit le callback d'échappement
   * @param {Function} callback
   */
  setEscapeCallback(callback) {
    this.onEscape = callback;
  }

  /**
   * Vérifie si le jeu doit démarrer (n'importe quelle action)
   * @returns {boolean}
   */
  isStartPressed() {
    return this.jumpJustPressed || this.pointerDown;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    if (this.spaceKey) {
      this.spaceKey.destroy();
    }
    if (this.escKey) {
      this.escKey.destroy();
    }
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
  }
}
