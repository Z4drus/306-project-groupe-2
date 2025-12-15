/**
 * GameStateModel - Modèle de l'état global du jeu
 *
 * Gère le score, les vies, le niveau et les modes de jeu
 */

import { INITIAL_VALUES, SCORES, getDifficultyParams } from '../config/GameConfig.js';

/** Modes de jeu possibles */
export const GameMode = {
  SCATTER: 'scatter',
  CHASE: 'chase',
  FRIGHTENED: 'frightened'
};

export default class GameStateModel {
  /**
   * @param {Object} initialData - Données initiales optionnelles
   */
  constructor(initialData = {}) {
    this.score = initialData.score ?? INITIAL_VALUES.SCORE;
    this.lives = initialData.lives ?? INITIAL_VALUES.LIVES;
    this.level = initialData.level ?? INITIAL_VALUES.LEVEL;

    this.numDots = 0;
    this.totalDots = 0;

    // Mode actuel et timers
    this.currentModeIndex = 0;
    this.changeModeTimer = 0;
    this.isPaused = false;
    this.remainingTime = 0;

    // Paramètres de difficulté
    this.difficultyParams = getDifficultyParams(this.level);

    // Flags de sortie des fantômes
    this.isInkyOut = false;
    this.isClydeOut = false;

    // État du jeu
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.waitingForDeathAnimation = false;

    // Callbacks externes
    this.onScoreUpdate = null;
    this.onGameOver = null;
  }

  /**
   * Réinitialise l'état pour un nouveau niveau
   * @param {number} level - Nouveau niveau
   */
  resetForLevel(level) {
    this.level = level;
    this.difficultyParams = getDifficultyParams(level);
    this.currentModeIndex = 0;
    this.changeModeTimer = 0;
    this.isPaused = false;
    this.remainingTime = 0;
    this.isInkyOut = false;
    this.isClydeOut = false;
    this.isLevelComplete = false;
    this.numDots = 0;
    this.totalDots = 0;
  }

  /**
   * Réinitialise l'état complet pour une nouvelle partie
   */
  resetForNewGame() {
    this.score = INITIAL_VALUES.SCORE;
    this.lives = INITIAL_VALUES.LIVES;
    this.level = INITIAL_VALUES.LEVEL;
    this.isGameOver = false;
    this.resetForLevel(this.level);
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
   * Mange un dot
   */
  eatDot() {
    this.addScore(SCORES.DOT);
    this.numDots--;
  }

  /**
   * Mange une pill (power-up)
   */
  eatPill() {
    this.addScore(SCORES.PILL);
    this.numDots--;
  }

  /**
   * Mange un fantôme
   */
  eatGhost() {
    this.addScore(SCORES.GHOST);
  }

  /**
   * Complète le niveau
   */
  completeLevel() {
    this.addScore(SCORES.LEVEL_COMPLETE);
    this.isLevelComplete = true;
  }

  /**
   * Perd une vie
   * @returns {boolean} True si game over
   */
  loseLife() {
    this.lives--;
    this.notifyScoreUpdate();
    if (this.lives <= 0) {
      this.isGameOver = true;
      return true;
    }
    return false;
  }

  /**
   * Retourne le mode actuel
   * @returns {string} Mode actuel
   */
  getCurrentMode() {
    if (this.isPaused) {
      return GameMode.FRIGHTENED;
    }
    return this.difficultyParams.timeModes[this.currentModeIndex]?.mode || GameMode.CHASE;
  }

  /**
   * Retourne le temps du mode actuel
   * @returns {number} Temps en ms
   */
  getCurrentModeTime() {
    return this.difficultyParams.timeModes[this.currentModeIndex]?.time || -1;
  }

  /**
   * Passe au mode suivant
   */
  advanceMode() {
    this.currentModeIndex++;
    if (this.currentModeIndex >= this.difficultyParams.timeModes.length) {
      this.currentModeIndex = this.difficultyParams.timeModes.length - 1;
    }
  }

  /**
   * Entre en mode frightened
   * @param {number} currentTime - Temps actuel
   */
  enterFrightenedMode(currentTime) {
    if (!this.isPaused) {
      this.remainingTime = this.changeModeTimer - currentTime;
    }
    this.changeModeTimer = currentTime + this.difficultyParams.frightenedTime;
    this.isPaused = true;
  }

  /**
   * Sort du mode frightened
   * @param {number} currentTime - Temps actuel
   */
  exitFrightenedMode(currentTime) {
    this.changeModeTimer = currentTime + this.remainingTime;
    this.isPaused = false;
  }

  /**
   * Vérifie si Inky doit sortir
   * @returns {boolean}
   */
  shouldInkyExit() {
    return !this.isInkyOut && (this.totalDots - this.numDots) > 30;
  }

  /**
   * Vérifie si Clyde doit sortir
   * @returns {boolean}
   */
  shouldClydeExit() {
    return !this.isClydeOut && this.numDots < this.totalDots / 3;
  }

  /**
   * Vérifie si le niveau est terminé
   * @returns {boolean}
   */
  isLevelDone() {
    return this.numDots === 0;
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
