/**
 * GameController - Contrôleur principal du jeu Santa Cruz Runner
 *
 * Orchestre tous les autres contrôleurs et gère le cycle de vie du jeu
 */

import GameStateModel, { GameState } from '../models/GameStateModel.js';
import PlayerModel from '../models/PlayerModel.js';

import PlayerView from '../views/PlayerView.js';
import BackgroundView from '../views/BackgroundView.js';
import HUDView from '../views/HUDView.js';

import PlayerController from './PlayerController.js';
import PlatformController from './PlatformController.js';
import CollectibleController from './CollectibleController.js';
import InputController from './InputController.js';
import CollisionController from './CollisionController.js';

import { ASSETS_PATH, getDifficultyParams } from '../config/GameConfig.js';
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
    this.playerModel = null;

    // Vues
    this.playerView = null;
    this.backgroundView = null;
    this.hudView = null;

    // Contrôleurs
    this.playerController = null;
    this.platformController = null;
    this.collectibleController = null;
    this.inputController = null;
    this.collisionController = null;

    // Audio
    this.music = null;

    // État interne
    this.isInitialized = false;
    this.totalDistance = 0;

    // Dialogue de confirmation de sortie
    this.exitDialog = null;
  }

  /**
   * Précharge tous les assets nécessaires
   */
  preload() {
    // Background
    this.backgroundView = new BackgroundView(this.scene);
    this.backgroundView.preload();

    // Player
    this.playerModel = new PlayerModel();
    this.playerView = new PlayerView(this.scene, this.playerModel);
    this.playerView.preload();

    // Platforms
    this.platformController = new PlatformController(this.scene, this.initialData.level || 1);
    this.platformController.preload();

    // HUD
    this.hudView = new HUDView(this.scene);
    this.hudView.preload();
  }

  /**
   * Initialise le jeu
   */
  initialize() {
    // Créer le modèle d'état du jeu
    this.gameState = new GameStateModel(this.initialData);
    this.setupGameStateCallbacks();

    // Créer le fond
    this.backgroundView.create();

    // Créer les plateformes
    this.platformController.initialize();

    // Créer le joueur
    this.playerView.create();

    // Créer le contrôleur de collectibles
    this.collectibleController = new CollectibleController(
      this.scene,
      this.gameState.level
    );
    this.collectibleController.initialize();

    // Créer les contrôleurs
    this.createControllers();

    // Créer le HUD
    this.hudView.create();
    this.hudView.updateAll(
      this.gameState.score,
      this.gameState.lives,
      this.gameState.level
    );

    // Afficher le message de départ
    this.hudView.showReadyMessage();

    // Démarrer la musique
    this.startMusic();

    // Dialogue de confirmation de sortie
    this.exitDialog = new DOMExitConfirmDialog({
      onConfirm: () => this.confirmExit(),
      onCancel: () => this.cancelExit(),
      onShow: () => this.pauseGame(),
      onHide: () => this.resumeGame(),
      message: 'Quitter la partie ?',
      subMessage: 'Ta progression ne sera pas sauvegardee'
    });

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

    // Callback de level up
    this.gameState.setLevelUpCallback((level) => {
      this.handleLevelUp(level);
    });
  }

  /**
   * Crée les contrôleurs
   */
  createControllers() {
    // Input Controller
    this.inputController = new InputController(this.scene);
    this.inputController.initialize();
    this.inputController.setEscapeCallback(() => this.handleEscape());

    // Player Controller
    this.playerController = new PlayerController(
      this.playerModel,
      this.playerView,
      this.scene
    );
    this.playerController.initialize();
    this.playerController.setDeathCallback(() => this.handlePlayerDeath());

    // Collision Controller
    this.collisionController = new CollisionController(
      this.scene,
      this.playerController,
      this.platformController,
      this.collectibleController
    );
    this.collisionController.initialize();
    this.collisionController.setCollectItemCallback((result) => {
      this.handleCollectItem(result);
    });
    this.collisionController.setLandOnPlatformCallback((platform) => {
      this.handleLandOnPlatform(platform);
    });
  }

  /**
   * Démarre la musique
   */
  startMusic() {
    try {
      this.music = this.scene.sound.add('music', {
        volume: 0.3,
        loop: true
      });
      this.music.play();
    } catch (e) {
      // Ignorer les erreurs audio
    }
  }

  /**
   * Boucle de mise à jour principale
   * @param {number} time - Temps total écoulé
   * @param {number} delta - Delta time en ms
   */
  update(time, delta) {
    // Bloquer si dialogue affiché
    if (this.exitDialog?.isShowing()) {
      return;
    }

    if (!this.isInitialized) return;

    // Mettre à jour les inputs
    this.inputController.update();

    // Si le jeu n'est pas encore démarré
    if (this.gameState.isReady()) {
      if (this.inputController.isStartPressed()) {
        this.startGame();
      }
      return;
    }

    // Si game over, ne rien faire
    if (this.gameState.isGameOver()) return;

    // Vérifier le saut
    if (this.inputController.isJumpJustPressed()) {
      this.playerController.jump();
    }

    // Mettre à jour le joueur
    this.playerController.update(delta);

    // Mettre à jour les plateformes et calculer la distance parcourue
    const distanceMoved = this.platformController.update(delta);

    // Mettre à jour les collectibles
    this.collectibleController.update(delta, time);

    // Essayer de spawner des collectibles sur les nouvelles plateformes
    this.spawnCollectiblesOnNewPlatforms();

    // Mettre à jour les collisions
    this.collisionController.update(delta);

    // Mettre à jour la distance dans le game state
    if (distanceMoved) {
      this.gameState.updateDistance(distanceMoved);
    }

    // Mettre à jour le fond
    this.backgroundView.update(this.gameState.getScrollSpeed(), delta);
  }

  /**
   * Démarre le jeu
   */
  startGame() {
    this.gameState.start();
    this.hudView.hideMessage();

    // Réactiver la gravité du joueur
    this.playerController.enableGravity();

    // S'assurer que le défilement est actif
    this.platformController.resume();
    this.collectibleController.resume();

    // Intensité de neige normale au démarrage
    this.backgroundView.setSnowIntensity(1.0);
  }

  /**
   * Gère la mort du joueur
   */
  handlePlayerDeath() {
    // Stopper immédiatement le défilement
    this.platformController.stop();
    this.collectibleController.stop();

    const isGameOver = this.gameState.loseLife();

    if (isGameOver) {
      this.handleGameOver();
    } else {
      // Réinitialiser le joueur après un court délai
      this.scene.time.delayedCall(600, () => {
        this.resetAfterDeath();
      });
    }
  }

  /**
   * Réinitialise après une mort
   */
  resetAfterDeath() {
    // Calculer la meilleure position de respawn
    const respawnPosition = this.collisionController.getRespawnPosition(
      this.playerModel.height
    );

    // Réinitialiser le joueur à cette position
    this.playerController.reset(respawnPosition);

    // Jouer l'effet de réapparition
    this.playRespawnEffect(respawnPosition);

    this.gameState.state = GameState.READY;
    this.hudView.showReadyMessage();
    // Le défilement reprendra quand le joueur appuie sur espace (startGame)
  }

  /**
   * Joue un effet visuel de réapparition
   * @param {Object} position - Position {x, y}
   */
  playRespawnEffect(position) {
    const sprite = this.playerView.getSprite();
    if (!sprite) return;

    // Rendre le sprite transparent puis le faire apparaître
    sprite.alpha = 0;
    sprite.setScale(1.5);

    // Animation de réapparition
    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Créer des particules d'étoiles autour du joueur
    this.createRespawnParticles(position.x, position.y);

    // Période d'invincibilité après respawn
    this.playerModel.setInvincible(1500);
  }

  /**
   * Crée des particules lors du respawn
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  createRespawnParticles(x, y) {
    const colors = [0xffd700, 0xffffff, 0x87ceeb];

    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.graphics();
      const color = colors[i % colors.length];
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;

      const angle = (i / 8) * Math.PI * 2;
      const distance = 50;

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Gère la collecte d'un item
   * @param {Object} result - Résultat de la collecte
   */
  handleCollectItem(result) {
    const collectResult = this.gameState.collectItem(result.points);

    // Afficher les points
    this.hudView.showFloatingPoints(
      collectResult.points,
      this.playerModel.x,
      this.playerModel.y - 50
    );

    // Afficher le combo si > 1
    if (collectResult.combo > 1) {
      this.hudView.showCombo(collectResult.combo, collectResult.multiplier);
    }
  }

  /**
   * Gère l'atterrissage sur une plateforme
   * @param {PlatformModel} platform
   */
  handleLandOnPlatform(platform) {
    // On pourrait ajouter des effets ici
  }

  /**
   * Essaie de spawner des collectibles sur les plateformes récentes
   */
  spawnCollectiblesOnNewPlatforms() {
    const platforms = this.platformController.getActivePlatforms();

    for (const platform of platforms) {
      // Ne spawn que sur les plateformes à droite de l'écran
      if (platform.x > 600 && !platform.hasCollectible) {
        this.collectibleController.trySpawnOnPlatform(platform);
      }
    }
  }

  /**
   * Gère le passage au niveau suivant
   * @param {number} level
   */
  handleLevelUp(level) {
    // Activer le mode facile pour soulager le joueur
    // 5 plateformes plates et proches avant de reprendre la difficulté normale
    this.platformController.activateEasyMode(5);

    // Mettre à jour les contrôleurs avec le nouveau niveau
    this.platformController.setLevel(level);
    this.collectibleController.setLevel(level);

    // Afficher le message
    this.hudView.showLevelUpMessage(level);

    // Augmenter légèrement l'intensité de la neige (plafonné)
    this.backgroundView.setSnowIntensity(1 + level * 0.05);
  }

  /**
   * Gère le game over
   */
  handleGameOver() {
    // Arrêter tout
    this.platformController.stop();
    this.collectibleController.stop();
    this.backgroundView.stopSnow();

    // Arrêter la musique
    if (this.music) {
      this.music.stop();
    }

    // Afficher le message
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
    if (this.exitDialog?.isShowing()) return;
    this.exitDialog?.show();
  }

  /**
   * Confirme la sortie
   */
  confirmExit() {
    if (this.music) {
      this.music.stop();
    }
    window.Alpine?.store('arcade')?.backToMenu();
    this.scene.scene.stop();
    this.scene.game.destroy(true);
  }

  /**
   * Annule la sortie
   */
  cancelExit() {
    // Rien à faire
  }

  /**
   * Met le jeu en pause
   */
  pauseGame() {
    this.scene.physics.world.pause();
    this.scene.time.paused = true;
    this.scene.tweens.pauseAll();

    if (this.music) {
      this.music.pause();
    }

    this.platformController.stop();
    this.collectibleController.stop();
  }

  /**
   * Reprend le jeu
   */
  resumeGame() {
    this.scene.physics.world.resume();
    this.scene.time.paused = false;
    this.scene.tweens.resumeAll();

    if (this.music && this.music.isPaused) {
      this.music.resume();
    }

    this.platformController.resume();
    this.collectibleController.resume();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
    }

    if (this.inputController) this.inputController.destroy();
    if (this.playerController) this.playerController.destroy();
    if (this.platformController) this.platformController.destroy();
    if (this.collectibleController) this.collectibleController.destroy();
    if (this.collisionController) this.collisionController.destroy();
    if (this.backgroundView) this.backgroundView.destroy();
    if (this.hudView) this.hudView.destroy();
    if (this.playerView) this.playerView.destroy();
    if (this.gameState) this.gameState.destroy();
    if (this.exitDialog) this.exitDialog.destroy();
  }
}
