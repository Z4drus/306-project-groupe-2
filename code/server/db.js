/**
 * Module de gestion de la base de données SQLite
 *
 * Gère les scores des différents jeux
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crée ou ouvre la base de données
const db = new Database(join(__dirname, 'arcade.db'));

/**
 * Initialise la structure de la base de données
 */
export function initDatabase() {
  // Table des scores
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      player_name TEXT DEFAULT 'Joueur',
      score INTEGER NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT valid_game CHECK (game_id IN ('pacman', 'wallbreaker', 'santa-cruz-runner'))
    );

    CREATE INDEX IF NOT EXISTS idx_game_score ON scores(game_id, score DESC);
    CREATE INDEX IF NOT EXISTS idx_date ON scores(date DESC);
  `);

  console.log('✅ Base de données initialisée');
}

/**
 * Ajoute un nouveau score
 * @param {string} gameId - ID du jeu
 * @param {number} score - Score obtenu
 * @param {string} playerName - Nom du joueur (optionnel)
 * @returns {Object} Score créé
 */
export function addScore(gameId, score, playerName = 'Joueur') {
  const stmt = db.prepare(`
    INSERT INTO scores (game_id, player_name, score)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(gameId, playerName, score);

  return {
    id: info.lastInsertRowid,
    game_id: gameId,
    player_name: playerName,
    score: score,
    date: new Date().toISOString(),
  };
}

/**
 * Récupère les meilleurs scores pour un jeu
 * @param {string} gameId - ID du jeu
 * @param {number} limit - Nombre de scores à récupérer (par défaut 10)
 * @returns {Array} Liste des scores
 */
export function getTopScores(gameId, limit = 10) {
  const stmt = db.prepare(`
    SELECT id, game_id, player_name, score, date
    FROM scores
    WHERE game_id = ?
    ORDER BY score DESC, date DESC
    LIMIT ?
  `);

  return stmt.all(gameId, limit);
}

/**
 * Récupère tous les meilleurs scores pour tous les jeux
 * @param {number} limit - Nombre de scores par jeu
 * @returns {Object} Scores organisés par jeu
 */
export function getAllTopScores(limit = 10) {
  const games = ['pacman', 'wallbreaker', 'santa-cruz-runner'];
  const scores = {};

  games.forEach(gameId => {
    scores[gameId] = getTopScores(gameId, limit);
  });

  return scores;
}

/**
 * Supprime tous les scores d'un jeu (fonction admin)
 * @param {string} gameId - ID du jeu
 * @returns {number} Nombre de scores supprimés
 */
export function resetScores(gameId) {
  const stmt = db.prepare('DELETE FROM scores WHERE game_id = ?');
  const info = stmt.run(gameId);
  return info.changes;
}

/**
 * Supprime tous les scores (fonction admin)
 * @returns {number} Nombre de scores supprimés
 */
export function resetAllScores() {
  const stmt = db.prepare('DELETE FROM scores');
  const info = stmt.run();
  return info.changes;
}

/**
 * Récupère les statistiques d'un jeu
 * @param {string} gameId - ID du jeu
 * @returns {Object} Statistiques du jeu
 */
export function getGameStats(gameId) {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_plays,
      MAX(score) as best_score,
      AVG(score) as avg_score,
      MIN(score) as worst_score
    FROM scores
    WHERE game_id = ?
  `);

  return stmt.get(gameId);
}

// Ferme proprement la base de données lors de l'arrêt du serveur
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default db;
