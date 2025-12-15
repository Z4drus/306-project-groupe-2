/**
 * PacmanView - Vue de Pacman
 *
 * Gère le rendu visuel de Pacman (sprite, animations)
 */

import Phaser from 'phaser';
import { GRID_SIZE } from '../config/GameConfig.js';

export default class PacmanView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PacmanModel} model - Modèle de données Pacman
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;

    // Créer le sprite
    this.sprite = scene.physics.add.sprite(
      model.x,
      model.y,
      'pacman',
      0
    );
    this.sprite.setOrigin(0.5);
    this.sprite.body.setSize(16, 16);

    // Créer les animations
    this.createAnimations();

    // Démarrer l'animation munch
    this.sprite.play('munch');
  }

  /**
   * Crée les animations de Pacman
   */
  createAnimations() {
    // Animation de mastication
    if (!this.scene.anims.exists('munch')) {
      this.scene.anims.create({
        key: 'munch',
        frames: this.scene.anims.generateFrameNumbers('pacman', {
          start: 0,
          end: 2
        }),
        frameRate: 20,
        repeat: -1,
        yoyo: true
      });
    }

    // Animation de mort
    if (!this.scene.anims.exists('death')) {
      this.scene.anims.create({
        key: 'death',
        frames: this.scene.anims.generateFrameNumbers('pacman', {
          start: 3,
          end: 13
        }),
        frameRate: 10,
        repeat: 0
      });
    }
  }

  /**
   * Met à jour la vue selon le modèle
   */
  update() {
    // Synchroniser la position
    this.model.updateGridPosition(this.sprite.x, this.sprite.y);
  }

  /**
   * Déplace le sprite dans une direction
   * @param {number} direction - Direction Phaser
   */
  move(direction) {
    if (direction === Phaser.NONE) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    let speed = this.model.speed;

    if (direction === Phaser.LEFT || direction === Phaser.UP) {
      speed = -speed;
    }

    if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
      this.sprite.body.setVelocityX(speed);
      this.sprite.body.setVelocityY(0);
    } else {
      this.sprite.body.setVelocityY(speed);
      this.sprite.body.setVelocityX(0);
    }

    // Orientation du sprite
    this.sprite.setAngle(0);
    this.sprite.flipX = false;

    if (direction === Phaser.LEFT) {
      this.sprite.flipX = true;
    } else if (direction === Phaser.UP) {
      this.sprite.setAngle(270);
    } else if (direction === Phaser.DOWN) {
      this.sprite.setAngle(90);
    }
  }

  /**
   * Joue l'animation de mort
   * @param {Function} onComplete - Callback à la fin de l'animation
   */
  playDeathAnimation(onComplete) {
    this.sprite.body.setVelocity(0, 0);
    this.sprite.play('death');
    this.sprite.once('animationcomplete', () => {
      if (onComplete) {
        onComplete();
      }
    });
  }

  /**
   * Aligne le sprite sur un point
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  alignTo(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.body.reset(x, y);
  }

  /**
   * Gère le wrapping aux bords de la carte
   * @param {number} mapWidth - Largeur de la carte en pixels
   */
  handleWrapping(mapWidth) {
    if (this.model.gridX < 0) {
      this.sprite.x = mapWidth - 1;
    }
    if (this.model.gridX >= mapWidth / GRID_SIZE) {
      this.sprite.x = 1;
    }
  }

  /**
   * Réinitialise la vue
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  reset(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.body.reset(x, y);
    this.sprite.setAngle(0);
    this.sprite.flipX = true; // Commence vers la gauche
    this.sprite.play('munch');
  }

  /**
   * Détruit le sprite
   */
  destroy() {
    this.sprite.destroy();
  }

  /**
   * Retourne le sprite Phaser
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }
}
