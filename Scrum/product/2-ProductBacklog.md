# SCRUM : Product backlog
| ID | User Story | Priorité | Critères d’acceptation |
| --- | --- | --- | --- |
| **US03** | Accéder à ArcadiaBox via un navigateur web | ⭐⭐⭐⭐⭐ | L’app charge via HTTP depuis le Raspberry Pi. |
| **US09** | Servir l’application web depuis le serveur | ⭐⭐⭐⭐⭐ | Le serveur renvoie l’UI, les jeux et les assets. |
| **US04** | Avoir un menu simple permettant de lancer un jeu | ⭐⭐⭐⭐ | Menu affiché + navigation clavier/manette. |
| **US01** | Jouer avec une manette Xbox | ⭐⭐⭐⭐ | La manette est détectée via Gamepad API ; actions fonctionnelles. |
| **US02** | Jouer avec le clavier | ⭐⭐⭐⭐ | Commandes du clavier fonctionnelles dans le menu + mini-jeu. |
| **US05** | Lancer un mini-jeu | ⭐⭐⭐⭐ | Le mini-jeu démarre depuis le menu sans rechargement complet. |
| **US11** | Charger les assets nécessaires (images/sons) | ⭐⭐⭐ | Tous les assets chargent correctement via le serveur. |
| **US06** | Avoir un mini-jeu fluide et jouable | ⭐⭐⭐ | FPS correct, pas de freezes, contrôles réactifs. |
| **US07** | Sauvegarder le score du mini-jeu | ⭐⭐⭐ | Score sauvegardé dans JSON/base après la partie. |
| **US10** | Stocker les scores de manière persistante | ⭐⭐⭐ | Les scores restent après redémarrage du RPi. |
| **US08** | Afficher les scores | ⭐⭐⭐ | Les scores s’affichent dans une page dédiée UI. |
| **US12** | Interface responsive selon l’écran | ⭐⭐ | UI qui s’adapte à PC / tablette / petit écran RPi. |

## Instructions

Ce document est complété principalement durant la cérémonie du `backlog refinement / pocker planning`.

1. Story Points : Le nombre de points est attribué en fonction de la complexité de la tâche. Les tâches plus complexes ou les tâches nécessitant des tests supplémentaires ont plus de points. Les valeurs de story points indiquent la taille relative de la tâche dans le backlog.

2. Priorité : La priorité de chaque User Story est définie comme Haute ou Moyenne en fonction de l’importance de la fonctionnalité dans le cadre du projet. Les fonctionnalités critiques pour le gameplay (comme la gestion des scores, des profils et de l'interaction avec le matériel) sont classées comme ayant une priorité Haute.

3. Cette liste de tâches évoluera à chaque sprint planning et sera mise à jour en fonction des avancées du projet et des découvertes faites lors des tests.
