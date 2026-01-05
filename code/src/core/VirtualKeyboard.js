/**
 * VirtualKeyboard - Clavier virtuel arcade pour saisie avec manette
 *
 * S'affiche en plein écran quand un input est focusé.
 * Supporte la navigation clavier, souris et manette.
 * Layout QWERTZ (Suisse).
 */

import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import gamepadManager, { GamepadButton } from './GamepadManager.js';

/**
 * Layout QWERTZ suisse standard (pour username)
 */
const QWERTZ_LAYOUT = {
  default: [
    '1 2 3 4 5 6 7 8 9 0',
    'q w e r t z u i o p',
    'a s d f g h j k l',
    '{shift} y x c v b n m {backspace}',
    '{space} {done}'
  ],
  shift: [
    '! @ # $ % ^ & * ( )',
    'Q W E R T Z U I O P',
    'A S D F G H J K L',
    '{shift} Y X C V B N M {backspace}',
    '{space} {done}'
  ]
};

/**
 * Layout QWERTZ avec caractères spéciaux (pour mot de passe)
 */
const QWERTZ_PASSWORD_LAYOUT = {
  default: [
    '1 2 3 4 5 6 7 8 9 0',
    'q w e r t z u i o p',
    'a s d f g h j k l',
    '{shift} y x c v b n m {backspace}',
    '{symbols} {space} {done}'
  ],
  shift: [
    '! @ # $ % ^ & * ( )',
    'Q W E R T Z U I O P',
    'A S D F G H J K L',
    '{shift} Y X C V B N M {backspace}',
    '{symbols} {space} {done}'
  ],
  symbols: [
    '! @ # $ % ^ & * ( )',
    '- _ = + [ ] { } |',
    '; : \' " , . < > /',
    '{shift} \\ ` ~ ? {backspace}',
    '{symbols} {space} {done}'
  ]
};

/**
 * Noms d'affichage des touches spéciales
 */
const DISPLAY_LABELS = {
  '{backspace}': '⌫',
  '{shift}': '⇧',
  '{space}': 'ESPACE',
  '{done}': 'OK ✓',
  '{symbols}': '!#$'
};

export default class VirtualKeyboard {
  constructor() {
    this.keyboard = null;
    this.overlay = null;
    this.container = null;
    this.inputDisplay = null;
    this.currentInput = null;
    this.isVisible = false;
    this.onInputChange = null;
    this.onClose = null;

    // Navigation manette
    this.selectedRow = 0;
    this.selectedCol = 0;
    this.keyElements = [];
    this.lastDirection = null;
    this.animationFrameId = null;

    // Bindings
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateGamepad = this.updateGamepad.bind(this);
  }

