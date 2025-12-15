/**
 * MenuScene - Scene du menu de démarrage
 *
 * Affiche un écran de démarrage avec le titre et les instructions
 * Supporte clavier, souris et manette
 */

import Phaser from 'phaser';
import { ASSETS_PATH } from '../../config/GameConfig.js';
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
    this.load.image('dot', `${ASSETS_PATH}/dot.png`);
    this.load.image('pill', `${ASSETS_PATH}/pill16.png`);
    this.load.image('tiles', `${ASSETS_PATH}/pacman-tiles.png`);

    this.load.spritesheet('pacman', `${ASSETS_PATH}/pacman.png`, {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('ghosts', `${ASSETS_PATH}/ghosts32.png`, {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.tilemapTiledJSON('map', `${ASSETS_PATH}/pacman-map.json`);
  }

  /**
   * Création de la scène
   */
  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.canStart = true;

    // Fond noir
    this.cameras.main.setBackgroundColor('#000000');

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
   * Crée le titre animé
   */
  createTitle(centerX, centerY) {
    const titleText = this.add.text(centerX, centerY - 120, 'PAC-MAN', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 4
    });
    titleText.setOrigin(0.5);

    // Animation du titre
    this.tweens.add({
      targets: titleText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée les sprites décoratifs
   */
  createDecorativeSprites(centerX, centerY) {
    // Pacman
    const pacmanSprite = this.add.sprite(centerX - 100, centerY, 'pacman', 0);
    pacmanSprite.setScale(2);

    if (!this.anims.exists('menu-munch')) {
      this.anims.create({
        key: 'menu-munch',
        frames: this.anims.generateFrameNumbers('pacman', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1,
        yoyo: true
      });
    }
    pacmanSprite.play('menu-munch');

    // Fantômes
    const ghostFrames = [0, 2, 4, 6];
    const ghostPositions = [
      { x: centerX + 40, y: centerY },
      { x: centerX + 80, y: centerY },
      { x: centerX + 120, y: centerY },
      { x: centerX + 160, y: centerY }
    ];

    ghostPositions.forEach((pos, index) => {
      const ghost = this.add.sprite(pos.x, pos.y, 'ghosts', ghostFrames[index]);
      ghost.setScale(2);

      this.tweens.add({
        targets: ghost,
        y: pos.y - 10,
        duration: 600 + index * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  /**
   * Crée les instructions
   */
  createInstructions(centerX, centerY) {
    const instructionsText = this.add.text(
      centerX,
      centerY + 80,
      'APPUYEZ SUR ESPACE / A\nOU CLIQUEZ POUR JOUER',
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        fill: '#00ffff',
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
      centerY + 150,
      'Fleches / Joystick pour se deplacer\nESC / B pour quitter',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#888888',
        align: 'center'
      }
    );
    controlsText.setOrigin(0.5);
  }

  /**
   * Crée l'affichage du high score
   */
  createHighScore(centerX, centerY) {
    const highScoreText = this.add.text(centerX, centerY - 60, 'HIGH SCORE: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      fill: '#ff00ff'
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
    this.scene.start('GameScene');
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
