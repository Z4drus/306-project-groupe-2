/**
 * GhostView - Vue d'un fantôme
 *
 * Gère le rendu visuel d'un fantôme (sprite, animations)
 */

import Phaser from 'phaser';
import { GhostMode } from '../models/GhostModel.js';

export default class GhostView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {GhostModel} model - Modèle de données du fantôme
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;

    // Créer le sprite
    this.sprite = scene.physics.add.sprite(
      model.x,
      model.y,
      'ghosts',
      model.spriteOffset
    );
    this.sprite.setOrigin(0.5);
    this.sprite.body.setSize(16, 16);
    this.sprite.name = model.name;

    // Créer les animations
    this.createAnimations();

    // Jouer l'animation initiale
    this.sprite.play(`${model.name}_${model.currentDirection}`);
  }

  /**
   * Crée les animations du fantôme
   */
  createAnimations() {
    const name = this.model.name;
    const offset = this.model.spriteOffset;

    // Animations normales (4 directions)
    if (!this.scene.anims.exists(`${name}_${Phaser.LEFT}`)) {
      this.scene.anims.create({
        key: `${name}_${Phaser.LEFT}`,
        frames: [{ key: 'ghosts', frame: offset }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_${Phaser.UP}`)) {
      this.scene.anims.create({
        key: `${name}_${Phaser.UP}`,
        frames: [{ key: 'ghosts', frame: offset + 1 }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_${Phaser.DOWN}`)) {
      this.scene.anims.create({
        key: `${name}_${Phaser.DOWN}`,
        frames: [{ key: 'ghosts', frame: offset + 2 }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_${Phaser.RIGHT}`)) {
      this.scene.anims.create({
        key: `${name}_${Phaser.RIGHT}`,
        frames: [{ key: 'ghosts', frame: offset + 3 }],
        frameRate: 10
      });
    }

    // Animation frightened (bleue)
    if (!this.scene.anims.exists(`${name}_frightened`)) {
      this.scene.anims.create({
        key: `${name}_frightened`,
        frames: this.scene.anims.generateFrameNumbers('ghosts', {
          start: 16,
          end: 17
        }),
        frameRate: 10,
        repeat: -1
      });
    }

    // Animations returning (yeux uniquement)
    if (!this.scene.anims.exists(`${name}_returning_${Phaser.RIGHT}`)) {
      this.scene.anims.create({
        key: `${name}_returning_${Phaser.RIGHT}`,
        frames: [{ key: 'ghosts', frame: 20 }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_returning_${Phaser.LEFT}`)) {
      this.scene.anims.create({
        key: `${name}_returning_${Phaser.LEFT}`,
        frames: [{ key: 'ghosts', frame: 21 }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_returning_${Phaser.UP}`)) {
      this.scene.anims.create({
        key: `${name}_returning_${Phaser.UP}`,
        frames: [{ key: 'ghosts', frame: 22 }],
        frameRate: 10
      });
    }

    if (!this.scene.anims.exists(`${name}_returning_${Phaser.DOWN}`)) {
      this.scene.anims.create({
        key: `${name}_returning_${Phaser.DOWN}`,
        frames: [{ key: 'ghosts', frame: 23 }],
        frameRate: 10
      });
    }
  }

  /**
   * Met à jour la vue selon le modèle
   */
  update() {
    // Synchroniser la position
    this.model.updatePosition(this.sprite.x, this.sprite.y);
  }

  /**
   * Déplace le sprite dans une direction
   * @param {number} direction - Direction Phaser
   * @param {number} speed - Vitesse
   */
  move(direction, speed) {
    if (direction === Phaser.NONE) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    let velocity = speed;
    if (direction === Phaser.LEFT || direction === Phaser.UP) {
      velocity = -velocity;
    }

    if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
      this.sprite.body.setVelocityX(velocity);
      this.sprite.body.setVelocityY(0);
    } else {
      this.sprite.body.setVelocityY(velocity);
      this.sprite.body.setVelocityX(0);
    }

    // Jouer l'animation appropriée
    this.updateAnimation(direction);
  }

  /**
   * Met à jour l'animation selon le mode et la direction
   * @param {number} direction - Direction Phaser
   */
  updateAnimation(direction) {
    const name = this.model.name;
    const mode = this.model.mode;

    if (mode === GhostMode.RETURNING) {
      this.sprite.play(`${name}_returning_${direction}`, true);
    } else if (mode === GhostMode.FRIGHTENED) {
      this.sprite.play(`${name}_frightened`, true);
    } else if (direction !== Phaser.NONE) {
      this.sprite.play(`${name}_${direction}`, true);
    }
  }

  /**
   * Joue l'animation frightened
   */
  playFrightenedAnimation() {
    this.sprite.play(`${this.model.name}_frightened`);
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
    if (this.sprite.x < 0) {
      this.sprite.x = mapWidth - 2;
    }
    if (this.sprite.x >= mapWidth - 1) {
      this.sprite.x = 1;
    }
  }

  /**
   * Réinitialise la vue à la position de départ
   */
  reset() {
    this.sprite.setPosition(this.model.x, this.model.y);
    this.sprite.body.reset(this.model.x, this.model.y);
    this.sprite.play(`${this.model.name}_${this.model.currentDirection}`);
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
