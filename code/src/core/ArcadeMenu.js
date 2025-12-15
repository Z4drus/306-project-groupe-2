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
