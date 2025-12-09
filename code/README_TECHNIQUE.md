# ArcadiaLabs - Documentation Technique

Borne d'arcade basée sur Raspberry Pi avec interface web et support manette Xbox.

## 🎮 Technologies

- **Alpine.js** (v3.15.2) - Gestion du menu et de l'interface
- **Phaser** (v3.90.0) - Moteur de jeu 2D
- **Vite** (v7.2.7) - Serveur de développement et build
- **Express** (v5.2.1) - Serveur web de production
- **SQLite** (better-sqlite3) - Base de données des scores

## 📁 Structure du projet

```
code/
├── src/                      # Code source
│   ├── main.js              # Point d'entrée principal
│   ├── style.css            # Styles globaux
│   └── games/               # Jeux
│       ├── pacman/
│       ├── wallbreaker/
│       └── santa-cruz-runner/
├── server/                   # Serveur Express
│   ├── index.js             # Serveur principal
│   ├── db.js                # Gestion de la base de données
│   └── routes/
│       └── scores.js        # API des scores
├── public/                   # Assets statiques
│   └── assets/
│       ├── images/
│       └── sounds/
├── index.html               # Page principale
├── vite.config.js           # Configuration Vite
└── package.json             # Dépendances et scripts
```

## 🚀 Installation

```bash
# Installation des dépendances
npm install
```

## 💻 Développement

```bash
# Lance le serveur de développement Vite (port 3000)
npm run dev
```

L'application sera accessible sur :
- Local : http://localhost:3000
- Réseau : http://[votre-ip]:3000

## 🏗️ Build et Production

```bash
# Build de production
npm run build

# Lance le serveur de production (port 8080)
npm run server

# Build + serveur
npm start
```

Le serveur de production sera accessible sur :
- Local : http://localhost:8080
- Réseau : http://0.0.0.0:8080

## 📊 API Scores

L'API REST est accessible sur `/api/scores` :

### Endpoints

#### Récupérer tous les scores
```http
GET /api/scores?limit=10
```

#### Récupérer les scores d'un jeu
```http
GET /api/scores/:gameId?limit=10
```
Games disponibles : `pacman`, `wallbreaker`, `santa-cruz-runner`

#### Ajouter un score
```http
POST /api/scores
Content-Type: application/json

{
  "gameId": "pacman",
  "score": 1000,
  "playerName": "Joueur" (optionnel)
}
```

#### Récupérer les statistiques d'un jeu
```http
GET /api/scores/:gameId/stats
```

#### Supprimer les scores d'un jeu (admin)
```http
DELETE /api/scores/:gameId
```

#### Supprimer tous les scores (admin)
```http
DELETE /api/scores
```

#### Health check
```http
GET /api/health
```

## 🎯 Jeux

### 1. Pacman
- **Objectif** : Collectez toutes les pastilles en évitant les fantômes
- **Joueurs** : 1
- **Contrôles** : Flèches directionnelles ou stick analogique

### 2. Wallbreaker
- **Objectif** : Détruisez tous les murs avec votre balle
- **Joueurs** : 1
- **Contrôles** : Flèches gauche/droite ou stick analogique

### 3. Santa Cruz Runner
- **Objectif** : Courez et évitez les obstacles
- **Joueurs** : 1
- **Contrôles** : Barre d'espace ou bouton A pour sauter

## 🎮 Support Manette

L'application supporte les manettes Xbox via l'API Gamepad du navigateur.

**Pour connecter une manette :**
1. Branchez la manette Xbox via USB
2. Attendez quelques secondes
3. La manette sera automatiquement détectée

## 🖥️ Mode Plein Écran

Cliquez sur le bouton "🖥️ Plein écran" dans le menu pour passer en mode plein écran.

**Raccourci clavier :** `F11` (selon le navigateur)

## 📈 Mode Attract

Après 60 secondes d'inactivité sur le menu, le mode attract s'active automatiquement.
Toute interaction utilisateur désactive le mode attract.

## 🔧 Configuration

### Ports
- **Développement** : 3000 (Vite)
- **Production** : 8080 (Express)

Vous pouvez changer le port de production via la variable d'environnement `PORT`.

### Base de données
La base de données SQLite est créée automatiquement au premier lancement du serveur.
Fichier : `server/arcade.db`

## 🐛 Debug

Les logs sont affichés dans la console du navigateur et dans le terminal du serveur.

```bash
# Activer les logs Phaser (dans le code)
physics: {
  arcade: {
    debug: true  // Active les logs de debug
  }
}
```

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement Vite
- `npm run build` - Build de production
- `npm run preview` - Prévisualisation du build
- `npm run server` - Lance le serveur de production
- `npm start` - Build + serveur de production

## 🔐 Sécurité

- Les routes d'administration (DELETE) devraient être protégées en production
- Validation des entrées utilisateur sur l'API
- Pas de secrets dans le code (utiliser `.env` si nécessaire)

## 📦 Déploiement sur Raspberry Pi

1. Cloner le projet sur le Raspberry Pi
2. Installer Node.js (v18+ recommandé)
3. Installer les dépendances : `npm install`
4. Build : `npm run build`
5. Lancer : `npm run server`
6. Optionnel : Configurer un service systemd pour démarrage automatique

## 🤝 Contribution

Ce projet est développé dans le cadre du module 306 - EMF.

## 📄 Licence

ISC
