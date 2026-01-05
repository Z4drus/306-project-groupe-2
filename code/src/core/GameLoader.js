/**
 * GameLoader - Chargeur dynamique de jeux
 *
 * Gère le chargement et l'initialisation des différents jeux
 * avec un système de progression visuelle.
 */

import { getLoadingOverlay } from './LoadingOverlay.js';

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
 * @param {number} bestScore - Meilleur score du joueur
 * @param {string|null} username - Pseudo du joueur connecté
 * @returns {Promise<Object>} Instance du jeu
 */
export async function loadGame(gameId, container, onGameOver, onScoreUpdate, bestScore = 0, username = null) {
  const gameConfig = GAMES_CONFIG[gameId];

  if (!gameConfig) {
    throw new Error(`Jeu inconnu: ${gameId}`);
  }

  const loadingOverlay = getLoadingOverlay();

  try {
    // L'overlay est deja affiche par ArcadeStore, on met juste a jour la progression
    loadingOverlay.update(10, 'Chargement du module...');

    // Charger le module du jeu
    const gameModule = await gameConfig.module();
    loadingOverlay.update(40, 'Module charge, initialisation...');

    const startFunction = gameModule[gameConfig.startFunction];

    if (!startFunction) {
      throw new Error(`Fonction de démarrage non trouvée: ${gameConfig.startFunction}`);
    }

    loadingOverlay.update(60, 'Demarrage du jeu...');

    // Callback pour mettre à jour la progression depuis le jeu
    const onLoadProgress = (progress, status) => {
      // Mapper la progression du jeu (0-100) vers notre progression (60-95)
      const mappedProgress = 60 + (progress * 0.35);
      loadingOverlay.update(mappedProgress, status);
    };

    // Démarrer le jeu avec le callback de progression
    const gameInstance = await startFunction(
      container,
      onGameOver,
      onScoreUpdate,
      bestScore,
      username,
      onLoadProgress
    );

    loadingOverlay.update(100, 'Pret !');

    // Cacher l'overlay après un court délai
    await new Promise(resolve => setTimeout(resolve, 300));
    await loadingOverlay.hide();

    return gameInstance;
  } catch (error) {
    console.error(`Erreur lors du chargement du jeu ${gameId}:`, error);
    loadingOverlay.destroy();
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
