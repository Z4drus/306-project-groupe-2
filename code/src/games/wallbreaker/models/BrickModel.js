/**
 * BrickModel - Modèle d'une brique
 *
 * Gère les données d'une brique individuelle (position, type, durabilité)
 */

import { BRICK_TYPES } from '../config/GameConfig.js';

export default class BrickModel {
  /**
   * @param {Object} config - Configuration de la brique
   */
  constructor(config) {
    // Position
    this.x = config.x;
    this.y = config.y;

    // Dimensions
    this.width = config.width ?? 50;
    this.height = config.height ?? 20;

    // Type et propriétés
    this.type = config.type ?? BRICK_TYPES.NORMAL;
    this.maxHits = this.type.hits;
    this.currentHits = this.type.hits;
    this.score = this.type.score;
    this.color = this.type.color;

    // État
    this.isDestroyed = false;
    this.isIndestructible = this.type.id === 'indestructible';

    // Index pour identification
    this.row = config.row ?? 0;
    this.col = config.col ?? 0;
    this.id = `brick_${this.row}_${this.col}`;
  }

  /**
   * Inflige des dégâts à la brique
   * @returns {Object} Résultat du hit {destroyed, points, hitsRemaining}
   */
  hit() {
    if (this.isDestroyed || this.isIndestructible) {
      return {
        destroyed: false,
        points: 0,
        hitsRemaining: this.currentHits
      };
    }

    this.currentHits--;

    if (this.currentHits <= 0) {
      this.isDestroyed = true;
      return {
        destroyed: true,
        points: this.score,
        hitsRemaining: 0
      };
    }

    // Points partiels pour avoir endommagé la brique
    return {
      destroyed: false,
      points: Math.floor(this.score / this.maxHits),
      hitsRemaining: this.currentHits
    };
  }

  /**
   * Retourne le pourcentage de dégâts
   * @returns {number} 0 à 1
   */
  getDamagePercent() {
    if (this.isIndestructible) return 0;
    return 1 - (this.currentHits / this.maxHits);
  }

  /**
   * Retourne la couleur actuelle selon les dégâts
   * @returns {number} Couleur hex
   */
  getCurrentColor() {
    if (this.isIndestructible) return this.color;

    // Assombrir la couleur selon les dégâts
    const damage = this.getDamagePercent();
    if (damage === 0) return this.color;

    // Extraire RGB
    const r = (this.color >> 16) & 0xff;
    const g = (this.color >> 8) & 0xff;
    const b = this.color & 0xff;

    // Assombrir proportionnellement aux dégâts
    const factor = 1 - (damage * 0.4);
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);

    return (newR << 16) | (newG << 8) | newB;
  }

  /**
   * Retourne les limites de la brique pour les collisions
   * @returns {Object} Bounds de la brique
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    };
  }

  /**
   * Vérifie si un point est dans la brique
   * @param {number} px - Position X du point
   * @param {number} py - Position Y du point
   * @returns {boolean}
   */
  containsPoint(px, py) {
    return px >= this.x &&
           px <= this.x + this.width &&
           py >= this.y &&
           py <= this.y + this.height;
  }

  /**
   * Clone la brique (pour reset niveau)
   * @returns {BrickModel}
   */
  clone() {
    return new BrickModel({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: this.type,
      row: this.row,
      col: this.col
    });
  }
}

/**
 * Classe utilitaire pour gérer la collection de briques
 */
export class BrickCollection {
  constructor() {
    this.bricks = [];
    this.activeBricks = [];
  }

  /**
   * Ajoute une brique à la collection
   * @param {BrickModel} brick
   */
  add(brick) {
    this.bricks.push(brick);
    if (!brick.isDestroyed) {
      this.activeBricks.push(brick);
    }
  }

  /**
   * Retourne toutes les briques actives
   * @returns {Array<BrickModel>}
   */
  getActive() {
    return this.activeBricks.filter(b => !b.isDestroyed);
  }

  /**
   * Retourne les briques destructibles actives
   * @returns {Array<BrickModel>}
   */
  getDestructible() {
    return this.activeBricks.filter(b => !b.isDestroyed && !b.isIndestructible);
  }

  /**
   * Compte les briques restantes (destructibles)
   * @returns {number}
   */
  countRemaining() {
    return this.getDestructible().length;
  }

  /**
   * Compte le total de briques destructibles
   * @returns {number}
   */
  countDestructible() {
    return this.bricks.filter(b => !b.isIndestructible).length;
  }

  /**
   * Vide la collection
   */
  clear() {
    this.bricks = [];
    this.activeBricks = [];
  }

  /**
   * Marque une brique comme détruite et met à jour la liste active
   * @param {BrickModel} brick
   */
  markDestroyed(brick) {
    brick.isDestroyed = true;
    this.activeBricks = this.activeBricks.filter(b => !b.isDestroyed);
  }
}
