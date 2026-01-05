/**
 * DOMExitConfirmDialog - Dialogue de confirmation de sortie dans le DOM
 *
 * Affiche une popup de confirmation dans le DOM HTML (pas dans le canvas Phaser)
 * avec le style arcade/neon du site. Supporte clavier et manette.
 */

import gamepadManager, { GamepadButton } from './GamepadManager.js';
import cursorManager from './CursorManager.js';

export default class DOMExitConfirmDialog {
  /**
   * @param {Object} options - Options de configuration
   * @param {Function} options.onConfirm - Callback si confirme
   * @param {Function} options.onCancel - Callback si annule
   * @param {Function} options.onShow - Callback quand le dialogue s'affiche (pour pause)
   * @param {Function} options.onHide - Callback quand le dialogue se ferme (pour resume)
   * @param {string} options.message - Message principal
   * @param {string} options.subMessage - Sous-message
   */
  constructor(options = {}) {
    this.onConfirm = options.onConfirm || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onShow = options.onShow || (() => {});
    this.onHide = options.onHide || (() => {});
    this.message = options.message || 'Quitter la partie ?';
    this.subMessage = options.subMessage || 'Ta progression ne sera pas sauvegardee';

    this.isVisible = false;
    this.selectedButton = 1; // 0 = Oui, 1 = Non (Non par defaut)
    this.canAct = false;

    // Elements DOM
    this.overlay = null;
    this.container = null;
    this.yesButton = null;
    this.noButton = null;

    // Bindings pour les listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateGamepad = this.updateGamepad.bind(this);

    // Animation frame pour gamepad
    this.animationFrameId = null;

    // Tracking pour eviter les selections repetees avec la manette
    this.lastDirection = null;
  }

  /**
   * Affiche le dialogue
   */
  show() {
    if (this.isVisible) return;
    this.isVisible = true;
    this.selectedButton = 1; // Non par defaut
    this.canAct = false;
    this.lastDirection = null; // Reset du tracking direction

    // Notifier que le dialogue s'affiche (pour mettre le jeu en pause)
    this.onShow();

    // Afficher le curseur custom
    cursorManager.show();

    this.createDOM();
    this.setupEventListeners();
    this.updateButtonSelection();
    this.startGamepadLoop();

    // Activer apres un court delai pour eviter les inputs accidentels
    setTimeout(() => {
      this.canAct = true;
    }, 200);
  }

  /**
   * Cree les elements DOM
   */
  createDOM() {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'exit-confirm-overlay';

    // Container
    this.container = document.createElement('div');
    this.container.className = 'exit-confirm-container';

    // Message principal
    const messageEl = document.createElement('h2');
    messageEl.className = 'exit-confirm-message';
    messageEl.textContent = this.message;

    // Sous-message
    const subMessageEl = document.createElement('p');
    subMessageEl.className = 'exit-confirm-submessage';
    subMessageEl.textContent = this.subMessage;

    // Conteneur des boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'exit-confirm-buttons';

    // Bouton Oui
    this.yesButton = document.createElement('button');
    this.yesButton.className = 'exit-confirm-btn exit-confirm-btn-yes';
    this.yesButton.textContent = 'OUI';
    this.yesButton.setAttribute('data-index', '0');

    // Bouton Non
    this.noButton = document.createElement('button');
    this.noButton.className = 'exit-confirm-btn exit-confirm-btn-no';
    this.noButton.textContent = 'NON';
    this.noButton.setAttribute('data-index', '1');

    buttonsContainer.appendChild(this.yesButton);
    buttonsContainer.appendChild(this.noButton);

    // Instructions
    const instructions = document.createElement('p');
    instructions.className = 'exit-confirm-instructions';
    instructions.textContent = '← → pour choisir    A/ENTREE = Valider    B/ESC = Annuler';

    // Assemblage
    this.container.appendChild(messageEl);
    this.container.appendChild(subMessageEl);
    this.container.appendChild(buttonsContainer);
    this.container.appendChild(instructions);

    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);

