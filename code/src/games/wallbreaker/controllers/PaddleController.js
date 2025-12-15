/**
 * PaddleController - Contrôleur du paddle
 *
 * Gère la logique de mouvement du paddle
 */

export default class PaddleController {
  /**
   * @param {PaddleModel} model - Modèle du paddle
   * @param {PaddleView} view - Vue du paddle
   * @param {InputController} inputController - Contrôleur des entrées
   */
  constructor(model, view, inputController) {
    this.model = model;
    this.view = view;
    this.inputController = inputController;
  }

  /**
   * Initialise le contrôleur
   */
  initialize() {
    // Rien de spécial à initialiser
  }

  /**
   * Met à jour le paddle
   * @param {number} delta - Delta temps en ms
   */
  update(delta) {
    const deltaSeconds = delta / 1000;

    // Vérifier le contrôle à la souris
    const mouseX = this.inputController.getMouseX();
    if (mouseX !== null) {
      // Contrôle à la souris - position directe
      this.model.setPositionX(mouseX);
    } else {
      // Contrôle au clavier/manette - direction
      const direction = this.inputController.getHorizontalDirection();
      this.model.setDirection(direction);
      this.model.update(deltaSeconds);
    }

    // Mettre à jour la vue
    this.view.update();
  }

  /**
   * Réinitialise le paddle à la position de départ
   */
  reset() {
    this.model.reset();
    this.view.update();
    this.view.playResetAnimation();
  }

  /**
   * Met à jour la vitesse du paddle
   * @param {number} speed
   */
  setSpeed(speed) {
    this.model.setSpeed(speed);
  }

  /**
   * Retourne le sprite du paddle pour les collisions
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.view.getSprite();
  }

  /**
   * Retourne le modèle du paddle
   * @returns {PaddleModel}
   */
  getModel() {
    return this.model;
  }

  /**
   * Joue l'effet de hit
   */
  playHitEffect() {
    this.view.playHitEffect();
  }

  /**
   * Détruit le contrôleur
   */
  destroy() {
    this.view.destroy();
  }
}
