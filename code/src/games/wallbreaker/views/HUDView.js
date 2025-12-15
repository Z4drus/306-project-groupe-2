/**
 * HUDView - Vue de l'interface utilisateur (HUD)
 *
 * Gère l'affichage du score, niveau, vies et messages
 */

import { GAME_WIDTH, GAME_HEIGHT, PLAY_AREA, COLORS, ASSETS_PATH } from '../config/GameConfig.js';

export default class HUDView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Éléments UI
    this.titleText = null;
    this.scoreLabel = null;
    this.scoreText = null;
    this.levelLabel = null;
    this.levelText = null;
    this.livesLabel = null;
    this.livesIcons = [];

    // Messages
    this.messageText = null;
    this.subMessageText = null;

    // Zone de jeu
    this.playAreaBorder = null;
    this.playAreaBackground = null;
  }

  /**
   * Précharge les assets nécessaires
   */
  preload() {
    this.scene.load.image('life', `${ASSETS_PATH}/life.png`);
  }

  /**
   * Crée tous les éléments du HUD
   */
  create() {
    this.createPlayArea();
    this.createScoreDisplay();
    this.createLevelDisplay();
    this.createLivesDisplay();
    this.createMessageArea();
  }

  /**
   * Crée la zone de jeu visuelle
   */
  createPlayArea() {
    // Fond de la zone de jeu
    this.playAreaBackground = this.scene.add.rectangle(
      PLAY_AREA.x + PLAY_AREA.width / 2,
      PLAY_AREA.y + PLAY_AREA.height / 2,
      PLAY_AREA.width,
      PLAY_AREA.height,
      Phaser.Display.Color.HexStringToColor(COLORS.PLAY_AREA_BG).color
    );
    this.playAreaBackground.setDepth(-10);

    // Bordure de la zone de jeu
    this.playAreaBorder = this.scene.add.rectangle(
      PLAY_AREA.x + PLAY_AREA.width / 2,
      PLAY_AREA.y + PLAY_AREA.height / 2,
      PLAY_AREA.width + 4,
      PLAY_AREA.height + 4
    );
    this.playAreaBorder.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BORDER).color);
    this.playAreaBorder.setDepth(-9);
  }

  /**
   * Crée le titre du jeu (colonne gauche)
   */
  createTitle() {
    const leftColumnX = 75;

    this.titleText = this.scene.add.text(leftColumnX, 100, 'WALL\nBREAKER', {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.PRIMARY,
      stroke: COLORS.SECONDARY,
      strokeThickness: 2,
      align: 'center'
    });
    this.titleText.setOrigin(0.5);

    // Animation subtile du titre
    this.scene.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Crée l'affichage du score (colonne droite)
   */
  createScoreDisplay() {
    const rightColumnX = GAME_WIDTH - 75;

    this.scoreLabel = this.scene.add.text(rightColumnX, 80, 'SCORE', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: COLORS.TEXT_DARK
    });
    this.scoreLabel.setOrigin(0.5);

    this.scoreText = this.scene.add.text(rightColumnX, 110, '0', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.ACCENT
    });
    this.scoreText.setOrigin(0.5);
  }

  /**
   * Crée l'affichage du niveau (colonne droite)
   */
  createLevelDisplay() {
    const rightColumnX = GAME_WIDTH - 75;

    this.levelLabel = this.scene.add.text(rightColumnX, 180, 'NIVEAU', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: COLORS.TEXT_DARK
    });
    this.levelLabel.setOrigin(0.5);

    this.levelText = this.scene.add.text(rightColumnX, 210, '1', {
      fontSize: '32px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.SECONDARY
    });
    this.levelText.setOrigin(0.5);
  }

  /**
   * Crée l'affichage des vies (colonne droite)
   */
  createLivesDisplay() {
    const rightColumnX = GAME_WIDTH - 75;

    this.livesLabel = this.scene.add.text(rightColumnX, 280, 'VIES', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: COLORS.TEXT_DARK
    });
    this.livesLabel.setOrigin(0.5);

    // Les icônes de vies seront créées par updateLives
    this.livesIcons = [];
  }

  /**
   * Crée la zone de messages au centre
   */
  createMessageArea() {
    const centerX = PLAY_AREA.x + PLAY_AREA.width / 2;
    const centerY = PLAY_AREA.y + PLAY_AREA.height / 2;

    this.messageText = this.scene.add.text(centerX, centerY - 20, '', {
      fontSize: '32px',
      fontFamily: 'Arial Black, Arial',
      fill: COLORS.TEXT,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setDepth(100);
    this.messageText.setVisible(false);

    this.subMessageText = this.scene.add.text(centerX, centerY + 30, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: COLORS.ACCENT,
      align: 'center'
    });
    this.subMessageText.setOrigin(0.5);
    this.subMessageText.setDepth(100);
    this.subMessageText.setVisible(false);
  }

  /**
   * Met à jour l'affichage du score
   * @param {number} score
   */
  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText(score.toString());

      // Animation de pulse
      this.scene.tweens.add({
        targets: this.scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }

  /**
   * Met à jour l'affichage du niveau
   * @param {number} level
   */
  updateLevel(level) {
    if (this.levelText) {
      this.levelText.setText(level.toString());

      // Animation de changement de niveau
      this.scene.tweens.add({
        targets: this.levelText,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
  }

  /**
   * Met à jour l'affichage des vies
   * @param {number} lives
   */
  updateLives(lives) {
    const rightColumnX = GAME_WIDTH - 75;
    const startY = 310;
    const spacing = 25;

    // Supprimer les anciennes icônes
    this.livesIcons.forEach(icon => icon.destroy());
    this.livesIcons = [];

    // Créer les nouvelles icônes
    for (let i = 0; i < lives; i++) {
      const icon = this.scene.add.image(
        rightColumnX,
        startY + i * spacing,
        'life'
      );
      icon.setDisplaySize(20, 20);
      this.livesIcons.push(icon);
    }
  }

  /**
   * Affiche le message "READY"
   */
  showReadyMessage() {
    this.showMessage('PRET ?', 'Cliquez ou appuyez sur ESPACE');
    this.blinkSubMessage();
  }

  /**
   * Affiche le message de niveau complété
   * @param {number} level
   */
  showLevelCompleteMessage(level) {
    this.showMessage(`NIVEAU ${level}\nTERMINE !`, 'Preparation du niveau suivant...');
  }

  /**
   * Affiche le message de game over
   * @param {number} score
   */
  showGameOverMessage(score) {
    this.showMessage('GAME OVER', `Score final: ${score}`);
  }

  /**
   * Affiche le message de nouveau niveau
   * @param {number} level
   */
  showNewLevelMessage(level) {
    this.showMessage(`NIVEAU ${level}`, 'Cliquez pour commencer');
    this.blinkSubMessage();
  }

  /**
   * Affiche un message
   * @param {string} main - Message principal
   * @param {string} sub - Sous-message
   */
  showMessage(main, sub = '') {
    if (this.messageText) {
      this.messageText.setText(main);
      this.messageText.setVisible(true);
      this.messageText.alpha = 1;
    }

    if (this.subMessageText) {
      this.subMessageText.setText(sub);
      this.subMessageText.setVisible(sub !== '');
      this.subMessageText.alpha = 1;
    }
  }

  /**
   * Cache les messages
   */
  hideMessage() {
    // Arrêter les tweens existants
    if (this.messageText) {
      this.scene.tweens.killTweensOf(this.messageText);
      this.messageText.setVisible(false);
    }
    if (this.subMessageText) {
      this.scene.tweens.killTweensOf(this.subMessageText);
      this.subMessageText.setVisible(false);
    }
  }

  /**
   * Fait clignoter le sous-message
   */
  blinkSubMessage() {
    if (!this.subMessageText) return;

    this.scene.tweens.add({
      targets: this.subMessageText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Anime un message qui disparaît
   * @param {Function} callback
   */
  fadeOutMessage(callback) {
    const targets = [this.messageText, this.subMessageText].filter(t => t && t.visible);

    if (targets.length === 0) {
      if (callback) callback();
      return;
    }

    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.hideMessage();
        if (callback) callback();
      }
    });
  }

  /**
   * Met à jour toutes les valeurs du HUD
   * @param {number} score
   * @param {number} lives
   * @param {number} level
   */
  updateAll(score, lives, level) {
    this.updateScore(score);
    this.updateLives(lives);
    this.updateLevel(level);
  }

  /**
   * Détruit tous les éléments du HUD
   */
  destroy() {
    const elements = [
      this.titleText,
      this.scoreLabel,
      this.scoreText,
      this.levelLabel,
      this.levelText,
      this.livesLabel,
      this.messageText,
      this.subMessageText,
      this.playAreaBorder,
      this.playAreaBackground,
      ...this.livesIcons
    ];

    elements.forEach(el => {
      if (el) el.destroy();
    });

    this.livesIcons = [];
  }
}
