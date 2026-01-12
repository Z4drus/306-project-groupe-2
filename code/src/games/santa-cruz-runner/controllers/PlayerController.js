/**
 * PlayerController - Contrôleur du joueur
 *
 * Gère la logique de mouvement et de saut du joueur
 */

import { GAME_HEIGHT, PLAYER_CONFIG } from '../config/GameConfig.js';

export default class PlayerController {
  /**
   * @param {PlayerModel} model - Modèle du joueur
   * @param {PlayerView} view - Vue du joueur
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(model, view, scene) {
    this.model = model;
    this.view = view;
    this.scene = scene;

    // Son de saut
    this.jumpSound = null;

    // Callbacks
    this.onDeath = null;
  }

  /**
   * Initialise le contrôleur
   */
  initialize() {
    // Charger le son de saut
    try {
      this.jumpSound = this.scene.sound.add('jump-sound', { volume: 0.3 });
    } catch (e) {
      // Ignorer les erreurs audio
    }
  }

  /**
   * Met à jour le joueur
   * @param {number} delta - Delta time en ms
   */
  update(delta) {
    if (this.model.isDead) return;

    const sprite = this.view.getSprite();
    if (!sprite) return;

    // Mettre à jour l'invincibilité
    this.model.updateInvincibility(delta);

    // Synchroniser la position du modèle avec le sprite physique
    this.model.x = sprite.x;
    this.model.y = sprite.y;
    this.model.velocityY = sprite.body.velocity.y;

    // Vérifier si le joueur est au sol
    const wasOnGround = this.model.isOnGround;
    this.model.isOnGround = sprite.body.touching.down || sprite.body.blocked.down;

    // Si on vient d'atterrir
    if (!wasOnGround && this.model.isOnGround) {
      this.model.land();
    }
    // Si on quitte le sol sans avoir sauté (sauf si protection respawn active)
    else if (wasOnGround && !this.model.isOnGround && this.model.velocityY > 0 && !this.model.respawnProtection) {
      // On est tombé d'une plateforme
      this.model.jumpsRemaining = Math.min(this.model.jumpsRemaining, this.model.maxJumps - 1);
    }

    // Mettre à jour l'état
    this.model.updateState();

    // Mettre à jour la vue
    this.view.update();

    // Vérifier si le joueur est tombé hors de l'écran
    this.checkFallDeath();
  }

  /**
   * Fait sauter le joueur
   * @returns {boolean} True si le saut a été effectué
   */
  jump() {
    if (this.model.canJump()) {
      const isDoubleJump = !this.model.isOnGround && this.model.jumpsRemaining < this.model.maxJumps;

      // Effectuer le saut dans le modèle
      if (this.model.jump()) {
        // Appliquer la vélocité au sprite
        const sprite = this.view.getSprite();
        if (sprite) {
          sprite.body.velocity.y = this.model.velocityY;
        }

        // Jouer le son
        this.playJumpSound();

        // Effet visuel
        if (isDoubleJump) {
          this.view.playDoubleJumpEffect();
        } else {
          this.view.playJumpEffect();
        }

        return true;
      }
    }
    return false;
  }

  /**
   * Joue le son de saut
   */
  playJumpSound() {
    if (this.jumpSound && !this.jumpSound.isPlaying) {
      this.jumpSound.play();
    }
  }

  /**
   * Vérifie si le joueur est tombé hors de l'écran
   */
  checkFallDeath() {
    // Détection rapide dès que le joueur dépasse le bas de l'écran
    if (this.model.y > GAME_HEIGHT + 20) {
      this.die();
    }
  }

  /**
   * Fait mourir le joueur
   */
  die() {
    if (this.model.isDead) return;

    this.model.die();

    // Jouer l'animation de mort
    this.view.playDeathAnimation(() => {
      if (this.onDeath) {
        this.onDeath();
      }
    });
  }

  /**
   * Inflige des dégâts au joueur
   * @returns {boolean} True si le joueur est mort
   */
  takeDamage() {
    if (this.model.isInvincible || this.model.isDead) return false;

    // Le joueur devient invincible temporairement
    this.model.setInvincible(2000);

    // Notifier le game state
    if (this.onDeath) {
      this.onDeath();
      return true;
    }

    return false;
  }

  /**
   * Réinitialise le joueur
   * @param {Object} position - Position optionnelle {x, y, platform} pour le respawn
   */
  reset(position = null) {
    this.model.reset();

    const sprite = this.view.getSprite();
    if (sprite) {
      // Utiliser la position fournie ou la position par défaut
      sprite.x = position?.x ?? PLAYER_CONFIG.startX;
      sprite.y = position?.y ?? PLAYER_CONFIG.startY;
      sprite.body.velocity.y = 0;
      sprite.body.velocity.x = 0;

      // Désactiver la gravité en attendant le démarrage du jeu
      // Sera réactivée par enableGravity()
      sprite.body.setGravityY(0);
    }

    // Mettre à jour le modèle avec la nouvelle position
    this.model.x = sprite?.x ?? PLAYER_CONFIG.startX;
    this.model.y = sprite?.y ?? PLAYER_CONFIG.startY;

    // Forcer l'état au sol si on respawn sur une plateforme
    if (position?.platform) {
      this.model.isOnGround = true;
      this.model.jumpsRemaining = this.model.maxJumps;
      this.model.updateState();
    }

    this.view.reset();
  }

  /**
   * Active la gravité du joueur (appelé au démarrage du jeu)
   */
  enableGravity() {
    const sprite = this.view.getSprite();
    if (sprite && sprite.body) {
      sprite.body.setGravityY(PLAYER_CONFIG.gravity);
    }
  }

  /**
   * Définit le callback de mort
   * @param {Function} callback
   */
  setDeathCallback(callback) {
    this.onDeath = callback;
  }

  /**
   * Retourne le sprite pour les collisions
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.view.getSprite();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    if (this.jumpSound) {
      this.jumpSound.destroy();
    }
  }
}
