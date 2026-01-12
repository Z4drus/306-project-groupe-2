/**
 * PowerUpController - Contrôleur des power-ups
 *
 * Gère la création, le mouvement, la collecte et l'application des power-ups
 */

import PowerUpModel, { PowerUpCollection, ActiveEffectsManager } from '../models/PowerUpModel.js';
import { PowerUpViewManager } from '../views/PowerUpView.js';
import { POWER_UP_TYPES, POWER_UP_CONFIG, selectRandomPowerUp, shouldDropPowerUp } from '../config/PowerUpConfig.js';
import { PADDLE_CONFIG } from '../config/GameConfig.js';

export default class PowerUpController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {PaddleController} paddleController - Contrôleur du paddle
   */
  constructor(scene, paddleController) {
    this.scene = scene;
    this.paddleController = paddleController;

    // Collections et gestionnaires
    this.powerUpCollection = new PowerUpCollection();
    this.viewManager = new PowerUpViewManager(scene);
    this.activeEffects = new ActiveEffectsManager();

    // État original du paddle (pour restaurer après effets)
    this.originalPaddleWidth = PADDLE_CONFIG.width;

    // Callbacks
    this.onPowerUpCollected = null;
    this.onEffectActivated = null;
    this.onEffectExpired = null;
    this.onMultiBallRequest = null;
    this.onExtraLife = null;
    this.onRandomDestroy = null;
    this.onLaserActivated = null;

    // État
    this.isInitialized = false;
  }

  /**
   * Initialise le contrôleur
   */
  initialize() {
    this.viewManager.create();

    // Configurer le callback d'expiration des effets
    this.activeEffects.setExpireCallback((effectId, value) => {
      this.handleEffectExpired(effectId, value);
    });

    this.isInitialized = true;
  }

  /**
   * Fait apparaître un power-up à une position donnée (quand une brique est détruite)
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {boolean} forceSpawn - Force l'apparition (ignore la probabilité)
   * @returns {PowerUpModel|null}
   */
  spawnPowerUp(x, y, forceSpawn = false) {
    // Vérifier si on doit faire apparaître un power-up
    if (!forceSpawn && !shouldDropPowerUp()) {
      return null;
    }

    // Sélectionner un type aléatoire
    const type = selectRandomPowerUp();
    if (!type) return null;

    // Créer le modèle
    const model = new PowerUpModel({
      x,
      y,
      type
    });

    // Ajouter à la collection
    this.powerUpCollection.add(model);

    // Créer la vue
    this.viewManager.addPowerUp(model);

    return model;
  }

  /**
   * Met à jour tous les power-ups
   * @param {number} delta - Delta temps en ms
   */
  update(delta) {
    if (!this.isInitialized) return;

    // Mettre à jour la position des power-ups
    this.powerUpCollection.update(delta);

    // Mettre à jour les vues
    this.viewManager.update();

    // Vérifier les collisions avec le paddle
    this.checkPaddleCollisions();

    // Nettoyer les power-ups sortis de l'écran
    this.cleanupInactivePowerUps();
  }

  /**
   * Vérifie les collisions entre power-ups et paddle
   */
  checkPaddleCollisions() {
    const paddleModel = this.paddleController.getModel();
    const paddleBounds = {
      left: paddleModel.x - paddleModel.width / 2,
      right: paddleModel.x + paddleModel.width / 2,
      top: paddleModel.y - paddleModel.height / 2,
      bottom: paddleModel.y + paddleModel.height / 2
    };

    const activePowerUps = this.powerUpCollection.getActive();

    for (const powerUp of activePowerUps) {
      if (powerUp.checkPaddleCollision(paddleBounds)) {
        this.collectPowerUp(powerUp);
      }
    }
  }

  /**
   * Collecte un power-up
   * @param {PowerUpModel} powerUp
   */
  collectPowerUp(powerUp) {
    if (powerUp.isCollected) return;

    powerUp.collect();

    // Jouer l'animation de collecte
    this.viewManager.playCollectAnimation(powerUp.id, () => {
      // Appliquer l'effet
      this.applyPowerUpEffect(powerUp.type);
    });

    // Callback
    if (this.onPowerUpCollected) {
      this.onPowerUpCollected(powerUp.type);
    }
  }

  /**
   * Applique l'effet d'un power-up
   * @param {Object} type - Type de power-up
   */
  applyPowerUpEffect(type) {
    if (!type) return;

    switch (type.effect) {
      case 'spawn_balls':
        this.handleMultiBall(type.effectValue);
        break;

      case 'ball_speed':
        this.handleBallSpeed(type);
        break;

      case 'paddle_size':
        this.handlePaddleSize(type);
        break;

      case 'extra_life':
        this.handleExtraLife();
        break;

      case 'destroyer':
        this.handleDestroyer(type);
        break;

      case 'laser':
        this.handleLaser(type);
        break;

      case 'magnet':
        this.handleMagnet(type);
        break;

      case 'random_destroy':
        this.handleRandomDestroy(type.effectValue);
        break;

      case 'score_multiplier':
        this.handleScoreMultiplier(type);
        break;
    }

    // Callback d'activation
    if (this.onEffectActivated) {
      this.onEffectActivated(type.id, type.duration);
    }
  }

  /**
   * Gère le power-up multi-balle
   * @param {number} count - Nombre de balles à ajouter
   */
  handleMultiBall(count) {
    if (this.onMultiBallRequest) {
      this.onMultiBallRequest(count);
    }
  }

  /**
   * Gère le power-up de vitesse de balle
   * @param {Object} type
   */
  handleBallSpeed(type) {
    this.activeEffects.activate('ball_speed', type.duration, type.effectValue);
  }

  /**
   * Gère le power-up de taille du paddle
   * @param {Object} type
   */
  handlePaddleSize(type) {
    const currentEffect = this.activeEffects.getValue('paddle_size');

    // Activer le nouvel effet
    this.activeEffects.activate('paddle_size', type.duration, type.effectValue);

    // Appliquer la nouvelle taille
    const newWidth = this.originalPaddleWidth * type.effectValue;
    this.paddleController.setWidth(newWidth);
  }

  /**
   * Gère le power-up vie supplémentaire
   */
  handleExtraLife() {
    if (this.onExtraLife) {
      this.onExtraLife();
    }
  }

  /**
   * Gère le power-up destructeur
   * @param {Object} type
   */
  handleDestroyer(type) {
    this.activeEffects.activate('destroyer', type.duration, true);
  }

  /**
   * Gère le power-up laser
   * @param {Object} type
   */
  handleLaser(type) {
    this.activeEffects.activate('laser', type.duration, true);
    if (this.onLaserActivated) {
      this.onLaserActivated(true);
    }
  }

  /**
   * Gère le power-up aimant
   * @param {Object} type
   */
  handleMagnet(type) {
    this.activeEffects.activate('magnet', type.duration, true);
  }

  /**
   * Gère le power-up de destruction aléatoire
   * @param {number} count - Nombre de briques à détruire
   */
  handleRandomDestroy(count) {
    if (this.onRandomDestroy) {
      this.onRandomDestroy(count);
    }
  }

  /**
   * Gère le multiplicateur de score
   * @param {Object} type
   */
  handleScoreMultiplier(type) {
    this.activeEffects.activate('score_multiplier', type.duration, type.effectValue);
  }

  /**
   * Gère l'expiration d'un effet
   * @param {string} effectId
   * @param {*} value
   */
  handleEffectExpired(effectId, value) {
    switch (effectId) {
      case 'paddle_size':
        // Restaurer la taille originale
        this.paddleController.setWidth(this.originalPaddleWidth);
        break;

      case 'laser':
        if (this.onLaserActivated) {
          this.onLaserActivated(false);
        }
        break;
    }

    // Callback
    if (this.onEffectExpired) {
      this.onEffectExpired(effectId);
    }
  }

  /**
   * Nettoie les power-ups inactifs
   */
  cleanupInactivePowerUps() {
    const toRemove = [];
    this.powerUpCollection.powerUps.forEach(powerUp => {
      if (!powerUp.isActive && !powerUp.isCollected) {
        toRemove.push(powerUp.id);
      }
    });

    toRemove.forEach(id => {
      this.viewManager.removePowerUp(id);
    });
  }

  /**
   * Vérifie si l'effet destructeur est actif
   * @returns {boolean}
   */
  isDestroyerActive() {
    return this.activeEffects.isActive('destroyer');
  }

  /**
   * Vérifie si l'effet aimant est actif
   * @returns {boolean}
   */
  isMagnetActive() {
    return this.activeEffects.isActive('magnet');
  }

  /**
   * Retourne le multiplicateur de score actuel
   * @returns {number}
   */
  getScoreMultiplier() {
    const multiplier = this.activeEffects.getValue('score_multiplier');
    return multiplier || 1;
  }

  /**
   * Retourne le multiplicateur de vitesse de balle
   * @returns {number}
   */
  getBallSpeedMultiplier() {
    const multiplier = this.activeEffects.getValue('ball_speed');
    return multiplier || 1;
  }

  /**
   * Vérifie si le laser est actif
   * @returns {boolean}
   */
  isLaserActive() {
    return this.activeEffects.isActive('laser');
  }

  /**
   * Retourne tous les effets actifs (pour le HUD)
   * @returns {Array<Object>}
   */
  getActiveEffects() {
    return this.activeEffects.getAllActive();
  }

  /**
   * Réinitialise les power-ups (nouveau niveau)
   */
  resetForNewLevel() {
    // Vider les power-ups en cours de chute
    this.powerUpCollection.clear();
    this.viewManager.clear();

    // Ne pas supprimer les effets actifs (ils continuent au niveau suivant)
  }

  /**
   * Réinitialise complètement (game over ou nouvelle partie)
   */
  fullReset() {
    this.powerUpCollection.clear();
    this.viewManager.clear();
    this.activeEffects.clear();

    // Restaurer le paddle
    this.paddleController.setWidth(this.originalPaddleWidth);
  }

  /**
   * Définit les callbacks
   */
  setPowerUpCollectedCallback(callback) {
    this.onPowerUpCollected = callback;
  }

  setEffectActivatedCallback(callback) {
    this.onEffectActivated = callback;
  }

  setEffectExpiredCallback(callback) {
    this.onEffectExpired = callback;
  }

  setMultiBallCallback(callback) {
    this.onMultiBallRequest = callback;
  }

  setExtraLifeCallback(callback) {
    this.onExtraLife = callback;
  }

  setRandomDestroyCallback(callback) {
    this.onRandomDestroy = callback;
  }

  setLaserCallback(callback) {
    this.onLaserActivated = callback;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.powerUpCollection.clear();
    this.viewManager.destroy();
    this.activeEffects.destroy();
    this.isInitialized = false;
  }
}
