/**
 * GameStateModel - Modèle de l'état global du jeu Wallbreaker
 *
 * Gère le score, les vies, le niveau et l'état de la partie
 */

import { INITIAL_VALUES, SCORES, getDifficultyParams } from '../config/GameConfig.js';

/** États du jeu possibles */
export const GameState = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over'
};

export default class GameStateModel {
  /**
   * @param {Object} initialData - Données initiales optionnelles
   */
  constructor(initialData = {}) {
    this.score = initialData.score ?? INITIAL_VALUES.SCORE;
    this.lives = initialData.lives ?? INITIAL_VALUES.LIVES;
    this.level = initialData.level ?? INITIAL_VALUES.LEVEL;

    // État courant
    this.state = GameState.READY;
    this.ballOnPaddle = true;

    // Compteurs de briques
    this.totalBricks = 0;
    this.remainingBricks = 0;
    this.destructibleBricks = 0;

    // Paramètres de difficulté
    this.difficultyParams = getDifficultyParams(this.level);

    // Statistiques de niveau
    this.bricksDestroyedThisLevel = 0;
    this.perfectLevel = true;

    // Callbacks externes
    this.onScoreUpdate = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
  }

  /**
   * Réinitialise l'état pour un nouveau niveau
   * @param {number} level - Nouveau niveau
   */
  resetForLevel(level) {
    this.level = level;
    this.difficultyParams = getDifficultyParams(level);
    this.state = GameState.READY;
    this.ballOnPaddle = true;
    this.totalBricks = 0;
    this.remainingBricks = 0;
    this.destructibleBricks = 0;
    this.bricksDestroyedThisLevel = 0;
    this.perfectLevel = true;
  }

  /**
   * Réinitialise l'état complet pour une nouvelle partie
   */
  resetForNewGame() {
    this.score = INITIAL_VALUES.SCORE;
    this.lives = INITIAL_VALUES.LIVES;
    this.level = INITIAL_VALUES.LEVEL;
    this.state = GameState.READY;
    this.resetForLevel(this.level);
  }

  /**
   * Définit le nombre total de briques
   * @param {number} total - Nombre total
   * @param {number} destructible - Nombre destructible
   */
  setBrickCounts(total, destructible) {
    this.totalBricks = total;
    this.remainingBricks = destructible;
    this.destructibleBricks = destructible;
  }

  /**
   * Ajoute des points au score
   * @param {number} points - Points à ajouter
   */
  addScore(points) {
    this.score += points;
    this.notifyScoreUpdate();
  }

  /**
   * Détruit une brique
   * @param {number} points - Points de la brique
   */
  destroyBrick(points) {
    this.addScore(points);
    this.remainingBricks--;
    this.bricksDestroyedThisLevel++;

    // Vérifier si le niveau est terminé
    if (this.remainingBricks <= 0) {
      this.completeLevel();
    }
  }

  /**
   * Endommage une brique (sans la détruire)
   * @param {number} points - Points bonus pour le dommage
   */
  damageBrick(points = 5) {
    this.addScore(points);
  }

  /**
   * Complète le niveau actuel
   */
  completeLevel() {
    this.state = GameState.LEVEL_COMPLETE;
    this.addScore(SCORES.LEVEL_COMPLETE);

    // Bonus niveau parfait (pas de vie perdue)
    if (this.perfectLevel) {
      this.addScore(SCORES.PERFECT_LEVEL);
    }

    if (this.onLevelComplete) {
      this.onLevelComplete(this.level, this.score);
    }
  }

  /**
   * Passe au niveau suivant
   */
  advanceLevel() {
    this.resetForLevel(this.level + 1);
    this.notifyScoreUpdate();
  }

  /**
   * Perd une vie
   * @returns {boolean} True si game over
   */
  loseLife() {
    this.lives--;
    this.perfectLevel = false;
    this.ballOnPaddle = true;
    this.state = GameState.READY;
    this.notifyScoreUpdate();

    if (this.lives <= 0) {
      this.state = GameState.GAME_OVER;
      this.notifyGameOver();
      return true;
    }
    return false;
  }

  /**
   * Lance la balle
   */
  launchBall() {
    if (this.ballOnPaddle && this.state === GameState.READY) {
      this.ballOnPaddle = false;
      this.state = GameState.PLAYING;
    }
  }

  /**
   * Met le jeu en pause
   */
  pause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    }
  }

  /**
   * Reprend le jeu
   */
  resume() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }

  /**
   * Vérifie si le jeu est en cours
   * @returns {boolean}
   */
  isPlaying() {
    return this.state === GameState.PLAYING;
  }

  /**
   * Vérifie si la balle est sur le paddle
   * @returns {boolean}
   */
  isBallOnPaddle() {
    return this.ballOnPaddle;
  }

  /**
   * Vérifie si le niveau est terminé
   * @returns {boolean}
   */
  isLevelComplete() {
    return this.state === GameState.LEVEL_COMPLETE;
  }

  /**
   * Vérifie si la partie est terminée
   * @returns {boolean}
   */
  isGameOver() {
    return this.state === GameState.GAME_OVER;
  }

  /**
   * Retourne la vitesse actuelle de la balle
   * @returns {number}
   */
  getBallSpeed() {
    return this.difficultyParams.ballSpeed;
  }

  /**
   * Retourne la vitesse actuelle du paddle
   * @returns {number}
   */
  getPaddleSpeed() {
    return this.difficultyParams.paddleSpeed;
  }

  /**
   * Définit le callback de mise à jour du score
   * @param {Function} callback
   */
  setScoreUpdateCallback(callback) {
    this.onScoreUpdate = callback;
  }

  /**
   * Définit le callback de game over
   * @param {Function} callback
   */
  setGameOverCallback(callback) {
    this.onGameOver = callback;
  }

  /**
   * Définit le callback de niveau complété
   * @param {Function} callback
   */
  setLevelCompleteCallback(callback) {
    this.onLevelComplete = callback;
  }

  /**
   * Notifie la mise à jour du score
   */
  notifyScoreUpdate() {
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, this.lives, this.level);
    }
  }

  /**
   * Notifie le game over
   */
  notifyGameOver() {
    if (this.onGameOver) {
      this.onGameOver(this.score);
    }
  }

  /**
   * Exporte l'état pour sauvegarde/transfert
   * @returns {Object}
   */
  export() {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level
    };
  }
}
