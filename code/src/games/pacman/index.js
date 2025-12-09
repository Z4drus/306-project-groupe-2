/**
 * Jeu Pacman
 *
 * Collectez toutes les pastilles en évitant les fantômes
 */

import Phaser from 'phaser';

/**
 * Configuration du jeu Pacman
 */
export const PacmanConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
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
  // Les assets seront chargés ici
  console.log('Pacman: Préchargement des assets...');
}

/**
 * Création de la scène
 */
function create() {
  console.log('Pacman: Création de la scène...');

  // Texte de placeholder
  const title = this.add.text(400, 200, 'PACMAN', {
    fontSize: '64px',
    fill: '#fff',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);

  const instruction = this.add.text(400, 300, 'Jeu à implémenter', {
    fontSize: '24px',
    fill: '#ffff00',
  });
  instruction.setOrigin(0.5);

  // Score
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#fff',
  });

  // Instructions contrôles
  const controls = this.add.text(400, 500, 'Flèches: Déplacement | ESC: Quitter', {
    fontSize: '16px',
    fill: '#888',
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
 * Initialise et lance le jeu Pacman
 */
export function startPacman() {
  console.log('Démarrage de Pacman...');
  const game = new Phaser.Game(PacmanConfig);
  return game;
}
