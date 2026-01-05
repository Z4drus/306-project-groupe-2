/**
 * PlayerView - Vue du joueur (Santa)
 *
 * Gère le rendu visuel et les animations du joueur
 */

import { ASSETS_PATH, PLAYER_CONFIG } from '../config/GameConfig.js';
import { PlayerState } from '../models/PlayerModel.js';

export default class PlayerView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PlayerModel} model - Modèle du joueur
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.sprite = null;
    this.isBlinking = false;
    this.blinkTimer = null;
  }

  /**
   * Précharge les assets du joueur
   */
  preload() {
    this.scene.load.spritesheet('santa-running', `${ASSETS_PATH}/santa-running.png`, {
      frameWidth: PLAYER_CONFIG.width,
      frameHeight: PLAYER_CONFIG.height
    });
  }

  /**
   * Crée le sprite et les animations
   */
  create() {
    // Créer le sprite
    this.sprite = this.scene.physics.add.sprite(
      this.model.x,
      this.model.y,
      'santa-running'
    );

    // Configuration de la hitbox
    this.sprite.setSize(PLAYER_CONFIG.width - 10, PLAYER_CONFIG.height - 5);
    this.sprite.setOffset(5, 5);

    // Configuration physique
    this.sprite.body.setGravityY(PLAYER_CONFIG.gravity);
    this.sprite.body.setCollideWorldBounds(false);

    // Limiter la vélocité de chute pour éviter le tunneling
    this.sprite.body.setMaxVelocityY(PLAYER_CONFIG.maxFallVelocity);

    // Créer les animations
    this.createAnimations();

    // Lancer l'animation de course par défaut
    this.sprite.play('santa-run');
  }

  /**
   * Crée les animations du joueur
   */
  createAnimations() {
    // Animation de course
    if (!this.scene.anims.exists('santa-run')) {
      this.scene.anims.create({
        key: 'santa-run',
        frames: this.scene.anims.generateFrameNumbers('santa-running', {
          start: 0,
          end: 3
        }),
        frameRate: PLAYER_CONFIG.animationSpeed,
        repeat: -1
      });
    }

    // Animation de saut (première frame figée)
    if (!this.scene.anims.exists('santa-jump')) {
      this.scene.anims.create({
        key: 'santa-jump',
        frames: [{ key: 'santa-running', frame: 1 }],
        frameRate: 1
      });
    }

    // Animation de chute
    if (!this.scene.anims.exists('santa-fall')) {
      this.scene.anims.create({
        key: 'santa-fall',
        frames: [{ key: 'santa-running', frame: 2 }],
        frameRate: 1
      });
    }
  }

  /**
   * Met à jour l'affichage du joueur
   */
  update() {
    if (!this.sprite || !this.model) return;

    // Mettre à jour la position du sprite depuis le modèle
    this.sprite.x = this.model.x;
    this.sprite.y = this.model.y;

    // Mettre à jour l'animation selon l'état
    this.updateAnimation();

    // Effet de clignotement si invincible
    if (this.model.isInvincible && !this.isBlinking) {
      this.startBlinking();
    } else if (!this.model.isInvincible && this.isBlinking) {
      this.stopBlinking();
    }
  }

  /**
   * Met à jour l'animation selon l'état du joueur
   */
  updateAnimation() {
    const state = this.model.state;
    const currentAnim = this.sprite.anims.currentAnim?.key;

    switch (state) {
      case PlayerState.RUNNING:
        if (currentAnim !== 'santa-run') {
          this.sprite.play('santa-run');
        }
        break;

      case PlayerState.JUMPING:
      case PlayerState.DOUBLE_JUMPING:
        if (currentAnim !== 'santa-jump') {
          this.sprite.play('santa-jump');
        }
        break;

      case PlayerState.FALLING:
        if (currentAnim !== 'santa-fall') {
          this.sprite.play('santa-fall');
        }
        break;

      case PlayerState.DEAD:
        this.sprite.setTint(0xff0000);
        this.sprite.stop();
        break;
    }
  }

  /**
   * Joue l'effet de saut
   */
  playJumpEffect() {
    // Petit effet de scale
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.1,
      scaleX: 0.9,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  /**
   * Joue l'effet de double saut
   */
  playDoubleJumpEffect() {
    // Rotation rapide
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.sprite.angle = 0;
      }
    });
  }

  /**
   * Démarre l'effet de clignotement
   */
  startBlinking() {
    this.isBlinking = true;
    this.blinkTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.sprite) {
          this.sprite.alpha = this.sprite.alpha === 1 ? 0.3 : 1;
        }
      },
      loop: true
    });
  }

  /**
   * Arrête l'effet de clignotement
   */
  stopBlinking() {
    this.isBlinking = false;
    if (this.blinkTimer) {
      this.blinkTimer.destroy();
      this.blinkTimer = null;
    }
    if (this.sprite) {
      this.sprite.alpha = 1;
      this.sprite.clearTint();
    }
  }

  /**
   * Joue l'animation de mort
   * @param {Function} callback - Callback à la fin de l'animation
   */
  playDeathAnimation(callback) {
    if (!this.sprite) return;

    this.sprite.setTint(0xff0000);
    this.sprite.stop();

    // Animation de mort rapide
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: 30,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (callback) callback();
      }
    });
  }

  /**
   * Réinitialise la vue du joueur
   */
  reset() {
    if (!this.sprite) return;

    this.stopBlinking();
    this.sprite.clearTint();
    this.sprite.alpha = 1;
    this.sprite.angle = 0;
    this.sprite.setScale(1);
    this.sprite.x = this.model.x;
    this.sprite.y = this.model.y;
    this.sprite.play('santa-run');
  }

  /**
   * Retourne le sprite Phaser
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Détruit la vue
   */
  destroy() {
    this.stopBlinking();
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
