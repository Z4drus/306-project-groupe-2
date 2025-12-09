/**
 * Classe Ghost - Fantôme avec IA
 *
 * Implémente les 4 fantômes avec leurs comportements uniques
 * - Blinky (rouge) : Poursuite directe
 * - Pinky (rose) : Anticipe la position
 * - Inky (cyan) : Utilise Blinky pour calculer sa cible
 * - Clyde (orange) : Timide, s'éloigne si trop proche
 */

import Phaser from 'phaser';

export default class Ghost {
  constructor(scene, name, startPos, startDir) {
    this.scene = scene;
    this.name = name;
    this.gridSize = 16;
    this.threshold = 6;

    // Modes
    this.MODE_CHASE = 'chase';
    this.MODE_SCATTER = 'scatter';
    this.MODE_FRIGHTENED = 'frightened';
    this.MODE_AT_HOME = 'at_home';
    this.MODE_EXIT_HOME = 'exit_home';
    this.MODE_RETURNING = 'returning';
    this.MODE_STOP = 'stop';

    this.mode = this.MODE_AT_HOME;
    this.isAttacking = false;

    // Vitesses
    this.ghostSpeed = 150;
    this.ghostScatterSpeed = 125;
    this.ghostFrightenedSpeed = 75;
    this.cruiseElroySpeed = 160;

    // Safe tiles (où le fantôme peut aller)
    this.safeTiles = [14, 35, 36];

    // Direction
    this.currentDir = startDir;
    this.startDir = startDir;
    this.startPos = startPos;

    this.opposites = [
      Phaser.NONE,
      Phaser.RIGHT,
      Phaser.LEFT,
      Phaser.DOWN,
      Phaser.UP
    ];

    this.turnTimer = 0;
    this.TURNING_COOLDOWN = 150;

    // Position de destination
    this.ghostDestination = null;
    this.scatterDestination = new Phaser.Math.Vector2(27 * this.gridSize, 30 * this.gridSize);

    // Configuration spécifique par fantôme
    let offsetGhost = 0;
    switch (name) {
      case 'blinky':
        offsetGhost = 12;
        this.scatterDestination.set(27 * this.gridSize, 0);
        this.safeTiles = [14]; // Blinky ne reste pas à la maison
        this.mode = this.MODE_SCATTER;
        break;
      case 'pinky':
        offsetGhost = 8;
        this.scatterDestination.set(0, 0);
        break;
      case 'inky':
        offsetGhost = 0;
        this.scatterDestination.set(27 * this.gridSize, 30 * this.gridSize);
        break;
      case 'clyde':
        offsetGhost = 4;
        this.scatterDestination.set(0, 30 * this.gridSize);
        break;
    }

    this.offsetGhost = offsetGhost;

    // Créer le sprite
    this.sprite = scene.physics.add.sprite(
      startPos.x * this.gridSize + 8,
      startPos.y * this.gridSize + 8,
      'ghosts',
      offsetGhost
    );
    this.sprite.setOrigin(0.5);
    this.sprite.body.setSize(16, 16);
    this.sprite.name = name;

    // Créer les animations pour chaque direction
    this.createAnimations();
    this.sprite.play(`${name}_${startDir}`);

    this.move(startDir);
  }

