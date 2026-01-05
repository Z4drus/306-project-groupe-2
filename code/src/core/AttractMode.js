/**
 * AttractMode - Ecran d'attente immersif style arcade
 *
 * Une oeuvre d'art animee avec:
 * - Aurores boreales cosmiques
 * - Grille perspective synthwave animee
 * - Formes geometriques 3D flottantes
 * - Vortex central lumineux
 * - Texte avec effet glitch avance
 * - Particules interactives
 * - Icones de controles animees
 */

export default class AttractMode {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.particles = [];
    this.shapes = [];
    this.time = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isActive = false;
  }

  /**
   * Initialise et affiche l'ecran d'attente
   * @param {HTMLElement} container - Element conteneur
   */
  show(container) {
    if (this.isActive) return;
    this.isActive = true;

    this.container = container;
    this.container.innerHTML = this.createHTML();
    this.applyStyles();

    // Initialiser le canvas
    this.canvas = this.container.querySelector('#attract-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Creer les elements (particules uniquement, pas de formes)
    this.initParticles(80);

    // Event listeners
    window.addEventListener('resize', this.handleResize);
    this.container.addEventListener('mousemove', this.handleMouseMove);

    // Gestionnaire de clic sur le bouton START
    const startBtn = this.container.querySelector('#attract-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', this.handleStartClick);
    }

    // Demarrer l'animation
    this.animate();
  }

  /**
   * Cache l'ecran d'attente
   */
  hide() {
    this.isActive = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    window.removeEventListener('resize', this.handleResize);
    if (this.container) {
      this.container.removeEventListener('mousemove', this.handleMouseMove);
    }

    this.particles = [];
    this.shapes = [];
  }

  /**
   * Cree le HTML de l'ecran
   * @returns {string} HTML
   */
  createHTML() {
    return `
      <div class="attract-screen">
        <!-- Canvas pour les animations -->
        <canvas id="attract-canvas"></canvas>

        <!-- Couche aurores boreales -->
        <div class="attract-aurora">
          <div class="aurora-wave aurora-wave-1"></div>
          <div class="aurora-wave aurora-wave-2"></div>
          <div class="aurora-wave aurora-wave-3"></div>
        </div>

        <!-- Grille perspective -->
        <div class="attract-grid-container">
          <div class="attract-grid"></div>
        </div>

        <!-- Contenu gauche -->
        <div class="attract-content">
          <!-- Titre principal avec glitch -->
          <div class="attract-title-container">
            <h1 class="attract-main-title" data-text="ARCADIA BOX">ARCADIA BOX</h1>
            <div class="attract-title-underline"></div>
          </div>

          <!-- Bouton START cliquable -->
          <button class="attract-start-btn" id="attract-start-btn">
            <span class="start-btn-bg"></span>
            <span class="start-btn-glow"></span>
            <span class="start-btn-text">START</span>
            <span class="start-btn-subtext">Cliquez pour jouer</span>
          </button>
        </div>

        <!-- Scanlines overlay -->
        <div class="attract-scanlines"></div>

        <!-- Coins decoratifs -->
        <div class="attract-corner attract-corner-tl">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 L0,0 L50,0" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="0" cy="0" r="8" fill="currentColor"/>
          </svg>
        </div>
        <div class="attract-corner attract-corner-tr">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M50,0 L100,0 L100,50" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="100" cy="0" r="8" fill="currentColor"/>
          </svg>
        </div>
        <div class="attract-corner attract-corner-bl">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 L0,100 L50,100" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="0" cy="100" r="8" fill="currentColor"/>
          </svg>
        </div>
        <div class="attract-corner attract-corner-br">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M50,100 L100,100 L100,50" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="100" cy="100" r="8" fill="currentColor"/>
          </svg>
        </div>

        <!-- Texte arcade style -->
        <div class="attract-arcade-text attract-arcade-left">PLAYER 1</div>
        <div class="attract-arcade-text attract-arcade-right">PLAYER 2</div>

        <!-- Container moderne avec SVG serveur et crédits -->
        <div class="attract-credits-panel">
          <div class="credits-server-svg">
            <object type="image/svg+xml" data="/assets/images/wait/server.svg" class="server-svg-obj">Server</object>
          </div>
          <div class="credits-info">
            <div class="credits-year">EMF 2026</div>
            <div class="credits-names">
              <span>Noé Romanens</span>
              <span>Valentin Gremaud</span>
              <span>Diogo Da Silva</span>
              <span>Axelle Hertig</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Applique les styles CSS
   */
  applyStyles() {
    const styleId = 'attract-mode-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* ============================================
         ATTRACT MODE - ECRAN D'ATTENTE IMMERSIF
         ============================================ */

      .attract-screen {
        position: fixed;
        inset: 0;
        z-index: 100;
        overflow: hidden;
        background: linear-gradient(180deg,
          #000005 0%,
          #0a0015 30%,
          #150025 60%,
          #0a0018 100%
        );
      }

      /* ========== CANVAS ========== */
      #attract-canvas {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }

      /* ========== AURORES BOREALES ========== */
      .attract-aurora {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        opacity: 0.6;
      }

      .aurora-wave {
        position: absolute;
        width: 200%;
        height: 60%;
        left: -50%;
        filter: blur(80px);
        mix-blend-mode: screen;
        animation: auroraFloat 8s ease-in-out infinite;
      }

      .aurora-wave-1 {
        top: -20%;
        background: radial-gradient(ellipse 80% 50% at 30% 50%,
          rgba(0, 255, 200, 0.4) 0%,
          rgba(0, 150, 255, 0.2) 40%,
          transparent 70%
        );
        animation-duration: 12s;
      }

      .aurora-wave-2 {
        top: 0%;
        background: radial-gradient(ellipse 60% 40% at 70% 50%,
          rgba(150, 0, 255, 0.4) 0%,
          rgba(255, 0, 200, 0.2) 40%,
          transparent 70%
        );
        animation-duration: 10s;
        animation-delay: -3s;
      }

      .aurora-wave-3 {
        top: 10%;
        background: radial-gradient(ellipse 90% 35% at 50% 50%,
          rgba(0, 200, 255, 0.3) 0%,
          rgba(100, 0, 255, 0.2) 40%,
          transparent 70%
        );
        animation-duration: 14s;
        animation-delay: -6s;
      }

      @keyframes auroraFloat {
        0%, 100% { transform: translateX(-5%) translateY(0) scale(1); }
        25% { transform: translateX(5%) translateY(-10px) scale(1.05); }
        50% { transform: translateX(-3%) translateY(5px) scale(0.98); }
        75% { transform: translateX(8%) translateY(-5px) scale(1.02); }
      }

      /* ========== GRILLE PERSPECTIVE ========== */
      .attract-grid-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50%;
        perspective: 500px;
        perspective-origin: 50% 0%;
        overflow: hidden;
        z-index: 2;
      }

      .attract-grid {
        position: absolute;
        width: 200%;
        height: 200%;
        left: -50%;
        bottom: 0;
        background-image:
          linear-gradient(rgba(0, 255, 255, 0.15) 2px, transparent 2px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.15) 2px, transparent 2px),
          linear-gradient(rgba(189, 0, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(189, 0, 255, 0.1) 1px, transparent 1px);
        background-size: 100px 100px, 100px 100px, 25px 25px, 25px 25px;
        transform: rotateX(75deg);
        transform-origin: 50% 0%;
        animation: gridScroll 2s linear infinite;
      }

      @keyframes gridScroll {
        0% { background-position: 0 0, 0 0, 0 0, 0 0; }
        100% { background-position: 0 100px, 0 100px, 0 25px, 0 25px; }
      }

      .attract-grid::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to top,
          transparent 0%,
          rgba(0, 0, 5, 0.3) 30%,
          rgba(0, 0, 10, 0.8) 70%,
          #000005 100%
        );
        pointer-events: none;
      }

      /* ========== CONTENU GAUCHE ========== */
      .attract-content {
        position: absolute;
        top: 50%;
        left: 10%;
        transform: translateY(-50%);
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2.5rem;
        text-align: center;
      }

      /* ========== TITRE PRINCIPAL ========== */
      .attract-title-container {
        position: relative;
      }

      .attract-main-title {
        font-family: 'Arcade', 'Orbitron', 'Courier New', monospace;
        font-size: clamp(3rem, 10vw, 6rem);
        font-weight: 700;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin: 0;
        position: relative;
        text-shadow:
          0 0 20px rgba(0, 255, 255, 0.8),
          0 0 40px rgba(0, 255, 255, 0.6),
          0 0 60px rgba(0, 255, 255, 0.4),
          0 0 80px rgba(189, 0, 255, 0.3);
        animation: titleGlow 3s ease-in-out infinite, titleGlitch 5s infinite;
      }

      .attract-main-title::before,
      .attract-main-title::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .attract-main-title::before {
        color: #ff00ff;
        animation: glitchLeft 5s infinite;
        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        opacity: 0.8;
      }

      .attract-main-title::after {
        color: #00ffff;
        animation: glitchRight 5s infinite;
        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
        opacity: 0.8;
      }

      @keyframes titleGlow {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.2); }
      }

      @keyframes titleGlitch {
        0%, 95%, 100% { transform: translate(0); }
        96% { transform: translate(-3px, 1px) skewX(-2deg); }
        97% { transform: translate(3px, -1px) skewX(2deg); }
        98% { transform: translate(-2px, 2px); }
        99% { transform: translate(2px, -2px); }
      }

      @keyframes glitchLeft {
        0%, 93%, 100% { transform: translate(0); }
        94% { transform: translate(-5px, 0); }
        95% { transform: translate(5px, 0); }
        96% { transform: translate(-3px, 0); }
      }

      @keyframes glitchRight {
        0%, 93%, 100% { transform: translate(0); }
        94% { transform: translate(5px, 0); }
        95% { transform: translate(-5px, 0); }
        96% { transform: translate(3px, 0); }
      }

      .attract-title-underline {
        width: 80%;
        height: 4px;
        margin: 1rem auto 0;
        background: linear-gradient(90deg,
          transparent,
          #00ffff 20%,
          #bd00ff 50%,
          #00ffff 80%,
          transparent
        );
        border-radius: 2px;
        animation: underlineShine 2s ease-in-out infinite;
      }

      @keyframes underlineShine {
        0%, 100% { opacity: 0.6; transform: scaleX(0.95); }
        50% { opacity: 1; transform: scaleX(1); }
      }

      /* ========== BOUTON START STYLISE ========== */
      .attract-start-btn {
        position: relative;
        padding: 1.5rem 4rem;
        border: none;
        background: transparent;
        cursor: pointer;
        overflow: hidden;
        border-radius: 16px;
        transition: transform 0.2s ease;
      }

      .attract-start-btn:hover {
        transform: scale(1.05);
      }

      .attract-start-btn:active {
        transform: scale(0.98);
      }

      .start-btn-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg,
          rgba(0, 255, 255, 0.15) 0%,
          rgba(99, 102, 241, 0.2) 50%,
          rgba(168, 85, 247, 0.15) 100%
        );
        border: 2px solid rgba(0, 255, 255, 0.4);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }

      .attract-start-btn:hover .start-btn-bg {
        border-color: rgba(0, 255, 255, 0.8);
        background: linear-gradient(135deg,
          rgba(0, 255, 255, 0.25) 0%,
          rgba(99, 102, 241, 0.3) 50%,
          rgba(168, 85, 247, 0.25) 100%
        );
      }

      .start-btn-glow {
        position: absolute;
        inset: -4px;
        background: linear-gradient(135deg, #00ffff, #6366f1, #a855f7, #00ffff);
        background-size: 300% 300%;
        border-radius: 20px;
        filter: blur(15px);
        opacity: 0.5;
        z-index: -1;
        animation: glowRotate 3s linear infinite, glowPulse 2s ease-in-out infinite;
      }

      @keyframes glowRotate {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes glowPulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }

      .attract-start-btn:hover .start-btn-glow {
        opacity: 0.8;
        filter: blur(20px);
      }

      .start-btn-text {
        position: relative;
        display: block;
        font-family: 'Arcade', 'Orbitron', 'Courier New', monospace;
        font-size: 3rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.15em;
        text-shadow:
          0 0 10px rgba(0, 255, 255, 0.8),
          0 0 30px rgba(0, 255, 255, 0.6),
          0 0 50px rgba(99, 102, 241, 0.4);
        animation: textPulse 2s ease-in-out infinite;
      }

      @keyframes textPulse {
        0%, 100% {
          text-shadow:
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 30px rgba(0, 255, 255, 0.6),
            0 0 50px rgba(99, 102, 241, 0.4);
        }
        50% {
          text-shadow:
            0 0 20px rgba(0, 255, 255, 1),
            0 0 40px rgba(0, 255, 255, 0.8),
            0 0 70px rgba(168, 85, 247, 0.6);
        }
      }

      .start-btn-subtext {
        position: relative;
        display: block;
        margin-top: 0.5rem;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 0.9rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .attract-start-btn:hover .start-btn-subtext {
        color: rgba(255, 255, 255, 0.9);
      }

      /* ========== SCANLINES ========== */
      .attract-scanlines {
        position: absolute;
        inset: 0;
        z-index: 50;
        pointer-events: none;
        background: repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.1) 0px,
          rgba(0, 0, 0, 0.1) 1px,
          transparent 1px,
          transparent 3px
        );
        animation: scanlineMove 0.1s linear infinite;
      }

      @keyframes scanlineMove {
        from { background-position: 0 0; }
        to { background-position: 0 3px; }
      }

      /* ========== COINS DECORATIFS ========== */
      .attract-corner {
        position: absolute;
        width: 80px;
        height: 80px;
        color: #00ffff;
        z-index: 20;
        animation: cornerGlow 2s ease-in-out infinite;
      }

      .attract-corner svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 5px currentColor);
      }

      .attract-corner-tl { top: 20px; left: 20px; }
      .attract-corner-tr { top: 20px; right: 20px; }
      .attract-corner-bl { bottom: 20px; left: 20px; }
      .attract-corner-br { bottom: 20px; right: 20px; }

      .attract-corner-tl { animation-delay: 0s; }
      .attract-corner-tr { animation-delay: 0.5s; }
      .attract-corner-br { animation-delay: 1s; }
      .attract-corner-bl { animation-delay: 1.5s; }

      @keyframes cornerGlow {
        0%, 100% { color: #00ffff; opacity: 0.6; }
        50% { color: #bd00ff; opacity: 1; }
      }

      /* ========== TEXTES ARCADE ========== */
      .attract-arcade-text {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-family: 'Arcade', 'Courier New', monospace;
        font-size: 1.2rem;
        letter-spacing: 0.2em;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        z-index: 20;
        animation: arcadeTextPulse 3s ease-in-out infinite;
      }

      .attract-arcade-left {
        left: 40px;
        color: #00ffff;
        text-shadow: 0 0 10px #00ffff;
      }

      .attract-arcade-right {
        right: 40px;
        color: #bd00ff;
        text-shadow: 0 0 10px #bd00ff;
        animation-delay: 1.5s;
      }

      @keyframes arcadeTextPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      /* ========== CONTAINER CREDITS MODERNE ========== */
      .attract-credits-panel {
        position: absolute;
        top: 50%;
        right: 5%;
        transform: translateY(-50%);
        z-index: 15;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 3rem;
        padding: 3rem 3.5rem;
        background: linear-gradient(135deg,
          rgba(15, 23, 42, 0.85) 0%,
          rgba(30, 41, 59, 0.75) 50%,
          rgba(15, 23, 42, 0.85) 100%
        );
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 24px;
        backdrop-filter: blur(20px);
        box-shadow:
          0 25px 50px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      .attract-credits-panel::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        padding: 1px;
        background: linear-gradient(135deg,
          rgba(99, 102, 241, 0.3) 0%,
          transparent 50%,
          rgba(168, 85, 247, 0.3) 100%
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }

      .credits-server-svg {
        width: 280px;
        height: 340px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .server-svg-obj {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 10px 25px rgba(39, 198, 253, 0.3));
        pointer-events: none;
      }

      .credits-info {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .credits-year {
        font-size: 2.25rem;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .credits-names {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }

      .credits-names span {
        font-size: 1.25rem;
        font-weight: 400;
        color: #cbd5e1;
        letter-spacing: 0.02em;
        line-height: 1.5;
        transition: color 0.2s ease;
      }

      .credits-names span:hover {
        color: #f1f5f9;
      }


      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .attract-main-title {
          font-size: clamp(1.8rem, 8vw, 3rem);
        }

        .attract-start-btn {
          padding: 1rem 2.5rem;
        }

        .start-btn-text {
          font-size: 2rem;
        }

        .start-btn-subtext {
          font-size: 0.75rem;
        }

        .attract-corner {
          width: 50px;
          height: 50px;
        }

        .attract-arcade-text {
          display: none;
        }

        .attract-credits-panel {
          right: 50%;
          transform: translate(50%, -50%);
          bottom: auto;
          top: auto;
          margin-top: 60vh;
          padding: 1.5rem;
          gap: 1rem;
        }

        .credits-server-svg {
          width: 100px;
          height: 120px;
        }

        .credits-year {
          font-size: 1.2rem;
        }

        .credits-names span {
          font-size: 0.85rem;
        }
      }

      @media (max-width: 1200px) and (min-width: 769px) {
        .attract-content {
          left: 5%;
        }

        .attract-credits-panel {
          right: 3%;
          padding: 1.5rem 2rem;
          gap: 1.5rem;
        }

        .credits-server-svg {
          width: 140px;
          height: 170px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Redimensionne le canvas
   */
  resizeCanvas = () => {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  /**
   * Gere le redimensionnement
   */
  handleResize = () => {
    this.resizeCanvas();
  };

  /**
   * Gere le mouvement de souris
   */
  handleMouseMove = (e) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  /**
   * Gere le clic sur le bouton START
   */
  handleStartClick = () => {
    // Importer Alpine dynamiquement pour accéder au store
    import('alpinejs').then((Alpine) => {
      const store = Alpine.default.store('arcade');
      if (store) {
        store.resetAttractTimer();
      }
    });
  };

  /**
   * Initialise les particules
   * @param {number} count - Nombre de particules
   */
  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        hue: Math.random() * 60 + 160, // Cyan to purple
        alpha: Math.random() * 0.5 + 0.3,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Initialise les formes geometriques
   */
  initShapes() {
    this.shapes = [];
    const shapeTypes = ['triangle', 'hexagon', 'diamond'];

    for (let i = 0; i < 15; i++) {
      this.shapes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 30 + 20,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        hue: Math.random() * 60 + 160,
        alpha: Math.random() * 0.2 + 0.1,
      });
    }
  }

  /**
   * Dessine une forme geometrique
   */
  drawShape(shape) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);
    ctx.strokeStyle = `hsla(${shape.hue}, 100%, 60%, ${shape.alpha})`;
    ctx.lineWidth = 2;

    ctx.beginPath();

    switch (shape.type) {
      case 'triangle':
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
          const x = Math.cos(angle) * shape.size;
          const y = Math.sin(angle) * shape.size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;

      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i * 2 * Math.PI) / 6;
          const x = Math.cos(angle) * shape.size;
          const y = Math.sin(angle) * shape.size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;

      case 'diamond':
        ctx.moveTo(0, -shape.size);
        ctx.lineTo(shape.size * 0.6, 0);
        ctx.lineTo(0, shape.size);
        ctx.lineTo(-shape.size * 0.6, 0);
        ctx.closePath();
        break;
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Boucle d'animation principale
   */
  animate = () => {
    if (!this.isActive || !this.ctx) return;

    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les particules
    this.particles.forEach((p) => {
      // Mouvement
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.05;

      // Rebondir sur les bords
      if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;

      // Attraction vers la souris
      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        p.speedX += (dx / dist) * 0.02;
        p.speedY += (dy / dist) * 0.02;
      }

      // Limiter la vitesse
      const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
      if (speed > 2) {
        p.speedX = (p.speedX / speed) * 2;
        p.speedY = (p.speedY / speed) * 2;
      }

      // Dessiner
      const pulseFactor = 1 + Math.sin(p.pulse) * 0.3;
      const size = p.size * pulseFactor;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
      this.ctx.fill();

      // Halo
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
      gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${p.alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });

    this.animationFrame = requestAnimationFrame(this.animate);
  };
}

// Instance singleton
let attractModeInstance = null;

/**
 * Obtient l'instance singleton d'AttractMode
 * @returns {AttractMode}
 */
export function getAttractMode() {
  if (!attractModeInstance) {
    attractModeInstance = new AttractMode();
  }
  return attractModeInstance;
}
