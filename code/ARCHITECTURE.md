# Architecture MVC - ArcadiaBox

## Vue d'ensemble

L'application ArcadiaBox utilise une architecture **MVC (Modèle-Vue-Contrôleur)** pour séparer les responsabilités et faciliter la maintenance.

```
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                              │
├─────────────────────────────────────────────────────────────────┤
│  main.js ──► ArcadeStore ──► GameLoader ──► Jeux (Pacman, ...)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Structure des dossiers

```
src/
├── main.js                    # Point d'entrée de l'application
├── style.css                  # Styles globaux (thème arcade)
│
├── core/                      # Modules centraux de l'application
│   ├── ArcadeStore.js         # État global (Alpine.js store)
│   ├── ArcadeMenu.js          # Composant menu + template HTML
│   └── GameLoader.js          # Chargeur dynamique de jeux
│
└── games/
    └── pacman/                # Jeu Pacman (architecture MVC)
        ├── index.js           # Point d'entrée du jeu
        ├── config/            # Configuration
        ├── models/            # Modèles de données
        ├── views/             # Vues et rendu
        ├── controllers/       # Logique et comportements
        └── assets/            # Ressources graphiques
```

---

## Architecture MVC de Pacman

### Diagramme de classes simplifié

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  MODELS                                      │
│  (Données pures, pas de logique de rendu ni de comportement)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  GameStateModel  │  │   PacmanModel    │  │   GhostModel     │           │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤           │
│  │ - score          │  │ - gridX, gridY   │  │ - gridX, gridY   │           │
│  │ - lives          │  │ - currentDir     │  │ - currentDir     │           │
│  │ - level          │  │ - isDead         │  │ - mode           │           │
│  │ - numDots        │  │ - speed          │  │ - destination    │           │
│  │ - currentMode    │  └──────────────────┘  │ - safeTiles      │           │
│  │ - isPaused       │                        └──────────────────┘           │
│  └──────────────────┘                                                        │
│                         ┌──────────────────┐                                 │
│                         │    MapModel      │                                 │
│                         ├──────────────────┤                                 │
│                         │ - width, height  │                                 │
│                         │ - specialTiles   │                                 │
│                         └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                  VIEWS                                       │
│  (Rendu visuel, sprites, animations - pas de logique métier)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   PacmanView     │  │    GhostView     │  │     HUDView      │           │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤           │
│  │ - sprite         │  │ - sprite         │  │ - elements[]     │           │
│  │ - createAnims()  │  │ - createAnims()  │  │ - showMessage()  │           │
│  │ - move()         │  │ - move()         │  │ - showLevelEnd() │           │
│  │ - playDeath()    │  │ - updateAnim()   │  └──────────────────┘           │
│  └──────────────────┘  └──────────────────┘                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                        SCENES                                │            │
│  │  MenuScene ──► GameScene ──► GameOverScene                  │            │
│  │  (Phaser.Scene qui orchestrent le cycle de vie)             │            │
│  └─────────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               CONTROLLERS                                    │
│  (Logique métier, IA, gestion des entrées, collisions)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐       ┌──────────────────┐                            │
│  │  GameController  │◄──────│  InputController │                            │
│  ├──────────────────┤       ├──────────────────┤                            │
│  │ - gameState      │       │ - cursors        │                            │
│  │ - pacmanCtrl     │       │ - getDirection() │                            │
│  │ - ghostCtrls[]   │       └──────────────────┘                            │
│  │ - update()       │                                                        │
│  │ - handleModes()  │       ┌──────────────────┐                            │
│  └────────┬─────────┘       │CollisionController│                           │
│           │                 ├──────────────────┤                            │
│           │                 │ - handleDot()    │                            │
│           ▼                 │ - handlePill()   │                            │
│  ┌──────────────────┐       │ - handleGhost()  │                            │
│  │ PacmanController │       └──────────────────┘                            │
│  ├──────────────────┤                                                        │
│  │ - model          │       ┌──────────────────┐                            │
│  │ - view           │       │  GhostController │                            │
│  │ - update()       │       ├──────────────────┤                            │
│  │ - checkDir()     │       │ - model          │                            │
│  │ - move()         │       │ - view           │                            │
│  └──────────────────┘       │ - update()       │                            │
│                             │ - getDestination()│                           │
│                             │ - handleChase()  │                            │
│                             └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flux de communication

```
┌────────────┐    direction    ┌──────────────────┐
│   INPUT    │ ──────────────► │  PACMAN CTRL     │
│ CONTROLLER │                 │                  │
└────────────┘                 │  ┌────────────┐  │
                               │  │   MODEL    │◄─┼─── État (position, dir)
                               │  └────────────┘  │
                               │        │         │
                               │        ▼         │
                               │  ┌────────────┐  │
                               │  │    VIEW    │──┼───► Rendu (sprite)
                               │  └────────────┘  │
                               └──────────────────┘

