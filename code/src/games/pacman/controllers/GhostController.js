/**
 * GhostController - Contrôleur d'un fantôme
 *
 * Gère la logique de mouvement et d'IA d'un fantôme
 */

import Phaser from 'phaser';
import GhostModel, { GhostMode } from '../models/GhostModel.js';
import GhostView from '../views/GhostView.js';
import { GRID_SIZE, SPECIAL_TILES } from '../config/GameConfig.js';

export default class GhostController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {string} name - Nom du fantôme
   * @param {Object} map - Tilemap Phaser
   * @param {Object} layer - Layer de la tilemap
   * @param {number} speedMultiplier - Multiplicateur de vitesse
   */
  constructor(scene, name, map, layer, speedMultiplier = 1) {
    this.scene = scene;
    this.map = map;
    this.layer = layer;

    // Créer le modèle et la vue
    this.model = new GhostModel(name, speedMultiplier);
    this.view = new GhostView(scene, this.model);

    // Références externes (seront définies par GameController)
    this.pacmanController = null;
    this.blinkyController = null; // Pour Inky

    // Démarrer le mouvement
    this.move(this.model.currentDirection);
  }

  /**
   * Définit la référence au contrôleur Pacman
   * @param {PacmanController} pacmanController
   */
  setPacmanController(pacmanController) {
    this.pacmanController = pacmanController;
  }

  /**
   * Définit la référence au contrôleur Blinky (pour Inky)
   * @param {GhostController} blinkyController
   */
  setBlinkyController(blinkyController) {
    this.blinkyController = blinkyController;
  }

  /**
   * Met à jour le fantôme (appelé chaque frame)
   * @param {string} globalMode - Mode global du jeu
   * @param {number} numDots - Nombre de dots restants
   */
  update(globalMode, numDots) {
    // Gérer les collisions sauf en mode returning
    if (this.model.mode !== GhostMode.RETURNING) {
      this.scene.physics.world.collide(this.view.sprite, this.layer);
    }

    const time = this.scene.time.now;

    // Synchroniser le modèle avec la vue
    this.view.update();

    // Gérer le wrapping aux bords
    this.view.handleWrapping(this.map.widthInPixels);

    // Mettre à jour la destination si en mode chase/scatter
    if (this.model.isAttacking && (this.model.mode === GhostMode.SCATTER || this.model.mode === GhostMode.CHASE)) {
      this.model.setDestination(this.getGhostDestination());
      this.model.setMode(GhostMode.CHASE);
    }

    // Vérifier si on est au centre d'une case
    const x = this.model.gridX;
    const y = this.model.gridY;

    if (this.isAtGridCenter(x, y)) {
      this.handleGridPosition(x, y, time, globalMode, numDots);
    }
  }

  /**
   * Vérifie si le fantôme est au centre d'une case
   */
  isAtGridCenter(x, y) {
    const threshold = 6;
    return (
      Phaser.Math.Fuzzy.Equal(x * GRID_SIZE + GRID_SIZE / 2, this.view.sprite.x, threshold) &&
      Phaser.Math.Fuzzy.Equal(y * GRID_SIZE + GRID_SIZE / 2, this.view.sprite.y, threshold)
    );
  }

  /**
   * Gère le comportement au centre d'une case
   */
  handleGridPosition(x, y, time, globalMode, numDots) {
    const directions = this.getAdjacentTiles(x, y);
    const canContinue = this.model.isSafeTile(directions[this.model.currentDirection]?.index);
    const possibleExits = this.getPossibleExits(directions);

    switch (this.model.mode) {
      case GhostMode.AT_HOME:
        this.handleAtHome(x, y, canContinue);
        break;
      case GhostMode.EXIT_HOME:
        this.handleExitHome(x, y, canContinue, globalMode);
        break;
      case GhostMode.FRIGHTENED:
        this.handleFrightened(x, y, time, possibleExits, canContinue);
        break;
      case GhostMode.CHASE:
        this.handleChase(x, y, time, possibleExits);
        break;
      case GhostMode.SCATTER:
        this.model.setDestination({ ...this.model.scatterDestination });
        this.model.setMode(GhostMode.CHASE);
        break;
      case GhostMode.RETURNING:
        this.handleReturning(x, y, time);
        break;
      case GhostMode.STOP:
        this.move(Phaser.NONE);
        break;
    }
  }

  /**
   * Récupère les tiles adjacentes
   */
  getAdjacentTiles(x, y) {
    const directions = [null, null, null, null, null];
    directions[0] = this.map.getTileAt(x, y, false, this.layer);
    directions[Phaser.LEFT] = this.map.getTileAt(x - 1, y, false, this.layer);
    directions[Phaser.RIGHT] = this.map.getTileAt(x + 1, y, false, this.layer);
    directions[Phaser.UP] = this.map.getTileAt(x, y - 1, false, this.layer);
    directions[Phaser.DOWN] = this.map.getTileAt(x, y + 1, false, this.layer);
    return directions;
  }

  /**
   * Récupère les sorties possibles (sans demi-tour)
   */
  getPossibleExits(directions) {
    const possibleExits = [];
    for (let q = 1; q < directions.length; q++) {
      if (this.model.isSafeTile(directions[q]?.index) && q !== this.model.opposites[this.model.currentDirection]) {
        possibleExits.push(q);
      }
    }
    return possibleExits;
  }

  /**
   * Gère le mode AT_HOME
   */
  handleAtHome(x, y, canContinue) {
    if (!canContinue) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: 14 * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      const dir = this.model.currentDirection === Phaser.LEFT ? Phaser.RIGHT : Phaser.LEFT;
      this.move(dir);
    }
  }

  /**
   * Gère la sortie de la maison
   */
  handleExitHome(x, y, canContinue, globalMode) {
    if (this.model.currentDirection !== Phaser.UP && (x === 13 || x === 14)) {
      const turnPoint = { x: 13 * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.move(Phaser.UP);
    } else if (this.model.currentDirection === Phaser.UP && y === 11) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.model.safeTiles = [14];
      this.model.setMode(globalMode === 'chase' ? GhostMode.CHASE : GhostMode.SCATTER);
    } else if (!canContinue) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      const dir = this.model.currentDirection === Phaser.LEFT ? Phaser.RIGHT : Phaser.LEFT;
      this.move(dir);
    }
  }

  /**
   * Gère le mode FRIGHTENED
   */
  handleFrightened(x, y, time, possibleExits, canContinue) {
    if (this.model.canTurn(time) && (possibleExits.length > 1 || !canContinue)) {
      const select = Math.floor(Math.random() * possibleExits.length);
      const newDirection = possibleExits[select];
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.move(newDirection);
      this.model.setTurnCooldown(time);
    }
  }

  /**
   * Gère le mode CHASE
   */
  handleChase(x, y, time, possibleExits) {
    if (!this.model.canTurn(time)) return;

    let bestDecision = this.model.currentDirection;
    let distanceToObj = 999999;

    for (const direction of possibleExits) {
      const decision = this.getDecisionPoint(x, y, direction);
      const dist = Phaser.Math.Distance.Between(
        this.model.destination.x,
        this.model.destination.y,
        decision.x,
        decision.y
      );

      if (dist < distanceToObj) {
        bestDecision = direction;
        distanceToObj = dist;
      }
    }

    // Empêcher de monter dans certaines tiles spéciales
    if (this.isSpecialTile(x, y) && bestDecision === Phaser.UP) {
      bestDecision = this.model.currentDirection;
    }

    const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
    this.view.alignTo(turnPoint.x, turnPoint.y);
    this.move(bestDecision);
    this.model.setTurnCooldown(time);
  }

  /**
   * Gère le mode RETURNING
   */
  handleReturning(x, y, time) {
    if (!this.model.canTurn(time)) return;

    this.view.sprite.body.reset(this.view.sprite.x, this.view.sprite.y);
    const speed = this.model.returningSpeed;

    if (this.view.sprite.y < 14 * GRID_SIZE) {
      this.view.sprite.body.setVelocity(0, speed);
      this.view.updateAnimation(Phaser.DOWN);
    } else if (this.view.sprite.y > 15 * GRID_SIZE) {
      this.view.sprite.body.setVelocity(0, -speed);
      this.view.updateAnimation(Phaser.UP);
    } else if (this.view.sprite.x < 13 * GRID_SIZE) {
      this.view.sprite.body.setVelocity(speed, 0);
      this.view.updateAnimation(Phaser.RIGHT);
    } else if (this.view.sprite.x > 16 * GRID_SIZE) {
      this.view.sprite.body.setVelocity(-speed, 0);
      this.view.updateAnimation(Phaser.LEFT);
    }

    this.model.setTurnCooldown(time - 50); // 100ms cooldown

    if (this.model.hasReachedHome()) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.model.setMode(GhostMode.AT_HOME);
      return true; // Signale qu'il faut programmer la sortie
    }
    return false;
  }

  /**
   * Calcule le point de décision pour une direction
   */
  getDecisionPoint(x, y, direction) {
    switch (direction) {
      case Phaser.LEFT:
        return { x: (x - 1) * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      case Phaser.RIGHT:
        return { x: (x + 1) * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      case Phaser.UP:
        return { x: x * GRID_SIZE + GRID_SIZE / 2, y: (y - 1) * GRID_SIZE + GRID_SIZE / 2 };
      case Phaser.DOWN:
        return { x: x * GRID_SIZE + GRID_SIZE / 2, y: (y + 1) * GRID_SIZE + GRID_SIZE / 2 };
      default:
        return { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
    }
  }

  /**
   * Vérifie si c'est une tile spéciale
   */
  isSpecialTile(x, y) {
    return SPECIAL_TILES.some(tile => tile.x === x && tile.y === y);
  }

  /**
   * Calcule la destination selon le type de fantôme
   */
  getGhostDestination() {
    if (!this.pacmanController) {
      return { ...this.model.scatterDestination };
    }

    const pacmanPos = this.pacmanController.getPosition();
    const pacmanDir = this.pacmanController.getCurrentDirection();

    switch (this.model.name) {
      case 'blinky':
        return pacmanPos;

      case 'pinky': {
        let offsetX = 0;
        let offsetY = 0;
        if (pacmanDir === Phaser.LEFT || pacmanDir === Phaser.RIGHT) {
          offsetX = (pacmanDir === Phaser.RIGHT ? 4 : -4) * GRID_SIZE;
        }
        if (pacmanDir === Phaser.UP || pacmanDir === Phaser.DOWN) {
          offsetY = (pacmanDir === Phaser.DOWN ? 4 : -4) * GRID_SIZE;
        }
        return {
          x: Phaser.Math.Clamp(pacmanPos.x + offsetX, GRID_SIZE / 2, this.map.widthInPixels - GRID_SIZE / 2),
          y: Phaser.Math.Clamp(pacmanPos.y + offsetY, GRID_SIZE / 2, this.map.heightInPixels - GRID_SIZE / 2)
        };
      }

      case 'inky': {
        if (!this.blinkyController) {
          return pacmanPos;
        }
        const blinkyPos = this.blinkyController.getPosition();
        const diff = { x: pacmanPos.x - blinkyPos.x, y: pacmanPos.y - blinkyPos.y };
        return {
          x: Phaser.Math.Clamp(pacmanPos.x + diff.x, GRID_SIZE / 2, this.map.widthInPixels - GRID_SIZE / 2),
          y: Phaser.Math.Clamp(pacmanPos.y + diff.y, GRID_SIZE / 2, this.map.heightInPixels - GRID_SIZE / 2)
        };
      }

      case 'clyde': {
        const clydePos = this.getPosition();
        const distance = Phaser.Math.Distance.Between(clydePos.x, clydePos.y, pacmanPos.x, pacmanPos.y);
        if (distance > 8 * GRID_SIZE) {
          return pacmanPos;
        }
        return { ...this.model.scatterDestination };
      }

      default:
        return { ...this.model.scatterDestination };
    }
  }

  /**
   * Déplace le fantôme
   */
  move(direction) {
    this.model.setDirection(direction);
    const speed = this.model.getCurrentSpeed(this.scene.gameState?.getCurrentMode() || 'chase', this.scene.gameState?.numDots || 100);
    this.view.move(direction, speed);
  }

  /**
   * Ordonne au fantôme de sortir de la maison
   */
  exitHome() {
    this.model.setMode(GhostMode.EXIT_HOME);
  }

  /**
   * Passe en mode attack
   */
  attack() {
    this.model.attack();
  }

  /**
   * Passe en mode scatter
   */
  scatter() {
    this.model.scatter();
  }

  /**
   * Passe en mode frightened
   */
  enterFrightenedMode() {
    this.model.enterFrightenedMode();
    if (this.model.mode === GhostMode.FRIGHTENED) {
      this.view.playFrightenedAnimation();
    }
  }

  /**
   * Fantôme mangé par Pacman
   */
  eaten() {
    this.model.eaten();
  }

  /**
   * Stop le fantôme
   */
  stop() {
    this.model.setMode(GhostMode.STOP);
  }

  /**
   * Retourne la position actuelle
   */
  getPosition() {
    return this.model.getPosition();
  }

  /**
   * Retourne le mode actuel
   */
  getMode() {
    return this.model.mode;
  }

  /**
   * Retourne le sprite Phaser
   */
  getSprite() {
    return this.view.getSprite();
  }

  /**
   * Réinitialise le fantôme
   */
  reset() {
    this.model.reset();
    this.view.reset();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.view.destroy();
  }
}
