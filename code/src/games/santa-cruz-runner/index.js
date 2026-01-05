/**
 * Santa Cruz Runner - Point d'entrée
 *
 * Endless runner de Noël avec Santa qui court sur des plateformes
 * - Architecture MVC complète
 * - Double saut disponible
 * - Collectibles (cadeaux) avec système de combo
 * - Difficulté progressive
 * - Plateformes de tailles variables
 */

import Phaser from 'phaser';
import { createPhaserConfig } from './config/GameConfig.js';
import MenuScene from './views/scenes/MenuScene.js';
import GameScene from './views/scenes/GameScene.js';
import GameOverScene from './views/scenes/GameOverScene.js';

// Référence globale au jeu actuel pour le nettoyage
let currentGame = null;

/**
 * Nettoie complètement le jeu précédent s'il existe
 */
function cleanupPreviousGame() {
  if (currentGame) {
    try {
      // Arrêter toutes les scènes
      currentGame.scene.getScenes(true).forEach(scene => {
        if (scene.shutdown) {
          scene.shutdown();
        }
        currentGame.scene.stop(scene.scene.key);
      });

      // Nettoyer les animations globales
      if (currentGame.anims) {
        currentGame.anims.remove('santa-run');
        currentGame.anims.remove('santa-jump');
        currentGame.anims.remove('santa-fall');
      }

      // Arrêter tous les sons
      if (currentGame.sound) {
        currentGame.sound.stopAll();
        currentGame.sound.removeAll();
      }

      // Détruire le jeu
      currentGame.destroy(true, false);
    } catch (e) {
      console.warn('Erreur lors du nettoyage du jeu précédent:', e);
    }
    currentGame = null;
  }
}

/**
 * Démarre le jeu Santa Cruz Runner
 * @param {HTMLElement} container - Container DOM pour le canvas
 * @param {Function} onGameOver - Callback appelé à la fin du jeu avec le score
 * @param {Function} onScoreUpdate - Callback appelé à chaque mise à jour du score
 * @param {number} bestScore - Meilleur score du joueur
 * @param {string|null} username - Pseudo du joueur connecté
 * @param {Function} onLoadProgress - Callback pour la progression du chargement
 * @returns {Phaser.Game} Instance du jeu Phaser
 */
export function startSantaCruzRunner(container = null, onGameOver = null, onScoreUpdate = null, bestScore = 0, username = null, onLoadProgress = null) {
  // Nettoyer le jeu précédent s'il existe
  cleanupPreviousGame();

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

  // Stocker la référence
  currentGame = game;

  // Écouter la destruction du jeu pour nettoyer la référence
  game.events.once('destroy', () => {
    currentGame = null;
  });

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
 * Arrête et nettoie complètement le jeu Santa Cruz Runner
 */
export function stopSantaCruzRunner() {
  cleanupPreviousGame();
}

/**
 * Exporte la configuration pour référence externe
 */
export { createPhaserConfig } from './config/GameConfig.js';
