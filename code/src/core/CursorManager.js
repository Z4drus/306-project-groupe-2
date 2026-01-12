/**
 * CursorManager - Gestionnaire de curseur personnalisé
 *
 * Gère un curseur custom contrôlable par souris ET manette
 * Le curseur suit la souris et peut être déplacé au joystick
 */

import gamepadManager, { GamepadButton } from './GamepadManager.js';

/**
 * Configuration avancée du contrôle joystick
 * Système de réponse non-linéaire pour une expérience fluide et précise
 */
const JOYSTICK_CONFIG = {
  // === VITESSES ===
  MIN_SPEED: 1.5,       // Vitesse minimum pour mouvements de précision
  MAX_SPEED: 22,        // Vitesse maximum pour grands déplacements

  // === DEADZONE ===
  DEADZONE: 0.12,       // Zone morte réduite pour plus de réactivité
  DEADZONE_OUTER: 0.95, // Seuil pour considérer le joystick "à fond"

  // === COURBE DE RÉPONSE ===
  // Exposant de la courbe : 1 = linéaire, 2 = quadratique, >2 = plus de précision à faible intensité
  RESPONSE_CURVE: 2.2,

  // === ACCÉLÉRATION DYNAMIQUE ===
  // Quand le joystick est maintenu à fond, la vitesse augmente progressivement
  ACCELERATION_ENABLED: true,
  ACCELERATION_DELAY: 300,      // Délai avant activation (ms)
  ACCELERATION_RATE: 0.08,      // Taux d'augmentation par frame
  MAX_ACCELERATION_MULT: 2.0,   // Multiplicateur max

  // === LISSAGE (SMOOTHING) ===
  // Interpolation pour des mouvements fluides
  SMOOTHING_FACTOR: 0.25,       // 0 = instantané, 1 = très lissé

  // === BOOST DE PRÉCISION ===
  // Ralentissement quand proche d'un élément interactif
  PRECISION_SLOWDOWN: 0.6,      // Multiplicateur quand proche d'un bouton
  PRECISION_DISTANCE: 80        // Distance en pixels pour activer le mode précision
};

/**
 * Sélecteurs CSS des éléments interactifs
 */
const INTERACTIVE_SELECTORS = 'button, a, .game-card, .game-play-btn, .action-btn, .back-btn, input, select';

class CursorManager {
  constructor() {
    this.cursorElement = null;
    this.isInitialized = false;

    // Position du curseur
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;

    // Mode actif (souris ou manette)
    this.mode = 'mouse'; // 'mouse' | 'gamepad'

    // Animation frame ID
    this.animationFrameId = null;

    // État du bouton A (pour éviter les clics répétés)
    this.lastAPressed = false;

    // Callbacks
    this.onClickCallback = null;

    // État de visibilité (pour le mode jeu)
    this.isVisible = true;

    // État de désactivation complète (pour le clavier virtuel)
    this.isDisabled = false;

    // Élément actuellement survolé
    this.hoveredElement = null;

    // === État pour le système de contrôle avancé ===
    // Vélocité lissée (pour interpolation)
    this.smoothedVelocityX = 0;
    this.smoothedVelocityY = 0;

    // Tracking de l'accélération
    this.accelerationMultiplier = 1.0;
    this.timeAtMaxIntensity = 0;
    this.lastUpdateTime = performance.now();

    // Cache des éléments interactifs proches
    this.nearestInteractiveDistance = Infinity;
  }

  /**
   * Initialise le gestionnaire de curseur
   */
  init() {
    if (this.isInitialized) return;

    this.createCursorElement();
    this.setupEventListeners();
    this.startUpdateLoop();

    this.isInitialized = true;
  }

  /**
   * Crée l'élément DOM du curseur
   */
  createCursorElement() {
    this.cursorElement = document.createElement('div');
    this.cursorElement.id = 'custom-cursor';
    this.cursorElement.innerHTML = `
      <img src="/assets/images/cursor/cursor.svg" alt="" />
    `;
    document.body.appendChild(this.cursorElement);

    // Position initiale
    this.updateCursorPosition();
  }

  /**
   * Configure les listeners d'événements
   */
  setupEventListeners() {
    // Suivi de la souris
    document.addEventListener('mousemove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      this.mode = 'mouse';
      this.updateCursorPosition();

      // Retirer le mode manette quand on utilise la souris
      if (this.cursorElement) {
        this.cursorElement.classList.remove('gamepad-mode');
      }
    });

    // Cacher le curseur custom quand on quitte la fenêtre
    document.addEventListener('mouseleave', () => {
      if (this.cursorElement && this.isVisible) {
        this.cursorElement.style.opacity = '0';
      }
    });

