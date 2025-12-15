/**
 * GameOverScene - Ecran de fin de partie
 *
 * Affiche le score final et propose de rejouer ou retourner au menu
 * Supporte clavier, souris et manette
 */

import Phaser from 'phaser';
import gamepadManager, { GamepadButton } from '../../../../core/GamepadManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.canAct = true;
  }

  /**
   * Initialisation avec les données de la partie
   * @param {Object} data - Données passées depuis GameScene
   */
  init(data) {
    this.finalScore = data.score || 0;
  }

  /**
   * Création de la scène
   */
  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.canAct = true;

    // Fond noir
    this.cameras.main.setBackgroundColor('#000000');

    // Titre
    this.createTitle(centerX, centerY);

    // Score
    this.createScoreDisplay(centerX, centerY);

    // Boutons
    this.createButtons(centerX, centerY);

    // Instructions
    this.createInstructions(centerX, centerY);

    // Raccourcis clavier
    this.setupKeyboardShortcuts();
  }

  /**
   * Boucle de mise à jour - vérifie les entrées manette
   */
  update() {
    if (!this.canAct) return;

    // Bouton A ou START = Rejouer
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      this.restartGame();
    }

    // Bouton B = Retour menu arcade
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.returnToMenu();
    }
  }

  /**
   * Crée le titre animé
   */
  createTitle(centerX, centerY) {
    const gameOverText = this.add.text(centerX, centerY - 140, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ff0000',
      stroke: '#660000',
      strokeThickness: 4
    });
    gameOverText.setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée l'affichage du score
   */
  createScoreDisplay(centerX, centerY) {
    const scoreLabel = this.add.text(centerX, centerY - 60, 'SCORE FINAL', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: '#888888'
    });
    scoreLabel.setOrigin(0.5);

    const scoreText = this.add.text(centerX, centerY - 20, `${this.finalScore}`, {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 3
    });
    scoreText.setOrigin(0.5);

    this.tweens.add({
      targets: scoreText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée les boutons
   */
  createButtons(centerX, centerY) {
    // Bouton Rejouer
    this.replayButton = this.add.text(centerX, centerY + 60, '► REJOUER', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: '#00ff00',
      stroke: '#006600',
      strokeThickness: 2
    });
    this.replayButton.setOrigin(0.5);
    this.replayButton.setInteractive({ useHandCursor: true });
    this.replayButton.on('pointerdown', () => this.restartGame());
    this.replayButton.on('pointerover', () => this.replayButton.setScale(1.1));
    this.replayButton.on('pointerout', () => this.replayButton.setScale(1));

    // Bouton Menu
    this.menuButton = this.add.text(centerX, centerY + 110, '◄ MENU', {
      fontSize: '20px',
      fontFamily: 'Arial Black, Arial',
      fill: '#00ffff',
      stroke: '#006666',
      strokeThickness: 2
    });
    this.menuButton.setOrigin(0.5);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.on('pointerdown', () => this.returnToMenu());
    this.menuButton.on('pointerover', () => this.menuButton.setScale(1.1));
    this.menuButton.on('pointerout', () => this.menuButton.setScale(1));
  }

  /**
   * Crée les instructions clavier/manette
   */
  createInstructions(centerX, centerY) {
    const instructionsText = this.add.text(
      centerX,
      centerY + 160,
      'R / A / ESPACE = Rejouer    ESC / B = Menu',
      {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: '#666666'
      }
    );
    instructionsText.setOrigin(0.5);
  }

  /**
   * Configure les raccourcis clavier
   */
  setupKeyboardShortcuts() {
    this.input.keyboard.once('keydown-R', () => {
      this.restartGame();
    });

    this.input.keyboard.once('keydown-ESC', () => {
      this.returnToMenu();
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.restartGame();
    });
  }

  /**
   * Relance une nouvelle partie
   */
  restartGame() {
    if (!this.canAct) return;
    this.canAct = false;

    // Réinitialiser le score et le niveau dans l'interface externe
    const onScoreUpdate = this.game.registry.get('onScoreUpdate');
    if (onScoreUpdate) {
      onScoreUpdate(0, 3, 1);
    }

    // Redémarrer la scène de jeu avec les valeurs initiales
    this.scene.start('GameScene', { level: 1, score: 0, lives: 3 });
  }

  /**
   * Retourne au menu principal de l'arcade
   */
  returnToMenu() {
    if (!this.canAct) return;
    this.canAct = false;

    const onGameOver = this.game.registry.get('onGameOver');
    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(this.finalScore);
    }
    this.scene.stop();
    this.game.destroy(true);
  }
}
