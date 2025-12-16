/**
 * LoadingOverlay - Overlay de chargement DOM
 *
 * Affiche un overlay de chargement pendant le chargement des jeux
 * avec une barre de progression animee.
 */

export default class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.progressBar = null;
    this.progressText = null;
    this.statusText = null;
    this.progress = 0;
  }

  /**
   * Affiche l'overlay de chargement
   * @param {string} gameName - Nom du jeu en cours de chargement
   */
  show(gameName = 'jeu') {
    if (this.overlay) return;

    // Créer l'overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading-content">
        <h2 class="loading-title">Chargement de ${gameName}</h2>
        <div class="loading-bar-container">
          <div class="loading-bar"></div>
        </div>
        <p class="loading-progress">0%</p>
        <p class="loading-status">Initialisation...</p>
      </div>
    `;

    // Appliquer les styles
    this.applyStyles();

    // Ajouter au DOM
    document.body.appendChild(this.overlay);

    // Récupérer les références
    this.progressBar = this.overlay.querySelector('.loading-bar');
    this.progressText = this.overlay.querySelector('.loading-progress');
    this.statusText = this.overlay.querySelector('.loading-status');
  }

  /**
   * Applique les styles CSS à l'overlay
   */
  applyStyles() {
    const style = document.createElement('style');
    style.id = 'loading-overlay-styles';
    style.textContent = `
      #loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .loading-content {
        text-align: center;
        color: white;
        font-family: 'Arial', sans-serif;
      }

      .loading-title {
        font-size: 2rem;
        margin-bottom: 2rem;
        color: #ff6b35;
        text-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .loading-bar-container {
        width: 300px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin: 0 auto 1rem;
        border: 2px solid rgba(255, 107, 53, 0.5);
      }

      .loading-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #ff6b35, #f7931e);
        border-radius: 8px;
        transition: width 0.3s ease-out;
        box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
      }

      .loading-progress {
        font-size: 1.5rem;
        font-weight: bold;
        color: #00ffe4;
        margin-bottom: 0.5rem;
      }

      .loading-status {
        font-size: 0.9rem;
        color: #888;
        animation: blink 1.5s ease-in-out infinite;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .loading-dots::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
      }

      @keyframes dots {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
        100% { content: ''; }
      }
    `;

    // Supprimer les anciens styles s'ils existent
    const existingStyle = document.getElementById('loading-overlay-styles');
    if (existingStyle) existingStyle.remove();

    document.head.appendChild(style);
  }

  /**
   * Met à jour la progression
   * @param {number} progress - Progression de 0 à 100
   * @param {string} status - Message de statut
   */
  update(progress, status = null) {
    this.progress = Math.min(100, Math.max(0, progress));

    if (this.progressBar) {
      this.progressBar.style.width = `${this.progress}%`;
    }

    if (this.progressText) {
      this.progressText.textContent = `${Math.round(this.progress)}%`;
    }

    if (status && this.statusText) {
      this.statusText.textContent = status;
    }
  }

  /**
   * Cache l'overlay avec une animation
   * @returns {Promise} Promise qui se résout quand l'animation est terminée
   */
  hide() {
    return new Promise(resolve => {
      if (!this.overlay) {
        resolve();
        return;
      }

      this.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';

      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
        resolve();
      }, 300);
    });
  }

  /**
   * Détruit l'overlay immédiatement
   */
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

// Instance singleton
let loadingOverlayInstance = null;

export function getLoadingOverlay() {
  if (!loadingOverlayInstance) {
    loadingOverlayInstance = new LoadingOverlay();
  }
  return loadingOverlayInstance;
}
