/**
 * PaddleModel - Modèle du paddle (raquette)
 *
 * Gère les données de position et de mouvement du paddle
 */

import { PADDLE_CONFIG, PLAY_AREA } from '../config/GameConfig.js';

export default class PaddleModel {
  /**
   * @param {Object} config - Configuration optionnelle
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? (PLAY_AREA.x + PLAY_AREA.width / 2);
    this.y = config.y ?? PADDLE_CONFIG.startY;

    // Dimensions
    this.width = config.width ?? PADDLE_CONFIG.width;
    this.height = config.height ?? PADDLE_CONFIG.height;

    // Vitesse
    this.speed = config.speed ?? PADDLE_CONFIG.speed;

    // Limites de mouvement
    this.minX = PADDLE_CONFIG.minX;
    this.maxX = PADDLE_CONFIG.maxX;

    // Direction actuelle (-1 = gauche, 0 = immobile, 1 = droite)
    this.direction = 0;

    // Vélocité pour le mouvement fluide
    this.velocityX = 0;
  }

  /**
   * Réinitialise la position du paddle
   */
  reset() {
    this.x = PLAY_AREA.x + PLAY_AREA.width / 2;
    this.direction = 0;
    this.velocityX = 0;
  }

  /**
   * Définit la direction du mouvement (supporte valeurs analogiques)
   * @param {number} direction - Valeur entre -1 (gauche) et 1 (droite), 0 = stop
   */
  setDirection(direction) {
    this.direction = direction;
    // La vitesse est proportionnelle à l'inclinaison du joystick
    this.velocityX = direction * this.speed;
  }

  /**
   * Définit la position X directement (pour le contrôle à la souris sans pointer lock)
   * @param {number} x - Nouvelle position X
   */
  setPositionX(x) {
    this.x = Math.max(this.minX, Math.min(this.maxX, x));
  }

  /**
   * Déplace le paddle par un delta (pour le contrôle souris avec pointer lock)
   * @param {number} deltaX - Delta de déplacement en pixels
   */
  moveByDelta(deltaX) {
    const newX = this.x + deltaX;
    this.x = Math.max(this.minX, Math.min(this.maxX, newX));
  }

  /**
   * Met à jour la position selon la vélocité
   * @param {number} delta - Delta temps en secondes
   */
  update(delta) {
    if (this.velocityX !== 0) {
      const newX = this.x + this.velocityX * delta;
      this.x = Math.max(this.minX, Math.min(this.maxX, newX));
    }
  }

  /**
   * Met à jour la vitesse du paddle
   * @param {number} speed - Nouvelle vitesse
   */
  setSpeed(speed) {
    this.speed = speed;
    if (this.direction !== 0) {
      this.velocityX = this.direction * this.speed;
    }
  }

  /**
   * Retourne les limites du paddle pour les collisions
   * @returns {Object} Bounds du paddle
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
   * Retourne le centre du paddle
   * @returns {Object} Position centrale
   */
  getCenter() {
    return {
      x: this.x,
      y: this.y
    };
  }
}
