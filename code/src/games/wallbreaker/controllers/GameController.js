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

import {
  ASSETS_PATH,
  BRICK_CONFIG,
  PLAY_AREA,
  generateBrickLayout,
  getDifficultyParams
} from '../config/GameConfig.js';

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

    // État interne
    this.isInitialized = false;
    this.levelTransitionInProgress = false;
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

    // Placer la balle sur le paddle
    this.ballController.attachToPaddle(
      this.paddleModel.x,
      this.paddleModel.y
    );
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
    if (!this.isInitialized || this.levelTransitionInProgress) return;

    const delta = this.scene.game.loop.delta;

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
      // Mettre à jour la balle
      this.ballController.update(delta);
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
   * Gère la perte de la balle
   */
  handleBallLost() {
    const isGameOver = this.gameState.loseLife();

    if (isGameOver) {
      this.handleGameOver();
    } else {
      // Réinitialiser pour la prochaine tentative
      this.resetAfterLifeLost();
    }
  }

  /**
   * Réinitialise après une vie perdue
   */
  resetAfterLifeLost() {
    // Réinitialiser le paddle
    this.paddleController.reset();

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
    if (result.destroyed) {
      this.gameState.destroyBrick(result.points);
      this.brickCollection.markDestroyed(brick);
    } else {
      this.gameState.damageBrick(result.points);
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

    // Afficher le message du nouveau niveau
    this.hudView.showNewLevelMessage(this.gameState.level);

    this.levelTransitionInProgress = false;
  }

  /**
   * Gère le game over
   */
  handleGameOver() {
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
   * Gère l'appui sur Escape
   */
  handleEscape() {
    // Retourner au menu principal
    window.Alpine?.store('arcade')?.backToMenu();
    this.scene.scene.stop();
    this.scene.game.destroy(true);
  }

  /**
   * Détruit le contrôleur et nettoie les ressources
   */
  destroy() {
    if (this.inputController) this.inputController.destroy();
    if (this.paddleController) this.paddleController.destroy();
    if (this.ballController) this.ballController.destroy();
    if (this.collisionController) this.collisionController.destroy();
    if (this.brickViewManager) this.brickViewManager.destroy();
    if (this.hudView) this.hudView.destroy();
  }
}
