/**
 * ArcadeStore - Store Alpine.js pour l'état de l'application
 *
 * Gère l'état global de l'application arcade
 */

import { loadGame, getGameDisplayName } from './GameLoader.js';
import gamepadManager from './GamepadManager.js';
import cursorManager from './CursorManager.js';
import {
  getStoredUser,
  getStoredToken,
  verifyToken,
  login,
  register,
  logout,
  submitScore,
  getLeaderboard,
  getGameScores,
  getUserBestScore,
  getUserScores,
  updateProfilePicture,
  getUserProfile,
  changePassword,
} from './AuthManager.js';
import { getAttractMode } from './AttractMode.js';

/**
 * Durée d'inactivité avant le mode attract (ms)
 */
const ATTRACT_MODE_DELAY = 20000;

/**
 * Crée le store Alpine.js
 * @returns {Object} Configuration du store
 */
export function createArcadeStore() {
  return {
    // État de la vue
    currentView: 'menu', // 'menu' | 'game' | 'scores' | 'help' | 'auth' | 'account'
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

    // État de transition (verrouillage contre les doubles actions)
    isTransitioning: false,
    currentGameInstance: null,
    // Identifiant unique de la transition en cours (pour annulation)
    currentTransitionId: 0,
    // Flag pour annuler le chargement en cours
    cancelLoading: false,

    // État des manettes
    connectedGamepads: [],
    gamepadPollInterval: null,

    // État d'authentification
    isAuthenticated: false,
    user: null,
    authError: null,
    authLoading: false,
    authMode: 'login', // 'login' | 'register'

    // État de l'inscription (étape de sélection de pfp)
    registerStep: 'form', // 'form' | 'pfp'
    selectedProfilePicture: 1,
    tempUsername: '',
    tempPassword: '',

    // État du leaderboard
    leaderboard: [],
    gameScores: {},
    scoresLoading: false,

    // Scores du joueur connecté
    userScores: {},

    // Meilleur score du joueur pour le jeu en cours
    currentBestScore: 0,

    // Erreur de connexion au serveur (réseau restreint)
    connectionError: false,
    connectionErrorMessage: '',

    // Modal de profil utilisateur (dans les scores)
    showUserProfileModal: false,
    viewedUserProfile: null,
    profileLoading: false,

    // Sélecteur de photo de profil (dans Mon Compte)
    showPfpSelector: false,
    pfpSelectorLoading: false,

    // Changement de mot de passe
    showPasswordReset: false,
    passwordLoading: false,
    passwordError: null,
    passwordSuccess: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',

    /**
     * Initialise le store
     */
    async init() {
      this.resetAttractTimer();
      this.setupActivityListeners();
      this.initGamepadManager();

      // Vérifier si l'utilisateur est déjà connecté
      await this.checkAuth();
    },

    /**
     * Vérifie l'authentification au démarrage
     */
    async checkAuth() {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (storedUser && storedToken) {
        const result = await verifyToken();
        if (result.success) {
          this.isAuthenticated = true;
          this.user = result.user;
        }
      }
    },

    /**
     * Connexion utilisateur
     * @param {string} username
     * @param {string} password
     */
    async handleLogin(username, password) {
      this.authLoading = true;
      this.authError = null;

      const result = await login(username, password);

      this.authLoading = false;

      if (result.success) {
        this.isAuthenticated = true;
        this.user = result.user;
        this.backToMenu();
      } else {
        // Détecter une erreur de connexion au serveur
        if (result.error === 'Erreur de connexion au serveur' || result.error === 'Erreur serveur - réponse invalide') {
          this.showConnectionError();
        }
        this.authError = result.error;
      }
    },

    /**
     * Première étape d'inscription: validation du formulaire et passage à la sélection de pfp
     * @param {string} username
     * @param {string} password
     */
    async handleRegisterStep1(username, password) {
      // Validation côté client
      if (!username || username.length < 3) {
        this.authError = 'Le pseudo doit contenir au moins 3 caractères';
        return;
      }
      if (!password || password.length < 8) {
        this.authError = 'Le mot de passe doit contenir au moins 8 caractères';
        return;
      }

      // Stocker temporairement les identifiants
      this.tempUsername = username;
      this.tempPassword = password;
      this.authError = null;

      // Passer à l'étape de sélection de photo de profil
      this.registerStep = 'pfp';
      this.selectedProfilePicture = Math.floor(Math.random() * 75) + 1;
    },

    /**
     * Deuxième étape d'inscription: création du compte avec la photo de profil
     */
    async handleRegisterStep2() {
      this.authLoading = true;
      this.authError = null;

      const result = await register(this.tempUsername, this.tempPassword, this.selectedProfilePicture);

      this.authLoading = false;

      if (result.success) {
        this.isAuthenticated = true;
        this.user = result.user;
        // Nettoyer les données temporaires
        this.tempUsername = '';
        this.tempPassword = '';
        this.registerStep = 'form';
        this.backToMenu();
      } else {
        // Détecter une erreur de connexion au serveur
        if (result.error === 'Erreur de connexion au serveur' || result.error === 'Erreur serveur - réponse invalide') {
          this.showConnectionError();
        }
        this.authError = result.error;
        // Revenir au formulaire en cas d'erreur
        this.registerStep = 'form';
      }
    },

    /**
     * Retour à l'étape formulaire depuis la sélection de pfp
     */
    backToRegisterForm() {
      this.registerStep = 'form';
      this.authError = null;
    },

    /**
     * Inscription utilisateur (ancienne méthode pour compatibilité)
     * @param {string} username
     * @param {string} password
     */
    async handleRegister(username, password) {
      // Utiliser le nouveau processus en deux étapes
      await this.handleRegisterStep1(username, password);
    },

    /**
     * Déconnexion
     */
    handleLogout() {
      logout();
      this.isAuthenticated = false;
      this.user = null;
      // Rediriger vers le menu si on était sur une page protégée
      if (this.currentView === 'account') {
        this.backToMenu();
      }
    },

    /**
     * Affiche la page d'authentification
     */
    showAuth() {
      this.currentView = 'auth';
      this.authError = null;
      this.registerStep = 'form';
      this.tempUsername = '';
      this.tempPassword = '';
      this.resetAttractTimer();
    },

    /**
     * Change le mode d'authentification
     * @param {string} mode
     */
    setAuthMode(mode) {
      this.authMode = mode;
      this.authError = null;
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
      const resetTimer = (e) => {
        // En mode attract, seul le bouton START peut sortir (géré par AttractMode)
        if (this.attractMode && e.type === 'click') {
          return;
        }
        this.resetAttractTimer();
      };
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
      // Bloquer si une transition est déjà en cours
      if (this.isTransitioning) {
        console.log('Transition déjà en cours, action ignorée');
        return;
      }

      this.isTransitioning = true;
      this.cancelLoading = false;
      // Créer un identifiant unique pour cette transition
      const transitionId = ++this.currentTransitionId;

      // Importer et afficher l'overlay AVANT de changer de vue
      const { getLoadingOverlay } = await import('./LoadingOverlay.js');
      const loadingOverlay = getLoadingOverlay();
      loadingOverlay.show(getGameDisplayName(gameName));

      // Vérifier si la transition a été annulée
      if (this.cancelLoading || transitionId !== this.currentTransitionId) {
        console.log('Chargement annulé (transition obsolète)');
        loadingOverlay.destroy();
        this.isTransitioning = false;
        return;
      }

      // Maintenant changer la vue (le container sera masqué par l'overlay)
      this.currentGame = gameName;
      this.currentView = 'game';
      this.gameScore = 0;
      this.gameLives = 3;
      this.gameLevel = 1;
      this.currentGameName = getGameDisplayName(gameName);
      this.currentBestScore = 0;
      this.resetAttractTimer();

      // Masquer le curseur custom pendant le jeu Phaser
      cursorManager.hide();

      // Marquer le container comme en chargement pour le masquer
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.classList.add('loading');
      }

      console.log(`Lancement du jeu: ${gameName}`);

      // Récupérer le meilleur score de l'utilisateur si connecté
      if (this.isAuthenticated) {
        const result = await getUserBestScore(gameName);
        if (result.success) {
          this.currentBestScore = result.bestScore;
        }
      }

      // Vérifier si la transition a été annulée pendant le fetch du score
      if (this.cancelLoading || transitionId !== this.currentTransitionId) {
        console.log('Chargement annulé après récupération du score');
        loadingOverlay.destroy();
        if (gameContainer) {
          gameContainer.classList.remove('loading');
        }
        this.isTransitioning = false;
        this.currentView = 'menu';
        cursorManager.show();
        return;
      }

      try {
        const gameInstance = await loadGame(
          gameName,
          gameContainer,
          (score) => this.handleGameOver(gameName, score),
          (score, lives, level) => this.handleScoreUpdate(score, lives, level),
          this.currentBestScore,
          this.isAuthenticated ? this.user?.username : null
        );

        // Vérifier si la transition a été annulée pendant le chargement du jeu
        if (this.cancelLoading || transitionId !== this.currentTransitionId) {
          console.log('Chargement annulé, destruction du jeu chargé');
          // Détruire le jeu qui vient d'être chargé
          if (gameInstance) {
            try {
              if (gameInstance.sound) gameInstance.sound.stopAll();
              gameInstance.destroy(true, false);
            } catch (e) {
              console.warn('Erreur lors de la destruction du jeu annulé:', e);
            }
          }
          loadingOverlay.destroy();
          if (gameContainer) {
            gameContainer.innerHTML = '';
            gameContainer.classList.remove('loading');
          }
          this.isTransitioning = false;
          this.currentView = 'menu';
          cursorManager.show();
          return;
        }

        // Stocker l'instance du jeu pour pouvoir la détruire proprement
        this.currentGameInstance = gameInstance;

        // Retirer la classe loading une fois le jeu pret
        if (gameContainer) {
          gameContainer.classList.remove('loading');
        }

        // Transition terminée
        this.isTransitioning = false;
      } catch (error) {
        console.error(`Erreur lors du chargement du jeu ${gameName}:`, error);
        loadingOverlay.destroy();
        if (gameContainer) {
          gameContainer.innerHTML = '';
          gameContainer.classList.remove('loading');
        }
        this.isTransitioning = false;
        this.backToMenu(false);
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

      // Note: Ne pas appeler backToMenu() ici.
      // Le jeu gère lui-même l'affichage de l'écran Game Over
      // et le retour au menu via sa propre scène GameOverScene.
    },

    /**
     * Sauvegarde un score (requiert authentification)
     * @param {string} gameId - Identifiant du jeu
     * @param {number} score - Score à sauvegarder
     */
    async saveScore(gameId, score) {
      if (this.isAuthenticated) {
        const result = await submitScore(gameId, score);

        if (result.success) {
          console.log('Score sauvegardé avec succès');
        } else {
          console.error('Erreur lors de la sauvegarde du score:', result.error);
        }
      } else {
        console.log('Score non sauvegardé (utilisateur non connecté)');
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
     * Retourne au menu principal en rafraîchissant la page
     * Le refresh complet évite les bugs d'état résiduel lors des futurs chargements de jeux
     */
    backToMenu() {
      window.location.reload();
    },

    /**
     * Affiche les scores et charge le leaderboard
     */
    async showScores() {
      this.currentView = 'scores';
      this.resetAttractTimer();
      await this.loadLeaderboard();
    },

    /**
     * Charge le leaderboard global
     */
    async loadLeaderboard() {
      this.scoresLoading = true;
      this.leaderboard = [];
      this.gameScores = {};
      this.userScores = {};
      this.connectionError = false;

      const result = await getLeaderboard(20);

      // Détecter une erreur de connexion au serveur
      if (!result.success && result.error) {
        this.showConnectionError();
      }

      if (result.success && result.data) {
        this.leaderboard = result.data;
      }

      // Charger aussi les scores par jeu
      for (const gameId of ['pacman', 'wallbreaker', 'santa-cruz-runner']) {
        const gameResult = await getGameScores(gameId, 10);
        if (gameResult.success && gameResult.data) {
          this.gameScores[gameId] = gameResult.data;
        } else {
          this.gameScores[gameId] = [];
        }
      }

      // Charger les scores du joueur connecté
      if (this.isAuthenticated) {
        const userResult = await getUserScores();
        if (userResult.success && userResult.data) {
          this.userScores = userResult.data;
        }
      }

      this.scoresLoading = false;
    },

    /**
     * Affiche l'erreur de connexion au serveur (auto-dismiss apres 6s)
     */
    showConnectionError() {
      this.connectionError = true;
      this.connectionErrorMessage = 'Connexion au serveur impossible depuis le réseau de l\'État de Fribourg. Pour sauvegarder vos scores et accéder aux classements, connectez-vous à un réseau non restreint (ex: EMF Net ou réseau privé). Vous pouvez continuer à jouer, mais vos scores ne seront pas enregistrés.';

      // Auto-dismiss apres 6 secondes
      setTimeout(() => {
        this.dismissConnectionError();
      }, 6000);
    },

    /**
     * Ferme la popup d'erreur de connexion
     */
    dismissConnectionError() {
      this.connectionError = false;
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

    /**
     * Affiche l'ecran d'attente immersif
     */
    showAttractScreen() {
      const container = document.getElementById('attract-mode-container');
      if (container) {
        const attractMode = getAttractMode();
        attractMode.show(container);
      }
    },

    /**
     * Cache l'ecran d'attente immersif
     */
    hideAttractScreen() {
      const attractMode = getAttractMode();
      attractMode.hide();
    },

    /**
     * Affiche la page Mon Compte
     */
    showAccount() {
      if (!this.isAuthenticated) {
        this.backToMenu();
        return;
      }
      this.currentView = 'account';
      this.showPfpSelector = false;
      this.resetAttractTimer();
    },

    /**
     * Ouvre le sélecteur de photo de profil dans Mon Compte
     */
    openPfpSelector() {
      this.showPfpSelector = true;
      this.selectedProfilePicture = this.user?.profilePicture || 1;
    },

    /**
     * Ferme le sélecteur de photo de profil
     */
    closePfpSelector() {
      this.showPfpSelector = false;
    },

    /**
     * Sauvegarde la nouvelle photo de profil
     */
    async saveProfilePicture() {
      if (!this.isAuthenticated) return;

      this.pfpSelectorLoading = true;

      const result = await updateProfilePicture(this.selectedProfilePicture);

      this.pfpSelectorLoading = false;

      if (result.success) {
        this.user = { ...this.user, profilePicture: result.user.profilePicture };
        this.showPfpSelector = false;
      } else {
        console.error('Erreur lors de la modification de la photo de profil:', result.error);
      }
    },

    /**
     * Ouvre le modal de changement de mot de passe
     */
    openPasswordReset() {
      this.showPasswordReset = true;
      this.passwordError = null;
      this.passwordSuccess = null;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    },

    /**
     * Ferme le modal de changement de mot de passe
     */
    closePasswordReset() {
      this.showPasswordReset = false;
      this.passwordError = null;
      this.passwordSuccess = null;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    },

    /**
     * Gère le changement de mot de passe
     */
    async handlePasswordReset() {
      if (!this.isAuthenticated) return;

      // Validation
      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'Les mots de passe ne correspondent pas';
        return;
      }

      if (this.newPassword.length < 8) {
        this.passwordError = 'Le nouveau mot de passe doit faire au moins 8 caractères';
        return;
      }

      this.passwordLoading = true;
      this.passwordError = null;
      this.passwordSuccess = null;

      const result = await changePassword(this.currentPassword, this.newPassword);

      this.passwordLoading = false;

      if (result.success) {
        this.passwordSuccess = 'Mot de passe modifié avec succès';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        // Fermer après 2 secondes
        setTimeout(() => {
          this.closePasswordReset();
        }, 2000);
      } else {
        this.passwordError = result.error || 'Erreur lors du changement de mot de passe';
      }
    },

    /**
     * Ouvre le modal de profil d'un utilisateur
     * @param {number} userId - ID du joueur
     */
    async openUserProfile(userId) {
      this.profileLoading = true;
      this.showUserProfileModal = true;
      this.viewedUserProfile = null;

      const result = await getUserProfile(userId);

      this.profileLoading = false;

      if (result.success) {
        this.viewedUserProfile = result.profile;
      } else {
        this.showUserProfileModal = false;
        console.error('Erreur lors de la récupération du profil:', result.error);
      }
    },

    /**
     * Ferme le modal de profil utilisateur
     */
    closeUserProfile() {
      this.showUserProfileModal = false;
      this.viewedUserProfile = null;
    },

    /**
     * Retourne le chemin de la photo de profil
     * @param {number} pfpId - ID de la photo de profil (1-75)
     * @returns {string} Chemin de l'image
     */
    getProfilePicturePath(pfpId) {
      const id = pfpId || 1;
      return `/assets/pfp/pfp_${id}.webp`;
    },

    /**
     * Formate une date en format lisible
     * @param {string} dateStr - Date ISO
     * @returns {string} Date formatée
     */
    formatDate(dateStr) {
      if (!dateStr) return 'Inconnu';
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };
}
