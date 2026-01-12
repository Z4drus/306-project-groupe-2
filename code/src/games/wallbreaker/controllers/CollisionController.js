/**
 * CollisionController - Contrôleur des collisions
 *
 * Gère toutes les collisions du jeu Wallbreaker
 */

export default class CollisionController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {BallController} ballController - Contrôleur de la balle
   * @param {PaddleController} paddleController - Contrôleur du paddle
   * @param {BrickViewManager} brickViewManager - Gestionnaire des vues de briques
   */
  constructor(scene, ballController, paddleController, brickViewManager) {
    this.scene = scene;
    this.ballController = ballController;
    this.paddleController = paddleController;
    this.brickViewManager = brickViewManager;

    // Balles supplémentaires (multi-ball)
    this.extraBallControllers = [];

    // Callbacks
    this.onBrickHit = null;
    this.onPaddleHit = null;
    this.onBrickDestroyed = null;

    // Mode destructeur (one-hit kill)
    this.destroyerMode = false;
  }

  /**
   * Initialise les collisions
   */
  initialize() {
    this.setupPaddleCollision();
    this.setupBrickCollisions();
  }

  /**
   * Configure la collision balle-paddle
   */
  setupPaddleCollision() {
    const ballSprite = this.ballController.getSprite();
    const paddleSprite = this.paddleController.getSprite();

    if (!ballSprite || !paddleSprite) return;

    this.scene.physics.add.collider(
      ballSprite,
      paddleSprite,
      this.handlePaddleCollision,
      null,
      this
    );
  }

  /**
   * Configure les collisions balle-briques
   */
  setupBrickCollisions() {
    const ballSprite = this.ballController.getSprite();
    const brickGroup = this.brickViewManager.getGroup();

    if (!ballSprite || !brickGroup) return;

    this.scene.physics.add.collider(
      ballSprite,
      brickGroup,
      this.handleBrickCollision,
      null,
      this
    );
  }

  /**
   * Gère la collision avec le paddle
   * @param {Phaser.Physics.Arcade.Sprite} ballSprite
   * @param {Phaser.Physics.Arcade.Sprite} paddleSprite
   */
  handlePaddleCollision(ballSprite, paddleSprite) {
    const paddleModel = this.paddleController.getModel();
    const ballModel = this.ballController.getModel();

    // Calculer le rebond basé sur la position d'impact
    this.ballController.bounceOffPaddle(
      paddleModel.x,
      paddleModel.width
    );

    // Effet visuel
    this.paddleController.playHitEffect();

    // Callback
    if (this.onPaddleHit) {
      this.onPaddleHit();
    }
  }

  /**
   * Gère la collision avec une brique
   * @param {Phaser.Physics.Arcade.Sprite} ballSprite
   * @param {Phaser.Physics.Arcade.Sprite} brickSprite
   */
  handleBrickCollision(ballSprite, brickSprite) {
    const brickModel = brickSprite.getData('brickModel');
    const brickView = brickSprite.getData('brickView');

    if (!brickModel || brickModel.isDestroyed) return;

    // Trouver le bon contrôleur de balle pour les effets visuels
    const ballController = this.findBallController(ballSprite);
    if (ballController) {
      ballController.view.playBounceEffect();
      ballController.view.syncFromPhysics();
    }

    // Mode destructeur : détruit en un coup (sauf indestructibles)
    let result;
    if (this.destroyerMode && !brickModel.isIndestructible) {
      // Forcer la destruction
      while (!brickModel.isDestroyed) {
        result = brickModel.hit();
      }
    } else {
      // Infliger des dégâts normaux
      result = brickModel.hit();
    }

    if (result.destroyed) {
      // Brique détruite
      brickView.playDestroyEffect(() => {
        // La brique est retirée automatiquement du groupe
      });

      // Callback de destruction (pour spawn power-up)
      if (this.onBrickDestroyed) {
        this.onBrickDestroyed(brickModel);
      }
    } else if (result.hitsRemaining > 0) {
      // Brique endommagée mais pas détruite
      brickView.playHitEffect();
      brickView.updateTint();
    }

    // Callback avec les points
    if (this.onBrickHit) {
      this.onBrickHit(brickModel, result);
    }
  }

  /**
   * Trouve le contrôleur de balle associé à un sprite
   * @param {Phaser.Physics.Arcade.Sprite} ballSprite
   * @returns {BallController|null}
   */
  findBallController(ballSprite) {
    // Vérifier la balle principale
    if (this.ballController.getSprite() === ballSprite) {
      return this.ballController;
    }
    // Vérifier les balles supplémentaires
    for (const controller of this.extraBallControllers) {
      if (controller.getSprite() === ballSprite) {
        return controller;
      }
    }
    return this.ballController; // Fallback
  }

  /**
   * Détermine de quel côté la balle a touché la brique
   * @param {Phaser.Physics.Arcade.Sprite} ballSprite
   * @param {Phaser.Physics.Arcade.Sprite} brickSprite
   * @returns {string} 'top', 'bottom', 'left', ou 'right'
   */
  determineBrickCollisionSide(ballSprite, brickSprite) {
    const ball = ballSprite.body;
    const brick = brickSprite.body;

    // Calculer les overlaps
    const overlapLeft = (ball.right) - brick.left;
    const overlapRight = brick.right - (ball.left);
    const overlapTop = (ball.bottom) - brick.top;
    const overlapBottom = brick.bottom - (ball.top);

    // Trouver le plus petit overlap
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) return 'left';
    if (minOverlap === overlapRight) return 'right';
    if (minOverlap === overlapTop) return 'top';
    return 'bottom';
  }

  /**
   * Définit le callback de hit de brique
   * @param {Function} callback - callback(brickModel, result)
   */
  setBrickHitCallback(callback) {
    this.onBrickHit = callback;
  }

  /**
   * Définit le callback de hit du paddle
   * @param {Function} callback
   */
  setPaddleHitCallback(callback) {
    this.onPaddleHit = callback;
  }

  /**
   * Définit le callback de destruction de brique
   * @param {Function} callback - callback(brickModel)
   */
  setBrickDestroyedCallback(callback) {
    this.onBrickDestroyed = callback;
  }

  /**
   * Active/désactive le mode destructeur
   * @param {boolean} enabled
   */
  setDestroyerMode(enabled) {
    this.destroyerMode = enabled;
  }

  /**
   * Ajoute une balle supplémentaire pour les collisions
   * @param {BallController} ballController
   */
  addExtraBall(ballController) {
    this.extraBallControllers.push(ballController);

    // Configurer les collisions pour cette balle
    const ballSprite = ballController.getSprite();
    const paddleSprite = this.paddleController.getSprite();
    const brickGroup = this.brickViewManager.getGroup();

    if (ballSprite && paddleSprite) {
      this.scene.physics.add.collider(
        ballSprite,
        paddleSprite,
        this.handlePaddleCollision,
        null,
        this
      );
    }

    if (ballSprite && brickGroup) {
      this.scene.physics.add.collider(
        ballSprite,
        brickGroup,
        this.handleBrickCollision,
        null,
        this
      );
    }
  }

  /**
   * Retire une balle supplémentaire
   * @param {BallController} ballController
   */
  removeExtraBall(ballController) {
    const index = this.extraBallControllers.indexOf(ballController);
    if (index !== -1) {
      this.extraBallControllers.splice(index, 1);
    }
  }

  /**
   * Vide la liste des balles supplémentaires
   */
  clearExtraBalls() {
    this.extraBallControllers = [];
  }

  /**
   * Reconfigure les collisions (après changement de niveau)
   */
  reconfigure() {
    this.setupBrickCollisions();
    // Reconfigurer aussi les balles supplémentaires
    this.extraBallControllers.forEach(controller => {
      const ballSprite = controller.getSprite();
      const brickGroup = this.brickViewManager.getGroup();
      if (ballSprite && brickGroup) {
        this.scene.physics.add.collider(
          ballSprite,
          brickGroup,
          this.handleBrickCollision,
          null,
          this
        );
      }
    });
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.extraBallControllers = [];
    // Les colliders sont automatiquement nettoyés avec la scène
  }
}
