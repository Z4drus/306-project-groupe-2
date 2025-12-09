/**
 * Jeu Wallbreaker
 *
 * Détruisez tous les murs avec votre balle
 */

import Phaser from 'phaser';

/**
 * Configuration du jeu Wallbreaker
 */
export const WallbreakerConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
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
  console.log('Wallbreaker: Préchargement des assets...');
}

/**
 * Création de la scène
 */
function create() {
  console.log('Wallbreaker: Création de la scène...');

  // Texte de placeholder
  const title = this.add.text(400, 200, 'WALLBREAKER', {
    fontSize: '64px',
    fill: '#ff6b35',
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
 * Initialise et lance le jeu Wallbreaker
 */
export function startWallbreaker() {
  console.log('Démarrage de Wallbreaker...');
  const game = new Phaser.Game(WallbreakerConfig);
  return game;
}
