/**
 * InputController - Gestion des entrées utilisateur
 *
 * Gère le clavier, la souris et la manette
 */

import Phaser from 'phaser';

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
  }

  /**
   * Vérifie si une touche de saut est enfoncée
   * @returns {boolean}
   */
  isJumpKeyDown() {
    return this.spaceKey?.isDown ||
           this.cursors?.up?.isDown ||
           this.checkGamepadJump();
  }

  /**
   * Vérifie si le saut vient d'être pressé
   * @returns {boolean}
   */
  isJumpJustPressed() {
    return this.jumpJustPressed;
  }

  /**
   * Vérifie le bouton de saut sur la manette
   * @returns {boolean}
   */
  checkGamepadJump() {
    const gamepad = this.scene.input.gamepad?.getPad(0);
    if (!gamepad) return false;

    // Bouton A (index 0) ou X (index 2) ou croix directionnelle haut
    return gamepad.buttons[0]?.pressed ||
           gamepad.buttons[2]?.pressed ||
           (gamepad.axes[1] < -0.5);
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
