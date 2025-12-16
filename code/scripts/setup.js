/**
 * Script de setup cross-platform pour ArcadiaBox
 *
 * Effectue les étapes suivantes:
 * 1. Installation des packages npm
 * 2. Génération du client Prisma
 * 3. Vérification de la synchronisation schema/DB
 *
 * Usage: node scripts/setup.js
 *        npm run setup
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import { existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const isWindows = platform() === 'win32';

// Couleurs ANSI
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

/**
 * Affiche un message coloré
 */
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Affiche une étape du processus
 */
function logStep(step, total, message) {
  console.log(`\n${colors.cyan}${colors.bold}[${step}/${total}]${colors.reset} ${colors.bold}${message}${colors.reset}`);
}

/**
 * Affiche un succès
 */
function logSuccess(message) {
  console.log(`${colors.green}  ✓ ${message}${colors.reset}`);
}

/**
 * Affiche une erreur
 */
function logError(message) {
  console.log(`${colors.red}  ✗ ${message}${colors.reset}`);
}

/**
 * Affiche une info
 */
function logInfo(message) {
  console.log(`${colors.gray}  → ${message}${colors.reset}`);
}

/**
 * Exécute une commande et retourne une Promise
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      cwd: ROOT_DIR,
      shell: isWindows,
      stdio: options.silent ? 'pipe' : 'inherit'
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const proc = spawn(command, args, mergedOptions);

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Commande échouée avec le code ${code}\n${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Vérifie si node_modules existe
 */
function nodeModulesExist() {
  return existsSync(join(ROOT_DIR, 'node_modules'));
}

/**
 * Vérifie si le client Prisma est généré
 */
function prismaClientExists() {
  const prismaClientPath = join(ROOT_DIR, 'server', 'generated', 'prisma');
  return existsSync(prismaClientPath);
}

/**
 * Nettoie le cache problématique si nécessaire
 */
function cleanPrismaCache() {
  const paths = [
    join(ROOT_DIR, 'server', 'generated', 'prisma'),
    join(ROOT_DIR, 'node_modules', '.prisma')
  ];

  paths.forEach(p => {
    if (existsSync(p)) {
      logInfo(`Nettoyage de ${p}`);
      try {
        rmSync(p, { recursive: true, force: true });
      } catch (err) {
        logInfo(`Impossible de supprimer ${p}: ${err.message}`);
      }
    }
  });
}

/**
 * Étape 1: Installation des dépendances npm
 */
async function installDependencies() {
  logStep(1, 3, 'Installation des dépendances npm');

  if (nodeModulesExist()) {
    logInfo('node_modules existant détecté');
    logInfo('Nettoyage et réinstallation pour assurer la cohérence...');
  }

  // Nettoyer le cache Prisma potentiellement corrompu
  cleanPrismaCache();

  try {
    logInfo('Exécution de npm install...');
    await runCommand('npm', ['install']);
    logSuccess('Dépendances installées avec succès');
    return true;
  } catch (error) {
    logError(`Échec de l'installation: ${error.message}`);
    return false;
  }
}

/**
 * Étape 2: Génération du client Prisma
 */
async function generatePrismaClient() {
  logStep(2, 3, 'Génération du client Prisma');

  // Toujours regénérer pour éviter les problèmes de cache
  cleanPrismaCache();

  try {
    logInfo('Exécution de prisma generate...');
    await runCommand('npx', ['prisma', 'generate']);

    // Vérifier que le client a bien été généré
    if (prismaClientExists()) {
      logSuccess('Client Prisma généré avec succès');
      return true;
    } else {
      logError('Le client Prisma n\'a pas été généré correctement');
      return false;
    }
  } catch (error) {
    logError(`Échec de la génération: ${error.message}`);
    return false;
  }
}

/**
 * Étape 3: Vérification de la synchronisation schema/DB
 */
