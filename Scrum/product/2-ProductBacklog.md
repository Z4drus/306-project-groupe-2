# SCRUM : Product backlog

| ID       | User Story                                       | Priorité   | Critères d’acceptation                                            |
| -------- | ------------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| **US03** | Accéder à ArcadiaBox via un navigateur web       | ⭐⭐⭐⭐⭐ | L’app charge via HTTP depuis le Raspberry Pi.                     |
| **US09** | Servir l’application web depuis le serveur       | ⭐⭐⭐⭐⭐ | Le serveur renvoie l’UI, les jeux et les assets.                  |
| **US04** | Avoir un menu simple permettant de lancer un jeu | ⭐⭐⭐⭐   | Menu affiché + navigation clavier/manette.                        |
| **US01** | Jouer avec une manette Xbox                      | ⭐⭐⭐⭐   | La manette est détectée via Gamepad API ; actions fonctionnelles. |
| **US02** | Jouer avec le clavier                            | ⭐⭐⭐⭐   | Commandes du clavier fonctionnelles dans le menu + mini-jeu.      |
| **US05** | Lancer un mini-jeu                               | ⭐⭐⭐⭐   | Le mini-jeu démarre depuis le menu sans rechargement complet.     |
| **US11** | Charger les assets nécessaires (images/sons)     | ⭐⭐⭐     | Tous les assets chargent correctement via le serveur.             |
| **US06** | Avoir un mini-jeu fluide et jouable              | ⭐⭐⭐     | FPS correct, pas de freezes, contrôles réactifs.                  |
| **US07** | Sauvegarder le score du mini-jeu                 | ⭐⭐⭐     | Score sauvegardé dans JSON/base après la partie.                  |
| **US10** | Stocker les scores de manière persistante        | ⭐⭐⭐     | Les scores restent après redémarrage du RPi.                      |
| **US08** | Afficher les scores                              | ⭐⭐⭐     | Les scores s’affichent dans une page dédiée UI.                   |
| **US12** | Interface responsive selon l’écran               | ⭐⭐       | UI qui s’adapte à PC / tablette / petit écran RPi.                |
| **US13** | Afficher un menu attract                         | ⭐         | Un écran attract s’affiche après une période d’inactivité.        |
| **US14** | Développer les logiques des jeux 2 et 3          | ⭐         | Les jeux 2 et 3 sont jouables avec collisions fonctionnelles.     |
| **US15** | Charger dynamiquement les assets des jeux 2 et 3 | ⭐         | Les assets sont chargés sans erreur et sans rechargement global.  |
| **US16** | Optimiser les performances des jeux 2 et 3       | ⭐         | Jeux fluides sur Raspberry Pi (FPS stable).                       |
| **US17** | Sécuriser la logique des jeux 2 et 3             | ⭐         | Impossible de falsifier un score côté client.                     |
| **US18** | Intégrer les jeux 2 et 3 dans le menu arcade     | ⭐         | Les jeux sont accessibles et lançables depuis le menu.            |
| **US19** | Gérer le scoring des jeux 2 et 3                 | ⭐         | Scores calculés, envoyés et sauvegardés correctement.             |


