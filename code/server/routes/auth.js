/**
 * Routes d'authentification pour ArcadiaBox
 *
 * Gère l'inscription et la connexion des joueurs
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'arcadiabox-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Inscription d'un nouveau joueur
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation des champs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Le pseudo et le mot de passe sont requis',
      });
    }

    // Validation du pseudo (3-50 caractères, alphanumériques et underscores)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Le pseudo doit contenir entre 3 et 50 caractères (lettres, chiffres, underscores)',
      });
    }

    // Validation du mot de passe (minimum 8 caractères)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Vérifier si le joueur existe déjà
    const existingJoueur = await prisma.joueur.findUnique({
      where: { pseudo: username.toLowerCase() },
    });

    if (existingJoueur) {
      return res.status(409).json({
        success: false,
        error: 'Ce pseudo est déjà pris',
      });
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(password, 10);

    // Créer le joueur
    const joueur = await prisma.joueur.create({
      data: {
        pseudo: username.toLowerCase(),
        mot_de_passe: motDePasseHash,
      },
      select: {
        id_joueur: true,
        pseudo: true,
      },
    });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: joueur.id_joueur, username: joueur.pseudo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      user: {
        id: joueur.id_joueur,
        username: joueur.pseudo,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription',
    });
  }
});

/**
 * Connexion d'un joueur
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation des champs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Le pseudo et le mot de passe sont requis',
      });
    }

    // Rechercher le joueur
    const joueur = await prisma.joueur.findUnique({
      where: { pseudo: username.toLowerCase() },
    });

    if (!joueur) {
      return res.status(401).json({
        success: false,
        error: 'Pseudo ou mot de passe incorrect',
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, joueur.mot_de_passe);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Pseudo ou mot de passe incorrect',
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: joueur.id_joueur, username: joueur.pseudo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      user: {
        id: joueur.id_joueur,
        username: joueur.pseudo,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion',
    });
  }
});

/**
 * Vérification du token et récupération des infos joueur
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const joueur = await prisma.joueur.findUnique({
        where: { id_joueur: decoded.userId },
        select: {
          id_joueur: true,
          pseudo: true,
          _count: {
            select: { scores: true },
          },
        },
      });

      if (!joueur) {
        return res.status(401).json({
          success: false,
          error: 'Joueur non trouvé',
        });
      }

      // Récupérer le meilleur score global du joueur
      const bestScore = await prisma.score.findFirst({
        where: { id_joueur: joueur.id_joueur },
        orderBy: { valeur: 'desc' },
      });

      res.json({
        success: true,
        user: {
          id: joueur.id_joueur,
          username: joueur.pseudo,
          totalGames: joueur._count.scores,
          bestScore: bestScore?.valeur || 0,
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

export default router;
export { JWT_SECRET };
