/**
 * PacmanModel - Modèle de données pour Pacman
 *
 * Contient uniquement l'état de Pacman (position, direction, etc.)
 * sans aucune logique de rendu ou de contrôle
 */

import Phaser from 'phaser';
import { START_POSITIONS, GRID_SIZE, SPEEDS, COOLDOWNS } from '../config/GameConfig.js';

export default class PacmanModel {
  constructor() {
    // Position de départ
    this.startPosition = { ...START_POSITIONS.PACMAN };

    // Position actuelle sur la grille
    this.gridX = this.startPosition.x;
    this.gridY = this.startPosition.y;

    // Position en pixels
    this.x = this.gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = this.gridY * GRID_SIZE + GRID_SIZE / 2;

    // Directions
    this.currentDirection = Phaser.NONE;
    this.wantedDirection = Phaser.NONE;
    this.turningDirection = Phaser.NONE;

    // Point de virage
    this.turnPoint = { x: 0, y: 0 };

    // Configuration
    this.speed = SPEEDS.PACMAN;
    this.gridSize = GRID_SIZE;
    this.threshold = COOLDOWNS.PACMAN_THRESHOLD;

    // États
    this.isDead = false;
    this.isAnimatingDeath = false;
    this.deathAnimationComplete = false;

    // Directions opposées pour les demi-tours
    this.opposites = [
      Phaser.NONE,
      Phaser.RIGHT,
      Phaser.LEFT,
      Phaser.DOWN,
      Phaser.UP
    ];
  }

  /**
   * Met à jour la position sur la grille
   * @param {number} pixelX - Position X en pixels
   * @param {number} pixelY - Position Y en pixels
   */
  updateGridPosition(pixelX, pixelY) {
    this.x = pixelX;
    this.y = pixelY;
    this.gridX = Phaser.Math.Snap.Floor(Math.floor(pixelX), this.gridSize) / this.gridSize;
    this.gridY = Phaser.Math.Snap.Floor(Math.floor(pixelY), this.gridSize) / this.gridSize;
  }

  /**
   * Définit la direction voulue
   * @param {number} direction - Direction Phaser
   */
  setWantedDirection(direction) {
    if (direction !== this.currentDirection) {
      this.wantedDirection = direction;
    }
  }

  /**
   * Définit la direction de virage
   * @param {number} direction - Direction Phaser
   */
  setTurningDirection(direction) {
    this.turningDirection = direction;
    this.turnPoint.x = this.gridX * this.gridSize + this.gridSize / 2;
    this.turnPoint.y = this.gridY * this.gridSize + this.gridSize / 2;
  }

  /**
   * Effectue le virage
   * @param {number} direction - Nouvelle direction
   */
  completeTurn(direction) {
    this.currentDirection = direction;
    this.turningDirection = Phaser.NONE;
    this.wantedDirection = Phaser.NONE;
  }

  /**
   * Vérifie si c'est un demi-tour
   * @param {number} direction - Direction à vérifier
   * @returns {boolean}
   */
  isOppositeDirection(direction) {
    return this.currentDirection === this.opposites[direction];
  }

  /**
   * Retourne la position en pixels centrée sur la grille
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return {
      x: this.gridX * this.gridSize + this.gridSize / 2,
      y: this.gridY * this.gridSize + this.gridSize / 2
    };
  }

  /**
   * Tue Pacman
   */
  kill() {
    this.isDead = true;
    this.currentDirection = Phaser.NONE;
  }

  /**
   * Réinitialise Pacman à sa position de départ
   */
  reset() {
    this.gridX = this.startPosition.x;
    this.gridY = this.startPosition.y;
    this.x = this.gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = this.gridY * GRID_SIZE + GRID_SIZE / 2;
    this.currentDirection = Phaser.LEFT;
    this.wantedDirection = Phaser.NONE;
    this.turningDirection = Phaser.NONE;
    this.isDead = false;
    this.isAnimatingDeath = false;
    this.deathAnimationComplete = false;
  }

  /**
   * Marque l'animation de mort comme terminée
   */
  setDeathAnimationComplete() {
    this.deathAnimationComplete = true;
  }
}
