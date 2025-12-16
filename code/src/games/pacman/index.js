/**
 * Pacman Game - Point d'entrée
 *
 * Jeu Pacman classique avec architecture MVC
 * - Models: Gestion des données (état du jeu, entités)
 * - Views: Rendu visuel (sprites, animations, HUD)
 * - Controllers: Logique de jeu (IA, mouvements, collisions)
 */

import Phaser from 'phaser';
import { createPhaserConfig } from './config/GameConfig.js';
import MenuScene from './views/scenes/MenuScene.js';
import GameScene from './views/scenes/GameScene.js';
import GameOverScene from './views/scenes/GameOverScene.js';

/**
 * Démarre le jeu Pacman
 * @param {HTMLElement} container - Container DOM pour le canvas
 * @param {Function} onGameOver - Callback appelé à la fin du jeu avec le score
 * @param {Function} onScoreUpdate - Callback appelé à chaque mise à jour du score
 * @param {number} bestScore - Meilleur score du joueur
 * @param {string|null} username - Pseudo du joueur connecté
 * @param {Function} onLoadProgress - Callback pour la progression du chargement
 * @returns {Phaser.Game} Instance du jeu Phaser
 */
export function startPacman(container = null, onGameOver = null, onScoreUpdate = null, bestScore = 0, username = null, onLoadProgress = null) {
  // Créer la configuration Phaser
  const config = createPhaserConfig(container);

  // Ajouter les scènes
  config.scene = [MenuScene, GameScene, GameOverScene];

  // Configurer les callbacks de chargement
  config.callbacks = {
    preBoot: (game) => {
      // Configurer le suivi du chargement des assets
      game.events.on('ready', () => {
        const scene = game.scene.getScene('MenuScene');
        if (scene && onLoadProgress) {
          scene.load.on('progress', (value) => {
            onLoadProgress(value * 100, `Chargement des assets: ${Math.round(value * 100)}%`);
          });
          scene.load.on('fileprogress', (file) => {
            onLoadProgress(scene.load.progress * 100, `Chargement: ${file.key}`);
          });
        }
      });
    }
  };

  // Créer l'instance du jeu
  const game = new Phaser.Game(config);

  // Passer les callbacks via le registry
  if (onGameOver) {
    game.registry.set('onGameOver', onGameOver);
  }
  if (onScoreUpdate) {
    game.registry.set('onScoreUpdate', onScoreUpdate);
  }
  if (onLoadProgress) {
    game.registry.set('onLoadProgress', onLoadProgress);
  }

  // Passer le best score et le username
  game.registry.set('bestScore', bestScore);
  game.registry.set('username', username);

  return game;
}

/**
 * Exporte la configuration pour référence externe
 */
export { createPhaserConfig } from './config/GameConfig.js';
