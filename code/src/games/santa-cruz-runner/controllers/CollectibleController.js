/**
 * CollectibleController - Contrôleur des collectibles
 *
 * Gère la génération et la collecte des objets bonus
 */

import CollectibleModel, { CollectibleCollection, getRandomCollectibleType } from '../models/CollectibleModel.js';
import { CollectibleViewManager } from '../views/CollectibleView.js';
import { COLLECTIBLE_CONFIG, getDifficultyParams } from '../config/GameConfig.js';

export default class CollectibleController {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   * @param {number} level - Niveau initial
   */
  constructor(scene, level = 1) {
    this.scene = scene;
    this.level = level;

    // Collections
    this.collectibleCollection = new CollectibleCollection();
    this.collectibleViewManager = new CollectibleViewManager(scene);

    // Paramètres
    this.difficultyParams = getDifficultyParams(level);

    // État
    this.isRunning = false;
    this.scrollSpeed = this.difficultyParams.scrollSpeed;

    // Callback
    this.onCollect = null;
  }

  /**
   * Initialise le contrôleur
   */
  initialize() {
    this.collectibleViewManager.create();
    this.isRunning = true;
  }

  /**
   * Essaie de créer un collectible sur une plateforme
   * @param {PlatformModel} platform - Plateforme sur laquelle placer le collectible
   * @returns {CollectibleModel|null}
   */
  trySpawnOnPlatform(platform) {
    // Vérifier si la plateforme a déjà un collectible
    if (platform.hasCollectible) return null;

    // Probabilité de spawn
    if (Math.random() > this.difficultyParams.collectibleChance) return null;

    // Créer le collectible
    const type = getRandomCollectibleType(this.level);
    const x = platform.x + platform.width / 2;
    const y = platform.y - COLLECTIBLE_CONFIG.heightAbovePlatform;

    const collectible = this.createCollectible(x, y, type);
    platform.hasCollectible = true;

    return collectible;
  }

  /**
   * Crée un nouveau collectible
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {Object} type - Type de collectible
   * @returns {CollectibleModel}
   */
  createCollectible(x, y, type) {
    // Vérifier s'il y a un collectible inactif à recycler
    let model = this.collectibleCollection.getInactive();

    if (model) {
      // Recycler
      model.reset({ x, y, type });
      this.collectibleCollection.activate(model);

      const view = this.collectibleViewManager.getView(model);
      if (view) {
        view.reset();
      }
    } else {
      // Créer nouveau
      model = new CollectibleModel({ x, y, type });
      this.collectibleCollection.add(model);
      this.collectibleViewManager.addCollectible(model);
    }

    return model;
  }

  /**
   * Met à jour les collectibles
   * @param {number} delta - Delta time en ms
   * @param {number} time - Temps total écoulé
   */
  update(delta, time) {
    if (!this.isRunning) return;

    // Mettre à jour chaque collectible
    const activeCollectibles = this.collectibleCollection.getActive();

    for (const collectible of activeCollectibles) {
      // Déplacer le collectible
      collectible.update(this.scrollSpeed, delta, time);

      // Vérifier si hors écran
      if (collectible.isOffScreen()) {
        this.deactivateCollectible(collectible);
      }
    }

    // Mettre à jour les vues
    this.collectibleViewManager.update(time);
  }

  /**
   * Collecte un collectible
   * @param {CollectibleModel} collectible
   * @returns {Object} Informations sur la collecte
   */
  collect(collectible) {
    if (!collectible.isActive) return null;

    // Marquer comme collecté
    collectible.collect();

    // Jouer l'effet visuel
    const view = this.collectibleViewManager.getView(collectible);
    if (view) {
      view.playCollectEffect(() => {
        this.deactivateCollectible(collectible);
      });
    } else {
      this.deactivateCollectible(collectible);
    }

    // Retourner les informations
    return {
      points: collectible.points,
      type: collectible.type
    };
  }

  /**
   * Désactive un collectible
   * @param {CollectibleModel} collectible
   */
  deactivateCollectible(collectible) {
    this.collectibleCollection.deactivate(collectible);
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
   * Définit le callback de collecte
   * @param {Function} callback
   */
  setCollectCallback(callback) {
    this.onCollect = callback;
  }

  /**
   * Retourne tous les collectibles actifs
   * @returns {Array<CollectibleModel>}
   */
  getActiveCollectibles() {
    return this.collectibleCollection.getActive();
  }

  /**
   * Retourne tous les graphiques pour les collisions
   * @returns {Array}
   */
  getAllGraphics() {
    return this.collectibleViewManager.getAllGraphics();
  }

  /**
   * Arrête le contrôleur
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Reprend le contrôleur
   */
  resume() {
    this.isRunning = true;
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.collectibleCollection.clear();
    this.collectibleViewManager.destroy();
  }
}
