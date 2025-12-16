import { defineConfig } from 'vite';

/**
 * Configuration Vite pour ArcadiaBox
 *
 * Configuration optimisée pour :
 * - Développement rapide avec HMR
 * - Build de production pour Raspberry Pi
 * - Support de Phaser et Alpine.js
 */
export default defineConfig({
  // Dossier public pour les assets statiques
  publicDir: 'public',

  // Configuration du serveur de développement
  server: {
    port: 3000,
    host: true, // Permet l'accès depuis d'autres appareils du réseau
    open: true, // Ouvre automatiquement le navigateur
    // Proxy pour rediriger les requêtes API vers le serveur Express
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Configuration du build de production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Optimisation pour Raspberry Pi
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Garde les logs pour debug
      },
    },
    // Taille des chunks pour un meilleur cache
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'alpine': ['alpinejs'],
        },
      },
    },
  },

  // Optimisation des dépendances
  optimizeDeps: {
    include: ['phaser', 'alpinejs'],
  },
});