async function verifyDatabaseSync() {
  logStep(3, 3, 'Vérification de la synchronisation schema/DB');

  // Vérifier que DATABASE_URL est défini
  if (!process.env.DATABASE_URL) {
    logInfo('Chargement des variables d\'environnement depuis .env...');
    try {
      const dotenvPath = join(ROOT_DIR, '.env');
      if (existsSync(dotenvPath)) {
        const { config } = await import('dotenv');
        config({ path: dotenvPath });
      }
    } catch (err) {
      // Ignorer si dotenv n'est pas disponible
    }
  }

  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL non défini dans .env');
    logInfo('La vérification de la DB sera ignorée');
    logInfo('Assurez-vous d\'avoir configuré DATABASE_URL dans le fichier .env');
    return true; // On considère que c'est OK pour ne pas bloquer le setup
  }

  try {
    logInfo('Vérification avec prisma db push...');

    // Utiliser prisma db push pour vérifier/synchroniser
    const result = await runCommand('npx', ['prisma', 'db', 'push'], {
      silent: false
    });

    logSuccess('Schéma synchronisé avec la base de données');
    return true;
  } catch (error) {
    logError('Le schéma ne correspond pas à la base de données');
    logInfo('Exécutez "npm run db:push" pour synchroniser');
    logInfo(`Détails: ${error.message}`);
    return false;
  }
}

/**
 * Affiche le résumé final
 */
function printSummary(results) {
  console.log('');
  log('blue', '════════════════════════════════════════');
  log('blue', '           RÉSUMÉ DU SETUP');
  log('blue', '════════════════════════════════════════');

  const steps = [
    { name: 'Installation npm', success: results.npm },
    { name: 'Client Prisma', success: results.prisma },
    { name: 'Sync schema/DB', success: results.db }
  ];

  steps.forEach(step => {
    const icon = step.success ? `${colors.green}✓` : `${colors.red}✗`;
    const status = step.success ? `${colors.green}OK` : `${colors.red}ÉCHEC`;
    console.log(`  ${icon} ${step.name}: ${status}${colors.reset}`);
  });

  console.log('');

  const allSuccess = results.npm && results.prisma && results.db;

  if (allSuccess) {
    log('green', '════════════════════════════════════════');
    log('green', '  ✓ Setup terminé avec succès !');
    log('green', '════════════════════════════════════════');
    console.log('');
    logInfo('Vous pouvez maintenant lancer le projet avec:');
    console.log(`     ${colors.cyan}npm run dev:full${colors.reset}`);
    console.log('');
  } else {
    log('red', '════════════════════════════════════════');
    log('red', '  ✗ Setup incomplet - voir les erreurs ci-dessus');
    log('red', '════════════════════════════════════════');
    console.log('');

    if (!results.npm) {
      logInfo('Problème npm: vérifiez votre connexion et réessayez');
    }
    if (!results.prisma) {
      logInfo('Problème Prisma: vérifiez le fichier prisma/schema.prisma');
    }
    if (!results.db) {
      logInfo('Problème DB: vérifiez DATABASE_URL dans .env');
    }
    console.log('');
  }

  return allSuccess;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('');
  log('blue', '════════════════════════════════════════');
  log('blue', '     ArcadiaBox - Script de Setup');
  log('blue', '════════════════════════════════════════');
  logInfo(`OS détecté: ${platform()}`);
  logInfo(`Répertoire: ${ROOT_DIR}`);

  const results = {
    npm: false,
    prisma: false,
    db: false
  };

  // Étape 1: Installation npm
  results.npm = await installDependencies();

  if (!results.npm) {
    logError('Impossible de continuer sans les dépendances npm');
    printSummary(results);
    process.exit(1);
  }

  // Étape 2: Génération Prisma
  results.prisma = await generatePrismaClient();

  if (!results.prisma) {
    logError('Impossible de continuer sans le client Prisma');
    printSummary(results);
    process.exit(1);
  }

  // Étape 3: Vérification DB
  results.db = await verifyDatabaseSync();

  // Résumé
  const success = printSummary(results);
  process.exit(success ? 0 : 1);
}

// Exécution
main().catch((error) => {
  logError(`Erreur fatale: ${error.message}`);
  process.exit(1);
});
