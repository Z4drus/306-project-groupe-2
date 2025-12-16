/**
 * Client Prisma pour la connexion à la base de données PostgreSQL (Neon)
 *
 * Utilise pg (node-postgres) avec l'adaptateur Prisma - compatible avec Neon
 */

// Charger dotenv en premier pour s'assurer que DATABASE_URL est disponible
import 'dotenv/config';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Please add DATABASE_URL to your .env file');
  process.exit(1);
}

console.log('[Prisma] Connexion à la base de données...');

// Créer un pool de connexion PostgreSQL standard
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Créer l'adaptateur Prisma pour pg
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
