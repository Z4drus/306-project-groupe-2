/**
 * GameConfig - Configuration et constantes du jeu Wallbreaker
 *
 * Centralise toutes les valeurs de configuration pour faciliter
 * les ajustements et la maintenance. Inclut un système de niveaux
 * infinis avec difficulté progressive et patterns variés.
 */

import Phaser from 'phaser';

/** Dimensions du jeu */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Zone de jeu (centrée, avec marges pour UI) */
export const PLAY_AREA = {
  x: 120,
  y: 50,
  width: 560,
  height: 500
};

/** Configuration du paddle */
export const PADDLE_CONFIG = {
  width: 100,
  height: 20,
  startY: PLAY_AREA.y + PLAY_AREA.height - 30,
  speed: 500,
  minX: PLAY_AREA.x + 50,
  maxX: PLAY_AREA.x + PLAY_AREA.width - 50
};

/** Configuration de la balle */
export const BALL_CONFIG = {
  radius: 10,
  baseSpeed: 380,
  maxSpeed: 650,
  speedIncreasePerLevel: 20,
  minAngle: 30,
  maxBounceAngle: 60
};

/** Configuration des briques */
export const BRICK_CONFIG = {
  width: 50,
  height: 20,
  padding: 5,
  offsetX: PLAY_AREA.x + 30,
  offsetY: PLAY_AREA.y + 40,
  cols: 9,
  baseRows: 5,
  maxRows: 10
};

/** Types de briques avec durabilité et couleurs */
export const BRICK_TYPES = {
  NORMAL: {
    id: 'normal',
    hits: 1,
    score: 10,
    color: 0x4ade80
  },
  STRONG: {
    id: 'strong',
    hits: 2,
    score: 25,
    color: 0xfbbf24
  },
  REINFORCED: {
    id: 'reinforced',
    hits: 3,
    score: 50,
    color: 0xf97316
  },
  SUPER: {
    id: 'super',
    hits: 4,
    score: 100,
    color: 0xef4444
  },
  INDESTRUCTIBLE: {
    id: 'indestructible',
    hits: -1,
    score: 0,
    color: 0x6b7280
  }
};

/** Scores */
export const SCORES = {
  BRICK_BASE: 10,
  LEVEL_COMPLETE: 500,
  LIFE_BONUS: 1000,
  PERFECT_LEVEL: 2000
};

/** Valeurs initiales */
export const INITIAL_VALUES = {
  LIVES: 3,
  LEVEL: 1,
  SCORE: 0
};

/** Chemin des assets */
export const ASSETS_PATH = '/src/games/wallbreaker/assets';

/**
 * Patterns de niveaux prédéfinis
 * 0 = vide, 1 = normal, 2 = strong, 3 = reinforced, 4 = super, 5 = indestructible
 */
