/**
 * BallModel - Modèle de la balle
 *
 * Gère les données de position, vélocité et état de la balle
 */

import { BALL_CONFIG, PLAY_AREA } from '../config/GameConfig.js';

export default class BallModel {
  /**
   * @param {Object} config - Configuration optionnelle
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;

    // Dimensions
    this.radius = config.radius ?? BALL_CONFIG.radius;

    // Vélocité
    this.velocityX = 0;
    this.velocityY = 0;

    // Vitesse de base
    this.baseSpeed = config.speed ?? BALL_CONFIG.baseSpeed;
    this.currentSpeed = this.baseSpeed;

    // État
    this.isActive = false;
    this.isLost = false;
  }

  /**
   * Réinitialise la balle à une position donnée
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isActive = false;
    this.isLost = false;
  }

  /**
   * Lance la balle avec une direction initiale
   * @param {number} angle - Angle de lancement en radians (optionnel)
   */
  launch(angle = null) {
    if (angle === null) {
      // Angle aléatoire entre -60 et 60 degrés vers le haut
      const randomAngle = (Math.random() * 60 - 30) * (Math.PI / 180);
      angle = -Math.PI / 2 + randomAngle;
    }

    this.velocityX = Math.cos(angle) * this.currentSpeed;
    this.velocityY = Math.sin(angle) * this.currentSpeed;
    this.isActive = true;
  }

  /**
   * Met à jour la position selon la vélocité
   * @param {number} delta - Delta temps en secondes
   */
  update(delta) {
    if (!this.isActive) return;

    this.x += this.velocityX * delta;
    this.y += this.velocityY * delta;

    // Vérifier si la balle est perdue (sortie par le bas)
    if (this.y > PLAY_AREA.y + PLAY_AREA.height + this.radius) {
      this.isLost = true;
      this.isActive = false;
    }
  }

  /**
   * Définit la vitesse de la balle
   * @param {number} speed - Nouvelle vitesse
   */
  setSpeed(speed) {
    this.currentSpeed = speed;

    // Mettre à jour la vélocité en conservant la direction
    if (this.isActive) {
      const currentMagnitude = Math.sqrt(
        this.velocityX * this.velocityX + this.velocityY * this.velocityY
      );
      if (currentMagnitude > 0) {
        const ratio = speed / currentMagnitude;
        this.velocityX *= ratio;
        this.velocityY *= ratio;
      }
    }
  }

  /**
   * Inverse la vélocité horizontale (rebond mur)
   */
  bounceX() {
    this.velocityX = -this.velocityX;
  }

  /**
   * Inverse la vélocité verticale (rebond mur/brique/paddle)
   */
  bounceY() {
    this.velocityY = -this.velocityY;
  }

  /**
   * Rebond avec angle modifié (paddle)
   * @param {number} paddleCenterX - Centre X du paddle
   * @param {number} paddleWidth - Largeur du paddle
   */
  bounceOffPaddle(paddleCenterX, paddleWidth) {
    // Calculer où la balle a touché le paddle (-1 à 1)
    const hitPosition = (this.x - paddleCenterX) / (paddleWidth / 2);

    // Convertir en angle (-60 à 60 degrés)
    const maxAngle = BALL_CONFIG.maxBounceAngle * (Math.PI / 180);
    const bounceAngle = hitPosition * maxAngle;

    // Toujours vers le haut avec l'angle calculé
    const speed = this.currentSpeed;
    this.velocityX = Math.sin(bounceAngle) * speed;
    this.velocityY = -Math.abs(Math.cos(bounceAngle) * speed);

    // S'assurer que la balle monte toujours
    if (this.velocityY > -speed * 0.3) {
      this.velocityY = -speed * 0.3;
    }
  }

  /**
   * Définit la vélocité directement
   * @param {number} vx - Vélocité X
   * @param {number} vy - Vélocité Y
   */
  setVelocity(vx, vy) {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  /**
   * Retourne les limites de la balle pour les collisions
   * @returns {Object} Bounds de la balle
   */
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius
    };
  }

  /**
   * Retourne le centre de la balle
   * @returns {Object} Position centrale
   */
  getCenter() {
    return {
      x: this.x,
      y: this.y
    };
  }

  /**
   * Vérifie si la balle est active
   * @returns {boolean}
   */
  isMoving() {
    return this.isActive && !this.isLost;
  }
}
