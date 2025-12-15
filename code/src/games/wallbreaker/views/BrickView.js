/**
 * BrickView - Vue d'une brique
 *
 * Gère le rendu visuel d'une brique avec Phaser
 */

import { ASSETS_PATH, BRICK_TYPES } from '../config/GameConfig.js';

export default class BrickView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {BrickModel} model - Modèle de la brique
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.sprite = null;
    this.damageOverlay = null;
    this.hitIndicator = null;
  }

  /**
   * Précharge les assets nécessaires (statique)
   * @param {Phaser.Scene} scene
   */
  static preload(scene) {
    scene.load.image('brick', `${ASSETS_PATH}/brik3.png`);
  }

  /**
   * Crée le sprite de la brique
   */
  create() {
    // Créer le sprite avec physique
    this.sprite = this.scene.physics.add.sprite(
      this.model.x + this.model.width / 2,
      this.model.y + this.model.height / 2,
      'brick'
    );

    // Configuration du sprite
    this.sprite.setDisplaySize(this.model.width, this.model.height);
    this.sprite.setImmovable(true);
    this.sprite.body.allowGravity = false;

    // Appliquer la couleur selon le type
    this.updateTint();

    // Indicateur de coups restants pour les briques multi-hit
    if (this.model.maxHits > 1 && !this.model.isIndestructible) {
      this.createHitIndicator();
    }

    // Stocker la référence au modèle dans le sprite pour les collisions
    this.sprite.setData('brickModel', this.model);
    this.sprite.setData('brickView', this);

    return this.sprite;
  }

  /**
   * Crée l'indicateur de coups restants
   */
  createHitIndicator() {
    this.hitIndicator = this.scene.add.text(
      this.model.x + this.model.width / 2,
      this.model.y + this.model.height / 2,
      this.model.currentHits.toString(),
      {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.hitIndicator.setOrigin(0.5);
    this.hitIndicator.setDepth(10);
  }

  /**
   * Met à jour la teinte selon les dégâts
   */
  updateTint() {
    if (!this.sprite) return;

    const color = this.model.getCurrentColor();
    this.sprite.setTint(color);

    // Mettre à jour l'indicateur
    if (this.hitIndicator && !this.model.isDestroyed) {
      this.hitIndicator.setText(this.model.currentHits.toString());
    }
  }

  /**
   * Anime un hit sur la brique
   */
  playHitEffect() {
    if (!this.sprite || this.model.isDestroyed) return;

    // Flash blanc
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      this.updateTint();
    });

    // Shake léger
    const originalX = this.sprite.x;
    const originalY = this.sprite.y;

    this.scene.tweens.add({
      targets: this.sprite,
      x: originalX + Phaser.Math.Between(-3, 3),
      y: originalY + Phaser.Math.Between(-3, 3),
      duration: 30,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.x = originalX;
          this.sprite.y = originalY;
        }
      }
    });
  }

  /**
   * Anime la destruction de la brique
   * @param {Function} callback - Callback une fois l'animation terminée
   */
  playDestroyEffect(callback) {
    if (!this.sprite) {
      if (callback) callback();
      return;
    }

    // Cacher l'indicateur immédiatement
    if (this.hitIndicator) {
      this.hitIndicator.setVisible(false);
    }

    // Créer des particules d'explosion
    this.createExplosionParticles();

    // Animation de destruction
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: Phaser.Math.Between(-45, 45),
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
        if (callback) callback();
      }
    });
  }

  /**
   * Crée l'effet de particules lors de la destruction
   */
  createExplosionParticles() {
    if (!this.sprite) return;

    const color = this.model.color;
    const x = this.sprite.x;
    const y = this.sprite.y;

    // Créer plusieurs rectangles colorés qui s'envolent
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.rectangle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-5, 5),
        Phaser.Math.Between(4, 8),
        Phaser.Math.Between(4, 8),
        color
      );

      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        scale: 0,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Met à jour l'affichage (si nécessaire)
   */
  update() {
    // La brique est statique, pas grand chose à mettre à jour
    // mais on garde la méthode pour la cohérence
  }

  /**
   * Retourne le sprite pour les collisions
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Vérifie si la brique est active
   * @returns {boolean}
   */
  isActive() {
    return this.sprite && !this.model.isDestroyed;
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.hitIndicator) {
      this.hitIndicator.destroy();
      this.hitIndicator = null;
    }
    if (this.damageOverlay) {
      this.damageOverlay.destroy();
      this.damageOverlay = null;
    }
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

/**
 * Gestionnaire de toutes les vues de briques
 */
export class BrickViewManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.views = [];
    this.group = null;
  }

  /**
   * Précharge les assets
   */
  preload() {
    BrickView.preload(this.scene);
  }

  /**
   * Crée le groupe Phaser et initialise les vues
   */
  create() {
    this.group = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false
    });
  }

  /**
   * Ajoute une brique
   * @param {BrickModel} brickModel
   * @returns {BrickView}
   */
  addBrick(brickModel) {
    const view = new BrickView(this.scene, brickModel);
    const sprite = view.create();
    this.group.add(sprite);
    this.views.push(view);
    return view;
  }

  /**
   * Retourne le groupe Phaser pour les collisions
   * @returns {Phaser.Physics.Arcade.Group}
   */
  getGroup() {
    return this.group;
  }

  /**
   * Retourne toutes les vues actives
   * @returns {Array<BrickView>}
   */
  getActiveViews() {
    return this.views.filter(v => v.isActive());
  }

  /**
   * Trouve une vue par son modèle
   * @param {BrickModel} model
   * @returns {BrickView|null}
   */
  findByModel(model) {
    return this.views.find(v => v.model === model) || null;
  }

  /**
   * Nettoie toutes les vues
   */
  clear() {
    this.views.forEach(v => v.destroy());
    this.views = [];
    if (this.group) {
      this.group.clear(true, true);
    }
  }

  /**
   * Détruit le manager
   */
  destroy() {
    this.clear();
    if (this.group) {
      this.group.destroy();
      this.group = null;
    }
  }
}
