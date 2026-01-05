/**
 * GameOverScene - Scène de fin de partie
 *
 * Affiche le score final et permet de rejouer ou quitter
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ASSETS_PATH, COLORS } from '../../config/GameConfig.js';
import cursorManager from '../../../../core/CursorManager.js';
import { gamepadManager, GamepadButton } from '../../../../core/GamepadManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.finalScore = 0;
    this.finalLevel = 1;
    this.keyboardCallbacks = {};

    // Navigation manette
    this.buttons = [];
    this.selectedButtonIndex = 0;
    this.canAct = false;
    this.lastDirection = null;
  }

  /**
   * Initialise la scène avec les données de fin
   * @param {Object} data - Données (score, level)
   */
  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
  }

  /**
   * Crée la scène
   */
  create() {
    // Réafficher le curseur custom de l'arcade
    cursorManager.show();

    // Fond
    this.createBackground();

    // Neige
    this.createSnowParticles();

    // Titre Game Over
    this.createGameOverTitle();

    // Scores
    this.createScoreDisplay();

    // Boutons
    this.createButtons();

    // Inputs
    this.setupInputs();

    // Jouer le son de game over
    this.playGameOverSound();
  }

  /**
   * Crée le fond
   */
  createBackground() {
    const graphics = this.add.graphics();

    // Dégradé sombre
    for (let y = 0; y < GAME_HEIGHT; y++) {
      const ratio = y / GAME_HEIGHT;
      const r = Math.floor(10 + ratio * 20);
      const g = Math.floor(15 + ratio * 25);
      const b = Math.floor(30 + ratio * 40);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, y, GAME_WIDTH, 1);
    }
  }

  /**
   * Crée les particules de neige
   */
  createSnowParticles() {
    this.add.particles(0, -50, 'snowflake', {
      x: { min: 0, max: GAME_WIDTH },
      lifespan: 8000,
      speedY: { min: 30, max: 80 },
      speedX: { min: -15, max: 15 },
      scale: { min: 0.1, max: 0.25 },
      alpha: { min: 0.2, max: 0.5 },
      frequency: 200,
      blendMode: 'ADD'
    });
  }

  /**
   * Crée le titre Game Over
   */
  createGameOverTitle() {
    const title = this.add.text(GAME_WIDTH / 2, 100, 'GAME OVER', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8
    });
    title.setOrigin(0.5);

    // Animation de pulsation
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée l'affichage des scores
   */
  createScoreDisplay() {
    const container = this.add.container(GAME_WIDTH / 2, 250);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-180, -80, 360, 160, 16);
    container.add(bg);

    // Score final
    const scoreTitle = this.add.text(0, -50, 'SCORE FINAL', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa'
    });
    scoreTitle.setOrigin(0.5);
    container.add(scoreTitle);

    const scoreValue = this.add.text(0, -10, this.finalScore.toString(), {
      fontSize: '56px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700'
    });
    scoreValue.setOrigin(0.5);
    container.add(scoreValue);

    // Niveau atteint
    const levelText = this.add.text(0, 50, `Niveau atteint: ${this.finalLevel}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff'
    });
    levelText.setOrigin(0.5);
    container.add(levelText);

    // Vérifier si nouveau record
    const bestScore = this.registry.get('bestScore') || 0;
    if (this.finalScore > bestScore) {
      const newRecord = this.add.text(0, -90, 'NOUVEAU RECORD !', {
        fontSize: '22px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffd700'
      });
      newRecord.setOrigin(0.5);
      container.add(newRecord);

      // Animation du nouveau record
      this.tweens.add({
        targets: newRecord,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    } else if (bestScore > 0) {
      const bestScoreText = this.add.text(GAME_WIDTH / 2, 360, `Meilleur score: ${bestScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#888888'
      });
      bestScoreText.setOrigin(0.5);
    }
  }

  /**
   * Crée les boutons
   */
  createButtons() {
    // Réinitialiser la liste des boutons
    this.buttons = [];

    // Bouton Rejouer
    const playAgainButton = this.createButton(
      GAME_WIDTH / 2 - 130,
      450,
      'REJOUER',
      0x2ecc71,
      () => this.restartGame()
    );
    this.buttons.push({ container: playAgainButton, action: () => this.restartGame() });

    // Bouton Menu
    const menuButton = this.createButton(
      GAME_WIDTH / 2 + 130,
      450,
      'MENU',
      0xe74c3c,
      () => this.backToMenu()
    );
    this.buttons.push({ container: menuButton, action: () => this.backToMenu() });

    // Animation d'entrée
    playAgainButton.setAlpha(0);
    menuButton.setAlpha(0);

    this.tweens.add({
      targets: [playAgainButton, menuButton],
      alpha: 1,
      y: '+=20',
      duration: 500,
      delay: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Permettre les actions après l'animation
        this.canAct = true;
        // Sélectionner le premier bouton par défaut
        this.updateButtonSelection();
      }
    });
  }

  /**
   * Crée un bouton
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} text - Texte du bouton
   * @param {number} color - Couleur
   * @param {Function} callback - Action au clic
   * @returns {Phaser.GameObjects.Container}
   */
  createButton(x, y, text, color, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-100, -25, 200, 50, 25);
    bg.lineStyle(3, 0xffffff, 0.5);
    bg.strokeRoundedRect(-100, -25, 200, 50, 25);
    button.add(bg);

    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff'
    });
    label.setOrigin(0.5);
    button.add(label);

    button.setInteractive(
      new Phaser.Geom.Rectangle(-100, -25, 200, 50),
      Phaser.Geom.Rectangle.Contains
    );

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

    button.on('pointerdown', callback);

    return button;
  }

  /**
   * Configure les inputs
   */
  setupInputs() {
    // Stocker les callbacks pour pouvoir les retirer plus tard
    this.keyboardCallbacks.space = () => this.restartGame();
    this.keyboardCallbacks.enter = () => this.restartGame();
    this.keyboardCallbacks.esc = () => this.backToMenu();

    // Espace ou Entrée pour rejouer
    this.input.keyboard.on('keydown-SPACE', this.keyboardCallbacks.space);
    this.input.keyboard.on('keydown-ENTER', this.keyboardCallbacks.enter);

    // ESC pour retourner au menu
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
   * Joue le son de game over
   */
  playGameOverSound() {
    try {
      const sound = this.sound.add('game-over-sound', { volume: 0.5 });
      sound.play();
    } catch (e) {
      // Ignorer les erreurs audio
    }
  }

  /**
   * Redémarre le jeu
   */
  restartGame() {
    if (!this.canAct) return;
    this.canAct = false;

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
  backToMenu() {
    if (!this.canAct) return;
    this.canAct = false;

    // La destruction du jeu est gérée par ArcadeStore.backToMenu()
    window.Alpine?.store('arcade')?.backToMenu();
  }

  /**
   * Met à jour l'affichage de la sélection des boutons
   */
  updateButtonSelection() {
    this.buttons.forEach((button, index) => {
      if (index === this.selectedButtonIndex) {
        // Bouton sélectionné - agrandi
        this.tweens.add({
          targets: button.container,
          scale: 1.15,
          duration: 100
        });
      } else {
        // Autres boutons - taille normale
        this.tweens.add({
          targets: button.container,
          scale: 1,
          duration: 100
        });
      }
    });
  }

  /**
   * Mise à jour - vérifie les inputs manette
   */
  update() {
    if (!this.canAct) return;

    // Navigation gauche/droite avec D-pad ou stick
    const direction = gamepadManager.getDirection(0);

    if (direction !== this.lastDirection) {
      if (direction === 'left' && this.selectedButtonIndex > 0) {
        this.selectedButtonIndex--;
        this.updateButtonSelection();
      } else if (direction === 'right' && this.selectedButtonIndex < this.buttons.length - 1) {
        this.selectedButtonIndex++;
        this.updateButtonSelection();
      }
      this.lastDirection = direction;
    }

    // Reset lastDirection quand pas de direction
    if (!direction) {
      this.lastDirection = null;
    }

    // Bouton A ou START pour activer le bouton sélectionné
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.START, 0)) {
      const selectedButton = this.buttons[this.selectedButtonIndex];
      if (selectedButton) {
        selectedButton.action();
      }
    }

    // Bouton B pour retourner au menu de l'arcade
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.backToMenu();
    }
  }
}
