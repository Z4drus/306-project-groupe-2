/**
 * Serveur Express pour ArcadiaLabs
 *
 * Serveur de production pour servir l'application
 * et gérer les scores via une API REST
 */

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initDatabase } from "./db.js";
import scoresRouter from "./routes/scores.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger basique
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes API
app.use("/api/scores", scoresRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Sert les fichiers statiques du build Vite
const distPath = join(__dirname, "../dist");
app.use(express.static(distPath));

// SPA fallback (sans pattern -> évite path-to-regexp)
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
  });
});

// Initialise la base de données et démarre le serveur
initDatabase();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║           🕹️  ArcadiaBox Server 🕹️            ║
╠══════════════════════════════════════════════════╣
║  Serveur démarré avec succès !                   ║
║                                                  ║
║  🌐 URL locale:  http://localhost:${PORT}       ║
║  🌐 URL réseau:  http://0.0.0.0:${PORT}         ║
║                                                  ║
║  📊 API Scores:  http://localhost:${PORT}/api/scores ║
║  ❤️  Health:     http://localhost:${PORT}/api/health ║
╚══════════════════════════════════════════════════╝
  `);
});

// Gestion de l'arrêt propre
process.on("SIGTERM", () => {
  console.log("\n🛑 Arrêt du serveur...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Arrêt du serveur...");
  process.exit(0);
});