  /**
   * Crée les animations du fantôme
   */
  createAnimations() {
    const offset = this.offsetGhost;

    // Animations normales (4 directions)
    this.sprite.anims.create({
      key: `${this.name}_${Phaser.LEFT}`,
      frames: [{ key: 'ghosts', frame: offset }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_${Phaser.UP}`,
      frames: [{ key: 'ghosts', frame: offset + 1 }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_${Phaser.DOWN}`,
      frames: [{ key: 'ghosts', frame: offset + 2 }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_${Phaser.RIGHT}`,
      frames: [{ key: 'ghosts', frame: offset + 3 }],
      frameRate: 10
    });

    // Animation frightened (bleue)
    this.sprite.anims.create({
      key: `${this.name}_frightened`,
      frames: this.sprite.anims.generateFrameNumbers('ghosts', {
        start: 16,
        end: 17
      }),
      frameRate: 10,
      repeat: -1
    });

    // Animations returning (yeux uniquement)
    this.sprite.anims.create({
      key: `${this.name}_returning_${Phaser.RIGHT}`,
      frames: [{ key: 'ghosts', frame: 20 }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_returning_${Phaser.LEFT}`,
      frames: [{ key: 'ghosts', frame: 21 }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_returning_${Phaser.UP}`,
      frames: [{ key: 'ghosts', frame: 22 }],
      frameRate: 10
    });
    this.sprite.anims.create({
      key: `${this.name}_returning_${Phaser.DOWN}`,
      frames: [{ key: 'ghosts', frame: 23 }],
      frameRate: 10
    });
  }

  /**
   * Update appelé chaque frame
   */
  update() {
    // Gérer les collisions sauf en mode returning
    if (this.mode !== this.MODE_RETURNING) {
      this.scene.physics.world.collide(this.sprite, this.scene.layer);
    }

    const time = this.scene.time.now;

    // Position sur la grille (snap to floor comme dans l'original)
    const x = Phaser.Math.Snap.Floor(Math.floor(this.sprite.x), this.gridSize) / this.gridSize;
    const y = Phaser.Math.Snap.Floor(Math.floor(this.sprite.y), this.gridSize) / this.gridSize;

    // Téléportation aux bords
    if (this.sprite.x < 0) {
      this.sprite.x = this.scene.map.widthInPixels - 2;
    }
    if (this.sprite.x >= this.scene.map.widthInPixels - 1) {
      this.sprite.x = 1;
    }

    // Update destination si en mode chase/scatter
    if (
      this.isAttacking &&
      (this.mode === this.MODE_SCATTER || this.mode === this.MODE_CHASE)
    ) {
      this.ghostDestination = this.getGhostDestination();
      this.mode = this.MODE_CHASE;
    }

    // Vérifie si on est au centre d'une case
    if (
      Phaser.Math.Fuzzy.Equal(
        x * this.gridSize + this.gridSize / 2,
        this.sprite.x,
        this.threshold
      ) &&
      Phaser.Math.Fuzzy.Equal(
        y * this.gridSize + this.gridSize / 2,
        this.sprite.y,
        this.threshold
      )
    ) {
      this.handleGridPosition(x, y, time);
    }
  }

  /**
   * Gère le comportement quand le fantôme est au centre d'une case
   */
  handleGridPosition(x, y, time) {
    // Récupérer les tiles autour
    const directions = this.getDirections(x, y);

    // Vérifier si on peut continuer dans la direction actuelle
    const canContinue = this.checkSafeTile(directions[this.currentDir]?.index);

    // Trouver toutes les sorties possibles (sauf demi-tour)
    const possibleExits = [];
    for (let q = 1; q < directions.length; q++) {
      if (
        this.checkSafeTile(directions[q]?.index) &&
        q !== this.opposites[this.currentDir]
      ) {
        possibleExits.push(q);
      }
    }

    // Comportement selon le mode
    switch (this.mode) {
      case this.MODE_AT_HOME:
        this.handleAtHome(x, y, canContinue);
        break;

      case this.MODE_EXIT_HOME:
        this.handleExitHome(x, y, canContinue);
        break;

      case this.MODE_FRIGHTENED:
        this.handleFrightened(x, y, time, possibleExits, canContinue);
        break;

      case this.MODE_CHASE:
        this.handleChase(x, y, time, possibleExits);
        break;

      case this.MODE_SCATTER:
        this.ghostDestination = this.scatterDestination.clone();
        this.mode = this.MODE_CHASE;
        break;

      case this.MODE_RETURNING:
        this.handleReturning(x, y, time);
        break;

      case this.MODE_STOP:
        this.move(Phaser.NONE);
        break;
    }
  }

  /**
   * Gère le mode AT_HOME (dans la maison)
   */
  handleAtHome(x, y, canContinue) {
    if (!canContinue) {
      const turnPoint = new Phaser.Math.Vector2(
        x * this.gridSize + this.gridSize / 2,
        14 * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);

      const dir = this.currentDir === Phaser.LEFT ? Phaser.RIGHT : Phaser.LEFT;
      this.move(dir);
    }
  }

  /**
   * Gère la sortie de la maison
   */
  handleExitHome(x, y, canContinue) {
    // Se déplacer vers x=13
    if (this.currentDir !== Phaser.UP && (x === 13 || x === 14)) {
      const turnPoint = new Phaser.Math.Vector2(
        13 * this.gridSize + this.gridSize / 2,
        y * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);
      this.move(Phaser.UP);
    }
    // Sortir par le haut
    else if (this.currentDir === Phaser.UP && y === 11) {
      const turnPoint = new Phaser.Math.Vector2(
        x * this.gridSize + this.gridSize / 2,
        y * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);
      this.safeTiles = [14];
      this.mode = this.scene.getCurrentMode();
      return;
    }
    // Aller-retour dans la maison
    else if (!canContinue) {
      const turnPoint = new Phaser.Math.Vector2(
        x * this.gridSize + this.gridSize / 2,
        y * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);
      const dir = this.currentDir === Phaser.LEFT ? Phaser.RIGHT : Phaser.LEFT;
      this.move(dir);
    }
  }

  /**
   * Mode Frightened (bleu, fuit aléatoirement)
   */
  handleFrightened(x, y, time, possibleExits, canContinue) {
    if (this.turnTimer < time && (possibleExits.length > 1 || !canContinue)) {
      const select = Math.floor(Math.random() * possibleExits.length);
      const newDirection = possibleExits[select];

      const turnPoint = new Phaser.Math.Vector2(
        x * this.gridSize + this.gridSize / 2,
        y * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);

      this.move(newDirection);
      this.turnTimer = time + this.TURNING_COOLDOWN;
    }
  }

  /**
   * Mode Chase (poursuite intelligente)
   */
  handleChase(x, y, time, possibleExits) {
    if (this.turnTimer >= time) return;

    let bestDecision = this.currentDir;
    let distanceToObj = 999999;

    // Tester chaque sortie possible
    for (const direction of possibleExits) {
      let decision;
      switch (direction) {
        case Phaser.LEFT:
          decision = new Phaser.Math.Vector2(
            (x - 1) * this.gridSize + this.gridSize / 2,
            y * this.gridSize + this.gridSize / 2
          );
          break;
        case Phaser.RIGHT:
          decision = new Phaser.Math.Vector2(
            (x + 1) * this.gridSize + this.gridSize / 2,
            y * this.gridSize + this.gridSize / 2
          );
          break;
        case Phaser.UP:
          decision = new Phaser.Math.Vector2(
            x * this.gridSize + this.gridSize / 2,
            (y - 1) * this.gridSize + this.gridSize / 2
          );
          break;
        case Phaser.DOWN:
          decision = new Phaser.Math.Vector2(
            x * this.gridSize + this.gridSize / 2,
            (y + 1) * this.gridSize + this.gridSize / 2
          );
          break;
      }

      const dist = Phaser.Math.Distance.Between(
        this.ghostDestination.x,
        this.ghostDestination.y,
        decision.x,
        decision.y
      );

      if (dist < distanceToObj) {
        bestDecision = direction;
        distanceToObj = dist;
      }
    }

    // Empêcher de monter dans certaines tiles spéciales
    if (this.scene.isSpecialTile(x, y) && bestDecision === Phaser.UP) {
      bestDecision = this.currentDir;
    }

    const turnPoint = new Phaser.Math.Vector2(
      x * this.gridSize + this.gridSize / 2,
      y * this.gridSize + this.gridSize / 2
    );
    this.sprite.setPosition(turnPoint.x, turnPoint.y);
    this.sprite.body.reset(turnPoint.x, turnPoint.y);

    this.move(bestDecision);
    this.turnTimer = time + this.TURNING_COOLDOWN;
  }

  /**
   * Mode Returning (retour à la maison après avoir été mangé)
   */
  handleReturning(x, y, time) {
    if (this.turnTimer >= time) return;

    // Navigation vers la maison
    this.sprite.body.reset(this.sprite.x, this.sprite.y);

    if (this.sprite.y < 14 * this.gridSize) {
      this.sprite.body.setVelocity(0, this.cruiseElroySpeed);
      this.sprite.play(`${this.name}_returning_${Phaser.DOWN}`, true);
    } else if (this.sprite.y > 15 * this.gridSize) {
      this.sprite.body.setVelocity(0, -this.cruiseElroySpeed);
      this.sprite.play(`${this.name}_returning_${Phaser.UP}`, true);
    } else if (this.sprite.x < 13 * this.gridSize) {
      this.sprite.body.setVelocity(this.cruiseElroySpeed, 0);
      this.sprite.play(`${this.name}_returning_${Phaser.RIGHT}`, true);
    } else if (this.sprite.x > 16 * this.gridSize) {
      this.sprite.body.setVelocity(-this.cruiseElroySpeed, 0);
      this.sprite.play(`${this.name}_returning_${Phaser.LEFT}`, true);
    }

    this.turnTimer = time + 100;

    // Vérifier si arrivé à la maison
    if (this.hasReachedHome()) {
      const turnPoint = new Phaser.Math.Vector2(
        x * this.gridSize + this.gridSize / 2,
        y * this.gridSize + this.gridSize / 2
      );
      this.sprite.setPosition(turnPoint.x, turnPoint.y);
      this.sprite.body.reset(turnPoint.x, turnPoint.y);
      this.mode = this.MODE_AT_HOME;
      this.scene.scheduleGhostExit(this);
    }
  }

  /**
   * Récupère les tiles dans les 4 directions
   */
  getDirections(x, y) {
    const directions = [null, null, null, null, null];
    const layer = this.scene.layer;
    directions[0] = this.scene.map.getTileAt(x, y, false, layer);
    directions[Phaser.LEFT] = this.scene.map.getTileAt(x - 1, y, false, layer);
    directions[Phaser.RIGHT] = this.scene.map.getTileAt(x + 1, y, false, layer);
    directions[Phaser.UP] = this.scene.map.getTileAt(x, y - 1, false, layer);
    directions[Phaser.DOWN] = this.scene.map.getTileAt(x, y + 1, false, layer);
    return directions;
  }

  /**
   * Vérifie si une tile est safe (traversable)
   */
  checkSafeTile(tileIndex) {
    if (tileIndex === undefined) return false;
    return this.safeTiles.includes(tileIndex);
  }

  /**
   * Déplace le fantôme dans une direction
   */
  move(dir) {
    this.currentDir = dir;

    let speed = this.ghostSpeed;

    // Ajuster la vitesse selon le mode
    if (this.scene.getCurrentMode() === this.MODE_SCATTER) {
      speed = this.ghostScatterSpeed;
    }
    if (this.mode === this.MODE_FRIGHTENED) {
      speed = this.ghostFrightenedSpeed;
    }
    if (this.mode === this.MODE_RETURNING) {
      speed = this.cruiseElroySpeed;
    }

    // Cruise Elroy (Blinky devient plus rapide)
    if (this.name === 'blinky' && this.scene.numDots < 20) {
      speed = this.cruiseElroySpeed;
      if (this.mode !== this.MODE_RETURNING && this.mode !== this.MODE_FRIGHTENED) {
        this.mode = this.MODE_CHASE;
      }
    }

    if (dir === Phaser.NONE) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    if (dir === Phaser.LEFT || dir === Phaser.UP) {
      speed = -speed;
    }

    if (dir === Phaser.LEFT || dir === Phaser.RIGHT) {
      this.sprite.body.setVelocityX(speed);
      this.sprite.body.setVelocityY(0);
    } else {
      this.sprite.body.setVelocityY(speed);
      this.sprite.body.setVelocityX(0);
    }

    // Jouer l'animation appropriée
    if (this.mode === this.MODE_RETURNING) {
      this.sprite.play(`${this.name}_returning_${dir}`, true);
    } else if (this.mode !== this.MODE_FRIGHTENED) {
      this.sprite.play(`${this.name}_${dir}`, true);
    }
  }

  /**
   * Calcule la destination du fantôme selon son type
   */
  getGhostDestination() {
    const pacmanPos = this.scene.pacman.getPosition();

    switch (this.name) {
      case 'blinky':
        // Blinky cible directement Pacman
        return pacmanPos;

      case 'pinky':
        // Pinky cible 4 cases devant Pacman
        const dir = this.scene.pacman.getCurrentDirection();
        let offsetX = 0;
        let offsetY = 0;

        if (dir === Phaser.LEFT || dir === Phaser.RIGHT) {
          offsetX = (dir === Phaser.RIGHT ? 4 : -4) * this.gridSize;
        }
        if (dir === Phaser.UP || dir === Phaser.DOWN) {
          offsetY = (dir === Phaser.DOWN ? 4 : -4) * this.gridSize;
        }

        return new Phaser.Math.Vector2(
          Phaser.Math.Clamp(
            pacmanPos.x + offsetX,
            this.gridSize / 2,
            this.scene.map.widthInPixels - this.gridSize / 2
          ),
          Phaser.Math.Clamp(
            pacmanPos.y + offsetY,
            this.gridSize / 2,
            this.scene.map.heightInPixels - this.gridSize / 2
          )
        );

      case 'inky':
        // Inky utilise Blinky pour calculer sa cible
        const blinkyPos = this.scene.blinky.getPosition();
        const diff = new Phaser.Math.Vector2(
          pacmanPos.x - blinkyPos.x,
          pacmanPos.y - blinkyPos.y
        );
        return new Phaser.Math.Vector2(
          Phaser.Math.Clamp(
            pacmanPos.x + diff.x,
            this.gridSize / 2,
            this.scene.map.widthInPixels - this.gridSize / 2
          ),
          Phaser.Math.Clamp(
            pacmanPos.y + diff.y,
            this.gridSize / 2,
            this.scene.map.heightInPixels - this.gridSize / 2
          )
        );

      case 'clyde':
        // Clyde est timide: si proche, il s'enfuit
        const clydePos = this.getPosition();
        const distance = Phaser.Math.Distance.Between(
          clydePos.x,
          clydePos.y,
          pacmanPos.x,
          pacmanPos.y
        );

        if (distance > 8 * this.gridSize) {
          return pacmanPos;
        } else {
          return this.scatterDestination.clone();
        }

      default:
        return this.scatterDestination.clone();
    }
  }

  /**
   * Retourne la position actuelle du fantôme
   */
  getPosition() {
    const x = Phaser.Math.Snap.Floor(Math.floor(this.sprite.x), this.gridSize) / this.gridSize;
    const y = Phaser.Math.Snap.Floor(Math.floor(this.sprite.y), this.gridSize) / this.gridSize;
    return new Phaser.Math.Vector2(
      x * this.gridSize + this.gridSize / 2,
      y * this.gridSize + this.gridSize / 2
    );
  }

  /**
   * Vérifie si le fantôme est revenu à la maison
   */
  hasReachedHome() {
    return (
      this.sprite.x >= 11 * this.gridSize &&
      this.sprite.x <= 16 * this.gridSize &&
      this.sprite.y >= 13 * this.gridSize &&
      this.sprite.y <= 15 * this.gridSize
    );
  }

  /**
   * Passe en mode attack (chase)
   */
  attack() {
    if (this.mode !== this.MODE_RETURNING) {
      this.isAttacking = true;
      if (this.mode !== this.MODE_AT_HOME && this.mode !== this.MODE_EXIT_HOME) {
        // Faire demi-tour
        this.currentDir = this.opposites[this.currentDir];
      }
    }
  }

  /**
   * Passe en mode scatter
   */
  scatter() {
    if (this.mode !== this.MODE_RETURNING) {
      this.isAttacking = false;
      if (this.mode !== this.MODE_AT_HOME && this.mode !== this.MODE_EXIT_HOME) {
        this.mode = this.MODE_SCATTER;
      }
    }
  }

  /**
   * Passe en mode frightened (apeuré)
   */
  enterFrightenedMode() {
    if (
      this.mode !== this.MODE_AT_HOME &&
      this.mode !== this.MODE_EXIT_HOME &&
      this.mode !== this.MODE_RETURNING
    ) {
      this.sprite.play(`${this.name}_frightened`);
      this.mode = this.MODE_FRIGHTENED;
      this.isAttacking = false;
    }
  }

  /**
   * Réinitialise les safe tiles
   */
  resetSafeTiles() {
    this.safeTiles = [14, 35, 36];
  }

  /**
   * Stop le fantôme
   */
  stop() {
    this.mode = this.MODE_STOP;
  }
}
