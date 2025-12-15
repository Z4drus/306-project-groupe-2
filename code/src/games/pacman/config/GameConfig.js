/**
 * GameConfig - Configuration et constantes du jeu Pacman
 *
 * Centralise toutes les valeurs de configuration pour faciliter
 * les ajustements et la maintenance
 */

import Phaser from 'phaser';

/** Dimensions du jeu */
export const GAME_WIDTH = 448;
export const GAME_HEIGHT = 496;
export const GRID_SIZE = 16;

/** Tiles */
export const TILES = {
  SAFE: 14,
  DOT: 7,
  PILL: 40,
  GHOST_HOUSE: [14, 35, 36]
};

/** Positions de départ */
export const START_POSITIONS = {
  PACMAN: { x: 14, y: 17 },
  BLINKY: { x: 13, y: 11 },
  PINKY: { x: 15, y: 14 },
  INKY: { x: 14, y: 14 },
  CLYDE: { x: 17, y: 14 }
};

/** Tiles spéciales où les fantômes ne peuvent pas monter */
export const SPECIAL_TILES = [
  { x: 12, y: 11 },
  { x: 15, y: 11 },
  { x: 12, y: 23 },
  { x: 15, y: 23 }
];

/** Coins de scatter pour chaque fantôme */
export const SCATTER_CORNERS = {
  BLINKY: { x: 27, y: 0 },
  PINKY: { x: 0, y: 0 },
  INKY: { x: 27, y: 30 },
  CLYDE: { x: 0, y: 30 }
};

/** Vitesses de base */
export const SPEEDS = {
  PACMAN: 150,
  GHOST_NORMAL: 150,
  GHOST_SCATTER: 125,
  GHOST_FRIGHTENED: 75,
  GHOST_RETURNING: 160
};

/** Configuration des fantômes */
export const GHOST_CONFIG = {
  blinky: {
    spriteOffset: 12,
    startDir: Phaser.RIGHT,
    scatterCorner: SCATTER_CORNERS.BLINKY,
    startsOutside: true
  },
  pinky: {
    spriteOffset: 8,
    startDir: Phaser.LEFT,
    scatterCorner: SCATTER_CORNERS.PINKY,
    startsOutside: false
  },
  inky: {
    spriteOffset: 0,
    startDir: Phaser.RIGHT,
    scatterCorner: SCATTER_CORNERS.INKY,
    startsOutside: false
  },
  clyde: {
    spriteOffset: 4,
    startDir: Phaser.LEFT,
    scatterCorner: SCATTER_CORNERS.CLYDE,
    startsOutside: false
  }
};

/** Scores */
export const SCORES = {
  DOT: 10,
  PILL: 50,
  GHOST: 200,
  LEVEL_COMPLETE: 1000
};

/** Valeurs initiales */
export const INITIAL_VALUES = {
  LIVES: 3,
  LEVEL: 1,
  SCORE: 0
};

/** Configuration des timers de mode */
export const MODE_TIMERS = {
  BASE_SCATTER: 7000,
  SCATTER_REDUCTION_PER_LEVEL: 500,
  MIN_SCATTER: 3000,
  CHASE_DURATION: 20000,
  BASE_FRIGHTENED: 7000,
  FRIGHTENED_REDUCTION_PER_LEVEL: 800,
  MIN_FRIGHTENED: 2000
};

/** Seuils de sortie des fantômes */
export const GHOST_EXIT_THRESHOLDS = {
  INKY_DOTS_EATEN: 30,
  CLYDE_DOTS_FRACTION: 1 / 3
};

/** Cooldowns */
export const COOLDOWNS = {
  GHOST_TURN: 150,
  PACMAN_THRESHOLD: 6
};

/** Chemin des assets */
export const ASSETS_PATH = '/src/games/pacman/assets';

/**
 * Calcule les paramètres de difficulté selon le niveau
 * @param {number} level - Niveau actuel
 * @returns {Object} Paramètres de difficulté
 */
export function getDifficultyParams(level) {
  const speedMultiplier = 1 + (level - 1) * 0.08;

  const scatterTime = Math.max(
    MODE_TIMERS.MIN_SCATTER,
    MODE_TIMERS.BASE_SCATTER - (level - 1) * MODE_TIMERS.SCATTER_REDUCTION_PER_LEVEL
  );

  const frightenedTime = Math.max(
    MODE_TIMERS.MIN_FRIGHTENED,
    MODE_TIMERS.BASE_FRIGHTENED - (level - 1) * MODE_TIMERS.FRIGHTENED_REDUCTION_PER_LEVEL
  );

  return {
    speedMultiplier,
    scatterTime,
    frightenedTime,
    timeModes: [
      { mode: 'scatter', time: scatterTime },
      { mode: 'chase', time: MODE_TIMERS.CHASE_DURATION },
      { mode: 'scatter', time: scatterTime },
      { mode: 'chase', time: MODE_TIMERS.CHASE_DURATION },
      { mode: 'scatter', time: Math.max(2000, 5000 - (level - 1) * 500) },
      { mode: 'chase', time: MODE_TIMERS.CHASE_DURATION },
      { mode: 'scatter', time: Math.max(2000, 5000 - (level - 1) * 500) },
      { mode: 'chase', time: -1 } // -1 = infini
    ]
  };
}

/**
 * Configuration Phaser du jeu
 * @param {HTMLElement} container - Container DOM
 * @returns {Object} Config Phaser
 */
export function createPhaserConfig(container) {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: container || 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };
}
