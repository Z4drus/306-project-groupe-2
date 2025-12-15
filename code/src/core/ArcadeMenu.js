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
