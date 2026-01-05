/**
 * PlatformView - Vue des plateformes
 *
 * Gère le rendu visuel des plateformes avec pooling de sprites
 */

import { ASSETS_PATH, PLATFORM_TYPES, PLATFORM_CONFIG } from '../config/GameConfig.js';

export default class PlatformView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PlatformModel} model - Modèle de la plateforme
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.sprite = null;
    this.overlay = null;
  }

  /**
   * Crée le sprite de la plateforme
   */
  create() {
    // Créer le sprite de la plateforme
    this.sprite = this.scene.physics.add.sprite(
      this.model.x + this.model.width / 2,
      this.model.y + this.model.height / 2,
      'platform'
    );

    // Ajuster la taille
    this.sprite.displayWidth = this.model.width;
    this.sprite.displayHeight = this.model.height;

    // Configuration physique
    this.sprite.body.immovable = true;
    this.sprite.body.allowGravity = false;
    this.sprite.body.setSize(this.model.width, this.model.height);

    // Appliquer la teinte selon le type
    this.applyTypeTint();

    // Stocker la référence au modèle dans le sprite
    this.sprite.setData('model', this.model);
  }

  /**
   * Applique la teinte selon le type de plateforme
   */
  applyTypeTint() {
    if (!this.sprite) return;

    switch (this.model.type.id) {
      case 'ice':
        this.sprite.setTint(0x87ceeb);
        break;
      case 'crumbling':
        this.sprite.setTint(0xd4a574);
        break;
      default:
        this.sprite.clearTint();
    }
  }

  /**
   * Met à jour l'affichage de la plateforme
   */
  update() {
    if (!this.sprite || !this.model) return;

    // Mettre à jour la position
    this.sprite.x = this.model.x + this.model.width / 2;
    this.sprite.y = this.model.y + this.model.height / 2;

    // Gérer l'état d'effondrement
    if (this.model.isCrumbling) {
      this.updateCrumblingEffect();
    }

    // Cacher si inactif
    if (!this.model.isActive) {
      this.sprite.setVisible(false);
      this.sprite.body.enable = false;
    }
  }

  /**
   * Met à jour l'effet d'effondrement
   */
  updateCrumblingEffect() {
    if (!this.sprite) return;

    // Faire trembler la plateforme
    const shake = Math.sin(Date.now() / 50) * 2;
    this.sprite.x += shake;

    // Réduire l'opacité
    const progress = 1 - (this.model.crumbleTimer / PLATFORM_TYPES.CRUMBLING.crumbleTime);
    this.sprite.alpha = 1 - progress * 0.7;
  }

  /**
   * Réinitialise la vue pour le recyclage
   */
  reset() {
    if (!this.sprite) return;

    this.sprite.setVisible(true);
    this.sprite.body.enable = true;
    this.sprite.alpha = 1;

    // Mettre à jour les dimensions
    this.sprite.displayWidth = this.model.width;
    this.sprite.displayHeight = this.model.height;
    this.sprite.body.setSize(this.model.width, this.model.height);

    // Réappliquer la teinte
    this.applyTypeTint();

    // Mettre à jour la position
    this.sprite.x = this.model.x + this.model.width / 2;
    this.sprite.y = this.model.y + this.model.height / 2;
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
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

/**
 * Gestionnaire de vues de plateformes avec pooling
 */
export class PlatformViewManager {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this.views = new Map();
    this.group = null;
  }

  /**
   * Précharge les assets
   */
  preload() {
    this.scene.load.image('platform', `${ASSETS_PATH}/ground.png`);
  }

  /**
   * Crée le groupe de plateformes
   */
  create() {
    this.group = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false
    });
  }

  /**
   * Ajoute une vue pour une plateforme
   * @param {PlatformModel} model
   * @returns {PlatformView}
   */
  addPlatform(model) {
    const view = new PlatformView(this.scene, model);
    view.create();
    this.views.set(model, view);

    if (this.group && view.sprite) {
      this.group.add(view.sprite);
    }

    return view;
  }

  /**
   * Récupère la vue d'une plateforme
   * @param {PlatformModel} model
   * @returns {PlatformView|undefined}
   */
  getView(model) {
    return this.views.get(model);
  }

  /**
   * Met à jour toutes les vues
   */
  update() {
    for (const view of this.views.values()) {
      view.update();
    }
  }

  /**
   * Réinitialise une vue pour le recyclage
   * @param {PlatformModel} model
   */
  resetView(model) {
    const view = this.views.get(model);
    if (view) {
      view.reset();
    }
  }

  /**
   * Supprime une vue
   * @param {PlatformModel} model
   */
  removeView(model) {
    const view = this.views.get(model);
    if (view) {
      if (view.sprite && this.group) {
        this.group.remove(view.sprite);
      }
      view.destroy();
      this.views.delete(model);
    }
  }

  /**
   * Retourne le groupe Phaser pour les collisions
   * @returns {Phaser.Physics.Arcade.Group}
   */
  getGroup() {
    return this.group;
  }

  /**
   * Nettoie toutes les vues
   */
  clear() {
    for (const view of this.views.values()) {
      view.destroy();
    }
    this.views.clear();
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
    if (this.group) {
      this.group.destroy(true);
      this.group = null;
    }
  }
}
