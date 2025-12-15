/**
 * Routes API pour la gestion des scores
 *
 * Utilise Prisma avec le schéma Joueur/Score
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { JWT_SECRET } from './auth.js';

const router = Router();

/**
 * Mapping entre les IDs de jeux (frontend) et l'enum Jeu (DB)
 */
const GAME_ID_TO_ENUM = {
  'pacman': 'PACMAN',
  'santa-cruz-runner': 'SANTA_CRUZ_RUNNER',
  'wallbreaker': 'WALLBREAKER',
};

const ENUM_TO_GAME_ID = {
  'PACMAN': 'pacman',
  'SANTA_CRUZ_RUNNER': 'santa-cruz-runner',
  'WALLBREAKER': 'wallbreaker',
};

const VALID_GAMES = Object.keys(GAME_ID_TO_ENUM);

/**
 * Middleware pour vérifier l'authentification
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré',
    });
  }
}

/**
 * GET /api/scores
 * Récupère les scores pour tous les jeux
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const results = {};

    for (const gameId of VALID_GAMES) {
      const jeuEnum = GAME_ID_TO_ENUM[gameId];

      const scores = await prisma.score.findMany({
        where: { jeu: jeuEnum },
        orderBy: { valeur: 'desc' },
        take: limit,
        include: {
          joueur: {
            select: { pseudo: true },
          },
        },
      });

      results[gameId] = scores.map((s, index) => ({
        rank: index + 1,
        id: s.id_score,
        playerName: s.joueur.pseudo,
        score: s.valeur,
        date: s.date_score,
      }));
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/leaderboard
 * Récupère le classement global tous jeux confondus
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // Agréger les meilleurs scores par joueur
    const topPlayers = await prisma.$queryRaw`
      SELECT
        j.pseudo,
        j.id_joueur,
        MAX(s.valeur) as best_score,
        COUNT(s.id_score) as total_games,
        SUM(s.valeur) as total_score
      FROM "Score" s
      JOIN "Joueur" j ON s.id_joueur = j.id_joueur
      GROUP BY j.id_joueur, j.pseudo
      ORDER BY best_score DESC
      LIMIT ${limit}
    `;

    res.json({
      success: true,
      data: topPlayers.map((p, index) => ({
        rank: index + 1,
        username: p.pseudo,
        bestScore: Number(p.best_score),
        totalGames: Number(p.total_games),
        totalScore: Number(p.total_score),
      })),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/:gameId
 * Récupère les meilleurs scores pour un jeu spécifique
 */
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    const jeuEnum = GAME_ID_TO_ENUM[gameId];

    const scores = await prisma.score.findMany({
      where: { jeu: jeuEnum },
      orderBy: { valeur: 'desc' },
      take: limit,
      include: {
        joueur: {
          select: { pseudo: true },
        },
      },
    });

    res.json({
      success: true,
      data: scores.map((s, index) => ({
        rank: index + 1,
        id: s.id_score,
        playerName: s.joueur.pseudo,
        score: s.valeur,
        date: s.date_score,
      })),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/scores
 * Ajoute un nouveau score (requiert authentification)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gameId, score } = req.body;

    // Validation de base
    if (!gameId || typeof score !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'gameId et score sont requis',
      });
    }

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    if (score < 0 || score > 9999999) {
      return res.status(400).json({ success: false, error: 'Score invalide' });
    }

    const jeuEnum = GAME_ID_TO_ENUM[gameId];

    // Créer le score
    const newScore = await prisma.score.create({
      data: {
        jeu: jeuEnum,
        valeur: score,
        id_joueur: req.user.userId,
      },
      include: {
        joueur: {
          select: { pseudo: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: newScore.id_score,
        gameId: gameId,
        playerName: newScore.joueur.pseudo,
        score: newScore.valeur,
        date: newScore.date_score,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du score:", error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/:gameId/stats
 * Récupère les statistiques d'un jeu
 */
router.get('/:gameId/stats', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({ success: false, error: 'Jeu invalide' });
    }

    const jeuEnum = GAME_ID_TO_ENUM[gameId];

    const stats = await prisma.score.aggregate({
      where: { jeu: jeuEnum },
      _count: true,
      _max: { valeur: true },
      _avg: { valeur: true },
      _min: { valeur: true },
    });

    res.json({
      success: true,
      data: {
        totalPlays: stats._count,
        bestScore: stats._max.valeur || 0,
        avgScore: Math.round(stats._avg.valeur || 0),
        worstScore: stats._min.valeur || 0,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/scores/user/me
 * Récupère les scores du joueur connecté
 */
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const scores = await prisma.score.findMany({
      where: { id_joueur: req.user.userId },
      orderBy: { date_score: 'desc' },
      take: limit,
    });

    // Grouper par jeu et trouver le meilleur score
    const byGame = {};
    for (const gameId of VALID_GAMES) {
      const jeuEnum = GAME_ID_TO_ENUM[gameId];
      const gameScores = scores.filter((s) => s.jeu === jeuEnum);
      const best = await prisma.score.findFirst({
        where: { id_joueur: req.user.userId, jeu: jeuEnum },
        orderBy: { valeur: 'desc' },
      });

      byGame[gameId] = {
        bestScore: best?.valeur || 0,
        totalPlays: gameScores.length,
        recentScores: gameScores.slice(0, 5).map((s) => ({
          score: s.valeur,
          date: s.date_score,
        })),
      };
    }

    res.json({
      success: true,
      data: {
        byGame,
        recentScores: scores.map((s) => ({
          id: s.id_score,
          gameId: ENUM_TO_GAME_ID[s.jeu],
          score: s.valeur,
          date: s.date_score,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des scores utilisateur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
