/**
 * HUDView - Vue de l'interface utilisateur (score, vies, niveau)
 *
 * Affiche les informations de jeu et les messages
 */

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig.js';

export default class HUDView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Textes
    this.scoreText = null;
    this.livesText = null;
    this.levelText = null;
    this.comboText = null;
    this.messageText = null;
    this.bestScoreText = null;

    // Container pour les messages centraux
    this.messageContainer = null;
  }

  /**
   * Précharge les assets (fonts, etc.)
   */
  preload() {
    // Pas d'assets spécifiques à précharger
  }

  /**
   * Crée les éléments de l'interface
   */
  create() {
    const textStyle = {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT,
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: 3
    };

    const smallTextStyle = {
      ...textStyle,
      fontSize: '18px'
    };

    // Score (en haut à gauche)
    this.scoreText = this.scene.add.text(20, 20, 'Score: 0', textStyle);
    this.scoreText.setDepth(100);

    // Niveau (en haut au centre)
    this.levelText = this.scene.add.text(GAME_WIDTH / 2, 20, 'Niveau 1', textStyle);
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setDepth(100);

    // Vies (en haut à droite)
    this.livesText = this.scene.add.text(GAME_WIDTH - 20, 20, 'Vies: 3', textStyle);
    this.livesText.setOrigin(1, 0);
    this.livesText.setDepth(100);

    // Combo (sous le score)
    this.comboText = this.scene.add.text(20, 50, '', {
      ...smallTextStyle,
      color: COLORS.GOLD
    });
    this.comboText.setDepth(100);
    this.comboText.setVisible(false);

    // Meilleur score (sous les vies)
    const bestScore = this.scene.registry.get('bestScore') || 0;
    if (bestScore > 0) {
      this.bestScoreText = this.scene.add.text(
        GAME_WIDTH - 20,
        50,
        `Best: ${bestScore}`,
        smallTextStyle
      );
      this.bestScoreText.setOrigin(1, 0);
      this.bestScoreText.setDepth(100);
    }

    // Message central
    this.createMessageContainer();
  }

  /**
   * Crée le container pour les messages centraux
   */
  createMessageContainer() {
    this.messageContainer = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.messageContainer.setDepth(200);

    // Fond semi-transparent
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-200, -60, 400, 120, 16);
    this.messageContainer.add(bg);

    // Texte principal
    this.messageText = this.scene.add.text(0, -15, '', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT,
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: 4,
      align: 'center'
    });
    this.messageText.setOrigin(0.5);
    this.messageContainer.add(this.messageText);

    // Texte secondaire
    this.subMessageText = this.scene.add.text(0, 25, '', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
      align: 'center'
    });
    this.subMessageText.setOrigin(0.5);
    this.messageContainer.add(this.subMessageText);

    this.messageContainer.setVisible(false);
  }

  /**
   * Met à jour tous les éléments
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
   * Met à jour le score
   * @param {number} score
   */
  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${score}`);
    }
  }

  /**
   * Met à jour les vies avec animation
   * @param {number} lives
   */
  updateLives(lives) {
    if (this.livesText) {
      this.livesText.setText(`Vies: ${Math.max(0, lives)}`);

      // Animation si perte de vie
      if (lives < 3) {
        this.scene.tweens.add({
          targets: this.livesText,
          scale: 1.2,
          duration: 100,
          yoyo: true
        });
      }
    }
  }

  /**
   * Met à jour le niveau
   * @param {number} level
   */
  updateLevel(level) {
    if (this.levelText) {
      this.levelText.setText(`Niveau ${level}`);
    }
  }

  /**
   * Affiche le combo
   * @param {number} combo
   * @param {number} multiplier
   */
  showCombo(combo, multiplier) {
    if (this.comboText && combo > 1) {
      this.comboText.setText(`Combo x${combo} (${multiplier.toFixed(1)}x)`);
      this.comboText.setVisible(true);

      // Animation
      this.scene.tweens.add({
        targets: this.comboText,
        scale: 1.3,
        duration: 100,
        yoyo: true
      });
    }
  }

  /**
   * Cache le combo
   */
  hideCombo() {
    if (this.comboText) {
      this.comboText.setVisible(false);
    }
  }

  /**
   * Affiche un message flottant de points
   * @param {number} points
   * @param {number} x
   * @param {number} y
   */
  showFloatingPoints(points, x, y) {
    const text = this.scene.add.text(x, y, `+${points}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.GOLD,
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);
    text.setDepth(150);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Affiche le message de démarrage
   */
  showReadyMessage() {
    this.showMessage('PRET ?', 'Appuie sur ESPACE ou A pour commencer');
  }

  /**
   * Affiche le message de niveau suivant
   * @param {number} level
   */
  showLevelUpMessage(level) {
    this.showMessage(`NIVEAU ${level}`, 'Vitesse augmentee !');

    // Cacher après un délai
    this.scene.time.delayedCall(2000, () => {
      this.hideMessage();
    });
  }

  /**
   * Affiche le message de game over
   * @param {number} score
   */
  showGameOverMessage(score) {
    this.showMessage('GAME OVER', `Score final: ${score}`);
  }

  /**
   * Affiche un message
   * @param {string} main - Message principal
   * @param {string} sub - Message secondaire
   */
  showMessage(main, sub = '') {
    if (this.messageContainer) {
      this.messageText.setText(main);
      this.subMessageText.setText(sub);
      this.messageContainer.setVisible(true);
      this.messageContainer.setAlpha(0);

      this.scene.tweens.add({
        targets: this.messageContainer,
        alpha: 1,
        duration: 300
      });
    }
  }

  /**
   * Cache le message
   */
  hideMessage() {
    if (this.messageContainer && this.messageContainer.visible) {
      this.scene.tweens.add({
        targets: this.messageContainer,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.messageContainer.setVisible(false);
        }
      });
    }
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.scoreText) this.scoreText.destroy();
    if (this.livesText) this.livesText.destroy();
    if (this.levelText) this.levelText.destroy();
    if (this.comboText) this.comboText.destroy();
    if (this.bestScoreText) this.bestScoreText.destroy();
    if (this.messageContainer) this.messageContainer.destroy();
  }
}
