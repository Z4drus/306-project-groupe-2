/**
 * Jeu Pong Duel
 *
 * Affrontez votre adversaire dans ce classique revisité - 2 joueurs
 */

import Phaser from 'phaser';

/**
 * Configuration du jeu Pong Duel
 */
export const PongDuelConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0a0014',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
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
  console.log('Pong Duel: Préchargement des assets...');
}

/**
 * Création de la scène
 */
function create() {
  console.log('Pong Duel: Création de la scène...');

  // Texte de placeholder
  const title = this.add.text(400, 200, 'PONG DUEL', {
    fontSize: '72px',
    fill: '#00ffff',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);

  const subtitle = this.add.text(400, 280, '2 JOUEURS', {
    fontSize: '32px',
    fill: '#bd00ff',
  });
  subtitle.setOrigin(0.5);

  const instruction = this.add.text(400, 350, 'Jeu a implementer', {
    fontSize: '24px',
    fill: '#ffff00',
  });
  instruction.setOrigin(0.5);

  // Score
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#00ffff',
  });

  // Instructions contrôles
  const controls = this.add.text(400, 500, 'J1: W/S | J2: Fleches | ESC: Quitter', {
    fontSize: '18px',
    fill: '#00d4ff',
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
 * Initialise et lance le jeu Pong Duel
 * @param {HTMLElement} container - Container DOM pour le canvas
 * @param {Function} onGameOver - Callback appelé à la fin du jeu avec le score
 * @param {Function} onScoreUpdate - Callback appelé à chaque mise à jour du score
 * @param {number} bestScore - Meilleur score du joueur
 * @param {string|null} username - Pseudo du joueur connecté
 * @param {Function} onLoadProgress - Callback pour la progression du chargement
 * @returns {Phaser.Game} Instance du jeu Phaser
 */
export function startPongDuel(container = null, onGameOver = null, onScoreUpdate = null, bestScore = 0, username = null, onLoadProgress = null) {
  console.log('Démarrage de Pong Duel...');

  // Configurer le container si fourni
  const config = { ...PongDuelConfig };
  if (container) {
    config.parent = container;
  }

  // Notifier la progression
  if (onLoadProgress) {
    onLoadProgress(50, 'Chargement de Pong Duel...');
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
