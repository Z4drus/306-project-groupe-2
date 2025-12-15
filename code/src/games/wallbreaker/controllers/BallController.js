/**
 * BallController - Contrôleur de la balle
 *
 * Gère la logique de mouvement et comportement de la balle
 */

import { PLAY_AREA, BALL_CONFIG } from '../config/GameConfig.js';

export default class BallController {
  /**
   * @param {BallModel} model - Modèle de la balle
   * @param {BallView} view - Vue de la balle
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(model, view, scene) {
    this.model = model;
    this.view = view;
    this.scene = scene;

    // Callbacks
    this.onBallLost = null;
  }

  /**
   * Initialise le contrôleur
   */
  initialize() {
    // Configuration des limites de rebond
    this.setupWorldBounds();
  }

  /**
   * Configure les limites du monde pour les rebonds
   */
  setupWorldBounds() {
    const sprite = this.view.getSprite();
    if (!sprite) return;

    // La balle doit rebondir sur les murs sauf le bas
    sprite.setCollideWorldBounds(false);

    // On gérera les collisions manuellement pour plus de contrôle
  }

  /**
   * Met à jour la balle
   * @param {number} delta - Delta temps en ms
   */
  update(delta) {
    if (!this.model.isActive) return;

    const sprite = this.view.getSprite();
    if (!sprite) return;

    // Gérer les rebonds sur les murs
    this.handleWallCollisions();

    // Vérifier si la balle est perdue (sortie par le bas)
    if (sprite.y > PLAY_AREA.y + PLAY_AREA.height + this.model.radius + 10) {
      this.handleBallLost();
    }
  }

  /**
   * Gère les collisions avec les murs
   */
  handleWallCollisions() {
    const sprite = this.view.getSprite();
    if (!sprite || !sprite.body) return;

    let bounced = false;
    const radius = this.model.radius;
    const minX = PLAY_AREA.x + radius;
    const maxX = PLAY_AREA.x + PLAY_AREA.width - radius;
    const minY = PLAY_AREA.y + radius;

    // Mur gauche
    if (sprite.x <= minX) {
      sprite.x = minX;
      if (sprite.body.velocity.x < 0) {
        sprite.body.velocity.x = Math.abs(sprite.body.velocity.x);
        bounced = true;
      }
    }

    // Mur droit
    if (sprite.x >= maxX) {
      sprite.x = maxX;
      if (sprite.body.velocity.x > 0) {
        sprite.body.velocity.x = -Math.abs(sprite.body.velocity.x);
        bounced = true;
      }
    }

    // Mur haut
    if (sprite.y <= minY) {
      sprite.y = minY;
      if (sprite.body.velocity.y < 0) {
        sprite.body.velocity.y = Math.abs(sprite.body.velocity.y);
        bounced = true;
      }
    }

    // Synchroniser le modèle avec Phaser
    this.model.x = sprite.x;
    this.model.y = sprite.y;
    this.model.velocityX = sprite.body.velocity.x;
    this.model.velocityY = sprite.body.velocity.y;

    if (bounced) {
      this.view.playBounceEffect();
    }
  }

  /**
   * Gère la perte de la balle
   */
  handleBallLost() {
    this.model.isActive = false;
    this.model.isLost = true;

    this.view.playLostAnimation(() => {
      if (this.onBallLost) {
        this.onBallLost();
      }
    });
  }

  /**
   * Attache la balle au paddle
   * @param {number} paddleX - Position X du paddle
   * @param {number} paddleY - Position Y du paddle
   */
  attachToPaddle(paddleX, paddleY) {
    this.model.reset(paddleX, paddleY - this.model.radius - 15);
    this.view.attachToPaddle(paddleX, paddleY);
    this.view.reset();
  }

  /**
   * Lance la balle
   * @param {number} speed - Vitesse de la balle
   */
  launch(speed) {
    this.model.setSpeed(speed);
    this.model.launch();

    // Synchroniser avec Phaser
    const sprite = this.view.getSprite();
    if (sprite) {
      sprite.body.velocity.x = this.model.velocityX;
      sprite.body.velocity.y = this.model.velocityY;
    }

    this.view.launch();
  }

  /**
   * Gère le rebond sur le paddle
   * @param {number} paddleCenterX - Centre X du paddle
   * @param {number} paddleWidth - Largeur du paddle
   */
  bounceOffPaddle(paddleCenterX, paddleWidth) {
    this.model.bounceOffPaddle(paddleCenterX, paddleWidth);

    // Synchroniser avec Phaser
    const sprite = this.view.getSprite();
    if (sprite) {
      sprite.body.velocity.x = this.model.velocityX;
      sprite.body.velocity.y = this.model.velocityY;
    }

    this.view.playBounceEffect();
  }

  /**
   * Gère le rebond sur une brique
   * @param {string} side - Côté du rebond ('top', 'bottom', 'left', 'right')
   */
  bounceOffBrick(side) {
    if (side === 'left' || side === 'right') {
      this.model.bounceX();
    } else {
      this.model.bounceY();
    }

    // Synchroniser avec Phaser
    const sprite = this.view.getSprite();
    if (sprite) {
      sprite.body.velocity.x = this.model.velocityX;
      sprite.body.velocity.y = this.model.velocityY;
    }

    this.view.playBounceEffect();
  }

  /**
   * Met à jour la position de la balle sur le paddle
   * @param {number} paddleX - Position X du paddle
   * @param {number} paddleY - Position Y du paddle
   */
  followPaddle(paddleX, paddleY) {
    if (this.model.isActive) return;

    this.model.x = paddleX;
    this.model.y = paddleY - this.model.radius - 15;

    const sprite = this.view.getSprite();
    if (sprite) {
      sprite.x = this.model.x;
      sprite.y = this.model.y;
    }
  }

  /**
   * Définit le callback de perte de balle
   * @param {Function} callback
   */
  setBallLostCallback(callback) {
    this.onBallLost = callback;
  }

  /**
   * Retourne le sprite de la balle pour les collisions
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.view.getSprite();
  }

  /**
   * Retourne le modèle de la balle
   * @returns {BallModel}
   */
  getModel() {
    return this.model;
  }

  /**
   * Vérifie si la balle est active
   * @returns {boolean}
   */
  isActive() {
    return this.model.isActive;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.view.destroy();
  }
}
