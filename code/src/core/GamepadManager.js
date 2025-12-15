/**
 * GamepadManager - Gestionnaire de manettes
 *
 * Détecte automatiquement les manettes connectées et fournit
 * une interface unifiée pour lire les entrées
 */

/** Mapping des boutons Xbox/Standard */
export const GamepadButton = {
  A: 0,           // Confirmer / Sauter
  B: 1,           // Retour / Annuler
  X: 2,           // Action secondaire
  Y: 3,           // Action tertiaire
  LB: 4,          // Gâchette gauche
  RB: 5,          // Gâchette droite
  LT: 6,          // Trigger gauche
  RT: 7,          // Trigger droite
  SELECT: 8,      // Back / Select
  START: 9,       // Start / Menu
  L3: 10,         // Click stick gauche
  R3: 11,         // Click stick droit
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15
};

/** Mapping des axes */
export const GamepadAxis = {
  LEFT_X: 0,      // Stick gauche horizontal
  LEFT_Y: 1,      // Stick gauche vertical
  RIGHT_X: 2,     // Stick droit horizontal
  RIGHT_Y: 3      // Stick droit vertical
};

/** Seuil de détection pour les axes (dead zone) */
const AXIS_THRESHOLD = 0.5;

/**
 * Classe principale de gestion des manettes
 */
class GamepadManager {
  constructor() {
    /** @type {Map<number, Gamepad>} Manettes connectées */
    this.gamepads = new Map();

    /** @type {Function[]} Callbacks de connexion */
    this.onConnectCallbacks = [];

    /** @type {Function[]} Callbacks de déconnexion */
    this.onDisconnectCallbacks = [];

    /** @type {Map<number, Set<number>>} Boutons pressés par manette */
    this.pressedButtons = new Map();

    /** @type {boolean} Manager initialisé */
    this.initialized = false;

    /** @type {number|null} ID de l'animation frame */
    this.pollInterval = null;
  }

  /**
   * Initialise le gestionnaire de manettes
   */
  init() {
    if (this.initialized) return;

    // Écouter les événements de connexion/déconnexion
    window.addEventListener('gamepadconnected', (e) => this.handleConnect(e));
    window.addEventListener('gamepaddisconnected', (e) => this.handleDisconnect(e));

    // Vérifier les manettes déjà connectées
    this.pollGamepads();

    // Démarrer le polling continu
    this.startPolling();

    this.initialized = true;
    console.log('[GamepadManager] Initialisé');
  }

  /**
   * Démarre le polling des manettes
   */
  startPolling() {
    const poll = () => {
      this.pollGamepads();
      this.pollInterval = requestAnimationFrame(poll);
    };
    this.pollInterval = requestAnimationFrame(poll);
  }

  /**
   * Arrête le polling
   */
  stopPolling() {
    if (this.pollInterval) {
      cancelAnimationFrame(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Poll les manettes connectées
   */
  pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    for (const gamepad of gamepads) {
      if (gamepad) {
        const wasConnected = this.gamepads.has(gamepad.index);
        this.gamepads.set(gamepad.index, gamepad);

        // Détecter nouvelle connexion (pour navigateurs sans événement)
        if (!wasConnected) {
          this.notifyConnect(gamepad);
        }
      }
    }
  }

  /**
   * Gère la connexion d'une manette
   * @param {GamepadEvent} event
   */
  handleConnect(event) {
    const gamepad = event.gamepad;
    this.gamepads.set(gamepad.index, gamepad);
    this.pressedButtons.set(gamepad.index, new Set());
    this.notifyConnect(gamepad);
  }

  /**
   * Gère la déconnexion d'une manette
   * @param {GamepadEvent} event
   */
  handleDisconnect(event) {
    const gamepad = event.gamepad;
    this.gamepads.delete(gamepad.index);
    this.pressedButtons.delete(gamepad.index);
    this.notifyDisconnect(gamepad);
  }

  /**
   * Notifie les callbacks de connexion
   * @param {Gamepad} gamepad
   */
  notifyConnect(gamepad) {
    console.log(`[GamepadManager] Manette ${gamepad.index + 1} connectée: ${gamepad.id}`);
    this.onConnectCallbacks.forEach(cb => cb(gamepad));
  }

  /**
   * Notifie les callbacks de déconnexion
   * @param {Gamepad} gamepad
   */
  notifyDisconnect(gamepad) {
    console.log(`[GamepadManager] Manette ${gamepad.index + 1} déconnectée`);
    this.onDisconnectCallbacks.forEach(cb => cb(gamepad));
  }

  /**
   * Enregistre un callback de connexion
   * @param {Function} callback
   */
  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
    // Notifier pour les manettes déjà connectées
    this.gamepads.forEach(gamepad => callback(gamepad));
  }

  /**
   * Enregistre un callback de déconnexion
   * @param {Function} callback
   */
  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * Retourne le nombre de manettes connectées
   * @returns {number}
   */
  getConnectedCount() {
    // Recompter depuis navigator.getGamepads pour être sûr
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let count = 0;
    for (const gp of gamepads) {
      if (gp) count++;
    }
    return count;
  }

  /**
   * Retourne les infos des manettes connectées
   * @returns {Array<{index: number, id: string, connected: boolean}>}
   */
  getConnectedGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const result = [];
    for (const gp of gamepads) {
      if (gp) {
        result.push({
          index: gp.index,
          id: gp.id,
          connected: gp.connected
        });
      }
    }
    return result;
  }

