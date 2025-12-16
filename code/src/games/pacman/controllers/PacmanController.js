/**
 * PacmanController - Contrôleur de Pacman
 *
 * Gère la logique de mouvement et de comportement de Pacman
 */

import Phaser from 'phaser';
import PacmanModel from '../models/PacmanModel.js';
import PacmanView from '../views/PacmanView.js';
import { TILES } from '../config/GameConfig.js';

export default class PacmanController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {Object} map - Tilemap Phaser
   * @param {Object} layer - Layer de la tilemap
   */
  constructor(scene, map, layer) {
    this.scene = scene;
    this.map = map;
    this.layer = layer;

    // Créer le modèle et la vue
    this.model = new PacmanModel();
    this.view = new PacmanView(scene, this.model);

    // Directions pour vérification
    this.directions = [null, null, null, null, null];

    // Démarrer vers la gauche
    this.move(Phaser.LEFT);
  }

  /**
   * Met à jour Pacman (appelé chaque frame)
   * @param {number} requestedDirection - Direction demandée par le joueur
   */
  update(requestedDirection) {
    // Gérer la mort
    if (this.model.isDead) {
      this.handleDeath();
      return;
    }

    // Synchroniser le modèle avec la vue
    this.view.update();

    // Gérer le wrapping aux bords
    this.view.handleWrapping(this.map.widthInPixels);

    // Vérifier les entrées
    if (requestedDirection !== Phaser.NONE) {
      // Si c'est un demi-tour, l'exécuter immédiatement
      if (this.model.isOppositeDirection(requestedDirection)) {
        this.model.turningDirection = Phaser.NONE; // Annuler tout virage en cours
        this.move(requestedDirection);
      } else if (requestedDirection !== this.model.currentDirection) {
        // Nouvelle direction demandée - toujours mettre à jour
        this.model.setWantedDirection(requestedDirection);
        this.checkDirection(requestedDirection);
      }
    }

    // Tourner si nécessaire
    if (this.model.turningDirection !== Phaser.NONE) {
      this.turn();
    }
  }

  /**
   * Gère l'état de mort
   */
  handleDeath() {
    this.view.move(Phaser.NONE);

    if (!this.model.isAnimatingDeath) {
      this.model.isAnimatingDeath = true;
      this.view.playDeathAnimation(() => {
        this.model.setDeathAnimationComplete();
      });
    }
  }

  /**
   * Vérifie si on peut tourner dans une direction
   * @param {number} turnTo - Direction voulue
   */
  checkDirection(turnTo) {
    if (turnTo === Phaser.NONE) return;

    // Récupérer les tiles adjacentes
    this.updateAdjacentTiles();

    // Vérifier si la direction est valide (tile traversable)
    if (!this.directions[turnTo] || this.directions[turnTo].index !== TILES.SAFE) {
      return;
    }

    // Programmer le virage (remplace tout virage précédent)
    this.model.setTurningDirection(turnTo);
  }

  /**
   * Met à jour les tiles adjacentes
   */
  updateAdjacentTiles() {
    const x = this.model.gridX;
    const y = this.model.gridY;

    this.directions[Phaser.LEFT] = this.map.getTileAt(x - 1, y, false, this.layer);
    this.directions[Phaser.RIGHT] = this.map.getTileAt(x + 1, y, false, this.layer);
    this.directions[Phaser.UP] = this.map.getTileAt(x, y - 1, false, this.layer);
    this.directions[Phaser.DOWN] = this.map.getTileAt(x, y + 1, false, this.layer);
  }

  /**
   * Effectue le virage
   */
  turn() {
    const cx = Math.floor(this.view.sprite.x);
    const cy = Math.floor(this.view.sprite.y);

    if (
      !Phaser.Math.Fuzzy.Equal(cx, this.model.turnPoint.x, this.model.threshold) ||
      !Phaser.Math.Fuzzy.Equal(cy, this.model.turnPoint.y, this.model.threshold)
    ) {
      return;
    }

    // Aligner sur la grille
    this.view.alignTo(this.model.turnPoint.x, this.model.turnPoint.y);

    // Effectuer le virage
    this.move(this.model.turningDirection);
    this.model.completeTurn(this.model.turningDirection);
  }

  /**
   * Déplace Pacman dans une direction
   * @param {number} direction - Direction Phaser
   */
  move(direction) {
    this.model.currentDirection = direction;
    this.view.move(direction);
  }

  /**
   * Tue Pacman
   */
  kill() {
    this.model.kill();
  }

  /**
   * Arrête Pacman (fin de niveau)
   */
  stop() {
    this.model.currentDirection = Phaser.NONE;
    this.model.turningDirection = Phaser.NONE;
    this.view.move(Phaser.NONE);
  }

  /**
   * Réinitialise Pacman
   */
  reset() {
    this.model.reset();
    this.view.reset(this.model.x, this.model.y);
    this.move(Phaser.LEFT);
  }

  /**
   * Retourne la position actuelle
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return this.model.getPosition();
  }

  /**
   * Retourne la direction actuelle
   * @returns {number}
   */
  getCurrentDirection() {
    return this.model.currentDirection;
  }

  /**
   * Vérifie si Pacman est mort
   * @returns {boolean}
   */
  isDead() {
    return this.model.isDead;
  }

  /**
   * Vérifie si l'animation de mort est terminée
   * @returns {boolean}
   */
  isDeathAnimationComplete() {
    return this.model.deathAnimationComplete;
  }

  /**
   * Retourne le sprite Phaser
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.view.getSprite();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.view.destroy();
  }
}
