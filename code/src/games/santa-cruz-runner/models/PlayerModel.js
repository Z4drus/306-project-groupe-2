/**
 * PlayerModel - Modèle du joueur (Santa)
 *
 * Gère les données de position, état et mouvement du joueur
 */

import { PLAYER_CONFIG } from '../config/GameConfig.js';

/** États du joueur */
export const PlayerState = {
  RUNNING: 'running',
  JUMPING: 'jumping',
  FALLING: 'falling',
  DOUBLE_JUMPING: 'double_jumping',
  DEAD: 'dead'
};

export default class PlayerModel {
  /**
   * @param {Object} config - Configuration optionnelle
   */
  constructor(config = {}) {
    // Position
    this.x = config.x ?? PLAYER_CONFIG.startX;
    this.y = config.y ?? PLAYER_CONFIG.startY;

    // Dimensions
    this.width = PLAYER_CONFIG.width;
    this.height = PLAYER_CONFIG.height;

    // Physique
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = PLAYER_CONFIG.gravity;
    this.jumpVelocity = PLAYER_CONFIG.jumpVelocity;
    this.doubleJumpVelocity = PLAYER_CONFIG.doubleJumpVelocity;

    // État
    this.state = PlayerState.FALLING;
    this.isOnGround = false;
    this.jumpsRemaining = PLAYER_CONFIG.maxJumps;
    this.maxJumps = PLAYER_CONFIG.maxJumps;

    // Flags
    this.isDead = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.respawnProtection = false;
  }

  /**
   * Réinitialise le joueur à sa position de départ
   */
  reset() {
    this.x = PLAYER_CONFIG.startX;
    this.y = PLAYER_CONFIG.startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.state = PlayerState.FALLING;
    this.isOnGround = false;
    this.jumpsRemaining = this.maxJumps;
    this.isDead = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.respawnProtection = true;
  }

  /**
   * Met à jour l'état du joueur
   */
  updateState() {
    if (this.isDead) {
      this.state = PlayerState.DEAD;
    } else if (this.isOnGround) {
      this.state = PlayerState.RUNNING;
    } else if (this.velocityY < 0) {
      this.state = this.jumpsRemaining < this.maxJumps - 1
        ? PlayerState.DOUBLE_JUMPING
        : PlayerState.JUMPING;
    } else {
      this.state = PlayerState.FALLING;
    }
  }

  /**
   * Le joueur atterrit sur le sol
   */
  land() {
    this.isOnGround = true;
    this.velocityY = 0;
    this.jumpsRemaining = this.maxJumps;
    this.respawnProtection = false;
    this.updateState();
  }

  /**
   * Le joueur quitte le sol
   */
  leaveGround() {
    this.isOnGround = false;
    this.updateState();
  }

  /**
   * Effectue un saut
   * @returns {boolean} True si le saut a été effectué
   */
  jump() {
    if (this.jumpsRemaining > 0) {
      // Premier saut ou double saut
      const isDoubleJump = !this.isOnGround && this.jumpsRemaining < this.maxJumps;
      this.velocityY = isDoubleJump ? this.doubleJumpVelocity : this.jumpVelocity;
      this.jumpsRemaining--;
      this.isOnGround = false;
      this.updateState();
      return true;
    }
    return false;
  }

  /**
   * Vérifie si le joueur peut sauter
   * @returns {boolean}
   */
  canJump() {
    return this.jumpsRemaining > 0 && !this.isDead;
  }

  /**
   * Marque le joueur comme mort
   */
  die() {
    this.isDead = true;
    this.state = PlayerState.DEAD;
  }

  /**
   * Active l'invincibilité temporaire
   * @param {number} duration - Durée en ms
   */
  setInvincible(duration = 2000) {
    this.isInvincible = true;
    this.invincibilityTimer = duration;
  }

  /**
   * Met à jour le timer d'invincibilité
   * @param {number} delta - Delta time en ms
   */
  updateInvincibility(delta) {
    if (this.isInvincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
      }
    }
  }

  /**
   * Vérifie si le joueur est en train de courir
   * @returns {boolean}
   */
  isRunning() {
    return this.state === PlayerState.RUNNING;
  }

  /**
   * Vérifie si le joueur est en l'air
   * @returns {boolean}
   */
  isInAir() {
    return this.state === PlayerState.JUMPING ||
           this.state === PlayerState.FALLING ||
           this.state === PlayerState.DOUBLE_JUMPING;
  }

  /**
   * Retourne les limites du joueur pour les collisions
   * @returns {Object}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
      right: this.x + this.width / 2,
      bottom: this.y + this.height / 2
    };
  }
}
