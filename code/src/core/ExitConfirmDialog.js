/**
 * ExitConfirmDialog - Dialogue de confirmation de sortie
 *
 * Affiche une popup de confirmation quand le joueur veut quitter
 * une partie en cours. Supporte clavier et manette.
 */

import gamepadManager, { GamepadButton } from './GamepadManager.js';

export default class ExitConfirmDialog {
  /**
   * @param {Phaser.Scene} scene - Scene Phaser
   * @param {Object} options - Options de configuration
   * @param {Function} options.onConfirm - Callback si confirmé
   * @param {Function} options.onCancel - Callback si annulé
   * @param {string} options.message - Message principal
   * @param {string} options.subMessage - Sous-message
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onConfirm = options.onConfirm || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.message = options.message || 'Quitter la partie ?';
    this.subMessage = options.subMessage || 'Ta progression ne sera pas sauvegardee';

    this.isVisible = false;
    this.selectedButton = 1; // 0 = Oui, 1 = Non (Non par défaut)
    this.canAct = false;

    // Elements UI
    this.overlay = null;
    this.container = null;
    this.messageText = null;
    this.subMessageText = null;
    this.yesButton = null;
    this.noButton = null;

    // Inputs
    this.escKey = null;
    this.enterKey = null;
    this.spaceKey = null;
    this.upKey = null;
    this.downKey = null;
    this.leftKey = null;
    this.rightKey = null;
  }

  /**
   * Affiche le dialogue
   */
  show() {
    if (this.isVisible) return;
    this.isVisible = true;
    this.selectedButton = 1; // Non par défaut
    this.canAct = false;

    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    // Overlay semi-transparent
    this.overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.75
    );
    this.overlay.setDepth(1000);

    // Container du dialogue
    this.container = this.scene.add.rectangle(
      centerX,
      centerY,
      400,
      200,
      0x1a1a2e
    );
    this.container.setStrokeStyle(3, 0xff6b35);
    this.container.setDepth(1001);

    // Message principal
    this.messageText = this.scene.add.text(centerX, centerY - 50, this.message, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffffff',
      align: 'center'
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setDepth(1002);

    // Sous-message
    this.subMessageText = this.scene.add.text(centerX, centerY - 15, this.subMessage, {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#888888',
      align: 'center'
    });
    this.subMessageText.setOrigin(0.5);
    this.subMessageText.setDepth(1002);

    // Bouton Oui
    this.yesButton = this.createButton(centerX - 70, centerY + 45, 'OUI', () => this.confirm());

    // Bouton Non
    this.noButton = this.createButton(centerX + 70, centerY + 45, 'NON', () => this.cancel());

    // Instructions
    const instructionsText = this.scene.add.text(
      centerX,
      centerY + 85,
      '← → pour choisir    A/ENTREE = Valider    B/ESC = Annuler',
      {
        fontSize: '11px',
        fontFamily: 'Arial',
        fill: '#666666'
      }
    );
    instructionsText.setOrigin(0.5);
    instructionsText.setDepth(1002);
    this.instructionsText = instructionsText;

    // Setup inputs clavier
    this.setupKeyboardInputs();

    // Mise à jour visuelle
    this.updateButtonSelection();

    // Activer après un court délai pour éviter les inputs accidentels
    this.scene.time.delayedCall(200, () => {
      this.canAct = true;
    });
  }

  /**
   * Crée un bouton interactif
   */
  createButton(x, y, text, callback) {
    const button = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      padding: { x: 20, y: 10 }
    });
    button.setOrigin(0.5);
    button.setDepth(1002);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      if (this.canAct) callback();
    });

    button.on('pointerover', () => {
      this.selectedButton = text === 'OUI' ? 0 : 1;
      this.updateButtonSelection();
    });

    button.callback = callback;
    return button;
  }

  /**
   * Configure les inputs clavier
   */
  setupKeyboardInputs() {
    const keyboard = this.scene.input.keyboard;

    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.escKey.on('down', () => {
      if (this.canAct && this.isVisible) this.cancel();
    });

    this.enterKey.on('down', () => {
      if (this.canAct && this.isVisible) this.activateSelected();
    });

    this.spaceKey.on('down', () => {
      if (this.canAct && this.isVisible) this.activateSelected();
    });

    this.leftKey.on('down', () => {
      if (this.canAct && this.isVisible) {
        this.selectedButton = 0;
        this.updateButtonSelection();
      }
    });

    this.rightKey.on('down', () => {
      if (this.canAct && this.isVisible) {
        this.selectedButton = 1;
        this.updateButtonSelection();
      }
    });
  }

  /**
   * Met à jour la sélection du gamepad (à appeler dans update)
   */
  updateGamepad() {
    if (!this.isVisible || !this.canAct) return;

    // Navigation gauche/droite
    const direction = gamepadManager.getDirection(0);
    if (direction === 'left' && this.selectedButton !== 0) {
      this.selectedButton = 0;
      this.updateButtonSelection();
    } else if (direction === 'right' && this.selectedButton !== 1) {
      this.selectedButton = 1;
      this.updateButtonSelection();
    }

    // Bouton A = Valider
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0)) {
      this.activateSelected();
    }

    // Bouton B = Annuler
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.cancel();
    }
  }

  /**
   * Met à jour l'affichage des boutons
   */
  updateButtonSelection() {
    if (this.yesButton) {
      this.yesButton.setScale(this.selectedButton === 0 ? 1.2 : 1);
      this.yesButton.setColor(this.selectedButton === 0 ? '#00ff00' : '#ffffff');
    }
    if (this.noButton) {
      this.noButton.setScale(this.selectedButton === 1 ? 1.2 : 1);
      this.noButton.setColor(this.selectedButton === 1 ? '#ff6b35' : '#ffffff');
    }
  }

  /**
   * Active le bouton sélectionné
   */
  activateSelected() {
    if (this.selectedButton === 0) {
      this.confirm();
    } else {
      this.cancel();
    }
  }

  /**
   * Confirme la sortie
   */
  confirm() {
    if (!this.canAct) return;
    this.hide();
    this.onConfirm();
  }

  /**
   * Annule la sortie
   */
  cancel() {
    if (!this.canAct) return;
    this.hide();
    this.onCancel();
  }

  /**
   * Cache le dialogue
   */
  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;

    // Supprimer les éléments UI
    const elements = [
      this.overlay,
      this.container,
      this.messageText,
      this.subMessageText,
      this.yesButton,
      this.noButton,
      this.instructionsText
    ];

    elements.forEach(el => {
      if (el) el.destroy();
    });

    // Supprimer les listeners clavier
    if (this.escKey) this.escKey.removeAllListeners();
    if (this.enterKey) this.enterKey.removeAllListeners();
    if (this.spaceKey) this.spaceKey.removeAllListeners();
    if (this.leftKey) this.leftKey.removeAllListeners();
    if (this.rightKey) this.rightKey.removeAllListeners();
  }

  /**
   * Retourne true si le dialogue est visible
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Détruit le dialogue
   */
  destroy() {
    this.hide();
  }
}
