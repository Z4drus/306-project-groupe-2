## Sprint goal

Améliorer la maturité de la borne arcade en ajoutant des contrôles arcade physiques, une gestion basique des profils joueurs, une interface d’administration minimale et une première couche de qualité logicielle (tests et automatisation), tout en conservant une expérience de jeu stable et fluide.

| **ID**     | **User Story** | **Description**                  | **Tâches principales**                                            | **Priorité** |
| ---------- | -------------- | -------------------------------- | ----------------------------------------------------------------- | ------------ |
| **SB3-11** | **US20**       | Utiliser un joystick type arcade | Support joystick USB type arcade (axes + boutons) via Gamepad API | Basse        |
| **SB3-12** | **US21**       | Gérer un profil utilisateur      | Création profil joueur (pseudo + avatar/photo)                    | Haute        |
| **SB3-13** | **US21**       | Gérer un profil utilisateur      | Affichage profil (avatar, scores, stats)                          | Haute        |
| **SB3-14** | **US22**       | Qualité et fiabilité du code     | Mise en place de tests unitaires backend (scores, auth)           | Moyenne      |
| **SB3-15** | **US22**       | Qualité et fiabilité du code     | Pipeline automatisé (lint + tests + build)                        | Moyenne      |
| **SB3-16** | **US23**       | Administrer la borne             | Interface admin : reset scores                                    | Basse        |
| **SB3-17** | **US23**       | Administrer la borne             | Dashboard simple (stats jeux, parties, joueurs)                   | Basse        |

## Définition des critères de réussite (Definition of Done)

- Fonctionnalité accessible depuis l’interface (menu ou admin)

- Aucun bug bloquant lors de l’utilisation normale

- Compatible clavier, manette Xbox et joystick arcade (si concerné)

- Fonction testée manuellement sur Raspberry Pi ou environnement équivalent

- Données persistées correctement (scores, profils)

## Risques / Points à surveiller

- Compatibilité variable des joysticks arcade USB

- Sécurité de l’interface admin (accès non protégé)
