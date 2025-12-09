# SCRUM : User-stories

## Contexte
ArcadiaLabs développe une borne d’arcade moderne, accessible depuis un navigateur web, fonctionnant sur Raspberry Pi, et offrant au moins 3 mini-jeux jouables avec clavier ou manette Xbox.
L’objectif est de proposer une expérience simple, fluide, intuitive, adaptée à des utilisateurs non techniques (élèves, visiteurs, collaborateurs).

## User-stories
1. En tant qu’utilisateur, je veux accéder à l’interface arcade depuis un navigateur web pour pouvoir lancer un jeu immédiatement sans installation.

2. En tant qu’utilisateur, je veux voir un menu simple et clair avec la liste des mini-jeux afin de choisir rapidement le jeu auquel je veux jouer.

3. En tant qu’utilisateur, je veux afficher la fiche de présentation d’un jeu (objectifs, règles, contrôles) avant de le lancer pour comprendre comment jouer.

Contrôles & Jouabilité

4. En tant que joueur, je veux pouvoir jouer avec une manette Xbox connectée via la Gamepad API pour profiter d’un contrôle intuitif.

5. En tant que joueur, je veux pouvoir jouer avec le clavier si aucune manette n’est disponible.

6. En tant que joueur, je veux que les jeux soient fluides (≥ 50 FPS) pour avoir une expérience agréable.

Mini-jeux

7. En tant que joueur, je veux pouvoir lancer un mini-jeu en moins de 10 secondes pour commencer à jouer rapidement.

8. En tant que joueur, je veux avoir accès à au moins 3 jeux différents pour varier l’expérience de jeu.

9. En tant que joueur, je veux qu’un mini-jeu se lance en plein écran afin d’avoir une immersion type borne d’arcade.

Scores

10. En tant qu’utilisateur, je veux voir un tableau des scores pour chaque jeu afin de comparer mes performances.

11. En tant qu’administrateur, je veux pouvoir remettre à zéro les scores à tout moment pour recommencer un tournoi ou un événement.

12. En tant que joueur, je veux que mon score soit affiché clairement pendant la partie pour suivre ma performance en temps réel.

Mode attract & Inactivité

13. En tant qu’utilisateur, je veux qu’un mode attract s’active automatiquement après quelques minutes d’inactivité pour attirer les gens à jouer.

14. En tant qu’utilisateur, je veux pouvoir revenir au mode normal dès que j’appuie sur une touche ou un bouton de manette.

Compatibilité & Matériel

15. En tant qu’installateur, je veux que l’interface soit optimisée pour un Raspberry Pi 4 afin de garantir de bonnes performances.

16. En tant qu’utilisateur, je veux que l’application fonctionne correctement sur un écran ou un projecteur, en s’adaptant automatiquement à la résolution.

Administration & Maintenance

17. En tant qu’administrateur, je veux accéder à une page d’aide pour savoir comment connecter une manette et lancer les jeux.

18. En tant qu’administrateur, je veux pouvoir tester rapidement chaque jeu pour m’assurer que le système est prêt avant un événement.

19. En tant qu’administrateur, je veux que le système reste stable (≤ 1% de crash) pour garantir une expérience sans interruption.

Expérience utilisateur

20. En tant qu’utilisateur, je veux que les jeux soient simples à comprendre et qu’on puisse prendre en main le gameplay en ≤ 2 minutes.

21. En tant que joueur, si une manette se déconnecte, je veux être informé pour pouvoir reconnecter ou passer automatiquement au clavier.