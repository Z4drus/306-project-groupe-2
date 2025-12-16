/**
 * Script de demarrage cross-platform pour ArcadiaBox
 * Detecte automatiquement l'OS et lance le frontend + backend
 *
 * Usage: node scripts/start-dev.js
 *        npm run dev:full
 */

import { spawn, exec } from 'child_process';
import { platform } from 'os';
import { createInterface } from 'readline';

// Couleurs ANSI
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  console.log(`${colors.cyan}[${step}/${total}]${colors.reset} ${message}`);
}

// Afficher le header
console.log('');
log('blue', '========================================');
log('blue', '   ArcadiaBox - Demarrage Dev');
log('blue', '========================================');
console.log('');

const isWindows = platform() === 'win32';
let serverProcess = null;
let viteProcess = null;

// Fonction pour tuer un processus sur un port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (isWindows) {
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          lines.forEach(line => {
            const match = line.match(/LISTENING\s+(\d+)/);
            if (match) {
              exec(`taskkill /F /PID ${match[1]}`, () => {});
            }
          });
        }
        setTimeout(resolve, 500);
      });
    } else {
      exec(`lsof -ti:${port}`, (err, stdout) => {
        if (stdout) {
          exec(`kill -9 ${stdout.trim()}`, () => {});
        }
        setTimeout(resolve, 500);
      });
    }
  });
}

// Fonction pour verifier si un port est utilise
function isPortInUse(port) {
  return new Promise((resolve) => {
    if (isWindows) {
      exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (err, stdout) => {
        resolve(!!stdout);
      });
    } else {
      exec(`lsof -i:${port}`, (err, stdout) => {
        resolve(!!stdout);
      });
    }
  });
}

// Fonction pour attendre
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Cleanup a la fermeture
function cleanup() {
  console.log('');
  log('yellow', 'Arret des serveurs...');

  if (serverProcess) {
    serverProcess.kill();
  }
  if (viteProcess) {
    viteProcess.kill();
  }

  // Tuer les processus sur les ports
  Promise.all([
    killProcessOnPort(8080),
    killProcessOnPort(3000)
  ]).then(() => {
    log('green', 'Serveurs arretes.');
    process.exit(0);
  });
}

// Gerer les signaux de fermeture
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

async function main() {
  try {
    // Etape 1: Nettoyer les ports
    logStep(1, 4, 'Verification des ports...');

    if (await isPortInUse(8080)) {
      log('yellow', 'Port 8080 utilise, arret du processus...');
      await killProcessOnPort(8080);
    }

    if (await isPortInUse(3000)) {
      log('yellow', 'Port 3000 utilise, arret du processus...');
      await killProcessOnPort(3000);
    }

    // Etape 2: Demarrer le backend
    logStep(2, 4, 'Demarrage du serveur backend...');

    serverProcess = spawn('node', ['--experimental-strip-types', 'server/index.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWindows
    });

    serverProcess.stdout.on('data', (data) => {
      process.stdout.write(`${colors.gray}[backend] ${data}${colors.reset}`);
    });

    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(`${colors.red}[backend] ${data}${colors.reset}`);
    });

    serverProcess.on('error', (err) => {
      log('red', `Erreur backend: ${err.message}`);
    });

    // Etape 3: Attendre le serveur
    logStep(3, 4, 'Attente du serveur...');
    await sleep(3000);

    if (await isPortInUse(8080)) {
      log('green', '✓ Serveur backend pret sur http://localhost:8080');
    } else {
      log('yellow', '⚠ Le serveur met du temps a demarrer...');
    }

    // Etape 4: Demarrer Vite
    logStep(4, 4, 'Demarrage du frontend Vite...');
    console.log('');
    log('green', '========================================');
    log('green', '   ✓ ArcadiaBox pret !');
    log('green', '========================================');
    console.log(`   Backend:  ${colors.blue}http://localhost:8080${colors.reset}`);
    console.log(`   Frontend: ${colors.blue}http://localhost:3000${colors.reset}`);
    log('green', '========================================');
    console.log('');
    log('gray', 'Appuyez sur Ctrl+C pour arreter les serveurs');
    console.log('');

    // Lancer Vite
    viteProcess = spawn('npx', ['vite', '--host'], {
      stdio: 'inherit',
      shell: isWindows
    });

    viteProcess.on('close', (code) => {
      if (code !== null) {
        cleanup();
      }
    });

  } catch (error) {
    log('red', `Erreur: ${error.message}`);
    cleanup();
  }
}

main();
