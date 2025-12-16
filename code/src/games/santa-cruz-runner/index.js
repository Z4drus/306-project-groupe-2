/**
 * Jeu Santa Cruz Runner
 *
 * Courez et évitez les obstacles
 */

import Phaser from 'phaser';

/**
 * Configuration du jeu Santa Cruz Runner
 */
export const SantaCruzRunnerConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let score = 0;
let scoreText;

/**
 * Préchargement des assets
 */
function preload() {
  // Les assets seront chargés ici
  console.log('Santa Cruz Runner: Préchargement des assets...');
}

/**
 * Création de la scène
 */
function create() {
  console.log('Santa Cruz Runner: Création de la scène...');

  // Texte de placeholder
  const title = this.add.text(400, 200, 'SANTA CRUZ RUNNER', {
    fontSize: '64px',
    fill: '#004e89',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);

  const instruction = this.add.text(400, 300, 'Jeu à implémenter', {
    fontSize: '24px',
    fill: '#f7931e',
  });
  instruction.setOrigin(0.5);

  // Score
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#000',
  });

  // Instructions contrôles
  const controls = this.add.text(400, 500, 'Espace: Sauter | ESC: Quitter', {
    fontSize: '16px',
    fill: '#333',
  });
  controls.setOrigin(0.5);

  // Gestion de la touche ESC pour retourner au menu
  this.input.keyboard.on('keydown-ESC', () => {
    this.scene.stop();
    window.Alpine.store('arcade').backToMenu();
  });
}

/**
 * Boucle de mise à jour
 * @param {number} time - Temps écoulé
 * @param {number} delta - Delta depuis la dernière frame
 */
function update(time, delta) {
  // Logique du jeu sera implémentée ici
}

/**
 * Initialise et lance le jeu Santa Cruz Runner
 * @param {HTMLElement} container - Container DOM pour le canvas
 * @param {Function} onGameOver - Callback appelé à la fin du jeu avec le score
 * @param {Function} onScoreUpdate - Callback appelé à chaque mise à jour du score
 * @param {number} bestScore - Meilleur score du joueur
 * @param {string|null} username - Pseudo du joueur connecté
 * @param {Function} onLoadProgress - Callback pour la progression du chargement
 * @returns {Phaser.Game} Instance du jeu Phaser
 */
export function startSantaCruzRunner(container = null, onGameOver = null, onScoreUpdate = null, bestScore = 0, username = null, onLoadProgress = null) {
  console.log('Démarrage de Santa Cruz Runner...');

  // Configurer le container si fourni
  const config = { ...SantaCruzRunnerConfig };
  if (container) {
    config.parent = container;
  }

  // Notifier la progression
  if (onLoadProgress) {
    onLoadProgress(50, 'Chargement de Santa Cruz Runner...');
  }

  const game = new Phaser.Game(config);

  // Stocker les callbacks dans le registry
  if (onGameOver) {
    game.registry.set('onGameOver', onGameOver);
  }
  if (onScoreUpdate) {
    game.registry.set('onScoreUpdate', onScoreUpdate);
  }
  game.registry.set('bestScore', bestScore);
  game.registry.set('username', username);

  if (onLoadProgress) {
    onLoadProgress(100, 'Pret !');
  }

  return game;
}
