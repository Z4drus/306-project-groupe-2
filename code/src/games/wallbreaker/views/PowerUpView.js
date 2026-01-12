/**
 * PowerUpView - Vue des power-ups
 *
 * Gère le rendu visuel des power-ups qui tombent
 */

import { POWER_UP_CONFIG } from '../config/PowerUpConfig.js';

/**
 * Vue d'un power-up individuel
 */
export default class PowerUpView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PowerUpModel} model - Modèle du power-up
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;

    // Éléments visuels
    this.container = null;
    this.background = null;
    this.iconText = null;
    this.glow = null;
  }

  /**
   * Crée le visuel du power-up
   */
  create() {
    const type = this.model.type;
    if (!type) return null;

    // Créer un container pour tous les éléments
    this.container = this.scene.add.container(this.model.x, this.model.y);

    // Glow effect (derrière)
    this.glow = this.scene.add.ellipse(0, 0, this.model.width + 10, this.model.height + 8, type.color, 0.3);
    this.container.add(this.glow);

    // Background du power-up (rectangle arrondi simulé)
    this.background = this.scene.add.rectangle(
      0, 0,
      this.model.width,
      this.model.height,
      type.color
    );
    this.background.setStrokeStyle(2, 0xffffff, 0.8);
    this.container.add(this.background);

    // Icône/texte du power-up
    this.iconText = this.scene.add.text(0, 0, type.icon, {
      fontSize: '12px',
      fontFamily: 'Arial'
    });
    this.iconText.setOrigin(0.5);
    this.container.add(this.iconText);

    // Stocker la référence au modèle pour les collisions
    this.container.setData('powerUpModel', this.model);
    this.container.setData('powerUpView', this);

    // Animations
    this.startAnimations();

    // Depth
    this.container.setDepth(50);

    return this.container;
  }

  /**
   * Démarre les animations du power-up
   */
  startAnimations() {
    if (!this.container) return;

    // Animation de pulse du glow
    this.scene.tweens.add({
      targets: this.glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.6,
      duration: POWER_UP_CONFIG.pulseSpeed / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Légère rotation oscillante
    this.scene.tweens.add({
      targets: this.container,
      angle: 5,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Met à jour la position selon le modèle
   */
  update() {
    if (this.container && this.model) {
      this.container.x = this.model.x;
      this.container.y = this.model.y;
    }
  }

  /**
   * Joue l'animation de collecte
   * @param {Function} callback - Appelé une fois l'animation terminée
   */
  playCollectAnimation(callback) {
    if (!this.container) {
      if (callback) callback();
      return;
    }

    // Arrêter les autres tweens
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.glow);

    // Animation d'absorption vers le haut avec scale et fade
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 30,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (callback) callback();
      }
    });

    // Flash de lumière
    this.scene.tweens.add({
      targets: this.glow,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200
    });
  }

  /**
   * Joue l'animation de disparition (sorti de l'écran)
   * @param {Function} callback
   */
  playFadeOutAnimation(callback) {
    if (!this.container) {
      if (callback) callback();
      return;
    }

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (callback) callback();
      }
    });
  }

  /**
   * Retourne le container pour les collisions
   * @returns {Phaser.GameObjects.Container}
   */
  getContainer() {
    return this.container;
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.container) {
      this.scene.tweens.killTweensOf(this.container);
      this.scene.tweens.killTweensOf(this.glow);
      this.container.destroy();
      this.container = null;
    }
  }
}

/**
 * Gestionnaire de toutes les vues de power-ups
 */
export class PowerUpViewManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.views = new Map();
    this.group = null;
  }

  /**
   * Crée le groupe de power-ups (pour collisions si besoin)
   */
  create() {
    // Les power-ups n'utilisent pas le système physique standard
    // La collision est gérée manuellement
  }

  /**
   * Ajoute un power-up
   * @param {PowerUpModel} model
   * @returns {PowerUpView}
   */
  addPowerUp(model) {
    const view = new PowerUpView(this.scene, model);
    view.create();
    this.views.set(model.id, view);
    return view;
  }

  /**
   * Retire un power-up
   * @param {string} modelId
   */
  removePowerUp(modelId) {
    const view = this.views.get(modelId);
    if (view) {
      view.destroy();
      this.views.delete(modelId);
    }
  }

  /**
   * Met à jour toutes les vues
   */
  update() {
    this.views.forEach(view => view.update());
  }

  /**
   * Joue l'animation de collecte pour un power-up
   * @param {string} modelId
   * @param {Function} callback
   */
  playCollectAnimation(modelId, callback) {
    const view = this.views.get(modelId);
    if (view) {
      view.playCollectAnimation(() => {
        this.removePowerUp(modelId);
        if (callback) callback();
      });
    } else if (callback) {
      callback();
    }
  }

  /**
   * Retourne toutes les vues actives
   * @returns {Array<PowerUpView>}
   */
  getActiveViews() {
    return Array.from(this.views.values());
  }

  /**
   * Vide toutes les vues
   */
  clear() {
    this.views.forEach(view => view.destroy());
    this.views.clear();
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
  }
}
