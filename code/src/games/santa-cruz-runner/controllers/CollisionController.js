/**
 * CollisionController - Contrôleur des collisions
 *
 * Gère toutes les collisions entre le joueur et les autres éléments
 */

import { PLATFORM_CONFIG } from '../config/GameConfig.js';

export default class CollisionController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PlayerController} playerController
   * @param {PlatformController} platformController
   * @param {CollectibleController} collectibleController
   */
  constructor(scene, playerController, platformController, collectibleController) {
    this.scene = scene;
    this.playerController = playerController;
    this.platformController = platformController;
    this.collectibleController = collectibleController;

    // Colliders Phaser
    this.platformCollider = null;

    // Dernière plateforme sur laquelle le joueur a atterri
    this.lastLandedPlatform = null;

    // Callbacks
    this.onCollectItem = null;
    this.onLandOnPlatform = null;
  }

  /**
   * Initialise les collisions
   */
  initialize() {
    // Collision joueur-plateformes
    const playerSprite = this.playerController.getSprite();
    const platformGroup = this.platformController.getGroup();

    if (playerSprite && platformGroup) {
      this.platformCollider = this.scene.physics.add.collider(
        playerSprite,
        platformGroup,
        this.handlePlatformCollision.bind(this)
      );
    }
  }

  /**
   * Met à jour les collisions
   * @param {number} delta - Delta time
   */
  update(delta) {
    // Vérifier les collisions avec les collectibles manuellement
    // (car ils utilisent des Graphics, pas des Sprites avec physique)
    this.checkCollectibleCollisions();

    // Correction anti-tunneling : vérifier si le joueur devrait être sur une plateforme
    this.checkMissedPlatformCollision();
  }

  /**
   * Vérifie si le joueur est passé à travers une plateforme (anti-tunneling)
   * Corrige la position si nécessaire
   */
  checkMissedPlatformCollision() {
    const playerSprite = this.playerController.getSprite();
    if (!playerSprite || !playerSprite.body) return;

    const playerModel = this.playerController.model;
    if (playerModel.isDead || playerModel.isOnGround) return;

    // Seulement si le joueur descend
    if (playerSprite.body.velocity.y <= 0) return;

    const playerBounds = {
      x: playerSprite.x - playerSprite.body.halfWidth,
      y: playerSprite.y - playerSprite.body.halfHeight,
      width: playerSprite.body.width,
      height: playerSprite.body.height,
      bottom: playerSprite.y + playerSprite.body.halfHeight
    };

    const activePlatforms = this.platformController.getActivePlatforms();

    for (const platform of activePlatforms) {
      if (!platform.isActive || platform.isCrumbling) continue;

      // Vérifier si le joueur est horizontalement au-dessus de la plateforme
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;
      const playerCenterX = playerSprite.x;

      if (playerCenterX < platformLeft || playerCenterX > platformRight) continue;

      // Vérifier si le bas du joueur est légèrement dans ou sous le haut de la plateforme
      const platformTop = platform.y;
      const tolerance = PLATFORM_CONFIG.height + 10;

      if (playerBounds.bottom >= platformTop && playerBounds.bottom <= platformTop + tolerance) {
        // Le joueur devrait être sur cette plateforme - corriger la position
        playerSprite.y = platformTop - playerSprite.body.halfHeight;
        playerSprite.body.velocity.y = 0;
        playerSprite.body.touching.down = true;
        playerSprite.body.blocked.down = true;

        // Notifier l'atterrissage
        this.lastLandedPlatform = platform;
        if (this.onLandOnPlatform) {
          this.onLandOnPlatform(platform);
        }
        break;
      }
    }
  }

  /**
   * Gère la collision avec une plateforme
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {Phaser.Physics.Arcade.Sprite} platform
   */
  handlePlatformCollision(player, platform) {
    // Récupérer le modèle de la plateforme
    const platformModel = platform.getData('model');

    if (!platformModel) return;

    // Si le joueur est sur la plateforme (touche par le bas)
    if (player.body.touching.down) {
      // Mémoriser cette plateforme comme dernier point d'atterrissage
      // Seulement si elle n'est pas en train de s'effondrer
      if (!platformModel.isCrumbling) {
        this.lastLandedPlatform = platformModel;
      }

      // Si c'est une plateforme qui s'effondre
      if (platformModel.canCrumble()) {
        platformModel.startCrumbling();
      }

      // Notifier l'atterrissage
      if (this.onLandOnPlatform) {
        this.onLandOnPlatform(platformModel);
      }
    }
  }

  /**
   * Vérifie les collisions avec les collectibles
   */
  checkCollectibleCollisions() {
    const playerModel = this.playerController.model;
    if (playerModel.isDead) return;

    const playerBounds = playerModel.getBounds();
    const activeCollectibles = this.collectibleController.getActiveCollectibles();

    for (const collectible of activeCollectibles) {
      if (!collectible.isActive) continue;

      const collectibleBounds = collectible.getBounds();

      // Vérifier l'intersection
      if (this.boundsIntersect(playerBounds, collectibleBounds)) {
        // Collecter l'item
        const result = this.collectibleController.collect(collectible);

        if (result && this.onCollectItem) {
          this.onCollectItem(result);
        }
      }
    }
  }

  /**
   * Vérifie si deux rectangles se croisent
   * @param {Object} a - Premier rectangle
   * @param {Object} b - Deuxième rectangle
   * @returns {boolean}
   */
  boundsIntersect(a, b) {
    return a.x < b.right &&
           a.right > b.x &&
           a.y < b.bottom &&
           a.bottom > b.y;
  }

  /**
   * Définit le callback de collecte
   * @param {Function} callback
   */
  setCollectItemCallback(callback) {
    this.onCollectItem = callback;
  }

  /**
   * Définit le callback d'atterrissage
   * @param {Function} callback
   */
  setLandOnPlatformCallback(callback) {
    this.onLandOnPlatform = callback;
  }

  /**
   * Reconfigure les collisions (après changement de niveau par exemple)
   */
  reconfigure() {
    // Recréer le collider si nécessaire
    if (this.platformCollider) {
      this.platformCollider.destroy();
    }

    const playerSprite = this.playerController.getSprite();
    const platformGroup = this.platformController.getGroup();

    if (playerSprite && platformGroup) {
      this.platformCollider = this.scene.physics.add.collider(
        playerSprite,
        platformGroup,
        this.handlePlatformCollision.bind(this)
      );
    }
  }

  /**
   * Retourne la dernière plateforme sur laquelle le joueur a atterri
   * @returns {PlatformModel|null}
   */
  getLastLandedPlatform() {
    return this.lastLandedPlatform;
  }

  /**
   * Calcule la meilleure position de respawn pour le joueur
   * @param {number} playerHeight - Hauteur du joueur
   * @returns {Object} Position {x, y} pour le respawn
   */
  getRespawnPosition(playerHeight = 52) {
    const activePlatforms = this.platformController.getActivePlatforms();
    const minX = 50; // Marge minimale depuis le bord gauche
    const maxX = 250; // Position X maximale pour le respawn (laisser de la marge)
    const marginOnPlatform = 40; // Marge depuis le bord gauche de la plateforme

    // Vérifier si la dernière plateforme est toujours valide et visible
    if (this.lastLandedPlatform && this.lastLandedPlatform.isActive) {
      const platform = this.lastLandedPlatform;

      // Vérifier si la plateforme est encore dans une zone jouable
      if (platform.x < maxX + 100 && platform.x + platform.width > minX) {
        // Calculer la position X (au début de la plateforme + marge)
        const respawnX = Math.max(platform.x + marginOnPlatform, minX);
        // S'assurer qu'on est bien sur la plateforme
        const clampedX = Math.min(respawnX, platform.x + platform.width - marginOnPlatform);
        // Position Y : exactement sur la plateforme (bord inférieur du joueur = bord supérieur plateforme)
        const respawnY = platform.y - playerHeight / 2;

        return { x: clampedX, y: respawnY, platform };
      }
    }

    // Sinon, chercher la meilleure plateforme visible
    let bestPlatform = null;
    let bestScore = -Infinity;

    for (const platform of activePlatforms) {
      if (!platform.isActive || platform.isCrumbling) continue;

      // La plateforme doit être visible à l'écran
      if (platform.x + platform.width < minX || platform.x > 600) continue;

      // Score basé sur : position X basse (à gauche) et largeur grande
      const score = -platform.x + platform.width * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestPlatform = platform;
      }
    }

    if (bestPlatform) {
      const respawnX = Math.max(bestPlatform.x + marginOnPlatform, minX);
      const clampedX = Math.min(respawnX, bestPlatform.x + bestPlatform.width - marginOnPlatform);
      const respawnY = bestPlatform.y - playerHeight / 2;

      return { x: clampedX, y: respawnY, platform: bestPlatform };
    }

    // Fallback : position par défaut (ne devrait normalement pas arriver)
    return { x: 150, y: 400, platform: null };
  }

  /**
   * Réinitialise la dernière plateforme mémorisée
   */
  resetLastLandedPlatform() {
    this.lastLandedPlatform = null;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    if (this.platformCollider) {
      this.platformCollider.destroy();
      this.platformCollider = null;
    }
    this.lastLandedPlatform = null;
  }
}
