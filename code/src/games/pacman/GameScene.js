/**
 * GameScene - Scène principale du jeu Pacman
 *
 * Gère le gameplay complet, les collisions, le score et les modes des fantômes
 */

import Phaser from 'phaser';
import Pacman from './Pacman.js';
import Ghost from './Ghost.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Configuration du jeu
    this.gridSize = 16;
    this.safeTile = 14;
    this.score = 0;
    this.lives = 3;
    this.numDots = 0;
    this.totalDots = 0;

    // Tiles spéciales où les fantômes ne peuvent pas monter
    this.SPECIAL_TILES = [
      { x: 12, y: 11 },
      { x: 15, y: 11 },
      { x: 12, y: 23 },
      { x: 15, y: 23 }
    ];

    // Cycles de modes des fantômes (comme le jeu original)
    this.TIME_MODES = [
      { mode: 'scatter', time: 7000 },
      { mode: 'chase', time: 20000 },
      { mode: 'scatter', time: 7000 },
      { mode: 'chase', time: 20000 },
      { mode: 'scatter', time: 5000 },
      { mode: 'chase', time: 20000 },
      { mode: 'scatter', time: 5000 },
      { mode: 'chase', time: -1 } // -1 = infini
    ];

    this.currentMode = 0;
    this.changeModeTimer = 0;
    this.isPaused = false;
    this.FRIGHTENED_MODE_TIME = 7000;
    this.remainingTime = 0;
  }

  /**
   * Préchargement des assets
   */
  preload() {
    // Chemin de base pour les assets
    const basePath = '/src/games/pacman/assets';

    // Charger les images
    this.load.image('dot', `${basePath}/dot.png`);
    this.load.image('pill', `${basePath}/pill16.png`);
    this.load.image('tiles', `${basePath}/pacman-tiles.png`);

    // Charger les spritesheets
    this.load.spritesheet('pacman', `${basePath}/pacman.png`, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('ghosts', `${basePath}/ghosts32.png`, {
      frameWidth: 32,
      frameHeight: 32
    });

    // Charger la tilemap
    this.load.tilemapTiledJSON('map', `${basePath}/pacman-map.json`);
  }

  /**
   * Création de la scène
   */
  create() {
    // Créer la tilemap
    this.map = this.make.tilemap({ key: 'map' });
    const tileset = this.map.addTilesetImage('pacman-tiles', 'tiles');
    this.layer = this.map.createLayer('Pacman', tileset, 0, 0);

    // Activer les collisions (tout sauf la tile 14)
    this.map.setCollisionByExclusion([this.safeTile]);

    // Créer les groupes de dots et pills
    this.dots = this.physics.add.group();
    this.pills = this.physics.add.group();

    // Placer les dots (tile 7 devient un dot)
    this.createDotsFromTiles(7, 'dot', this.dots);

    // Placer les pills (tile 40 devient une pill)
    this.createDotsFromTiles(40, 'pill', this.pills);

    this.totalDots = this.numDots;

    // Créer Pacman
    this.pacman = new Pacman(this);

    // Créer les fantômes
    this.blinky = new Ghost(this, 'blinky', { x: 13, y: 11 }, Phaser.RIGHT);
    this.pinky = new Ghost(this, 'pinky', { x: 15, y: 14 }, Phaser.LEFT);
    this.inky = new Ghost(this, 'inky', { x: 14, y: 14 }, Phaser.RIGHT);
    this.clyde = new Ghost(this, 'clyde', { x: 17, y: 14 }, Phaser.LEFT);

    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

    this.isInkyOut = false;
    this.isClydeOut = false;

    // Pinky sort immédiatement
    this.sendExitOrder(this.pinky);

    // Configurer les collisions
    this.physics.add.collider(this.pacman.sprite, this.layer);
    this.physics.add.overlap(
      this.pacman.sprite,
      this.dots,
      this.eatDot,
      null,
      this
    );
    this.physics.add.overlap(
      this.pacman.sprite,
      this.pills,
      this.eatPill,
      null,
      this
    );

    // Collisions avec les fantômes
    this.ghosts.forEach((ghost) => {
      this.physics.add.overlap(
        this.pacman.sprite,
        ghost.sprite,
        this.handleGhostCollision,
        null,
        this
      );
    });

    // UI - Score
    this.scoreText = this.add.text(8, 472, `SCORE: ${this.score}`, {
      fontSize: '16px',
      fill: '#fff',
      fontFamily: 'Arial'
    });

    // UI - Lives
    this.livesText = this.add.text(200, 472, `LIVES: ${this.lives}`, {
      fontSize: '16px',
      fill: '#fff',
      fontFamily: 'Arial'
    });

    // Touches clavier
    this.cursors = this.input.keyboard.createCursorKeys();

    // Touche ESC pour quitter
    this.escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    this.escKey.on('down', () => {
      this.returnToMenu();
    });

    // Démarrer le timer de changement de mode
    this.changeModeTimer = this.time.now + this.TIME_MODES[this.currentMode].time;
  }

  /**
   * Crée les dots/pills à partir des tiles
   */
  createDotsFromTiles(tileIndex, spriteKey, group) {
    const tiles = this.map.filterTiles(
      (tile) => tile.index === tileIndex,
      this,
      0,
      0,
      this.map.width,
      this.map.height,
      { isNotEmpty: true }
    );

    tiles.forEach((tile) => {
      const x = tile.pixelX + 8;
      const y = tile.pixelY + 8;

      const dot = this.physics.add.sprite(x, y, spriteKey);
      dot.setOrigin(0.5);
      group.add(dot);

      // Remplacer la tile par une tile vide
      this.map.putTileAt(this.safeTile, tile.x, tile.y);

      this.numDots++;
    });
  }

  /**
   * Boucle principale
   */
  update() {
    // Vérifier si le jeu est terminé
    if (this.pacman.isDead) {
      return;
    }

    // Update Pacman
    this.pacman.checkKeys(this.cursors);
    this.pacman.update();

    // Update fantômes
    this.ghosts.forEach((ghost) => ghost.update());

    // Sortir Inky après 30 dots mangés
    if (this.totalDots - this.numDots > 30 && !this.isInkyOut) {
      this.isInkyOut = true;
      this.sendExitOrder(this.inky);
    }

    // Sortir Clyde après 2/3 des dots mangés
    if (this.numDots < this.totalDots / 3 && !this.isClydeOut) {
      this.isClydeOut = true;
      this.sendExitOrder(this.clyde);
    }

    // Gérer les changements de mode
    if (
      !this.isPaused &&
      this.changeModeTimer !== -1 &&
      this.changeModeTimer < this.time.now
    ) {
      this.currentMode++;
      if (this.currentMode >= this.TIME_MODES.length) {
        this.currentMode = this.TIME_MODES.length - 1;
      }

      const nextTime = this.TIME_MODES[this.currentMode].time;
      this.changeModeTimer = nextTime === -1 ? -1 : this.time.now + nextTime;

      if (this.TIME_MODES[this.currentMode].mode === 'chase') {
        this.sendAttackOrder();
      } else {
        this.sendScatterOrder();
      }
    }

    // Sortir du mode frightened
    if (this.isPaused && this.changeModeTimer < this.time.now) {
      this.changeModeTimer = this.time.now + this.remainingTime;
      this.isPaused = false;

      if (this.TIME_MODES[this.currentMode].mode === 'chase') {
        this.sendAttackOrder();
      } else {
        this.sendScatterOrder();
      }
    }

    // Vérifier si tous les dots sont mangés
    if (this.numDots === 0) {
      this.levelComplete();
    }

    // Mettre à jour le score
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText(`LIVES: ${this.lives}`);
  }

  /**
   * Pacman mange un dot
   */
  eatDot(pacmanSprite, dot) {
    dot.destroy();
    this.score += 10;
    this.numDots--;
  }

  /**
   * Pacman mange une pill (power-up)
   */
  eatPill(pacmanSprite, pill) {
    pill.destroy();
    this.score += 50;
    this.numDots--;
    this.enterFrightenedMode();
  }

  /**
   * Collision avec un fantôme
   */
  handleGhostCollision(pacmanSprite, ghostSprite) {
    const ghost = this.ghosts.find((g) => g.sprite === ghostSprite);
    if (!ghost) return;

    if (this.isPaused && ghost.mode === ghost.MODE_FRIGHTENED) {
      // Pacman mange le fantôme
      ghost.mode = ghost.MODE_RETURNING;
      ghost.ghostDestination = new Phaser.Math.Vector2(
        14 * this.gridSize,
        14 * this.gridSize
      );
      ghost.resetSafeTiles();
      this.score += 200;
    } else if (ghost.mode !== ghost.MODE_RETURNING) {
      // Le fantôme tue Pacman
      this.killPacman();
    }
  }

  /**
   * Entre en mode frightened (fantômes apeurés)
   */
  enterFrightenedMode() {
    this.ghosts.forEach((ghost) => ghost.enterFrightenedMode());

    if (!this.isPaused) {
      this.remainingTime = this.changeModeTimer - this.time.now;
    }

    this.changeModeTimer = this.time.now + this.FRIGHTENED_MODE_TIME;
    this.isPaused = true;
  }

  /**
   * Envoie l'ordre de sortie à un fantôme
   */
  sendExitOrder(ghost) {
    ghost.mode = ghost.MODE_EXIT_HOME;
  }

  /**
   * Programme la sortie d'un fantôme après un délai aléatoire
   */
  scheduleGhostExit(ghost) {
    this.time.delayedCall(
      Math.random() * 3000,
      () => {
        this.sendExitOrder(ghost);
      },
      [],
      this
    );
  }

  /**
   * Envoie l'ordre d'attaque à tous les fantômes
   */
  sendAttackOrder() {
    this.ghosts.forEach((ghost) => ghost.attack());
  }

  /**
   * Envoie l'ordre de scatter à tous les fantômes
   */
  sendScatterOrder() {
    this.ghosts.forEach((ghost) => ghost.scatter());
  }

  /**
   * Tue Pacman
   */
  killPacman() {
    if (this.pacman.isDead) return;

    this.lives--;
    this.pacman.kill();
    this.stopGhosts();

    if (this.lives > 0) {
      // Respawn après 2 secondes
      this.time.delayedCall(2000, this.respawnPacman, [], this);
    }
  }

  /**
   * Fait respawn Pacman
   */
  respawnPacman() {
    // Réinitialiser Pacman
    this.pacman.sprite.destroy();
    this.pacman = new Pacman(this);

    // Recréer les collisions
    this.physics.add.collider(this.pacman.sprite, this.layer);
    this.physics.add.overlap(
      this.pacman.sprite,
      this.dots,
      this.eatDot,
      null,
      this
    );
    this.physics.add.overlap(
      this.pacman.sprite,
      this.pills,
      this.eatPill,
      null,
      this
    );

    this.ghosts.forEach((ghost) => {
      this.physics.add.overlap(
        this.pacman.sprite,
        ghost.sprite,
        this.handleGhostCollision,
        null,
        this
      );

      // Réinitialiser les fantômes
      ghost.sprite.setPosition(
        ghost.startPos.x * this.gridSize + 8,
        ghost.startPos.y * this.gridSize + 8
      );
      ghost.mode = ghost.MODE_AT_HOME;
      ghost.currentDir = ghost.startDir;
      ghost.move(ghost.startDir);
    });

    // Pinky sort immédiatement
    this.sendExitOrder(this.pinky);
  }

  /**
   * Stop tous les fantômes
   */
  stopGhosts() {
    this.ghosts.forEach((ghost) => ghost.stop());
  }

  /**
   * Retourne le mode actuel (chase ou scatter)
   */
  getCurrentMode() {
    if (!this.isPaused) {
      return this.TIME_MODES[this.currentMode].mode;
    } else {
      return 'frightened';
    }
  }

  /**
   * Vérifie si une position est une tile spéciale
   */
  isSpecialTile(x, y) {
    return this.SPECIAL_TILES.some((tile) => tile.x === x && tile.y === y);
  }

  /**
   * Niveau terminé (tous les dots mangés)
   */
  levelComplete() {
    this.score += 1000;
    this.stopGhosts();
    this.pacman.move(Phaser.NONE);

    // Afficher message de victoire
    const victoryText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'LEVEL COMPLETE!\n+1000 POINTS',
      {
        fontSize: '32px',
        fill: '#ffff00',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    victoryText.setOrigin(0.5);

    // Retour au menu après 3 secondes
    this.time.delayedCall(3000, this.gameOver, [], this);
  }

  /**
   * Game over
   */
  gameOver() {
    // Récupérer le callback onGameOver
    const onGameOver = this.game.registry.get('onGameOver');

    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(this.score);
    }

    // Détruire le jeu
    this.scene.stop();
    this.game.destroy(true);
  }

  /**
   * Retour au menu principal
   */
  returnToMenu() {
    // Récupérer le callback onGameOver avec score 0 (abandon)
    const onGameOver = this.game.registry.get('onGameOver');

    if (onGameOver && typeof onGameOver === 'function') {
      onGameOver(this.score);
    }

    // Détruire le jeu
    this.scene.stop();
    this.game.destroy(true);
  }
}