    document.addEventListener('mouseenter', () => {
      if (this.cursorElement && this.isVisible) {
        this.cursorElement.style.opacity = '1';
      }
    });

    // Réinitialiser la position lors du redimensionnement
    window.addEventListener('resize', () => {
      // S'assurer que le curseur reste dans les limites
      this.x = Math.min(this.x, window.innerWidth);
      this.y = Math.min(this.y, window.innerHeight);
      this.updateCursorPosition();
    });
  }

  /**
   * Démarre la boucle de mise à jour
   */
  startUpdateLoop() {
    const update = () => {
      this.update();
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Applique la courbe de réponse non-linéaire à une valeur normalisée
   * @param {number} value - Valeur entre 0 et 1
   * @returns {number} - Valeur transformée entre 0 et 1
   */
  applyResponseCurve(value) {
    return Math.pow(value, JOYSTICK_CONFIG.RESPONSE_CURVE);
  }

  /**
   * Calcule la magnitude du vecteur joystick avec deadzone progressive
   * @param {number} x - Axe X (-1 à 1)
   * @param {number} y - Axe Y (-1 à 1)
   * @returns {{magnitude: number, normalizedX: number, normalizedY: number}}
   */
  processJoystickInput(x, y) {
    // Calculer la magnitude (distance depuis le centre)
    const rawMagnitude = Math.sqrt(x * x + y * y);

    // Si en dessous de la deadzone, pas de mouvement
    if (rawMagnitude < JOYSTICK_CONFIG.DEADZONE) {
      return { magnitude: 0, normalizedX: 0, normalizedY: 0 };
    }

    // Normaliser la magnitude entre 0 et 1 (en tenant compte de la deadzone)
    const effectiveRange = 1 - JOYSTICK_CONFIG.DEADZONE;
    const normalizedMagnitude = Math.min(
      (rawMagnitude - JOYSTICK_CONFIG.DEADZONE) / effectiveRange,
      1
    );

    // Calculer la direction unitaire
    const dirX = x / rawMagnitude;
    const dirY = y / rawMagnitude;

    return {
      magnitude: normalizedMagnitude,
      normalizedX: dirX,
      normalizedY: dirY
    };
  }

  /**
   * Calcule la vitesse en fonction de l'intensité du joystick
   * @param {number} magnitude - Magnitude normalisée (0-1)
   * @returns {number} - Vitesse en pixels par frame
   */
  calculateSpeed(magnitude) {
    // Appliquer la courbe de réponse pour plus de contrôle à faible intensité
    const curvedMagnitude = this.applyResponseCurve(magnitude);

    // Interpoler entre vitesse min et max
    const baseSpeed = JOYSTICK_CONFIG.MIN_SPEED +
      (JOYSTICK_CONFIG.MAX_SPEED - JOYSTICK_CONFIG.MIN_SPEED) * curvedMagnitude;

    return baseSpeed;
  }

  /**
   * Met à jour l'accélération dynamique
   * @param {number} magnitude - Magnitude actuelle
   * @param {number} deltaTime - Temps écoulé en ms
   */
  updateAcceleration(magnitude, deltaTime) {
    if (!JOYSTICK_CONFIG.ACCELERATION_ENABLED) {
      this.accelerationMultiplier = 1.0;
      return;
    }

    // Vérifier si le joystick est "à fond"
    const isAtMax = magnitude >= JOYSTICK_CONFIG.DEADZONE_OUTER;

    if (isAtMax) {
      this.timeAtMaxIntensity += deltaTime;

      // Après le délai, commencer à accélérer
      if (this.timeAtMaxIntensity > JOYSTICK_CONFIG.ACCELERATION_DELAY) {
        this.accelerationMultiplier = Math.min(
          this.accelerationMultiplier + JOYSTICK_CONFIG.ACCELERATION_RATE,
          JOYSTICK_CONFIG.MAX_ACCELERATION_MULT
        );
      }
    } else {
      // Reset de l'accélération quand on relâche
      this.timeAtMaxIntensity = 0;
      // Décroissance douce de l'accélération
      this.accelerationMultiplier = Math.max(
        1.0,
        this.accelerationMultiplier - JOYSTICK_CONFIG.ACCELERATION_RATE * 2
      );
    }
  }

  /**
   * Calcule le facteur de précision basé sur la proximité des éléments interactifs
   * @returns {number} - Multiplicateur de vitesse (1.0 = normal, <1.0 = ralenti)
   */
  calculatePrecisionFactor() {
    if (this.nearestInteractiveDistance >= JOYSTICK_CONFIG.PRECISION_DISTANCE) {
      return 1.0;
    }

    // Plus on est proche, plus on ralentit
    const proximityRatio = this.nearestInteractiveDistance / JOYSTICK_CONFIG.PRECISION_DISTANCE;
    return JOYSTICK_CONFIG.PRECISION_SLOWDOWN +
      (1 - JOYSTICK_CONFIG.PRECISION_SLOWDOWN) * proximityRatio;
  }

  /**
   * Met à jour le curseur (appelé chaque frame)
   * Système avancé avec courbe de réponse, accélération et lissage
   */
  update() {
    // Si désactivé ou invisible, ne rien faire
    if (this.isDisabled || !this.isVisible) return;

    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Vérifier les entrées manette
    const stick = gamepadManager.getLeftStick(0);

    if (stick) {
      const { x: axisX, y: axisY } = stick;

      // Traiter l'input du joystick avec deadzone progressive
      const { magnitude, normalizedX, normalizedY } = this.processJoystickInput(axisX, axisY);

      if (magnitude > 0) {
        this.mode = 'gamepad';

        // Calculer la vitesse de base selon l'intensité
        const baseSpeed = this.calculateSpeed(magnitude);

        // Mettre à jour et appliquer l'accélération dynamique
        this.updateAcceleration(magnitude, deltaTime);

        // Calculer le facteur de précision (ralentissement près des éléments)
        const precisionFactor = this.calculatePrecisionFactor();

        // Vitesse finale avec tous les modificateurs
        const finalSpeed = baseSpeed * this.accelerationMultiplier * precisionFactor;

        // Calculer la vélocité cible
        const targetVelocityX = normalizedX * finalSpeed;
        const targetVelocityY = normalizedY * finalSpeed;

        // Appliquer le lissage (interpolation vers la vélocité cible)
        const smoothing = JOYSTICK_CONFIG.SMOOTHING_FACTOR;
        this.smoothedVelocityX += (targetVelocityX - this.smoothedVelocityX) * (1 - smoothing);
        this.smoothedVelocityY += (targetVelocityY - this.smoothedVelocityY) * (1 - smoothing);

        // Appliquer le mouvement
        this.x += this.smoothedVelocityX;
        this.y += this.smoothedVelocityY;

        // Limiter aux bords de l'écran
        this.x = Math.max(0, Math.min(window.innerWidth, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight, this.y));

        this.updateCursorPosition();

        // Mettre à jour la classe pour le mode manette
        if (this.cursorElement) {
          this.cursorElement.classList.add('gamepad-mode');
        }
      } else {
        // Joystick au repos - décroissance douce de la vélocité
        this.smoothedVelocityX *= 0.7;
        this.smoothedVelocityY *= 0.7;

        // Reset de l'accélération
        this.accelerationMultiplier = 1.0;
        this.timeAtMaxIntensity = 0;

        // Appliquer le mouvement résiduel si significatif
        if (Math.abs(this.smoothedVelocityX) > 0.1 || Math.abs(this.smoothedVelocityY) > 0.1) {
          this.x += this.smoothedVelocityX;
          this.y += this.smoothedVelocityY;
          this.x = Math.max(0, Math.min(window.innerWidth, this.x));
          this.y = Math.max(0, Math.min(window.innerHeight, this.y));
          this.updateCursorPosition();
        }
      }
    }

    // Vérifier les éléments interactifs sous le curseur
    this.checkInteractiveElements();

    // Vérifier le bouton A pour les clics
    const aPressed = gamepadManager.isButtonPressed(GamepadButton.A, 0);
    if (aPressed && !this.lastAPressed) {
      this.triggerClick();
    }
    this.lastAPressed = aPressed;
  }

  /**
   * Vérifie si le curseur survole un élément interactif
   * et calcule la distance au plus proche pour le mode précision
   */
  checkInteractiveElements() {
    const elementUnderCursor = document.elementFromPoint(this.x, this.y);

    // Calculer la distance à l'élément interactif le plus proche
    this.updateNearestInteractiveDistance();

    if (elementUnderCursor) {
      // Vérifier si l'élément ou un de ses parents est interactif
      const interactiveElement = elementUnderCursor.closest(INTERACTIVE_SELECTORS);

      if (interactiveElement !== this.hoveredElement) {
        // Sortie de l'ancien élément
        if (this.hoveredElement) {
          this.hoveredElement.classList.remove('cursor-hover');
        }

        // Entrée sur le nouvel élément
        this.hoveredElement = interactiveElement;

        if (interactiveElement) {
          interactiveElement.classList.add('cursor-hover');
          this.cursorElement?.classList.add('hovering-interactive');
        } else {
          this.cursorElement?.classList.remove('hovering-interactive');
        }
      }
    }
  }

  /**
   * Met à jour la distance au plus proche élément interactif
   * Utilisé pour le mode précision (ralentissement automatique)
   */
  updateNearestInteractiveDistance() {
    // Limiter la fréquence de calcul (coûteux en performance)
    if (this._lastDistanceCheck && performance.now() - this._lastDistanceCheck < 50) {
      return;
    }
    this._lastDistanceCheck = performance.now();

    const interactiveElements = document.querySelectorAll(INTERACTIVE_SELECTORS);
    let minDistance = Infinity;

    for (const element of interactiveElements) {
      // Ignorer les éléments non visibles
      if (element.offsetParent === null) continue;

      const rect = element.getBoundingClientRect();

      // Calculer la distance du curseur au centre de l'élément
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance au bord de l'élément (pas au centre)
      const dx = Math.max(0, Math.abs(this.x - centerX) - rect.width / 2);
      const dy = Math.max(0, Math.abs(this.y - centerY) - rect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
      }

      // Optimisation : si on est déjà sur un élément, pas besoin de continuer
      if (distance === 0) break;
    }

    this.nearestInteractiveDistance = minDistance;
  }

  /**
   * Met à jour la position visuelle du curseur
   */
  updateCursorPosition() {
    if (this.cursorElement) {
      this.cursorElement.style.left = `${this.x}px`;
      this.cursorElement.style.top = `${this.y}px`;
    }
  }

  /**
   * Déclenche un clic à la position actuelle du curseur
   */
  triggerClick() {
    // Trouver l'élément sous le curseur
    const elementUnderCursor = document.elementFromPoint(this.x, this.y);

    if (elementUnderCursor) {
      // Ajouter un effet visuel de clic
      this.showClickEffect();

      // Simuler un clic
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: this.x,
        clientY: this.y,
        view: window
      });
      elementUnderCursor.dispatchEvent(clickEvent);

      // Appeler le callback si défini
      if (this.onClickCallback) {
        this.onClickCallback(elementUnderCursor, this.x, this.y);
      }
    }
  }

  /**
   * Affiche un effet visuel lors du clic
   */
  showClickEffect() {
    if (this.cursorElement) {
      this.cursorElement.classList.add('clicking');
      setTimeout(() => {
        this.cursorElement.classList.remove('clicking');
      }, 150);
    }
  }

  /**
   * Définit un callback pour les clics
   * @param {Function} callback - Fonction appelée lors d'un clic
   */
  setClickCallback(callback) {
    this.onClickCallback = callback;
  }

  /**
   * Masque le curseur (utilisé en mode jeu Phaser)
   */
  hide() {
    this.isVisible = false;
    if (this.cursorElement) {
      this.cursorElement.style.display = 'none';
    }
  }

  /**
   * Affiche le curseur
   */
  show() {
    this.isVisible = true;
    if (this.cursorElement) {
      this.cursorElement.style.display = 'block';
    }
  }

  /**
   * Désactive complètement le curseur (pour le clavier virtuel)
   * Arrête tout traitement d'input gamepad/souris
   */
  disable() {
    this.isDisabled = true;
    this.isVisible = false;

    // Cacher l'élément curseur
    if (this.cursorElement) {
      this.cursorElement.style.display = 'none';
      this.cursorElement.style.visibility = 'hidden';
    }

    // Reset des états de vélocité
    this.smoothedVelocityX = 0;
    this.smoothedVelocityY = 0;
    this.accelerationMultiplier = 1.0;
    this.timeAtMaxIntensity = 0;

    // Retirer le hover de l'élément actuel
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('cursor-hover');
      this.hoveredElement = null;
    }
  }

  /**
   * Réactive le curseur après désactivation
   */
  enable() {
    this.isDisabled = false;
    this.isVisible = true;

    // Réafficher l'élément curseur
    if (this.cursorElement) {
      this.cursorElement.style.display = 'block';
      this.cursorElement.style.visibility = 'visible';
    }

    // Reset du timer pour éviter un saut de deltaTime
    this.lastUpdateTime = performance.now();
  }

  /**
   * Vérifie si le curseur est en mode manette
   * @returns {boolean}
   */
  isGamepadMode() {
    return this.mode === 'gamepad';
  }

  /**
   * Retourne la position actuelle du curseur
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Définit la position du curseur
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.updateCursorPosition();
  }

  /**
   * Centre le curseur sur l'écran
   */
  center() {
    this.setPosition(window.innerWidth / 2, window.innerHeight / 2);
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.cursorElement && this.cursorElement.parentNode) {
      this.cursorElement.parentNode.removeChild(this.cursorElement);
    }

    this.isInitialized = false;
  }
}

// Singleton
const cursorManager = new CursorManager();
export default cursorManager;
