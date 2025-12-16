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
          <p class="arcade-subtitle">Borne d'Arcade</p>
        </div>
      </div>
      <!-- Partie droite du header -->
      <div class="header-right">
        <!-- Indicateur utilisateur connecté -->
        <div x-show="$store.arcade.isAuthenticated" class="header-user">
          <span class="header-user-icon">&#128100;</span>
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

        <!-- Bandeau des scores du joueur connecté -->
        <div x-show="!$store.arcade.scoresLoading && $store.arcade.isAuthenticated && Object.keys($store.arcade.userScores).length > 0" class="user-scores-banner">
          <div class="user-scores-title">
            <span class="user-icon">&#128100;</span>
            <span x-text="'Mes meilleurs scores - ' + ($store.arcade.user?.username || '')"></span>
          </div>
          <div class="user-scores-row">
            <div class="user-score-item">
              <span class="user-score-game">Pac-Man</span>
              <span class="user-score-value" x-text="($store.arcade.userScores['pacman']?.bestScore || 0).toLocaleString()"></span>
              <span class="user-score-plays" x-text="'(' + ($store.arcade.userScores['pacman']?.totalPlays || 0) + ' parties)'"></span>
            </div>
            <div class="user-score-item">
              <span class="user-score-game">Wallbreaker</span>
              <span class="user-score-value" x-text="($store.arcade.userScores['wallbreaker']?.bestScore || 0).toLocaleString()"></span>
              <span class="user-score-plays" x-text="'(' + ($store.arcade.userScores['wallbreaker']?.totalPlays || 0) + ' parties)'"></span>
            </div>
            <div class="user-score-item">
              <span class="user-score-game">Santa Cruz</span>
              <span class="user-score-value" x-text="($store.arcade.userScores['santa-cruz-runner']?.bestScore || 0).toLocaleString()"></span>
              <span class="user-score-plays" x-text="'(' + ($store.arcade.userScores['santa-cruz-runner']?.totalPlays || 0) + ' parties)'"></span>
            </div>
          </div>
        </div>

        <!-- Scores par jeu -->
        <div x-show="!$store.arcade.scoresLoading" class="game-scores-section">
          <div class="game-scores-grid">
            <!-- Pac-Man -->
            <div class="game-score-card">
              <h4>Pac-Man</h4>
              <!-- Podium pour le top 3 -->
              <div class="podium-container" x-show="$store.arcade.gameScores['pacman']?.length >= 3">
                <div class="podium">
                  <!-- 2ème place -->
                  <div class="podium-place second">
                    <div class="podium-medal silver">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">2</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['pacman']?.[1]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['pacman']?.[1]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar second-bar"></div>
                  </div>
                  <!-- 1ère place -->
                  <div class="podium-place first">
                    <div class="podium-medal gold">
                      <svg viewBox="0 0 24 24" class="medal-icon crown">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="currentColor"/>
                        <rect x="5" y="16" width="14" height="3" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">1</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['pacman']?.[0]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['pacman']?.[0]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar first-bar"></div>
                  </div>
                  <!-- 3ème place -->
                  <div class="podium-place third">
                    <div class="podium-medal bronze">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">3</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['pacman']?.[2]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['pacman']?.[2]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar third-bar"></div>
                  </div>
                </div>
              </div>
              <!-- Liste des autres scores -->
              <div class="game-score-list" x-show="$store.arcade.gameScores['pacman']?.length > 3">
                <template x-for="(score, idx) in ($store.arcade.gameScores['pacman'] || []).slice(3, 10)" :key="score.id">
                  <div class="game-score-row">
                    <span class="score-rank" x-text="(idx + 4) + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['pacman']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
              <!-- Stats partie -->
              <div class="game-stats" x-show="$store.arcade.gameScores['pacman']?.length > 0">
                <span class="stats-label">Parties jouees</span>
                <span class="stats-value" x-text="($store.arcade.gameScores['pacman'] || []).reduce((sum, s) => sum + (s.totalPlays || 0), 0)"></span>
              </div>
            </div>

            <!-- Wallbreaker -->
            <div class="game-score-card">
              <h4>Wallbreaker</h4>
              <!-- Podium pour le top 3 -->
              <div class="podium-container" x-show="$store.arcade.gameScores['wallbreaker']?.length >= 3">
                <div class="podium">
                  <!-- 2ème place -->
                  <div class="podium-place second">
                    <div class="podium-medal silver">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">2</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['wallbreaker']?.[1]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['wallbreaker']?.[1]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar second-bar"></div>
                  </div>
                  <!-- 1ère place -->
                  <div class="podium-place first">
                    <div class="podium-medal gold">
                      <svg viewBox="0 0 24 24" class="medal-icon crown">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="currentColor"/>
                        <rect x="5" y="16" width="14" height="3" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">1</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['wallbreaker']?.[0]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['wallbreaker']?.[0]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar first-bar"></div>
                  </div>
                  <!-- 3ème place -->
                  <div class="podium-place third">
                    <div class="podium-medal bronze">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">3</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['wallbreaker']?.[2]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['wallbreaker']?.[2]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar third-bar"></div>
                  </div>
                </div>
              </div>
              <!-- Liste des autres scores -->
              <div class="game-score-list" x-show="$store.arcade.gameScores['wallbreaker']?.length > 3">
                <template x-for="(score, idx) in ($store.arcade.gameScores['wallbreaker'] || []).slice(3, 10)" :key="score.id">
                  <div class="game-score-row">
                    <span class="score-rank" x-text="(idx + 4) + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['wallbreaker']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
              <!-- Stats partie -->
              <div class="game-stats" x-show="$store.arcade.gameScores['wallbreaker']?.length > 0">
                <span class="stats-label">Parties jouees</span>
                <span class="stats-value" x-text="($store.arcade.gameScores['wallbreaker'] || []).reduce((sum, s) => sum + (s.totalPlays || 0), 0)"></span>
              </div>
            </div>

            <!-- Santa Cruz Runner -->
            <div class="game-score-card">
              <h4>Santa Cruz Runner</h4>
              <!-- Podium pour le top 3 -->
              <div class="podium-container" x-show="$store.arcade.gameScores['santa-cruz-runner']?.length >= 3">
                <div class="podium">
                  <!-- 2ème place -->
                  <div class="podium-place second">
                    <div class="podium-medal silver">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">2</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[1]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[1]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar second-bar"></div>
                  </div>
                  <!-- 1ère place -->
                  <div class="podium-place first">
                    <div class="podium-medal gold">
                      <svg viewBox="0 0 24 24" class="medal-icon crown">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="currentColor"/>
                        <rect x="5" y="16" width="14" height="3" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">1</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[0]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[0]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar first-bar"></div>
                  </div>
                  <!-- 3ème place -->
                  <div class="podium-place third">
                    <div class="podium-medal bronze">
                      <svg viewBox="0 0 24 24" class="medal-icon">
                        <circle cx="12" cy="9" r="6" fill="currentColor"/>
                        <path d="M12 15 L8 22 L12 19 L16 22 Z" fill="currentColor"/>
                      </svg>
                      <span class="podium-rank">3</span>
                    </div>
                    <span class="podium-player" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[2]?.playerName || ''"></span>
                    <span class="podium-score" x-text="$store.arcade.gameScores['santa-cruz-runner']?.[2]?.score?.toLocaleString() || ''"></span>
                    <div class="podium-bar third-bar"></div>
                  </div>
                </div>
              </div>
              <!-- Liste des autres scores -->
              <div class="game-score-list" x-show="$store.arcade.gameScores['santa-cruz-runner']?.length > 3">
                <template x-for="(score, idx) in ($store.arcade.gameScores['santa-cruz-runner'] || []).slice(3, 10)" :key="score.id">
                  <div class="game-score-row">
                    <span class="score-rank" x-text="(idx + 4) + '.'"></span>
                    <span class="score-player" x-text="score.playerName"></span>
                    <span class="score-value" x-text="score.score.toLocaleString()"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['santa-cruz-runner']?.length" class="no-game-scores">
                Pas encore de scores
              </p>
              <!-- Stats partie -->
              <div class="game-stats" x-show="$store.arcade.gameScores['santa-cruz-runner']?.length > 0">
                <span class="stats-label">Parties jouees</span>
                <span class="stats-value" x-text="($store.arcade.gameScores['santa-cruz-runner'] || []).reduce((sum, s) => sum + (s.totalPlays || 0), 0)"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Classement par nombre de parties jouées -->
        <div x-show="!$store.arcade.scoresLoading" class="plays-ranking-section">
          <h3>Joueurs les plus actifs</h3>
          <div class="plays-ranking-grid">
            <!-- Pac-Man -->
            <div class="plays-ranking-card">
              <h4>Pac-Man</h4>
              <div class="plays-ranking-list" x-show="$store.arcade.gameScores['pacman']?.length > 0">
                <template x-for="(player, idx) in ($store.arcade.gameScores['pacman'] || []).slice().sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0)).slice(0, 5)" :key="player.playerName + '-plays'">
                  <div class="plays-ranking-row" :class="{ 'top-active': idx < 3 }">
                    <span class="plays-rank" :class="'active-rank-' + (idx + 1)" x-text="(idx + 1) + '.'"></span>
                    <span class="plays-player" x-text="player.playerName"></span>
                    <span class="plays-count" x-text="(player.totalPlays || 0) + ' parties'"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['pacman']?.length" class="no-game-scores">Pas de donnees</p>
            </div>

            <!-- Wallbreaker -->
            <div class="plays-ranking-card">
              <h4>Wallbreaker</h4>
              <div class="plays-ranking-list" x-show="$store.arcade.gameScores['wallbreaker']?.length > 0">
                <template x-for="(player, idx) in ($store.arcade.gameScores['wallbreaker'] || []).slice().sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0)).slice(0, 5)" :key="player.playerName + '-plays'">
                  <div class="plays-ranking-row" :class="{ 'top-active': idx < 3 }">
                    <span class="plays-rank" :class="'active-rank-' + (idx + 1)" x-text="(idx + 1) + '.'"></span>
                    <span class="plays-player" x-text="player.playerName"></span>
                    <span class="plays-count" x-text="(player.totalPlays || 0) + ' parties'"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['wallbreaker']?.length" class="no-game-scores">Pas de donnees</p>
            </div>

            <!-- Santa Cruz Runner -->
            <div class="plays-ranking-card">
              <h4>Santa Cruz</h4>
              <div class="plays-ranking-list" x-show="$store.arcade.gameScores['santa-cruz-runner']?.length > 0">
                <template x-for="(player, idx) in ($store.arcade.gameScores['santa-cruz-runner'] || []).slice().sort((a, b) => (b.totalPlays || 0) - (a.totalPlays || 0)).slice(0, 5)" :key="player.playerName + '-plays'">
                  <div class="plays-ranking-row" :class="{ 'top-active': idx < 3 }">
                    <span class="plays-rank" :class="'active-rank-' + (idx + 1)" x-text="(idx + 1) + '.'"></span>
                    <span class="plays-player" x-text="player.playerName"></span>
                    <span class="plays-count" x-text="(player.totalPlays || 0) + ' parties'"></span>
                  </div>
                </template>
              </div>
              <p x-show="!$store.arcade.gameScores['santa-cruz-runner']?.length" class="no-game-scores">Pas de donnees</p>
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
