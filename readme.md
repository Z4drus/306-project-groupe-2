# Projet Module 306 – Réaliser un petit projet informatique

## 📌 Description du projet

Ce repository contient le travail réalisé dans le cadre du **module 306 : Réaliser un petit projet informatique**, destiné aux **informaticiens CFC**. Le projet est effectué par **un groupe de 4 apprenants**, qui collaborent pour concevoir, développer et documenter une petite application informatique complète.

L’objectif principal est de mettre en pratique les compétences liées à la gestion de projet, au développement, à la documentation et à la collaboration au sein d’une équipe.

---

## 📁 Structure du repository

Le repository s’organise en deux dossiers principaux :

### **1. `/code`**

Contient l’intégralité du code source du projet. Selon la nature du projet, ce dossier peut inclure :

* Le backend
* Le frontend
* Les scripts nécessaires
* Les configurations
* Les tests éventuels

### **2. `/documentation`**

Ce dossier regroupe tous les documents produits dans le cadre du projet, notamment :

#### **2.1 Business Case**

Présentation du contexte, du besoin initial, des objectifs et de la justification du projet.

#### **2.2 Cahier des charges**
### Contexte

Dans de nombreux espaces éducatifs, entreprises et lieux publics, il existe un besoin croissant d’activités ludiques, conviviales et simples d’accès. L’idée de **ArcadiaLabs**, la société commanditaire, est de proposer une **borne d’arcade moderne**, basée sur un **Raspberry Pi**, accessible depuis n’importe quel navigateur et compatible avec des **manettes Xbox**.

L’expérience doit être simple, intuitive, amusante et pensée pour des utilisateurs non techniques : élèves, collaborateurs, visiteurs, participants d’un événement.

- Matériel utilisé : Raspberry Pi + manette(s) Xbox + écran HDMI
- Public visé : écoles, entreprises, médiathèques, centres de loisirs, salons
- Usage typique : lancer rapidement un mini-jeu, organiser un petit tournoi interne, proposer une animation libre en salle de pause ou en couloir

### Objectif global

Mettre à disposition une **application web arcade** accessible depuis un navigateur, permettant de choisir un jeu, jouer immédiatement avec une manette ou le clavier, et consulter un tableau des scores clair et attractif.

L’expérience doit rester simple, rapide, ludique et facilement déployable sur un Raspberry Pi.

### Fonctionnalités attendues

- Accès depuis un navigateur moderne, sans installation ni configuration
- Menu Arcade présentant clairement les jeux disponibles (3 minimum)
- Jeux jouables simplement avec une manette Xbox (Gamepad API) ou le clavier
- Tableau des scores par jeu, consultable et remis à zéro via l'administration
- Mode plein écran pour une expérience type borne d’arcade
- Page de présentation de chaque jeu (but, règles, nombre de joueurs)
- Page « aide » courte expliquant comment connecter une manette et démarrer une partie
- Mode attract (animation automatique) lorsque la borne reste inactive
- Interface compatible écran standard ou projecteur

### KPI (indicateurs de succès)

- 90% des utilisateurs trouvent l’interface « simple » ou « très simple »
- 95% des parties peuvent être lancées en ≤ 10 secondes
- Temps de prise en main ≤ 2 minutes pour un joueur découvrant l’ArcadiaBox
- Fluidité des jeux ≥ 50 FPS sur Raspberry Pi 4
- Taux de plantage ou freeze ≤ 1% des sessions de jeu
- Temps médian pour trouver et lancer un jeu ≤ 20 secondes depuis le menu

### Objectifs business

- Proposer un produit “clé en main” divertissant et personnalisable pour écoles et entreprises
- Réduire les coûts de matériel en utilisant un Raspberry Pi (<150 CHF matériel total)
- Créer une première offre ArcadiaLabs pouvant évoluer vers un catalogue de jeux
- Favoriser la réutilisation du système dans plusieurs établissements (≥ 3 installations dans les 3 mois suivant le déploiement pilote)
- Permettre la location ou la vente d’ArcadiaBox pour des événements (tournois, journées portes ouvertes, stands)

---

### Documentation obligatoire

A la fin du projet, le groupe doit fournir les documents suivants :

**Une planification**

Cette planification doit être réalisée au début du projet avant toute autre action (selon modèle fourni). Elle décrit les étapes importantes du projet ainsi que la durée estimée correspondante. Elle doit être validée par le supérieur professionnel.

**Un journal de travail**

Ce document décrit les diverses étapes et activités liées au projet (selon modèle fourni).

**Une documentation d’analyse**

Ce document détermine les exigences et contraintes du projet et permet la justification des choix pour la réalisation du travail demandé. Ce document est composé de :

1. Synthèse de la définition du projet et des choix définitifs.
2. Explications de tous les diagrammes d’analyse réalisés.

### **Une documentation de réalisation**

La documentation de réalisation a pour objectif de faciliter la maintenance et doit contenir les informations suivantes :

1. Conception :
    1. Les diagrammes de classes des applications.
    2. Les diagrammes d’interactions des tâches principales des applications
    3. Le modèle ER de la base de données de l’application Backend
2. Implémentation :
    1. Les codes sources des applications, commentés.
    2. Le script de création et sauvegarde de la base de données, commenté.
    3. Tests fonctionnels des applications et leur communication.
3. Remarques et la conclusion :
    1. Problèmes rencontrés, limites des versions et améliorations possibles.
    2. Commentaires personnels et une auto-évaluation.

**Un Web Summary**

Ce document a pour objectif de présenter le projet de manière succincte.

#### **2.3 Documentation**

Documentation générale du projet, expliquant son fonctionnement, son architecture, les choix techniques, etc.

* **3.1 Journal** : Journal de bord retraçant l’avancement du projet au fil des séances (tâches effectuées, difficultés, décisions, etc.)
* **3.2 Planning** : Planning prévisionnel et/ou réel du projet, sous forme de tableau, diagramme ou autre.

#### **2.4 Web Summary**

Résumé final du projet sous forme de page web ou de document de synthèse, destiné à présenter le résultat de manière claire et visuelle.

---

## 👥 Équipe de projet

Le projet est réalisé par un groupe composé de **4 apprenants informaticiens CFC**.
Chaque membre participe activement à la conception, au développement et à la documentation du projet.

Vous pouvez ajouter ici les noms des membres :

* Membre 1 Axelle Hertig
* Membre 2 Valentin Gremaud
* Membre 3 Noé Romanens
* Membre 4 Diogo da Silva

---

## 🛠️ Technologies et outils utilisés

Liste des technologies, frameworks et outils utilisés pour développer et documenter le projet. Par exemple :

* Langage(s) : …
* Framework(s) : …
* Outils de gestion de versions : GitHub
* Gestion de projet : Planning, journal, réunions
* Autres outils : …

---

## 🚀 Installation et exécution

Explique comment lancer l’application. Par exemple :

```bash
git clone <url-du-repository>
cd code
# puis lancez l'application suivant la technologie utilisée
```

---

## 📄 Documentation

L'ensemble de la documentation complète est disponible dans le dossier `/documentation`. Référez-vous aux fichiers pour plus de détails sur :

* Le besoin et les objectifs
* Les exigences du projet
* L’architecture
* Le fonctionnement interne
* Le déroulement du projet

---

## RELEASE

Chaque semaine, une release est créée 

Terminal VS Code pour le tag et le push : 
```bash
git tag -a S1 -m "Release S1"
git push origin S1
```
---

## 📬 Contact

Pour toute question concernant le projet, veuillez contacter les membres du groupe ou le formateur responsable du module 306.

---

Merci d’avoir consulté ce repository ! 🚀
