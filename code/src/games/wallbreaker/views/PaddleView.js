/**
 * PaddleView - Vue du paddle (raquette)
 *
 * Gère le rendu visuel du paddle avec Phaser
 */

import { ASSETS_PATH, COLORS } from '../config/GameConfig.js';

export default class PaddleView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PaddleModel} model - Modèle du paddle
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.sprite = null;
  }

  /**
   * Précharge les assets nécessaires
   */
  preload() {
    this.scene.load.image('paddle', `${ASSETS_PATH}/paddle.png`);
  }

  /**
   * Crée le sprite du paddle
   */
  create() {
    // Créer le sprite avec physique
    this.sprite = this.scene.physics.add.sprite(
      this.model.x,
      this.model.y,
      'paddle'
    );

    // Configuration du sprite
    this.sprite.setDisplaySize(this.model.width, this.model.height);
    this.sprite.setImmovable(true);
    this.sprite.body.allowGravity = false;
    this.sprite.setCollideWorldBounds(false);

    // Effet visuel - légère teinte
    this.sprite.setTint(0xffffff);

    return this.sprite;
  }

  /**
   * Met à jour la position du sprite selon le modèle
   */
  update() {
    if (this.sprite && this.model) {
      this.sprite.x = this.model.x;
      this.sprite.y = this.model.y;
    }
  }

  /**
   * Anime le paddle lors d'un hit
   */
  playHitEffect() {
    if (!this.sprite) return;

    // Flash blanc
    this.sprite.setTint(0x00ffff);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite) {
        this.sprite.setTint(0xffffff);
      }
    });
  }

  /**
   * Anime la réinitialisation du paddle
   */
  playResetAnimation() {
    if (!this.sprite) return;

    // Animation de fade in
    this.sprite.alpha = 0;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * Met à jour la taille du paddle avec animation
   * @param {number} width - Nouvelle largeur
   */
  setWidth(width) {
    if (!this.sprite) return;

    // Animation de changement de taille
    this.scene.tweens.add({
      targets: this.sprite,
      displayWidth: width,
      duration: 200,
      ease: 'Back.easeOut',
      onUpdate: () => {
        // Mettre à jour le body physique pendant l'animation
        if (this.sprite.body) {
          this.sprite.body.setSize(this.sprite.displayWidth, this.sprite.displayHeight);
        }
      }
    });
  }

  /**
   * Retourne le sprite pour les collisions
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Retourne le body physique
   * @returns {Phaser.Physics.Arcade.Body}
   */
  getBody() {
    return this.sprite?.body;
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
