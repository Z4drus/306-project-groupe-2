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
        background: linear-gradient(135deg, #0a0014 0%, #1a0f2e 50%, #050008 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: loaderFadeIn 0.3s ease-out;
      }

      #loading-overlay::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          repeating-linear-gradient(
            0deg,
            rgba(189, 0, 255, 0.03) 0px,
            transparent 1px,
            transparent 2px,
            rgba(189, 0, 255, 0.03) 3px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(0, 212, 255, 0.03) 0px,
            transparent 1px,
            transparent 2px,
            rgba(0, 212, 255, 0.03) 3px
          );
        pointer-events: none;
      }

      @keyframes loaderFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes loaderFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .loading-content {
        text-align: center;
        color: white;
        font-family: 'Arcade', 'Courier New', monospace;
        position: relative;
        z-index: 1;
      }

      .loading-title {
        font-size: 1.8rem;
        margin-bottom: 2rem;
        color: #bd00ff;
        text-shadow:
          0 0 10px #bd00ff,
          0 0 20px #bd00ff,
          0 0 30px #8b00ff;
        animation: loaderPulse 2s ease-in-out infinite, loaderFlicker 4s infinite alternate;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      @keyframes loaderPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }

      @keyframes loaderFlicker {
        0%, 100% {
          opacity: 1;
          text-shadow:
            0 0 10px #bd00ff,
            0 0 20px #bd00ff,
            0 0 30px #8b00ff;
        }
        50% {
          opacity: 0.95;
          text-shadow:
            0 0 8px #bd00ff,
            0 0 15px #bd00ff,
            0 0 25px #8b00ff;
        }
      }

      .loading-bar-container {
        width: 320px;
        height: 24px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 2px;
        overflow: hidden;
        margin: 0 auto 1.5rem;
        border: 2px solid #bd00ff;
        box-shadow:
          0 0 15px rgba(189, 0, 255, 0.5),
          inset 0 0 10px rgba(189, 0, 255, 0.1);
        position: relative;
      }

      .loading-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #8b00ff, #bd00ff, #00d4ff);
        border-radius: 0;
        transition: width 0.3s ease-out;
        box-shadow:
          0 0 15px rgba(189, 0, 255, 0.8),
          0 0 25px rgba(0, 212, 255, 0.5);
        position: relative;
      }

      .loading-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.3) 50%,
          transparent 100%
        );
        animation: loaderShine 1.5s infinite;
      }

      @keyframes loaderShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .loading-progress {
        font-size: 2rem;
        font-weight: bold;
        color: #00d4ff;
        margin-bottom: 0.5rem;
        text-shadow:
          0 0 10px #00d4ff,
          0 0 20px #00d4ff;
        font-family: 'Arcade', 'Courier New', monospace;
        letter-spacing: 0.15em;
      }

      .loading-status {
        font-size: 0.85rem;
        color: #00ffff;
        animation: loaderBlink 1.5s ease-in-out infinite;
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
        letter-spacing: 0.05em;
      }

      @keyframes loaderBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .loading-dots::after {
        content: '';
        animation: loaderDots 1.5s steps(4, end) infinite;
      }

      @keyframes loaderDots {
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

      this.overlay.style.animation = 'loaderFadeOut 0.3s ease-out forwards';

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
