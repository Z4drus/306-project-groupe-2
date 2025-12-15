/**
 * MapModel - Modèle de données pour la carte du jeu
 *
 * Gère les données du labyrinthe et les positions des dots/pills
 */

import { GRID_SIZE, TILES, SPECIAL_TILES } from '../config/GameConfig.js';

export default class MapModel {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.widthInPixels = 0;
    this.heightInPixels = 0;

    // Positions des dots et pills
    this.dotPositions = [];
    this.pillPositions = [];

    // Tiles spéciales
    this.specialTiles = SPECIAL_TILES;

    // Configuration des tiles
    this.safeTile = TILES.SAFE;
    this.dotTile = TILES.DOT;
    this.pillTile = TILES.PILL;
  }

  /**
   * Initialise les dimensions de la carte
   * @param {number} width - Largeur en tiles
   * @param {number} height - Hauteur en tiles
   */
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.widthInPixels = width * GRID_SIZE;
    this.heightInPixels = height * GRID_SIZE;
  }

  /**
   * Ajoute une position de dot
   * @param {number} x - Position X en tiles
   * @param {number} y - Position Y en tiles
   */
  addDotPosition(x, y) {
    this.dotPositions.push({ x, y });
  }

  /**
   * Ajoute une position de pill
   * @param {number} x - Position X en tiles
   * @param {number} y - Position Y en tiles
   */
  addPillPosition(x, y) {
    this.pillPositions.push({ x, y });
  }

  /**
   * Vérifie si une position est une tile spéciale
   * @param {number} x - Position X en tiles
   * @param {number} y - Position Y en tiles
   * @returns {boolean}
   */
  isSpecialTile(x, y) {
    return this.specialTiles.some(tile => tile.x === x && tile.y === y);
  }

  /**
   * Convertit une position pixel en position grille
   * @param {number} pixelX - Position X en pixels
   * @param {number} pixelY - Position Y en pixels
   * @returns {Object} Position {x, y} en tiles
   */
  pixelToGrid(pixelX, pixelY) {
    return {
      x: Math.floor(pixelX / GRID_SIZE),
      y: Math.floor(pixelY / GRID_SIZE)
    };
  }

  /**
   * Convertit une position grille en position pixel (centre de la tile)
   * @param {number} gridX - Position X en tiles
   * @param {number} gridY - Position Y en tiles
   * @returns {Object} Position {x, y} en pixels
   */
  gridToPixel(gridX, gridY) {
    return {
      x: gridX * GRID_SIZE + GRID_SIZE / 2,
      y: gridY * GRID_SIZE + GRID_SIZE / 2
    };
  }

  /**
   * Gère le wrapping aux bords de la carte
   * @param {number} x - Position X en pixels
   * @returns {number} Position X ajustée
   */
  wrapX(x) {
    if (x < 0) {
      return this.widthInPixels - 1;
    }
    if (x >= this.widthInPixels) {
      return 1;
    }
    return x;
  }

  /**
   * Retourne le nombre total de collectibles
   * @returns {number}
   */
  getTotalCollectibles() {
    return this.dotPositions.length + this.pillPositions.length;
  }

  /**
   * Réinitialise les positions des collectibles
   */
  reset() {
    this.dotPositions = [];
    this.pillPositions = [];
  }
}
