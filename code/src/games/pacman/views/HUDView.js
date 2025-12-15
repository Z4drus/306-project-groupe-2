/**
 * HUDView - Vue de l'interface in-game
 *
 * Gère l'affichage des messages et overlays dans le jeu
 */

export default class HUDView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  /**
   * Affiche un message de victoire de niveau
   * @param {number} level - Niveau complété
   * @param {number} nextLevel - Prochain niveau
   */
  showLevelComplete(level, nextLevel) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const victoryText = this.scene.add.text(
      centerX,
      centerY - 20,
      `NIVEAU ${level} COMPLETE!\n+1000 POINTS`,
      {
        fontSize: '28px',
        fill: '#ffff00',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    victoryText.setOrigin(0.5);
    this.elements.push(victoryText);

    const nextLevelText = this.scene.add.text(
      centerX,
      centerY + 40,
      `NIVEAU ${nextLevel}`,
      {
        fontSize: '24px',
        fill: '#00ffff',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    nextLevelText.setOrigin(0.5);
    this.elements.push(nextLevelText);

    // Animation clignotante
    this.scene.tweens.add({
      targets: nextLevelText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 4
    });
  }

  /**
   * Affiche un message "READY!"
   */
  showReady() {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const readyText = this.scene.add.text(
      centerX,
      centerY,
      'READY!',
      {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Arial'
      }
    );
    readyText.setOrigin(0.5);
    this.elements.push(readyText);

    // Disparition après 2 secondes
    this.scene.time.delayedCall(2000, () => {
      readyText.destroy();
      const index = this.elements.indexOf(readyText);
      if (index > -1) {
        this.elements.splice(index, 1);
      }
    });
  }

  /**
   * Affiche un message personnalisé
   * @param {string} message - Message à afficher
   * @param {Object} options - Options de style
   * @returns {Phaser.GameObjects.Text}
   */
  showMessage(message, options = {}) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const text = this.scene.add.text(
      options.x ?? centerX,
      options.y ?? centerY,
      message,
      {
        fontSize: options.fontSize || '24px',
        fill: options.color || '#ffffff',
        fontFamily: options.fontFamily || 'Arial',
        align: options.align || 'center'
      }
    );
    text.setOrigin(0.5);
    this.elements.push(text);

    return text;
  }

  /**
   * Efface tous les éléments HUD
   */
  clear() {
    this.elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.elements = [];
  }

  /**
   * Détruit la vue
   */
  destroy() {
    this.clear();
  }
}
