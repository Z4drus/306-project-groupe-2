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

    // Fond sombre arcade
    this.cameras.main.setBackgroundColor('#0a0014');

    // Grille de fond subtile
    this.createBackgroundGrid();

    // Titre avec style néon
    this.titleText = this.add.text(centerX, centerY - 100, `Chargement de ${this.gameName}`, {
      fontSize: '24px',
      fontFamily: 'Arcade, Courier New, monospace',
      fill: '#bd00ff',
      stroke: '#8b00ff',
      strokeThickness: 1
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setShadow(0, 0, '#bd00ff', 15, true, true);

    // Animation du titre (pulse + flicker)
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Effet flicker sur le titre
    this.tweens.add({
      targets: this.titleText,
      alpha: { from: 1, to: 0.95 },
      duration: 100,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2000
    });

    // Container de la barre de progression
    const barWidth = 320;
    const barHeight = 24;

    // Bordure extérieure glow
    this.progressGlow = this.add.rectangle(
      centerX,
      centerY,
      barWidth + 12,
      barHeight + 12,
      0x000000,
      0
    );
    this.progressGlow.setStrokeStyle(1, 0xbd00ff, 0.3);

    // Fond de la barre
    this.progressBg = this.add.rectangle(
      centerX,
      centerY,
      barWidth + 4,
      barHeight + 4,
      0x0a0014
    );
    this.progressBg.setStrokeStyle(2, 0xbd00ff);

    // Barre de progression avec dégradé violet -> cyan
    this.progressBar = this.add.rectangle(
      centerX - barWidth / 2,
      centerY,
      0,
      barHeight,
      0xbd00ff
    );
    this.progressBar.setOrigin(0, 0.5);

    // Effet de brillance sur la barre
    this.progressShine = this.add.rectangle(
      centerX - barWidth / 2,
      centerY,
      0,
      barHeight / 2,
      0xffffff,
      0.15
    );
    this.progressShine.setOrigin(0, 0.5);

    // Texte de pourcentage style arcade
    this.percentText = this.add.text(centerX, centerY + 45, '0%', {
      fontSize: '28px',
      fontFamily: 'Arcade, Courier New, monospace',
      fill: '#00d4ff'
    });
    this.percentText.setOrigin(0.5);
    this.percentText.setShadow(0, 0, '#00d4ff', 12, true, true);

    // Texte de statut (fichier en cours)
    this.statusText = this.add.text(centerX, centerY + 85, 'Initialisation...', {
      fontSize: '14px',
      fontFamily: 'Born2bSportyFS, Courier New, sans-serif',
      fill: '#00ffff'
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setShadow(0, 0, '#00ffff', 5, true, true);

    // Animation de clignotement du statut
    this.tweens.add({
      targets: this.statusText,
      alpha: 0.4,
      duration: 750,
      yoyo: true,
      repeat: -1
    });

    // Compteur de fichiers
    this.fileCountText = this.add.text(centerX, centerY + 115, '', {
      fontSize: '12px',
      fontFamily: 'Born2bSportyFS, Courier New, sans-serif',
      fill: '#8b00ff'
    });
    this.fileCountText.setOrigin(0.5);
  }

  /**
   * Crée une grille de fond subtile style arcade
   */
  createBackgroundGrid() {
    const graphics = this.add.graphics();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Lignes verticales
    graphics.lineStyle(1, 0xbd00ff, 0.03);
    for (let x = 0; x < width; x += 3) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Lignes horizontales
    graphics.lineStyle(1, 0x00d4ff, 0.03);
    for (let y = 0; y < height; y += 3) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  /**
   * Configure les événements de progression du loader Phaser
   */
  setupProgressEvents() {
    const barWidth = 320;

    // Progression globale
    this.load.on('progress', (value) => {
      this.progressBar.width = barWidth * value;
      if (this.progressShine) {
        this.progressShine.width = barWidth * value;
      }
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
      this.statusText.setText('Chargement terminé !');
      this.statusText.setColor('#00d4ff');
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
