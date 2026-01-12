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
 * @param {number} profilePicture - ID de la photo de profil (1-75)
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function register(username, password, profilePicture = 1) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, profilePicture }),
    });

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue:', await response.text());
      return { success: false, error: 'Erreur serveur - réponse invalide' };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue:', await response.text());
      return { success: false, error: 'Erreur serveur - réponse invalide' };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue lors de la vérification du token');
      clearAuthData();
      return { success: false };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue lors de l\'envoi du score');
      return { success: false, error: 'Erreur serveur' };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue lors de la récupération du leaderboard');
      return { success: false, error: 'Erreur serveur' };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue lors de la récupération des scores');
      return { success: false, error: 'Erreur serveur' };
    }

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

    // Vérifier si la réponse est du JSON valide
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Réponse non-JSON reçue lors de la récupération du best score');
      return { success: false, bestScore: 0 };
    }

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

/**
 * Récupère tous les scores de l'utilisateur connecté
 * @returns {Promise<{success: boolean, data?: Object}>}
 */
export async function getUserScores() {
  const token = getStoredToken();

  if (!token) {
    return { success: false };
  }

  try {
    const response = await fetch('/api/scores/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false };
    }

    const data = await response.json();

    if (data.success) {
      return { success: true, data: data.data.byGame };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des scores utilisateur:', error);
    return { success: false };
  }
}

/**
 * Modifie la photo de profil de l'utilisateur connecté
 * @param {number} profilePicture - ID de la photo de profil (1-75)
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function updateProfilePicture(profilePicture) {
  const token = getStoredToken();

  if (!token) {
    return { success: false, error: 'Non authentifié' };
  }

  try {
    const response = await fetch('/api/auth/profile-picture', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ profilePicture }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'Erreur serveur' };
    }

    const data = await response.json();

    if (data.success) {
      // Mettre à jour les données utilisateur stockées
      const storedUser = getStoredUser();
      if (storedUser) {
        storedUser.profilePicture = data.user.profilePicture;
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(storedUser));
      }
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de la modification de la photo de profil:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère le profil public d'un joueur
 * @param {number} userId - ID du joueur
 * @returns {Promise<{success: boolean, profile?: Object, error?: string}>}
 */
export async function getUserProfile(userId) {
  try {
    const response = await fetch(`/api/auth/profile/${userId}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'Erreur serveur' };
    }

    const data = await response.json();

    if (data.success) {
      return { success: true, profile: data.profile };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Change le mot de passe de l'utilisateur connecté
 * @param {string} currentPassword - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function changePassword(currentPassword, newPassword) {
  const token = getStoredToken();

  if (!token) {
    return { success: false, error: 'Non authentifié' };
  }

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'Erreur serveur' };
    }

    const data = await response.json();

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
