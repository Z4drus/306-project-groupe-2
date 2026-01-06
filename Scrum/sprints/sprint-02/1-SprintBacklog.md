## Sprint goal

Finaliser l’intégration des trois mini-jeux dans la borne arcade afin de disposer d’une version jouable, fluide et cohérente, avec menu fonctionnel, scores persistants et un mode attract basique.
| **ID** | **User Story** | **Description** | **Tâches principales** | **Priorité** |
| ---------- | -------------------- | ------------------------------- | -------------------------------------------------------- | ------------ |
| **SB3-1** | **US14** | Jouer aux jeux 2 et 3 sans bug | Finalisation logique & collisions **Jeu 2** | Haute |
| **SB3-2** | **US14** | Jouer aux jeux 2 et 3 sans bug | Développement logique de base **Jeu 3** | Haute |
| **SB3-3** | **US15** | Chargement correct des jeux | Chargement dynamique des assets **Jeux 2 & 3** | Haute |
| **SB3-4** | **US16** | Expérience fluide | Optimisation Canvas 2D **Jeu 2** | Haute |
| **SB3-5** | **US16** | Expérience fluide | Premières optimisations performances **Jeu 3** | Moyenne |
| **SB3-6** | **US18** | Accéder aux jeux depuis le menu | Intégration **Jeu 3** dans le menu arcade | Haute |
| **SB3-7** | **US19, US07, US10** | Scores comptabilisés | Implémentation du scoring **Jeu 3** + persistance | Haute |
| **SB3-8** | **US13** | Menu attractif | Mise en place d’un **mode attract basique** (inactivité) | Moyenne |
| **SB3-9** | **US17** | Sécuriser la logique de score | Vérifications côté serveur / cohérence score | Moyenne |
| **SB3-10** | **US03, US09, US12** | Validation globale | Tests finaux : menu, jeux, manette/clavier, responsive | Haute |

## Définition des critères de réussite (Definition of Done)

- Le jeu se lance depuis le menu sans erreur

- Le jeu est jouable au clavier et à la manette

- Aucun bug bloquant
- Les scores sont calculés et enregistrés correctement

- Les scores s’affichent dans les classements

- Les performances sont fluides sur Raspberry Pi

- Le mode attract fonctionne et se désactive à l’entrée utilisateur

- Le code est testé et poussé sur le dépôt Git

## Risques / Points à surveiller

- Manque de fluidité sur Raspberry Pi

- Bugs de logique ou de collisions dans le jeu 3

- Problèmes de chargement des assets

- Scores incorrects ou non synchronisés

- Manette non reconnue selon le matériel

