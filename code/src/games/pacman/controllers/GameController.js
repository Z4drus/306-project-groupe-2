/**
 * GameController - Contrôleur principal du jeu
 *
 * Orchestre tous les autres contrôleurs et gère le flux du jeu
 */

import Phaser from 'phaser';
import GameStateModel, { GameMode } from '../models/GameStateModel.js';
import MapModel from '../models/MapModel.js';
import PacmanController from './PacmanController.js';
import GhostController from './GhostController.js';
import InputController from './InputController.js';
import CollisionController from './CollisionController.js';
import HUDView from '../views/HUDView.js';
import { TILES, GRID_SIZE, ASSETS_PATH, GHOST_EXIT_THRESHOLDS } from '../config/GameConfig.js';
import ExitConfirmDialog from '../../../core/ExitConfirmDialog.js';

export default class GameController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {Object} initialData - Données initiales (level, score, lives)
   */
  constructor(scene, initialData = {}) {
    this.scene = scene;

    // Modèles
    this.gameState = new GameStateModel(initialData);
    this.mapModel = new MapModel();

    // Références Phaser (seront créées dans initialize)
    this.map = null;
    this.layer = null;
    this.dots = null;
    this.pills = null;

    // Contrôleurs
    this.inputController = null;
    this.pacmanController = null;
    this.ghostControllers = {};
    this.collisionController = null;

    // Vue
    this.hudView = null;

    // Flags
    this.waitingForDeathAnimation = false;
    this.levelTransitionInProgress = false;

    // Dialogue de confirmation de sortie
    this.exitDialog = null;
  }

  /**
   * Précharge les assets
   */
  preload() {
    const scene = this.scene;

    scene.load.image('dot', `${ASSETS_PATH}/dot.png`);
    scene.load.image('pill', `${ASSETS_PATH}/pill16.png`);
    scene.load.image('tiles', `${ASSETS_PATH}/pacman-tiles.png`);

    scene.load.spritesheet('pacman', `${ASSETS_PATH}/pacman.png`, {
      frameWidth: 32,
      frameHeight: 32
    });

    scene.load.spritesheet('ghosts', `${ASSETS_PATH}/ghosts32.png`, {
      frameWidth: 32,
      frameHeight: 32
    });

    scene.load.tilemapTiledJSON('map', `${ASSETS_PATH}/pacman-map.json`);
  }

  /**
   * Initialise le jeu
   */
  initialize() {
    // Créer la tilemap
    this.createTilemap();

    // Créer les groupes de collectibles
    this.createCollectibles();

    // Créer les contrôleurs
    this.createControllers();

    // Configurer les collisions
    this.setupCollisions();

    // Configurer les callbacks externes
    this.setupExternalCallbacks();

    // Initialiser le timer de mode
    this.gameState.changeModeTimer = this.scene.time.now + this.gameState.getCurrentModeTime();

    // Notifier l'interface externe
    this.gameState.notifyScoreUpdate();
  }

  /**
   * Crée la tilemap
   */
  createTilemap() {
    this.map = this.scene.make.tilemap({ key: 'map' });
    const tileset = this.map.addTilesetImage('pacman-tiles', 'tiles');
    this.layer = this.map.createLayer('Pacman', tileset, 0, 0);

    // Configurer les collisions
    this.map.setCollisionByExclusion([TILES.SAFE]);

    // Mettre à jour le modèle de carte
    this.mapModel.setDimensions(this.map.width, this.map.height);
  }

  /**
   * Crée les collectibles (dots et pills)
   */
  createCollectibles() {
    this.dots = this.scene.physics.add.group();
    this.pills = this.scene.physics.add.group();

    // Créer les dots
    this.createCollectiblesFromTiles(TILES.DOT, 'dot', this.dots);

    // Créer les pills
    this.createCollectiblesFromTiles(TILES.PILL, 'pill', this.pills);

    // Enregistrer le total
    this.gameState.totalDots = this.gameState.numDots;
  }

  /**
   * Crée les collectibles depuis les tiles
   */
  createCollectiblesFromTiles(tileIndex, spriteKey, group) {
    const tiles = this.map.filterTiles(
      tile => tile.index === tileIndex,
      this,
      0,
      0,
      this.map.width,
      this.map.height,
      { isNotEmpty: true }
    );

    tiles.forEach(tile => {
      const x = tile.pixelX + 8;
      const y = tile.pixelY + 8;

      const sprite = this.scene.physics.add.sprite(x, y, spriteKey);
      sprite.setOrigin(0.5);
      group.add(sprite);

      // Remplacer la tile par une tile vide
      this.map.putTileAt(TILES.SAFE, tile.x, tile.y);

      this.gameState.numDots++;
    });
  }

  /**
   * Crée tous les contrôleurs
   */
  createControllers() {
    // Input
    this.inputController = new InputController(this.scene);
    this.inputController.setEscapeCallback(() => this.handleEscape());

    // Dialogue de confirmation de sortie
    this.exitDialog = new ExitConfirmDialog(this.scene, {
      onConfirm: () => this.confirmExit(),
      onCancel: () => this.cancelExit(),
      message: 'Quitter la partie ?',
      subMessage: 'Ta progression ne sera pas sauvegardee'
    });

    // Pacman
    this.pacmanController = new PacmanController(this.scene, this.map, this.layer);

    // Fantômes
    const speedMultiplier = this.gameState.difficultyParams.speedMultiplier;

    this.ghostControllers.blinky = new GhostController(this.scene, 'blinky', this.map, this.layer, speedMultiplier);
    this.ghostControllers.pinky = new GhostController(this.scene, 'pinky', this.map, this.layer, speedMultiplier);
    this.ghostControllers.inky = new GhostController(this.scene, 'inky', this.map, this.layer, speedMultiplier);
    this.ghostControllers.clyde = new GhostController(this.scene, 'clyde', this.map, this.layer, speedMultiplier);

    // Configurer les références entre fantômes
    Object.values(this.ghostControllers).forEach(gc => {
      gc.setPacmanController(this.pacmanController);
    });
    this.ghostControllers.inky.setBlinkyController(this.ghostControllers.blinky);

    // Pinky sort immédiatement
    this.ghostControllers.pinky.exitHome();

    // HUD
    this.hudView = new HUDView(this.scene);

    // Collision
    this.collisionController = new CollisionController(this.scene);
  }

  /**
   * Configure les collisions
   */
  setupCollisions() {
    this.collisionController.initialize(
      this.pacmanController,
      Object.values(this.ghostControllers),
      this.gameState,
      this.layer,
      this.dots,
      this.pills
    );

    this.collisionController.setCallbacks({
      onDotEaten: () => this.onDotEaten(),
      onPillEaten: () => this.onPillEaten(),
      onGhostEaten: (gc) => this.onGhostEaten(gc),
      onPacmanKilled: () => this.killPacman()
    });

    this.collisionController.setupCollisions();
  }

  /**
   * Configure les callbacks externes
   */
  setupExternalCallbacks() {
    const onScoreUpdate = this.scene.game.registry.get('onScoreUpdate');
    const onGameOver = this.scene.game.registry.get('onGameOver');

    if (onScoreUpdate) {
      this.gameState.setScoreUpdateCallback(onScoreUpdate);
    }
    if (onGameOver) {
      this.gameState.setGameOverCallback(onGameOver);
    }
  }

  /**
   * Boucle principale (appelée chaque frame)
   */
  update() {
    // Mettre à jour le dialogue de confirmation si visible
    if (this.exitDialog?.isShowing()) {
      this.exitDialog.updateGamepad();
      return; // Bloquer les autres inputs
    }

    // Bloquer les updates pendant la transition de niveau
    if (this.levelTransitionInProgress) {
      return;
    }

    // Gérer la fin de l'animation de mort
    if (this.waitingForDeathAnimation && this.pacmanController.isDeathAnimationComplete()) {
      this.waitingForDeathAnimation = false;
      if (this.gameState.lives > 0) {
        this.respawnPacman();
      } else {
        this.gameOver();
      }
      return;
    }

    // Si Pacman est mort, ne mettre à jour que son animation
    if (this.pacmanController.isDead()) {
      this.pacmanController.update(Phaser.NONE);
      return;
    }

    // Mettre à jour l'InputController (boutons manette)
    this.inputController.update();

    // Récupérer l'entrée utilisateur
    const requestedDirection = this.inputController.getRequestedDirection();

    // Mettre à jour Pacman
    this.pacmanController.update(requestedDirection);

    // Mettre à jour les fantômes
    const globalMode = this.gameState.getCurrentMode();
    const numDots = this.gameState.numDots;

    Object.values(this.ghostControllers).forEach(gc => {
      const needsReschedule = gc.update(globalMode, numDots);
      if (needsReschedule) {
        this.scheduleGhostExit(gc);
      }
    });

    // Vérifier les sorties de fantômes
    this.checkGhostExits();

    // Gérer les changements de mode
    this.handleModeChanges();

    // Vérifier si le niveau est terminé
    if (this.gameState.isLevelDone()) {
      this.levelComplete();
    }

    // Notifier l'interface externe
    this.gameState.notifyScoreUpdate();
  }

  /**
   * Vérifie si des fantômes doivent sortir
   */
  checkGhostExits() {
    if (this.gameState.shouldInkyExit()) {
      this.gameState.isInkyOut = true;
      this.ghostControllers.inky.exitHome();
    }

    if (this.gameState.shouldClydeExit()) {
      this.gameState.isClydeOut = true;
      this.ghostControllers.clyde.exitHome();
    }
  }

  /**
   * Gère les changements de mode (chase/scatter/frightened)
   */
  handleModeChanges() {
    const time = this.scene.time.now;

    // Changement de mode normal
    if (!this.gameState.isPaused && this.gameState.changeModeTimer !== -1 && this.gameState.changeModeTimer < time) {
      this.gameState.advanceMode();
      const nextTime = this.gameState.getCurrentModeTime();
      this.gameState.changeModeTimer = nextTime === -1 ? -1 : time + nextTime;

      if (this.gameState.getCurrentMode() === GameMode.CHASE) {
        this.sendAttackOrder();
      } else {
        this.sendScatterOrder();
      }
    }

    // Sortie du mode frightened
    if (this.gameState.isPaused && this.gameState.changeModeTimer < time) {
      // D'abord sortir les fantômes du mode frightened visuellement
      this.exitFrightenedMode();

      this.gameState.exitFrightenedMode(time);

      if (this.gameState.getCurrentMode() === GameMode.CHASE) {
        this.sendAttackOrder();
      } else {
        this.sendScatterOrder();
      }
    }
  }

  /**
   * Sort tous les fantômes du mode frightened
   */
  exitFrightenedMode() {
    Object.values(this.ghostControllers).forEach(gc => gc.exitFrightenedMode());
  }

  /**
   * Callback: dot mangé
   */
  onDotEaten() {
    // La logique est gérée par le CollisionController et GameState
  }

  /**
   * Callback: pill mangée
   */
  onPillEaten() {
    this.enterFrightenedMode();
  }

  /**
   * Callback: fantôme mangé
   */
  onGhostEaten(ghostController) {
    this.scheduleGhostExit(ghostController);
  }

  /**
   * Entre en mode frightened
   */
  enterFrightenedMode() {
    Object.values(this.ghostControllers).forEach(gc => gc.enterFrightenedMode());
    this.gameState.enterFrightenedMode(this.scene.time.now);
  }

  /**
   * Envoie l'ordre d'attaque à tous les fantômes
   */
  sendAttackOrder() {
    Object.values(this.ghostControllers).forEach(gc => gc.attack());
  }

  /**
   * Envoie l'ordre de scatter à tous les fantômes
   */
  sendScatterOrder() {
    Object.values(this.ghostControllers).forEach(gc => gc.scatter());
  }

  /**
   * Programme la sortie d'un fantôme
   */
  scheduleGhostExit(ghostController) {
    this.scene.time.delayedCall(
      Math.random() * 3000,
      () => ghostController.exitHome(),
      [],
      this
    );
  }

  /**
   * Tue Pacman
   */
  killPacman() {
    if (this.pacmanController.isDead()) return;

    this.gameState.loseLife();
    this.pacmanController.kill();
    this.stopGhosts();
    this.waitingForDeathAnimation = true;
  }

  /**
   * Fait respawn Pacman
   */
  respawnPacman() {
    // Détruire l'ancien Pacman
    this.pacmanController.destroy();

    // Créer un nouveau Pacman
    this.pacmanController = new PacmanController(this.scene, this.map, this.layer);

    // Reconfigurer les références
    Object.values(this.ghostControllers).forEach(gc => {
      gc.setPacmanController(this.pacmanController);
    });

    // Reconfigurer les collisions
    this.collisionController.pacmanController = this.pacmanController;
    this.collisionController.reconfigureCollisions();

    // Réinitialiser les flags de sortie des fantômes
    this.gameState.isInkyOut = false;
    this.gameState.isClydeOut = false;

    // Réinitialiser les fantômes
    Object.values(this.ghostControllers).forEach(gc => gc.reset());

    // Blinky est déjà dehors (startsOutside: true), lui envoyer l'ordre d'attaque
    this.ghostControllers.blinky.attack();

    // Pinky sort immédiatement
    this.ghostControllers.pinky.exitHome();
  }

  /**
   * Stop tous les fantômes
   */
  stopGhosts() {
    Object.values(this.ghostControllers).forEach(gc => gc.stop());
  }

  /**
   * Niveau terminé
   */
  levelComplete() {
    // Activer le flag de transition pour bloquer les updates
    this.levelTransitionInProgress = true;

    this.gameState.completeLevel();

    // Arrêter les fantômes
    this.stopGhosts();

    // Arrêter Pacman
    this.pacmanController.stop();

    // Désactiver les collisions pendant la transition
    this.collisionController.disableCollisions();

    const nextLevel = this.gameState.level + 1;

    // Afficher le message de victoire
    this.hudView.showLevelComplete(this.gameState.level, nextLevel);

    // Passer au niveau suivant après 3 secondes
    this.scene.time.delayedCall(3000, () => {
      this.scene.scene.restart({
        level: nextLevel,
        score: this.gameState.score,
        lives: this.gameState.lives
      });
    });
  }

  /**
   * Game Over
   */
  gameOver() {
    this.scene.scene.start('GameOverScene', { score: this.gameState.score });
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
    this.returnToMenu();
  }

  /**
   * Annule la sortie du jeu
   */
  cancelExit() {
    // Le dialogue se ferme automatiquement, rien d'autre à faire
  }

  /**
   * Retour au menu principal
   */
  returnToMenu() {
    this.gameState.notifyGameOver();
    this.scene.scene.stop();
    this.scene.game.destroy(true);
  }

  /**
   * Retourne l'état du jeu (pour les scènes)
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.inputController.destroy();
    this.pacmanController.destroy();
    Object.values(this.ghostControllers).forEach(gc => gc.destroy());
    this.hudView.destroy();
    if (this.exitDialog) this.exitDialog.destroy();
  }
}