  /**
   * Ouvre le clavier pour un input
   * @param {HTMLInputElement} inputElement - L'élément input ciblé
   * @param {Object} options - Options
   * @param {string} options.label - Label à afficher
   * @param {boolean} options.isPassword - Si c'est un mot de passe
   * @param {Function} options.onChange - Callback de changement
   * @param {Function} options.onClose - Callback de fermeture
   * @param {Function} options.onDone - Callback lors du clic sur OK (si non défini, ferme le clavier)
   * @param {string} options.doneLabel - Label personnalisé pour le bouton OK
   */
  open(inputElement, options = {}) {
    if (this.isVisible) return;

    this.currentInput = inputElement;
    this.onInputChange = options.onChange || null;
    this.onClose = options.onClose || null;
    this.onDone = options.onDone || null;
    this.isPassword = options.isPassword || false;
    this.label = options.label || 'Saisie';
    this.doneLabel = options.doneLabel || 'OK ✓';

    this.createDOM();
    this.createKeyboard();
    this.setupEventListeners();
    this.startGamepadLoop();

    // Animation d'ouverture
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
    });

    this.isVisible = true;
  }

  /**
   * Crée les éléments DOM
   */
  createDOM() {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'virtual-keyboard-overlay';

    // Container principal
    this.container = document.createElement('div');
    this.container.className = 'virtual-keyboard-container';

    // Bouton retour en haut à gauche
    const backButton = document.createElement('button');
    backButton.className = 'virtual-keyboard-back-btn';
    backButton.innerHTML = '← Retour';
    backButton.addEventListener('click', () => this.close());

    // Header avec label et preview
    const header = document.createElement('div');
    header.className = 'virtual-keyboard-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'virtual-keyboard-label';
    labelEl.textContent = this.label;

    // Zone d'affichage de la saisie
    this.inputDisplay = document.createElement('div');
    this.inputDisplay.className = 'virtual-keyboard-input-display';
    this.updateInputDisplay();

    header.appendChild(labelEl);
    header.appendChild(this.inputDisplay);

    this.container.appendChild(backButton);

    // Zone du clavier
    const keyboardWrapper = document.createElement('div');
    keyboardWrapper.className = 'virtual-keyboard-wrapper virtual-keyboard-target';

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'virtual-keyboard-instructions';
    instructions.innerHTML = `
      <span>🎮 Flèches = Naviguer</span>
      <span>A/Entrée = Sélectionner</span>
      <span>B/Échap = Fermer</span>
    `;

    // Assemblage
    this.container.appendChild(header);
    this.container.appendChild(keyboardWrapper);
    this.container.appendChild(instructions);
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }

  /**
   * Crée l'instance du clavier simple-keyboard
   */
  createKeyboard() {
    // Utiliser le layout avec symboles pour les mots de passe
    const layout = this.isPassword ? QWERTZ_PASSWORD_LAYOUT : QWERTZ_LAYOUT;

    // Labels personnalisés avec le texte du bouton done
    const customDisplay = {
      ...DISPLAY_LABELS,
      '{done}': this.doneLabel
    };

    this.keyboard = new Keyboard('.virtual-keyboard-target', {
      onChange: (input) => this.handleChange(input),
      onKeyPress: (button) => this.handleKeyPress(button),
      layout: layout,
      display: customDisplay,
      theme: 'hg-theme-default arcade-keyboard',
      buttonTheme: [
        {
          class: 'key-special',
          buttons: '{backspace} {shift} {space} {done} {symbols}'
        }
      ],
      // Désactivé car on gère nous-même les entrées clavier physique
      physicalKeyboardHighlight: false,
      physicalKeyboardHighlightPress: false,
      disableButtonHold: true
    });

    // Initialiser avec la valeur actuelle
    if (this.currentInput) {
      this.keyboard.setInput(this.currentInput.value);
    }

    // Récupérer les éléments de touches pour la navigation
    this.cacheKeyElements();
    this.updateKeySelection();
  }

  /**
   * Met en cache les éléments de touches pour navigation
   */
  cacheKeyElements() {
    this.keyElements = [];
    const rows = document.querySelectorAll('.virtual-keyboard-target .hg-row');

    rows.forEach((row) => {
      const keys = Array.from(row.querySelectorAll('.hg-button'));
      if (keys.length > 0) {
        this.keyElements.push(keys);
      }
    });
  }

  /**
   * Met à jour la sélection visuelle des touches
   */
  updateKeySelection() {
    // Retirer toutes les sélections
    document.querySelectorAll('.virtual-keyboard-target .hg-button').forEach(btn => {
      btn.classList.remove('key-selected');
    });

    // Appliquer la nouvelle sélection
    if (this.keyElements[this.selectedRow] && this.keyElements[this.selectedRow][this.selectedCol]) {
      this.keyElements[this.selectedRow][this.selectedCol].classList.add('key-selected');
    }
  }

  /**
   * Configure les event listeners
   */
  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);

    // Clic sur l'overlay pour fermer
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  /**
   * Gère les événements clavier
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (!this.isVisible) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Enter':
        e.preventDefault();
        // Passer au step suivant (onDone) au lieu d'activer une touche
        if (this.onDone) {
          const value = this.currentInput?.value || '';
          this.onDone(value);
        } else {
          this.close();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveSelection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.moveSelection('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.moveSelection('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.moveSelection('right');
        break;
      case 'Backspace':
        e.preventDefault();
        this.handlePhysicalBackspace();
        break;
      default:
        // Gérer les caractères alphanumériques et spéciaux
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.handlePhysicalKeyInput(e.key);
        }
        break;
    }
  }

  /**
   * Gère la saisie d'un caractère depuis le clavier physique
   * @param {string} char - Le caractère tapé
   */
  handlePhysicalKeyInput(char) {
    if (!this.keyboard) return;

    const currentValue = this.keyboard.getInput() || '';
    const newValue = currentValue + char;

    this.keyboard.setInput(newValue);
    this.handleChange(newValue);
  }

  /**
   * Gère le backspace depuis le clavier physique
   */
  handlePhysicalBackspace() {
    if (!this.keyboard) return;

    const currentValue = this.keyboard.getInput() || '';
    if (currentValue.length > 0) {
      const newValue = currentValue.slice(0, -1);
      this.keyboard.setInput(newValue);
      this.handleChange(newValue);
    }
  }

  /**
   * Démarre la boucle de mise à jour gamepad
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
   * Met à jour la navigation via gamepad
   */
  updateGamepad() {
    if (!this.isVisible) return;

    const direction = gamepadManager.getDirection(0);

    // Navigation avec tracking "just pressed"
    if (direction !== this.lastDirection) {
      if (direction === 'up') this.moveSelection('up');
      else if (direction === 'down') this.moveSelection('down');
      else if (direction === 'left') this.moveSelection('left');
      else if (direction === 'right') this.moveSelection('right');
      this.lastDirection = direction;
    }

    // Bouton A ou X = Sélectionner
    if (gamepadManager.isButtonJustPressed(GamepadButton.A, 0) ||
        gamepadManager.isButtonJustPressed(GamepadButton.X, 0)) {
      this.activateSelectedKey();
    }

    // Bouton B = Fermer
    if (gamepadManager.isButtonJustPressed(GamepadButton.B, 0)) {
      this.close();
    }
  }

  /**
   * Déplace la sélection
   * @param {string} direction - 'up', 'down', 'left', 'right'
   */
  moveSelection(direction) {
    const currentRow = this.keyElements[this.selectedRow];
    if (!currentRow) return;

    switch (direction) {
      case 'up':
        if (this.selectedRow > 0) {
          this.selectedRow--;
          // Ajuster la colonne si la nouvelle ligne est plus courte
          const newRowLength = this.keyElements[this.selectedRow].length;
          this.selectedCol = Math.min(this.selectedCol, newRowLength - 1);
        }
        break;
      case 'down':
        if (this.selectedRow < this.keyElements.length - 1) {
          this.selectedRow++;
          const newRowLength = this.keyElements[this.selectedRow].length;
          this.selectedCol = Math.min(this.selectedCol, newRowLength - 1);
        }
        break;
      case 'left':
        if (this.selectedCol > 0) {
          this.selectedCol--;
        } else {
          // Wrap to end of row
          this.selectedCol = currentRow.length - 1;
        }
        break;
      case 'right':
        if (this.selectedCol < currentRow.length - 1) {
          this.selectedCol++;
        } else {
          // Wrap to start of row
          this.selectedCol = 0;
        }
        break;
    }

    this.updateKeySelection();
  }

  /**
   * Active la touche sélectionnée
   */
  activateSelectedKey() {
    const selectedKey = this.keyElements[this.selectedRow]?.[this.selectedCol];
    if (selectedKey) {
      // Animation de press
      selectedKey.classList.add('key-pressed');
      setTimeout(() => selectedKey.classList.remove('key-pressed'), 150);

      // Simuler le clic
      selectedKey.click();
    }
  }

  /**
   * Gère le changement de texte
   * @param {string} input
   */
  handleChange(input) {
    if (this.currentInput) {
      this.currentInput.value = input;

      // Trigger un événement input pour Alpine.js
      this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (this.onInputChange) {
      this.onInputChange(input);
    }

    this.updateInputDisplay();
  }

  /**
   * Gère la pression d'une touche
   * @param {string} button
   */
  handleKeyPress(button) {
    if (button === '{done}') {
      // Si onDone est défini, l'appeler au lieu de fermer
      if (this.onDone) {
        const value = this.currentInput?.value || '';
        this.onDone(value);
      } else {
        this.close();
      }
    } else if (button === '{shift}') {
      const currentLayout = this.keyboard.options.layoutName;
      // Basculer entre default et shift (mais pas symbols)
      if (currentLayout === 'symbols') {
        this.keyboard.setOptions({ layoutName: 'shift' });
      } else {
        this.keyboard.setOptions({
          layoutName: currentLayout === 'default' ? 'shift' : 'default'
        });
      }
      // Re-cacher les éléments de touches après changement de layout
      setTimeout(() => {
        this.cacheKeyElements();
        this.updateKeySelection();
      }, 50);
    } else if (button === '{symbols}') {
      const currentLayout = this.keyboard.options.layoutName;
      this.keyboard.setOptions({
        layoutName: currentLayout === 'symbols' ? 'default' : 'symbols'
      });
      // Re-cacher les éléments de touches après changement de layout
      setTimeout(() => {
        this.cacheKeyElements();
        this.updateKeySelection();
      }, 50);
    } else if (button === '{backspace}') {
      // Simple-keyboard ne déclenche pas onChange quand le résultat est vide
      // On force donc la mise à jour manuellement
      setTimeout(() => {
        const currentInput = this.keyboard.getInput() || '';
        // S'assurer que l'input HTML et l'affichage sont synchronisés
        if (this.currentInput) {
          this.currentInput.value = currentInput;
          this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (this.onInputChange) {
          this.onInputChange(currentInput);
        }
        this.updateInputDisplay();
      }, 10);
    }
  }

  /**
   * Met à jour l'affichage de la saisie
   */
  updateInputDisplay() {
    if (!this.inputDisplay) return;

    const value = this.currentInput?.value || '';

    if (this.isPassword && value.length > 0) {
      this.inputDisplay.textContent = '•'.repeat(value.length);
    } else {
      this.inputDisplay.textContent = value;
    }

    // Ajouter un curseur clignotant
    this.inputDisplay.innerHTML += '<span class="keyboard-cursor">|</span>';
  }

  /**
   * Transition fluide vers un nouveau champ sans fermer le clavier
   * @param {HTMLInputElement} inputElement - Le nouvel input
   * @param {Object} options - Nouvelles options
   */
  transition(inputElement, options = {}) {
    if (!this.isVisible) return;

    // Animation de transition
    this.container.classList.add('transitioning');

    setTimeout(() => {
      // Mettre à jour les références
      this.currentInput = inputElement;
      this.onInputChange = options.onChange || null;
      this.onClose = options.onClose || null;
      this.onDone = options.onDone || null;
      this.isPassword = options.isPassword || false;
      this.label = options.label || 'Saisie';
      this.doneLabel = options.doneLabel || 'OK ✓';

      // Mettre à jour le label
      const labelEl = this.container.querySelector('.virtual-keyboard-label');
      if (labelEl) {
        labelEl.textContent = this.label;
      }

      // Détruire l'ancien clavier et en créer un nouveau avec le bon layout
      if (this.keyboard) {
        this.keyboard.destroy();
      }

      // Recréer la zone du clavier
      const oldWrapper = this.container.querySelector('.virtual-keyboard-wrapper');
      if (oldWrapper) {
        const newWrapper = document.createElement('div');
        newWrapper.className = 'virtual-keyboard-wrapper virtual-keyboard-target';
        oldWrapper.replaceWith(newWrapper);
      }

      this.createKeyboard();

      // Réinitialiser la navigation
      this.selectedRow = 0;
      this.selectedCol = 0;

      // Mettre à jour l'affichage
      this.updateInputDisplay();

      // Fin de l'animation
      setTimeout(() => {
        this.container.classList.remove('transitioning');
      }, 50);
    }, 150);
  }

  /**
   * Ferme le clavier
   */
  close() {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Arrêter la boucle gamepad
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Retirer les listeners
    document.removeEventListener('keydown', this.handleKeyDown);

    // Animation de fermeture
    this.overlay.classList.remove('visible');

    setTimeout(() => {
      if (this.keyboard) {
        this.keyboard.destroy();
        this.keyboard = null;
      }
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.container = null;
      this.inputDisplay = null;
      this.keyElements = [];

      if (this.onClose) {
        this.onClose();
      }
    }, 200);
  }

  /**
   * Détruit le clavier
   */
  destroy() {
    this.close();
  }
}

// Instance singleton pour usage facile
export const virtualKeyboard = new VirtualKeyboard();
