/**
 * PowerUpModel - Modèle de données pour les power-ups
 *
 * Gère les données de position, type et état des power-ups
 */

import { POWER_UP_CONFIG } from '../config/PowerUpConfig.js';
import { PLAY_AREA } from '../config/GameConfig.js';

/**
 * Modèle d'un power-up individuel
 */
export default class PowerUpModel {
  /**
   * @param {Object} config - Configuration du power-up
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;

    // Dimensions
    this.width = config.width ?? POWER_UP_CONFIG.width;
    this.height = config.height ?? POWER_UP_CONFIG.height;

    // Type de power-up (référence vers POWER_UP_TYPES)
    this.type = config.type ?? null;

    // Vitesse de chute
    this.fallSpeed = config.fallSpeed ?? POWER_UP_CONFIG.fallSpeed;

    // État
    this.isActive = true;
    this.isCollected = false;

    // ID unique
    this.id = `powerup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Met à jour la position (chute)
   * @param {number} delta - Delta temps en ms
   */
  update(delta) {
    if (!this.isActive) return;

    // Convertir delta en secondes
    const deltaSeconds = delta / 1000;
    this.y += this.fallSpeed * deltaSeconds;

    // Vérifier si le power-up est sorti de l'écran
    if (this.y > PLAY_AREA.y + PLAY_AREA.height + this.height) {
      this.isActive = false;
    }
  }

  /**
   * Marque le power-up comme collecté
   */
  collect() {
    this.isCollected = true;
    this.isActive = false;
  }

  /**
   * Retourne les limites pour les collisions
   * @returns {Object}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }

  /**
   * Vérifie la collision avec le paddle
   * @param {Object} paddleBounds - Limites du paddle
   * @returns {boolean}
   */
  checkPaddleCollision(paddleBounds) {
    const bounds = this.getBounds();
    return (
      bounds.right > paddleBounds.left &&
      bounds.left < paddleBounds.right &&
      bounds.bottom > paddleBounds.top &&
      bounds.top < paddleBounds.bottom
    );
  }

  /**
   * Détruit le power-up
   */
  destroy() {
    this.isActive = false;
    this.isCollected = false;
  }
}

/**
 * Collection de power-ups actifs
 */
export class PowerUpCollection {
  constructor() {
    this.powerUps = [];
  }

  /**
   * Ajoute un power-up à la collection
   * @param {PowerUpModel} powerUp
   */
  add(powerUp) {
    if (this.powerUps.length < POWER_UP_CONFIG.maxActivePowerUps) {
      this.powerUps.push(powerUp);
    }
  }

  /**
   * Retire un power-up de la collection
   * @param {PowerUpModel} powerUp
   */
  remove(powerUp) {
    const index = this.powerUps.indexOf(powerUp);
    if (index !== -1) {
      this.powerUps.splice(index, 1);
    }
  }

  /**
   * Retourne tous les power-ups actifs
   * @returns {Array<PowerUpModel>}
   */
  getActive() {
    return this.powerUps.filter(p => p.isActive);
  }

  /**
   * Met à jour tous les power-ups
   * @param {number} delta
   */
  update(delta) {
    this.powerUps.forEach(powerUp => powerUp.update(delta));
    // Nettoyer les power-ups inactifs
    this.powerUps = this.powerUps.filter(p => p.isActive);
  }

  /**
   * Vide la collection
   */
  clear() {
    this.powerUps.forEach(p => p.destroy());
    this.powerUps = [];
  }

  /**
   * Retourne le nombre de power-ups actifs
   * @returns {number}
   */
  count() {
    return this.powerUps.length;
  }
}

/**
 * Gestionnaire des effets actifs
 */
export class ActiveEffectsManager {
  constructor() {
    // Map des effets actifs avec leur timer
    this.effects = new Map();
    // Callbacks pour quand un effet expire
    this.onEffectExpire = null;
  }

  /**
   * Active un effet
   * @param {string} effectId - ID de l'effet
   * @param {number} duration - Durée en ms (0 = permanent)
   * @param {*} value - Valeur de l'effet
   */
  activate(effectId, duration, value) {
    // Si l'effet existe déjà, le prolonger
    if (this.effects.has(effectId)) {
      const existing = this.effects.get(effectId);
      if (existing.timer) {
        clearTimeout(existing.timer);
      }
    }

    const effect = {
      id: effectId,
      value,
      duration,
      startTime: Date.now(),
      timer: null
    };

    // Configurer le timer si durée > 0
    if (duration > 0) {
      effect.timer = setTimeout(() => {
        this.deactivate(effectId);
      }, duration);
    }

    this.effects.set(effectId, effect);
  }

  /**
   * Désactive un effet
   * @param {string} effectId
   */
  deactivate(effectId) {
    const effect = this.effects.get(effectId);
    if (effect) {
      if (effect.timer) {
        clearTimeout(effect.timer);
      }
      this.effects.delete(effectId);

      if (this.onEffectExpire) {
        this.onEffectExpire(effectId, effect.value);
      }
    }
  }

  /**
   * Vérifie si un effet est actif
   * @param {string} effectId
   * @returns {boolean}
   */
  isActive(effectId) {
    return this.effects.has(effectId);
  }

  /**
   * Retourne la valeur d'un effet actif
   * @param {string} effectId
   * @returns {*}
   */
  getValue(effectId) {
    const effect = this.effects.get(effectId);
    return effect ? effect.value : null;
  }

  /**
   * Retourne le temps restant pour un effet
   * @param {string} effectId
   * @returns {number} Temps restant en ms, -1 si permanent, 0 si non actif
   */
  getRemainingTime(effectId) {
    const effect = this.effects.get(effectId);
    if (!effect) return 0;
    if (effect.duration === 0) return -1;

    const elapsed = Date.now() - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
  }

  /**
   * Retourne tous les effets actifs avec leur temps restant
   * @returns {Array<Object>}
   */
  getAllActive() {
    const active = [];
    this.effects.forEach((effect, id) => {
      active.push({
        id,
        value: effect.value,
        remainingTime: this.getRemainingTime(id),
        duration: effect.duration
      });
    });
    return active;
  }

  /**
   * Définit le callback d'expiration
   * @param {Function} callback
   */
  setExpireCallback(callback) {
    this.onEffectExpire = callback;
  }

  /**
   * Nettoie tous les effets
   */
  clear() {
    this.effects.forEach(effect => {
      if (effect.timer) {
        clearTimeout(effect.timer);
      }
    });
    this.effects.clear();
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
    this.onEffectExpire = null;
  }
}
