/**
 * LoadingOverlay - Ecran de chargement immersif style arcade
 *
 * Design innovant avec effets visuels dynamiques:
 * - Grille cyberpunk animee en arriere-plan
 * - Cercle de progression avec segments lumineux
 * - Particules flottantes
 * - Effets glitch et neon
 */

export default class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.progressRing = null;
    this.progressText = null;
    this.statusText = null;
    this.tipText = null;
    this.progress = 0;
    this.animationFrame = null;
    this.particles = [];
    this.tipIndex = 0;
    this.tipInterval = null;
    this.isHiding = false;
    this.hidePromise = null;
  }

  /**
   * Conseils affiches pendant le chargement
   */
  static TIPS = [
    'Utilise les fleches ou une manette pour jouer',
    'Connecte-toi pour sauvegarder tes scores',
    'Appuie sur Echap pour quitter une partie',
    'Defie tes amis dans le classement',
    'Les power-ups peuvent changer la partie',
  ];

  /**
   * Affiche l'overlay de chargement
   * @param {string} gameName - Nom du jeu en cours de chargement
   * @param {Object} options - Options d'affichage
   * @param {boolean} options.instant - Si true, affiche sans animation de fade-in
   */
  show(gameName = 'jeu', options = {}) {
    // Si l'overlay est en train de se cacher, le detruire immediatement
    if (this.isHiding && this.overlay) {
      this.forceDestroy();
    }

    // Si l'overlay existe deja et n'est pas en train de se cacher, ne rien faire
    if (this.overlay) return;

    const { instant = false } = options;

    // Creer l'overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.innerHTML = this.createHTML(gameName);

    // Appliquer les styles
    this.applyStyles();

    // Si instant, desactiver l'animation de fade-in
    if (instant) {
      this.overlay.style.animation = 'none';
      this.overlay.style.opacity = '1';
    }

    // Ajouter au DOM
    document.body.appendChild(this.overlay);

    // Recuperer les references
    this.progressRing = this.overlay.querySelector('.loading-ring-progress');
    this.progressText = this.overlay.querySelector('.loading-percentage');
    this.statusText = this.overlay.querySelector('.loading-status');
    this.tipText = this.overlay.querySelector('.loading-tip-text');

    // Demarrer les animations
    this.startParticles();
    this.startTipRotation();
  }

  /**
   * Cree le HTML de l'overlay
   * @param {string} gameName - Nom du jeu
   * @returns {string} HTML
   */
  createHTML(gameName) {
    return `
      <div class="loading-background">
        <div class="loading-grid"></div>
        <div class="loading-scanline"></div>
        <div class="loading-particles" id="loading-particles"></div>
      </div>

      <div class="loading-content">
        <!-- Titre animé -->
        <div class="loading-header">
          <h2 class="loading-title" data-text="${gameName}">${gameName}</h2>
          <div class="loading-subtitle">Preparation en cours</div>
        </div>

        <!-- Cercle de progression -->
        <div class="loading-ring-container">
          <svg class="loading-ring" viewBox="0 0 200 200">
            <!-- Cercle de fond avec segments -->
            <circle class="loading-ring-bg" cx="100" cy="100" r="85" />
            <!-- Segments decoratifs -->
            <g class="loading-ring-segments">
              ${this.createSegments()}
            </g>
            <!-- Cercle de progression -->
            <circle class="loading-ring-progress" cx="100" cy="100" r="85" />
            <!-- Points decoratifs -->
            <g class="loading-ring-dots">
              ${this.createDots()}
            </g>
          </svg>
          <div class="loading-ring-center">
            <span class="loading-percentage">0%</span>
          </div>
        </div>

        <!-- Status -->
        <div class="loading-status-container">
          <div class="loading-status-bar">
            <div class="loading-status-fill"></div>
          </div>
          <p class="loading-status">Initialisation...</p>
        </div>

        <!-- Tip -->
        <div class="loading-tip">
          <span class="loading-tip-text">${LoadingOverlay.TIPS[0]}</span>
        </div>
      </div>

      <!-- Decoration coins -->
      <div class="loading-corner loading-corner-tl"></div>
      <div class="loading-corner loading-corner-tr"></div>
      <div class="loading-corner loading-corner-bl"></div>
      <div class="loading-corner loading-corner-br"></div>
    `;
  }

  /**
   * Cree les segments du cercle
   * @returns {string} SVG paths
   */
  createSegments() {
    let segments = '';
    const total = 12;
    for (let i = 0; i < total; i++) {
      const angle = (i * 360) / total - 90;
      const x1 = 100 + 70 * Math.cos((angle * Math.PI) / 180);
      const y1 = 100 + 70 * Math.sin((angle * Math.PI) / 180);
      const x2 = 100 + 95 * Math.cos((angle * Math.PI) / 180);
      const y2 = 100 + 95 * Math.sin((angle * Math.PI) / 180);
      segments += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="loading-segment" style="animation-delay: ${i * 0.1}s" />`;
    }
    return segments;
  }

  /**
   * Cree les points decoratifs
   * @returns {string} SVG circles
   */
  createDots() {
    let dots = '';
    const total = 24;
    for (let i = 0; i < total; i++) {
      const angle = (i * 360) / total - 90;
      const x = 100 + 85 * Math.cos((angle * Math.PI) / 180);
      const y = 100 + 85 * Math.sin((angle * Math.PI) / 180);
      dots += `<circle cx="${x}" cy="${y}" r="2" class="loading-dot" style="animation-delay: ${i * 0.05}s" />`;
    }
    return dots;
  }

  /**
   * Demarre l'animation des particules
   */
  startParticles() {
    const container = this.overlay?.querySelector('#loading-particles');
    if (!container) return;

    // Creer 30 particules
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'loading-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${3 + Math.random() * 4}s`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      particle.style.opacity = `${0.3 + Math.random() * 0.7}`;
      container.appendChild(particle);
    }
  }

  /**
   * Demarre la rotation des conseils
   */
  startTipRotation() {
    this.tipInterval = setInterval(() => {
      this.tipIndex = (this.tipIndex + 1) % LoadingOverlay.TIPS.length;
      if (this.tipText) {
        this.tipText.style.opacity = '0';
        setTimeout(() => {
          if (this.tipText) {
            this.tipText.textContent = LoadingOverlay.TIPS[this.tipIndex];
            this.tipText.style.opacity = '1';
          }
        }, 200);
      }
    }, 4000);
  }

  /**
   * Applique les styles CSS a l'overlay
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
        z-index: 10000;
        animation: loaderFadeIn 0.3s ease-out;
        overflow: hidden;
      }

      /* ========== ARRIERE-PLAN ========== */
      .loading-background {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #0a0014 0%, #1a0f2e 50%, #050008 100%);
      }

      /* Grille cyberpunk */
      .loading-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(189, 0, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(189, 0, 255, 0.1) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: gridMove 20s linear infinite;
        perspective: 500px;
        transform-style: preserve-3d;
      }

      .loading-grid::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center bottom, rgba(189, 0, 255, 0.15) 0%, transparent 70%);
      }

      @keyframes gridMove {
        0% { background-position: 0 0; }
        100% { background-position: 50px 50px; }
      }

      /* Ligne de scan */
      .loading-scanline {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(0, 212, 255, 0.8) 50%,
          transparent 100%);
        box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        animation: scanline 3s ease-in-out infinite;
      }

      @keyframes scanline {
        0%, 100% { top: 0; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }

      /* Particules */
      .loading-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .loading-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--neon-cyan, #00d4ff);
        border-radius: 50%;
        animation: particleFloat 5s ease-in-out infinite;
        box-shadow: 0 0 10px var(--neon-cyan, #00d4ff);
      }

      @keyframes particleFloat {
        0%, 100% {
          transform: translateY(0) scale(1);
          opacity: 0.3;
        }
        50% {
          transform: translateY(-30px) scale(1.5);
          opacity: 1;
        }
      }

      /* ========== CONTENU ========== */
      .loading-content {
        position: relative;
        z-index: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 2rem;
      }

      /* Header */
      .loading-header {
        text-align: center;
      }

      .loading-title {
        font-family: 'Arcade', 'Courier New', monospace;
        font-size: 3rem;
        font-weight: 400;
        color: #00d4ff;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin: 0;
        position: relative;
        text-shadow:
          0 0 10px #00d4ff,
          0 0 20px #00d4ff,
          0 0 40px #bd00ff;
        animation: glitchText 3s infinite;
      }

      .loading-title::before,
      .loading-title::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .loading-title::before {
        color: #ff00ff;
        animation: glitchBefore 3s infinite;
        clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
      }

      .loading-title::after {
        color: #00ffff;
        animation: glitchAfter 3s infinite;
        clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
      }

      @keyframes glitchText {
        0%, 90%, 100% { transform: translate(0); }
        92% { transform: translate(-2px, 1px); }
        94% { transform: translate(2px, -1px); }
        96% { transform: translate(-1px, 2px); }
        98% { transform: translate(1px, -2px); }
      }

      @keyframes glitchBefore {
        0%, 90%, 100% { transform: translate(0); }
        92% { transform: translate(3px, 0); }
        94% { transform: translate(-3px, 0); }
      }

      @keyframes glitchAfter {
        0%, 90%, 100% { transform: translate(0); }
        93% { transform: translate(-3px, 0); }
        95% { transform: translate(3px, 0); }
      }

      .loading-subtitle {
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        font-size: 1rem;
        color: #bd00ff;
        text-shadow: 0 0 10px #bd00ff;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        margin-top: 0.5rem;
        animation: subtitleBlink 1.5s ease-in-out infinite;
      }

      @keyframes subtitleBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* ========== CERCLE DE PROGRESSION ========== */
      .loading-ring-container {
        position: relative;
        width: 220px;
        height: 220px;
      }

      .loading-ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .loading-ring-bg {
        fill: none;
        stroke: rgba(189, 0, 255, 0.2);
        stroke-width: 8;
      }

      .loading-ring-progress {
        fill: none;
        stroke: url(#progressGradient);
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 534;
        stroke-dashoffset: 534;
        transition: stroke-dashoffset 0.3s ease-out;
        filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.8));
      }

      .loading-segment {
        stroke: rgba(189, 0, 255, 0.3);
        stroke-width: 2;
        animation: segmentPulse 2s ease-in-out infinite;
      }

      @keyframes segmentPulse {
        0%, 100% { opacity: 0.3; stroke: rgba(189, 0, 255, 0.3); }
        50% { opacity: 1; stroke: rgba(0, 212, 255, 0.8); }
      }

      .loading-dot {
        fill: rgba(0, 212, 255, 0.5);
        animation: dotPulse 1.5s ease-in-out infinite;
      }

      @keyframes dotPulse {
        0%, 100% { opacity: 0.3; r: 2; }
        50% { opacity: 1; r: 3; }
      }

      .loading-ring-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .loading-percentage {
        font-family: 'Arcade', 'Courier New', monospace;
        font-size: 2.5rem;
        color: #fff;
        text-shadow:
          0 0 10px #00d4ff,
          0 0 20px #00d4ff,
          0 0 30px #bd00ff;
        letter-spacing: 0.1em;
      }

      /* ========== STATUS ========== */
      .loading-status-container {
        width: 100%;
        max-width: 400px;
        text-align: center;
      }

      .loading-status-bar {
        height: 4px;
        background: rgba(189, 0, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 1rem;
        box-shadow:
          inset 0 0 10px rgba(0, 0, 0, 0.5),
          0 0 5px rgba(189, 0, 255, 0.3);
      }

      .loading-status-fill {
        height: 100%;
        width: 30%;
        background: linear-gradient(90deg, #8b00ff, #bd00ff, #00d4ff);
        border-radius: 2px;
        animation: statusBarPulse 1.5s ease-in-out infinite;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.8);
      }

      @keyframes statusBarPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      .loading-status {
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        font-size: 1rem;
        color: #00ffff;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
        margin: 0;
        animation: statusBlink 1s ease-in-out infinite;
      }

      @keyframes statusBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      /* ========== TIP ========== */
      .loading-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem 1.5rem;
        background: rgba(189, 0, 255, 0.1);
        border: 1px solid rgba(189, 0, 255, 0.3);
        border-radius: 4px;
        max-width: 500px;
      }

      .loading-tip-text {
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        font-size: 0.95rem;
        color: #bd00ff;
        text-shadow: 0 0 5px rgba(189, 0, 255, 0.3);
        transition: opacity 0.2s ease;
      }

      /* ========== COINS DECORATIFS ========== */
      .loading-corner {
        position: absolute;
        width: 60px;
        height: 60px;
        border: 3px solid #bd00ff;
        pointer-events: none;
        box-shadow:
          0 0 15px rgba(189, 0, 255, 0.5),
          inset 0 0 15px rgba(189, 0, 255, 0.1);
      }

      .loading-corner-tl {
        top: 20px;
        left: 20px;
        border-right: none;
        border-bottom: none;
        animation: cornerPulse 2s ease-in-out infinite;
      }

      .loading-corner-tr {
        top: 20px;
        right: 20px;
        border-left: none;
        border-bottom: none;
        animation: cornerPulse 2s ease-in-out infinite 0.5s;
      }

      .loading-corner-bl {
        bottom: 20px;
        left: 20px;
        border-right: none;
        border-top: none;
        animation: cornerPulse 2s ease-in-out infinite 1s;
      }

      .loading-corner-br {
        bottom: 20px;
        right: 20px;
        border-left: none;
        border-top: none;
        animation: cornerPulse 2s ease-in-out infinite 1.5s;
      }

      @keyframes cornerPulse {
        0%, 100% {
          border-color: #bd00ff;
          box-shadow:
            0 0 15px rgba(189, 0, 255, 0.5),
            inset 0 0 15px rgba(189, 0, 255, 0.1);
        }
        50% {
          border-color: #00d4ff;
          box-shadow:
            0 0 25px rgba(0, 212, 255, 0.7),
            inset 0 0 20px rgba(0, 212, 255, 0.2);
        }
      }

      /* ========== ANIMATIONS GENERALES ========== */
      @keyframes loaderFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes loaderFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 600px) {
        .loading-title {
          font-size: 1.8rem;
          letter-spacing: 0.1em;
        }

        .loading-ring-container {
          width: 180px;
          height: 180px;
        }

        .loading-percentage {
          font-size: 2rem;
        }

        .loading-tip {
          flex-direction: column;
          text-align: center;
          padding: 0.75rem;
        }

        .loading-corner {
          width: 40px;
          height: 40px;
        }
      }

      /* Ajout du gradient SVG */
      #loading-overlay svg defs {
        position: absolute;
      }
    `;

    // Supprimer les anciens styles s'ils existent
    const existingStyle = document.getElementById('loading-overlay-styles');
    if (existingStyle) existingStyle.remove();

    document.head.appendChild(style);

    // Ajouter le gradient SVG
    this.addSVGGradient();
  }

  /**
   * Ajoute le gradient SVG pour le cercle de progression
   */
  addSVGGradient() {
    const ring = this.overlay?.querySelector('.loading-ring');
    if (!ring) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#8b00ff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#00d4ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#00ffff;stop-opacity:1" />
      </linearGradient>
    `;
    ring.insertBefore(defs, ring.firstChild);
  }

  /**
   * Met a jour la progression
   * @param {number} progress - Progression de 0 a 100
   * @param {string} status - Message de statut
   */
  update(progress, status = null) {
    this.progress = Math.min(100, Math.max(0, progress));

    // Mettre a jour le cercle de progression
    if (this.progressRing) {
      const circumference = 534; // 2 * PI * 85
      const offset = circumference - (this.progress / 100) * circumference;
      this.progressRing.style.strokeDashoffset = offset;
    }

    // Mettre a jour le pourcentage
    if (this.progressText) {
      this.progressText.textContent = `${Math.round(this.progress)}%`;
    }

    // Mettre a jour le statut
    if (status && this.statusText) {
      this.statusText.textContent = status;
    }

    // Mettre a jour la barre de statut
    const statusFill = this.overlay?.querySelector('.loading-status-fill');
    if (statusFill) {
      statusFill.style.width = `${this.progress}%`;
    }
  }

  /**
   * Cache l'overlay avec une animation
   * @returns {Promise} Promise qui se resout quand l'animation est terminee
   */
  hide() {
    // Si deja en train de se cacher, retourner la promise existante
    if (this.isHiding && this.hidePromise) {
      return this.hidePromise;
    }

    this.hidePromise = new Promise(resolve => {
      if (!this.overlay) {
        this.isHiding = false;
        this.hidePromise = null;
        resolve();
        return;
      }

      this.isHiding = true;

      // Arreter les animations
      if (this.tipInterval) {
        clearInterval(this.tipInterval);
        this.tipInterval = null;
      }

      this.overlay.style.animation = 'loaderFadeOut 0.4s ease-out forwards';

      setTimeout(() => {
        if (this.overlay && this.isHiding) {
          this.overlay.remove();
          this.overlay = null;
        }
        this.isHiding = false;
        this.hidePromise = null;
        resolve();
      }, 400);
    });

    return this.hidePromise;
  }

  /**
   * Detruit l'overlay immediatement (annule toute animation en cours)
   */
  forceDestroy() {
    this.isHiding = false;
    this.hidePromise = null;
    if (this.tipInterval) {
      clearInterval(this.tipInterval);
      this.tipInterval = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Detruit l'overlay immediatement (alias pour forceDestroy)
   */
  destroy() {
    this.forceDestroy();
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
