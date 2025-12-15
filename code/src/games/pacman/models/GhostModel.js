/**
 * GhostModel - Modèle de données pour un fantôme
 *
 * Contient uniquement l'état du fantôme (position, mode, etc.)
 */

import Phaser from 'phaser';
import { GRID_SIZE, SPEEDS, GHOST_CONFIG, START_POSITIONS, TILES, COOLDOWNS } from '../config/GameConfig.js';

/** Modes du fantôme */
export const GhostMode = {
  CHASE: 'chase',
  SCATTER: 'scatter',
  FRIGHTENED: 'frightened',
  AT_HOME: 'at_home',
  EXIT_HOME: 'exit_home',
  RETURNING: 'returning',
  STOP: 'stop'
};

export default class GhostModel {
  /**
   * @param {string} name - Nom du fantôme (blinky, pinky, inky, clyde)
   * @param {number} speedMultiplier - Multiplicateur de vitesse selon le niveau
   */
  constructor(name, speedMultiplier = 1) {
    this.name = name;
    this.config = GHOST_CONFIG[name];

    // Position de départ
    const startKey = name.toUpperCase();
    this.startPosition = { ...START_POSITIONS[startKey] };
    this.startDirection = this.config.startDir;

    // Position actuelle
    this.gridX = this.startPosition.x;
    this.gridY = this.startPosition.y;
    this.x = this.gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = this.gridY * GRID_SIZE + GRID_SIZE / 2;

    // Direction
    this.currentDirection = this.startDirection;

    // Mode
    this.mode = this.config.startsOutside ? GhostMode.SCATTER : GhostMode.AT_HOME;
    this.isAttacking = false;

    // Vitesses
    this.speedMultiplier = speedMultiplier;
    this.normalSpeed = SPEEDS.GHOST_NORMAL * speedMultiplier;
    this.scatterSpeed = SPEEDS.GHOST_SCATTER * speedMultiplier;
    this.frightenedSpeed = SPEEDS.GHOST_FRIGHTENED * speedMultiplier;
    this.returningSpeed = SPEEDS.GHOST_RETURNING * speedMultiplier;

    // Destination
    this.destination = null;
    this.scatterDestination = {
      x: this.config.scatterCorner.x * GRID_SIZE,
      y: this.config.scatterCorner.y * GRID_SIZE
    };

    // Safe tiles
    this.safeTiles = this.config.startsOutside ? [TILES.SAFE] : [...TILES.GHOST_HOUSE];

    // Cooldown de virage
    this.turnTimer = 0;
    this.turningCooldown = COOLDOWNS.GHOST_TURN;

    // Offset sprite
    this.spriteOffset = this.config.spriteOffset;

    // Directions opposées
    this.opposites = [
      Phaser.NONE,
      Phaser.RIGHT,
      Phaser.LEFT,
      Phaser.DOWN,
      Phaser.UP
    ];
  }

  /**
   * Met à jour la position
   * @param {number} pixelX - Position X en pixels
   * @param {number} pixelY - Position Y en pixels
   */
  updatePosition(pixelX, pixelY) {
    this.x = pixelX;
    this.y = pixelY;
    this.gridX = Phaser.Math.Snap.Floor(Math.floor(pixelX), GRID_SIZE) / GRID_SIZE;
    this.gridY = Phaser.Math.Snap.Floor(Math.floor(pixelY), GRID_SIZE) / GRID_SIZE;
  }

  /**
   * Retourne la position centrée
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return {
      x: this.gridX * GRID_SIZE + GRID_SIZE / 2,
      y: this.gridY * GRID_SIZE + GRID_SIZE / 2
    };
  }

  /**
   * Retourne la vitesse actuelle selon le mode
   * @param {string} globalMode - Mode global du jeu
   * @param {number} numDots - Nombre de dots restants (pour Cruise Elroy)
   * @returns {number}
   */
  getCurrentSpeed(globalMode, numDots) {
    // Cruise Elroy pour Blinky
    if (this.name === 'blinky' && numDots < 20 && this.mode !== GhostMode.RETURNING && this.mode !== GhostMode.FRIGHTENED) {
      return this.returningSpeed;
    }

    switch (this.mode) {
      case GhostMode.FRIGHTENED:
        return this.frightenedSpeed;
      case GhostMode.RETURNING:
        return this.returningSpeed;
      default:
        return globalMode === 'scatter' ? this.scatterSpeed : this.normalSpeed;
    }
  }

