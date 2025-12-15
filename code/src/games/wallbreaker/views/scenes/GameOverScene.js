/**
 * GameOverScene - Écran de fin de partie Wallbreaker
 *
 * Affiche le score final et propose de rejouer ou retourner au menu
 * Supporte clavier, souris et manette
 */

import Phaser from 'phaser';
import { COLORS, ASSETS_PATH } from '../../config/GameConfig.js';
import gamepadManager, { GamepadButton } from '../../../../core/GamepadManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.canAct = false;
    this.selectedButton = 0;
    this.buttons = [];
  }

  /**
   * Initialisation avec les données de la partie
   * @param {Object} data - Score et niveau final
   */
  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
  }

  /**
   * Préchargement des assets
   */
  preload() {
    this.load.image('brick', `${ASSETS_PATH}/brik3.png`);
    this.load.image('ball', `${ASSETS_PATH}/balle.png`);
  }

  /**
   * Création de la scène
   */
  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.canAct = false;
    this.selectedButton = 0;
    this.buttons = [];

    // Fond
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // Éléments décoratifs en arrière-plan
    this.createBackgroundEffects();

    // Titre
    this.createTitle(centerX, centerY);

    // Score et niveau
    this.createScoreDisplay(centerX, centerY);

    // Boutons
    this.createButtons(centerX, centerY);

    // Instructions
    this.createInstructions(centerX, centerY);

    // Raccourcis clavier
    this.setupKeyboardShortcuts();

    // Activer les interactions après un délai
    this.time.delayedCall(800, () => {
      this.canAct = true;
      this.updateButtonSelection();
    });

    // Notifier le système de l'arcade du game over
    const onGameOver = this.game.registry.get('onGameOver');
    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(this.finalScore);
    }
  }

  /**
   * Boucle de mise à jour
   */
  update() {
    if (!this.canAct) return;

    // Navigation manette - Haut/Bas
    const direction = gamepadManager.getDirection(0);
    if (direction === 'up' && this.selectedButton > 0) {
      this.selectedButton--;
      this.updateButtonSelection();
    } else if (direction === 'down' && this.selectedButton < this.buttons.length - 1) {
      this.selectedButton++;
      this.updateButtonSelection();
    }

    // Bouton A = Valider
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      this.activateSelectedButton();
    }

    // Bouton B = Retour menu
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.returnToMenu();
    }
  }

  /**
   * Crée les effets d'arrière-plan
   */
  createBackgroundEffects() {
    // Briques qui tombent lentement
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(i * 300, () => {
        this.createFallingBrick();
      });
    }

    // Balles qui rebondissent
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 500, () => {
        this.createBouncingBall();
      });
    }
  }

  /**
   * Crée une brique qui tombe
   */
  createFallingBrick() {
    const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
    const colors = [0x4ade80, 0xfbbf24, 0xf97316, 0xef4444];
    const color = Phaser.Math.RND.pick(colors);

    const brick = this.add.image(x, -30, 'brick');
    brick.setDisplaySize(40, 15);
    brick.setTint(color);
    brick.setAlpha(0.25);
    brick.setDepth(-1);

    this.tweens.add({
      targets: brick,
      y: this.cameras.main.height + 30,
      angle: Phaser.Math.Between(-90, 90),
      duration: Phaser.Math.Between(4000, 7000),
      ease: 'Linear',
      onComplete: () => {
        brick.destroy();
        if (this.scene.isActive()) {
          this.createFallingBrick();
        }
      }
    });
  }

  /**
   * Crée une balle qui rebondit
   */
  createBouncingBall() {
    const ball = this.add.image(
      Phaser.Math.Between(100, this.cameras.main.width - 100),
      Phaser.Math.Between(100, this.cameras.main.height - 100),
      'ball'
    );
    ball.setDisplaySize(12, 12);
    ball.setAlpha(0.15);
    ball.setDepth(-1);

    // Animation de rebond aléatoire
    const animateBall = () => {
      if (!this.scene.isActive() || !ball.active) return;

      this.tweens.add({
        targets: ball,
        x: Phaser.Math.Between(50, this.cameras.main.width - 50),
        y: Phaser.Math.Between(50, this.cameras.main.height - 50),
        duration: Phaser.Math.Between(1500, 3000),
        ease: 'Linear',
        onComplete: animateBall
      });
    };

    animateBall();
  }

  /**
   * Crée le titre animé
   */
  createTitle(centerX, centerY) {
    const gameOverText = this.add.text(centerX, centerY - 150, 'GAME OVER', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ef4444',
      stroke: '#7f1d1d',
      strokeThickness: 4
    });
    gameOverText.setOrigin(0.5);

    // Animation de pulsation
    this.tweens.add({
      targets: gameOverText,
      alpha: 0.7,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée l'affichage du score et niveau
   */
  createScoreDisplay(centerX, centerY) {
    // Score
    const scoreLabel = this.add.text(centerX, centerY - 70, 'SCORE FINAL', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: COLORS.TEXT_DARK
    });
    scoreLabel.setOrigin(0.5);

    const scoreText = this.add.text(centerX, centerY - 35, this.finalScore.toString(), {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.ACCENT,
      stroke: '#0d9488',
      strokeThickness: 3
    });
    scoreText.setOrigin(0.5);

    // Animation d'apparition du score
    scoreText.setScale(0);
    this.tweens.add({
      targets: scoreText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 300,
      ease: 'Back.easeOut'
    });

    // Pulsation continue
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: scoreText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Niveau atteint
    const levelText = this.add.text(centerX, centerY + 15, `Niveau atteint: ${this.finalLevel}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: COLORS.SECONDARY
    });
    levelText.setOrigin(0.5);
    levelText.setAlpha(0);

    this.tweens.add({
      targets: levelText,
      alpha: 1,
      duration: 400,
      delay: 600
    });
  }

  /**
   * Crée les boutons
   */
  createButtons(centerX, centerY) {
    // Bouton Rejouer
    const replayButton = this.createButton(
      centerX,
      centerY + 80,
      'REJOUER',
      COLORS.ACCENT,
      '#0d9488',
      () => this.restartGame()
    );
    this.buttons.push(replayButton);

    // Bouton Menu
    const menuButton = this.createButton(
      centerX,
      centerY + 130,
      'MENU',
      COLORS.SECONDARY,
      '#b45309',
      () => this.returnToMenu()
    );
    this.buttons.push(menuButton);
  }

  /**
   * Crée un bouton interactif
   */
  createButton(x, y, text, color, strokeColor, callback) {
    const button = this.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: color,
      stroke: strokeColor,
      strokeThickness: 2
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.setAlpha(0);

    // Animation d'apparition
    this.tweens.add({
      targets: button,
      alpha: 1,
      duration: 300,
      delay: 800 + this.buttons.length * 100
    });

    // Events souris
    button.on('pointerdown', callback);
    button.on('pointerover', () => {
      this.selectedButton = this.buttons.indexOf(button);
      this.updateButtonSelection();
    });

    button.callback = callback;
    return button;
  }

  /**
   * Met à jour la sélection visuelle des boutons
   */
  updateButtonSelection() {
    this.buttons.forEach((button, index) => {
      if (index === this.selectedButton) {
        button.setScale(1.15);
        button.setAlpha(1);
      } else {
        button.setScale(1);
        button.setAlpha(0.7);
      }
    });
  }

  /**
   * Active le bouton sélectionné
   */
  activateSelectedButton() {
    const button = this.buttons[this.selectedButton];
    if (button && button.callback) {
      button.callback();
    }
  }

  /**
   * Crée les instructions
   */
  createInstructions(centerX, centerY) {
    const instructionsText = this.add.text(
      centerX,
      centerY + 190,
      'ESPACE / A = Valider    ESC / B = Menu    ↑↓ = Naviguer',
      {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: COLORS.TEXT_DARK
      }
    );
    instructionsText.setOrigin(0.5);
    instructionsText.setAlpha(0);

    this.tweens.add({
      targets: instructionsText,
      alpha: 0.7,
      duration: 500,
      delay: 1200
    });
  }

  /**
   * Configure les raccourcis clavier
   */
  setupKeyboardShortcuts() {
    // Espace ou R = Rejouer
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.canAct) this.activateSelectedButton();
    });

    this.input.keyboard.on('keydown-R', () => {
      if (this.canAct) this.restartGame();
    });

    // ESC = Menu
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.canAct) this.returnToMenu();
    });

    // Navigation clavier
    this.input.keyboard.on('keydown-UP', () => {
      if (this.canAct && this.selectedButton > 0) {
        this.selectedButton--;
        this.updateButtonSelection();
      }
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.canAct && this.selectedButton < this.buttons.length - 1) {
        this.selectedButton++;
        this.updateButtonSelection();
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.canAct) this.activateSelectedButton();
    });
  }

  /**
   * Redémarre le jeu
   */
  restartGame() {
    if (!this.canAct) return;
    this.canAct = false;

    // Réinitialiser le score dans l'interface externe
    const onScoreUpdate = this.game.registry.get('onScoreUpdate');
    if (onScoreUpdate) {
      onScoreUpdate(0, 3, 1);
    }

    // Transition
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', {
        level: 1,
        score: 0,
        lives: 3
      });
    });
  }

  /**
   * Retourne au menu principal de l'arcade
   */
  returnToMenu() {
    if (!this.canAct) return;
    this.canAct = false;

    // Transition
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.game.destroy(true);

      // Retourner au menu arcade
      if (window.Alpine?.store('arcade')) {
        window.Alpine.store('arcade').backToMenu();
      }
    });
  }
}
