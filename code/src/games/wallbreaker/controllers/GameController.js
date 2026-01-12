/**
 * GameController - Contrôleur principal du jeu Wallbreaker
 *
 * Orchestre tous les autres contrôleurs et gère le cycle de vie du jeu
 */

import GameStateModel, { GameState } from '../models/GameStateModel.js';
import PaddleModel from '../models/PaddleModel.js';
import BallModel from '../models/BallModel.js';
import BrickModel, { BrickCollection } from '../models/BrickModel.js';

import PaddleView from '../views/PaddleView.js';
import BallView from '../views/BallView.js';
import { BrickViewManager } from '../views/BrickView.js';
import HUDView from '../views/HUDView.js';

import PaddleController from './PaddleController.js';
import BallController from './BallController.js';
import InputController from './InputController.js';
import CollisionController from './CollisionController.js';
import PowerUpController from './PowerUpController.js';
import MultiBallManager from './MultiBallManager.js';

import {
  ASSETS_PATH,
  BRICK_CONFIG,
  PLAY_AREA,
  PADDLE_CONFIG,
  generateBrickLayout,
  getDifficultyParams
} from '../config/GameConfig.js';
import DOMExitConfirmDialog from '../../../core/DOMExitConfirmDialog.js';

export default class GameController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {Object} initialData - Données initiales (level, score, lives)
   */
  constructor(scene, initialData = {}) {
    this.scene = scene;
    this.initialData = initialData;

    // Modèles
    this.gameState = null;
    this.paddleModel = null;
    this.ballModel = null;
    this.brickCollection = null;

    // Vues
    this.paddleView = null;
    this.ballView = null;
    this.brickViewManager = null;
    this.hudView = null;

    // Contrôleurs
    this.paddleController = null;
    this.ballController = null;
    this.inputController = null;
    this.collisionController = null;
    this.powerUpController = null;
    this.multiBallManager = null;

    // État interne
    this.isInitialized = false;
    this.levelTransitionInProgress = false;

    // Dialogue de confirmation de sortie
    this.exitDialog = null;

    // État des power-ups
    this.originalBallSpeed = 0;
  }

  /**
   * Précharge tous les assets nécessaires
   */
  preload() {
    // Background
    this.scene.load.image('background', `${ASSETS_PATH}/background2.png`);

    // Assets seront préchargés par les vues
    // On crée les vues temporairement pour le preload
    this.paddleView = new PaddleView(this.scene, null);
    this.ballView = new BallView(this.scene, null);
    this.brickViewManager = new BrickViewManager(this.scene);
    this.hudView = new HUDView(this.scene);

    this.paddleView.preload();
    this.ballView.preload();
    this.brickViewManager.preload();
    this.hudView.preload();
  }

  /**
   * Initialise le jeu
   */
  initialize() {
    // Créer le modèle d'état du jeu
    this.gameState = new GameStateModel(this.initialData);
    this.setupGameStateCallbacks();

    // Créer les modèles
    this.createModels();

    // Créer les vues
    this.createViews();

    // Créer les contrôleurs
    this.createControllers();

    // Configurer le niveau initial
    this.setupLevel(this.gameState.level);

    // Initialiser le HUD
    this.hudView.updateAll(
      this.gameState.score,
      this.gameState.lives,
      this.gameState.level
    );

    // Afficher le message de départ
    this.hudView.showReadyMessage();

    this.isInitialized = true;
  }

  /**
   * Configure les callbacks de l'état du jeu
   */
  setupGameStateCallbacks() {
    // Callback de mise à jour du score
    this.gameState.setScoreUpdateCallback((score, lives, level) => {
      const onScoreUpdate = this.scene.game.registry.get('onScoreUpdate');
      if (onScoreUpdate) {
        onScoreUpdate(score, lives, level);
      }
      this.hudView?.updateAll(score, lives, level);
    });

    // Callback de game over
    this.gameState.setGameOverCallback((score) => {
      const onGameOver = this.scene.game.registry.get('onGameOver');
      if (onGameOver) {
        onGameOver(score);
      }
    });

    // Callback de niveau complété
    this.gameState.setLevelCompleteCallback((level, score) => {
      this.handleLevelComplete(level);
    });
  }

  /**
   * Crée les modèles
   */
  createModels() {
    this.paddleModel = new PaddleModel();
    this.ballModel = new BallModel({
      speed: this.gameState.getBallSpeed()
    });
    this.brickCollection = new BrickCollection();
  }

  /**
   * Crée les vues
   */
  createViews() {
    // Recréer les vues avec les modèles
    this.paddleView = new PaddleView(this.scene, this.paddleModel);
    this.ballView = new BallView(this.scene, this.ballModel);
    this.brickViewManager = new BrickViewManager(this.scene);
    this.hudView = new HUDView(this.scene);

    // Créer les éléments visuels
    this.paddleView.create();
    this.ballView.create();
    this.brickViewManager.create();
    this.hudView.create();
  }

  /**
   * Crée les contrôleurs
   */
  createControllers() {
    // Input Controller
    this.inputController = new InputController(this.scene);
    this.inputController.initialize();
    this.inputController.setEscapeCallback(() => this.handleEscape());
    this.inputController.setLaunchCallback(() => this.handleLaunch());

    // Paddle Controller
    this.paddleController = new PaddleController(
      this.paddleModel,
      this.paddleView,
      this.inputController
    );
    this.paddleController.initialize();

    // Ball Controller
    this.ballController = new BallController(
      this.ballModel,
      this.ballView,
      this.scene
    );
    this.ballController.initialize();
    this.ballController.setBallLostCallback(() => this.handleBallLost());

    // Collision Controller
    this.collisionController = new CollisionController(
      this.scene,
      this.ballController,
      this.paddleController,
      this.brickViewManager
    );
    this.collisionController.initialize();
    this.collisionController.setBrickHitCallback((brick, result) => {
      this.handleBrickHit(brick, result);
    });
    this.collisionController.setBrickDestroyedCallback((brick) => {
      this.handleBrickDestroyed(brick);
    });

    // Power-Up Controller
    this.powerUpController = new PowerUpController(this.scene, this.paddleController);
    this.powerUpController.initialize();
    this.setupPowerUpCallbacks();

    // Multi-Ball Manager
    this.multiBallManager = new MultiBallManager(this.scene, this.ballController);
    this.multiBallManager.initialize();
    this.multiBallManager.setAllBallsLostCallback(() => this.handleAllBallsLost());

    // Placer la balle sur le paddle
    this.ballController.attachToPaddle(
      this.paddleModel.x,
      this.paddleModel.y
    );

    // Sauvegarder la vitesse originale
    this.originalBallSpeed = this.gameState.getBallSpeed();

    // Dialogue de confirmation de sortie (DOM)
    this.exitDialog = new DOMExitConfirmDialog({
      onConfirm: () => this.confirmExit(),
      onCancel: () => this.cancelExit(),
      onShow: () => this.pauseGame(),
      onHide: () => this.resumeGame(),
      message: 'Quitter la partie ?',
      subMessage: 'Ta progression ne sera pas sauvegardee'
    });
  }

  /**
   * Configure les callbacks du PowerUpController
   */
  setupPowerUpCallbacks() {
    // Multi-balle
    this.powerUpController.setMultiBallCallback((count) => {
      this.spawnExtraBalls(count);
    });

    // Vie supplémentaire
    this.powerUpController.setExtraLifeCallback(() => {
      this.gameState.addLife();
      this.hudView.updateLives(this.gameState.lives);
    });

    // Destruction aléatoire de briques
    this.powerUpController.setRandomDestroyCallback((count) => {
      this.destroyRandomBricks(count);
    });

    // Activation/désactivation d'effets
    this.powerUpController.setEffectActivatedCallback((effectId, duration) => {
      this.handleEffectActivated(effectId, duration);
    });

    this.powerUpController.setEffectExpiredCallback((effectId) => {
      this.handleEffectExpired(effectId);
    });

    // Collecte de power-up (pour le HUD)
    this.powerUpController.setPowerUpCollectedCallback((type) => {
      this.hudView.showPowerUpMessage(type.name);
    });
  }

  /**
   * Configure un niveau
   * @param {number} level - Numéro du niveau
   */
  setupLevel(level) {
    // Effacer les briques existantes
    this.brickCollection.clear();
    this.brickViewManager.clear();

    // Générer le layout des briques
    const layout = generateBrickLayout(level);
    let totalBricks = 0;
    let destructibleBricks = 0;

    // Créer les briques
    layout.forEach((row, rowIndex) => {
      row.forEach((brickData, colIndex) => {
        const brickModel = new BrickModel({
          x: brickData.x,
          y: brickData.y,
          width: BRICK_CONFIG.width,
          height: BRICK_CONFIG.height,
          type: brickData.type,
          row: rowIndex,
          col: colIndex
        });

        this.brickCollection.add(brickModel);
        this.brickViewManager.addBrick(brickModel);

        totalBricks++;
        if (!brickModel.isIndestructible) {
          destructibleBricks++;
        }
      });
    });

    // Mettre à jour l'état du jeu
    this.gameState.setBrickCounts(totalBricks, destructibleBricks);

    // Mettre à jour les vitesses selon le niveau
    const params = getDifficultyParams(level);
    this.ballModel.setSpeed(params.ballSpeed);
    this.paddleController.setSpeed(params.paddleSpeed);

    // Reconfigurer les collisions
    this.collisionController.reconfigure();
  }

  /**
   * Boucle de mise à jour principale
   */
  update() {
    // Bloquer les inputs si le dialogue de confirmation est visible
    if (this.exitDialog?.isShowing()) {
      return;
    }

    if (!this.isInitialized || this.levelTransitionInProgress) return;

    const delta = this.scene.game.loop.delta;

    // Mettre à jour l'InputController (boutons manette)
    this.inputController.update();

    // Vérifier le lancement
    if (this.gameState.isBallOnPaddle() && this.inputController.isLaunchPressed()) {
      this.handleLaunch();
    }

    // Mettre à jour le paddle
    this.paddleController.update(delta);

    // Si la balle est sur le paddle, la faire suivre
    if (this.gameState.isBallOnPaddle()) {
      this.ballController.followPaddle(
        this.paddleModel.x,
        this.paddleModel.y
      );
    } else {
      // Mettre à jour la balle principale
      this.ballController.update(delta);

      // Mettre à jour les balles supplémentaires
      if (this.multiBallManager) {
        this.multiBallManager.update(delta);
      }
    }

    // Mettre à jour les power-ups
    if (this.powerUpController) {
      this.powerUpController.update(delta);
    }

    // Mettre à jour l'affichage des effets actifs
    this.updateActiveEffectsDisplay();
  }

  /**
   * Met à jour l'affichage des effets actifs dans le HUD
   */
  updateActiveEffectsDisplay() {
    if (this.powerUpController && this.hudView) {
      const effects = this.powerUpController.getActiveEffects();
      this.hudView.updateActiveEffects(effects);
    }
  }

  /**
   * Gère le lancement de la balle
   */
  handleLaunch() {
    if (!this.gameState.isBallOnPaddle()) return;
    if (this.levelTransitionInProgress) return;

    // Cacher le message
    this.hudView.hideMessage();

    // Lancer la balle
    this.gameState.launchBall();
    this.ballController.launch(this.gameState.getBallSpeed());
  }

  /**
   * Gère la perte de la balle principale
   */
  handleBallLost() {
    // Vérifier s'il reste des balles supplémentaires
    if (this.multiBallManager && this.multiBallManager.getActiveBallCount() > 0) {
      // Il reste des balles, pas de perte de vie
      return;
    }

    const isGameOver = this.gameState.loseLife();

    if (isGameOver) {
      this.handleGameOver();
    } else {
      // Réinitialiser pour la prochaine tentative
      this.resetAfterLifeLost();
    }
  }

  /**
   * Gère la perte de toutes les balles
   */
  handleAllBallsLost() {
    // Toutes les balles supplémentaires sont perdues
    // Vérifier si la balle principale est aussi perdue
    if (!this.ballController.isActive()) {
      this.handleBallLost();
    }
  }

  /**
   * Réinitialise après une vie perdue
   */
  resetAfterLifeLost() {
    // Réinitialiser le paddle
    this.paddleController.reset();

    // Nettoyer les balles supplémentaires
    if (this.multiBallManager) {
      this.multiBallManager.reset();
    }
    if (this.collisionController) {
      this.collisionController.clearExtraBalls();
    }

    // Replacer la balle sur le paddle
    this.ballController.attachToPaddle(
      this.paddleModel.x,
      this.paddleModel.y
    );

    // Afficher le message
    this.hudView.showReadyMessage();
  }

  /**
   * Gère le hit d'une brique
   * @param {BrickModel} brick
   * @param {Object} result
   */
  handleBrickHit(brick, result) {
    // Appliquer le multiplicateur de score si actif
    const multiplier = this.powerUpController?.getScoreMultiplier() || 1;
    const points = Math.round(result.points * multiplier);

    if (result.destroyed) {
      this.gameState.destroyBrick(points);
      this.brickCollection.markDestroyed(brick);
    } else {
      this.gameState.damageBrick(points);
    }
  }

  /**
   * Gère la destruction d'une brique (pour spawn power-up)
   * @param {BrickModel} brick
   */
  handleBrickDestroyed(brick) {
    // Spawn un power-up à la position de la brique
    if (this.powerUpController) {
      this.powerUpController.spawnPowerUp(brick.x, brick.y);
    }
  }

  /**
   * Fait apparaître des balles supplémentaires
   * @param {number} count
   */
  spawnExtraBalls(count) {
    if (!this.multiBallManager) return;

    // Créer les balles supplémentaires
    for (let i = 0; i < count; i++) {
      const primaryModel = this.ballController.getModel();
      const model = new BallModel({
        x: primaryModel.x,
        y: primaryModel.y,
        speed: primaryModel.currentSpeed
      });

      const view = new BallView(this.scene, model);
      view.create();

      const controller = new BallController(model, view, this.scene);
      controller.initialize();

      // Angle différent pour chaque balle
      const angleOffset = ((i + 1) * 40 - 20) * (Math.PI / 180);
      const baseAngle = Math.atan2(primaryModel.velocityY, primaryModel.velocityX);
      model.launch(baseAngle + angleOffset);

      const sprite = view.getSprite();
      if (sprite) {
        sprite.body.velocity.x = model.velocityX;
        sprite.body.velocity.y = model.velocityY;
      }

      // Configurer le callback de perte
      controller.setBallLostCallback(() => {
        this.collisionController.removeExtraBall(controller);
        controller.destroy();
      });

      // Ajouter aux collisions
      this.collisionController.addExtraBall(controller);
    }
  }

  /**
   * Détruit des briques aléatoires
   * @param {number} count
   */
  destroyRandomBricks(count) {
    const activeBricks = this.brickCollection.getActive()
      .filter(b => !b.isIndestructible);

    const toDestroy = [];
    const shuffled = [...activeBricks].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      toDestroy.push(shuffled[i]);
    }

    toDestroy.forEach(brick => {
      // Forcer la destruction
      while (!brick.isDestroyed) {
        brick.hit();
      }

      // Jouer l'effet visuel
      const view = this.brickViewManager.findByModel(brick);
      if (view) {
        view.playDestroyEffect();
      }

      // Mettre à jour le score et l'état
      this.gameState.destroyBrick(brick.type.score);
      this.brickCollection.markDestroyed(brick);
    });
  }

  /**
   * Gère l'activation d'un effet
   * @param {string} effectId
   * @param {number} duration
   */
  handleEffectActivated(effectId, duration) {
    switch (effectId) {
      case 'destroyer':
        this.collisionController.setDestroyerMode(true);
        break;

      case 'ball_speed':
        // Appliquer le modificateur de vitesse
        const speedMultiplier = this.powerUpController.getBallSpeedMultiplier();
        const newSpeed = this.originalBallSpeed * speedMultiplier;
        this.ballModel.setSpeed(newSpeed);
        // Synchroniser avec le sprite
        const sprite = this.ballController.getSprite();
        if (sprite && sprite.body) {
          const currentMagnitude = Math.sqrt(
            sprite.body.velocity.x ** 2 + sprite.body.velocity.y ** 2
          );
          if (currentMagnitude > 0) {
            const ratio = newSpeed / currentMagnitude;
            sprite.body.velocity.x *= ratio;
            sprite.body.velocity.y *= ratio;
          }
        }
        break;
    }
  }

  /**
   * Gère l'expiration d'un effet
   * @param {string} effectId
   */
  handleEffectExpired(effectId) {
    switch (effectId) {
      case 'destroyer':
        this.collisionController.setDestroyerMode(false);
        break;

      case 'ball_speed':
        // Restaurer la vitesse normale
        this.ballModel.setSpeed(this.originalBallSpeed);
        const sprite = this.ballController.getSprite();
        if (sprite && sprite.body) {
          const currentMagnitude = Math.sqrt(
            sprite.body.velocity.x ** 2 + sprite.body.velocity.y ** 2
          );
          if (currentMagnitude > 0) {
            const ratio = this.originalBallSpeed / currentMagnitude;
            sprite.body.velocity.x *= ratio;
            sprite.body.velocity.y *= ratio;
          }
        }
        break;
    }
  }

  /**
   * Gère la complétion d'un niveau
   * @param {number} level
   */
  handleLevelComplete(level) {
    this.levelTransitionInProgress = true;

    // Afficher le message de niveau complété
    this.hudView.showLevelCompleteMessage(level);

    // Attendre puis passer au niveau suivant
    this.scene.time.delayedCall(2000, () => {
      this.startNextLevel();
    });
  }

  /**
   * Démarre le niveau suivant
   */
  startNextLevel() {
    // Passer au niveau suivant
    this.gameState.advanceLevel();

    // Configurer le nouveau niveau
    this.setupLevel(this.gameState.level);

    // Réinitialiser le paddle et la balle
    this.paddleController.reset();
    this.ballController.attachToPaddle(
      this.paddleModel.x,
      this.paddleModel.y
    );

    // Nettoyer les power-ups en cours de chute (mais garder les effets actifs)
    if (this.powerUpController) {
      this.powerUpController.resetForNewLevel();
    }

    // Nettoyer les balles supplémentaires
    if (this.multiBallManager) {
      this.multiBallManager.reset();
    }
    if (this.collisionController) {
      this.collisionController.clearExtraBalls();
    }

    // Mettre à jour la vitesse originale pour le nouveau niveau
    this.originalBallSpeed = this.gameState.getBallSpeed();

    // Afficher le message du nouveau niveau
    this.hudView.showNewLevelMessage(this.gameState.level);

    this.levelTransitionInProgress = false;
  }

  /**
   * Gère le game over
   */
  handleGameOver() {
    // Libérer le pointer lock
    if (this.inputController) {
      this.inputController.exitPointerLock();
    }

    this.hudView.showGameOverMessage(this.gameState.score);

    // Attendre puis passer à la scène de game over
    this.scene.time.delayedCall(2000, () => {
      this.scene.scene.start('GameOverScene', {
        score: this.gameState.score,
        level: this.gameState.level
      });
    });
  }

  /**
   * Gère l'appui sur Escape - affiche le dialogue de confirmation
   */
  handleEscape() {
    // Ne pas afficher si déjà visible
    if (this.exitDialog?.isShowing()) return;

    // Afficher le dialogue de confirmation
    this.exitDialog?.show();
  }

  /**
   * Confirme la sortie du jeu
   */
  confirmExit() {
    // La destruction du jeu est gérée par ArcadeStore.backToMenu()
    window.Alpine?.store('arcade')?.backToMenu();
  }

  /**
   * Annule la sortie du jeu
   */
  cancelExit() {
    // Le dialogue se ferme automatiquement, rien d'autre à faire
  }

  /**
   * Met le jeu en pause (freeze tous les éléments)
   */
  pauseGame() {
    // Libérer le pointer lock pour pouvoir interagir avec le dialogue
    if (this.inputController) {
      this.inputController.exitPointerLock();
    }

    // Mettre en pause la physique
    this.scene.physics.world.pause();

    // Mettre en pause les timers
    this.scene.time.paused = true;

    // Mettre en pause les tweens
    this.scene.tweens.pauseAll();

    // Mettre en pause les animations
    this.scene.anims.pauseAll();
  }

  /**
   * Reprend le jeu après une pause
   */
  resumeGame() {
    // Reprendre la physique
    this.scene.physics.world.resume();

    // Reprendre les timers
    this.scene.time.paused = false;

    // Reprendre les tweens
    this.scene.tweens.resumeAll();

    // Reprendre les animations
    this.scene.anims.resumeAll();
  }

  /**
   * Détruit le contrôleur et nettoie les ressources
   */
  destroy() {
    if (this.inputController) this.inputController.destroy();
    if (this.paddleController) this.paddleController.destroy();
    if (this.ballController) this.ballController.destroy();
    if (this.collisionController) this.collisionController.destroy();
    if (this.powerUpController) this.powerUpController.destroy();
    if (this.multiBallManager) this.multiBallManager.destroy();
    if (this.brickViewManager) this.brickViewManager.destroy();
    if (this.hudView) this.hudView.destroy();
    if (this.exitDialog) this.exitDialog.destroy();
  }
}
