/**
 * GameOverScene - Ecran de fin de partie
 *
 * Affiche le score final et propose de rejouer ou retourner au menu
 */

import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
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
    this.createButton(centerX, centerY + 60, 'REJOUER', '#00ff00', () => this.restartGame());
    this.createButton(centerX, centerY + 120, 'MENU', '#00ffff', () => this.returnToMenu());
  }

  /**
   * Crée un bouton interactif
   */
  createButton(x, y, text, color, callback) {
    const button = this.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2,
      padding: { x: 20, y: 10 }
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.2);
      button.setStyle({ fill: '#ffffff' });
    });

    button.on('pointerout', () => {
      button.setScale(1);
      button.setStyle({ fill: color });
    });

    button.on('pointerdown', callback);

    return button;
  }

  /**
   * Crée les instructions clavier
   */
  createInstructions(centerX, centerY) {
    const instructionsText = this.add.text(
      centerX,
      centerY + 180,
      'R = Rejouer    ESC = Menu',
      {
        fontSize: '14px',
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
    const onScoreUpdate = this.game.registry.get('onScoreUpdate');
    if (onScoreUpdate) {
      onScoreUpdate(0, 3, 1);
    }
    this.scene.start('GameScene');
  }

  /**
   * Retourne au menu principal de l'arcade
   */
  returnToMenu() {
    const onGameOver = this.game.registry.get('onGameOver');
    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(this.finalScore);
    }
    this.scene.stop();
    this.game.destroy(true);
  }
}
