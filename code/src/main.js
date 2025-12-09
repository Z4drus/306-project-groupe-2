/**
 * Point d'entrée principal de l'application ArcadiaBox
 *
 * Initialise Alpine.js pour la gestion du menu
 * et charge les styles globaux
 */

import Alpine from 'alpinejs';
import './style.css';

/**
 * Store Alpine.js pour la gestion de l'état de l'application
 */
Alpine.store('arcade', {
  currentView: 'menu', // 'menu' | 'game' | 'scores' | 'help'
  currentGame: null, // null | 'pacman' | 'wallbreaker' | 'santa-cruz-runner'
  isFullscreen: false,
  attractMode: false,
  attractTimeout: null,

  /**
   * Initialise le mode attract après 60 secondes d'inactivité
   */
  init() {
    this.resetAttractTimer();
    // Détecte toute interaction utilisateur pour réinitialiser le timer
    ['click', 'keydown', 'gamepadconnected'].forEach(event => {
      document.addEventListener(event, () => this.resetAttractTimer());
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
    }, 60000); // 60 secondes
  },

  /**
   * Lance un jeu
   * @param {string} gameName - Nom du jeu à lancer
   */
  async startGame(gameName) {
    this.currentGame = gameName;
    this.currentView = 'game';
    this.resetAttractTimer();
    console.log(`Lancement du jeu: ${gameName}`);

    // Charge dynamiquement le jeu
    try {
      let gameModule;
      const gameContainer = document.getElementById('game-container');

      // Callback appelé à la fin du jeu
      const onGameOver = async (score) => {
        console.log(`Game Over! Score: ${score}`);

        // Sauvegarder le score via l'API
        if (score > 0) {
          try {
            const response = await fetch('/api/scores', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                gameId: gameName,
                score: score,
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
        }

        // Retour au menu
        this.backToMenu();
      };

      switch (gameName) {
        case 'pacman':
          gameModule = await import('./games/pacman/index.js');
          gameModule.startPacman(gameContainer, onGameOver);
          break;
        case 'wallbreaker':
          gameModule = await import('./games/wallbreaker/index.js');
          gameModule.startWallbreaker(gameContainer, onGameOver);
          break;
        case 'santa-cruz-runner':
          gameModule = await import('./games/santa-cruz-runner/index.js');
          gameModule.startSantaCruzRunner(gameContainer, onGameOver);
          break;
        default:
          console.error(`Jeu inconnu: ${gameName}`);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du jeu ${gameName}:`, error);
    }
  },

  /**
   * Retourne au menu principal
   */
  backToMenu() {
    this.currentGame = null;
    this.currentView = 'menu';
    this.resetAttractTimer();
    // Nettoie le conteneur du jeu
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
  },
});

/**
 * Composant Alpine.js pour le menu principal
 */
Alpine.data('arcadeMenu', () => ({
  games: [
    {
      id: 'pacman',
      name: 'Pacman',
      description: 'Collectez toutes les pastilles en évitant les fantômes',
      players: '1 joueur',
      thumbnail: '/assets/images/home-menu/pacman.webp',
    },
    {
      id: 'wallbreaker',
      name: 'Wallbreaker',
      description: 'Détruisez tous les murs avec votre balle',
      players: '1 joueur',
      thumbnail: '/assets/images/home-menu/wallbreaker.webp',
    },
    {
      id: 'santa-cruz-runner',
      name: 'Santa Cruz Runner',
      description: 'Courez et évitez les obstacles',
      players: '1 joueur',
      thumbnail: '/assets/images/home-menu/santacruz.webp',
    },
  ],

  /**
   * Lance le jeu sélectionné
   * @param {string} gameId - ID du jeu
   */
  playGame(gameId) {
    Alpine.store('arcade').startGame(gameId);
  },
}));

// Initialise Alpine.js
window.Alpine = Alpine;
Alpine.start();

// Initialise le store
Alpine.store('arcade').init();

// Rend le contenu du menu principal
renderMainMenu();

/**
 * Génère et affiche le menu principal
 */
function renderMainMenu() {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = `
    <!-- En-tête -->
    <header class="arcade-header">
      <div class="header-content">
        <img src="/assets/images/home-menu/controller_icon.webp" alt="Controller" class="header-icon" />
        <div class="header-text">
          <h1 class="arcade-title">Arcadia Box</h1>
          <p class="arcade-subtitle">Borne d'Arcade Moderne</p>
        </div>
      </div>
    </header>

    <!-- Menu principal -->
    <div x-data="arcadeMenu" x-show="$store.arcade.currentView === 'menu'" class="arcade-container">
      <!-- Mode attract -->
      <div x-show="$store.arcade.attractMode" class="attract-mode">
        <p class="attract-text">Appuyez sur un bouton ou cliquez pour commencer</p>
      </div>

      <!-- Liste des jeux -->
      <div x-show="!$store.arcade.attractMode" class="games-grid">
        <template x-for="game in games" :key="game.id">
          <div class="game-card" @click="playGame(game.id)">
            <div class="game-thumbnail">
              <img :src="game.thumbnail" :alt="game.name" loading="lazy" />
            </div>
            <div class="game-info">
              <h2 class="game-name" x-text="game.name"></h2>
              <p class="game-description" x-text="game.description"></p>
              <p class="game-players" x-text="game.players"></p>
            </div>
            <button class="game-play-btn">Jouer</button>
          </div>
        </template>
      </div>

      <!-- Boutons d'action -->
      <div x-show="!$store.arcade.attractMode" class="action-buttons">
        <button @click="$store.arcade.showScores()" class="action-btn">
          Scores
        </button>
        <button @click="$store.arcade.showHelp()" class="action-btn">
          Aide
        </button>
        <button @click="$store.arcade.toggleFullscreen()" class="action-btn">
          Plein ecran
        </button>
      </div>
    </div>

    <!-- Vue Jeu -->
    <div x-show="$store.arcade.currentView === 'game'" class="game-view">
      <div class="game-header">
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          ← Retour au menu
        </button>
      </div>
      <div id="game-container"></div>
    </div>

    <!-- Vue Scores -->
    <div x-show="$store.arcade.currentView === 'scores'" class="scores-view">
      <div class="scores-header">
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          ← Retour au menu
        </button>
        <h2>Tableau des Scores</h2>
      </div>
      <div class="scores-content">
        <p>Les scores seront affichés ici</p>
      </div>
    </div>

    <!-- Vue Aide -->
    <div x-show="$store.arcade.currentView === 'help'" class="help-view">
      <div class="help-header">
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          ← Retour au menu
        </button>
        <h2>Aide</h2>
      </div>
      <div class="help-content">
        <h3>Comment jouer ?</h3>
        <ul>
          <li><strong>Clavier :</strong> Utilisez les flèches directionnelles et la barre d'espace</li>
          <li><strong>Manette Xbox :</strong> Connectez votre manette et utilisez le stick analogique et les boutons</li>
        </ul>
        <h3>Connexion d'une manette</h3>
        <ol>
          <li>Branchez votre manette Xbox via USB</li>
          <li>Attendez quelques secondes que la manette soit reconnue</li>
          <li>Lancez un jeu et utilisez les contrôles</li>
        </ol>
      </div>
    </div>
  `;
}
