/**
 * MenuScene - Scène du menu de démarrage de Wallbreaker
 *
 * Affiche un écran de démarrage avec le titre et les instructions
 * Supporte clavier, souris et manette
 */

import Phaser from 'phaser';
import { ASSETS_PATH, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig.js';
import gamepadManager, { GamepadButton } from '../../../../core/GamepadManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.canStart = true;
  }

  /**
   * Préchargement des assets
   */
  preload() {
    this.load.image('paddle', `${ASSETS_PATH}/paddle.png`);
    this.load.image('ball', `${ASSETS_PATH}/balle.png`);
    this.load.image('brick', `${ASSETS_PATH}/brik3.png`);
    this.load.image('background', `${ASSETS_PATH}/background2.png`);
  }

  /**
   * Création de la scène
   */
  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.canStart = true;

    // Fond
    this.createBackground();

    // Titre
    this.createTitle(centerX, centerY);

    // Sprites décoratifs
    this.createDecorativeSprites(centerX, centerY);

    // Instructions
    this.createInstructions(centerX, centerY);

    // High Score
    this.createHighScore(centerX, centerY);

    // Event listeners clavier/souris
    this.setupInputListeners();
  }

  /**
   * Boucle de mise à jour - vérifie les entrées manette
   */
  update() {
    if (!this.canStart) return;

    // Bouton A ou START = Démarrer
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      this.startGame();
    }

    // Bouton B = Retour menu arcade
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.returnToMenu();
    }
  }

  /**
   * Crée le fond animé
   */
  createBackground() {
    // Fond coloré
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // Grille de briques décoratives en arrière-plan
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        if (Math.random() > 0.3) {
          const brick = this.add.image(
            80 + col * 60,
            80 + row * 35,
            'brick'
          );
          brick.setDisplaySize(50, 20);
          brick.setAlpha(0.15);
          brick.setTint(Phaser.Display.Color.RandomRGB().color);

          // Animation subtile
          this.tweens.add({
            targets: brick,
            alpha: 0.05,
            duration: 2000 + Math.random() * 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: Math.random() * 1000
          });
        }
      }
    }
  }

  /**
   * Crée le titre animé
   */
  createTitle(centerX, centerY) {
    const titleText = this.add.text(centerX, centerY - 120, 'WALLBREAKER', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.PRIMARY,
      stroke: COLORS.SECONDARY,
      strokeThickness: 4
    });
    titleText.setOrigin(0.5);

    // Animation du titre
    this.tweens.add({
      targets: titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Sous-titre
    const subtitleText = this.add.text(centerX, centerY - 70, 'Cassez tous les murs !', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: COLORS.TEXT_DARK
    });
    subtitleText.setOrigin(0.5);
  }

  /**
   * Crée les sprites décoratifs
   */
  createDecorativeSprites(centerX, centerY) {
    // Paddle
    const paddleSprite = this.add.image(centerX, centerY + 20, 'paddle');
    paddleSprite.setDisplaySize(100, 20);

    // Animation du paddle
    this.tweens.add({
      targets: paddleSprite,
      x: centerX - 80,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Balle qui suit le paddle
    const ballSprite = this.add.image(centerX, centerY - 10, 'ball');
    ballSprite.setDisplaySize(16, 16);

    // Animation de la balle - rebond
    this.tweens.add({
      targets: ballSprite,
      y: centerY - 60,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Bounce.easeOut'
    });

    this.tweens.add({
      targets: ballSprite,
      x: centerX - 80,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Briques décoratives
    const brickColors = [0x00ff00, 0xffff00, 0xff8800, 0xff0000];
    for (let i = 0; i < 4; i++) {
      const brick = this.add.image(centerX - 75 + i * 50, centerY - 100, 'brick');
      brick.setDisplaySize(45, 18);
      brick.setTint(brickColors[i]);

      this.tweens.add({
        targets: brick,
        y: centerY - 110,
        duration: 600 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Crée les instructions
   */
  createInstructions(centerX, centerY) {
    const instructionsText = this.add.text(
      centerX,
      centerY + 100,
      'APPUYEZ SUR ESPACE / A\nOU CLIQUEZ POUR JOUER',
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        fill: COLORS.ACCENT,
        align: 'center'
      }
    );
    instructionsText.setOrigin(0.5);

    // Clignotement
    this.tweens.add({
      targets: instructionsText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Contrôles
    const controlsText = this.add.text(
      centerX,
      centerY + 170,
      'Souris / Fleches / Joystick pour deplacer le paddle\nESC / B pour quitter',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: COLORS.TEXT_DARK,
        align: 'center'
      }
    );
    controlsText.setOrigin(0.5);
  }

  /**
   * Crée l'affichage du high score
   */
  createHighScore(centerX, centerY) {
    const highScoreText = this.add.text(centerX, centerY + 220, 'MEILLEUR SCORE: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: COLORS.SECONDARY
    });
    highScoreText.setOrigin(0.5);
  }

  /**
   * Configure les listeners d'entrée clavier/souris
   */
  setupInputListeners() {
    this.input.keyboard.once('keydown-SPACE', () => {
      this.startGame();
    });

    this.input.once('pointerdown', () => {
      this.startGame();
    });

    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.once('down', () => {
      this.returnToMenu();
    });
  }

  /**
   * Lance le jeu
   */
  startGame() {
    if (!this.canStart) return;
    this.canStart = false;

    // Transition avec fondu
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Retourne au menu principal de l'arcade
   */
  returnToMenu() {
    if (!this.canStart) return;
    this.canStart = false;

    const onGameOver = this.game.registry.get('onGameOver');
    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(0);
    }
    this.scene.stop();
    this.game.destroy(true);
  }
}
