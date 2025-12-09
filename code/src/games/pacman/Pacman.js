/**
 * Classe Pacman - Joueur contrôlable
 *
 * Gère le mouvement, les animations et les collisions du joueur
 */

import Phaser from 'phaser';

export default class Pacman {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 16;
    this.speed = 150;
    this.isDead = false;
    this.isAnimatingDeath = false;

    // Directions
    this.current = Phaser.NONE;
    this.turning = Phaser.NONE;
    this.want2go = Phaser.NONE;

    // Grid tracking
    this.marker = new Phaser.Math.Vector2();
    this.turnPoint = new Phaser.Math.Vector2();
    this.threshold = 6;

    // Safe tiles (où Pacman peut aller)
    this.safeTile = 14;
    this.opposites = [
      Phaser.NONE,
      Phaser.RIGHT,
      Phaser.LEFT,
      Phaser.DOWN,
      Phaser.UP
    ];

    // Créer le sprite à la position de départ (14, 17)
    this.sprite = scene.physics.add.sprite(
      14 * this.gridSize + 8,
      17 * this.gridSize + 8,
      'pacman',
      0
    );
    this.sprite.setOrigin(0.5);
    this.sprite.body.setSize(16, 16);

    // Animations
    this.sprite.anims.create({
      key: 'munch',
      frames: this.sprite.anims.generateFrameNumbers('pacman', {
        start: 0,
        end: 2
      }),
      frameRate: 20,
      repeat: -1,
      yoyo: true
    });

    this.sprite.anims.create({
      key: 'death',
      frames: this.sprite.anims.generateFrameNumbers('pacman', {
        start: 3,
        end: 13
      }),
      frameRate: 10,
      repeat: 0
    });

    this.sprite.play('munch');
    this.move(Phaser.LEFT);
  }

  /**
   * Déplace Pacman dans une direction
   */
  move(direction) {
    if (direction === Phaser.NONE) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    let speed = this.speed;

    if (direction === Phaser.LEFT || direction === Phaser.UP) {
      speed = -speed;
    }

    if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
      this.sprite.body.setVelocityX(speed);
      this.sprite.body.setVelocityY(0);
    } else {
      this.sprite.body.setVelocityY(speed);
      this.sprite.body.setVelocityX(0);
    }

    // Orientation du sprite
    this.sprite.setScale(1);
    this.sprite.setAngle(0);

    if (direction === Phaser.LEFT) {
      this.sprite.setScale(-1, 1);
    } else if (direction === Phaser.UP) {
      this.sprite.setAngle(270);
    } else if (direction === Phaser.DOWN) {
      this.sprite.setAngle(90);
    }

    this.current = direction;
  }

  /**
   * Update appelé chaque frame
   */
  update() {
    if (this.isDead) {
      this.move(Phaser.NONE);
      if (!this.isAnimatingDeath) {
        this.sprite.play('death');
        this.isAnimatingDeath = true;
        // Après l'animation, détruire le jeu
        this.sprite.once('animationcomplete', () => {
          this.scene.gameOver();
        });
      }
      return;
    }

    // Calculer la position sur la grille (snap to floor comme dans l'original)
    this.marker.x = Phaser.Math.Snap.Floor(Math.floor(this.sprite.x), this.gridSize) / this.gridSize;
    this.marker.y = Phaser.Math.Snap.Floor(Math.floor(this.sprite.y), this.gridSize) / this.gridSize;

    // Téléportation aux bords
    if (this.marker.x < 0) {
      this.sprite.x = this.scene.map.widthInPixels - 1;
    }
    if (this.marker.x >= this.scene.map.width) {
      this.sprite.x = 1;
    }

    // Tourner si nécessaire
    if (this.turning !== Phaser.NONE) {
      this.turn();
    }
  }

  /**
   * Vérifie les touches du clavier
   */
  checkKeys(cursors) {
    if (this.isDead) return;

    if (cursors.left.isDown && this.current !== Phaser.LEFT) {
      this.want2go = Phaser.LEFT;
    } else if (cursors.right.isDown && this.current !== Phaser.RIGHT) {
      this.want2go = Phaser.RIGHT;
    } else if (cursors.up.isDown && this.current !== Phaser.UP) {
      this.want2go = Phaser.UP;
    } else if (cursors.down.isDown && this.current !== Phaser.DOWN) {
      this.want2go = Phaser.DOWN;
    }

    this.checkDirection(this.want2go);
  }

  /**
   * Tourne Pacman vers la direction voulue
   */
  turn() {
    const cx = Math.floor(this.sprite.x);
    const cy = Math.floor(this.sprite.y);

    if (
      !Phaser.Math.Fuzzy.Equal(cx, this.turnPoint.x, this.threshold) ||
      !Phaser.Math.Fuzzy.Equal(cy, this.turnPoint.y, this.threshold)
    ) {
      return false;
    }

    // Aligner sur la grille
    this.sprite.x = this.turnPoint.x;
    this.sprite.y = this.turnPoint.y;
    this.sprite.body.reset(this.turnPoint.x, this.turnPoint.y);

    this.move(this.turning);
    this.turning = Phaser.NONE;

    return true;
  }

  /**
   * Vérifie si on peut tourner dans une direction
   */
  checkDirection(turnTo) {
    if (turnTo === Phaser.NONE) return;

    // Récupérer les tiles dans toutes les directions
    const directions = [null, null, null, null, null];
    const layer = this.scene.layer;

    directions[Phaser.LEFT] = this.scene.map.getTileAt(
      this.marker.x - 1,
      this.marker.y,
      false,
      layer
    );
    directions[Phaser.RIGHT] = this.scene.map.getTileAt(
      this.marker.x + 1,
      this.marker.y,
      false,
      layer
    );
    directions[Phaser.UP] = this.scene.map.getTileAt(
      this.marker.x,
      this.marker.y - 1,
      false,
      layer
    );
    directions[Phaser.DOWN] = this.scene.map.getTileAt(
      this.marker.x,
      this.marker.y + 1,
      false,
      layer
    );

    if (
      this.turning === turnTo ||
      !directions[turnTo] ||
      directions[turnTo].index !== this.safeTile
    ) {
      return;
    }

    // Demi-tour instantané
    if (this.current === this.opposites[turnTo]) {
      this.move(turnTo);
    } else {
      this.turning = turnTo;
      this.turnPoint.x = this.marker.x * this.gridSize + this.gridSize / 2;
      this.turnPoint.y = this.marker.y * this.gridSize + this.gridSize / 2;
      this.want2go = Phaser.NONE;
    }
  }

  /**
   * Retourne la position de Pacman
   */
  getPosition() {
    return new Phaser.Math.Vector2(
      this.marker.x * this.gridSize + this.gridSize / 2,
      this.marker.y * this.gridSize + this.gridSize / 2
    );
  }

  /**
   * Retourne la direction actuelle
   */
  getCurrentDirection() {
    return this.current;
  }

  /**
   * Tue Pacman
   */
  kill() {
    this.isDead = true;
  }
}
