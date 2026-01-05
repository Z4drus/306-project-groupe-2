/**
 * BackgroundView - Vue du fond avec parallaxe et neige
 *
 * Gère le rendu du fond défilant et les particules de neige
 */

import { ASSETS_PATH, GAME_WIDTH, GAME_HEIGHT, SNOW_CONFIG, COLORS } from '../config/GameConfig.js';

export default class BackgroundView {
  /**
   * @param {Phaser.Scene} scene - Scène Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this.backgroundTile = null;
    this.snowEmitter = null;
    this.mountainsGraphics = null;
    this.scrollSpeed = 0;
  }

  /**
   * Précharge les assets
   */
  preload() {
    this.scene.load.image('snow-bg', `${ASSETS_PATH}/snow-bg.png`);
    this.scene.load.image('snowflake', `${ASSETS_PATH}/snowflake.png`);
  }

  /**
   * Crée le fond et les effets
   */
  create() {
    // Créer le dégradé de fond
    this.createGradientBackground();

    // Créer les montagnes en arrière-plan
    this.createMountains();

    // Créer le fond défilant
    this.backgroundTile = this.scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      'snow-bg'
    );
    this.backgroundTile.setAlpha(0.3);
    this.backgroundTile.setDepth(-10);

    // Créer les particules de neige
    this.createSnowParticles();
  }

  /**
   * Crée un dégradé de fond
   */
  createGradientBackground() {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(-20);

    // Dégradé du ciel nocturne
    const topColor = Phaser.Display.Color.HexStringToColor(COLORS.SKY_TOP);
    const bottomColor = Phaser.Display.Color.HexStringToColor(COLORS.SKY_BOTTOM);

    for (let y = 0; y < GAME_HEIGHT; y++) {
      const ratio = y / GAME_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        topColor,
        bottomColor,
        100,
        ratio * 100
      );
      const colorInt = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      graphics.fillStyle(colorInt, 1);
      graphics.fillRect(0, y, GAME_WIDTH, 1);
    }
  }

  /**
   * Crée les montagnes stylisées en arrière-plan
   */
  createMountains() {
    this.mountainsGraphics = this.scene.add.graphics();
    this.mountainsGraphics.setDepth(-15);

    // Montagnes lointaines (plus claires)
    this.drawMountainRange(0.2, 0x3d5a80, 300);

    // Montagnes proches (plus sombres)
    this.drawMountainRange(0.4, 0x293241, 400);
  }

  /**
   * Dessine une chaîne de montagnes
   * @param {number} alpha - Opacité
   * @param {number} color - Couleur
   * @param {number} baseY - Position Y de base
   */
  drawMountainRange(alpha, color, baseY) {
    this.mountainsGraphics.fillStyle(color, alpha);

    const peaks = [
      { x: 0, height: 150 },
      { x: 150, height: 200 },
      { x: 300, height: 120 },
      { x: 450, height: 180 },
      { x: 600, height: 140 },
      { x: 750, height: 160 },
      { x: 900, height: 130 }
    ];

    this.mountainsGraphics.beginPath();
    this.mountainsGraphics.moveTo(0, GAME_HEIGHT);

    peaks.forEach((peak, index) => {
      const x = peak.x;
      const y = baseY - peak.height;

      if (index === 0) {
        this.mountainsGraphics.lineTo(x, y);
      } else {
        // Point de contrôle pour courbe douce
        const prevPeak = peaks[index - 1];
        const midX = (prevPeak.x + x) / 2;
        this.mountainsGraphics.lineTo(midX, baseY - (prevPeak.height + peak.height) / 2 + 30);
        this.mountainsGraphics.lineTo(x, y);
      }
    });

    this.mountainsGraphics.lineTo(GAME_WIDTH, GAME_HEIGHT);
    this.mountainsGraphics.closePath();
    this.mountainsGraphics.fillPath();

    // Ajouter de la neige sur les sommets
    this.mountainsGraphics.fillStyle(0xffffff, alpha * 0.5);
    peaks.forEach(peak => {
      const snowHeight = peak.height * 0.3;
      this.mountainsGraphics.fillTriangle(
        peak.x - 20, baseY - peak.height + snowHeight,
        peak.x, baseY - peak.height,
        peak.x + 20, baseY - peak.height + snowHeight
      );
    });
  }

  /**
   * Crée les particules de neige
   */
  createSnowParticles() {
    // Créer un émetteur de particules avec fade progressif
    // Fréquence élevée = moins de flocons (temps entre chaque émission)
    this.snowEmitter = this.scene.add.particles(0, -50, 'snowflake', {
      x: { min: 0, max: GAME_WIDTH },
      y: -50,
      lifespan: 10000,
      speedY: { min: SNOW_CONFIG.minSpeed, max: SNOW_CONFIG.maxSpeed },
      speedX: { min: -10, max: 10 },
      scale: { min: SNOW_CONFIG.minScale, max: SNOW_CONFIG.maxScale },
      alpha: {
        start: SNOW_CONFIG.maxAlpha * 0.6,
        end: 0,
        ease: 'Quad.easeIn'
      },
      rotate: { min: 0, max: 360 },
      frequency: 500,
      quantity: 1,
      blendMode: 'ADD'
    });

    this.snowEmitter.setDepth(10);
  }

  /**
   * Met à jour le défilement
   * @param {number} speed - Vitesse de défilement
   * @param {number} delta - Delta time
   */
  update(speed, delta) {
    this.scrollSpeed = speed;

    if (this.backgroundTile) {
      // Faire défiler le fond à une vitesse réduite (parallaxe)
      this.backgroundTile.tilePositionX += (speed * 0.1) * (delta / 1000);
    }
  }

  /**
   * Définit l'intensité de la neige
   * @param {number} intensity - Multiplicateur (1 = normal, max recommandé: 2)
   */
  setSnowIntensity(intensity) {
    if (this.snowEmitter) {
      // Limiter l'intensité pour éviter trop de flocons
      const clampedIntensity = Math.min(intensity, 2);
      // Fréquence minimale de 300ms pour éviter la surcharge
      this.snowEmitter.setFrequency(Math.max(300, 500 / clampedIntensity));
      this.snowEmitter.setQuantity(1);
    }
  }

  /**
   * Arrête les particules de neige
   */
  stopSnow() {
    if (this.snowEmitter) {
      this.snowEmitter.stop();
    }
  }

  /**
   * Reprend les particules de neige
   */
  resumeSnow() {
    if (this.snowEmitter) {
      this.snowEmitter.start();
    }
  }

  /**
   * Détruit la vue
   */
  destroy() {
    if (this.backgroundTile) {
      this.backgroundTile.destroy();
      this.backgroundTile = null;
    }
    if (this.snowEmitter) {
      this.snowEmitter.destroy();
      this.snowEmitter = null;
    }
    if (this.mountainsGraphics) {
      this.mountainsGraphics.destroy();
      this.mountainsGraphics = null;
    }
  }
}
