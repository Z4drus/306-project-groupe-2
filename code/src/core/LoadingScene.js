/**
 * LoadingScene - Scene de chargement Phaser partagee
 *
 * Affiche la progression du chargement des assets du jeu
 * avec une barre de progression animee et des details.
 */

import Phaser from 'phaser';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  /**
   * Initialisation avec les données
   * @param {Object} data - Configuration du chargement
   * @param {string} data.nextScene - Scene à lancer après le chargement
   * @param {Function} data.preloadAssets - Fonction qui charge les assets
   * @param {string} data.gameName - Nom du jeu
   */
  init(data) {
    this.nextScene = data.nextScene || 'MenuScene';
    this.preloadAssets = data.preloadAssets || (() => {});
    this.gameName = data.gameName || 'Jeu';
    this.nextSceneData = data.nextSceneData || {};
  }

  /**
   * Préchargement des assets
   */
  preload() {
    // Créer l'interface de chargement
    this.createLoadingUI();

    // Configurer les événements de progression
    this.setupProgressEvents();

    // Appeler la fonction de preload fournie
    this.preloadAssets(this);
  }

  /**
   * Crée l'interface de chargement
   */
  createLoadingUI() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Titre
    this.titleText = this.add.text(centerX, centerY - 100, `Chargement de ${this.gameName}`, {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ff6b35'
    });
    this.titleText.setOrigin(0.5);

    // Animation du titre
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Container de la barre de progression
    const barWidth = 300;
    const barHeight = 25;

    // Fond de la barre
    this.progressBg = this.add.rectangle(
      centerX,
      centerY,
      barWidth + 4,
      barHeight + 4,
      0x333333
    );
    this.progressBg.setStrokeStyle(2, 0xff6b35);

    // Barre de progression
    this.progressBar = this.add.rectangle(
      centerX - barWidth / 2,
      centerY,
      0,
      barHeight,
      0xff6b35
    );
    this.progressBar.setOrigin(0, 0.5);

    // Texte de pourcentage
    this.percentText = this.add.text(centerX, centerY + 40, '0%', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      fill: '#00ffe4'
    });
    this.percentText.setOrigin(0.5);

    // Texte de statut (fichier en cours)
    this.statusText = this.add.text(centerX, centerY + 80, 'Initialisation...', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#888888'
    });
    this.statusText.setOrigin(0.5);

    // Animation de clignotement du statut
    this.tweens.add({
      targets: this.statusText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Compteur de fichiers
    this.fileCountText = this.add.text(centerX, centerY + 110, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: '#666666'
    });
    this.fileCountText.setOrigin(0.5);
  }

  /**
   * Configure les événements de progression du loader Phaser
   */
  setupProgressEvents() {
    const barWidth = 300;

    // Progression globale
    this.load.on('progress', (value) => {
      this.progressBar.width = barWidth * value;
      this.percentText.setText(`${Math.round(value * 100)}%`);
    });

    // Fichier en cours de chargement
    this.load.on('fileprogress', (file) => {
      this.statusText.setText(`Chargement: ${file.key}`);
    });

    // Compteur de fichiers
    this.load.on('filecomplete', (key, type, data) => {
      const progress = this.load.progress;
      const loaded = Math.round(progress * this.load.totalToLoad);
      this.fileCountText.setText(`${loaded} / ${this.load.totalToLoad} fichiers`);
    });

    // Chargement terminé
    this.load.on('complete', () => {
      this.statusText.setText('Chargement termine !');
      this.fileCountText.setText('');

      // Animation de transition
      this.time.delayedCall(500, () => {
        this.transitionToNextScene();
      });
    });
  }

  /**
   * Transition vers la scène suivante
   */
  transitionToNextScene() {
    // Fondu sortant
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.nextScene, this.nextSceneData);
    });
  }

  /**
   * Création de la scène (appelée après preload)
   */
  create() {
    // Si aucun asset n'a été chargé, passer directement à la scène suivante
    if (this.load.totalToLoad === 0) {
      this.transitionToNextScene();
    }
  }
}
