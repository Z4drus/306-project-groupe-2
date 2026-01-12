/**
 * MultiBallManager - Gestionnaire multi-balles
 *
 * Gère plusieurs balles simultanément pour le power-up multi-balle
 */

import BallModel from '../models/BallModel.js';
import BallView from '../views/BallView.js';
import BallController from './BallController.js';
import { PLAY_AREA } from '../config/GameConfig.js';

export default class MultiBallManager {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {BallController} primaryBallController - Contrôleur de la balle principale
   */
  constructor(scene, primaryBallController) {
    this.scene = scene;
    this.primaryBallController = primaryBallController;

    // Liste des balles supplémentaires
    this.extraBalls = [];

    // Callbacks
    this.onAllBallsLost = null;
    this.onBallLost = null;

    // État
    this.isInitialized = false;
  }

  /**
   * Initialise le gestionnaire
   */
  initialize() {
    this.isInitialized = true;
  }

  /**
   * Ajoute des balles supplémentaires
   * @param {number} count - Nombre de balles à ajouter
   */
  spawnExtraBalls(count) {
    const primaryModel = this.primaryBallController.getModel();
    const primarySprite = this.primaryBallController.getSprite();

    if (!primaryModel.isActive) return;

    for (let i = 0; i < count; i++) {
      // Créer un nouveau modèle de balle
      const model = new BallModel({
        x: primaryModel.x,
        y: primaryModel.y,
        speed: primaryModel.currentSpeed
      });

      // Créer la vue
      const view = new BallView(this.scene, model);
      view.create();

      // Créer le contrôleur
      const controller = new BallController(model, view, this.scene);
      controller.initialize();

      // Lancer la balle avec un angle légèrement différent
      const angleOffset = ((i + 1) * 30 - 15) * (Math.PI / 180);
      const baseAngle = Math.atan2(primaryModel.velocityY, primaryModel.velocityX);
      model.launch(baseAngle + angleOffset);

      // Synchroniser avec Phaser
      const sprite = view.getSprite();
      if (sprite) {
        sprite.body.velocity.x = model.velocityX;
        sprite.body.velocity.y = model.velocityY;
      }

      // Callback de perte de balle
      controller.setBallLostCallback(() => {
        this.handleExtraBallLost(controller);
      });

      this.extraBalls.push(controller);
    }
  }

  /**
   * Met à jour toutes les balles supplémentaires
   * @param {number} delta - Delta temps en ms
   */
  update(delta) {
    if (!this.isInitialized) return;

    this.extraBalls.forEach(controller => {
      if (controller.isActive()) {
        controller.update(delta);
      }
    });
  }

  /**
   * Gère la perte d'une balle supplémentaire
   * @param {BallController} controller
   */
  handleExtraBallLost(controller) {
    const index = this.extraBalls.indexOf(controller);
    if (index !== -1) {
      controller.destroy();
      this.extraBalls.splice(index, 1);
    }

    if (this.onBallLost) {
      this.onBallLost(this.getActiveBallCount());
    }

    // Vérifier si toutes les balles sont perdues
    this.checkAllBallsLost();
  }

  /**
   * Vérifie si toutes les balles sont perdues
   */
  checkAllBallsLost() {
    const primaryActive = this.primaryBallController.isActive();
    const extraActive = this.extraBalls.some(c => c.isActive());

    if (!primaryActive && !extraActive) {
      // Toutes les balles sont perdues
      if (this.onAllBallsLost) {
        this.onAllBallsLost();
      }
    }
  }

  /**
   * Retourne le nombre de balles actives (incluant la principale)
   * @returns {number}
   */
  getActiveBallCount() {
    let count = this.primaryBallController.isActive() ? 1 : 0;
    count += this.extraBalls.filter(c => c.isActive()).length;
    return count;
  }

  /**
   * Retourne tous les sprites de balles actives (pour les collisions)
   * @returns {Array<Phaser.Physics.Arcade.Sprite>}
   */
  getAllBallSprites() {
    const sprites = [];

    const primarySprite = this.primaryBallController.getSprite();
    if (primarySprite && this.primaryBallController.isActive()) {
      sprites.push(primarySprite);
    }

    this.extraBalls.forEach(controller => {
      if (controller.isActive()) {
        const sprite = controller.getSprite();
        if (sprite) {
          sprites.push(sprite);
        }
      }
    });

    return sprites;
  }

  /**
   * Retourne tous les contrôleurs de balles actifs
   * @returns {Array<BallController>}
   */
  getAllActiveBallControllers() {
    const controllers = [];

    if (this.primaryBallController.isActive()) {
      controllers.push(this.primaryBallController);
    }

    this.extraBalls.forEach(controller => {
      if (controller.isActive()) {
        controllers.push(controller);
      }
    });

    return controllers;
  }

  /**
   * Applique un effet à toutes les balles
   * @param {string} effectType - Type d'effet ('speed', 'destroyer', etc.)
   * @param {*} value - Valeur de l'effet
   */
  applyEffectToAllBalls(effectType, value) {
    const controllers = this.getAllActiveBallControllers();

    controllers.forEach(controller => {
      const model = controller.getModel();
      switch (effectType) {
        case 'speed':
          // Appliquer le multiplicateur de vitesse
          const newSpeed = model.currentSpeed * value;
          model.setSpeed(newSpeed);
          break;
      }
    });
  }

  /**
   * Fait suivre le paddle à toutes les balles (quand aimant actif)
   * @param {number} paddleX
   * @param {number} paddleY
   */
  followPaddleWithMagnet(paddleX, paddleY) {
    // Seule la balle principale peut coller au paddle
    // Les autres continuent de bouger
  }

  /**
   * Réinitialise le gestionnaire (retire toutes les balles supplémentaires)
   */
  reset() {
    this.extraBalls.forEach(controller => {
      controller.destroy();
    });
    this.extraBalls = [];
  }

  /**
   * Définit le callback de perte de toutes les balles
   * @param {Function} callback
   */
  setAllBallsLostCallback(callback) {
    this.onAllBallsLost = callback;
  }

  /**
   * Définit le callback de perte d'une balle
   * @param {Function} callback
   */
  setBallLostCallback(callback) {
    this.onBallLost = callback;
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.reset();
    this.isInitialized = false;
  }
}
