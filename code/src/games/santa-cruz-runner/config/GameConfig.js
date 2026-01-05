/**
 * GameConfig - Configuration et constantes du jeu Santa Cruz Runner
 *
 * Endless runner de Noël avec Santa qui court sur des plateformes
 * Système de difficulté progressive et collectibles
 */

import Phaser from 'phaser';

/** Dimensions du jeu */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Configuration du joueur (Santa) */
export const PLAYER_CONFIG = {
  startX: 150,
  startY: 400,
  width: 37,
  height: 52,
  gravity: 1800,
  jumpVelocity: -650,
  doubleJumpVelocity: -550,
  maxJumps: 2,
  animationSpeed: 12
};

/** Configuration des plateformes */
export const PLATFORM_CONFIG = {
  height: 24,
  baseY: GAME_HEIGHT - 50,
  minWidth: 80,
  maxWidth: 200,
  baseGap: 120,
  maxGap: 280,
  minGap: 60,
  scrollSpeed: 350,
  maxScrollSpeed: 650,
  speedIncreaseRate: 0.015,
  heightVariation: 80,
  poolSize: 8
};

/** Types de plateformes */
export const PLATFORM_TYPES = {
  NORMAL: {
    id: 'normal',
    color: 0xffffff,
    slippery: false
  },
  ICE: {
    id: 'ice',
    color: 0x87ceeb,
    slippery: true
  },
  CRUMBLING: {
    id: 'crumbling',
    color: 0xd4a574,
    crumbles: true,
    crumbleTime: 500
  }
};

/** Configuration des collectibles */
export const COLLECTIBLE_CONFIG = {
  types: {
    GIFT_SMALL: {
      id: 'gift_small',
      points: 50,
      color: 0xff0000,
      size: 20
    },
    GIFT_MEDIUM: {
      id: 'gift_medium',
      points: 100,
      color: 0x00ff00,
      size: 25
    },
    GIFT_LARGE: {
      id: 'gift_large',
      points: 250,
      color: 0xffd700,
      size: 30
    },
    CANDY_CANE: {
      id: 'candy_cane',
      points: 75,
      color: 0xff6b6b,
      size: 22
    }
  },
  spawnChance: 0.4,
  heightAbovePlatform: 60
};

/** Configuration des obstacles */
export const OBSTACLE_CONFIG = {
  types: {
    SNOWMAN: {
      id: 'snowman',
      width: 40,
      height: 50,
      damage: true
    }
  },
  spawnChance: 0.15,
  minLevelToSpawn: 2
};

/** Configuration des particules de neige */
export const SNOW_CONFIG = {
  count: 25,
  minScale: 0.05,
  maxScale: 0.15,
  minSpeed: 25,
  maxSpeed: 60,
  minAlpha: 0.15,
  maxAlpha: 0.4
};

/** Scores */
export const SCORES = {
  DISTANCE_MULTIPLIER: 0.5,
  COMBO_MULTIPLIER: 1.5,
  MAX_COMBO: 10,
  LEVEL_BONUS: 500
};

/** Valeurs initiales */
export const INITIAL_VALUES = {
  LIVES: 3,
  LEVEL: 1,
  SCORE: 0
};

/** Chemin des assets */
export const ASSETS_PATH = '/src/games/santa-cruz-runner/assets';

/** Couleurs du thème */
export const COLORS = {
  BACKGROUND: '#1a3a52',
  SKY_TOP: '#0d1b2a',
  SKY_BOTTOM: '#1b263b',
  TEXT: '#ffffff',
  TEXT_SHADOW: '#000000',
  HUD_BG: 'rgba(0, 0, 0, 0.5)',
  ACCENT: '#ff6b6b',
  GOLD: '#ffd700'
};

/**
 * Calcule les paramètres de difficulté selon le niveau
 * @param {number} level - Niveau actuel
 * @returns {Object} Paramètres de difficulté
 */
export function getDifficultyParams(level) {
  const speedMultiplier = 1 + (level - 1) * 0.12;
  const scrollSpeed = Math.min(
    PLATFORM_CONFIG.scrollSpeed * speedMultiplier,
    PLATFORM_CONFIG.maxScrollSpeed
  );

  // Gap entre les plateformes augmente avec le niveau
  const gapMultiplier = 1 + (level - 1) * 0.08;
  const baseGap = Math.min(
    PLATFORM_CONFIG.baseGap * gapMultiplier,
    PLATFORM_CONFIG.maxGap
  );

  // Largeur des plateformes diminue avec le niveau
  const widthReduction = Math.min((level - 1) * 10, 60);
  const minWidth = Math.max(PLATFORM_CONFIG.minWidth - widthReduction, 50);
  const maxWidth = Math.max(PLATFORM_CONFIG.maxWidth - widthReduction, 100);

  // Probabilité de plateformes spéciales
  const iceChance = Math.min(0.05 * level, 0.25);
  const crumblingChance = level >= 3 ? Math.min(0.03 * (level - 2), 0.15) : 0;

  // Probabilité d'obstacles
  const obstacleChance = level >= OBSTACLE_CONFIG.minLevelToSpawn
    ? Math.min(OBSTACLE_CONFIG.spawnChance * (level - 1), 0.35)
    : 0;

  return {
    level,
    scrollSpeed,
    speedMultiplier,
    baseGap,
    minWidth,
    maxWidth,
    iceChance,
    crumblingChance,
    obstacleChance,
    collectibleChance: Math.min(COLLECTIBLE_CONFIG.spawnChance + level * 0.02, 0.6)
  };
}

/**
 * Génère une largeur de plateforme aléatoire selon la difficulté
 * @param {Object} diffParams - Paramètres de difficulté
 * @returns {number} Largeur de la plateforme
 */
export function generatePlatformWidth(diffParams) {
  return Phaser.Math.Between(diffParams.minWidth, diffParams.maxWidth);
}

/**
 * Génère un gap aléatoire entre les plateformes
 * @param {Object} diffParams - Paramètres de difficulté
 * @returns {number} Gap entre les plateformes
 */
export function generatePlatformGap(diffParams) {
  const variation = diffParams.baseGap * 0.3;
  return Phaser.Math.Between(
    diffParams.baseGap - variation,
    diffParams.baseGap + variation
  );
}

/**
 * Détermine le type de plateforme
 * @param {Object} diffParams - Paramètres de difficulté
 * @returns {Object} Type de plateforme
 */
export function determinePlatformType(diffParams) {
  const roll = Math.random();

  if (roll < diffParams.crumblingChance) {
    return PLATFORM_TYPES.CRUMBLING;
  } else if (roll < diffParams.crumblingChance + diffParams.iceChance) {
    return PLATFORM_TYPES.ICE;
  }

  return PLATFORM_TYPES.NORMAL;
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
    backgroundColor: COLORS.BACKGROUND,
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
