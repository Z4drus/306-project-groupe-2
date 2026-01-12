/**
 * ArcadeMenu - Composant Alpine.js pour le menu
 *
 * Gère l'affichage et les interactions du menu principal
 */

import Alpine from 'alpinejs';
import { getAvailableGames } from './GameLoader.js';
import { virtualKeyboard } from './VirtualKeyboard.js';
import { gamepadManager, GamepadButton } from './GamepadManager.js';

/**
 * Crée le composant menu Alpine.js
 * @returns {Object} Configuration du composant
 */
export function createArcadeMenuComponent() {
  return {
    games: getAvailableGames(),
    selectedGameIndex: 0,
    // Navigation: 'games' ou 'options'
    activeZone: 'games',
    // Index du bouton d'option selectionne (0-3)
    selectedOptionIndex: 0,
    // Liste des actions des options
    optionActions: ['scores', 'help', 'auth', 'fullscreen'],
    // ID du polling gamepad
    gamepadPollId: null,
    // État précédent du bouton B pour détecter le front montant
    prevButtonBState: false,

    /**
     * Initialise le composant et configure les écouteurs clavier et manette
     */
    init() {
      this.handleKeydown = this.handleKeydown.bind(this);
      document.addEventListener('keydown', this.handleKeydown);

      // Démarrer le polling de la manette pour les pages secondaires
      this.startGamepadPolling();
    },

    /**
     * Démarre le polling de la manette pour gérer le bouton B (retour)
     */
    startGamepadPolling() {
      const poll = () => {
        const store = Alpine.store('arcade');

        // Vérifier le bouton B uniquement sur les pages secondaires
        if (store.currentView === 'scores' || store.currentView === 'help') {
          const isButtonBPressed = gamepadManager.isButtonPressed(GamepadButton.B, 0) ||
                                   gamepadManager.isButtonPressed(GamepadButton.B, 1);

          // Détecter le front montant (bouton vient d'être pressé)
          if (isButtonBPressed && !this.prevButtonBState) {
            store.backToMenu();
          }

          this.prevButtonBState = isButtonBPressed;
        } else {
          // Reset l'état quand on n'est pas sur une page secondaire
          this.prevButtonBState = false;
        }

        this.gamepadPollId = requestAnimationFrame(poll);
      };

      this.gamepadPollId = requestAnimationFrame(poll);
    },

    /**
     * Gère les événements clavier pour la navigation
     * @param {KeyboardEvent} event
     */
    handleKeydown(event) {
      const store = Alpine.store('arcade');

      // Gestion du retour avec Escape depuis les pages secondaires
      if (event.key === 'Escape' && (store.currentView === 'scores' || store.currentView === 'help')) {
        event.preventDefault();
        store.backToMenu();
        return;
      }

      // Ne réagir qu'en vue menu et hors mode attract
      if (store.currentView !== 'menu' || store.attractMode) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (this.activeZone === 'games') {
            this.selectPrevGame();
          } else {
            // Retour vers les jeux
            this.activeZone = 'games';
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (this.activeZone === 'games') {
            // Si on est sur le dernier jeu, aller vers les options
            if (this.selectedGameIndex === this.games.length - 1) {
              this.activeZone = 'options';
              this.selectedOptionIndex = 0;
            } else {
              this.selectNextGame();
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (this.activeZone === 'options') {
            this.selectPrevOption();
          } else {
            this.selectPrevGame();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (this.activeZone === 'options') {
            this.selectNextOption();
          } else {
            this.selectNextGame();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (this.activeZone === 'games') {
            this.playSelectedGame();
          } else {
            this.executeSelectedOption();
          }
          break;
        case 'Tab':
          event.preventDefault();
          // Basculer entre les zones
          this.activeZone = this.activeZone === 'games' ? 'options' : 'games';
          break;
      }
    },

    /**
     * Sélectionne le jeu précédent
     */
    selectPrevGame() {
      if (this.selectedGameIndex > 0) {
        this.selectedGameIndex--;
      } else {
        this.selectedGameIndex = this.games.length - 1;
      }
    },

    /**
     * Sélectionne le jeu suivant
     */
    selectNextGame() {
      if (this.selectedGameIndex < this.games.length - 1) {
        this.selectedGameIndex++;
      } else {
        this.selectedGameIndex = 0;
      }
    },

    /**
     * Sélectionne l'option précédente
     */
    selectPrevOption() {
      if (this.selectedOptionIndex > 0) {
        this.selectedOptionIndex--;
      } else {
        this.selectedOptionIndex = this.optionActions.length - 1;
      }
    },

    /**
     * Sélectionne l'option suivante
     */
    selectNextOption() {
      if (this.selectedOptionIndex < this.optionActions.length - 1) {
        this.selectedOptionIndex++;
      } else {
        this.selectedOptionIndex = 0;
      }
    },

    /**
     * Execute l'option sélectionnée
     */
    executeSelectedOption() {
      const store = Alpine.store('arcade');
      const action = this.optionActions[this.selectedOptionIndex];

      switch (action) {
        case 'scores':
          store.showScores();
          break;
        case 'help':
          store.showHelp();
          break;
        case 'auth':
          if (store.isAuthenticated) {
            store.handleLogout();
          } else {
            store.showAuth();
          }
          break;
        case 'fullscreen':
          store.toggleFullscreen();
          break;
      }
    },

    /**
     * Lance le jeu actuellement sélectionné
     */
    playSelectedGame() {
      const selectedGame = this.games[this.selectedGameIndex];
      if (selectedGame) {
        this.playGame(selectedGame.id);
      }
    },

    /**
     * Lance le jeu sélectionné
     * @param {string} gameId - Identifiant du jeu
     */
    playGame(gameId) {
      Alpine.store('arcade').startGame(gameId);
    }
  };
}

/**
 * Crée le composant formulaire d'authentification avec clavier virtuel
 * @returns {Object} Configuration du composant
 */
export function createAuthFormComponent() {
  return {
    username: '',
    password: '',

    /**
     * Ouvre le clavier virtuel pour le champ username
     */
    openUsernameKeyboard() {
      const input = document.getElementById('auth-username');
      if (!input) return;

      const self = this;

      virtualKeyboard.open(input, {
        label: 'Pseudo',
        isPassword: false,
        doneLabel: 'Suivant →',
        onChange: (value) => {
          self.username = value;
        },
        onDone: (value) => {
          // Si le pseudo est vide, ne pas passer à la suite
          if (!value || value.trim().length < 3) {
            return;
          }
          // Transition fluide vers le mot de passe
          self.transitionToPassword();
        },
        onClose: () => {
          input.classList.remove('keyboard-active');
        }
      });
      input.classList.add('keyboard-active');
    },

    /**
     * Transition fluide vers le champ mot de passe
     */
    transitionToPassword() {
      const usernameInput = document.getElementById('auth-username');
      const passwordInput = document.getElementById('auth-password');
      if (!passwordInput) return;

      if (usernameInput) {
        usernameInput.classList.remove('keyboard-active');
      }
      passwordInput.classList.add('keyboard-active');

      const self = this;

      virtualKeyboard.transition(passwordInput, {
        label: 'Mot de passe',
        isPassword: true,
        doneLabel: 'Connexion ✓',
        onChange: (value) => {
          self.password = value;
        },
        onDone: (value) => {
          // Si le mot de passe est trop court, ne pas soumettre
          if (!value || value.length < 8) {
            return;
          }
          // Fermer le clavier et soumettre
          virtualKeyboard.close();
          setTimeout(() => {
            self.submitForm();
          }, 250);
        },
        onClose: () => {
          passwordInput.classList.remove('keyboard-active');
        }
      });
    },

    /**
     * Ouvre le clavier virtuel pour le champ password
     */
    openPasswordKeyboard() {
      const input = document.getElementById('auth-password');
      if (!input) return;

      const self = this;

      virtualKeyboard.open(input, {
        label: 'Mot de passe',
        isPassword: true,
        doneLabel: 'Connexion ✓',
        onChange: (value) => {
          self.password = value;
        },
        onDone: (value) => {
          // Si le mot de passe est trop court, ne pas soumettre
          if (!value || value.length < 8) {
            return;
          }
          // Fermer le clavier et soumettre
          virtualKeyboard.close();
          setTimeout(() => {
            self.submitForm();
          }, 250);
        },
        onClose: () => {
          input.classList.remove('keyboard-active');
        }
      });
      input.classList.add('keyboard-active');
    },

    /**
     * Soumet le formulaire
     */
    submitForm() {
      const store = Alpine.store('arcade');
      if (store.authMode === 'login') {
        store.handleLogin(this.username, this.password);
      } else {
        store.handleRegister(this.username, this.password);
      }
    }
  };
}

/**
 * Génère le template HTML du menu principal
 * @returns {string} HTML du menu
 */
export function getMainMenuTemplate() {
  return `
    <!-- En-tête (caché en mode jeu) -->
    <header class="arcade-header" x-show="$store.arcade.currentView !== 'game'">
      <div class="header-content">
        <img src="/assets/images/home-menu/controller_icon.webp" alt="Controller" class="header-icon" />
        <div class="header-text">
          <h1 class="arcade-title">Arcadia Box</h1>
          <p class="arcade-subtitle">Borne d'Arcade</p>
        </div>
      </div>
      <!-- Partie droite du header -->
      <div class="header-right">
        <!-- Indicateur utilisateur connecté -->
        <div x-show="$store.arcade.isAuthenticated" class="header-user" @click="$store.arcade.showAccount()">
          <img :src="$store.arcade.getProfilePicturePath($store.arcade.user?.profilePicture)" alt="Avatar" class="header-user-avatar" />
          <span class="header-user-name" x-text="$store.arcade.user?.username"></span>
        </div>

        <!-- Séparateur -->
        <div x-show="$store.arcade.isAuthenticated" class="header-separator"></div>

        <!-- Indicateur de manettes -->
        <div class="gamepad-status">
          <div class="gamepad-indicator" :class="{ 'connected': $store.arcade.connectedGamepads.length >= 1 }">
            <svg class="gamepad-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.97 16L5 19c-.47.47-.51 1.23-.12 1.74.42.54 1.19.68 1.76.28l3.5-2.48c.19-.14.4-.23.62-.28H13.24c.22.05.43.14.62.28l3.5 2.48c.57.4 1.34.26 1.76-.28.39-.51.35-1.27-.12-1.74l-2.97-3H7.97z"/>
              <path d="M17 4H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM9.5 9C8.67 9 8 8.33 8 7.5S8.67 6 9.5 6 11 6.67 11 7.5 10.33 9 9.5 9zm5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-4.5c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9z"/>
            </svg>
            <span class="gamepad-label">P1</span>
          </div>
          <div class="gamepad-indicator" :class="{ 'connected': $store.arcade.connectedGamepads.length >= 2 }">
            <svg class="gamepad-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.97 16L5 19c-.47.47-.51 1.23-.12 1.74.42.54 1.19.68 1.76.28l3.5-2.48c.19-.14.4-.23.62-.28H13.24c.22.05.43.14.62.28l3.5 2.48c.57.4 1.34.26 1.76-.28.39-.51.35-1.27-.12-1.74l-2.97-3H7.97z"/>
              <path d="M17 4H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM9.5 9C8.67 9 8 8.33 8 7.5S8.67 6 9.5 6 11 6.67 11 7.5 10.33 9 9.5 9zm5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-4.5c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9z"/>
            </svg>
            <span class="gamepad-label">P2</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Popup d'erreur de connexion au serveur -->
    <div x-show="$store.arcade.connectionError" x-cloak class="connection-error-overlay" @click.self="$store.arcade.dismissConnectionError()">
      <div class="connection-error-popup">
        <div class="connection-error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 class="connection-error-title">Connexion au serveur impossible</h3>
        <p class="connection-error-message" x-text="$store.arcade.connectionErrorMessage"></p>
        <button @click="$store.arcade.dismissConnectionError()" class="connection-error-btn">
          Compris
        </button>
      </div>
    </div>

    <!-- Menu principal -->
    <div x-data="arcadeMenu" x-show="$store.arcade.currentView === 'menu'" class="arcade-menu">
      <!-- Mode attract - Conteneur pour l'ecran d'attente immersif -->
      <div x-show="$store.arcade.attractMode"
           x-effect="$store.arcade.attractMode ? $store.arcade.showAttractScreen() : $store.arcade.hideAttractScreen()"
           id="attract-mode-container"
           class="attract-mode-container">
      </div>

      <!-- Layout principal: jeux a gauche, options a droite -->
      <div x-show="!$store.arcade.attractMode" class="menu-layout">
        <!-- Colonne gauche: Liste des jeux -->
        <div class="games-column">
          <div class="games-list">
            <template x-for="(game, index) in games" :key="game.id">
              <div class="game-card" :class="{ 'selected': activeZone === 'games' && selectedGameIndex === index }" @click="playGame(game.id)" @mouseenter="activeZone = 'games'; selectedGameIndex = index">
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
        </div>

        <!-- Colonne droite: Options et actions -->
        <aside class="options-panel" :class="{ 'active': activeZone === 'options' }">
          <!-- Section Menu -->
          <div class="options-section">
            <h3 class="options-title">Menu</h3>
            <div class="options-buttons">
              <button @click="$store.arcade.showScores()" class="option-btn" :class="{ 'selected': activeZone === 'options' && selectedOptionIndex === 0 }" @mouseenter="activeZone = 'options'; selectedOptionIndex = 0">
                <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
                </svg>
                <span>Scores</span>
              </button>
              <button @click="$store.arcade.showHelp()" class="option-btn" :class="{ 'selected': activeZone === 'options' && selectedOptionIndex === 1 }" @mouseenter="activeZone = 'options'; selectedOptionIndex = 1">
                <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
                <span>Aide</span>
              </button>
            </div>
          </div>

          <!-- Section Compte -->
          <div class="options-section">
            <h3 class="options-title">Compte</h3>
            <div class="options-buttons">
              <template x-if="!$store.arcade.isAuthenticated">
                <button @click="$store.arcade.showAuth()" class="option-btn option-btn-auth" :class="{ 'selected': activeZone === 'options' && selectedOptionIndex === 2 }" @mouseenter="activeZone = 'options'; selectedOptionIndex = 2">
                  <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  <span>Connexion</span>
                </button>
              </template>
              <template x-if="$store.arcade.isAuthenticated">
                <button @click="$store.arcade.showAccount()" class="option-btn option-btn-account" :class="{ 'selected': activeZone === 'options' && selectedOptionIndex === 2 }" @mouseenter="activeZone = 'options'; selectedOptionIndex = 2">
                  <img :src="$store.arcade.getProfilePicturePath($store.arcade.user?.profilePicture)" alt="Avatar" class="option-avatar" />
                  <span x-text="$store.arcade.user?.username"></span>
                </button>
              </template>
            </div>
          </div>

          <!-- Section Affichage -->
          <div class="options-section">
            <h3 class="options-title">Affichage</h3>
            <div class="options-buttons">
              <button @click="$store.arcade.toggleFullscreen()" class="option-btn" :class="{ 'selected': activeZone === 'options' && selectedOptionIndex === 3 }" @mouseenter="activeZone = 'options'; selectedOptionIndex = 3">
                <svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                <span>Plein ecran</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Vue Jeu -->
    <div x-show="$store.arcade.currentView === 'game'" class="game-view">
      <div class="game-header">
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          ← Retour au menu
        </button>
      </div>
      <div class="game-layout">
        <!-- Panneau gauche - Nom du jeu -->
        <div class="game-side-panel left">
          <span class="game-title-vertical" x-text="$store.arcade.currentGameName"></span>
        </div>

        <!-- Zone centrale du jeu -->
        <div class="game-center">
          <div id="game-container"></div>
        </div>

        <!-- Panneau droit - Score, Niveau et Vies -->
        <div class="game-side-panel right">
          <div class="game-info-panel">
            <div class="game-info-label">NIVEAU</div>
            <div class="game-info-value level" x-text="$store.arcade.gameLevel"></div>
          </div>
          <div class="game-info-panel">
            <div class="game-info-label">SCORE</div>
            <div class="game-info-value score" x-text="$store.arcade.gameScore"></div>
          </div>
          <div class="game-info-panel">
            <div class="game-info-label">VIES</div>
            <div class="game-info-value lives" x-text="$store.arcade.gameLives"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue Authentification -->
    <div x-show="$store.arcade.currentView === 'auth'" class="auth-view">
      <div class="auth-header">
        <button @click="$store.arcade.registerStep === 'pfp' ? $store.arcade.backToRegisterForm() : $store.arcade.backToMenu()" class="back-btn">
          &larr; <span x-text="$store.arcade.registerStep === 'pfp' ? 'Retour' : 'Retour au menu'"></span>
        </button>
        <h2 x-text="$store.arcade.registerStep === 'pfp' ? 'Choisis ton avatar' : ($store.arcade.authMode === 'login' ? 'Connexion' : 'Inscription')"></h2>
      </div>

      <div class="auth-container">
        <!-- Étape 1: Formulaire de connexion/inscription -->
        <template x-if="$store.arcade.registerStep === 'form'">
          <div class="auth-box" x-data="authForm">
            <!-- Tabs -->
            <div class="auth-tabs">
              <button
                class="auth-tab"
                :class="{ 'active': $store.arcade.authMode === 'login' }"
                @click="$store.arcade.setAuthMode('login')"
              >
                Connexion
              </button>
              <button
                class="auth-tab"
                :class="{ 'active': $store.arcade.authMode === 'register' }"
                @click="$store.arcade.setAuthMode('register')"
              >
                Inscription
              </button>
            </div>

            <!-- Formulaire -->
            <form class="auth-form" @submit.prevent="submitForm()">
              <div class="auth-field">
                <label for="auth-username">Pseudo</label>
                <div class="auth-input-wrapper">
                  <input
                    x-model="username"
                    type="text"
                    id="auth-username"
                    placeholder="Ton pseudo"
                    autocomplete="username"
                    required
                    minlength="3"
                    maxlength="20"
                    pattern="[a-zA-Z0-9_]+"
                    @focus="openUsernameKeyboard()"
                  />
                  <button type="button" class="keyboard-trigger-btn" @click="openUsernameKeyboard()" title="Ouvrir le clavier">
                    ⌨
                  </button>
                </div>
              </div>

              <div class="auth-field">
                <label for="auth-password">Mot de passe</label>
                <div class="auth-input-wrapper">
                  <input
                    x-model="password"
                    type="password"
                    id="auth-password"
                    placeholder="Ton mot de passe (8 caracteres min)"
                    autocomplete="current-password"
                    required
                    minlength="8"
                    @focus="openPasswordKeyboard()"
                  />
                  <button type="button" class="keyboard-trigger-btn" @click="openPasswordKeyboard()" title="Ouvrir le clavier">
                    ⌨
                  </button>
                </div>
              </div>

              <!-- Message d'erreur -->
              <div x-show="$store.arcade.authError" class="auth-error">
                <span x-text="$store.arcade.authError"></span>
              </div>

              <button
                type="submit"
                class="auth-submit"
                :disabled="$store.arcade.authLoading"
              >
                <span x-show="!$store.arcade.authLoading" x-text="$store.arcade.authMode === 'login' ? 'Se connecter' : 'Suivant'"></span>
                <span x-show="$store.arcade.authLoading">Chargement...</span>
              </button>
            </form>

            <p class="auth-info">
              <template x-if="$store.arcade.authMode === 'login'">
                <span>Pas encore de compte ? <a href="#" @click.prevent="$store.arcade.setAuthMode('register')">Inscris-toi</a></span>
              </template>
              <template x-if="$store.arcade.authMode === 'register'">
                <span>Deja un compte ? <a href="#" @click.prevent="$store.arcade.setAuthMode('login')">Connecte-toi</a></span>
              </template>
            </p>
          </div>
        </template>

        <!-- Étape 2: Sélection de la photo de profil (inscription uniquement) -->
        <template x-if="$store.arcade.registerStep === 'pfp'">
          <div class="pfp-selector-container">
            <!-- Panneau gauche: Preview en grand -->
            <div class="pfp-preview-panel">
              <div class="pfp-preview">
                <img :src="$store.arcade.getProfilePicturePath($store.arcade.selectedProfilePicture)" alt="Avatar sélectionné" class="pfp-preview-img" />
                <p class="pfp-preview-name" x-text="$store.arcade.tempUsername"></p>
              </div>

              <!-- Message d'erreur -->
              <div x-show="$store.arcade.authError" class="auth-error pfp-error">
                <span x-text="$store.arcade.authError"></span>
              </div>

              <button
                type="button"
                class="auth-submit pfp-confirm-btn"
                :disabled="$store.arcade.authLoading"
                @click="$store.arcade.handleRegisterStep2()"
              >
                <span x-show="!$store.arcade.authLoading">Creer mon compte</span>
                <span x-show="$store.arcade.authLoading">Creation en cours...</span>
              </button>
            </div>

            <!-- Panneau droit: Grille d'avatars pleine hauteur -->
            <div class="pfp-grid-panel">
              <div class="pfp-grid">
                <template x-for="i in 75" :key="i">
                  <button
                    type="button"
                    class="pfp-item"
                    :class="{ 'selected': $store.arcade.selectedProfilePicture === i }"
                    @click="$store.arcade.selectedProfilePicture = i"
                  >
                    <img :src="$store.arcade.getProfilePicturePath(i)" :alt="'Avatar ' + i" loading="lazy" />
                  </button>
                </template>
              </div>
            </div>
          </div>
        </template>

        <template x-if="$store.arcade.registerStep === 'form'">
          <div class="auth-benefits">
            <h3>Pourquoi s'inscrire ?</h3>
            <ul>
              <li>Sauvegarde tes scores</li>
              <li>Apparais dans le classement</li>
              <li>Compare-toi aux autres joueurs</li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <!-- Vue Mon Compte -->
    <div x-show="$store.arcade.currentView === 'account'" class="account-view">
      <!-- Header compact (même style que scores/aide) -->
      <div class="account-topbar">
        <button @click="$store.arcade.backToMenu()" class="back-btn-compact">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <h2 class="account-title">Mon Compte</h2>
      </div>

      <!-- Contenu principal -->
      <div class="account-content">
        <!-- Carte profil à gauche -->
        <div class="account-profile-card">
          <div class="account-avatar-wrapper" @click="$store.arcade.openPfpSelector()">
            <img :src="$store.arcade.getProfilePicturePath($store.arcade.user?.profilePicture)" alt="Avatar" class="account-avatar" />
            <div class="account-avatar-edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          </div>
          <div class="account-info">
            <h3 class="account-username" x-text="$store.arcade.user?.username"></h3>
            <p class="account-member-since">
              Membre depuis le <span x-text="$store.arcade.formatDate($store.arcade.user?.registeredAt)"></span>
            </p>
          </div>
          <div class="account-stats">
            <div class="account-stat">
              <span class="account-stat-value" x-text="$store.arcade.user?.totalGames || 0"></span>
              <span class="account-stat-label">Parties</span>
            </div>
            <div class="account-stat">
              <span class="account-stat-value" x-text="($store.arcade.user?.bestScore || 0).toLocaleString()"></span>
              <span class="account-stat-label">Meilleur</span>
            </div>
          </div>
        </div>

        <!-- Actions à droite -->
        <div class="account-actions-panel">
          <div class="account-actions-section">
            <h4 class="account-section-title">Personnalisation</h4>
            <button class="account-action-btn" @click="$store.arcade.openPfpSelector()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Changer mon avatar
            </button>
          </div>

          <div class="account-actions-section">
            <h4 class="account-section-title">Securite</h4>
            <button class="account-action-btn" @click="$store.arcade.openPasswordReset()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Changer mon mot de passe
            </button>
          </div>

          <div class="account-actions-section">
            <h4 class="account-section-title">Session</h4>
            <button class="account-action-btn account-action-logout" @click="$store.arcade.handleLogout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Deconnexion
            </button>
          </div>
        </div>
      </div>

      <!-- Modal sélecteur de photo de profil -->
      <div x-show="$store.arcade.showPfpSelector" x-cloak class="pfp-modal-overlay" @click.self="$store.arcade.closePfpSelector()">
        <div class="pfp-modal">
          <div class="pfp-modal-header">
            <h3>Choisir un avatar</h3>
            <button class="pfp-modal-close" @click="$store.arcade.closePfpSelector()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="pfp-modal-preview">
            <img :src="$store.arcade.getProfilePicturePath($store.arcade.selectedProfilePicture)" alt="Avatar sélectionné" />
          </div>
          <div class="pfp-modal-grid-wrapper">
            <div class="pfp-modal-grid">
              <template x-for="i in 75" :key="i">
                <button type="button" class="pfp-modal-item" :class="{ 'selected': $store.arcade.selectedProfilePicture === i }" @click="$store.arcade.selectedProfilePicture = i">
                  <img :src="$store.arcade.getProfilePicturePath(i)" :alt="'Avatar ' + i" loading="lazy" />
                </button>
              </template>
            </div>
          </div>
          <div class="pfp-modal-actions">
            <button class="pfp-modal-cancel" @click="$store.arcade.closePfpSelector()">Annuler</button>
            <button class="pfp-modal-confirm" :disabled="$store.arcade.pfpSelectorLoading" @click="$store.arcade.saveProfilePicture()">
              <span x-show="!$store.arcade.pfpSelectorLoading">Enregistrer</span>
              <span x-show="$store.arcade.pfpSelectorLoading">Enregistrement...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal changement de mot de passe -->
      <div x-show="$store.arcade.showPasswordReset" x-cloak class="pfp-modal-overlay" @click.self="$store.arcade.closePasswordReset()">
        <div class="password-modal">
          <div class="pfp-modal-header">
            <h3>Changer le mot de passe</h3>
            <button class="pfp-modal-close" @click="$store.arcade.closePasswordReset()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form class="password-form" @submit.prevent="$store.arcade.handlePasswordReset()">
            <div class="password-field">
              <label for="current-password">Mot de passe actuel</label>
              <input type="password" id="current-password" x-model="$store.arcade.currentPassword" required minlength="8" placeholder="••••••••" />
            </div>
            <div class="password-field">
              <label for="new-password">Nouveau mot de passe</label>
              <input type="password" id="new-password" x-model="$store.arcade.newPassword" required minlength="8" placeholder="8 caracteres minimum" />
            </div>
            <div class="password-field">
              <label for="confirm-password">Confirmer le mot de passe</label>
              <input type="password" id="confirm-password" x-model="$store.arcade.confirmPassword" required minlength="8" placeholder="••••••••" />
            </div>
            <div x-show="$store.arcade.passwordError" class="auth-error">
              <span x-text="$store.arcade.passwordError"></span>
            </div>
            <div x-show="$store.arcade.passwordSuccess" class="password-success">
              <span x-text="$store.arcade.passwordSuccess"></span>
            </div>
            <div class="pfp-modal-actions">
              <button type="button" class="pfp-modal-cancel" @click="$store.arcade.closePasswordReset()">Annuler</button>
              <button type="submit" class="pfp-modal-confirm" :disabled="$store.arcade.passwordLoading">
                <span x-show="!$store.arcade.passwordLoading">Modifier</span>
                <span x-show="$store.arcade.passwordLoading">Modification...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Vue Scores -->
    <div x-show="$store.arcade.currentView === 'scores'" class="scores-view">
      <!-- Header compact -->
      <div class="scores-topbar">
        <button @click="$store.arcade.backToMenu()" class="back-btn-compact">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <h2 class="scores-title">Classements</h2>
        <!-- Scores du joueur connecte -->
        <div class="my-scores-compact">
          <template x-if="$store.arcade.isAuthenticated">
            <div class="my-scores-inner">
              <span class="my-scores-user">
                <img :src="$store.arcade.getProfilePicturePath($store.arcade.user?.profilePicture)" alt="Avatar" class="my-scores-avatar" />
                <span x-text="$store.arcade.user?.username || 'Joueur'"></span>
              </span>
              <span class="my-score-chip">
                <span class="chip-game">PAC</span>
                <span class="chip-value" x-text="($store.arcade.userScores['pacman']?.bestScore || 0).toLocaleString()"></span>
              </span>
              <span class="my-score-chip">
                <span class="chip-game">WALL</span>
                <span class="chip-value" x-text="($store.arcade.userScores['wallbreaker']?.bestScore || 0).toLocaleString()"></span>
              </span>
              <span class="my-score-chip">
                <span class="chip-game">SANTA</span>
                <span class="chip-value" x-text="($store.arcade.userScores['santa-cruz-runner']?.bestScore || 0).toLocaleString()"></span>
              </span>
            </div>
          </template>
          <template x-if="!$store.arcade.isAuthenticated">
            <span class="my-scores-guest">Connecte-toi pour sauvegarder tes scores</span>
          </template>
        </div>
      </div>

      <!-- Loading -->
      <div x-show="$store.arcade.scoresLoading" class="scores-loading">
        Chargement...
      </div>

      <!-- Grille des 3 jeux -->
      <div x-show="!$store.arcade.scoresLoading" class="scores-grid">
        <!-- Pac-Man -->
        <div class="score-column">
          <div class="score-column-header">
            <h3>Pac-Man</h3>
          </div>
          <div class="score-list">
            <template x-for="(score, idx) in ($store.arcade.gameScores['pacman'] || []).slice(0, 10)" :key="score.id || idx">
              <div class="score-row score-row-clickable" :class="'rank-' + (idx + 1)" @click="$store.arcade.openUserProfile(score.playerId)">
                <span class="score-position" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">
                  <template x-if="idx === 0">
                    <svg viewBox="0 0 24 24" class="medal-svg gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z M5 16h14v3H5z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 1">
                    <svg viewBox="0 0 24 24" class="medal-svg silver"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 2">
                    <svg viewBox="0 0 24 24" class="medal-svg bronze"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx > 2">
                    <span x-text="idx + 1"></span>
                  </template>
                </span>
                <img :src="$store.arcade.getProfilePicturePath(score.profilePicture)" alt="Avatar" class="score-avatar" />
                <span class="score-name" x-text="score.playerName"></span>
                <span class="score-pts" x-text="score.score?.toLocaleString()"></span>
              </div>
            </template>
            <p x-show="!$store.arcade.gameScores['pacman']?.length" class="no-scores-msg">Aucun score</p>
          </div>
        </div>

        <!-- Wallbreaker -->
        <div class="score-column">
          <div class="score-column-header">
            <h3>Wallbreaker</h3>
          </div>
          <div class="score-list">
            <template x-for="(score, idx) in ($store.arcade.gameScores['wallbreaker'] || []).slice(0, 10)" :key="score.id || idx">
              <div class="score-row score-row-clickable" :class="'rank-' + (idx + 1)" @click="$store.arcade.openUserProfile(score.playerId)">
                <span class="score-position" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">
                  <template x-if="idx === 0">
                    <svg viewBox="0 0 24 24" class="medal-svg gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z M5 16h14v3H5z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 1">
                    <svg viewBox="0 0 24 24" class="medal-svg silver"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 2">
                    <svg viewBox="0 0 24 24" class="medal-svg bronze"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx > 2">
                    <span x-text="idx + 1"></span>
                  </template>
                </span>
                <img :src="$store.arcade.getProfilePicturePath(score.profilePicture)" alt="Avatar" class="score-avatar" />
                <span class="score-name" x-text="score.playerName"></span>
                <span class="score-pts" x-text="score.score?.toLocaleString()"></span>
              </div>
            </template>
            <p x-show="!$store.arcade.gameScores['wallbreaker']?.length" class="no-scores-msg">Aucun score</p>
          </div>
        </div>

        <!-- Santa Cruz Runner -->
        <div class="score-column">
          <div class="score-column-header">
            <h3>Santa Cruz</h3>
          </div>
          <div class="score-list">
            <template x-for="(score, idx) in ($store.arcade.gameScores['santa-cruz-runner'] || []).slice(0, 10)" :key="score.id || idx">
              <div class="score-row score-row-clickable" :class="'rank-' + (idx + 1)" @click="$store.arcade.openUserProfile(score.playerId)">
                <span class="score-position" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">
                  <template x-if="idx === 0">
                    <svg viewBox="0 0 24 24" class="medal-svg gold"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z M5 16h14v3H5z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 1">
                    <svg viewBox="0 0 24 24" class="medal-svg silver"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx === 2">
                    <svg viewBox="0 0 24 24" class="medal-svg bronze"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/></svg>
                  </template>
                  <template x-if="idx > 2">
                    <span x-text="idx + 1"></span>
                  </template>
                </span>
                <img :src="$store.arcade.getProfilePicturePath(score.profilePicture)" alt="Avatar" class="score-avatar" />
                <span class="score-name" x-text="score.playerName"></span>
                <span class="score-pts" x-text="score.score?.toLocaleString()"></span>
              </div>
            </template>
            <p x-show="!$store.arcade.gameScores['santa-cruz-runner']?.length" class="no-scores-msg">Aucun score</p>
          </div>
        </div>
      </div>

      <!-- Modal profil utilisateur -->
      <div x-show="$store.arcade.showUserProfileModal" x-cloak class="user-profile-modal-overlay" @click.self="$store.arcade.closeUserProfile()">
        <div class="user-profile-modal">
          <button class="user-profile-modal-close" @click="$store.arcade.closeUserProfile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Loading -->
          <div x-show="$store.arcade.profileLoading" class="user-profile-loading">
            <span>Chargement...</span>
          </div>

          <!-- Contenu du profil -->
          <template x-if="!$store.arcade.profileLoading && $store.arcade.viewedUserProfile">
            <div class="user-profile-content">
              <div class="user-profile-header">
                <img :src="$store.arcade.getProfilePicturePath($store.arcade.viewedUserProfile.profilePicture)" alt="Avatar" class="user-profile-avatar" />
                <div class="user-profile-info">
                  <h3 class="user-profile-name" x-text="$store.arcade.viewedUserProfile.username"></h3>
                  <p class="user-profile-date">
                    Membre depuis le <span x-text="$store.arcade.formatDate($store.arcade.viewedUserProfile.registeredAt)"></span>
                  </p>
                </div>
              </div>

              <div class="user-profile-stats">
                <div class="user-profile-stat">
                  <span class="user-profile-stat-value" x-text="$store.arcade.viewedUserProfile.totalGames || 0"></span>
                  <span class="user-profile-stat-label">Parties jouees</span>
                </div>
                <div class="user-profile-stat">
                  <span class="user-profile-stat-value" x-text="($store.arcade.viewedUserProfile.bestScore || 0).toLocaleString()"></span>
                  <span class="user-profile-stat-label">Meilleur score</span>
                </div>
              </div>

              <div class="user-profile-games">
                <h4>Scores par jeu</h4>
                <div class="user-profile-games-grid">
                  <div class="user-profile-game">
                    <span class="user-profile-game-name">Pac-Man</span>
                    <span class="user-profile-game-score" x-text="($store.arcade.viewedUserProfile.statsByGame?.pacman?.bestScore || 0).toLocaleString()"></span>
                    <span class="user-profile-game-plays" x-text="($store.arcade.viewedUserProfile.statsByGame?.pacman?.totalPlays || 0) + ' parties'"></span>
                  </div>
                  <div class="user-profile-game">
                    <span class="user-profile-game-name">Wallbreaker</span>
                    <span class="user-profile-game-score" x-text="($store.arcade.viewedUserProfile.statsByGame?.wallbreaker?.bestScore || 0).toLocaleString()"></span>
                    <span class="user-profile-game-plays" x-text="($store.arcade.viewedUserProfile.statsByGame?.wallbreaker?.totalPlays || 0) + ' parties'"></span>
                  </div>
                  <div class="user-profile-game">
                    <span class="user-profile-game-name">Santa Cruz</span>
                    <span class="user-profile-game-score" x-text="($store.arcade.viewedUserProfile.statsByGame?.['santa-cruz-runner']?.bestScore || 0).toLocaleString()"></span>
                    <span class="user-profile-game-plays" x-text="($store.arcade.viewedUserProfile.statsByGame?.['santa-cruz-runner']?.totalPlays || 0) + ' parties'"></span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Vue Aide -->
    <div x-show="$store.arcade.currentView === 'help'" class="help-view">
      <div class="help-topbar">
        <button @click="$store.arcade.backToMenu()" class="back-btn-compact">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>
        <h2 class="help-title">Aide</h2>
      </div>

      <div class="help-grid">
        <!-- Controles Clavier -->
        <div class="help-card">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12"/>
            </svg>
            <h3>Clavier</h3>
          </div>
          <div class="help-card-content">
            <div class="help-key-row">
              <span class="help-key">&#8593; &#8595; &#8592; &#8594;</span>
              <span>Deplacer</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">Espace</span>
              <span>Action / Sauter</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">Entree</span>
              <span>Valider / Jouer</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">Echap</span>
              <span>Pause / Retour</span>
            </div>
          </div>
        </div>

        <!-- Controles Manette -->
        <div class="help-card">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.97 16L5 19c-.47.47-.51 1.23-.12 1.74.42.54 1.19.68 1.76.28l3.5-2.48c.19-.14.4-.23.62-.28H13.24c.22.05.43.14.62.28l3.5 2.48c.57.4 1.34.26 1.76-.28.39-.51.35-1.27-.12-1.74l-2.97-3H7.97z"/>
              <path d="M17 4H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
            </svg>
            <h3>Manette Xbox</h3>
          </div>
          <div class="help-card-content">
            <div class="help-key-row">
              <span class="help-key gamepad">Stick / D-Pad</span>
              <span>Deplacer</span>
            </div>
            <div class="help-key-row">
              <span class="help-key gamepad">A</span>
              <span>Action / Sauter</span>
            </div>
            <div class="help-key-row">
              <span class="help-key gamepad">Start</span>
              <span>Pause</span>
            </div>
            <div class="help-key-row">
              <span class="help-key gamepad">B</span>
              <span>Retour</span>
            </div>
          </div>
        </div>

        <!-- Connexion Manette -->
        <div class="help-card">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <h3>Connexion manette</h3>
          </div>
          <div class="help-card-content help-steps">
            <div class="help-step">
              <span class="help-step-num">1</span>
              <span>Branchez la manette en USB</span>
            </div>
            <div class="help-step">
              <span class="help-step-num">2</span>
              <span>Attendez la detection (voyant P1/P2)</span>
            </div>
            <div class="help-step">
              <span class="help-step-num">3</span>
              <span>Lancez un jeu et jouez !</span>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <div class="help-card">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <h3>Navigation menu</h3>
          </div>
          <div class="help-card-content">
            <div class="help-key-row">
              <span class="help-key">&#8592; &#8594;</span>
              <span>Changer de jeu</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">Tab</span>
              <span>Basculer zone</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">&#8593; &#8595;</span>
              <span>Options</span>
            </div>
            <div class="help-key-row">
              <span class="help-key">Entree</span>
              <span>Selectionner</span>
            </div>
          </div>
        </div>

        <!-- Les jeux -->
        <div class="help-card help-card-wide">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
            <h3>Les jeux</h3>
          </div>
          <div class="help-card-content help-games-info">
            <div class="help-game-item">
              <span class="help-game-name">Pac-Man</span>
              <span class="help-game-desc">Mangez les pac-gommes et evitez les fantomes</span>
            </div>
            <div class="help-game-item">
              <span class="help-game-name">Wallbreaker</span>
              <span class="help-game-desc">Detruisez les briques avec la balle et la raquette</span>
            </div>
            <div class="help-game-item">
              <span class="help-game-name">Santa Cruz Runner</span>
              <span class="help-game-desc">Courez et sautez par-dessus les obstacles</span>
            </div>
          </div>
        </div>

        <!-- Compte & Scores -->
        <div class="help-card">
          <div class="help-card-header">
            <svg class="help-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <h3>Compte & Scores</h3>
          </div>
          <div class="help-card-content help-steps">
            <div class="help-step">
              <span class="help-step-bullet">&#10003;</span>
              <span>Connectez-vous pour sauvegarder vos scores</span>
            </div>
            <div class="help-step">
              <span class="help-step-bullet">&#10003;</span>
              <span>Comparez-vous dans le classement</span>
            </div>
            <div class="help-step">
              <span class="help-step-bullet">&#10003;</span>
              <span>Defiez les autres joueurs !</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
