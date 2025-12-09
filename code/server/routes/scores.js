/**
 * Routes API pour la gestion des scores
 */

import express from 'express';
import {
  addScore,
  getTopScores,
  getAllTopScores,
  resetScores,
  resetAllScores,
  getGameStats,
} from '../db.js';

const router = express.Router();

/**
 * GET /api/scores
 * Récupère tous les meilleurs scores
 */
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = getAllTopScores(limit);
    res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/:gameId
 * Récupère les meilleurs scores pour un jeu spécifique
 */
router.get('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const validGames = ['pacman', 'wallbreaker', 'santa-cruz-runner'];
    if (!validGames.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    const scores = getTopScores(gameId, limit);
    res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/scores
 * Ajoute un nouveau score
 * Body: { gameId, score, playerName? }
 */
router.post('/', (req, res) => {
  try {
    const { gameId, score, playerName } = req.body;

    // Validation
    if (!gameId || typeof score !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'gameId et score sont requis',
      });
    }

    const validGames = ['pacman', 'wallbreaker', 'santa-cruz-runner'];
    if (!validGames.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    if (score < 0 || score > 999999) {
      return res.status(400).json({ success: false, error: 'Score invalide' });
    }

    const newScore = addScore(gameId, score, playerName);
    res.status(201).json({ success: true, data: newScore });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du score:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/:gameId/stats
 * Récupère les statistiques d'un jeu
 */
router.get('/:gameId/stats', (req, res) => {
  try {
    const { gameId } = req.params;

    const validGames = ['pacman', 'wallbreaker', 'santa-cruz-runner'];
    if (!validGames.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    const stats = getGameStats(gameId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/scores/:gameId
 * Supprime tous les scores d'un jeu (admin)
 */
router.delete('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;

    const validGames = ['pacman', 'wallbreaker', 'santa-cruz-runner'];
    if (!validGames.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    const deletedCount = resetScores(gameId);
    res.json({
      success: true,
      message: `${deletedCount} score(s) supprimé(s)`,
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/scores
 * Supprime tous les scores (admin)
 */
router.delete('/', (req, res) => {
  try {
    const deletedCount = resetAllScores();
    res.json({
      success: true,
      message: `${deletedCount} score(s) supprimé(s)`,
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
