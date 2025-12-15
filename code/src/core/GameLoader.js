/**
 * GameLoader - Chargeur dynamique de jeux
 *
 * Gère le chargement et l'initialisation des différents jeux
 */

/**
 * Configuration des jeux disponibles
 */
export const GAMES_CONFIG = {
  pacman: {
    id: 'pacman',
    name: 'Pacman',
    displayName: 'PAC-MAN',
    description: 'Collectez toutes les pastilles en évitant les fantômes',
    players: '1 joueur',
    thumbnail: '/assets/images/home-menu/pacman.webp',
    module: () => import('../games/pacman/index.js'),
    startFunction: 'startPacman'
  },
  wallbreaker: {
    id: 'wallbreaker',
    name: 'Wallbreaker',
    displayName: 'WALLBREAKER',
    description: 'Détruisez tous les murs avec votre balle',
    players: '1 joueur',
    thumbnail: '/assets/images/home-menu/wallbreaker.webp',
    module: () => import('../games/wallbreaker/index.js'),
    startFunction: 'startWallbreaker'
  },
  'santa-cruz-runner': {
    id: 'santa-cruz-runner',
    name: 'Santa Cruz Runner',
    displayName: 'SANTA CRUZ',
    description: 'Courez et évitez les obstacles',
    players: '1 joueur',
    thumbnail: '/assets/images/home-menu/santacruz.webp',
    module: () => import('../games/santa-cruz-runner/index.js'),
    startFunction: 'startSantaCruzRunner'
  }
};

/**
 * Charge et démarre un jeu
 * @param {string} gameId - Identifiant du jeu
 * @param {HTMLElement} container - Container DOM
 * @param {Function} onGameOver - Callback de fin de partie
 * @param {Function} onScoreUpdate - Callback de mise à jour du score
 * @returns {Promise<Object>} Instance du jeu
 */
export async function loadGame(gameId, container, onGameOver, onScoreUpdate) {
  const gameConfig = GAMES_CONFIG[gameId];

  if (!gameConfig) {
    throw new Error(`Jeu inconnu: ${gameId}`);
  }

  try {
    const gameModule = await gameConfig.module();
    const startFunction = gameModule[gameConfig.startFunction];

    if (!startFunction) {
      throw new Error(`Fonction de démarrage non trouvée: ${gameConfig.startFunction}`);
    }

    return startFunction(container, onGameOver, onScoreUpdate);
  } catch (error) {
    console.error(`Erreur lors du chargement du jeu ${gameId}:`, error);
    throw error;
  }
}

/**
 * Retourne la liste des jeux disponibles
 * @returns {Array} Liste des configurations de jeux
 */
export function getAvailableGames() {
  return Object.values(GAMES_CONFIG).map(game => ({
    id: game.id,
    name: game.name,
    description: game.description,
    players: game.players,
    thumbnail: game.thumbnail
  }));
}

/**
 * Retourne le nom d'affichage d'un jeu
 * @param {string} gameId - Identifiant du jeu
 * @returns {string} Nom d'affichage
 */
export function getGameDisplayName(gameId) {
  return GAMES_CONFIG[gameId]?.displayName || gameId.toUpperCase();
}
