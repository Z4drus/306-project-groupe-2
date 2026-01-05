/**
 * GameStateModel - Modèle de l'état global du jeu Santa Cruz Runner
 *
 * Gère le score, les vies, le niveau, la distance et l'état de la partie
 */

import { INITIAL_VALUES, SCORES, getDifficultyParams } from '../config/GameConfig.js';

/** États du jeu possibles */
export const GameState = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
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

    // Distance parcourue (en pixels)
    // Avec une vitesse de ~350px/s, 5000px = ~14 secondes par niveau
    this.distance = 0;
    this.distanceForNextLevel = 5000;

    // Combo pour collectibles
    this.combo = 0;
    this.maxCombo = SCORES.MAX_COMBO;
    this.comboTimer = null;
    this.comboTimeout = 2000;

    // Paramètres de difficulté
    this.difficultyParams = getDifficultyParams(this.level);

    // Callbacks externes
    this.onScoreUpdate = null;
    this.onGameOver = null;
    this.onLevelUp = null;
  }

  /**
   * Réinitialise l'état pour un nouveau niveau
   * @param {number} level - Nouveau niveau
   */
  resetForLevel(level) {
    this.level = level;
    this.difficultyParams = getDifficultyParams(level);
    this.distance = 0;
    // Chaque niveau nécessite un peu plus de distance
    // Niveau 1: 5000px (~14s), Niveau 2: 6000px (~15s), etc.
    this.distanceForNextLevel = 5000 + (level - 1) * 1000;
    this.combo = 0;
  }

  /**
   * Réinitialise l'état complet pour une nouvelle partie
   */
  resetForNewGame() {
    this.score = INITIAL_VALUES.SCORE;
    this.lives = INITIAL_VALUES.LIVES;
    this.level = INITIAL_VALUES.LEVEL;
    this.state = GameState.READY;
    this.distance = 0;
    this.combo = 0;
    this.resetForLevel(this.level);
  }

  /**
   * Ajoute des points au score
   * @param {number} points - Points à ajouter
   */
  addScore(points) {
    const multipliedPoints = Math.floor(points * this.getComboMultiplier());
    this.score += multipliedPoints;
    this.notifyScoreUpdate();
    return multipliedPoints;
  }

  /**
   * Ajoute des points pour un collectible avec combo
   * @param {number} basePoints - Points de base du collectible
   * @returns {Object} Points gagnés et combo actuel
   */
  collectItem(basePoints) {
    // Augmenter le combo
    this.combo = Math.min(this.combo + 1, this.maxCombo);

    // Réinitialiser le timer du combo
    this.resetComboTimer();

    // Calculer les points avec le multiplicateur
    const earnedPoints = this.addScore(basePoints);

    return {
      points: earnedPoints,
      combo: this.combo,
      multiplier: this.getComboMultiplier()
    };
  }

  /**
   * Retourne le multiplicateur de combo actuel
   * @returns {number}
   */
  getComboMultiplier() {
    if (this.combo <= 1) return 1;
    return 1 + (this.combo - 1) * (SCORES.COMBO_MULTIPLIER - 1) / (this.maxCombo - 1);
  }

  /**
   * Réinitialise le timer du combo
   */
  resetComboTimer() {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    this.comboTimer = setTimeout(() => {
      this.combo = 0;
    }, this.comboTimeout);
  }

  /**
   * Met à jour la distance parcourue
   * @param {number} deltaDistance - Distance à ajouter
   */
  updateDistance(deltaDistance) {
    this.distance += deltaDistance;

    // Ajouter des points basés sur la distance
    const distancePoints = Math.floor(deltaDistance * SCORES.DISTANCE_MULTIPLIER);
    if (distancePoints > 0) {
      this.score += distancePoints;
      this.notifyScoreUpdate();
    }

    // Vérifier si on passe au niveau suivant
    if (this.distance >= this.distanceForNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Passe au niveau suivant
   */
  levelUp() {
    this.level++;
    this.difficultyParams = getDifficultyParams(this.level);
    this.distance = 0;
    // Distance croissante pour chaque niveau
    this.distanceForNextLevel = 5000 + (this.level - 1) * 1000;

    // Bonus de niveau
    this.addScore(SCORES.LEVEL_BONUS);

    if (this.onLevelUp) {
      this.onLevelUp(this.level);
    }
  }

  /**
   * Perd une vie
   * @returns {boolean} True si game over
   */
  loseLife() {
    this.lives--;
    this.combo = 0;
    this.notifyScoreUpdate();

    if (this.lives <= 0) {
      this.state = GameState.GAME_OVER;
      this.notifyGameOver();
      return true;
    }
    return false;
  }

  /**
   * Démarre le jeu
   */
  start() {
    if (this.state === GameState.READY) {
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
   * Vérifie si le jeu est prêt à démarrer
   * @returns {boolean}
   */
  isReady() {
    return this.state === GameState.READY;
  }

  /**
   * Vérifie si la partie est terminée
   * @returns {boolean}
   */
  isGameOver() {
    return this.state === GameState.GAME_OVER;
  }

  /**
   * Retourne la vitesse de défilement actuelle
   * @returns {number}
   */
  getScrollSpeed() {
    return this.difficultyParams.scrollSpeed;
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
   * Définit le callback de level up
   * @param {Function} callback
   */
  setLevelUpCallback(callback) {
    this.onLevelUp = callback;
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
   * Détruit le modèle et nettoie les ressources
   */
  destroy() {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
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
