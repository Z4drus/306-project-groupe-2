/**
 * InputController - Contrôleur des entrées utilisateur
 *
 * Gère les entrées clavier, souris et manette pour Wallbreaker.
 * Utilise l'API Pointer Lock pour capturer la souris pendant le jeu.
 */

import Phaser from 'phaser';
import gamepadManager, { GamepadButton, GamepadAxis } from '../../../core/GamepadManager.js';
import { PLAY_AREA } from '../config/GameConfig.js';

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
    this.mouseX = PLAY_AREA.x + PLAY_AREA.width / 2; // Position initiale au centre
    this.mouseDeltaX = 0; // Delta de mouvement pour le pointer lock
    this.useMouseControl = false;
    this.isPointerLocked = false;

    // Sensibilité du mouvement souris (ajustable)
    this.mouseSensitivity = 1.0;

    // Callbacks
    this.onEscape = null;
    this.onLaunch = null;

    // Référence au canvas pour le pointer lock
    this.canvas = null;

    // Bound handlers pour pouvoir les retirer
    this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
    this.boundPointerLockError = this.handlePointerLockError.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
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

    // Récupérer le canvas pour le pointer lock
    this.canvas = this.scene.game.canvas;

    // Configurer les listeners pour le Pointer Lock API
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('pointerlockerror', this.boundPointerLockError);

    // Listener pour les mouvements souris (fonctionne avec et sans pointer lock)
    document.addEventListener('mousemove', this.boundMouseMove);

    // Clic pour lancer ET activer le pointer lock
    this.scene.input.on('pointerdown', () => {
      // Demander le pointer lock si pas déjà actif
      if (!this.isPointerLocked) {
        this.requestPointerLock();
      }

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
   * Gère les mouvements de souris (avec ou sans pointer lock)
   * @param {MouseEvent} event - Événement souris
   */
  handleMouseMove(event) {
    this.useMouseControl = true;

    if (this.isPointerLocked) {
      // Mode pointer lock : utiliser le mouvement relatif
      this.mouseDeltaX = event.movementX * this.mouseSensitivity;
    } else {
      // Mode normal : convertir la position absolue en position de jeu
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.scene.game.config.width / rect.width;
      this.mouseX = (event.clientX - rect.left) * scaleX;
      this.mouseDeltaX = 0;
    }
  }

  /**
   * Demande le verrouillage du pointeur
   */
  requestPointerLock() {
    if (this.canvas && !this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  /**
   * Libère le verrouillage du pointeur
   */
  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  /**
   * Gère le changement d'état du pointer lock
   */
  handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  /**
   * Gère les erreurs du pointer lock
   */
  handlePointerLockError() {
    console.warn('Pointer Lock error - falling back to normal mouse control');
    this.isPointerLocked = false;
  }

  /**
   * Vérifie si le pointer lock est actif
   * @returns {boolean}
   */
  hasPointerLock() {
    return this.isPointerLocked;
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
   * Retourne la position X de la souris si contrôle souris actif (mode sans pointer lock)
   * @returns {number|null}
   */
  getMouseX() {
    if (this.useMouseControl && !this.isPointerLocked) {
      return this.mouseX;
    }
    return null;
  }

  /**
   * Retourne le delta de mouvement de la souris (mode pointer lock)
   * @returns {number} Delta X du mouvement, 0 si pas de mouvement
   */
  getMouseDeltaX() {
    if (this.useMouseControl && this.isPointerLocked) {
      const delta = this.mouseDeltaX;
      this.mouseDeltaX = 0; // Consommer le delta
      return delta;
    }
    return 0;
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
    // Libérer le pointer lock
    this.exitPointerLock();

    // Retirer les listeners du document
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    document.removeEventListener('pointerlockerror', this.boundPointerLockError);
    document.removeEventListener('mousemove', this.boundMouseMove);

    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
    this.scene.input.off('pointerdown');
  }
}