    // Forcer le reflow puis ajouter la classe visible pour l'animation
    this.overlay.offsetHeight;
    this.overlay.classList.add('visible');
  }

  /**
   * Configure les event listeners
   */
  setupEventListeners() {
    // Clavier
    document.addEventListener('keydown', this.handleKeyDown);

    // Clics souris
    this.yesButton.addEventListener('click', () => {
      if (this.canAct) this.confirm();
    });

    this.noButton.addEventListener('click', () => {
      if (this.canAct) this.cancel();
    });

    // Hover souris
    this.yesButton.addEventListener('mouseenter', () => {
      this.selectedButton = 0;
      this.updateButtonSelection();
    });

    this.noButton.addEventListener('mouseenter', () => {
      this.selectedButton = 1;
      this.updateButtonSelection();
    });

    // Empecher la propagation des clics sur l'overlay
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && this.canAct) {
        this.cancel();
      }
    });
  }

  /**
   * Gere les evenements clavier
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (!this.isVisible || !this.canAct) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.cancel();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.activateSelected();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.selectedButton = 0;
        this.updateButtonSelection();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.selectedButton = 1;
        this.updateButtonSelection();
        break;
    }
  }

  /**
   * Demarre la boucle de mise a jour gamepad
   */
  startGamepadLoop() {
    const loop = () => {
      if (!this.isVisible) return;
      this.updateGamepad();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Met a jour la selection via gamepad
   */
  updateGamepad() {
    if (!this.isVisible || !this.canAct) return;

    // Navigation gauche/droite avec tracking "just pressed" pour les directions
    const direction = gamepadManager.getDirection(0);

    // Detecter un changement de direction (comme un "just pressed")
    if (direction !== this.lastDirection) {
      if (direction === 'left') {
        this.selectedButton = 0;
        this.updateButtonSelection();
      } else if (direction === 'right') {
        this.selectedButton = 1;
        this.updateButtonSelection();
      }
      this.lastDirection = direction;
    }

    // Bouton A ou X = Valider (support des deux boutons)
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.X, 0)) {
      this.activateSelected();
    }

    // Bouton B = Annuler
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.cancel();
    }
  }

  /**
   * Met a jour l'affichage des boutons
   */
  updateButtonSelection() {
    if (!this.yesButton || !this.noButton) return;

    this.yesButton.classList.toggle('selected', this.selectedButton === 0);
    this.noButton.classList.toggle('selected', this.selectedButton === 1);
  }

  /**
   * Active le bouton selectionne
   */
  activateSelected() {
    if (this.selectedButton === 0) {
      this.confirm();
    } else {
      this.cancel();
    }
  }

  /**
   * Confirme la sortie
   */
  confirm() {
    if (!this.canAct) return;
    this.hide(false); // Pas de resume car on quitte
    this.onConfirm();
  }

  /**
   * Annule la sortie
   */
  cancel() {
    if (!this.canAct) return;
    this.hide(true); // Resume le jeu
    this.onCancel();
  }

  /**
   * Cache le dialogue
   * @param {boolean} shouldResume - Si true, appelle onHide pour reprendre le jeu
   */
  hide(shouldResume = false) {
    if (!this.isVisible) return;
    this.isVisible = false;

    // Cacher le curseur custom (retour au mode jeu)
    cursorManager.hide();

    // Notifier pour reprendre le jeu (seulement si on annule, pas si on confirme)
    if (shouldResume) {
      this.onHide();
    }

    // Arreter la boucle gamepad
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Retirer les listeners
    document.removeEventListener('keydown', this.handleKeyDown);

    // Animation de fermeture
    if (this.overlay) {
      this.overlay.classList.remove('visible');

      // Attendre la fin de l'animation avant de supprimer
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.container = null;
        this.yesButton = null;
        this.noButton = null;
      }, 200);
    }
  }

  /**
   * Retourne true si le dialogue est visible
   * @returns {boolean}
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Detruit le dialogue
   */
  destroy() {
    this.hide();
  }
}
