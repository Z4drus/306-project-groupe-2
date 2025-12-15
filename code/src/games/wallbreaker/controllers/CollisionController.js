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

    // Callbacks
    this.onBrickHit = null;
    this.onPaddleHit = null;
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

    // Laisser Phaser gérer le rebond naturellement (bounce: 1 sur la balle)
    // On ne fait que jouer l'effet visuel
    this.ballController.view.playBounceEffect();

    // Synchroniser le modèle avec la physique Phaser
    this.ballController.view.syncFromPhysics();

    // Infliger des dégâts à la brique
    const result = brickModel.hit();

    if (result.destroyed) {
      // Brique détruite
      brickView.playDestroyEffect(() => {
        // La brique est retirée automatiquement du groupe
      });
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
   * Reconfigure les collisions (après changement de niveau)
   */
  reconfigure() {
    this.setupBrickCollisions();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    // Les colliders sont automatiquement nettoyés avec la scène
  }
}
