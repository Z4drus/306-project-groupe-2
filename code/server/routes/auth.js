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
    const { username, password, profilePicture } = req.body;

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

    // Validation de la photo de profil (1-75)
    const pfpId = profilePicture ? parseInt(profilePicture, 10) : 1;
    if (pfpId < 1 || pfpId > 75 || isNaN(pfpId)) {
      return res.status(400).json({
        success: false,
        error: 'Photo de profil invalide',
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
        photo_profil: pfpId,
      },
      select: {
        id_joueur: true,
        pseudo: true,
        photo_profil: true,
        date_inscription: true,
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
        profilePicture: joueur.photo_profil,
        registeredAt: joueur.date_inscription,
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
        profilePicture: joueur.photo_profil || 1,
        registeredAt: joueur.date_inscription,
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
          photo_profil: true,
          date_inscription: true,
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
          profilePicture: joueur.photo_profil || 1,
          registeredAt: joueur.date_inscription,
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

/**
 * Modifier la photo de profil
 * PUT /api/auth/profile-picture
 */
router.put('/profile-picture', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
      });
    }

    const token = authHeader.split(' ')[1];
    const { profilePicture } = req.body;

    // Validation de la photo de profil (1-75)
    const pfpId = parseInt(profilePicture, 10);
    if (pfpId < 1 || pfpId > 75 || isNaN(pfpId)) {
      return res.status(400).json({
        success: false,
        error: 'Photo de profil invalide',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const joueur = await prisma.joueur.update({
        where: { id_joueur: decoded.userId },
        data: { photo_profil: pfpId },
        select: {
          id_joueur: true,
          pseudo: true,
          photo_profil: true,
          date_inscription: true,
        },
      });

      res.json({
        success: true,
        user: {
          id: joueur.id_joueur,
          username: joueur.pseudo,
          profilePicture: joueur.photo_profil,
          registeredAt: joueur.date_inscription,
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification de la photo de profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

/**
 * Changer le mot de passe
 * PUT /api/auth/change-password
 */
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
      });
    }

    const token = authHeader.split(' ')[1];
    const { currentPassword, newPassword } = req.body;

    // Validation des champs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe actuel et le nouveau sont requis',
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Récupérer l'utilisateur avec son mot de passe actuel
      const joueur = await prisma.joueur.findUnique({
        where: { id_joueur: decoded.userId },
      });

      if (!joueur) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé',
        });
      }

      // Vérifier le mot de passe actuel
      const isValidPassword = await bcrypt.compare(currentPassword, joueur.mot_de_passe);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Mot de passe actuel incorrect',
        });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.joueur.update({
        where: { id_joueur: decoded.userId },
        data: { mot_de_passe: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

/**
 * Récupérer le profil public d'un joueur
 * GET /api/auth/profile/:userId
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur invalide',
      });
    }

    const joueur = await prisma.joueur.findUnique({
      where: { id_joueur: userId },
      select: {
        id_joueur: true,
        pseudo: true,
        photo_profil: true,
        date_inscription: true,
        _count: {
          select: { scores: true },
        },
      },
    });

    if (!joueur) {
      return res.status(404).json({
        success: false,
        error: 'Joueur non trouvé',
      });
    }

    // Récupérer les stats par jeu
    const gameStats = await prisma.$queryRaw`
      SELECT
        jeu,
        MAX(valeur) as best_score,
        COUNT(*) as total_plays
      FROM "Score"
      WHERE id_joueur = ${userId}
      GROUP BY jeu
    `;

    // Récupérer le meilleur score global
    const bestScore = await prisma.score.findFirst({
      where: { id_joueur: userId },
      orderBy: { valeur: 'desc' },
    });

    // Formater les stats par jeu
    const statsByGame = {};
    const enumToGameId = {
      'PACMAN': 'pacman',
      'SANTA_CRUZ_RUNNER': 'santa-cruz-runner',
      'WALLBREAKER': 'wallbreaker',
    };

    for (const stat of gameStats) {
      const gameId = enumToGameId[stat.jeu];
      if (gameId) {
        statsByGame[gameId] = {
          bestScore: Number(stat.best_score),
          totalPlays: Number(stat.total_plays),
        };
      }
    }

    res.json({
      success: true,
      profile: {
        id: joueur.id_joueur,
        username: joueur.pseudo,
        profilePicture: joueur.photo_profil || 1,
        registeredAt: joueur.date_inscription,
        totalGames: joueur._count.scores,
        bestScore: bestScore?.valeur || 0,
        statsByGame,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

export default router;
export { JWT_SECRET };