  /**
   * Retourne une manette par son index
   * @param {number} index - Index de la manette (0 ou 1)
   * @returns {Gamepad|null}
   */
  getGamepad(index = 0) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads[index] || null;
  }

  /**
   * Vérifie si un bouton est pressé
   * @param {number} button - Index du bouton (utiliser GamepadButton)
   * @param {number} gamepadIndex - Index de la manette
   * @returns {boolean}
   */
  isButtonPressed(button, gamepadIndex = 0) {
    const gamepad = this.getGamepad(gamepadIndex);
    if (!gamepad) return false;
    return gamepad.buttons[button]?.pressed || false;
  }

  /**
   * Vérifie si un bouton vient d'être pressé (front montant)
   * @param {number} button - Index du bouton
   * @param {number} gamepadIndex - Index de la manette
   * @returns {boolean}
   */
  isButtonJustPressed(button, gamepadIndex = 0) {
    const gamepad = this.getGamepad(gamepadIndex);
    if (!gamepad) return false;

    const isPressed = gamepad.buttons[button]?.pressed || false;
    const wasPressed = this.pressedButtons.get(gamepadIndex)?.has(button) || false;

    // Mettre à jour l'état
    if (!this.pressedButtons.has(gamepadIndex)) {
      this.pressedButtons.set(gamepadIndex, new Set());
    }

    if (isPressed) {
      this.pressedButtons.get(gamepadIndex).add(button);
    } else {
      this.pressedButtons.get(gamepadIndex).delete(button);
    }

    return isPressed && !wasPressed;
  }

  /**
   * Retourne la valeur d'un axe
   * @param {number} axis - Index de l'axe (utiliser GamepadAxis)
   * @param {number} gamepadIndex - Index de la manette
   * @returns {number} Valeur entre -1 et 1
   */
  getAxis(axis, gamepadIndex = 0) {
    const gamepad = this.getGamepad(gamepadIndex);
    if (!gamepad) return 0;
    return gamepad.axes[axis] || 0;
  }

  /**
   * Retourne la direction du stick gauche (avec dead zone)
   * @param {number} gamepadIndex - Index de la manette
   * @returns {{x: number, y: number, direction: string|null}}
   */
  getLeftStick(gamepadIndex = 0) {
    const x = this.getAxis(GamepadAxis.LEFT_X, gamepadIndex);
    const y = this.getAxis(GamepadAxis.LEFT_Y, gamepadIndex);

    let direction = null;

    // Déterminer la direction dominante
    if (Math.abs(x) > AXIS_THRESHOLD || Math.abs(y) > AXIS_THRESHOLD) {
      if (Math.abs(x) > Math.abs(y)) {
        direction = x > 0 ? 'right' : 'left';
      } else {
        direction = y > 0 ? 'down' : 'up';
      }
    }

    return { x, y, direction };
  }

  /**
   * Retourne la direction du D-Pad
   * @param {number} gamepadIndex - Index de la manette
   * @returns {string|null} 'up', 'down', 'left', 'right' ou null
   */
  getDpadDirection(gamepadIndex = 0) {
    if (this.isButtonPressed(GamepadButton.DPAD_UP, gamepadIndex)) return 'up';
    if (this.isButtonPressed(GamepadButton.DPAD_DOWN, gamepadIndex)) return 'down';
    if (this.isButtonPressed(GamepadButton.DPAD_LEFT, gamepadIndex)) return 'left';
    if (this.isButtonPressed(GamepadButton.DPAD_RIGHT, gamepadIndex)) return 'right';
    return null;
  }

  /**
   * Retourne la direction combinée (stick OU dpad)
   * @param {number} gamepadIndex - Index de la manette
   * @returns {string|null}
   */
  getDirection(gamepadIndex = 0) {
    // Priorité au D-Pad
    const dpad = this.getDpadDirection(gamepadIndex);
    if (dpad) return dpad;

    // Sinon stick gauche
    return this.getLeftStick(gamepadIndex).direction;
  }

  /**
   * Détruit le manager
   */
  destroy() {
    this.stopPolling();
    window.removeEventListener('gamepadconnected', this.handleConnect);
    window.removeEventListener('gamepaddisconnected', this.handleDisconnect);
    this.gamepads.clear();
    this.pressedButtons.clear();
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.initialized = false;
  }
}

// Instance singleton
export const gamepadManager = new GamepadManager();

// Export par défaut
export default gamepadManager;
