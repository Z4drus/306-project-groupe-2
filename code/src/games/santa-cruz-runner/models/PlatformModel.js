/**
 * PlatformModel - Modèle d'une plateforme
 *
 * Gère les données de position, taille et type d'une plateforme
 */

import { PLATFORM_TYPES, PLATFORM_CONFIG } from '../config/GameConfig.js';

export default class PlatformModel {
  /**
   * @param {Object} config - Configuration de la plateforme
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? 0;
    this.y = config.y ?? PLATFORM_CONFIG.baseY;

    // Dimensions
    this.width = config.width ?? 150;
    this.height = config.height ?? PLATFORM_CONFIG.height;

    // Type de plateforme
    this.type = config.type ?? PLATFORM_TYPES.NORMAL;

    // État
    this.isActive = true;
    this.isCrumbling = false;
    this.crumbleTimer = 0;

    // Pour le recyclage
    this.hasCollectible = false;
    this.hasObstacle = false;
  }

  /**
   * Réinitialise la plateforme pour le recyclage
   * @param {Object} config - Nouvelle configuration
   */
  reset(config) {
    this.x = config.x ?? this.x;
    this.y = config.y ?? this.y;
    this.width = config.width ?? this.width;
    this.type = config.type ?? PLATFORM_TYPES.NORMAL;
    this.isActive = true;
    this.isCrumbling = false;
    this.crumbleTimer = 0;
    this.hasCollectible = false;
    this.hasObstacle = false;
  }

  /**
   * Met à jour la position de la plateforme
   * @param {number} scrollSpeed - Vitesse de défilement
   * @param {number} delta - Delta time en ms
   */
  update(scrollSpeed, delta) {
    // Déplacer vers la gauche
    this.x -= scrollSpeed * (delta / 1000);

    // Gérer l'effondrement
    if (this.isCrumbling && this.type.crumbles) {
      this.crumbleTimer -= delta;
      if (this.crumbleTimer <= 0) {
        this.isActive = false;
      }
    }
  }

  /**
   * Démarre l'effondrement (pour les plateformes CRUMBLING)
   */
  startCrumbling() {
    if (this.type.crumbles && !this.isCrumbling) {
      this.isCrumbling = true;
      this.crumbleTimer = this.type.crumbleTime;
    }
  }

  /**
   * Vérifie si la plateforme est hors écran (à gauche)
   * @returns {boolean}
   */
  isOffScreen() {
    return this.x + this.width < 0;
  }

  /**
   * Vérifie si la plateforme est glissante
   * @returns {boolean}
   */
  isSlippery() {
    return this.type.slippery === true;
  }

  /**
   * Vérifie si la plateforme s'effondre
   * @returns {boolean}
   */
  canCrumble() {
    return this.type.crumbles === true;
  }

  /**
   * Retourne les limites de la plateforme pour les collisions
   * @returns {Object}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }

  /**
   * Retourne le centre de la plateforme
   * @returns {Object}
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  /**
   * Retourne le bord droit de la plateforme
   * @returns {number}
   */
  getRightEdge() {
    return this.x + this.width;
  }
}

/**
 * Collection de plateformes avec pooling
 */
export class PlatformCollection {
  constructor() {
    this.platforms = [];
    this.activePlatforms = [];
  }

  /**
   * Ajoute une plateforme à la collection
   * @param {PlatformModel} platform
   */
  add(platform) {
    this.platforms.push(platform);
    if (platform.isActive) {
      this.activePlatforms.push(platform);
    }
  }

  /**
   * Récupère une plateforme inactive du pool
   * @returns {PlatformModel|null}
   */
  getInactive() {
    return this.platforms.find(p => !p.isActive) || null;
  }

  /**
   * Active une plateforme
   * @param {PlatformModel} platform
   */
  activate(platform) {
    platform.isActive = true;
    if (!this.activePlatforms.includes(platform)) {
      this.activePlatforms.push(platform);
    }
  }

  /**
   * Désactive une plateforme
   * @param {PlatformModel} platform
   */
  deactivate(platform) {
    platform.isActive = false;
    const index = this.activePlatforms.indexOf(platform);
    if (index !== -1) {
      this.activePlatforms.splice(index, 1);
    }
  }

  /**
   * Retourne toutes les plateformes actives
   * @returns {Array<PlatformModel>}
   */
  getActive() {
    return this.activePlatforms;
  }

  /**
   * Retourne la dernière plateforme active (la plus à droite)
   * @returns {PlatformModel|null}
   */
  getLastPlatform() {
    if (this.activePlatforms.length === 0) return null;

    return this.activePlatforms.reduce((last, current) => {
      return current.getRightEdge() > last.getRightEdge() ? current : last;
    });
  }

  /**
   * Nettoie la collection
   */
  clear() {
    this.platforms = [];
    this.activePlatforms = [];
  }
}
