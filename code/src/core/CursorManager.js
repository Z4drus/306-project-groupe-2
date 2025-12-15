/**
 * CursorManager - Gestionnaire de curseur personnalisé
 *
 * Gère un curseur custom contrôlable par souris ET manette
 * Le curseur suit la souris et peut être déplacé au joystick
 */

import gamepadManager, { GamepadButton } from './GamepadManager.js';

/**
 * Vitesse de déplacement du curseur en pixels par frame
 */
const CURSOR_SPEED = 8;

/**
 * Zone morte du joystick (0-1)
 */
const DEADZONE = 0.3;

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

    // Élément actuellement survolé
    this.hoveredElement = null;
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
   * Met à jour le curseur (appelé chaque frame)
   */
  update() {
    if (!this.isVisible) return;

    // Vérifier les entrées manette
    const stick = gamepadManager.getLeftStick(0);

    if (stick) {
      const { x: axisX, y: axisY } = stick;

      // Appliquer la zone morte
      const effectiveX = Math.abs(axisX) > DEADZONE ? axisX : 0;
      const effectiveY = Math.abs(axisY) > DEADZONE ? axisY : 0;

      if (effectiveX !== 0 || effectiveY !== 0) {
        this.mode = 'gamepad';
        this.x += effectiveX * CURSOR_SPEED;
        this.y += effectiveY * CURSOR_SPEED;

        // Limiter aux bords de l'écran
        this.x = Math.max(0, Math.min(window.innerWidth, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight, this.y));

        this.updateCursorPosition();

        // Mettre à jour la classe pour le mode manette
        if (this.cursorElement) {
          this.cursorElement.classList.add('gamepad-mode');
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
   */
  checkInteractiveElements() {
    const elementUnderCursor = document.elementFromPoint(this.x, this.y);

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
