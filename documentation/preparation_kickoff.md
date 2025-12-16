# **1. Présentation du projet – Contexte**

- Besoin : activité ludique, rapide, intuitive dans les écoles, entreprises et autres lieux publics.
- Solution : une borne d’arcade moderne sur Raspberry Pi, contrôlable avec une manette Xbox ou un clavier.
- Accès : via navigateur, pas d’installation, avec besoin d’internet **pour synchroniser les scores avec un serveur externe**.
- Objectif : offrir un mini-espace de jeu simple pour tous publics.

# **2. Objectifs et résultats attendus**

- 3 mini-jeux ludique (Un genre de Pac-man, Santa Cruz Run, Wallbreaker), compatibles manette et clavier
- Interface simple → prise en main en - de 2 min
- Temps de lancement d’un jeu en - de 10 sec
- Tableau des scores par jeu et reset admin
- Mode attract (animation quand inactif ⇒ capter attention) et plein écran
- Fluidité de plus de 50 FPS et taux de plantage - de 1% sur Raspberry Pi 4
- Livrables documentaires complets (tous les documents de projet)
- Scores stockés sur un serveur web externe et accessibles depuis plusieurs bornes
- Tester la compatibilité avec les manettes PlayStation (PS4/PS5) via Gamepad API
- Le mode attract sera validé en version 3 selon les priorités

# **3. Livrables obligatoires**

- Menu arcade
- 3 mini-jeux (Un genre de Pac-man, Santa Cruz Run, Wallbreaker)
- Scores et reset
- Plein écran et attract
- Version fonctionnelle
- Web Summary
- Synchronisation des scores via un serveur web
- Test de compatibilité manette PlayStation

# **4. Organisation de l’équipe**

- **Product Owner / Valentin** : vision, besoins client, priorités, validation
- **Scrum Master / Axelle** : organisation, suivi, sprint, communication interne
- **Développeur / Noé** : création des mini-jeux
- **Technicien IT / Diogo** : Raspberry Pi, déploiement, backend

# **5. Planification préliminaire**

[Modele_PlanningVersionCollabo.xlsx](attachment:f2ef55ae-3138-4270-94f4-e4f1ec2a1363:Modele_PlanningVersionCollabo.xlsx)

### Livraison V1 → dans 2 semaines

- Contient : un jeu jouable + menu de base + score simple

### Test client → “Mardi dans deux semaines”

# **6. Outils et méthodes utilisés**

- Méthode : Scrum
- Kanban : suivi des tâches
- Planning : respect des délais
- GitHub : versionning
- VS Code : développement
- Node.js (backend scores)
- Raspberry Pi 4
- API REST (serveur web pour les scores en lignes)
- Réunions rapides quotidiennes (≤ 10 min) ⇒ daily scrum

# **7. Risques identifiés**

## **Risques techniques**

- **Performances Raspberry Pi** : risque de lenteurs → _optimisation et tests réguliers_.
- **Compatibilité manettes Xbox** : la Gamepad API varie selon les navigateurs → _tests spécifiques et contrôle clavier en fallback_
- **Bugs** : possibles en développement → _tests fréquents et structure modulaire_.
- **Plein écran** : certains navigateurs limitent → _activation via action utilisateur_.
- **Mode attract** : peut ne pas se lancer correctement → _version simple et fallback statique_.
- **Scores / admin** : risque d’incohérence → _tests unitaires et système de stockage simple_.
- **Dépendance à Internet** : la synchro des scores nécessite une connexion → _mode offline partiel, gestion des erreurs réseau_.
- **Serveur externe indisponible** : impossibilité d’envoyer ou récupérer les scores → _file d’attente locale, retry automatique_.
- **Sécurité des scores** : risque de modification ou triche sur les scores envoyés → _token sécurisé, hash, validation côté serveur_.
- **Compatibilité manette PlayStation** : la Gamepad API peut ne pas reconnaître correctement les boutons → _fallback clavier obligatoires_

# 8. Architecture

![image.png](attachment:9fa500a5-eeb6-48b2-8d46-5fc00e59be9c:image.png)

# 9. Use Case

[use_case_v3.pdf](attachment:66f0dd34-8f8f-4c54-9ac9-765f59825b80:use_case_v3.pdf)

# **10. Questions / validation finale**

### **1. Périmètre**

- _Est-ce que ce que nous avons prévu de réaliser correspond bien à ce que vous attendez ?_

### **2. Fonctionnalités**

- _Les 3 mini-jeux, le menu, les scores, le plein écran et le mode attract répondent-ils à vos besoins ?_

### **3. Délais**

- _Le planning sur 5 semaines vous convient-il ?_

### **4. Priorisation**

- _La priorisation proposée (Menu → Jeux → Scores → Attract) vous semble-t-elle correcte ?_

### **5. Points ouverts**

- _Y a-t-il des éléments à clarifier, ajuster ou ajouter avant le début du développement ?_
