/**
 * CollectibleModel - Modèle d'un collectible (cadeau, bonbon, etc.)
 *
 * Gère les données de position, type et points d'un collectible
 */

import { COLLECTIBLE_CONFIG } from '../config/GameConfig.js';

export default class CollectibleModel {
  /**
   * @param {Object} config - Configuration du collectible
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;

    // Type et points
    this.type = config.type ?? COLLECTIBLE_CONFIG.types.GIFT_SMALL;
    this.points = this.type.points;
    this.size = this.type.size;

    // État
    this.isActive = true;
    this.isCollected = false;

    // Animation
    this.floatOffset = Math.random() * Math.PI * 2;
    this.floatSpeed = 2 + Math.random();
    this.floatAmplitude = 5;
  }

  /**
   * Réinitialise le collectible pour le recyclage
   * @param {Object} config - Nouvelle configuration
   */
  reset(config) {
    this.x = config.x ?? this.x;
    this.y = config.y ?? this.y;
    this.type = config.type ?? this.type;
    this.points = this.type.points;
    this.size = this.type.size;
    this.isActive = true;
    this.isCollected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  /**
   * Met à jour la position du collectible
   * @param {number} scrollSpeed - Vitesse de défilement
   * @param {number} delta - Delta time en ms
   * @param {number} time - Temps total écoulé
   */
  update(scrollSpeed, delta, time) {
    // Déplacer vers la gauche
    this.x -= scrollSpeed * (delta / 1000);
  }

  /**
   * Retourne la position Y avec l'effet de flottement
   * @param {number} time - Temps total écoulé en ms
   * @returns {number}
   */
  getFloatingY(time) {
    const floatY = Math.sin((time / 1000) * this.floatSpeed + this.floatOffset) * this.floatAmplitude;
    return this.y + floatY;
  }

  /**
   * Marque le collectible comme collecté
   */
  collect() {
    this.isCollected = true;
    this.isActive = false;
  }

  /**
   * Vérifie si le collectible est hors écran
   * @returns {boolean}
   */
  isOffScreen() {
    return this.x + this.size < 0;
  }

  /**
   * Retourne les limites du collectible pour les collisions
   * @returns {Object}
   */
  getBounds() {
    const halfSize = this.size / 2;
    return {
      x: this.x - halfSize,
      y: this.y - halfSize,
      width: this.size,
      height: this.size,
      right: this.x + halfSize,
      bottom: this.y + halfSize
    };
  }
}

/**
 * Collection de collectibles avec pooling
 */
export class CollectibleCollection {
  constructor() {
    this.collectibles = [];
    this.activeCollectibles = [];
  }

  /**
   * Ajoute un collectible à la collection
   * @param {CollectibleModel} collectible
   */
  add(collectible) {
    this.collectibles.push(collectible);
    if (collectible.isActive) {
      this.activeCollectibles.push(collectible);
    }
  }

  /**
   * Récupère un collectible inactif du pool
   * @returns {CollectibleModel|null}
   */
  getInactive() {
    return this.collectibles.find(c => !c.isActive) || null;
  }

  /**
   * Active un collectible
   * @param {CollectibleModel} collectible
   */
  activate(collectible) {
    collectible.isActive = true;
    if (!this.activeCollectibles.includes(collectible)) {
      this.activeCollectibles.push(collectible);
    }
  }

  /**
   * Désactive un collectible
   * @param {CollectibleModel} collectible
   */
  deactivate(collectible) {
    collectible.isActive = false;
    const index = this.activeCollectibles.indexOf(collectible);
    if (index !== -1) {
      this.activeCollectibles.splice(index, 1);
    }
  }

  /**
   * Retourne tous les collectibles actifs
   * @returns {Array<CollectibleModel>}
   */
  getActive() {
    return this.activeCollectibles;
  }

  /**
   * Nettoie la collection
   */
  clear() {
    this.collectibles = [];
    this.activeCollectibles = [];
  }
}

/**
 * Sélectionne un type de collectible aléatoire
 * @param {number} level - Niveau actuel (affecte les probabilités)
 * @returns {Object} Type de collectible
 */
export function getRandomCollectibleType(level = 1) {
  const types = COLLECTIBLE_CONFIG.types;
  const roll = Math.random();

  // Plus le niveau est élevé, plus de chances d'avoir de meilleurs cadeaux
  const goldChance = 0.05 + (level - 1) * 0.02;
  const mediumChance = 0.2 + (level - 1) * 0.03;
  const candyChance = 0.25;

  if (roll < goldChance) {
    return types.GIFT_LARGE;
  } else if (roll < goldChance + mediumChance) {
    return types.GIFT_MEDIUM;
  } else if (roll < goldChance + mediumChance + candyChance) {
    return types.CANDY_CANE;
  }

  return types.GIFT_SMALL;
}
