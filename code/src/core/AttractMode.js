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

    // Creer les elements
    this.initParticles(80);
    this.initShapes();

    // Event listeners
    window.addEventListener('resize', this.handleResize);
    this.container.addEventListener('mousemove', this.handleMouseMove);

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

        <!-- Vortex central -->
        <div class="attract-vortex">
          <div class="vortex-ring vortex-ring-1"></div>
          <div class="vortex-ring vortex-ring-2"></div>
          <div class="vortex-ring vortex-ring-3"></div>
          <div class="vortex-ring vortex-ring-4"></div>
          <div class="vortex-core"></div>
        </div>

        <!-- Contenu central -->
        <div class="attract-content">
          <!-- Titre principal avec glitch -->
          <div class="attract-title-container">
            <h1 class="attract-main-title" data-text="ARCADIA BOX">ARCADIA BOX</h1>
            <div class="attract-title-underline"></div>
          </div>

          <!-- Message d'action -->
          <div class="attract-action">
            <div class="attract-action-wrapper">
              <!-- Icone manette -->
              <div class="attract-icon attract-icon-gamepad">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.97 16L5 19c-.47.47-.51 1.23-.12 1.74.42.54 1.19.68 1.76.28l3.5-2.48c.19-.14.4-.23.62-.28H13.24c.22.05.43.14.62.28l3.5 2.48c.57.4 1.34.26 1.76-.28.39-.51.35-1.27-.12-1.74l-2.97-3H7.97z"/>
                  <path d="M17 4H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9 13H7v-2h2v2zm0-4H7V7h2v2zm4 4h-2v-2h2v2zm0-4h-2V7h2v2zm4 4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                </svg>
              </div>

              <!-- Texte principal -->
              <div class="attract-text-block">
                <span class="attract-press-text">APPUYEZ SUR</span>
                <span class="attract-button-text">START</span>
                <span class="attract-or-text">OU CLIQUEZ</span>
              </div>

              <!-- Icone clavier -->
              <div class="attract-icon attract-icon-keyboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"/>
                  <path d="M8 12h.01M12 12h.01M16 12h.01"/>
                  <path d="M7 16h10"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Insert coin style retro -->
          <div class="attract-insert-coin">
            <span class="coin-text">INSERT COIN</span>
            <div class="coin-animation">
              <div class="coin"></div>
            </div>
          </div>
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

      /* ========== VORTEX CENTRAL ========== */
      .attract-vortex {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        height: 600px;
        z-index: 3;
        pointer-events: none;
      }

      .vortex-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        border: 2px solid;
        transform: translate(-50%, -50%);
        animation: vortexRotate 4s linear infinite;
      }

      .vortex-ring-1 {
        width: 100%;
        height: 100%;
        border-color: rgba(0, 255, 255, 0.1);
        animation-duration: 20s;
      }

      .vortex-ring-2 {
        width: 75%;
        height: 75%;
        border-color: rgba(189, 0, 255, 0.15);
        animation-duration: 15s;
        animation-direction: reverse;
      }

      .vortex-ring-3 {
        width: 50%;
        height: 50%;
        border-color: rgba(0, 255, 200, 0.2);
        animation-duration: 10s;
      }

      .vortex-ring-4 {
        width: 25%;
        height: 25%;
        border-color: rgba(255, 0, 200, 0.25);
        animation-duration: 7s;
        animation-direction: reverse;
      }

      @keyframes vortexRotate {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      .vortex-core {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150px;
        height: 150px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle,
          rgba(0, 255, 255, 0.3) 0%,
          rgba(189, 0, 255, 0.2) 30%,
          transparent 70%
        );
        border-radius: 50%;
        animation: corePulse 2s ease-in-out infinite;
        filter: blur(20px);
      }

      @keyframes corePulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
        50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
      }

      /* ========== CONTENU CENTRAL ========== */
      .attract-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3rem;
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

      /* ========== ZONE D'ACTION ========== */
      .attract-action {
        padding: 2rem 3rem;
        background: rgba(0, 10, 30, 0.6);
        border: 2px solid rgba(0, 255, 255, 0.3);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        animation: actionPulse 2s ease-in-out infinite;
        box-shadow:
          0 0 30px rgba(0, 255, 255, 0.2),
          0 0 60px rgba(189, 0, 255, 0.1),
          inset 0 0 30px rgba(0, 255, 255, 0.05);
      }

      @keyframes actionPulse {
        0%, 100% {
          border-color: rgba(0, 255, 255, 0.3);
          box-shadow:
            0 0 30px rgba(0, 255, 255, 0.2),
            0 0 60px rgba(189, 0, 255, 0.1),
            inset 0 0 30px rgba(0, 255, 255, 0.05);
        }
        50% {
          border-color: rgba(189, 0, 255, 0.5);
          box-shadow:
            0 0 50px rgba(189, 0, 255, 0.3),
            0 0 100px rgba(0, 255, 255, 0.2),
            inset 0 0 40px rgba(189, 0, 255, 0.08);
        }
      }

      .attract-action-wrapper {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .attract-icon {
        width: 60px;
        height: 60px;
        color: #00ffff;
        filter: drop-shadow(0 0 10px currentColor);
        animation: iconFloat 3s ease-in-out infinite;
      }

      .attract-icon-gamepad {
        animation-delay: 0s;
      }

      .attract-icon-keyboard {
        animation-delay: 1.5s;
      }

      @keyframes iconFloat {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.05); }
      }

      .attract-text-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .attract-press-text {
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 0.3em;
        text-transform: uppercase;
      }

      .attract-button-text {
        font-family: 'Arcade', 'Orbitron', 'Courier New', monospace;
        font-size: 2.5rem;
        font-weight: 700;
        color: #00ffff;
        text-shadow:
          0 0 10px #00ffff,
          0 0 20px #00ffff,
          0 0 40px #bd00ff;
        animation: buttonBlink 1s ease-in-out infinite;
        letter-spacing: 0.2em;
      }

      @keyframes buttonBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .attract-or-text {
        font-family: 'Born2bSportyFS', 'Courier New', sans-serif;
        font-size: 0.9rem;
        color: rgba(189, 0, 255, 0.8);
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      /* ========== INSERT COIN ========== */
      .attract-insert-coin {
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: insertCoinBlink 1.2s ease-in-out infinite;
      }

      @keyframes insertCoinBlink {
        0%, 49%, 100% { opacity: 1; }
        50%, 99% { opacity: 0.3; }
      }

      .coin-text {
        font-family: 'Arcade', 'Courier New', monospace;
        font-size: 1.5rem;
        color: #ffd700;
        text-shadow:
          0 0 10px rgba(255, 215, 0, 0.8),
          0 0 20px rgba(255, 215, 0, 0.5);
        letter-spacing: 0.15em;
      }

      .coin-animation {
        position: relative;
        width: 30px;
        height: 40px;
        overflow: hidden;
      }

      .coin {
        position: absolute;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ffd700 100%);
        border-radius: 50%;
        border: 2px solid #cc9900;
        animation: coinDrop 1.5s ease-in infinite;
        box-shadow:
          0 0 10px rgba(255, 215, 0, 0.6),
          inset 0 -3px 6px rgba(0, 0, 0, 0.3);
      }

      .coin::after {
        content: '$';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        font-weight: bold;
        color: #996600;
      }

      @keyframes coinDrop {
        0% { top: -30px; opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { top: 40px; opacity: 0; }
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

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .attract-main-title {
          font-size: clamp(1.8rem, 8vw, 3rem);
        }

        .attract-action {
          padding: 1.5rem 2rem;
        }

        .attract-action-wrapper {
          flex-direction: column;
          gap: 1rem;
        }

        .attract-icon {
          width: 40px;
          height: 40px;
        }

        .attract-button-text {
          font-size: 1.8rem;
        }

        .attract-corner {
          width: 50px;
          height: 50px;
        }

        .attract-arcade-text {
          display: none;
        }

        .attract-vortex {
          width: 300px;
          height: 300px;
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

    // Dessiner les formes
    this.shapes.forEach((shape) => {
      shape.x += shape.speedX;
      shape.y += shape.speedY;
      shape.rotation += shape.rotationSpeed;

      // Rebondir sur les bords
      if (shape.x < 0 || shape.x > this.canvas.width) shape.speedX *= -1;
      if (shape.y < 0 || shape.y > this.canvas.height) shape.speedY *= -1;

      this.drawShape(shape);
    });

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
