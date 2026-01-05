/**
 * MenuScene - Scène du menu principal
 *
 * Affiche le titre, les instructions et permet de lancer le jeu
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ASSETS_PATH, COLORS } from '../../config/GameConfig.js';
import cursorManager from '../../../../core/CursorManager.js';
import { gamepadManager, GamepadButton } from '../../../../core/GamepadManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.keyboardCallbacks = {};
    this.canStart = false;
  }

  /**
   * Précharge les assets
   */
  preload() {
    // Charger les assets du menu
    this.load.image('snow-bg', `${ASSETS_PATH}/snow-bg.png`);
    this.load.image('snowflake', `${ASSETS_PATH}/snowflake.png`);
    this.load.image('logo', `${ASSETS_PATH}/game-logo.png`);

    // Charger les assets du jeu pour éviter le chargement pendant le jeu
    this.load.image('platform', `${ASSETS_PATH}/ground.png`);
    this.load.spritesheet('santa-running', `${ASSETS_PATH}/santa-running.png`, {
      frameWidth: 37,
      frameHeight: 52
    });

    // Audio
    this.load.audio('jump-sound', `${ASSETS_PATH}/jump-sound.mp3`);
    this.load.audio('music', `${ASSETS_PATH}/drivin-home-low.mp3`);
    this.load.audio('game-over-sound', `${ASSETS_PATH}/ho-ho-ho.mp3`);

    // Notifier la progression
    const onLoadProgress = this.registry.get('onLoadProgress');
    if (onLoadProgress) {
      this.load.on('progress', (value) => {
        onLoadProgress(value * 100, `Chargement: ${Math.round(value * 100)}%`);
      });
    }
  }

  /**
   * Crée la scène
   */
  create() {
    // Afficher le curseur custom de l'arcade dans le menu
    cursorManager.show();

    // Fond dégradé
    this.createBackground();

    // Particules de neige
    this.createSnowParticles();

    // Logo du jeu
    this.createLogo();

    // Instructions
    this.createInstructions();

    // Meilleur score
    this.createBestScore();

    // Bouton de démarrage
    this.createStartButton();

    // Gestion des inputs
    this.setupInputs();

    // Notifier que le chargement est terminé
    const onLoadProgress = this.registry.get('onLoadProgress');
    if (onLoadProgress) {
      onLoadProgress(100, 'Pret !');
    }

    // Permettre le démarrage après un court délai (évite les inputs accidentels)
    this.time.delayedCall(300, () => {
      this.canStart = true;
    });
  }

  /**
   * Crée le fond
   */
  createBackground() {
    const graphics = this.add.graphics();

    // Dégradé de nuit
    const topColor = Phaser.Display.Color.HexStringToColor(COLORS.SKY_TOP);
    const bottomColor = Phaser.Display.Color.HexStringToColor(COLORS.SKY_BOTTOM);

    for (let y = 0; y < GAME_HEIGHT; y++) {
      const ratio = y / GAME_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        topColor, bottomColor, 100, ratio * 100
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      graphics.fillRect(0, y, GAME_WIDTH, 1);
    }

    // Image de fond avec faible opacité
    const bg = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'snow-bg');
    bg.setAlpha(0.2);
  }

  /**
   * Crée les particules de neige
   */
  createSnowParticles() {
    this.add.particles(0, -50, 'snowflake', {
      x: { min: 0, max: GAME_WIDTH },
      lifespan: 8000,
      speedY: { min: 50, max: 100 },
      speedX: { min: -20, max: 20 },
      scale: { min: 0.1, max: 0.3 },
      alpha: { min: 0.3, max: 0.7 },
      frequency: 150,
      blendMode: 'ADD'
    });
  }

  /**
   * Crée le logo
   */
  createLogo() {
    // Titre texte stylisé
    const title = this.add.text(GAME_WIDTH / 2, 120, 'SANTA CRUZ', {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#c41e3a',
      strokeThickness: 8
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, 180, 'RUNNER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700',
      stroke: '#8b4513',
      strokeThickness: 6
    });
    subtitle.setOrigin(0.5);

    // Animation du titre
    this.tweens.add({
      targets: [title, subtitle],
      y: '+=10',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Étoiles décoratives
    for (let i = 0; i < 5; i++) {
      const star = this.add.graphics();
      star.fillStyle(0xffd700, 0.8);
      this.drawStar(star, 0, 0, 5, 10, 5);
      star.x = 100 + i * 150;
      star.y = 80 + Math.sin(i) * 20;

      this.tweens.add({
        targets: star,
        angle: 360,
        duration: 3000 + i * 500,
        repeat: -1
      });
    }
  }

  /**
   * Dessine une étoile
   */
  drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }

    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Crée les instructions
   */
  createInstructions() {
    const instructionsBox = this.add.container(GAME_WIDTH / 2, 320);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(-180, -80, 360, 160, 12);
    instructionsBox.add(bg);

    // Titre
    const title = this.add.text(0, -55, 'COMMENT JOUER', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffd700'
    });
    title.setOrigin(0.5);
    instructionsBox.add(title);

    // Instructions
    const instructions = [
      'ESPACE / CLIC / BOUTON A : Sauter',
      'Double saut possible !',
      'Collecte les cadeaux',
      'Ne tombe pas !'
    ];

    instructions.forEach((text, index) => {
      const line = this.add.text(0, -20 + index * 30, text, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff'
      });
      line.setOrigin(0.5);
      instructionsBox.add(line);
    });
  }

  /**
   * Crée l'affichage du meilleur score
   */
  createBestScore() {
    const bestScore = this.registry.get('bestScore') || 0;

    if (bestScore > 0) {
      const text = this.add.text(GAME_WIDTH / 2, 430, `Meilleur score: ${bestScore}`, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
      });
      text.setOrigin(0.5);
    }
  }

  /**
   * Crée le bouton de démarrage
   */
  createStartButton() {
    // Bouton
    const button = this.add.container(GAME_WIDTH / 2, 520);

    const bg = this.add.graphics();
    bg.fillStyle(0xc41e3a, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 30);
    bg.lineStyle(4, 0xffd700);
    bg.strokeRoundedRect(-120, -30, 240, 60, 30);
    button.add(bg);

    const text = this.add.text(0, 0, '▶ JOUER', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff'
    });
    text.setOrigin(0.5);
    button.add(text);

    // Interaction
    button.setInteractive(new Phaser.Geom.Rectangle(-120, -30, 240, 60), Phaser.Geom.Rectangle.Contains);

    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 100
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 100
      });
    });

    button.on('pointerdown', () => {
      this.startGame();
    });

    // Animation du bouton
    this.tweens.add({
      targets: button,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Configure les inputs
   */
  setupInputs() {
    // Stocker les callbacks pour pouvoir les retirer plus tard
    this.keyboardCallbacks.space = () => this.startGame();
    this.keyboardCallbacks.enter = () => this.startGame();
    this.keyboardCallbacks.esc = () => this.backToArcade();

    // Espace pour démarrer
    this.input.keyboard.on('keydown-SPACE', this.keyboardCallbacks.space);

    // Entrée pour démarrer
    this.input.keyboard.on('keydown-ENTER', this.keyboardCallbacks.enter);

    // ESC pour quitter
    this.input.keyboard.on('keydown-ESC', this.keyboardCallbacks.esc);

    // Écouter les événements de nettoyage
    this.events.on('shutdown', this.shutdown, this);
    this.events.on('destroy', this.shutdown, this);
  }

  /**
   * Nettoyage lors de l'arrêt de la scène
   */
  shutdown() {
    // Retirer les listeners keyboard
    if (this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown-SPACE', this.keyboardCallbacks.space);
      this.input.keyboard.off('keydown-ENTER', this.keyboardCallbacks.enter);
      this.input.keyboard.off('keydown-ESC', this.keyboardCallbacks.esc);
    }

    // Retirer les listeners d'événements
    this.events.off('shutdown', this.shutdown, this);
    this.events.off('destroy', this.shutdown, this);
  }

  /**
   * Démarre le jeu
   */
  startGame() {
    if (!this.canStart) return;
    this.canStart = false;

    // Cacher le curseur pour le jeu
    cursorManager.hide();

    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', {
        score: 0,
        lives: 3,
        level: 1
      });
    });
  }

  /**
   * Retourne au menu principal de l'arcade
   */
  backToArcade() {
    if (!this.canStart) return;
    this.canStart = false;

    // La destruction du jeu est gérée par ArcadeStore.backToMenu()
    window.Alpine?.store('arcade')?.backToMenu();
  }

  /**
   * Mise à jour - vérifie les inputs manette
   */
  update() {
    if (!this.canStart) return;

    // Bouton A ou START pour jouer
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      this.startGame();
    }

    // Bouton B pour retourner à l'arcade
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.backToArcade();
    }
  }
}
