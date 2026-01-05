/**
 * Point d'entrée principal de l'application ArcadiaBox
 *
 * Architecture modulaire:
 * - core/ArcadeStore.js: Gestion de l'état global (Alpine.js store)
 * - core/ArcadeMenu.js: Composant menu et template HTML
 * - core/GameLoader.js: Chargement dynamique des jeux
 * - core/CursorManager.js: Curseur custom manette/souris
 */

import Alpine from 'alpinejs';
import './style.css';
import { createArcadeStore } from './core/ArcadeStore.js';
import { createArcadeMenuComponent, createAuthFormComponent, getMainMenuTemplate } from './core/ArcadeMenu.js';
import cursorManager from './core/CursorManager.js';

/**
 * Initialise l'application
 */
function initializeApp() {
  // Enregistrer le store Alpine.js
  Alpine.store('arcade', createArcadeStore());

  // Enregistrer le composant menu
  Alpine.data('arcadeMenu', createArcadeMenuComponent);

  // Enregistrer le composant formulaire d'authentification avec clavier virtuel
  Alpine.data('authForm', createAuthFormComponent);

  // Exposer Alpine globalement (pour le debugging)
  window.Alpine = Alpine;

  // Démarrer Alpine.js
  Alpine.start();

  // Initialiser le store
  Alpine.store('arcade').init();

  // Initialiser le curseur custom
  cursorManager.init();

  // Rendre le menu principal
  renderMainMenu();
}

/**
 * Génère et affiche le menu principal
 */
function renderMainMenu() {
  const mainContent = document.getElementById('main-content');

  if (mainContent) {
    mainContent.innerHTML = getMainMenuTemplate();
  } else {
    console.error('Element #main-content non trouvé');
  }
}

// Initialiser l'application au chargement
initializeApp();