┌──────────────────┐           ┌──────────────────┐
│  GAME CONTROLLER │──────────►│   GAME STATE     │
│                  │  update   │     MODEL        │
│  - Orchestre     │◄──────────│                  │
│  - Gère modes    │   état    │  - score         │
│  - Spawns        │           │  - lives         │
└──────────────────┘           │  - level         │
         │                     └──────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐           ┌──────────────────┐
│    COLLISION     │           │   CALLBACKS      │
│   CONTROLLER     │           │   EXTERNES       │
│                  │           │                  │
│  - dots/pills    │           │  onScoreUpdate() │
│  - ghosts        │           │  onGameOver()    │
└──────────────────┘           └──────────────────┘
```

---

## Description des composants

### Models (Données)

| Classe | Responsabilité |
|--------|----------------|
| `GameStateModel` | Score, vies, niveau, mode de jeu (chase/scatter/frightened) |
| `PacmanModel` | Position, direction, état (vivant/mort), vitesse |
| `GhostModel` | Position, mode IA, destination, tiles traversables |
| `MapModel` | Dimensions carte, tiles spéciales, conversion coordonnées |

### Views (Rendu)

| Classe | Responsabilité |
|--------|----------------|
| `PacmanView` | Sprite Pacman, animations (munch, death), orientation |
| `GhostView` | Sprites fantômes, animations par mode et direction |
| `HUDView` | Messages in-game (READY, niveau complété, etc.) |
| `MenuScene` | Écran titre avec animations décoratives |
| `GameScene` | Scène principale, orchestre le GameController |
| `GameOverScene` | Écran de fin avec score et options |

### Controllers (Logique)

| Classe | Responsabilité |
|--------|----------------|
| `GameController` | Orchestration globale, boucle de jeu, gestion des modes |
| `PacmanController` | Mouvement Pacman, virages, wrapping aux bords |
| `GhostController` | IA des fantômes (Blinky, Pinky, Inky, Clyde) |
| `InputController` | Lecture des entrées clavier |
| `CollisionController` | Détection et gestion des collisions |

### Config

| Fichier | Contenu |
|---------|---------|
| `GameConfig.js` | Constantes (tailles, vitesses, positions, scores, timers) |

---

## IA des fantômes

Chaque fantôme a un comportement unique en mode **Chase** :

| Fantôme | Comportement | Coin Scatter |
|---------|--------------|--------------|
| **Blinky** (rouge) | Cible directement Pacman | Haut-droite |
| **Pinky** (rose) | Cible 4 cases devant Pacman | Haut-gauche |
| **Inky** (cyan) | Utilise Blinky pour calculer (embuscade) | Bas-droite |
| **Clyde** (orange) | Poursuit si > 8 cases, sinon fuit | Bas-gauche |

### Modes de jeu

```
SCATTER ──► CHASE ──► SCATTER ──► CHASE ──► ... ──► CHASE (infini)
    │                                                    │
    └──────────────── FRIGHTENED (power-up) ◄────────────┘
```

---

## Ajout d'un nouveau jeu

1. Créer le dossier `src/games/nouveau-jeu/`
2. Implémenter l'architecture MVC (models, views, controllers)
3. Créer `index.js` avec la fonction `startNouveauJeu(container, onGameOver, onScoreUpdate)`
4. Ajouter la configuration dans `src/core/GameLoader.js`

```javascript
// GameLoader.js
export const GAMES_CONFIG = {
  // ...
  'nouveau-jeu': {
    id: 'nouveau-jeu',
    name: 'Nouveau Jeu',
    displayName: 'NOUVEAU JEU',
    description: 'Description du jeu',
    players: '1 joueur',
    thumbnail: '/assets/images/home-menu/nouveau-jeu.webp',
    module: () => import('../games/nouveau-jeu/index.js'),
    startFunction: 'startNouveauJeu'
  }
};
```

---

## Technologies utilisées

- **Phaser 3** : Framework de jeu (physique arcade, tilemaps, sprites)
- **Alpine.js** : Framework réactif léger pour le menu
- **Vite** : Bundler et serveur de développement
- **ES Modules** : Architecture modulaire JavaScript
