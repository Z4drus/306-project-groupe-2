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

    // Gérer le wrapping aux bords (sauf en mode returning)
    if (this.model.mode !== GhostMode.RETURNING) {
      this.view.handleWrapping(this.map.widthInPixels);
    }

    // Mode RETURNING : naviguer en continu vers la maison
    if (this.model.mode === GhostMode.RETURNING) {
      const x = this.model.gridX;
      const y = this.model.gridY;
      const needsReschedule = this.handleReturning(x, y, time);
      return needsReschedule;
    }

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

    return false;
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
        this.handleChase(x, y, time, possibleExits, canContinue);
        break;
      case GhostMode.SCATTER:
        this.model.setDestination({ ...this.model.scatterDestination });
        this.model.setMode(GhostMode.CHASE);
        break;
      case GhostMode.STOP:
        this.move(Phaser.NONE);
        break;
      // RETURNING est géré directement dans update()
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
    const spriteX = this.view.sprite.x;
    const homeY = 14 * GRID_SIZE + GRID_SIZE / 2;

    // Limites de la zone de bounce dans la maison (entre x=12 et x=15 en tiles)
    const leftBound = 12 * GRID_SIZE + GRID_SIZE / 2;
    const rightBound = 15 * GRID_SIZE + GRID_SIZE / 2;

    // S'assurer que le fantôme est à la bonne hauteur
    this.view.sprite.y = homeY;

    // Vérifier les limites et faire demi-tour
    if (spriteX <= leftBound) {
      this.view.alignTo(leftBound, homeY);
      this.move(Phaser.RIGHT);
    } else if (spriteX >= rightBound) {
      this.view.alignTo(rightBound, homeY);
      this.move(Phaser.LEFT);
    } else if (!canContinue) {
      // Si bloqué pour une autre raison, faire demi-tour
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
      // Vérifier si le jeu est en mode frightened
      if (globalMode === 'frightened') {
        this.model.setMode(GhostMode.FRIGHTENED);
        this.view.playFrightenedAnimation();
      } else {
        this.model.setMode(globalMode === 'chase' ? GhostMode.CHASE : GhostMode.SCATTER);
      }
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
    if (!this.model.canTurn(time)) return;

    // Si aucune sortie possible et ne peut pas continuer, faire demi-tour
    if (possibleExits.length === 0 && !canContinue) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.move(this.model.opposites[this.model.currentDirection]);
      this.model.setTurnCooldown(time);
      return;
    }

    // Si plusieurs choix ou ne peut pas continuer, choisir aléatoirement
    if (possibleExits.length > 0 && (possibleExits.length > 1 || !canContinue)) {
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
  handleChase(x, y, time, possibleExits, canContinue) {
    if (!this.model.canTurn(time)) return;

    // Si aucune sortie possible et ne peut pas continuer, faire demi-tour
    if (possibleExits.length === 0 && !canContinue) {
      const turnPoint = { x: x * GRID_SIZE + GRID_SIZE / 2, y: y * GRID_SIZE + GRID_SIZE / 2 };
      this.view.alignTo(turnPoint.x, turnPoint.y);
      this.move(this.model.opposites[this.model.currentDirection]);
      this.model.setTurnCooldown(time);
      return;
    }

    // Si aucune sortie et peut continuer, garder la direction actuelle
    if (possibleExits.length === 0) {
      return;
    }

    // S'assurer qu'on a une destination valide
    const destination = this.model.destination || this.model.scatterDestination;
    if (!destination) {
      return;
    }

    let bestDecision = this.model.currentDirection;
    let distanceToObj = 999999;

    for (const direction of possibleExits) {
      const decision = this.getDecisionPoint(x, y, direction);
      const dist = Phaser.Math.Distance.Between(
        destination.x,
        destination.y,
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
      // Chercher une autre direction valide plutôt que de garder la direction actuelle
      const alternatives = possibleExits.filter(d => d !== Phaser.UP);
      if (alternatives.length > 0) {
        bestDecision = alternatives[0];
        distanceToObj = 999999;
        for (const direction of alternatives) {
          const decision = this.getDecisionPoint(x, y, direction);
          const dist = Phaser.Math.Distance.Between(
            destination.x,
            destination.y,
            decision.x,
            decision.y
          );
          if (dist < distanceToObj) {
            bestDecision = direction;
            distanceToObj = dist;
          }
        }
      } else if (canContinue) {
        bestDecision = this.model.currentDirection;
      }
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
    const speed = this.model.returningSpeed;
    const spriteX = this.view.sprite.x;
    const spriteY = this.view.sprite.y;

    // Points clés du chemin
    const entranceX = 14 * GRID_SIZE; // x = 224 (centre de l'entrée)
    const entranceY = 11 * GRID_SIZE + GRID_SIZE / 2; // y = 184 (juste au-dessus de la porte)
    const homeX = 14 * GRID_SIZE; // x = 224
    const homeY = 14 * GRID_SIZE + GRID_SIZE / 2; // y = 232 (centre de la maison)
    const threshold = 8;

    // Étape 1: Aller horizontalement vers l'entrée (x = 224)
    // On fait ça en premier peu importe où on est
    if (Math.abs(spriteX - entranceX) > threshold) {
      if (spriteX < entranceX) {
        this.view.sprite.body.setVelocity(speed, 0);
        this.view.updateAnimation(Phaser.RIGHT);
      } else {
        this.view.sprite.body.setVelocity(-speed, 0);
        this.view.updateAnimation(Phaser.LEFT);
      }
      return false;
    }

    // Étape 2: Descendre jusqu'à l'entrée (y = 184), puis dans la maison (y = 232)
    if (spriteY < homeY - threshold) {
      this.view.sprite.body.setVelocity(0, speed);
      this.view.updateAnimation(Phaser.DOWN);
      return false;
    }

    // Étape 3: Arrivé dans la maison
    if (spriteY >= homeY - threshold) {
      // Aligner précisément au centre de la maison
      this.view.alignTo(homeX, homeY);

      // Passer en mode AT_HOME
      this.model.setMode(GhostMode.AT_HOME);

      // Jouer l'animation normale et commencer à bouger
      this.view.playNormalAnimation();
      this.move(Phaser.LEFT); // Commencer à bouger vers la gauche

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
    const wasFrightened = this.model.mode === GhostMode.FRIGHTENED;
    this.model.attack();
    // Si on était en mode frightened, remettre l'animation normale
    if (wasFrightened) {
      this.view.playNormalAnimation();
    }
  }

  /**
   * Passe en mode scatter
   */
  scatter() {
    const wasFrightened = this.model.mode === GhostMode.FRIGHTENED;
    this.model.scatter();
    // Si on était en mode frightened, remettre l'animation normale
    if (wasFrightened) {
      this.view.playNormalAnimation();
    }
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
   * Sort du mode frightened et remet l'animation normale
   */
  exitFrightenedMode() {
    if (this.model.mode === GhostMode.FRIGHTENED) {
      this.view.playNormalAnimation();
    }
  }

  /**
   * Fantôme mangé par Pacman
   */
  eaten() {
    this.model.eaten();
    // Mettre à jour l'animation pour afficher les yeux
    this.view.updateAnimation(this.model.currentDirection || Phaser.LEFT);
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
    // Redémarrer le mouvement
    this.move(this.model.currentDirection);
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.view.destroy();
  }
}
