## Sprint goal

Disposer d’une borne arcade avec 3 jeux accessibles depuis le menu,
fluides, avec scores fonctionnels et mode attract basique.

| **User Story** | **Description**                                                              | **Tâches associées (issues)**           | **Priorité** |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------- | ------------ |
| **US13**       | En tant que joueur, je veux voir un menu attract quand la borne est inactive | Menu attract                            | Haute        |
| **US14**       | En tant que joueur, je veux jouer aux jeux 2 et 3 sans bug                   | Dev Jeu 3 – logiques & collisions       | Haute        |
| **US15**       | En tant que joueur, je veux que les jeux se chargent correctement            | Chargement dynamique assets Jeux 2 & 3  | Haute        |
| **US16**       | En tant que joueur, je veux une expérience fluide                            | Optimisation Canvas 2D Jeux 2 & 3       | Haute        |
| **US18**       | En tant que joueur, je veux accéder aux jeux depuis le menu                  | Intégration Jeux 2 & 3 dans menu arcade | Haute        |
| **US19**       | En tant que joueur, je veux que mes scores soient comptabilisés              | Logique scoring Jeux 2 & 3              | Haute        |

## Définition des critères de réussite (Definition of Done)
- Le menu attractif s’affiche automatiquement lorsque la borne est inactive.

- Les jeux 2 et 3 se lancent correctement sans bug ni ralentissement.

- Tous les assets (images, sons, scripts) des jeux 2 et 3 se chargent correctement.

- Les jeux fonctionnent de manière fluide sur le Raspberry Pi.

- Les jeux 2 et 3 sont accessibles depuis le menu principal de la borne.

- Les scores des joueurs sont enregistrés et affichés correctement à la fin des parties.

- La documentation et le code sont à jour et conformes aux standards de l’équipe.

## Risques / Points à surveiller
- Possibles ralentissements sur le Raspberry Pi si les assets ne sont pas optimisés.

- Bugs liés à l’intégration des nouveaux jeux dans le menu existant.

- Problèmes de compatibilité entre les contrôles clavier et manette pour les jeux 2 et 3.

- Gestion des scores incorrecte ou incohérente si plusieurs parties sont jouées successivement.

- Tests incomplets ou non réalisés sur certains scénarios du mode attract.