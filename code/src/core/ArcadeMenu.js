/**
 * ArcadeMenu - Composant Alpine.js pour le menu
 *
 * Gère l'affichage et les interactions du menu principal
 */

import Alpine from 'alpinejs';
import { getAvailableGames } from './GameLoader.js';

/**
 * Crée le composant menu Alpine.js
 * @returns {Object} Configuration du composant
 */
export function createArcadeMenuComponent() {
  return {
    games: getAvailableGames(),

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
          <p class="arcade-subtitle">Borne d'Arcade Moderne</p>
        </div>
      </div>
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
        <template x-if="!$store.arcade.isAuthenticated">
          <button @click="$store.arcade.showAuth()" class="action-btn auth-btn">
            Connexion
          </button>
        </template>
        <template x-if="$store.arcade.isAuthenticated">
          <button @click="$store.arcade.handleLogout()" class="action-btn logout-btn">
            <span x-text="$store.arcade.user?.username"></span> - Deconnexion
          </button>
        </template>
        <button @click="$store.arcade.toggleFullscreen()" class="action-btn">
          Plein ecran
        </button>
      </div>

      <!-- Indicateur de connexion -->
      <div x-show="!$store.arcade.attractMode && $store.arcade.isAuthenticated" class="user-status">
        <span class="user-icon">&#128100;</span>
        <span class="user-name" x-text="$store.arcade.user?.username"></span>
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
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          &larr; Retour au menu
        </button>
        <h2 x-text="$store.arcade.authMode === 'login' ? 'Connexion' : 'Inscription'"></h2>
      </div>

      <div class="auth-container">
        <div class="auth-box" x-data="{ username: '', password: '' }">
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
          <form class="auth-form" @submit.prevent="
            $store.arcade.authMode === 'login'
              ? $store.arcade.handleLogin(username, password)
              : $store.arcade.handleRegister(username, password)
          ">
            <div class="auth-field">
              <label for="username">Pseudo</label>
              <input
                x-model="username"
                type="text"
                id="username"
                placeholder="Ton pseudo"
                autocomplete="username"
                required
                minlength="3"
                maxlength="20"
                pattern="[a-zA-Z0-9_]+"
              />
            </div>

            <div class="auth-field">
              <label for="password">Mot de passe</label>
              <input
                x-model="password"
                type="password"
                id="password"
                placeholder="Ton mot de passe (8 caracteres min)"
                autocomplete="current-password"
                required
                minlength="8"
              />
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
              <span x-show="!$store.arcade.authLoading" x-text="$store.arcade.authMode === 'login' ? 'Se connecter' : 'Creer un compte'"></span>
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

        <div class="auth-benefits">
          <h3>Pourquoi s'inscrire ?</h3>
          <ul>
            <li>Sauvegarde tes scores</li>
            <li>Apparais dans le classement</li>
            <li>Compare-toi aux autres joueurs</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Vue Scores -->
    <div x-show="$store.arcade.currentView === 'scores'" class="scores-view">
      <div class="scores-header">
        <button @click="$store.arcade.backToMenu()" class="back-btn">
          &larr; Retour au menu
        </button>
        <h2>Tableau des Scores</h2>
      </div>

      <div class="scores-content">
        <!-- Loading -->
        <div x-show="$store.arcade.scoresLoading" class="scores-loading">
          Chargement des scores...
        </div>

        <!-- Leaderboard Global -->
        <div x-show="!$store.arcade.scoresLoading" class="leaderboard-section">
          <h3>Classement Global</h3>
          <div class="leaderboard-table" x-show="$store.arcade.leaderboard.length > 0">
            <div class="leaderboard-header">
              <span class="rank-col">#</span>
              <span class="player-col">Joueur</span>
              <span class="score-col">Meilleur Score</span>
              <span class="games-col">Parties</span>
            </div>
            <template x-for="(player, index) in $store.arcade.leaderboard" :key="player.username">
              <div class="leaderboard-row" :class="{ 'top-3': index < 3 }">
                <span class="rank-col" :class="'rank-' + (index + 1)" x-text="player.rank"></span>
                <span class="player-col" x-text="player.username"></span>
                <span class="score-col" x-text="player.bestScore.toLocaleString()"></span>
                <span class="games-col" x-text="player.totalGames"></span>
              </div>
            </template>
          </div>
          <p x-show="$store.arcade.leaderboard.length === 0" class="no-scores">
            Aucun score enregistre. Sois le premier !
          </p>
        </div>

        <!-- Scores par jeu -->
        <div x-show="!$store.arcade.scoresLoading" class="game-scores-section">
          <h3>Scores par Jeu</h3>
          <div class="game-scores-grid">
            <!-- Pac-Man -->
            <div class="game-score-card">
              <h4>Pac-Man</h4>
              <div class="game-score-list" x-show="$store.arcade.gameScores['pacman']?.length > 0">
                <template x-for="(score, idx) in ($store.arcade.gameScores['pacman'] || []).slice(0, 10)" :key="score.id">
                  <div class="game-score-row" :class="{ 'top-score': idx < 3 }">
                    <span class="score-rank" :class="'rank-' + (idx + 1)" x-text="idx + 1 + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['pacman']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
            </div>

            <!-- Wallbreaker -->
            <div class="game-score-card">
              <h4>Wallbreaker</h4>
              <div class="game-score-list" x-show="$store.arcade.gameScores['wallbreaker']?.length > 0">
                <template x-for="(score, idx) in ($store.arcade.gameScores['wallbreaker'] || []).slice(0, 10)" :key="score.id">
                  <div class="game-score-row" :class="{ 'top-score': idx < 3 }">
                    <span class="score-rank" :class="'rank-' + (idx + 1)" x-text="idx + 1 + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['wallbreaker']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
            </div>

            <!-- Santa Cruz Runner -->
            <div class="game-score-card">
              <h4>Santa Cruz Runner</h4>
              <div class="game-score-list" x-show="$store.arcade.gameScores['santa-cruz-runner']?.length > 0">
                <template x-for="(score, idx) in ($store.arcade.gameScores['santa-cruz-runner'] || []).slice(0, 10)" :key="score.id">
                  <div class="game-score-row" :class="{ 'top-score': idx < 3 }">
                    <span class="score-rank" :class="'rank-' + (idx + 1)" x-text="idx + 1 + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['santa-cruz-runner']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
            </div>
          </div>
        </div>
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
