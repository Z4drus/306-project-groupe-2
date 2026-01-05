/**
 * CollectibleView - Vue des collectibles (cadeaux, bonbons)
 *
 * Gère le rendu visuel des collectibles avec effets
 */

import { COLLECTIBLE_CONFIG } from '../config/GameConfig.js';

export default class CollectibleView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {CollectibleModel} model - Modèle du collectible
   */
  constructor(scene, model) {
    this.scene = scene;
    this.model = model;
    this.graphics = null;
    this.glowGraphics = null;
  }

  /**
   * Crée le graphique du collectible
   */
  create() {
    // Créer le graphique principal
    this.graphics = this.scene.add.graphics();
    this.drawCollectible();

    // Ajouter la physique
    this.scene.physics.add.existing(this.graphics);
    this.graphics.body.setSize(this.model.size, this.model.size);
    this.graphics.body.setOffset(-this.model.size / 2, -this.model.size / 2);
    this.graphics.body.allowGravity = false;
    this.graphics.body.immovable = true;

    // Stocker la référence au modèle
    this.graphics.setData('model', this.model);
  }

  /**
   * Dessine le collectible selon son type
   */
  drawCollectible() {
    if (!this.graphics) return;

    this.graphics.clear();

    const size = this.model.size;
    const halfSize = size / 2;
    const color = this.model.type.color;

    switch (this.model.type.id) {
      case 'gift_small':
      case 'gift_medium':
      case 'gift_large':
        this.drawGift(halfSize, color);
        break;

      case 'candy_cane':
        this.drawCandyCane(halfSize);
        break;

      default:
        this.drawGift(halfSize, color);
    }
  }

  /**
   * Dessine un cadeau
   * @param {number} size - Demi-taille
   * @param {number} color - Couleur
   */
  drawGift(size, color) {
    // Corps du cadeau
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(-size, -size, size * 2, size * 2);

    // Ruban horizontal
    this.graphics.fillStyle(0xffd700, 1);
    this.graphics.fillRect(-size, -size * 0.2, size * 2, size * 0.4);

    // Ruban vertical
    this.graphics.fillRect(-size * 0.2, -size, size * 0.4, size * 2);

    // Noeud
    this.graphics.fillStyle(0xffd700, 1);
    this.graphics.fillCircle(0, -size * 0.8, size * 0.3);
  }

  /**
   * Dessine un candy cane
   * @param {number} size - Demi-taille
   */
  drawCandyCane(size) {
    const stripeWidth = size * 0.3;

    // Fond blanc
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRect(-size * 0.3, -size, size * 0.6, size * 2);

    // Rayures rouges
    this.graphics.fillStyle(0xff0000, 1);
    for (let i = 0; i < 4; i++) {
      this.graphics.fillRect(
        -size * 0.3,
        -size + i * size * 0.5,
        size * 0.6,
        size * 0.25
      );
    }

    // Courbe du haut
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(size * 0.3, -size * 0.7, size * 0.4);
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillCircle(size * 0.3, -size * 0.7, size * 0.2);
  }

  /**
   * Met à jour l'affichage du collectible
   * @param {number} time - Temps total écoulé
   */
  update(time) {
    if (!this.graphics || !this.model || !this.model.isActive) return;

    // Position avec effet de flottement
    const floatingY = this.model.getFloatingY(time);
    this.graphics.x = this.model.x;
    this.graphics.y = floatingY;

    // Cacher si inactif
    if (!this.model.isActive) {
      this.graphics.setVisible(false);
      if (this.graphics.body) {
        this.graphics.body.enable = false;
      }
    }
  }

  /**
   * Joue l'effet de collecte
   * @param {Function} callback - Callback à la fin
   */
  playCollectEffect(callback) {
    if (!this.graphics) return;

    // Désactiver la physique
    if (this.graphics.body) {
      this.graphics.body.enable = false;
    }

    // Animation de collecte
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      y: this.graphics.y - 30,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (callback) callback();
      }
    });

    // Créer des particules
    this.createCollectParticles();
  }

  /**
   * Crée des particules lors de la collecte
   */
  createCollectParticles() {
    const x = this.model.x;
    const y = this.model.y;
    const color = this.model.type.color;

    // Créer quelques particules étoilées
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);

      // Dessiner une étoile manuellement avec un polygone
      this.drawStarShape(particle, 0, 0, 5, 8, 4);

      particle.x = x;
      particle.y = y;

      const angle = (i / 5) * Math.PI * 2;
      const distance = 40;

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Dessine une forme d'étoile sur un graphique
   * @param {Phaser.GameObjects.Graphics} graphics - Graphique cible
   * @param {number} cx - Centre X
   * @param {number} cy - Centre Y
   * @param {number} points - Nombre de pointes
   * @param {number} outerRadius - Rayon externe
   * @param {number} innerRadius - Rayon interne
   */
  drawStarShape(graphics, cx, cy, points, outerRadius, innerRadius) {
    const starPoints = [];
    const step = Math.PI / points;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      starPoints.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }

    graphics.fillPoints(starPoints, true);
  }

  /**
   * Réinitialise la vue pour le recyclage
   */
  reset() {
    if (!this.graphics) return;

    this.graphics.setVisible(true);
    this.graphics.alpha = 1;
    this.graphics.scaleX = 1;
    this.graphics.scaleY = 1;

    if (this.graphics.body) {
      this.graphics.body.enable = true;
    }

    // Redessiner avec le nouveau type
    this.drawCollectible();

    // Mettre à jour la position
    this.graphics.x = this.model.x;
    this.graphics.y = this.model.y;
  }

  /**
   * Retourne le graphique Phaser
   * @returns {Phaser.GameObjects.Graphics}
   */
  getGraphics() {
    return this.graphics;
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

/**
 * Gestionnaire de vues de collectibles
 */
export class CollectibleViewManager {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this.views = new Map();
  }

  /**
   * Crée le gestionnaire
   */
  create() {
    // Rien à précharger pour les graphiques
  }

  /**
   * Ajoute une vue pour un collectible
   * @param {CollectibleModel} model
   * @returns {CollectibleView}
   */
  addCollectible(model) {
    const view = new CollectibleView(this.scene, model);
    view.create();
    this.views.set(model, view);
    return view;
  }

  /**
   * Récupère la vue d'un collectible
   * @param {CollectibleModel} model
   * @returns {CollectibleView|undefined}
   */
  getView(model) {
    return this.views.get(model);
  }

  /**
   * Met à jour toutes les vues
   * @param {number} time - Temps total écoulé
   */
  update(time) {
    for (const view of this.views.values()) {
      view.update(time);
    }
  }

  /**
   * Supprime une vue
   * @param {CollectibleModel} model
   */
  removeView(model) {
    const view = this.views.get(model);
    if (view) {
      view.destroy();
      this.views.delete(model);
    }
  }

  /**
   * Récupère tous les graphiques pour les collisions
   * @returns {Array}
   */
  getAllGraphics() {
    return Array.from(this.views.values())
      .map(v => v.getGraphics())
      .filter(g => g && g.body && g.body.enable);
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
  }
}
