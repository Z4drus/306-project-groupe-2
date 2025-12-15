/**
 * BallView - Vue de la balle
 *
 * Gère le rendu visuel de la balle avec Phaser
 */

import { ASSETS_PATH } from '../config/GameConfig.js';

export default class BallView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {BallModel} model - Modèle de la balle
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.sprite = null;
    this.trail = null;
  }

  /**
   * Précharge les assets nécessaires
   */
  preload() {
    this.scene.load.image('ball', `${ASSETS_PATH}/balle.png`);
  }

  /**
   * Crée le sprite de la balle
   */
  create() {
    // Créer le sprite avec physique
    this.sprite = this.scene.physics.add.sprite(
      this.model.x,
      this.model.y,
      'ball'
    );

    // Configuration du sprite - utiliser setScale pour une hitbox proportionnelle
    const targetSize = this.model.radius * 2;
    const originalSize = this.sprite.width;
    const scale = targetSize / originalSize;
    this.sprite.setScale(scale);

    // Body physique
    this.sprite.body.allowGravity = false;
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(1, 1);

    // Créer l'effet de traînée
    this.createTrailEffect();

    return this.sprite;
  }

  /**
   * Crée l'effet de traînée de la balle
   */
  createTrailEffect() {
    // Particules pour la traînée (optionnel, désactivé si pas performant)
    if (this.scene.add.particles) {
      this.trail = this.scene.add.particles(0, 0, 'ball', {
        follow: this.sprite,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 0,
        lifespan: 200,
        frequency: 30,
        blendMode: 'ADD'
      });
      this.trail.setDepth(-1);
    }
  }

  /**
   * Met à jour la position du sprite selon le modèle
   */
  update() {
    if (this.sprite && this.model) {
      this.sprite.x = this.model.x;
      this.sprite.y = this.model.y;

      // Synchroniser la vélocité avec Phaser
      if (this.model.isActive) {
        this.sprite.body.velocity.x = this.model.velocityX;
        this.sprite.body.velocity.y = this.model.velocityY;
      } else {
        this.sprite.body.velocity.x = 0;
        this.sprite.body.velocity.y = 0;
      }
    }
  }

  /**
   * Synchronise le modèle avec la position Phaser (après physique)
   */
  syncFromPhysics() {
    if (this.sprite && this.model && this.model.isActive) {
      this.model.x = this.sprite.x;
      this.model.y = this.sprite.y;
      this.model.velocityX = this.sprite.body.velocity.x;
      this.model.velocityY = this.sprite.body.velocity.y;
    }
  }

  /**
   * Place la balle sur le paddle
   * @param {number} paddleX - Position X du paddle
   * @param {number} paddleY - Position Y du paddle
   */
  attachToPaddle(paddleX, paddleY) {
    const offsetY = -this.model.radius - 10;
    this.model.x = paddleX;
    this.model.y = paddleY + offsetY;
    this.sprite.x = this.model.x;
    this.sprite.y = this.model.y;
    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;
  }

  /**
   * Lance la balle visuellement
   */
  launch() {
    // Effet de lancement
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });

    // Activer la traînée
    if (this.trail) {
      this.trail.start();
    }
  }

  /**
   * Anime un rebond
   */
  playBounceEffect() {
    if (!this.sprite) return;

    // Effet de squish au rebond
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.8,
      scaleY: 1.2,
      duration: 50,
      yoyo: true,
      ease: 'Power1'
    });

    // Flash de couleur
    this.sprite.setTint(0x00ffff);
    this.scene.time.delayedCall(50, () => {
      if (this.sprite) {
        this.sprite.clearTint();
      }
    });
  }

  /**
   * Anime la perte de la balle
   * @param {Function} callback - Callback une fois l'animation terminée
   */
  playLostAnimation(callback) {
    if (!this.sprite) {
      if (callback) callback();
      return;
    }

    // Stopper la traînée
    if (this.trail) {
      this.trail.stop();
    }

    // Animation de disparition
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (callback) callback();
      }
    });
  }

  /**
   * Réinitialise l'apparence de la balle
   */
  reset() {
    if (!this.sprite) return;

    this.sprite.alpha = 1;
    this.sprite.scaleX = 1;
    this.sprite.scaleY = 1;
    this.sprite.clearTint();

    // Réactiver la traînée mais en pause
    if (this.trail) {
      this.trail.stop();
    }
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
    if (this.trail) {
      this.trail.destroy();
      this.trail = null;
    }
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
