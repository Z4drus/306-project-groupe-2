/**
 * ArcadeStore - Store Alpine.js pour l'état de l'application
 *
 * Gère l'état global de l'application arcade
 */

import { loadGame, getGameDisplayName } from './GameLoader.js';
import gamepadManager from './GamepadManager.js';
import cursorManager from './CursorManager.js';

/**
 * Durée d'inactivité avant le mode attract (ms)
 */
const ATTRACT_MODE_DELAY = 60000;

/**
 * Crée le store Alpine.js
 * @returns {Object} Configuration du store
 */
export function createArcadeStore() {
  return {
    // État de la vue
    currentView: 'menu', // 'menu' | 'game' | 'scores' | 'help'
    currentGame: null,
    currentGameName: '',

    // État du jeu en cours
    gameScore: 0,
    gameLives: 3,
    gameLevel: 1,

    // États de l'interface
    isFullscreen: false,
    attractMode: false,
    attractTimeout: null,

    // État des manettes
    connectedGamepads: [],
    gamepadPollInterval: null,

    /**
     * Initialise le store
     */
    init() {
      this.resetAttractTimer();
      this.setupActivityListeners();
      this.initGamepadManager();
    },

    /**
     * Initialise le gestionnaire de manettes
     */
    initGamepadManager() {
      gamepadManager.init();

      // Callbacks de connexion/déconnexion
      gamepadManager.onConnect((gamepad) => {
        this.updateGamepadStatus();
        this.resetAttractTimer();
      });

      gamepadManager.onDisconnect((gamepad) => {
        this.updateGamepadStatus();
      });

      // Polling régulier pour mettre à jour l'état
      this.gamepadPollInterval = setInterval(() => {
        this.updateGamepadStatus();
      }, 1000);

      // État initial
      this.updateGamepadStatus();
    },

    /**
     * Met à jour le statut des manettes
     */
    updateGamepadStatus() {
      this.connectedGamepads = gamepadManager.getConnectedGamepads();
    },

    /**
     * Retourne le nombre de manettes connectées
     */
    getGamepadCount() {
      return this.connectedGamepads.length;
    },

    /**
     * Configure les listeners d'activité
     */
    setupActivityListeners() {
      const resetTimer = () => this.resetAttractTimer();
      ['click', 'keydown', 'gamepadconnected'].forEach(event => {
        document.addEventListener(event, resetTimer);
      });
    },

    /**
     * Réinitialise le timer du mode attract
     */
    resetAttractTimer() {
      if (this.attractTimeout) {
        clearTimeout(this.attractTimeout);
      }
      this.attractMode = false;
      this.attractTimeout = setTimeout(() => {
        if (this.currentView === 'menu') {
          this.attractMode = true;
        }
      }, ATTRACT_MODE_DELAY);
    },

    /**
     * Lance un jeu
     * @param {string} gameName - Identifiant du jeu
     */
    async startGame(gameName) {
      this.currentGame = gameName;
      this.currentView = 'game';
      this.gameScore = 0;
      this.gameLives = 3;
      this.gameLevel = 1;
      this.currentGameName = getGameDisplayName(gameName);
      this.resetAttractTimer();

      // Masquer le curseur custom pendant le jeu Phaser
      cursorManager.hide();

      console.log(`Lancement du jeu: ${gameName}`);

      try {
        const gameContainer = document.getElementById('game-container');

        await loadGame(
          gameName,
          gameContainer,
          (score) => this.handleGameOver(gameName, score),
          (score, lives, level) => this.handleScoreUpdate(score, lives, level)
        );
      } catch (error) {
        console.error(`Erreur lors du chargement du jeu ${gameName}:`, error);
        this.backToMenu();
      }
    },

    /**
     * Gère la fin d'une partie
     * @param {string} gameName - Identifiant du jeu
     * @param {number} score - Score final
     */
    async handleGameOver(gameName, score) {
      console.log(`Game Over! Score: ${score}`);

      if (score > 0) {
        await this.saveScore(gameName, score);
      }

      this.backToMenu();
    },

    /**
     * Sauvegarde un score
     * @param {string} gameId - Identifiant du jeu
     * @param {number} score - Score à sauvegarder
     */
    async saveScore(gameId, score) {
      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            score,
            playerName: 'Joueur'
          })
        });

        if (response.ok) {
          console.log('Score sauvegardé avec succès');
        } else {
          console.error('Erreur lors de la sauvegarde du score');
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du score:', error);
      }
    },

    /**
     * Met à jour le score/vies/niveau
     * @param {number} score - Score actuel
     * @param {number} lives - Vies restantes
     * @param {number} level - Niveau actuel
     */
    handleScoreUpdate(score, lives, level) {
      this.gameScore = score;
      this.gameLives = lives;
      this.gameLevel = level || 1;
    },

    /**
     * Retourne au menu principal
     */
    backToMenu() {
      this.currentGame = null;
      this.currentView = 'menu';
      this.resetAttractTimer();

      // Réinitialiser l'affichage du score/niveau
      this.gameScore = 0;
      this.gameLives = 3;
      this.gameLevel = 1;

      // Réafficher le curseur custom
      cursorManager.show();

      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.innerHTML = '';
      }
    },

    /**
     * Affiche les scores
     */
    showScores() {
      this.currentView = 'scores';
      this.resetAttractTimer();
    },

    /**
     * Affiche l'aide
     */
    showHelp() {
      this.currentView = 'help';
      this.resetAttractTimer();
    },

    /**
     * Bascule le mode plein écran
     */
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Erreur lors du passage en plein écran:', err);
        });
        this.isFullscreen = true;
      } else {
        document.exitFullscreen();
        this.isFullscreen = false;
      }
    }
  };
}
