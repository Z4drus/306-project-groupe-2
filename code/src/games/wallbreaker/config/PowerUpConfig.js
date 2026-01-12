/**
 * PowerUpConfig - Configuration des bonus/power-ups du jeu Wallbreaker
 *
 * Définit tous les types de power-ups avec leurs effets, durées et probabilités
 */

/**
 * Types de power-ups disponibles
 */
export const POWER_UP_TYPES = {
  // Bonus de balles
  MULTI_BALL: {
    id: 'multi_ball',
    name: 'Multi-Balle',
    description: 'Ajoute 2 balles supplémentaires',
    color: 0x00ff88,
    icon: '⚪',
    duration: 0, // Permanent jusqu'à perte des balles
    probability: 0.15,
    effect: 'spawn_balls',
    effectValue: 2
  },

  // Modificateurs de vitesse
  SPEED_UP: {
    id: 'speed_up',
    name: 'Vitesse+',
    description: 'Augmente la vitesse de la balle',
    color: 0xff4444,
    icon: '⚡',
    duration: 10000,
    probability: 0.08,
    effect: 'ball_speed',
    effectValue: 1.4 // Multiplicateur
  },
  SPEED_DOWN: {
    id: 'speed_down',
    name: 'Vitesse-',
    description: 'Ralentit la balle',
    color: 0x44aaff,
    icon: '🐢',
    duration: 10000,
    probability: 0.12,
    effect: 'ball_speed',
    effectValue: 0.6
  },

  // Modificateurs de paddle
  PADDLE_EXTEND: {
    id: 'paddle_extend',
    name: 'Paddle+',
    description: 'Agrandit le paddle',
    color: 0x00ffaa,
    icon: '↔️',
    duration: 15000,
    probability: 0.12,
    effect: 'paddle_size',
    effectValue: 1.5
  },
  PADDLE_SHRINK: {
    id: 'paddle_shrink',
    name: 'Paddle-',
    description: 'Rétrécit le paddle',
    color: 0xff6600,
    icon: '↕️',
    duration: 10000,
    probability: 0.06,
    effect: 'paddle_size',
    effectValue: 0.6,
    isMalus: true
  },

  // Bonus spéciaux
  EXTRA_LIFE: {
    id: 'extra_life',
    name: 'Vie+',
    description: 'Gagne une vie supplémentaire',
    color: 0xff66ff,
    icon: '❤️',
    duration: 0,
    probability: 0.04,
    effect: 'extra_life',
    effectValue: 1
  },
  DESTROYER: {
    id: 'destroyer',
    name: 'Destructeur',
    description: 'La balle détruit tout en un coup',
    color: 0xffaa00,
    icon: '💥',
    duration: 8000,
    probability: 0.06,
    effect: 'destroyer',
    effectValue: true
  },
  LASER: {
    id: 'laser',
    name: 'Laser',
    description: 'Tire des lasers depuis le paddle',
    color: 0xff0066,
    icon: '🔫',
    duration: 12000,
    probability: 0.08,
    effect: 'laser',
    effectValue: true
  },
  MAGNET: {
    id: 'magnet',
    name: 'Aimant',
    description: 'La balle colle au paddle',
    color: 0x9966ff,
    icon: '🧲',
    duration: 15000,
    probability: 0.08,
    effect: 'magnet',
    effectValue: true
  },
  RANDOM_DESTROY: {
    id: 'random_destroy',
    name: 'Explosion',
    description: 'Détruit 3 briques aléatoires',
    color: 0xffff00,
    icon: '💣',
    duration: 0,
    probability: 0.08,
    effect: 'random_destroy',
    effectValue: 3
  },
  SCORE_MULTIPLIER: {
    id: 'score_multiplier',
    name: 'Score x2',
    description: 'Double les points gagnés',
    color: 0xffd700,
    icon: '⭐',
    duration: 15000,
    probability: 0.10,
    effect: 'score_multiplier',
    effectValue: 2
  }
};

/**
 * Configuration générale des power-ups
 */
export const POWER_UP_CONFIG = {
  // Taille des power-ups
  width: 30,
  height: 16,

  // Vitesse de chute
  fallSpeed: 120,

  // Probabilité qu'une brique drop un power-up (0-1)
  dropChance: 0.15,

  // Animation
  rotationSpeed: 0.02,
  glowIntensity: 0.3,
  pulseSpeed: 1500,

  // Limites
  maxActivePowerUps: 5
};

/**
 * Sélectionne un power-up aléatoire basé sur les probabilités
 * @returns {Object|null} Type de power-up ou null
 */
export function selectRandomPowerUp() {
  const types = Object.values(POWER_UP_TYPES);
  const totalProbability = types.reduce((sum, type) => sum + type.probability, 0);
  let random = Math.random() * totalProbability;

  for (const type of types) {
    random -= type.probability;
    if (random <= 0) {
      return type;
    }
  }

  return types[0];
}

/**
 * Vérifie si un power-up doit être généré
 * @returns {boolean}
 */
export function shouldDropPowerUp() {
  return Math.random() < POWER_UP_CONFIG.dropChance;
}

/**
 * Retourne la liste des power-ups positifs (bonus)
 * @returns {Array}
 */
export function getPositivePowerUps() {
  return Object.values(POWER_UP_TYPES).filter(type => !type.isMalus);
}

/**
 * Retourne la liste des power-ups négatifs (malus)
 * @returns {Array}
 */
export function getNegativePowerUps() {
  return Object.values(POWER_UP_TYPES).filter(type => type.isMalus);
}
