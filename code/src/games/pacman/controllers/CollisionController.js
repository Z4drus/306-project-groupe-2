/**
 * CollisionController - Contrôleur des collisions
 *
 * Gère toutes les collisions du jeu (dots, pills, fantômes)
 */

import { GhostMode } from '../models/GhostModel.js';

export default class CollisionController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;

    // Références (seront définies par GameController)
    this.pacmanController = null;
    this.ghostControllers = [];
    this.gameState = null;
    this.layer = null;
    this.dots = null;
    this.pills = null;

    // Callbacks
    this.onDotEaten = null;
    this.onPillEaten = null;
    this.onGhostEaten = null;
    this.onPacmanKilled = null;
  }

  /**
   * Initialise les références
   */
  initialize(pacmanController, ghostControllers, gameState, layer, dots, pills) {
    this.pacmanController = pacmanController;
    this.ghostControllers = ghostControllers;
    this.gameState = gameState;
    this.layer = layer;
    this.dots = dots;
    this.pills = pills;
  }

  /**
   * Configure les collisions Phaser
   */
  setupCollisions() {
    const physics = this.scene.physics;
    const pacmanSprite = this.pacmanController.getSprite();

    // Collision avec les murs
    physics.add.collider(pacmanSprite, this.layer);

    // Collision avec les dots
    physics.add.overlap(
      pacmanSprite,
      this.dots,
      this.handleDotCollision,
      null,
      this
    );

    // Collision avec les pills
    physics.add.overlap(
      pacmanSprite,
      this.pills,
      this.handlePillCollision,
      null,
      this
    );

    // Collision avec les fantômes
    this.ghostControllers.forEach(ghostController => {
      physics.add.overlap(
        pacmanSprite,
        ghostController.getSprite(),
        this.handleGhostCollision,
        null,
        this
      );
    });
  }

  /**
   * Reconfigure les collisions après respawn de Pacman
   */
  reconfigureCollisions() {
    const physics = this.scene.physics;
    const pacmanSprite = this.pacmanController.getSprite();

    // Collision avec les murs
    physics.add.collider(pacmanSprite, this.layer);

    // Collision avec les dots restants
    physics.add.overlap(
      pacmanSprite,
      this.dots,
      this.handleDotCollision,
      null,
      this
    );

    // Collision avec les pills restantes
    physics.add.overlap(
      pacmanSprite,
      this.pills,
      this.handlePillCollision,
      null,
      this
    );

    // Collision avec les fantômes
    this.ghostControllers.forEach(ghostController => {
      physics.add.overlap(
        pacmanSprite,
        ghostController.getSprite(),
        this.handleGhostCollision,
        null,
        this
      );
    });
  }

  /**
   * Gère la collision avec un dot
   * @param {Phaser.Physics.Arcade.Sprite} pacmanSprite
   * @param {Phaser.Physics.Arcade.Sprite} dot
   */
  handleDotCollision(pacmanSprite, dot) {
    dot.destroy();
    this.gameState.eatDot();

    if (this.onDotEaten) {
      this.onDotEaten();
    }
  }

  /**
   * Gère la collision avec une pill
   * @param {Phaser.Physics.Arcade.Sprite} pacmanSprite
   * @param {Phaser.Physics.Arcade.Sprite} pill
   */
  handlePillCollision(pacmanSprite, pill) {
    pill.destroy();
    this.gameState.eatPill();

    if (this.onPillEaten) {
      this.onPillEaten();
    }
  }

  /**
   * Gère la collision avec un fantôme
   * @param {Phaser.Physics.Arcade.Sprite} pacmanSprite
   * @param {Phaser.Physics.Arcade.Sprite} ghostSprite
   */
  handleGhostCollision(pacmanSprite, ghostSprite) {
    const ghostController = this.ghostControllers.find(
      gc => gc.getSprite() === ghostSprite
    );

    if (!ghostController) return;

    const ghostMode = ghostController.getMode();

    if (this.gameState.isPaused && ghostMode === GhostMode.FRIGHTENED) {
      // Pacman mange le fantôme
      ghostController.eaten();
      this.gameState.eatGhost();

      if (this.onGhostEaten) {
        this.onGhostEaten(ghostController);
      }
    } else if (ghostMode !== GhostMode.RETURNING) {
      // Le fantôme tue Pacman
      if (this.onPacmanKilled) {
        this.onPacmanKilled();
      }
    }
  }

  /**
   * Définit les callbacks
   */
  setCallbacks(callbacks) {
    this.onDotEaten = callbacks.onDotEaten;
    this.onPillEaten = callbacks.onPillEaten;
    this.onGhostEaten = callbacks.onGhostEaten;
    this.onPacmanKilled = callbacks.onPacmanKilled;
  }
}
