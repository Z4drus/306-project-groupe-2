/**
 * InputController - Contrôleur des entrées utilisateur
 *
 * Gère les entrées clavier, souris et manette pour Wallbreaker
 */

import Phaser from 'phaser';
import gamepadManager, { GamepadButton, GamepadAxis } from '../../../core/GamepadManager.js';

export default class InputController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Touches clavier
    this.cursors = null;
    this.spaceKey = null;
    this.escKey = null;

    // État de la souris
    this.mouseX = 0;
    this.useMouseControl = false;

    // Callbacks
    this.onEscape = null;
    this.onLaunch = null;
  }

  /**
   * Initialise les contrôles
   */
  initialize() {
    // Créer les curseurs
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // Touche espace pour lancer
    this.spaceKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Touche ESC pour quitter
    this.escKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Suivre la souris
    this.scene.input.on('pointermove', (pointer) => {
      this.mouseX = pointer.x;
      this.useMouseControl = true;
    });

    // Clic pour lancer
    this.scene.input.on('pointerdown', () => {
      if (this.onLaunch) {
        this.onLaunch();
      }
    });

    // Configuration de la touche ESC
    this.escKey.on('down', () => {
      if (this.onEscape) {
        this.onEscape();
      }
    });
  }

  /**
   * Retourne la direction horizontale demandée (valeur analogique)
   * @returns {number} Valeur entre -1 et 1 (0 = neutre)
   */
  getHorizontalDirection() {
    // Priorité: Clavier > Manette > Souris

    // Vérifier le clavier (valeurs discrètes)
    if (this.cursors.left.isDown) {
      this.useMouseControl = false;
      return -1;
    }
    if (this.cursors.right.isDown) {
      this.useMouseControl = false;
      return 1;
    }

    // Vérifier le joystick gauche de la manette (valeur analogique)
    const gamepadAxis = gamepadManager.getAxis(GamepadAxis.LEFT_X, 0);
    const deadzone = 0.15;
    if (Math.abs(gamepadAxis) > deadzone) {
      this.useMouseControl = false;
      // Retourner la valeur analogique pour un contrôle fluide
      return gamepadAxis;
    }

    // Vérifier aussi le D-Pad (valeurs discrètes)
    const dpadDir = gamepadManager.getDpadDirection(0);
    if (dpadDir === 'left') {
      this.useMouseControl = false;
      return -1;
    }
    if (dpadDir === 'right') {
      this.useMouseControl = false;
      return 1;
    }

    return 0;
  }

  /**
   * Retourne la position X de la souris si contrôle souris actif
   * @returns {number|null}
   */
  getMouseX() {
    if (this.useMouseControl) {
      return this.mouseX;
    }
    return null;
  }

  /**
   * Vérifie si l'utilisateur veut lancer la balle
   * @returns {boolean}
   */
  isLaunchPressed() {
    // Espace clavier
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      return true;
    }

    // Bouton A ou Start de la manette
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      return true;
    }

    return false;
  }

  /**
   * Vérifie si l'utilisateur veut quitter
   * @returns {boolean}
   */
  isEscapePressed() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      return true;
    }

    // Bouton B de la manette
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      return true;
    }

    return false;
  }

  /**
   * Définit le callback d'échappement
   * @param {Function} callback
   */
  setEscapeCallback(callback) {
    this.onEscape = callback;
  }

  /**
   * Définit le callback de lancement
   * @param {Function} callback
   */
  setLaunchCallback(callback) {
    this.onLaunch = callback;
  }

  /**
   * Vérifie les boutons de la manette (à appeler dans update)
   */
  checkGamepadButtons() {
    // Bouton B = ESC (retour/quitter)
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      if (this.onEscape) {
        this.onEscape();
      }
    }
  }

  /**
   * Met à jour le contrôleur (à appeler chaque frame)
   */
  update() {
    this.checkGamepadButtons();
  }

  /**
   * Nettoie les contrôles
   */
  destroy() {
    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerdown');
  }
}
