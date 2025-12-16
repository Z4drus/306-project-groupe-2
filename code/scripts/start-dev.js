/**
 * Script de démarrage dev cross-platform pour ArcadiaBox
 *
 * Lance le frontend (Vite) et le backend (Express) simultanément.
 * Vérifie les prérequis avant de démarrer.
 *
 * Usage: npm run dev:full
 */

import { spawn, exec } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const isWindows = platform() === 'win32';

// Configuration des ports
const BACKEND_PORT = 8080;
const FRONTEND_PORT = 3000;

// Couleurs ANSI
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

let backendProcess = null;
let frontendProcess = null;

/**
 * Vérifie si le client Prisma est généré
 */
function checkPrismaClient() {
  const prismaPath = join(ROOT_DIR, 'server', 'generated', 'prisma');
  return existsSync(prismaPath);
}

/**
 * Vérifie si node_modules existe
 */
function checkNodeModules() {
  return existsSync(join(ROOT_DIR, 'node_modules'));
}

/**
 * Tue un processus sur un port donné
 */
function killPort(port) {
  return new Promise((resolve) => {
    if (isWindows) {
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          lines.forEach(line => {
            const match = line.match(/LISTENING\s+(\d+)/);
            if (match) pids.add(match[1]);
          });
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, () => {});
          });
        }
        setTimeout(resolve, 300);
      });
    } else {
      exec(`lsof -ti:${port}`, (err, stdout) => {
        if (stdout) {
          exec(`kill -9 ${stdout.trim().split('\n').join(' ')}`, () => {});
        }
        setTimeout(resolve, 300);
      });
    }
  });
}

/**
 * Attend qu'un port soit disponible
 */
function waitForPort(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const cmd = isWindows
        ? `netstat -ano | findstr :${port} | findstr LISTENING`
        : `lsof -i:${port} | grep LISTEN`;

      exec(cmd, (err, stdout) => {
        if (stdout && stdout.trim()) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          reject(new Error(`Timeout: port ${port} non disponible`));
        } else {
          setTimeout(check, 500);
        }
      });
    };

    check();
  });
}

/**
 * Lance le backend Express
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log(`${c.cyan}[backend]${c.reset} Démarrage sur port ${BACKEND_PORT}...`);

    backendProcess = spawn('node', ['--experimental-strip-types', 'server/index.js'], {
      cwd: ROOT_DIR,
      shell: isWindows,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let started = false;
    let errorOutput = '';

    backendProcess.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(`${c.gray}${text}${c.reset}`);

      // Détecte le message de démarrage réussi
      if (text.includes('Serveur démarré') || text.includes('ArcadiaBox Server')) {
        started = true;
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(`${c.red}[backend] ${data}${c.reset}`);
    });

    backendProcess.on('error', (err) => {
      reject(new Error(`Erreur backend: ${err.message}`));
    });

    backendProcess.on('close', (code) => {
      if (!started && code !== 0) {
        reject(new Error(`Backend crash (code ${code})\n${errorOutput}`));
      }
    });

    // Timeout de sécurité
    setTimeout(() => {
      if (!started) {
        reject(new Error('Timeout: le backend n\'a pas démarré'));
      }
    }, 15000);
  });
}

/**
 * Lance le frontend Vite
 */
function startFrontend() {
  console.log(`${c.cyan}[frontend]${c.reset} Démarrage Vite sur port ${FRONTEND_PORT}...`);

  frontendProcess = spawn('npx', ['vite', '--host', '--port', String(FRONTEND_PORT)], {
    cwd: ROOT_DIR,
    shell: isWindows,
    stdio: 'inherit'
  });

  frontendProcess.on('error', (err) => {
    console.error(`${c.red}Erreur frontend: ${err.message}${c.reset}`);
  });
}

/**
 * Nettoie les processus à la fermeture
 */
function cleanup() {
  console.log(`\n${c.yellow}Arrêt des serveurs...${c.reset}`);

  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }

  Promise.all([
    killPort(BACKEND_PORT),
    killPort(FRONTEND_PORT)
  ]).then(() => {
    console.log(`${c.green}Serveurs arrêtés.${c.reset}`);
    process.exit(0);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('');
  console.log(`${c.blue}${c.bold}══════════════════════════════════════${c.reset}`);
  console.log(`${c.blue}${c.bold}     ArcadiaBox - Mode Développement${c.reset}`);
  console.log(`${c.blue}${c.bold}══════════════════════════════════════${c.reset}`);
  console.log('');

  // Vérification des prérequis
  console.log(`${c.cyan}[check]${c.reset} Vérification des prérequis...`);

  if (!checkNodeModules()) {
    console.error(`${c.red}✗ node_modules manquant${c.reset}`);
    console.log(`  Exécutez d'abord: ${c.cyan}npm run setup${c.reset}`);
    process.exit(1);
  }
  console.log(`${c.green}✓${c.reset} node_modules OK`);

  if (!checkPrismaClient()) {
    console.error(`${c.red}✗ Client Prisma non généré${c.reset}`);
    console.log(`  Exécutez d'abord: ${c.cyan}npm run setup${c.reset}`);
    process.exit(1);
  }
  console.log(`${c.green}✓${c.reset} Client Prisma OK`);

  // Libération des ports
  console.log('');
  console.log(`${c.cyan}[ports]${c.reset} Libération des ports...`);
  await killPort(BACKEND_PORT);
  await killPort(FRONTEND_PORT);
  console.log(`${c.green}✓${c.reset} Ports libérés`);

  // Lancement du backend
  console.log('');
  try {
    await startBackend();
    console.log(`${c.green}✓ Backend prêt sur http://localhost:${BACKEND_PORT}${c.reset}`);
  } catch (error) {
    console.error(`${c.red}✗ ${error.message}${c.reset}`);
    console.log('');
    console.log(`${c.yellow}Vérifiez:${c.reset}`);
    console.log(`  - Le fichier .env contient DATABASE_URL`);
    console.log(`  - Exécutez: ${c.cyan}npm run setup${c.reset}`);
    process.exit(1);
  }

  // Lancement du frontend
  console.log('');
  console.log(`${c.blue}══════════════════════════════════════${c.reset}`);
  console.log(`${c.green}${c.bold}  ArcadiaBox prêt !${c.reset}`);
  console.log(`${c.blue}══════════════════════════════════════${c.reset}`);
  console.log(`  Backend:  ${c.cyan}http://localhost:${BACKEND_PORT}${c.reset}`);
  console.log(`  Frontend: ${c.cyan}http://localhost:${FRONTEND_PORT}${c.reset}`);
  console.log(`${c.blue}══════════════════════════════════════${c.reset}`);
  console.log('');
  console.log(`${c.gray}Ctrl+C pour arrêter${c.reset}`);
  console.log('');

  startFrontend();
}

main().catch((error) => {
  console.error(`${c.red}Erreur fatale: ${error.message}${c.reset}`);
  cleanup();
});