const LEVEL_PATTERNS = [
  // Pattern 1: Pyramide inversée
  {
    name: 'pyramid',
    pattern: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0]
    ]
  },
  // Pattern 2: Mur plein
  {
    name: 'wall',
    pattern: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  // Pattern 3: Losange
  {
    name: 'diamond',
    pattern: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0]
    ]
  },
  // Pattern 4: Damier
  {
    name: 'checkerboard',
    pattern: [
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1]
    ]
  },
  // Pattern 5: Colonnes
  {
    name: 'columns',
    pattern: [
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1]
    ]
  },
  // Pattern 6: Croix
  {
    name: 'cross',
    pattern: [
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0]
    ]
  },
  // Pattern 7: Lignes alternées
  {
    name: 'stripes',
    pattern: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  // Pattern 8: Cœur
  {
    name: 'heart',
    pattern: [
      [0, 1, 1, 0, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0]
    ]
  },
  // Pattern 9: Escalier
  {
    name: 'stairs',
    pattern: [
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  // Pattern 10: Forteresse
  {
    name: 'fortress',
    pattern: [
      [1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  // Pattern 11: Vague
  {
    name: 'wave',
    pattern: [
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [0, 1, 1, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 0, 1, 1]
    ]
  },
  // Pattern 12: Triangle
  {
    name: 'triangle',
    pattern: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
];

/**
 * Calcule les paramètres de difficulté selon le niveau
 * @param {number} level - Niveau actuel
 * @returns {Object} Paramètres de difficulté
 */
export function getDifficultyParams(level) {
  // Vitesse de la balle augmente avec le niveau
  const ballSpeedMultiplier = 1 + (level - 1) * 0.08;
  const ballSpeed = Math.min(
    BALL_CONFIG.baseSpeed * ballSpeedMultiplier,
    BALL_CONFIG.maxSpeed
  );

  // Vitesse du paddle augmente légèrement
  const paddleSpeed = PADDLE_CONFIG.speed + (level - 1) * 15;

  return {
    level,
    ballSpeed,
    ballSpeedMultiplier,
    paddleSpeed
  };
}

/**
 * Sélectionne un pattern pour le niveau donné
 * @param {number} level - Niveau actuel
 * @returns {Object} Pattern sélectionné
 */
function selectPattern(level) {
  // Cycle à travers les patterns, mais avec variation
  const patternIndex = (level - 1) % LEVEL_PATTERNS.length;
  return LEVEL_PATTERNS[patternIndex];
}

/**
 * Détermine le type de brique selon le niveau et la position
 * @param {number} level - Niveau actuel
 * @param {number} row - Rangée de la brique
 * @param {number} col - Colonne de la brique
 * @param {number} totalRows - Nombre total de rangées
 * @returns {Object} Type de brique
 */
function determineBrickType(level, row, col, totalRows) {
  // Calcul de la "force" de la position (centre et haut = plus fort)
  const centerCol = 4;
  const distanceFromCenter = Math.abs(col - centerCol);
  const rowFactor = 1 - (row / totalRows); // Plus haut = plus fort

  // Score de difficulté de la position (0-1)
  const positionScore = (rowFactor * 0.6) + ((1 - distanceFromCenter / 4) * 0.4);

  // Probabilités ajustées selon le niveau
  const levelFactor = Math.min(level / 5, 1); // Normaliser sur 5 niveaux

  // Seuils dynamiques basés sur le niveau
  const superThreshold = 0.95 - (levelFactor * 0.15);
  const reinforcedThreshold = 0.80 - (levelFactor * 0.20);
  const strongThreshold = 0.50 - (levelFactor * 0.25);

  // Ajouter de l'aléatoire mais pondéré par la position
  const roll = Math.random() * (1 - positionScore * 0.3);

  if (level >= 8 && roll > superThreshold && positionScore > 0.7) {
    return BRICK_TYPES.SUPER;
  } else if (level >= 4 && roll > reinforcedThreshold && positionScore > 0.5) {
    return BRICK_TYPES.REINFORCED;
  } else if (level >= 2 && roll > strongThreshold) {
    return BRICK_TYPES.STRONG;
  }

  return BRICK_TYPES.NORMAL;
}

/**
 * Génère le layout des briques pour un niveau donné
 * @param {number} level - Niveau actuel
 * @returns {Array<Array<Object>>} Grille de briques
 */
export function generateBrickLayout(level) {
  const pattern = selectPattern(level);
  const layout = [];
  const patternData = pattern.pattern;
  const rows = patternData.length;

  // Ajouter des rangées supplémentaires pour les niveaux élevés
  const extraRows = Math.min(Math.floor((level - 1) / 3), 3);

  for (let row = 0; row < rows + extraRows; row++) {
    const rowBricks = [];
    const patternRow = row < rows ? patternData[row] : patternData[rows - 1];

    for (let col = 0; col < BRICK_CONFIG.cols; col++) {
      // Vérifier si la brique existe dans le pattern
      const hasBlock = patternRow[col] !== 0;

      if (hasBlock) {
        // Déterminer le type de brique
        const brickType = determineBrickType(level, row, col, rows + extraRows);

        rowBricks.push({
          type: brickType,
          x: BRICK_CONFIG.offsetX + col * (BRICK_CONFIG.width + BRICK_CONFIG.padding),
          y: BRICK_CONFIG.offsetY + row * (BRICK_CONFIG.height + BRICK_CONFIG.padding),
          hits: brickType.hits,
          row,
          col
        });
      }
    }

    if (rowBricks.length > 0) {
      layout.push(rowBricks);
    }
  }

  return layout;
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
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 },
        checkCollision: {
          up: true,
          down: false,
          left: true,
          right: true
        }
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };
}

/**
 * Couleurs du thème du jeu
 */
export const COLORS = {
  BACKGROUND: '#1a1a2e',
  PRIMARY: '#ff6b35',
  SECONDARY: '#f7931e',
  ACCENT: '#00ffe4',
  TEXT: '#ffffff',
  TEXT_DARK: '#888888',
  PLAY_AREA_BG: '#0f0f23',
  BORDER: '#4a4a6a'
};
