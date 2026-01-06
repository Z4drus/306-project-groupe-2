## Sprint goal

Disposer d’une borne arcade avec 3 jeux accessibles depuis le menu,
fluides, avec scores fonctionnels et mode attract basique.

| ID | User Story associée | Tâche                        | Description                                                                                                            | Priorité | 
| -- | ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | 
| 1  | US14, US01, US02    | Développer jeux 2 et 3       | Implémenter les logiques, collisions et contrôles clavier/manette pour les jeux 2 et 3.                                | ⭐        |
| 2  | US15                | Charger dynamiquement assets | Optimiser le chargement des images, sons et scripts pour les jeux 2 et 3 sans rechargement global.                     | ⭐        | 
| 3  | US16                | Optimiser performances       | Optimiser le rendu Canvas 2D pour tous les jeux afin d’assurer fluidité sur Raspberry Pi.                              | ⭐        | 
| 4  | US18                | Intégrer jeux 2 et 3         | Ajouter les jeux 2 et 3 au menu arcade, accessible et jouable comme le premier jeu.                                    | ⭐        | 
| 5  | US19, US07, US10    | Gestion scoring complet      | Mettre à jour le système de score pour enregistrer et afficher correctement les scores de tous les jeux.               | ⭐        | 
| 6  | US13                | Menu attractif               | Créer un écran attractif qui s’affiche après une période d’inactivité.                                                 | ⭐        | 
| 7  | US17                | Sécuriser logique des jeux   | Ajouter la sécurisation pour éviter la triche ou la modification de score côté client.                                 | ⭐        | 
| 8  | US03, US09, US12    | Test final intégration       | Vérifier que tous les jeux se lancent correctement via menu, clavier/manette et navigateur, avec interface responsive. | ⭐⭐⭐⭐⭐    |


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