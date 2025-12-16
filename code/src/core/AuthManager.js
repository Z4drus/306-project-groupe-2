/**
 * AuthManager - Gestion de l'authentification côté client
 *
 * Gère l'inscription, la connexion et la persistance de la session
 */

const AUTH_TOKEN_KEY = 'arcadiabox_auth_token';
const USER_DATA_KEY = 'arcadiabox_user_data';

/**
 * Récupère le token stocké
 * @returns {string|null}
 */
export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Récupère les données utilisateur stockées
 * @returns {Object|null}
 */
export function getStoredUser() {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Sauvegarde les données d'auth
 * @param {string} token
 * @param {Object} user
 */
function saveAuthData(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

/**
 * Supprime les données d'auth
 */
export function clearAuthData() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Inscription d'un nouvel utilisateur
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function register(username, password) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      saveAuthData(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return { success: false, error: 'Erreur de connexion au serveur' };
  }
}

/**
 * Connexion d'un utilisateur
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function login(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      saveAuthData(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { success: false, error: 'Erreur de connexion au serveur' };
  }
}

/**
 * Déconnexion
 */
export function logout() {
  clearAuthData();
}

/**
 * Vérifie si le token est valide et récupère les infos utilisateur
 * @returns {Promise<{success: boolean, user?: Object}>}
 */
export async function verifyToken() {
  const token = getStoredToken();

  if (!token) {
    return { success: false };
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      // Mettre à jour les données utilisateur stockées
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      // Token invalide, nettoyer
      clearAuthData();
      return { success: false };
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return { success: false };
  }
}

/**
 * Envoie un score
 * @param {string} gameId
 * @param {number} score
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitScore(gameId, score) {
  const token = getStoredToken();

  if (!token) {
    return { success: false, error: 'Non authentifié' };
  }

  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId, score }),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du score:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère le leaderboard global
 * @param {number} limit
 * @returns {Promise<{success: boolean, data?: Array}>}
 */
export async function getLeaderboard(limit = 20) {
  try {
    const response = await fetch(`/api/scores/leaderboard?limit=${limit}`);
    const data = await response.json();

    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère les scores d'un jeu spécifique
 * @param {string} gameId
 * @param {number} limit
 * @returns {Promise<{success: boolean, data?: Array}>}
 */
export async function getGameScores(gameId, limit = 10) {
  try {
    const response = await fetch(`/api/scores/${gameId}?limit=${limit}`);
    const data = await response.json();

    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère le meilleur score de l'utilisateur connecté pour un jeu
 * @param {string} gameId
 * @returns {Promise<{success: boolean, bestScore?: number}>}
 */
export async function getUserBestScore(gameId) {
  const token = getStoredToken();

  if (!token) {
    return { success: false, bestScore: 0 };
  }

  try {
    const response = await fetch('/api/scores/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.data.byGame[gameId]) {
      return { success: true, bestScore: data.data.byGame[gameId].bestScore || 0 };
    } else {
      return { success: true, bestScore: 0 };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du best score:', error);
    return { success: false, bestScore: 0 };
  }
}