  /**
   * Change le mode du fantôme
   * @param {string} newMode - Nouveau mode
   */
  setMode(newMode) {
    this.mode = newMode;
  }

  /**
   * Définit la destination
   * @param {Object} dest - Destination {x, y}
   */
  setDestination(dest) {
    this.destination = dest;
  }

  /**
   * Définit la direction
   * @param {number} direction - Direction Phaser
   */
  setDirection(direction) {
    this.currentDirection = direction;
  }

  /**
   * Passe en mode attaque
   */
  attack() {
    if (this.mode !== GhostMode.RETURNING) {
      this.isAttacking = true;
      if (this.mode !== GhostMode.AT_HOME && this.mode !== GhostMode.EXIT_HOME) {
        this.currentDirection = this.opposites[this.currentDirection];
      }
    }
  }

  /**
   * Passe en mode scatter
   */
  scatter() {
    if (this.mode !== GhostMode.RETURNING) {
      this.isAttacking = false;
      if (this.mode !== GhostMode.AT_HOME && this.mode !== GhostMode.EXIT_HOME) {
        this.mode = GhostMode.SCATTER;
      }
    }
  }

  /**
   * Passe en mode frightened
   */
  enterFrightenedMode() {
    if (this.mode !== GhostMode.AT_HOME && this.mode !== GhostMode.EXIT_HOME && this.mode !== GhostMode.RETURNING) {
      this.mode = GhostMode.FRIGHTENED;
      this.isAttacking = false;
    }
  }

  /**
   * Passe en mode returning (mangé par Pacman)
   */
  eaten() {
    this.mode = GhostMode.RETURNING;
    this.destination = {
      x: 14 * GRID_SIZE,
      y: 14 * GRID_SIZE
    };
    this.resetSafeTiles();
  }

  /**
   * Réinitialise les safe tiles
   */
  resetSafeTiles() {
    this.safeTiles = [...TILES.GHOST_HOUSE];
  }

  /**
   * Vérifie si une tile est traversable
   * @param {number} tileIndex - Index de la tile
   * @returns {boolean}
   */
  isSafeTile(tileIndex) {
    if (tileIndex === undefined) return false;
    return this.safeTiles.includes(tileIndex);
  }

  /**
   * Vérifie si le fantôme est arrivé à la maison
   * @returns {boolean}
   */
  hasReachedHome() {
    return (
      this.x >= 11 * GRID_SIZE &&
      this.x <= 16 * GRID_SIZE &&
      this.y >= 13 * GRID_SIZE &&
      this.y <= 15 * GRID_SIZE
    );
  }

  /**
   * Réinitialise le fantôme à sa position de départ
   */
  reset() {
    this.gridX = this.startPosition.x;
    this.gridY = this.startPosition.y;
    this.x = this.gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = this.gridY * GRID_SIZE + GRID_SIZE / 2;
    this.currentDirection = this.startDirection;
    this.mode = GhostMode.AT_HOME;
    this.isAttacking = false;
    this.destination = null;
    this.turnTimer = 0;
  }

  /**
   * Met à jour le timer de virage
   * @param {number} time - Temps actuel
   * @returns {boolean} True si peut tourner
   */
  canTurn(time) {
    return this.turnTimer < time;
  }

  /**
   * Définit le cooldown de virage
   * @param {number} time - Temps actuel
   */
  setTurnCooldown(time) {
    this.turnTimer = time + this.turningCooldown;
  }
}
