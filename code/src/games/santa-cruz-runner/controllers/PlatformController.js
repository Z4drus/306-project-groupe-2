/**
 * PlatformController - Contrôleur des plateformes
 *
 * Gère la génération, le recyclage et le défilement des plateformes
 */

import PlatformModel, { PlatformCollection } from '../models/PlatformModel.js';
import { PlatformViewManager } from '../views/PlatformView.js';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_CONFIG,
  PLATFORM_TYPES,
  generatePlatformWidth,
  generatePlatformGap,
  determinePlatformType,
  getDifficultyParams
} from '../config/GameConfig.js';

export default class PlatformController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {number} level - Niveau initial
   */
  constructor(scene, level = 1) {
    this.scene = scene;
    this.level = level;

    // Collections
    this.platformCollection = new PlatformCollection();
    this.platformViewManager = new PlatformViewManager(scene);

    // Paramètres de difficulté
    this.difficultyParams = getDifficultyParams(level);

    // Référence à la dernière plateforme créée
    this.lastPlatformX = 0;
    this.lastPlatformY = PLATFORM_CONFIG.baseY;

    // État
    this.scrollSpeed = this.difficultyParams.scrollSpeed;
    this.isRunning = false;

    // Mode "facile" temporaire après un changement de niveau
    this.easyModeActive = false;
    this.easyModePlatformsRemaining = 0;
  }

  /**
   * Précharge les assets
   */
  preload() {
    this.platformViewManager.preload();
  }

  /**
   * Initialise les plateformes
   */
  initialize() {
    this.platformViewManager.create();

    // Créer les plateformes initiales
    this.createInitialPlatforms();

    this.isRunning = true;
  }

  /**
   * Crée les plateformes initiales
   */
  createInitialPlatforms() {
    // Première plateforme sous le joueur (large pour démarrer facilement)
    this.createPlatform(0, PLATFORM_CONFIG.baseY, 300, PLATFORM_TYPES.NORMAL);

    // Générer quelques plateformes supplémentaires
    let currentX = 300 + PLATFORM_CONFIG.baseGap;

    while (currentX < GAME_WIDTH + 200) {
      const width = generatePlatformWidth(this.difficultyParams);
      const gap = generatePlatformGap(this.difficultyParams);
      const type = determinePlatformType(this.difficultyParams);

      // Variation de hauteur
      const heightVar = Phaser.Math.Between(
        -PLATFORM_CONFIG.heightVariation / 2,
        PLATFORM_CONFIG.heightVariation / 2
      );
      let y = PLATFORM_CONFIG.baseY + heightVar;

      // S'assurer que la plateforme n'est pas trop haute ou basse
      y = Phaser.Math.Clamp(y, GAME_HEIGHT - 200, GAME_HEIGHT - 50);

      this.createPlatform(currentX, y, width, type);
      currentX += width + gap;
    }
  }

  /**
   * Crée une nouvelle plateforme
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} width - Largeur
   * @param {Object} type - Type de plateforme
   * @returns {PlatformModel}
   */
  createPlatform(x, y, width, type) {
    // Vérifier s'il y a une plateforme inactive à recycler
    let model = this.platformCollection.getInactive();

    if (model) {
      // Recycler la plateforme existante
      model.reset({ x, y, width, type });
      this.platformCollection.activate(model);
      this.platformViewManager.resetView(model);
    } else {
      // Créer une nouvelle plateforme
      model = new PlatformModel({ x, y, width, type });
      this.platformCollection.add(model);
      this.platformViewManager.addPlatform(model);
    }

    // Mettre à jour les références
    this.lastPlatformX = x + width;
    this.lastPlatformY = y;

    return model;
  }

  /**
   * Met à jour les plateformes
   * @param {number} delta - Delta time en ms
   */
  update(delta) {
    if (!this.isRunning) return;

    // Calculer le déplacement
    const moveAmount = this.scrollSpeed * (delta / 1000);

    // Mettre à jour chaque plateforme
    const activePlatforms = this.platformCollection.getActive();

    for (const platform of activePlatforms) {
      // Déplacer la plateforme
      platform.update(this.scrollSpeed, delta);

      // Vérifier si elle est hors écran
      if (platform.isOffScreen()) {
        this.recyclePlatform(platform);
      }
    }

    // Mettre à jour les vues
    this.platformViewManager.update();

    // Générer de nouvelles plateformes si nécessaire
    this.generateNewPlatforms();

    // Mettre à jour lastPlatformX
    this.lastPlatformX -= moveAmount;

    return moveAmount;
  }

  /**
   * Recycle une plateforme hors écran
   * @param {PlatformModel} platform
   */
  recyclePlatform(platform) {
    this.platformCollection.deactivate(platform);

    // Mettre à jour la vue
    const view = this.platformViewManager.getView(platform);
    if (view && view.sprite) {
      view.sprite.setVisible(false);
      view.sprite.body.enable = false;
    }
  }

  /**
   * Génère de nouvelles plateformes à droite de l'écran
   */
  generateNewPlatforms() {
    while (this.lastPlatformX < GAME_WIDTH + 300) {
      let width, gap, type, y;

      if (this.easyModeActive && this.easyModePlatformsRemaining > 0) {
        // Mode facile : plateformes larges, proches, plates et normales
        width = 180; // Large
        gap = 60; // Très proche
        type = PLATFORM_TYPES.NORMAL; // Toujours normale
        y = PLATFORM_CONFIG.baseY; // Hauteur fixe (plate)
        this.easyModePlatformsRemaining--;

        // Désactiver le mode facile quand c'est fini
        if (this.easyModePlatformsRemaining <= 0) {
          this.easyModeActive = false;
        }
      } else {
        // Mode normal : utiliser les paramètres de difficulté
        width = generatePlatformWidth(this.difficultyParams);
        gap = generatePlatformGap(this.difficultyParams);
        type = determinePlatformType(this.difficultyParams);

        // Position Y avec variation mais pas trop différente de la précédente
        const maxHeightChange = 60;
        const heightChange = Phaser.Math.Between(-maxHeightChange, maxHeightChange);
        y = this.lastPlatformY + heightChange;

        // Limiter la position Y
        y = Phaser.Math.Clamp(y, GAME_HEIGHT - 200, GAME_HEIGHT - 50);
      }

      // Position X
      const x = this.lastPlatformX + gap;

      // Créer la plateforme
      this.createPlatform(x, y, width, type);
    }
  }

  /**
   * Active le mode facile temporaire (plateformes faciles)
   * @param {number} platformCount - Nombre de plateformes faciles à générer
   */
  activateEasyMode(platformCount = 5) {
    this.easyModeActive = true;
    this.easyModePlatformsRemaining = platformCount;
    // Remettre la hauteur à la base pour les plateformes plates
    this.lastPlatformY = PLATFORM_CONFIG.baseY;
  }

  /**
   * Définit le niveau de difficulté
   * @param {number} level - Nouveau niveau
   */
  setLevel(level) {
    this.level = level;
    this.difficultyParams = getDifficultyParams(level);
    this.scrollSpeed = this.difficultyParams.scrollSpeed;
  }

  /**
   * Définit la vitesse de défilement
   * @param {number} speed - Nouvelle vitesse
   */
  setScrollSpeed(speed) {
    this.scrollSpeed = speed;
  }

  /**
   * Retourne le groupe Phaser pour les collisions
   * @returns {Phaser.Physics.Arcade.Group}
   */
  getGroup() {
    return this.platformViewManager.getGroup();
  }

  /**
   * Retourne toutes les plateformes actives
   * @returns {Array<PlatformModel>}
   */
  getActivePlatforms() {
    return this.platformCollection.getActive();
  }

  /**
   * Arrête le défilement
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Reprend le défilement
   */
  resume() {
    this.isRunning = true;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.platformCollection.clear();
    this.platformViewManager.destroy();
  }
}
